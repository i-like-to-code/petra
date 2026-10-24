import { Router } from 'express';
import { paymentService } from '../services/payment.service';
import { authenticateJwt, authorizeAdmin } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticateJwt, authorizeAdmin);

router.get('/', async (req, res, next) => {
  try {
    const payments = await paymentService.getAllPayments();
    res.json({ success: true, data: payments });
  } catch (err: any) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const payment = await paymentService.createPayment(req.body);
    res.status(201).json({ success: true, data: payment });
  } catch (err: any) {
    next(err);
  }
});

router.put('/:id/status', async (req, res, next) => {
  try {
    const payment = await paymentService.updatePaymentStatus(req.params.id, req.body.status);
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    res.json({ success: true, data: payment });
  } catch (err: any) {
    next(err);
  }
});

export default router;
