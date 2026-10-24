import { Router, Request, Response, NextFunction } from 'express';
import { adminAgentService } from '../services/admin-agent.service';
import { authenticateJwt, authorizeAdmin } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateJwt, authorizeAdmin);

// GET /api/admin/agents/stats - Summary KPI metrics for Agent Management
router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await adminAgentService.getStats();
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/agents - List all field agents with query filters
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, city, status } = req.query as { search?: string; city?: string; status?: string };
    const agents = await adminAgentService.getAgents({ search, city, status });
    res.status(200).json({ success: true, data: agents });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/agents - Create a new field agent
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const agent = await adminAgentService.createAgent(req.body);
    res.status(201).json({ success: true, message: 'Field agent added successfully', data: agent });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/admin/agents/:id - Update agent details/status
router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const agent = await adminAgentService.updateAgent(req.params.id, req.body);
    res.status(200).json({ success: true, message: 'Agent updated successfully', data: agent });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/admin/agents/:id - Delete an agent
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await adminAgentService.deleteAgent(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/agents/leads - All agent customer leads
router.get('/leads', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, status, location } = req.query as { search?: string; status?: string; location?: string };
    const leads = await adminAgentService.getAllLeads({ search, status, location });
    res.status(200).json({ success: true, data: leads });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/admin/agents/leads/:id/status - Update customer lead pipeline status
router.patch('/leads/:id/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;
    const lead = await adminAgentService.updateLeadStatus(req.params.id, status);
    res.status(200).json({ success: true, message: 'Lead status updated', data: lead });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/agents/commissions - All commission payout records
router.get('/commissions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.query as { status?: string };
    const commissions = await adminAgentService.getAllCommissions({ status });
    res.status(200).json({ success: true, data: commissions });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/admin/agents/commissions/:id/status - Approve & mark commission Paid
router.patch('/commissions/:id/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;
    const commission = await adminAgentService.updateCommissionStatus(req.params.id, status);
    res.status(200).json({ success: true, message: 'Commission status updated', data: commission });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/agents/locations - All Tamil Nadu field hubs
router.get('/locations', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const locations = await adminAgentService.getLocations();
    res.status(200).json({ success: true, data: locations });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/agents/:id - Agent profile, commission totals and recent commissions
// (declared last so it doesn't capture /stats, /leads, /commissions or /locations)
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const agent = await adminAgentService.getAgentDetails(req.params.id);
    res.status(200).json({ success: true, data: agent });
  } catch (error) {
    next(error);
  }
});

export default router;
