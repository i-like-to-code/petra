import React, { useState, useEffect } from 'react';
import adminApi, { AUTH_EXPIRED_EVENT, clearAdminSession, getAdminToken, getAdminUser } from './services/api';
import AdminLogin from './components/AdminLogin';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import DashboardPanel from './components/DashboardPanel';
import ProductsPanel from './components/ProductsPanel';
import InventoryPanel from './components/InventoryPanel';
import CategoriesPanel from './components/CategoriesPanel';
import OrdersPanel from './components/OrdersPanel';
import CustomersPanel from './components/CustomersPanel';
import AgentsPanel from './components/AgentsPanel';
import CitiesPanel from './components/CitiesPanel';
import PaymentsPanel from './components/PaymentsPanel';
import ReportsPanel from './components/ReportsPanel';
import AddModal from './components/AddModal';
import './App.css';

// 6 Major Cement Brands matching user mobile app
export const INITIAL_BRANDS = [
  {
    id: 'ultratech',
    name: 'UltraTech Cement',
    company: 'UltraTech Cement Ltd',
    tagline: "The Engineer's Choice",
    brandColor: '#ca8a04',
    bgLightColor: '#fefce8',
    image: '/cements/ultratech-super-ppc.png',
    active: true,
    productCount: 4,
  },
  {
    id: 'ramco',
    name: 'Ramco Cement',
    company: 'The Ramco Cements Ltd',
    tagline: 'As strong as family bonds',
    brandColor: '#d97706',
    bgLightColor: '#fffbeb',
    image: '/cements/ramco-supergrade.png',
    active: true,
    productCount: 4,
  },
  {
    id: 'dalmia',
    name: 'Dalmia Cement',
    company: 'Dalmia Bharat Limited',
    tagline: 'Future-ready green cement',
    brandColor: '#2563eb',
    bgLightColor: '#eff6ff',
    image: '/cements/dalmia-dsp.png',
    active: true,
    productCount: 3,
  },
  {
    id: 'jsw',
    name: 'JSW Cement',
    company: 'JSW Group',
    tagline: 'Building a Stronger India',
    brandColor: '#1d4ed8',
    bgLightColor: '#f0f9ff',
    image: '/cements/jsw-concreel-hd.png',
    active: true,
    productCount: 3,
  },
  {
    id: 'zuari',
    name: 'Zuari Cement',
    company: 'Italcementi Group',
    tagline: 'European cement quality standards',
    brandColor: '#0f172a',
    bgLightColor: '#f8fafc',
    image: '/cements/zuari-ppc.png',
    active: true,
    productCount: 2,
  },
  {
    id: 'maha',
    name: 'Maha Cement',
    company: 'My Home Industries Pvt Ltd',
    tagline: 'Build It Strong',
    brandColor: '#dc2626',
    bgLightColor: '#fef2f2',
    image: '/cements/maha-bag.png',
    active: true,
    productCount: 2,
  },
];

