import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import authRoutes from './routes/auth.routes';
import homeRoutes from './routes/home.routes';
import { productRoutes, adminProductRoutes, adminCategoryRoutes } from './routes/product.routes';
import brandRoutes, { adminBrandRoutes } from './routes/brand.routes';
import cartRoutes from './routes/cart.routes';
import { orderRoutes, adminOrderRoutes } from './routes/order.routes';
import profileRoutes from './routes/profile.routes';
import agentRoutes from './routes/agent.routes';
import customerRoutes from './routes/customer.routes';
import paymentRoutes from './routes/payment.routes';
import dashboardRoutes from './routes/dashboard.routes';
import adminAgentRoutes from './routes/admin-agent.routes';
import { cityRoutes, adminCityRoutes } from './routes/city.routes';
import settingsRoutes, { publicSettingsRoutes } from './routes/settings.routes';
import geoRoutes from './routes/geo.routes';
import withdrawalRoutes from './routes/withdrawal.routes';
import { errorHandler } from './middleware/error.middleware';

const app: Application = express();

// Middleware: Enable CORS for both Vite Web Admin and React Native mobile clients
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static images for products and cement bags
const publicDir = path.resolve(__dirname, '../../public');
app.use('/public', express.static(publicDir));
app.use('/cements', express.static(path.join(publicDir, 'cements')));

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Petra Cements Master Backend Server is running',
    timestamp: new Date().toISOString(),
  });
});

// User / Mobile App Routes
app.use('/api/auth', authRoutes);
app.use('/api/home', homeRoutes);
app.use('/api/products', productRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/agent', agentRoutes);
app.use('/api/cities', cityRoutes);
app.use('/api/geo', geoRoutes);
app.use('/api/settings', publicSettingsRoutes);

// Admin Web App Routes - Full Suite
app.use('/api/admin/products', adminProductRoutes);
app.use('/api/admin/categories', adminCategoryRoutes);
app.use('/api/admin/brands', adminBrandRoutes);
app.use('/api/admin/orders', adminOrderRoutes);
app.use('/api/admin/customers', customerRoutes);
app.use('/api/admin/payments', paymentRoutes);
app.use('/api/admin/dashboard', dashboardRoutes);
app.use('/api/admin/reports', dashboardRoutes);
app.use('/api/admin/agents', adminAgentRoutes);
app.use('/api/admin/cities', adminCityRoutes);
app.use('/api/admin/settings', settingsRoutes);
app.use('/api/admin/withdrawals', withdrawalRoutes);

// Admin panel (production build in ../dist) served from the same port; non-API routes fall back to index.html
const adminDist = path.resolve(__dirname, '../../dist');
app.use(express.static(adminDist));
app.get(/^(?!\/api(\/|$)).*/, (req: Request, res: Response) => res.sendFile(path.join(adminDist, 'index.html')));

// Catch-all 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `API Endpoint ${req.method} ${req.originalUrl} Not Found`,
  });
});

// Centralized Error Handling Middleware
app.use(errorHandler);

export default app;
