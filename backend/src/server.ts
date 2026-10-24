import path from 'path';
import dotenv from 'dotenv';
// Explicitly resolve .env relative to current source/dist folder
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import app from './app';
import { testDbConnection } from './config/database';
import { homeService } from './services/home.service';
import { agentService } from './services/agent.service';
import { productService } from './services/product.service';
import { brandService } from './services/brand.service';
import { orderService } from './services/order.service';
import { customerService } from './services/customer.service';
import { paymentService } from './services/payment.service';
import { authService } from './services/auth.service';
import { cityService } from './services/city.service';

const PORT = parseInt(process.env.PORT || '5000', 10);

async function startServer() {
  // Verify Database connectivity
  await testDbConnection();

  // Ensure an admin account exists so the Admin Portal can be logged into
  await authService.seedAdminIfNeeded();

  // Delivery cities for checkout and agent territories
  await cityService.seedTamilNaduCitiesIfNeeded();
  await cityService.normalizeAgentCities();

  // Populate sample Petra Cements & Brand catalog data if DB is empty
  await homeService.seedInitialDataIfNeeded();
  await agentService.seedAgentDataIfNeeded();
  await brandService.seedBrandsIfNeeded();
  await productService.seedCementCatalogIfNeeded();
  await orderService.seedOrdersIfNeeded();
  await customerService.seedCustomersIfNeeded();
  await paymentService.seedPaymentsIfNeeded();

  app.listen(PORT, () => {
    console.log('===================================================');
    console.log(`Petra Master Backend is running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`User Products API: http://localhost:${PORT}/api/products`);
    console.log(`Admin Master API Suite: http://localhost:${PORT}/api/admin`);
    console.log(`Admin Orders API: http://localhost:${PORT}/api/admin/orders`);
    console.log(`Admin Customers API: http://localhost:${PORT}/api/admin/customers`);
    console.log(`Admin Payments API: http://localhost:${PORT}/api/admin/payments`);
    console.log(`Admin Dashboard API: http://localhost:${PORT}/api/admin/dashboard/stats`);
    console.log('===================================================');
  });
}

startServer().catch((error) => {
  console.error('Fatal Server Startup Error:', error);
  process.exit(1);
});
