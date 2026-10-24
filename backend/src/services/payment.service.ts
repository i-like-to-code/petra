import { Payment, IPayment } from '../models/payment.model';
import { Order } from '../models/order.model';

export const INITIAL_PAYMENTS_SEED = [
  { initials: 'RK', name: 'Ravi Kumar', mode: 'UPI / NetBanking', date: '03 Oct', amount: '\u20B9142,500', numericAmount: 142500, status: 'Paid', referenceId: 'UPI-9840-7712' },
  { initials: 'SM', name: 'Sri Murugan Traders', mode: 'Bank NEFT', date: '01 Oct', amount: '\u20B9123,400', numericAmount: 123400, status: 'Pending', referenceId: 'NEFT-AXIS-2045' },
  { initials: 'AB', name: 'Arun Builders', mode: 'Cheque RTGS', date: '28 Sep', amount: '\u20B9179,000', numericAmount: 179000, status: 'Paid', referenceId: 'RTGS-HDFC-9912' },
  { initials: 'VH', name: 'Vel Hardware', mode: 'UPI', date: '28 Sep', amount: '\u20B9118,200', numericAmount: 118200, status: 'Failed', referenceId: 'UPI-FAIL-4402' },
];

export class PaymentService {
  async seedPaymentsIfNeeded(): Promise<void> {
    try {
      const count = await Payment.countDocuments();
      if (count === 0) {
        console.log('[PaymentService] Seeding initial 4 transaction records...');
        await Payment.insertMany(INITIAL_PAYMENTS_SEED);
        console.log('[PaymentService] Payment transactions seeded successfully.');
      }
    } catch (err: any) {
      console.error('[PaymentService] Seeding error:', err.message);
    }
  }

  async getAllPayments(): Promise<any[]> {
    // Synchronize all orders from users into Payment records
    try {
      const orders = await Order.find().sort({ createdAt: -1 });
      for (const ord of orders) {
        const orderNum = ord.orderNumber || (ord._id ? `PC-${ord._id.toString().slice(-5).toUpperCase()}` : '');
        if (!orderNum) continue;

        const existing = await Payment.findOne({ orderCode: orderNum });
        if (!existing) {
          const custName = (ord.shippingAddress && ord.shippingAddress.fullName) 
            || (ord.user && (ord.user as any).fullName) 
            || 'Direct Customer';
          const initials = custName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || 'CU';
          const modeMap: Record<string, string> = {
            online: 'UPI / NetBanking',
            upi: 'UPI Payments',
            bank_transfer: 'Bank NEFT',
            cod: 'Cash on Delivery (COD)',
            card: 'Credit / Debit Card',
          };
          const num = ord.totalAmount || 0;
          const statusVal = ord.paymentStatus === 'paid' ? 'Paid' : (ord.paymentStatus === 'failed' ? 'Failed' : 'Pending');
          const orderDate = ord.createdAt ? new Date(ord.createdAt) : new Date();
          const dateStr = orderDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });

          await Payment.create({
            name: custName,
            initials,
            mode: modeMap[ord.paymentMethod] || 'UPI / NetBanking',
            date: dateStr,
            amount: '\u20B9' + num.toLocaleString('en-IN'),
            numericAmount: num,
            status: statusVal,
            referenceId: `UPI-${orderNum.replace(/[^0-9]/g, '') || Math.floor(1000 + Math.random() * 9000)}`,
            orderCode: orderNum,
            createdAt: orderDate,
          });
        }
      }
    } catch (err: any) {
      console.warn('[PaymentService] Error syncing user orders to payments:', err.message);
    }

    const payments = await Payment.find().sort({ createdAt: -1 });
    return payments.map(p => ({
      id: p._id.toString(),
      _id: p._id.toString(),
      initials: p.initials,
      name: p.name,
      mode: p.mode,
      date: p.date,
      amount: p.amount,
      numericAmount: p.numericAmount,
      status: p.status,
      referenceId: p.referenceId || '',
      orderCode: p.orderCode || '',
      createdAt: p.createdAt,
    }));
  }

  async createPayment(data: any): Promise<any> {
    const initials = data.initials || data.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() || 'PM';
    const num = typeof data.amount === 'number' ? data.amount : parseInt(String(data.amount).replace(/[^0-9]/g, '')) || 0;
    const formattedAmount = String(data.amount).startsWith('\u20B9') ? data.amount : ('\u20B9' + num.toLocaleString('en-IN'));

    const payment = new Payment({
      name: data.name,
      initials,
      mode: data.mode || 'UPI / NetBanking',
      date: data.date || new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
      amount: formattedAmount,
      numericAmount: num,
      status: data.status || 'Paid',
      referenceId: data.referenceId || `TXN-${Date.now().toString().slice(-6)}`,
      orderCode: data.orderCode || '',
    });
    await payment.save();
    return {
      id: payment._id.toString(),
      _id: payment._id.toString(),
      initials: payment.initials,
      name: payment.name,
      mode: payment.mode,
      date: payment.date,
      amount: payment.amount,
      status: payment.status,
      referenceId: payment.referenceId,
      orderCode: payment.orderCode,
    };
  }

  async updatePaymentStatus(id: string, status: 'Paid' | 'Pending' | 'Failed'): Promise<any | null> {
    const payment = await Payment.findByIdAndUpdate(id, { status }, { new: true });
    if (!payment) return null;
    return {
      id: payment._id.toString(),
      _id: payment._id.toString(),
      initials: payment.initials,
      name: payment.name,
      mode: payment.mode,
      date: payment.date,
      amount: payment.amount,
      status: payment.status,
      orderCode: payment.orderCode,
    };
  }
}

export const paymentService = new PaymentService();