// Product Catalog aligned with User Side App (pricing, specs & images)
export const INITIAL_PRODUCTS = [
  {
    id: 1,
    brandId: 'ultratech',
    brandName: 'UltraTech Cement',
    name: 'UltraTech Super PPC',
    subtitle: "The Engineer's Choice - Fly Ash Based",
    stock: '850 bags',
    price: '₹400/bag',
    numericPrice: 400,
    status: 'In Stock',
    image: '/cements/ultratech-super-ppc.png',
    specs: {
      packagingSize: '50 kg',
      type: 'PPC (Pozzolana Portland Cement)',
      packagingType: 'HDPE Laminated Sack Bag',
      brand: 'UltraTech Cement',
      usage: 'Structural Concrete, Slabs & Beams',
      color: 'Light Grey',
      features: 'Engineered particle distribution, corrosion resistant',
      compressiveStrength: '33+ MPa at 28 days',
      standard: 'IS 1489 (Part 1)'
    }
  },
  {
    id: 2,
    brandId: 'ultratech',
    brandName: 'UltraTech Cement',
    name: 'UltraTech OPC 53 Grade',
    subtitle: 'Structural High Strength Ordinary Portland',
    stock: '1,400 bags',
    price: '₹425/bag',
    numericPrice: 425,
    status: 'In Stock',
    image: '/cements/ultratech-opc.jpg',
    specs: {
      packagingSize: '50 kg',
      type: 'OPC 53 Grade',
      packagingType: 'HDPE Laminated Sack Bag',
      brand: 'UltraTech Cement',
      usage: 'High-rise columns, bridges & pre-stressed concrete',
      color: 'Grey',
      features: 'Rapid early strength gain and high structural load',
      compressiveStrength: '53+ MPa at 28 days',
      standard: 'IS 12269'
    }
  },
  {
    id: 3,
    brandId: 'ultratech',
    brandName: 'UltraTech Cement',
    name: 'UltraTech Weather Plus',
    subtitle: 'Water Repellent Advanced Cement',
    stock: '320 bags',
    price: '₹440/bag',
    numericPrice: 440,
    status: 'In Stock',
    image: '/cements/ultratech-weather-plus.jpg',
    specs: {
      packagingSize: '50 kg',
      type: 'Water Repellent Cement',
      packagingType: 'HDPE Moisture-Barrier Sack',
      brand: 'UltraTech Cement',
      usage: 'Roof slabs, basements & water retaining walls',
      color: 'Dark Grey',
      features: 'Seepage & efflorescence resistant with micro-seal technology',
      compressiveStrength: '45+ MPa at 28 days',
      standard: 'IS 1489'
    }
  },
  {
    id: 4,
    brandId: 'ultratech',
    brandName: 'UltraTech Cement',
    name: 'Birla White Cement',
    subtitle: 'White Portland Architectural Cement',
    stock: '90 bags',
    price: '₹530/bag',
    numericPrice: 530,
    status: 'In Stock',
    image: '/cements/ultratech-white.png',
    specs: {
      packagingSize: '50 kg',
      type: 'White Portland Cement',
      packagingType: 'Heavy Multiwall Poly Bag',
      brand: 'UltraTech Cement',
      usage: 'Architectural finishes, tile grouting & decorative flooring',
      color: 'Brilliant Super White (>89% whiteness)',
      features: 'Ultra-fine finish and high refractive brilliance',
      compressiveStrength: '35+ MPa at 28 days',
      standard: 'IS 8042'
    }
  },
  {
    id: 5,
    brandId: 'ramco',
    brandName: 'Ramco Cement',
    name: 'Ramco Supergrade PPC',
    subtitle: 'Fly-Ash Engineered Pozzolana',
    stock: '920 bags',
    price: '₹390/bag',
    numericPrice: 390,
    status: 'In Stock',
    image: '/cements/ramco-supergrade.png',
    specs: {
      packagingSize: '50 kg',
      type: 'PPC (Pozzolana Portland Cement)',
      packagingType: 'HDPE Sack Bag',
      brand: 'Ramco Cement',
      usage: 'Residential slabs, masonry & general plastering',
      color: 'Light Grey',
      features: 'High fineness, zero micro-cracks & low heat of hydration',
      compressiveStrength: '33+ MPa at 28 days',
      standard: 'IS 1489 (Part 1)'
    }
  },
  {
    id: 6,
    brandId: 'ramco',
    brandName: 'Ramco Cement',
    name: 'Ramco OPC 53 Grade',
    subtitle: 'High Compressive Strength Structural Cement',
    stock: '780 bags',
    price: '₹415/bag',
    numericPrice: 415,
    status: 'In Stock',
    image: '/cements/ramco-53-grade.png',
    specs: {
      packagingSize: '50 kg',
      type: 'OPC 53 Grade',
      packagingType: 'HDPE Sack Bag',
      brand: 'Ramco Cement',
      usage: 'Heavy RCC structures, pillars & commercial foundations',
      color: 'Grey',
      features: 'Rapid setting, high early load transfer capacity',
      compressiveStrength: '53+ MPa at 28 days',
      standard: 'IS 12269'
    }
  },
  {
    id: 7,
    brandId: 'ramco',
    brandName: 'Ramco Cement',
    name: 'Ramco Supercoast PSC',
    subtitle: 'Portland Slag Saline Corrosion Resistant',
    stock: '450 bags',
    price: '₹395/bag',
    numericPrice: 395,
    status: 'In Stock',
    image: '/cements/ramco-super-coast.jpg',
    specs: {
      packagingSize: '50 kg',
      type: 'PSC (Portland Slag Cement)',
      packagingType: 'HDPE Sack Bag',
      brand: 'Ramco Cement',
      usage: 'Coastal construction, marine piling & sewage works',
      color: 'Bluish Grey',
      features: 'Sulfate, chloride & sea-water corrosion immune',
      compressiveStrength: '35+ MPa at 28 days',
      standard: 'IS 455'
    }
  },
  {
    id: 8,
    brandId: 'ramco',
    brandName: 'Ramco Cement',
    name: 'Ramco Super Steel Cement',
    subtitle: 'Ultra High Performance Structural Cement',
    stock: '35 bags',
    price: '₹510/bag',
    numericPrice: 510,
    status: 'Low Stock',
    image: '/cements/ramco-super-steel.png',
    specs: {
      packagingSize: '50 kg',
      type: 'Premium Structural Cement',
      packagingType: 'Heavy HDPE Barrier Bag',
      brand: 'Ramco Cement',
      usage: 'High strength RCC beams, pre-cast & heavy industrial decks',
      color: 'Dark Grey',
      features: 'Maximum durability and extreme early load resistance',
      compressiveStrength: '60+ MPa at 28 days',
      standard: 'IS 12269 / Special'
    }
  },
  {
    id: 9,
    brandId: 'dalmia',
    brandName: 'Dalmia Cement',
    name: 'Dalmia DSP Cement',
    subtitle: 'Dhalai Special PPC - Void Free Concrete',
    stock: '1,100 bags',
    price: '₹395/bag',
    numericPrice: 395,
    status: 'In Stock',
    image: '/cements/dalmia-dsp.png',
    specs: {
      packagingSize: '50 kg',
      type: 'PPC (Pozzolana Portland Cement)',
      packagingType: 'HDPE Sack Bag',
      brand: 'Dalmia Cement',
      usage: 'Roof slab casting (Dhalai), foundations & structural frames',
      color: 'Light Grey',
      features: 'Micro-fine particles eliminate voids for waterproof slab',
      compressiveStrength: '38+ MPa at 28 days',
      standard: 'IS 1489 (Part 1)'
    }
  },
  {
    id: 10,
    brandId: 'dalmia',
    brandName: 'Dalmia Cement',
    name: 'Dalmia OPC 53 Grade',
    subtitle: 'Industrial Strength Ordinary Portland',
    stock: '650 bags',
    price: '₹415/bag',
    numericPrice: 415,
    status: 'In Stock',
    image: '/cements/dalmia-53-grade.jpg',
    specs: {
      packagingSize: '50 kg',
      type: 'OPC 53 Grade',
      packagingType: 'HDPE Sack Bag',
      brand: 'Dalmia Cement',
      usage: 'Commercial multistory pillars, bridges & road culverts',
      color: 'Grey',
      features: 'High compressive performance with prompt de-shuttering',
      compressiveStrength: '53+ MPa at 28 days',
      standard: 'IS 12269'
    }
  },
  {
    id: 11,
    brandId: 'dalmia',
    brandName: 'Dalmia Cement',
    name: 'Dalmia Infra Pro PSC',
    subtitle: 'Eco-Friendly Low Heat Slag Cement',
    stock: '480 bags',
    price: '₹385/bag',
    numericPrice: 385,
    status: 'In Stock',
    image: '/cements/dalmia-infra-pro.png',
    specs: {
      packagingSize: '50 kg',
      type: 'PSC (Portland Slag Cement)',
      packagingType: 'HDPE Sack Bag',
      brand: 'Dalmia Cement',
      usage: 'Mass concreting, dams, coastal roads & foundations',
      color: 'Greenish Grey',
      features: 'Green blended formulation with low thermal cracking risk',
      compressiveStrength: '35+ MPa at 28 days',
      standard: 'IS 455'
    }
  },
  {
    id: 12,
    brandId: 'jsw',
    brandName: 'JSW Cement',
    name: 'JSW Concreel HD PPC',
    subtitle: 'Heavy Duty Structural Durability Cement',
    stock: '890 bags',
    price: '₹390/bag',
    numericPrice: 390,
    status: 'In Stock',
    image: '/cements/jsw-concreel-hd.png',
    specs: {
      packagingSize: '50 kg',
      type: 'PPC (Pozzolana Portland Cement)',
      packagingType: 'HDPE Sack Bag',
      brand: 'JSW Cement',
      usage: 'RCC columns, slabs & heavy duty flooring',
      color: 'Grey',
      features: 'Superior bond strength, high impermeability & crack shield',
      compressiveStrength: '36+ MPa at 28 days',
      standard: 'IS 1489'
    }
  },
  {
    id: 13,
    brandId: 'jsw',
    brandName: 'JSW Cement',
    name: 'JSW OPC 53 Grade',
    subtitle: 'Rapid Load Ordinary Portland 53',
    stock: '420 bags',
    price: '₹410/bag',
    numericPrice: 410,
    status: 'In Stock',
    image: '/cements/jsw-opc.png',
    specs: {
      packagingSize: '50 kg',
      type: 'OPC 53 Grade',
      packagingType: 'HDPE Sack Bag',
      brand: 'JSW Cement',
      usage: 'Fast construction cycles, pre-stressed concrete & slabs',
      color: 'Grey',
      features: 'Rapid setting, high early load transfer capacity',
      compressiveStrength: '53+ MPa at 28 days',
      standard: 'IS 12269'
    }
  },
  {
    id: 14,
    brandId: 'jsw',
    brandName: 'JSW Cement',
    name: 'JSW Composite Slag Cement',
    subtitle: 'Slag Blended Durable Eco Cement',
    stock: '560 bags',
    price: '₹380/bag',
    numericPrice: 380,
    status: 'In Stock',
    image: '/cements/jsw-compcem.png',
    specs: {
      packagingSize: '50 kg',
      type: 'PSC (Portland Slag Cement)',
      packagingType: 'HDPE Sack Bag',
      brand: 'JSW Cement',
      usage: 'Foundation piling, coastal basements & drainage walls',
      color: 'Light Grey',
      features: 'Zero alkali-silica reactivity and sea salt resistance',
      compressiveStrength: '35+ MPa at 28 days',
      standard: 'IS 455'
    }
  },
  {
    id: 15,
    brandId: 'zuari',
    brandName: 'Zuari Cement',
    name: 'Zuari Super PPC Cement',
    subtitle: 'Italcementi Group European Quality Standards',
    stock: '610 bags',
    price: '₹385/bag',
    numericPrice: 385,
    status: 'In Stock',
    image: '/cements/zuari-ppc.png',
    specs: {
      packagingSize: '50 kg',
      type: 'PPC (Pozzolana Portland Cement)',
      packagingType: 'HDPE Sack Bag',
      brand: 'Zuari Cement',
      usage: 'Smooth plastering, brick mortar & residential slabs',
      color: 'Grey',
      features: 'High Blaine fineness for silky smooth plaster finish',
      compressiveStrength: '34+ MPa at 28 days',
      standard: 'IS 1489'
    }
  },
  {
    id: 16,
    brandId: 'zuari',
    brandName: 'Zuari Cement',
    name: 'Zuari OPC 53 Grade',
    subtitle: 'Structural Grade High Load Cement',
    stock: '280 bags',
    price: '₹405/bag',
    numericPrice: 405,
    status: 'In Stock',
    image: '/cements/zuari-opc.jpg',
    specs: {
      packagingSize: '50 kg',
      type: 'OPC 53 Grade',
      packagingType: 'HDPE Sack Bag',
      brand: 'Zuari Cement',
      usage: 'RCC columns, beams and residential structural slabs',
      color: 'Grey',
      features: 'Strong bond to TMT steel rebars and fast hardening',
      compressiveStrength: '53+ MPa at 28 days',
      standard: 'IS 12269'
    }
  },
  {
    id: 17,
    brandId: 'maha',
    brandName: 'Maha Cement',
    name: 'Maha Gold PPC Cement',
    subtitle: 'Build It Strong Fly-Ash Pozzolana',
    stock: '850 bags',
    price: '₹380/bag',
    numericPrice: 380,
    status: 'In Stock',
    image: '/cements/maha-bag.png',
    specs: {
      packagingSize: '50 kg',
      grade: 'PPC',
      type: 'PPC (Pozzolana Portland Cement)',
      packagingType: 'HDPE Sack Bag',
      brand: 'Maha Cement',
      usage: 'Residential housing, brickwork & plastering',
      color: 'Grey',
      features: 'Maha Gold PPC is designed for durable homes, resisting cracks and providing smooth plastering.',
      compressiveStrength: '33+ MPa at 28 days',
      standard: 'IS 1489'
    }
  },
  {
    id: 18,
    brandId: 'maha',
    brandName: 'Maha Cement',
    name: 'Maha OPC 53 Grade',
    subtitle: 'Build It Strong Structural',
    stock: '720 bags',
    price: '₹400/bag',
    numericPrice: 400,
    status: 'In Stock',
    image: '/cements/maha-bag.png',
    specs: {
      packagingSize: '50 kg',
      grade: 'OPC 53',
      type: 'OPC 53 Grade',
      packagingType: 'HDPE Sack Bag',
      brand: 'Maha Cement',
      usage: 'Engineered for heavy civil works, concrete slabs, and heavy foundation columns.',
      color: 'Grey',
      features: 'Rapid hardening and high compressive strength for structural RCC.',
      compressiveStrength: '53+ MPa at 28 days',
      standard: 'IS 12269'
    }
  }
];

