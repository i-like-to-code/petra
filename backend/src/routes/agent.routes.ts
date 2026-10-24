import { Router, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types/auth.types';
import { authenticateJwt, authorizeRoles } from '../middleware/auth.middleware';
import { agentPortalService } from '../services/agent-portal.service';
import { withdrawalService } from '../services/withdrawal.service';

/**
 * Agent mobile app API: /api/agent
 * Agents see only their own commissions and the orders that earned them (no customer details or order values).
 */
const router = Router();
router.use(authenticateJwt, authorizeRoles('agent'));

function handleError(error: any, res: Response, next: NextFunction) {
  if (error?.statusCode) {
    res.status(error.statusCode).json({ success: false, message: error.message });
    return;
  }
  next(error);
}

/**
 * @route   GET /api/agent/overview
 * @desc    Agent profile, commission rule, earnings totals, pending withdrawal and recent commissions
 */
router.get('/overview', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const data = await agentPortalService.getOverview(req.user!.id);
    res.status(200).json({ success: true, data });
  } catch (error) {
    handleError(error, res, next);
  }
});

/**
 * @route   GET /api/agent/commissions
 * @desc    Commission ledger: one entry per order that earned the agent commission
 */
router.get('/commissions', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const data = await agentPortalService.getCommissions(req.user!.id);
    res.status(200).json({ success: true, data });
  } catch (error) {
    handleError(error, res, next);
  }
});

/**
 * @route   GET /api/agent/withdrawals
 * @desc    The agent's withdrawal requests, newest first
 */
router.get('/withdrawals', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const data = await withdrawalService.listForAgent(req.user!.id);
    res.status(200).json({ success: true, data });
  } catch (error) {
    handleError(error, res, next);
  }
});

/**
 * @route   POST /api/agent/withdrawals
 * @desc    Request a payout of all commission available (orders delivered) — reviewed by the admin
 */
router.post('/withdrawals', async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const data = await withdrawalService.createRequest(req.user!.id);
    res.status(201).json({ success: true, message: 'Withdrawal requested.', data });
  } catch (error) {
    handleError(error, res, next);
  }
});

export default router;
