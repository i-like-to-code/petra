import { Customer, ICustomer } from '../models/customer.model';
import { User, IUser } from '../models/user.model';
import { Order } from '../models/order.model';

export const INITIAL_CUSTOMERS_SEED = [
  { initials: 'RK', name: 'Ravi Kumar (RK Infra)', location: 'Chennai', ordersCount: 12, spent: '₹14.2L', numericSpent: 1420000, status: 'Active', phone: '+91 98401 23456', email: 'ravi@rkinfra.com' },
  { initials: 'SM', name: 'Sri Murugan Traders', location: 'Madurai', ordersCount: 8, spent: '₹13.1L', numericSpent: 1310000, status: 'Active', phone: '+91 94432 34567', email: 'smtraders@gmail.com' },
  { initials: 'AB', name: 'Arun Builders', location: 'Coimbatore', ordersCount: 7, spent: '₹12.8L', numericSpent: 1280000, status: 'Active', phone: '+91 98943 45678', email: 'arun@arunbuild.in' },
  { initials: 'VH', name: 'Vel Hardware & Cements', location: 'Trichy', ordersCount: 2, spent: '₹10.4L', numericSpent: 1040000, status: 'Inactive', phone: '+91 97894 56789', email: 'velhardware@yahoo.com' },
  { initials: 'KC', name: 'Kaveri Constructions', location: 'Salem', ordersCount: 5, spent: '₹11.6L', numericSpent: 1160000, status: 'Active', phone: '+91 98425 67890', email: 'kaveri.const@gmail.com' },
];

export class CustomerService {
  async seedCustomersIfNeeded(): Promise<void> {
    try {
      const count = await Customer.countDocuments();
      if (count === 0) {
        console.log('[CustomerService] Seeding initial 5 customer directory records...');
        await Customer.insertMany(INITIAL_CUSTOMERS_SEED);
        console.log('[CustomerService] Customer directory seeded successfully.');
      }
    } catch (err: any) {
      console.error('[CustomerService] Seeding error:', err.message);
    }
  }

