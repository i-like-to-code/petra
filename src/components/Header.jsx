import React, { useState, useRef, useEffect } from 'react';
import { 
  Menu, 
  X, 
  Bell, 
  Search, 
  ShoppingBag, 
  AlertTriangle, 
  CheckCircle2, 
  Users, 
  Check, 
  Clock, 
  ChevronRight,
  Sparkles
} from 'lucide-react';

export default function Header({ 
  activeTab = 'dashboard',
  mobileMenuOpen, 
  setMobileMenuOpen,
  setActiveTab
}) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'order',
      title: 'New Order Received',
      code: 'PC-20458',
      desc: 'Ravi Kumar (RK Infra) ordered 100 bags of UltraTech OPC 53 Grade',
      amount: '₹42,500',
      time: '12m ago',
      unread: true,
      tab: 'orders'
    },
    {
      id: 2,
      type: 'stock',
      title: 'Low Stock Alert',
      code: 'UltraTech Super PPC',
      desc: 'Warehouse inventory reached warning threshold (140 bags left)',
      time: '35m ago',
      unread: true,
      tab: 'products'
    },
    {
      id: 3,
      type: 'payment',
      title: 'Payment Confirmed',
      code: '₹79,000',
      desc: 'Arun Builders cleared invoice for 200 bags Dalmia DSP via RTGS',
      time: '2h ago',
      unread: false,
      tab: 'payments'
    },
    {
      id: 4,
      type: 'customer',
      title: 'New Contractor Registered',
      code: 'Sri Murugan Traders',
      desc: 'Contractor profile verified for bulk wholesale cement pricing',
      time: '5h ago',
      unread: false,
      tab: 'customers'
    }
  ]);

  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  const unreadCount = notifications.filter(n => n.unread).length;

  const handleMarkAllRead = (e) => {
    e.stopPropagation();
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
  };

  const handleNotificationClick = (item) => {
    // Mark clicked item as read
    setNotifications(prev => prev.map(n => n.id === item.id ? { ...n, unread: false } : n));
    setShowNotifications(false);
    if (item.tab && setActiveTab) {
      setActiveTab(item.tab);
    }
  };

  const getIconForType = (type) => {
    switch (type) {
      case 'order':
        return (
          <div className="notification-icon-wrap" style={{ background: '#ecfdf5', color: '#059669' }}>
            <ShoppingBag size={17} />
          </div>
        );
      case 'stock':
        return (
          <div className="notification-icon-wrap" style={{ background: '#fffbeb', color: '#d97706' }}>
            <AlertTriangle size={17} />
          </div>
        );
      case 'payment':
        return (
          <div className="notification-icon-wrap" style={{ background: '#eff6ff', color: '#2563eb' }}>
            <CheckCircle2 size={17} />
          </div>
        );
      case 'customer':
      default:
        return (
          <div className="notification-icon-wrap" style={{ background: '#faf5ff', color: '#7e22ce' }}>
            <Users size={17} />
          </div>
        );
    }
  };

  return (
    <header className="web-header">
      <div className="header-left">
        <button 
          className="mobile-toggle-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <div className="header-title-group">
          <h1 className="page-title">
            {activeTab === 'dashboard' && 'Dashboard Overview'}
            {activeTab === 'products' && 'Product Formulations'}
            {activeTab === 'categories' && 'Brands & Grade Categories'}
            {activeTab === 'inventory' && 'Warehouse Cement Stock'}
            {activeTab === 'orders' && 'Consignment Orders'}
            {activeTab === 'customers' && 'Contractors & Customers'}
            {activeTab === 'agents' && 'Field Sales Agents'}
            {activeTab === 'cities' && 'Cities & Agent Commission'}
            {activeTab === 'payments' && 'Payment Transactions'}
            {activeTab === 'reports' && 'Reports & Insights'}
          </h1>
          <span className="page-subtitle">Petra Cements Ltd. Official Web Admin Portal</span>
        </div>
      </div>

      <div className="header-right">
        {/* Global Search Bar */}
        <div className="header-search-container">
          <Search size={16} className="header-search-icon" />
          <input 
            type="text" 
            placeholder="Search products, orders, customers..." 
            className="header-search-input"
          />
        </div>

        {/* Notifications Bell & Dropdown Popover */}
        <div className="notification-wrapper" ref={dropdownRef}>
          <button 
            type="button"
            className={`btn-notification ${showNotifications ? 'active' : ''}`}
            title="Notifications"
            onClick={() => setShowNotifications(prev => !prev)}
            aria-expanded={showNotifications}
            aria-haspopup="true"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}
          </button>

          {/* Interactive Notification Popover Panel */}
          {showNotifications && (
            <div className="notification-dropdown">
              {/* Header */}
              <div className="notification-header">
                <div className="notification-header-title">
                  <Bell size={16} style={{ color: '#dc2626' }} />
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                    <span className="notification-count-badge">
                      {unreadCount} New
                    </span>
                  )}
                </div>

                {unreadCount > 0 && (
                  <button 
                    type="button" 
                    className="notification-mark-all" 
                    onClick={handleMarkAllRead}
                    title="Mark all notifications as read"
                  >
                    <Check size={14} />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>

              {/* Notification List */}
              <div className="notification-list">
                {notifications.length === 0 ? (
                  <div style={{ padding: '32px 20px', textAlign: 'center', color: '#94a3b8' }}>
                    <Sparkles size={28} style={{ color: '#cbd5e1', marginBottom: '8px' }} />
                    <p style={{ margin: 0, fontSize: '0.86rem', fontWeight: 600 }}>All caught up!</p>
                    <span style={{ fontSize: '0.74rem' }}>No new notifications at this time</span>
                  </div>
                ) : (
                  notifications.map((item) => (
                    <div 
                      key={item.id} 
                      className={`notification-item ${item.unread ? 'unread' : ''}`}
                      onClick={() => handleNotificationClick(item)}
                    >
                      {getIconForType(item.type)}

                      <div className="notification-content">
                        <div className="notification-title">
                          <span>{item.title}</span>
                          {item.code && (
                            <span style={{ fontSize: '0.72rem', color: '#dc2626', fontWeight: 800 }}>
                              {item.code}
                            </span>
                          )}
                        </div>
                        <div className="notification-desc">
                          {item.desc}
                        </div>
                        <div className="notification-time">
                          <Clock size={11} />
                          <span>{item.time}</span>
                          <span style={{ margin: '0 4px', color: '#cbd5e1' }}>•</span>
                          <span style={{ color: '#64748b' }}>Click to view</span>
                        </div>
                      </div>

                      
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="notification-footer">
                <button 
                  type="button" 
                  className="notification-footer-btn"
                  onClick={() => {
                    setShowNotifications(false);
                    if (setActiveTab) setActiveTab('orders');
                  }}
                >
                  <span>View All Orders Activity</span>
                  <ChevronRight size={14} />
                </button>
                <button 
                  type="button" 
                  className="notification-footer-btn"
                  style={{ color: '#94a3b8' }}
                  onClick={() => setShowNotifications(false)}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
