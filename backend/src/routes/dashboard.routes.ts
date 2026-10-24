import { Router } from 'express';
import { Order } from '../models/order.model';
import { Product } from '../models/product.model';
import { Customer } from '../models/customer.model';
import { Payment } from '../models/payment.model';
import { Brand } from '../models/brand.model';
import { authenticateJwt, authorizeAdmin } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticateJwt, authorizeAdmin);

router.get('/stats', async (req, res, next) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [totalOrders, totalProducts, totalCustomers, payments, todaysOrders] = await Promise.all([
      Order.countDocuments(),
      Product.countDocuments({ status: 'active' }),
      Customer.countDocuments({ status: 'Active' }),
      Payment.find(),
      Order.find({ createdAt: { $gte: startOfToday }, orderStatus: { $ne: 'cancelled' } }, { totalAmount: 1 }),
    ]);

    let paidTotal = 0;
    let pendingTotal = 0;
    let settledCount = 0;
    for (const p of payments) {
      if (p.status === 'Paid') {
        paidTotal += p.numericAmount;
        settledCount++;
      }
      if (p.status === 'Pending') pendingTotal += p.numericAmount;
    }
    const todaySales = todaysOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
    const formatINR = (n: number) => '\u20B9' + Math.round(n).toLocaleString('en-IN');

    // All figures are computed from real records; zero when there is no data
    res.json({
      success: true,
      data: {
        todaySales: formatINR(todaySales),
        totalOrders,
        activeCustomers: totalCustomers,
        totalProducts,
        pendingInvoices: formatINR(pendingTotal),
        paidCollections: formatINR(paidTotal),
        settlementRate: payments.length ? `${((settledCount / payments.length) * 100).toFixed(1)}%` : '0%',
      },
    });
  } catch (err: any) {
    next(err);
  }
});

router.get('/reports', async (req, res, next) => {
  try {
    const [brands, products, orders] = await Promise.all([
      Brand.find(),
      Product.find(),
      Order.find(),
    ]);

    const brandStats = brands.map((b) => {
      const bProds = products.filter((p) => p.brandId === b.id || (p.brand && p.brand.includes(b.name)));
      return {
        brandId: b.id,
        name: b.name,
        productCount: bProds.length,
        active: b.active,
        color: b.brandColor || '#dc2626',
      };
    });

    res.json({
      success: true,
      data: {
        brandStats,
        totalProducts: products.length,
        totalOrders: orders.length,
        reportDate: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    next(err);
  }
});

export default router;