  /**
   * Return all registered customers/users from MongoDB with live purchase and order statistics
   */
  async getAllCustomers(): Promise<any[]> {
    // 1. Fetch all real registered users with role 'user' or 'customer'
    const registeredUsers = await User.find({ role: { $in: ['user', 'customer'] } }).sort({ createdAt: -1 });

    // 2. Fetch all real orders
    const allOrders = await Order.find().sort({ createdAt: -1 });

    const customerList: any[] = [];
    const processedEmails = new Set<string>();
    const processedPhones = new Set<string>();

    for (const u of registeredUsers) {
      const uEmail = (u.email || '').toLowerCase().trim();
      const uPhone = (u.phone || '').trim();

      if (uEmail) processedEmails.add(uEmail);
      if (uPhone) processedPhones.add(uPhone);

      // Find all orders placed by this user
      const userOrders = allOrders.filter((ord: any) => {
        const ordUserId = ord.user ? ord.user.toString() : '';
        const ordPhone = (ord.shippingAddress?.phone || '').trim();
        const ordName = (ord.shippingAddress?.fullName || '').toLowerCase().trim();
        return (
          ordUserId === u._id.toString() ||
          (uPhone && ordPhone === uPhone) ||
          (u.fullName && ordName === u.fullName.toLowerCase().trim())
        );
      });

      const ordersCount = userOrders.length;
      const numericSpent = userOrders.reduce((sum: number, o: any) => sum + (Number(o.totalAmount) || 0), 0);
      
      const latestOrder = userOrders[0];
      const location = latestOrder?.shippingAddress?.city || u.city || 'Tamil Nadu';
      const fullAddress = latestOrder?.shippingAddress ? 
        `${latestOrder.shippingAddress.addressLine1 || ''}, ${latestOrder.shippingAddress.city || ''} - ${latestOrder.shippingAddress.pincode || ''}`.replace(/^, /, '') 
        : (u.city ? `${u.city}, Tamil Nadu` : 'Tamil Nadu');

      const nameParts = (u.fullName || 'User').trim().split(' ').filter(Boolean);
      const initials = nameParts.length > 1
        ? (nameParts[0][0] + nameParts[1][0]).toUpperCase()
        : (nameParts[0] ? nameParts[0].substring(0, 2).toUpperCase() : 'CU');

      customerList.push({
        id: u._id.toString(),
        _id: u._id.toString(),
        userId: u._id.toString(),
        initials,
        name: u.fullName,
        email: u.email,
        phone: u.phone,
        location,
        fullAddress,
        ordersCount,
        spent: numericSpent > 0 ? `₹${numericSpent.toLocaleString('en-IN')}` : '₹0',
        numericSpent,
        status: 'Active',
        role: 'User',
        createdAt: u.createdAt,
        isRegisteredUser: true,
        recentOrders: userOrders.slice(0, 5).map((o: any) => ({
          orderNumber: o.orderNumber,
          totalAmount: o.totalAmount,
          orderStatus: o.orderStatus,
          createdAt: o.createdAt,
          itemsCount: o.items?.length || 0,
        }))
      });
    }

    // 3. Include any existing Customer records that aren't already represented by a registered user
    const existingCustomers = await Customer.find().sort({ createdAt: -1 });
    for (const c of existingCustomers) {
      const cEmail = (c.email || '').toLowerCase().trim();
      const cPhone = (c.phone || '').trim();

      if (!processedEmails.has(cEmail) && !processedPhones.has(cPhone)) {
        customerList.push({
          id: c._id.toString(),
          _id: c._id.toString(),
          initials: c.initials || 'CU',
          name: c.name,
          email: c.email || '',
          phone: c.phone || '',
          location: c.location || 'Tamil Nadu',
          fullAddress: `${c.location || 'Tamil Nadu'}, India`,
          ordersCount: c.ordersCount || 0,
          spent: c.spent || '₹0',
          numericSpent: c.numericSpent || 0,
          status: c.status || 'Active',
          role: 'User',
          createdAt: c.createdAt,
          isRegisteredUser: false,
          recentOrders: []
        });
      }
    }

    // Sort by newest registered first
    return customerList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createCustomer(data: any): Promise<any> {
    const initials = data.initials || (data.name ? data.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase() : 'CU');
    const customer = new Customer({
      name: data.name,
      initials,
      location: data.location || 'Tamil Nadu',
      phone: data.phone || '',
      email: data.email || '',
      ordersCount: data.ordersCount || 0,
      spent: data.spent || '₹0',
      numericSpent: data.numericSpent || 0,
      status: data.status || 'Active',
    });
    await customer.save();
    return {
      id: customer._id.toString(),
      _id: customer._id.toString(),
      initials: customer.initials,
      name: customer.name,
      location: customer.location,
      ordersCount: customer.ordersCount,
      spent: customer.spent,
      status: customer.status,
      phone: customer.phone,
      email: customer.email,
      createdAt: customer.createdAt,
    };
  }

  async updateCustomer(id: string, data: any): Promise<any | null> {
    const customer = await Customer.findByIdAndUpdate(id, data, { new: true });
    if (!customer) {
      const user = await User.findByIdAndUpdate(id, {
        ...(data.name && { fullName: data.name }),
        ...(data.phone && { phone: data.phone }),
        ...(data.email && { email: data.email }),
        ...(data.location && { city: data.location }),
      }, { new: true });
      if (!user) return null;
      return {
        id: user._id.toString(),
        name: user.fullName,
        email: user.email,
        phone: user.phone,
        location: user.city || 'Tamil Nadu',
        status: 'Active',
      };
    }
    return {
      id: customer._id.toString(),
      _id: customer._id.toString(),
      initials: customer.initials,
      name: customer.name,
      location: customer.location,
      ordersCount: customer.ordersCount,
      spent: customer.spent,
      status: customer.status,
      phone: customer.phone,
      email: customer.email,
    };
  }

  async deleteCustomer(id: string): Promise<boolean> {
    const resCust = await Customer.findByIdAndDelete(id);
    const resUser = await User.findByIdAndDelete(id);
    return !!(resCust || resUser);
  }
}

export const customerService = new CustomerService();