export default function App() {
  const [adminUser, setAdminUser] = useState(null);
  const [isCheckingSession, setIsCheckingSession] = useState(() => Boolean(getAdminToken()));

  // Verify any stored token with the backend before showing the dashboard
  useEffect(() => {
    if (!getAdminToken()) return;
    adminApi.getMe().then((res) => {
      const user = res?.data?.user;
      if (res?.success && user?.role === 'admin') {
        setAdminUser(user);
      } else if (!res?.offline) {
        clearAdminSession();
      } else {
        // Backend unreachable: keep the stored session; protected requests will still be rejected server-side
        setAdminUser(getAdminUser());
      }
      setIsCheckingSession(false);
    });
  }, []);

  // Return to the login screen whenever the backend rejects the token
  useEffect(() => {
    const handleExpired = () => setAdminUser(null);
    window.addEventListener(AUTH_EXPIRED_EVENT, handleExpired);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, handleExpired);
  }, []);

  const handleLogout = () => {
    clearAdminSession();
    setAdminUser(null);
  };

  if (isCheckingSession) {
    return null;
  }

  if (!adminUser) {
    return <AdminLogin onLoginSuccess={setAdminUser} />;
  }

  return <AdminDashboard adminUser={adminUser} onLogout={handleLogout} />;
}

