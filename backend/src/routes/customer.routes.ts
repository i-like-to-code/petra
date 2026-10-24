import { Router } from 'express';
import { customerService } from '../services/customer.service';
import { authenticateJwt, authorizeAdmin } from '../middleware/auth.middleware';

const router = Router();
router.use(authenticateJwt, authorizeAdmin);

router.get('/', async (req, res, next) => {
  try {
    const customers = await customerService.getAllCustomers();
    res.json({ success: true, data: customers });
  } catch (err: any) {
    next(err);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const customer = await customerService.createCustomer(req.body);
    res.status(201).json({ success: true, data: customer });
  } catch (err: any) {
    next(err);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const customer = await customerService.updateCustomer(req.params.id, req.body);
    if (!customer) return res.status(404).json({ success: false, message: 'Customer not found' });
    res.json({ success: true, data: customer });
  } catch (err: any) {
    next(err);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const ok = await customerService.deleteCustomer(req.params.id);
    res.json({ success: ok, message: ok ? 'Customer deleted' : 'Customer not found' });
  } catch (err: any) {
    next(err);
  }
});

export default router;
