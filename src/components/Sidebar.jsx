import React from 'react';
import { 
  LayoutDashboard, 
  Package,
  Warehouse, 
  Tags, 
  ShoppingBag, 
  Users, 
  UserCheck, 
  CreditCard, 
  BarChart3, 
  LogOut,
  MapPin,
  X
} from 'lucide-react';
import PetraLogoMark from './PetraLogoMark';

export default function Sidebar({ activeTab, setActiveTab, mobileMenuOpen, setMobileMenuOpen, products = [], adminUser, onLogout }) {
    const handleNavClick = (tab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  // Compute low/out stock counts for notification badge
  const lowOrOutStockCount = products.filter(p => {
    const s = typeof p.stock === 'number' ? p.stock : parseInt(String(p.stock || '0').replace(/[^0-9]/g, ''), 10);
    return isNaN(s) || s < 100;
  }).length;

  return (
    <aside className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo-group">
          <div className="sidebar-logo">
            <PetraLogoMark size={22} />
          </div>
          <div>
            <div className="sidebar-brand-title">PETRA <span>CEMENTS</span></div>
            <div className="sidebar-subtext">Admin Control Hub</div>
          </div>
        </div>
        <button 
          className="sidebar-mobile-close-btn"
          onClick={() => setMobileMenuOpen(false)}
          title="Close Navigation"
          aria-label="Close Navigation"
        >
          <X size={18} />
        </button>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Management Panels</div>
        
        <button 
          className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => handleNavClick('dashboard')}
        >
          <div className="nav-item-icon"><LayoutDashboard size={18} /></div>
          <span>Dashboard</span>
        </button>

        <button 
          className={`nav-item ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => handleNavClick('products')}
        >
          <div className="nav-item-icon"><Package size={18} /></div>
          <span>Products</span>
        </button>

                <button 
          className={`nav-item ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => handleNavClick('inventory')}
          title="Warehouse Stock Management & Replenishment"
        >
          <div className="nav-item-icon"><Warehouse size={18} /></div>
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <span>Stock Management</span>
            {lowOrOutStockCount > 0 && (
              <span style={{
                background: '#dc2626',
                color: '#ffffff',
                fontSize: '0.68rem',
                fontWeight: 800,
                padding: '1px 6px',
                borderRadius: '10px',
                marginLeft: '6px'
              }}>
                {lowOrOutStockCount} Alert
              </span>
            )}
          </span>
        </button>

<button 
          className={`nav-item ${activeTab === 'categories' ? 'active' : ''}`}
          onClick={() => handleNavClick('categories')}
        >
          <div className="nav-item-icon"><Tags size={18} /></div>
          <span>Categories</span>
        </button>

        <button 
          className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => handleNavClick('orders')}
        >
          <div className="nav-item-icon"><ShoppingBag size={18} /></div>
          <span>Orders</span>
        </button>

        <button 
          className={`nav-item ${activeTab === 'customers' ? 'active' : ''}`}
          onClick={() => handleNavClick('customers')}
        >
          <div className="nav-item-icon"><Users size={18} /></div>
          <span>Customers</span>
        </button>

        <button
          className={`nav-item ${activeTab === 'cities' ? 'active' : ''}`}
          onClick={() => handleNavClick('cities')}
        >
          <div className="nav-item-icon"><MapPin size={18} /></div>
          <span>Cities & Commission</span>
        </button>

        <button
          className={`nav-item ${activeTab === 'agents' ? 'active' : ''}`}
          onClick={() => handleNavClick('agents')}
        >
          <div className="nav-item-icon"><UserCheck size={18} /></div>
          <span>Field Agents</span>
        </button>

        <button 
          className={`nav-item ${activeTab === 'payments' ? 'active' : ''}`}
          onClick={() => handleNavClick('payments')}
        >
          <div className="nav-item-icon"><CreditCard size={18} /></div>
          <span>Payments</span>
        </button>

        <button 
          className={`nav-item ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => handleNavClick('reports')}
        >
          <div className="nav-item-icon"><BarChart3 size={18} /></div>
          <span>Reports & Insights</span>
        </button>
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile-widget">
          <div className="user-info">
            <div className="user-avatar-badge">{(adminUser?.fullName || 'Admin').charAt(0).toUpperCase()}</div>
            <div className="user-details">
              <span className="user-name">Welcome back, {adminUser?.fullName || 'Admin'}</span>
              <span className="user-role">Super Administrator</span>
            </div>
          </div>
          <button 
            className="btn-icon-logout" 
            title="Sign Out"
            onClick={onLogout}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
