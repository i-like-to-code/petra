import mongoose from 'mongoose';
import { Commission } from '../models/commission.model';
import { Order } from '../models/order.model';
import { User } from '../models/user.model';
import { Withdrawal, IWithdrawal } from '../models/withdrawal.model';

function createHttpError(statusCode: number, message: string): Error & { statusCode: number } {
  return Object.assign(new Error(message), { statusCode });
}

const roundMoney = (n: number) => Math.round(n * 100) / 100;

/**
 * Agent commission payouts.
 * Commission can be withdrawn once its order is delivered; a request locks those commissions until the
 * admin approves (commissions become Paid) or rejects (commissions are released for a future request).
 */
export class WithdrawalService {
  /**
   * Unpaid, unlocked commissions whose order has been delivered
   */
  async getAvailableCommissions(agentId: mongoose.Types.ObjectId | string) {
    const candidates = await Commission.find({ agentId, status: 'Pending', withdrawalId: null });
    const orderNumbers = candidates.map((c) => c.orderId).filter(Boolean);
    const delivered = await Order.find({ orderNumber: { $in: orderNumbers }, orderStatus: 'delivered' }, { orderNumber: 1 });
    const deliveredSet = new Set(delivered.map((o) => o.orderNumber));
    return candidates.filter((c) => c.orderId && deliveredSet.has(c.orderId));
  }

  async createRequest(agentId: string) {
    const agent = await User.findOne({ _id: agentId, role: 'agent' });
    if (!agent) throw createHttpError(403, 'This account is not a field agent.');

    if (await Withdrawal.exists({ agentId: agent._id, status: 'Pending' })) {
      throw createHttpError(409, 'You already have a withdrawal request waiting for approval.');
    }

    const available = await this.getAvailableCommissions(agent._id);
    const amount = roundMoney(available.reduce((sum, c) => sum + c.commissionEarned, 0));
    if (available.length === 0 || amount <= 0) {
      throw createHttpError(400, 'There is no commission available to withdraw yet. Commission becomes available once the order is delivered.');
    }

    const withdrawal = await Withdrawal.create({
      agentId: agent._id,
      amount,
      commissionIds: available.map((c) => c._id),
      status: 'Pending',
    });

    // Lock only commissions that are still free (guards against a concurrent request)
    const locked = await Commission.updateMany(
      { _id: { $in: withdrawal.commissionIds }, status: 'Pending', withdrawalId: null },
      { withdrawalId: withdrawal._id }
    );
    if (locked.modifiedCount !== withdrawal.commissionIds.length) {
      await Commission.updateMany({ withdrawalId: withdrawal._id }, { withdrawalId: null });
      await withdrawal.deleteOne();
      throw createHttpError(409, 'Your balance just changed. Please try again.');
    }

    return this.sanitizeForAgent(withdrawal);
  }

  async listForAgent(agentId: string) {
    const list = await Withdrawal.find({ agentId }).sort({ createdAt: -1 });
    return list.map((w) => this.sanitizeForAgent(w));
  }

  async listForAdmin(status?: string) {
    const query: any = {};
    if (status === 'Pending' || status === 'Approved' || status === 'Rejected') query.status = status;
    const list = await Withdrawal.find(query).populate('agentId', 'fullName email phone city').sort({ createdAt: -1 });
    return list.map((w: any) => ({
      id: w._id.toString(),
      agent: w.agentId
        ? { id: w.agentId._id.toString(), fullName: w.agentId.fullName, email: w.agentId.email, phone: w.agentId.phone, city: w.agentId.city || '' }
        : null,
      amount: w.amount,
      orderCount: w.commissionIds.length,
      status: w.status,
      payoutReference: w.payoutReference || '',
      adminNote: w.adminNote || '',
      createdAt: w.createdAt,
      processedAt: w.processedAt || null,
    }));
  }

  async approve(id: string, input: { payoutReference?: string; adminNote?: string }) {
    const withdrawal = await this.getPending(id);

    // Pay out the commissions that are still unpaid (one may have been settled individually meanwhile)
    const commissions = await Commission.find({ _id: { $in: withdrawal.commissionIds }, status: 'Pending' });
    if (commissions.length === 0) {
      throw createHttpError(409, 'All commissions in this request have already been paid or removed. Reject it instead.');
    }
    const paidAt = new Date();
    await Commission.updateMany(
      { _id: { $in: commissions.map((c) => c._id) } },
      { status: 'Paid', paidAt, withdrawalId: withdrawal._id }
    );

    withdrawal.amount = roundMoney(commissions.reduce((sum, c) => sum + c.commissionEarned, 0));
    withdrawal.status = 'Approved';
    withdrawal.payoutReference = (input.payoutReference || '').trim();
    withdrawal.adminNote = (input.adminNote || '').trim();
    withdrawal.processedAt = paidAt;
    await withdrawal.save();
    return withdrawal;
  }

  async reject(id: string, input: { adminNote?: string }) {
    const reason = (input.adminNote || '').trim();
    if (!reason) throw createHttpError(400, 'Please give a reason so the agent knows why the request was rejected.');
    const withdrawal = await this.getPending(id);

    await Commission.updateMany({ withdrawalId: withdrawal._id, status: 'Pending' }, { withdrawalId: null });
    withdrawal.status = 'Rejected';
    withdrawal.adminNote = reason;
    withdrawal.processedAt = new Date();
    await withdrawal.save();
    return withdrawal;
  }

  private async getPending(id: string) {
    if (!mongoose.Types.ObjectId.isValid(id)) throw createHttpError(404, 'Withdrawal request not found.');
    const withdrawal = await Withdrawal.findById(id);
    if (!withdrawal) throw createHttpError(404, 'Withdrawal request not found.');
    if (withdrawal.status !== 'Pending') throw createHttpError(409, `This request was already ${withdrawal.status.toLowerCase()}.`);
    return withdrawal;
  }

  private sanitizeForAgent(w: IWithdrawal) {
    return {
      id: w._id.toString(),
      amount: w.amount,
      orderCount: w.commissionIds.length,
      status: w.status,
      payoutReference: w.payoutReference || '',
      adminNote: w.adminNote || '',
      createdAt: w.createdAt,
      processedAt: w.processedAt || null,
    };
  }
}

export const withdrawalService = new WithdrawalService();