function AdminDashboard({ adminUser, onLogout }) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Core collections state
  const [brands, setBrands] = useState(INITIAL_BRANDS);
  const [products, setProducts] = useState(INITIAL_PRODUCTS);

  const [categories, setCategories] = useState([
    { id: 1, name: 'OPC 53 (Ordinary Portland Cement)', productsCount: 5, active: true, standard: 'IS 12269' },
    { id: 2, name: 'PPC (Pozzolana Portland Cement)', productsCount: 6, active: true, standard: 'IS 1489 (Part 1)' },
    { id: 3, name: 'PSC (Portland Slag Cement)', productsCount: 4, active: true, standard: 'IS 455' },
    { id: 4, name: 'White & Architectural Cement', productsCount: 1, active: true, standard: 'IS 8042' },
    { id: 5, name: 'Premium Structural High-Grade', productsCount: 1, active: true, standard: 'High Strength' },
  ]);

  const [orders, setOrders] = useState([
    { id: 1, code: 'PC-20458', customer: 'Ravi Kumar (RK Infra)', location: 'Chennai', details: '100 bags - UltraTech OPC 53 Grade', amount: '₹142,500', status: 'Pending' },
    { id: 2, code: 'PC-20457', customer: 'Sri Murugan Traders', location: 'Madurai', details: '60 bags - Ramco Supergrade PPC', amount: '₹123,400', status: 'Dispatched' },
    { id: 3, code: 'PC-20456', customer: 'Arun Builders', location: 'Coimbatore', details: '200 bags - Dalmia DSP Cement', amount: '₹179,000', status: 'Delivered' },
    { id: 4, code: 'PC-20455', customer: 'Vel Hardware & Cements', location: 'Trichy', details: '80 bags - JSW Concreel HD PPC', amount: '₹131,200', status: 'Delivered' },
    { id: 5, code: 'PC-20454', customer: 'Kaveri Constructions', location: 'Salem', details: '150 bags - Zuari OPC 53 Grade', amount: '₹160,750', status: 'Pending' },
  ]);

  const [customers, setCustomers] = useState([
    { id: 1, initials: 'RK', name: 'Ravi Kumar (RK Infra)', location: 'Chennai', ordersCount: 12, spent: '₹14.2L', status: 'Active' },
    { id: 2, initials: 'SM', name: 'Sri Murugan Traders', location: 'Madurai', ordersCount: 8, spent: '₹13.1L', status: 'Active' },
    { id: 3, initials: 'AB', name: 'Arun Builders', location: 'Coimbatore', ordersCount: 7, spent: '₹12.8L', status: 'Active' },
    { id: 4, initials: 'VH', name: 'Vel Hardware & Cements', location: 'Trichy', ordersCount: 2, spent: '₹10.4L', status: 'Inactive' },
    { id: 5, initials: 'KC', name: 'Kaveri Constructions', location: 'Salem', ordersCount: 5, spent: '₹11.6L', status: 'Active' },
  ]);

  const [payments, setPayments] = useState([
    { id: 1, initials: 'RK', name: 'Ravi Kumar', mode: 'UPI / NetBanking', date: '03 Oct', amount: '₹142,500', status: 'Paid' },
    { id: 2, initials: 'SM', name: 'Sri Murugan Traders', mode: 'Bank NEFT', date: '01 Oct', amount: '₹123,400', status: 'Pending' },
    { id: 3, initials: 'AB', name: 'Arun Builders', mode: 'Cheque RTGS', date: '28 Sep', amount: '₹179,000', status: 'Paid' },
    { id: 4, initials: 'VH', name: 'Vel Hardware', mode: 'UPI', date: '28 Sep', amount: '₹118,200', status: 'Failed' },
  ]);

  const [dashboardStats, setDashboardStats] = useState(null);

  // Connect to Central Express + MongoDB Backend API on mount
  useEffect(() => {
    async function loadDataFromBackend() {
      try {
        // 1. Fetch live brands
        try {
          const brandRes = await adminApi.getBrands();
          if (brandRes && brandRes.success && Array.isArray(brandRes.data) && brandRes.data.length > 0) {
            console.log('[Admin Portal] Loaded ' + brandRes.data.length + ' brands from backend');
            setBrands(brandRes.data);
          }
        } catch (bErr) {
          console.warn('[Admin Portal] Brands loaded from presets.');
        }

        // 2. Fetch live products
        try {
          const prodRes = await adminApi.getProducts();
          if (prodRes && prodRes.success && prodRes.data && prodRes.data.products && prodRes.data.products.length > 0) {
            console.log('[Admin Portal] Loaded ' + prodRes.data.products.length + ' products from live Backend API');
            const formatted = prodRes.data.products.map(p => ({
              id: p.id || p._id,
              name: p.name,
              subtitle: p.subtitle || p.shortDescription || '',
              brand: p.brand || p.specs?.brand || 'UltraTech Cement',
              brandId: p.brandId || 'ultratech',
              brandName: p.brand || p.specs?.brand || 'UltraTech Cement',
              stock: typeof p.stock === 'number' ? p.stock + ' bags' : p.stock,
              price: typeof p.price === 'number' ? '₹' + p.price + '/bag' : p.price,
              numericPrice: typeof p.price === 'number' ? p.price : 400,
              status: p.status === 'active' ? 'In Stock' : 'Inactive',
              active: p.status === 'active',
              rawStatus: p.status,
              image: p.image || p.images?.[0] || '/petra_cement_bag.jpg',
              specs: p.specs || {
                packagingSize: '50 kg',
                type: 'PPC',
                packagingType: 'HDPE Sack Bag',
                brand: p.brand || 'UltraTech Cement',
                usage: 'Construction & RCC',
                color: 'Grey',
                features: 'High compressive strength'
              }
            }));
            setProducts(formatted);
          }
        } catch (pErr) {
          console.warn('[Admin Portal] Products loaded from presets.');
        }

        // 3. Fetch live orders
        try {
          const orderRes = await adminApi.getOrders();
          if (orderRes && orderRes.success && orderRes.data && Array.isArray(orderRes.data.orders) && orderRes.data.orders.length > 0) {
            console.log('[Admin Portal] Loaded ' + orderRes.data.orders.length + ' orders from live Backend API');
            setOrders(orderRes.data.orders);
          }
        } catch (oErr) {
          console.warn('[Admin Portal] Orders loaded from presets.');
        }

        // 4. Fetch live customers directory
        try {
          const custRes = await adminApi.getCustomers();
          if (custRes && custRes.success && Array.isArray(custRes.data) && custRes.data.length > 0) {
            console.log('[Admin Portal] Loaded ' + custRes.data.length + ' customers from live Backend API');
            setCustomers(custRes.data);
          }
        } catch (cErr) {
          console.warn('[Admin Portal] Customers loaded from presets.');
        }

        // 5. Fetch live payment transactions
        try {
          const payRes = await adminApi.getPayments();
          if (payRes && payRes.success && Array.isArray(payRes.data) && payRes.data.length > 0) {
            console.log('[Admin Portal] Loaded ' + payRes.data.length + ' payments from live Backend API');
            setPayments(payRes.data);
          }
        } catch (payErr) {
          console.warn('[Admin Portal] Payments loaded from presets.');
        }

        // 6. Fetch live categories
        try {
          const catRes = await adminApi.getCategories();
          if (catRes && catRes.success && catRes.data && Array.isArray(catRes.data.categories) && catRes.data.categories.length > 0) {
            console.log('[Admin Portal] Loaded ' + catRes.data.categories.length + ' categories from live Backend API');
            const mappedCats = catRes.data.categories.map((c, i) => ({
              id: c.id || c._id || (i + 1),
              name: c.name,
              productsCount: 4,
              active: c.status === 'active',
              standard: 'IS 1489 / BIS'
            }));
            setCategories(mappedCats);
          }
        } catch (catErr) {
          console.warn('[Admin Portal] Categories loaded from presets.');
        }

        // 7. Fetch live dashboard metrics
        try {
          const statsRes = await adminApi.getDashboardStats();
          if (statsRes && statsRes.success && statsRes.data) {
            setDashboardStats(statsRes.data);
          }
        } catch (sErr) {
          console.warn('[Admin Portal] Dashboard stats computed locally.');
        }

      } catch (err) {
        console.log('[Admin Portal] Running in local offline mode.');
      }
    }

    loadDataFromBackend();
  }, []);

  // Handle updating an existing product
  const handleUpdateProduct = async (updatedProduct) => {
    setProducts(products.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    try {
      await adminApi.updateProduct(updatedProduct.id, {
        name: updatedProduct.name,
        subtitle: updatedProduct.subtitle,
        brand: updatedProduct.brandName || updatedProduct.brand,
        brandId: updatedProduct.brandId,
        price: updatedProduct.numericPrice || parseInt(String(updatedProduct.price).replace(/[^0-9]/g, '')) || 400,
        stock: (function() { const n = parseInt(String(updatedProduct.stock).replace(/[^0-9]/g, ''), 10); return isNaN(n) ? 0 : n; })(),
        status: (function() { const n = parseInt(String(updatedProduct.stock).replace(/[^0-9]/g, ''), 10); return (n <= 0 || updatedProduct.status === 'Out' || updatedProduct.status === 'inactive') ? 'inactive' : 'active'; })(),
        image: updatedProduct.image,
        specs: updatedProduct.specs
      });
      console.log(`[Admin Portal] Product "${updatedProduct.name}" updated on backend`);
    } catch (err) {
      console.warn('[Admin Portal] Product update queued locally.');
    }
  };

  // Handle toggling individual product active / inactive (Live on User App)
  const handleToggleProduct = async (productId, active) => {
    const updatedStatus = active ? 'In Stock' : 'Inactive';
    setProducts(prev => prev.map(p => (p.id === productId || String(p.id) === String(productId)) ? { 
      ...p, 
      status: updatedStatus, 
      active: Boolean(active),
      rawStatus: active ? 'active' : 'inactive',
      isLive: Boolean(active) 
    } : p));
    try {
      await adminApi.toggleProduct(productId, active);
      console.log(`[Admin Portal] Product "${productId}" toggled ${active ? 'ON' : 'OFF'}`);
    } catch (err) {
      console.error('Error toggling product:', err);
    }
  };

  // Handle toggling entire cement type (PPC, OPC, PSC, White, Composite)
  const handleToggleCementType = async (type, active) => {
    try {
      await adminApi.toggleCementType(type, active);
      console.log(`[Admin Portal] Cement type "${type}" toggled ${active ? 'ON' : 'OFF'}`);
      const prodRes = await adminApi.getProducts();
      if (prodRes && prodRes.success && prodRes.data && prodRes.data.products) {
        const formatted = prodRes.data.products.map(p => ({
          id: p.id || p._id,
          name: p.name,
          subtitle: p.subtitle || p.shortDescription || '',
          brand: p.brand || p.specs?.brand || 'UltraTech Cement',
          brandId: p.brandId || 'ultratech',
          brandName: p.brand || p.specs?.brand || 'UltraTech Cement',
          stock: typeof p.stock === 'number' ? p.stock + ' bags' : p.stock,
          price: typeof p.price === 'number' ? '₹' + p.price + '/bag' : p.price,
          numericPrice: typeof p.price === 'number' ? p.price : 400,
          status: p.status === 'inactive' ? 'Inactive' : (p.status || 'In Stock'),
          active: p.status !== 'inactive',
          image: p.image || p.images?.[0] || '/cements/ultratech-super-ppc.png',
          specs: p.specs || {}
        }));
        setProducts(formatted);
      }
    } catch (err) {
      console.error('Error toggling cement type:', err);
    }
  };

  // Handle deleting a product
  const handleDeleteProduct = async (productId) => {
    setProducts(products.filter(p => p.id !== productId));
    try {
      await adminApi.deleteProduct(productId, true);
      console.log(`[Admin Portal] Product "${productId}" deleted from backend`);
    } catch (err) {
      console.warn('[Admin Portal] Product delete queued locally.');
    }
  };

  // Handle brand visibility toggle
  const handleToggleBrand = async (brandId) => {
    const current = brands.find(b => b.id === brandId);
    const newActive = current ? !current.active : false;

    // 1. Instant optimistic UI update
    setBrands(brands.map(b => b.id === brandId ? { ...b, active: newActive } : b));

    // 2. Persist to MongoDB backend
    try {
      await adminApi.toggleBrand(brandId, newActive);
      console.log(`[Admin Portal] Successfully toggled brand "${brandId}" visibility to ${newActive ? 'Active' : 'Hidden'}`);
    } catch (err) {
      console.error('[Admin Portal] Failed to save brand toggle to backend:', err);
    }
  };

  // Handle updating brand metadata
  const handleUpdateBrand = async (updatedBrand) => {
    setBrands(brands.map(b => b.id === updatedBrand.id ? updatedBrand : b));
    setProducts(products.map(p => {
      if (p.brandId === updatedBrand.id) {
        return {
          ...p,
          brandName: updatedBrand.name,
          specs: { ...p.specs, brand: updatedBrand.name }
        };
      }
      return p;
    }));

    try {
      await adminApi.updateBrand(updatedBrand.id, updatedBrand);
      console.log(`[Admin Portal] Brand "${updatedBrand.name}" updated on backend`);
    } catch (err) {
      console.error('[Admin Portal] Failed to save brand update to backend:', err);
    }
  };

  // Handle updating order status (Dispatched / Delivered / Cancelled)
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    const previous = orders;
    setOrders(orders.map(o => (o.id === orderId || o.code === orderId) ? { ...o, status: newStatus, orderStatus: newStatus.toLowerCase() } : o));
    const res = await adminApi.updateOrderStatus(orderId, newStatus);
    if (!res?.success) {
      setOrders(previous);
      alert(res?.message || 'Could not update the order status.');
      return false;
    }
    return true;
  };

  // Set or clear the estimated delivery date shown to the customer
  const handleUpdateOrderEta = async (orderId, date) => {
    const res = await adminApi.updateOrderEta(orderId, date);
    if (!res?.success) {
      alert(res?.message || 'Could not save the estimated delivery date.');
      return false;
    }
    setOrders(prev => prev.map(o => (o.id === orderId || o.code === orderId) ? { ...o, estimatedDelivery: res.data?.estimatedDelivery || null } : o));
    return true;
  };

  // Handle updating payment status (Pending -> Paid / Retry)
  const handleUpdatePaymentStatus = async (paymentId, newStatus) => {
    setPayments(payments.map(p => p.id === paymentId ? { ...p, status: newStatus } : p));
    try {
      await adminApi.updatePaymentStatus(paymentId, newStatus);
      console.log(`[Admin Portal] Payment "${paymentId}" status updated to "${newStatus}"`);
    } catch (err) {
      console.error('[Admin Portal] Failed to save payment status update:', err);
    }
  };

  // Refresh live customers from backend
  const fetchCustomers = async () => {
    try {
      const custRes = await adminApi.getCustomers();
      if (custRes && custRes.success && Array.isArray(custRes.data)) {
        setCustomers(custRes.data);
      }
    } catch (cErr) {
      console.warn('[Admin Portal] Error refreshing customers:', cErr);
    }
  };

  // Auto-refresh customers when tab changes to customers
  useEffect(() => {
    if (activeTab === 'customers') {
      fetchCustomers();
    }
  }, [activeTab]);

  // Handle deleting customer
  const handleDeleteCustomer = async (customerId) => {
    setCustomers(customers.filter(c => (c.id || c._id) !== customerId));
    try {
      await adminApi.deleteCustomer(customerId);
      console.log(`[Admin Portal] Customer "${customerId}" deleted from backend`);
    } catch (err) {
      console.error('[Admin Portal] Failed to delete customer from backend:', err);
    }
  };

  // Handle adding new items from modal (Syncs to Master Backend)
  const handleAddItem = async (type, newItem) => {
    if (type === 'products') {
      setProducts([newItem, ...products]);
      if (newItem.brandId) {
        setBrands(brands.map(b => b.id === newItem.brandId ? { ...b, productCount: (b.productCount || 0) + 1 } : b));
      }
      try {
        await adminApi.createProduct({
          name: newItem.name,
          subtitle: newItem.subtitle,
          brand: newItem.brandName,
          brandId: newItem.brandId,
          price: newItem.numericPrice || 400,
          stock: parseInt(String(newItem.stock).replace(/[^0-9]/g, '')) || 500,
          status: 'active',
          image: newItem.image,
          specs: newItem.specs
        });
      } catch (err) {
        console.warn('[Admin Portal] Backend item queued locally.');
      }
    }
    if (type === 'categories') {
      setCategories([newItem, ...categories]);
      try {
        await adminApi.createCategory({
          name: newItem.name,
          image: '/cements/ultratech-super-ppc.png',
          status: 'active'
        });
      } catch (err) {
        console.warn('[Admin Portal] Failed to save category to backend:', err);
      }
    }
    if (type === 'brands') {
      setBrands([newItem, ...brands]);
      try {
        await adminApi.createBrand(newItem);
      } catch (err) {
        console.warn('[Admin Portal] Failed to save brand to backend:', err);
      }
    }
    if (type === 'customers') {
      setCustomers([newItem, ...customers]);
      try {
        await adminApi.createCustomer(newItem);
      } catch (err) {
        console.warn('[Admin Portal] Failed to save customer to backend:', err);
      }
    }
    if (type === 'payments') {
      setPayments([newItem, ...payments]);
      try {
        await adminApi.createPayment(newItem);
      } catch (err) {
        console.warn('[Admin Portal] Failed to save payment to backend:', err);
      }
    }
  };

  return (
    <div className="admin-app-layout">
      {/* Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        adminUser={adminUser}
        onLogout={onLogout}
      />

      {/* Mobile Drawer Overlay Backdrop */}
      {mobileMenuOpen && (
        <div 
          className="sidebar-mobile-backdrop" 
          onClick={() => setMobileMenuOpen(false)} 
        />
      )}

      {/* Main Content Area */}
      <div className="main-wrapper">
        {/* Web Header */}
        <Header 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          mobileMenuOpen={mobileMenuOpen} 
          setMobileMenuOpen={setMobileMenuOpen}
          onOpenAddModal={() => setIsModalOpen(true)}
        />

        {/* Dynamic Panel Views */}
        <main className="page-container">
          {activeTab === 'dashboard' && (
            <DashboardPanel 
              setActiveTab={setActiveTab} 
              orders={orders} 
              products={products}
              brands={brands}
              customers={customers}
              payments={payments}
              stats={dashboardStats}
            />
          )}

          {activeTab === 'products' && (
            <ProductsPanel 
              products={products} 
              setProducts={setProducts}
              brands={brands}
              onUpdateProduct={handleUpdateProduct}
              onToggleProduct={handleToggleProduct}
              onToggleCementType={handleToggleCementType}
              onDeleteProduct={handleDeleteProduct}
              onOpenAddModal={() => setIsModalOpen(true)} 
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryPanel 
              products={products} 
              setProducts={setProducts}
              brands={brands}
              onUpdateProduct={handleUpdateProduct}
            />
          )}

          {activeTab === 'categories' && (
            <CategoriesPanel 
              categories={categories} 
              setCategories={setCategories}
              brands={brands}
              setBrands={setBrands}
              products={products}
              setProducts={setProducts}
              onToggleBrand={handleToggleBrand}
              onToggleProduct={handleToggleProduct}
              onToggleCementType={handleToggleCementType}
              onUpdateBrand={handleUpdateBrand}
              onOpenAddModal={() => setIsModalOpen(true)} 
            />
          )}

          {activeTab === 'orders' && (
            <OrdersPanel 
              orders={orders} 
              setOrders={setOrders} 
              onUpdateOrderStatus={handleUpdateOrderStatus}
              onUpdateOrderEta={handleUpdateOrderEta}
            />
          )}

          {activeTab === 'customers' && (
            <CustomersPanel 
              customers={customers} 
              onOpenAddModal={() => setIsModalOpen(true)} 
              onDeleteCustomer={handleDeleteCustomer}
            />
          )}

          {activeTab === 'agents' && (
            <AgentsPanel />
          )}

          {activeTab === 'cities' && (
            <CitiesPanel />
          )}

          {activeTab === 'payments' && (
            <PaymentsPanel 
              payments={payments} 
              setPayments={setPayments} 
              onUpdatePaymentStatus={handleUpdatePaymentStatus}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsPanel 
              products={products}
              brands={brands}
              orders={orders}
              payments={payments}
            />
          )}
        </main>
      </div>

      {/* Reusable Add Modal */}
      <AddModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        activeTab={activeTab}
        brands={brands}
        onAddItem={handleAddItem}
      />
    </div>
  );
}

