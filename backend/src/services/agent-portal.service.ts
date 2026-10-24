import mongoose from 'mongoose';
import { User } from '../models/user.model';
import { Commission } from '../models/commission.model';
import { Order } from '../models/order.model';
import { settingsService } from './settings.service';
import { withdrawalService } from './withdrawal.service';

/**
 * Data for the agent mobile app. Agents only see their own commissions and the orders that earned them;
 * customer details and order values are never returned.
 */

// paid: settled · requested: in a pending withdrawal · available: order delivered, can be withdrawn ·
// awaiting_delivery: earned, but the order isn't delivered yet
export type PayoutStage = 'paid' | 'requested' | 'available' | 'awaiting_delivery';

export interface AgentCommissionEntry {
  id: string;
  orderNumber: string;
  orderDate: string | null;
  orderStatus: string | null; // pending | processing | dispatched | delivered | cancelled (null if the order record is gone)
  items: { name: string; quantity: number }[];
  totalBags: number;
  commissionType: 'percent' | 'per_bag';
  commissionRate: number;
  commissionEarned: number;
  payoutStage: PayoutStage;
  paidAt: string | null;
  createdAt: string;
}

function createHttpError(statusCode: number, message: string): Error & { statusCode: number } {
  return Object.assign(new Error(message), { statusCode });
}

export class AgentPortalService {
  private async getAgent(agentId: string) {
    if (!mongoose.Types.ObjectId.isValid(agentId)) throw createHttpError(401, 'Please sign in again.');
    const agent = await User.findOne({ _id: agentId, role: 'agent' });
    if (!agent) throw createHttpError(403, 'This account is not a field agent.');
    return agent;
  }

  /**
   * Commission ledger for the agent, newest first, joined with the order for status, date and items
   */
  async getCommissions(agentId: string): Promise<AgentCommissionEntry[]> {
    const agent = await this.getAgent(agentId);
    const commissions = await Commission.find({ agentId: agent._id }).sort({ createdAt: -1 });
    const orderNumbers = commissions.map((c) => c.orderId).filter(Boolean);
    const orders = await Order.find(
      { orderNumber: { $in: orderNumbers } },
      { orderNumber: 1, orderStatus: 1, createdAt: 1, items: 1 } // deliberately no shippingAddress / user / amounts
    );
    const orderByNumber = new Map(orders.map((o) => [o.orderNumber, o]));

    return commissions.map((c) => {
      const order = c.orderId ? orderByNumber.get(c.orderId) : undefined;
      const items = (order?.items || []).map((i: any) => ({ name: i.name, quantity: i.quantity }));
      const payoutStage: PayoutStage =
        c.status === 'Paid' ? 'paid' : c.withdrawalId ? 'requested' : order?.orderStatus === 'delivered' ? 'available' : 'awaiting_delivery';
      return {
        id: c._id.toString(),
        orderNumber: c.orderId || '',
        orderDate: order?.createdAt ? order.createdAt.toISOString() : null,
        orderStatus: order?.orderStatus || null,
        items,
        totalBags: c.totalBags || items.reduce((sum, i) => sum + (i.quantity || 0), 0),
        commissionType: (c as any).commissionType === 'per_bag' ? 'per_bag' : 'percent',
        commissionRate: c.commissionRate,
        commissionEarned: c.commissionEarned,
        payoutStage,
        paidAt: c.paidAt ? c.paidAt.toISOString() : null,
        createdAt: c.createdAt.toISOString(),
      };
    });
  }

  /**
   * Agent profile, commission rule, earnings totals, withdrawal state and the most recent commissions
   */
  async getOverview(agentId: string) {
    const agent = await this.getAgent(agentId);
    const [entries, commissionRule, withdrawals] = await Promise.all([
      this.getCommissions(agentId),
      settingsService.getCommissionSettings(),
      withdrawalService.listForAgent(agentId),
    ]);

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const totals = {
      totalEarned: 0,
      paid: 0,
      available: 0,
      requested: 0,
      awaitingDelivery: 0,
      thisMonth: 0,
      orders: entries.length,
      bags: 0,
    };
    for (const e of entries) {
      totals.totalEarned += e.commissionEarned;
      if (e.payoutStage === 'paid') totals.paid += e.commissionEarned;
      if (e.payoutStage === 'available') totals.available += e.commissionEarned;
      if (e.payoutStage === 'requested') totals.requested += e.commissionEarned;
      if (e.payoutStage === 'awaiting_delivery') totals.awaitingDelivery += e.commissionEarned;
      if (new Date(e.createdAt) >= monthStart) totals.thisMonth += e.commissionEarned;
      totals.bags += e.totalBags;
    }

    return {
      agent: {
        fullName: agent.fullName,
        email: agent.email,
        phone: agent.phone,
        city: agent.city || '',
        agentRole: agent.agentRole || 'Field Sales Agent',
        memberSince: agent.createdAt,
      },
      commissionRule,
      totals,
      pendingWithdrawal: withdrawals.find((w) => w.status === 'Pending') || null,
      recent: entries.slice(0, 5),
    };
  }
}

export const agentPortalService = new AgentPortalService();
