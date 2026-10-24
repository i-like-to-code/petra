import { Router, Request, Response, NextFunction } from 'express';
import { withdrawalService } from '../services/withdrawal.service';
import { authenticateJwt, authorizeAdmin } from '../middleware/auth.middleware';

/**
 * Admin review of agent withdrawal requests: /api/admin/withdrawals
 */
const router = Router();
router.use(authenticateJwt, authorizeAdmin);

function handleError(error: any, res: Response, next: NextFunction) {
  if (error?.statusCode) {
    res.status(error.statusCode).json({ success: false, message: error.message });
    return;
  }
  next(error);
}

// GET /api/admin/withdrawals?status=Pending|Approved|Rejected
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await withdrawalService.listForAdmin(String(req.query.status || ''));
    res.status(200).json({ success: true, data });
  } catch (error) {
    handleError(error, res, next);
  }
});

// PATCH /api/admin/withdrawals/:id - { status: 'Approved' | 'Rejected', payoutReference?, adminNote? }
router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, payoutReference, adminNote } = req.body || {};
    let result;
    if (status === 'Approved') {
      result = await withdrawalService.approve(req.params.id, { payoutReference, adminNote });
    } else if (status === 'Rejected') {
      result = await withdrawalService.reject(req.params.id, { adminNote });
    } else {
      res.status(400).json({ success: false, message: "Status must be 'Approved' or 'Rejected'." });
      return;
    }
    res.status(200).json({ success: true, message: `Withdrawal ${status.toLowerCase()}.`, data: { id: result._id.toString(), status: result.status, amount: result.amount } });
  } catch (error) {
    handleError(error, res, next);
  }
});

export default router;
