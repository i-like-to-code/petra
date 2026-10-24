import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Trash2, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Eye, 
  X, 
  ShoppingBag, 
  IndianRupee, 
  CheckCircle2, 
  TrendingUp, 
  RefreshCw,
  Building2,
  Clock,
  ShieldCheck
} from 'lucide-react';

export default function CustomersPanel({ 
  customers = [], 
  onOpenAddModal, 
  onDeleteCustomer,
  onRefreshCustomers,
  loading = false
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Extract unique locations for filtering
  const uniqueLocations = Array.from(new Set(
    customers.map(c => c.location).filter(Boolean)
  ));

  // Filter customers based on search and location
  const filteredCustomers = customers.filter(c => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || 
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.phone && c.phone.toLowerCase().includes(q)) ||
      (c.location && c.location.toLowerCase().includes(q)) ||
      (c.id && c.id.toLowerCase().includes(q));

    const matchesLocation = selectedLocation === 'All' || c.location === selectedLocation;

    return matchesSearch && matchesLocation;
  });

  // Calculate live stats
  const totalCustomers = customers.length;
  const activeBuyers = customers.filter(c => (c.ordersCount || 0) > 0).length;
  const totalOrdersPlaced = customers.reduce((acc, c) => acc + (Number(c.ordersCount) || 0), 0);
  const totalPurchasesAmount = customers.reduce((acc, c) => acc + (Number(c.numericSpent) || 0), 0);

  const handleRefresh = async () => {
    if (onRefreshCustomers) {
      setIsRefreshing(true);
      try {
        await onRefreshCustomers();
      } finally {
        setTimeout(() => setIsRefreshing(false), 400);
      }
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Oct 2026';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'Oct 2026';
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Oct 2026';
    }
  };

  return (
    <div>
      {/* Top Controls Card */}
      <div className="web-card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 className="web-card-title" style={{ fontSize: '1.25rem', margin: 0 }}>
                Customer & User Directory
              </h2>
            </div>
            <span className="web-card-subtitle" style={{ marginTop: '4px', display: 'block' }}>
              All registered app users, builders and retail buyers across Tamil Nadu
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Search Input */}
            <div className="header-search-container" style={{ width: '280px' }}>
              <Search size={16} className="header-search-icon" />
              <input 
                type="text" 
                placeholder="Search name, phone, email..." 
                className="header-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Location Filter */}
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#0f172a',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <option value="All">All Locations</option>
              {uniqueLocations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              className="btn-secondary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '8px',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                color: '#334155',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
              title="Refresh customer list"
            >
              <RefreshCw size={14} className={isRefreshing ? 'spin-anim' : ''} />
              <span>Refresh</span>
            </button>

            {/* Add Customer Button */}
            <button 
              className="btn-quick-action" 
              onClick={onOpenAddModal}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '8px',
                background: 'var(--petra-gradient, linear-gradient(135deg, #dc2626 0%, #ea580c 100%))',
                color: '#ffffff',
                fontSize: '0.85rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <Plus size={16} />
              <span>Add Customer</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards 4-Column Grid */}
      <div className="kpi-grid-4" style={{ marginBottom: '24px' }}>
        {/* Total Users */}
        <div className="web-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                TOTAL REGISTERED USERS
              </span>
              <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#0f172a', marginTop: '6px' }}>
                {totalCustomers}
              </div>
              <span style={{ fontSize: '0.78rem', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontWeight: 700 }}>
                {totalCustomers} active users
              </span>
            </div>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#fee2e2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={22} />
            </div>
          </div>
        </div>

        {/* Active Buyers */}
        <div className="web-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                ACTIVE PURCHASING BUYERS
              </span>
              <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#0f172a', marginTop: '6px' }}>
                {activeBuyers}
              </div>
              <span style={{ fontSize: '0.78rem', color: '#2563eb', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontWeight: 700 }}>
                {totalCustomers > 0 ? Math.round((activeBuyers / totalCustomers) * 100) : 0}% Buyer Conversion
              </span>
            </div>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#dbeafe', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={22} />
            </div>
          </div>
        </div>

        {/* Total Orders Placed */}
        <div className="web-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                TOTAL ORDERS PLACED
              </span>
              <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#0f172a', marginTop: '6px' }}>
                {totalOrdersPlaced}
              </div>
              <span style={{ fontSize: '0.78rem', color: '#d97706', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontWeight: 700 }}>
                Across Tamil Nadu Hubs
              </span>
            </div>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShoppingBag size={22} />
            </div>
          </div>
        </div>

        {/* Total Purchases Value */}
        <div className="web-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                CUSTOMER LIFETIME PURCHASES
              </span>
              <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#16a34a', marginTop: '6px' }}>
                ₹{totalPurchasesAmount > 0 ? totalPurchasesAmount.toLocaleString('en-IN') : '0'}
              </div>
              <span style={{ fontSize: '0.78rem', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontWeight: 700 }}>
                Total GMV from users
              </span>
            </div>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={22} />
            </div>
          </div>
        </div>
      </div>

      {/* Customers Desktop Table */}
      <div className="web-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="web-table">
            <thead>
              <tr>
                <th style={{ paddingLeft: '20px' }}>Customer Name & Account</th>
                <th>Contact Details</th>
                <th>Location Hub</th>
                <th>Registered Date</th>
                <th>Orders Fulfilled</th>
                <th>Total Purchases</th>
                <th>Status</th>
                <th style={{ textAlign: 'center', paddingRight: '20px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                    <Users size={36} style={{ margin: '0 auto 10px', color: '#cbd5e1', display: 'block' }} />
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: '#334155' }}>No customers found</div>
                    <div style={{ fontSize: '0.85rem' }}>Try clearing your search query or registering a new customer.</div>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map(cust => (
                  <tr key={cust.id || cust._id}>
                    {/* Customer & Avatar */}
                    <td style={{ paddingLeft: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div 
                          className="user-avatar-badge" 
                          style={{ 
                            background: '#f1f5f9', 
                            color: '#0f172a', 
                            fontWeight: 800,
                            border: '1px solid #e2e8f0',
                            width: '38px',
                            height: '38px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: '10px',
                            fontSize: '0.88rem'
                          }}
                        >
                          {cust.initials || 'CU'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '0.94rem', color: '#0f172a' }}>
                            {cust.name}
                          </div>
                          <div style={{ fontSize: '0.73rem', color: '#64748b', marginTop: '2px' }}>
                            User
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Contact Details */}
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {cust.email && (
                          <a 
                            href={`mailto:${cust.email}`}
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '6px', 
                              fontSize: '0.82rem', 
                              color: '#334155', 
                              textDecoration: 'none',
                              fontWeight: 600
                            }}
                          >
                            <Mail size={13} style={{ color: '#dc2626' }} />
                            <span>{cust.email}</span>
                          </a>
                        )}
                        {cust.phone && (
                          <a 
                            href={`tel:${cust.phone}`}
                            style={{ 
                              display: 'flex', 
                              alignItems: 'center', 
                              gap: '6px', 
                              fontSize: '0.82rem', 
                              color: '#64748b', 
                              textDecoration: 'none',
                              fontWeight: 500
                            }}
                          >
                            <Phone size={13} style={{ color: '#16a34a' }} />
                            <span>{cust.phone}</span>
                          </a>
                        )}
                      </div>
                    </td>

                    {/* Location Hub */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#334155', fontSize: '0.88rem' }}>
                        <MapPin size={14} style={{ color: '#dc2626' }} />
                        <span>{cust.location || 'Tamil Nadu'}</span>
                      </div>
                    </td>

                    {/* Date Registered */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>
                        <Calendar size={13} style={{ color: '#64748b' }} />
                        <span>{formatDate(cust.createdAt)}</span>
                      </div>
                    </td>

                    {/* Orders Fulfilled */}
                    <td>
                      {Number(cust.ordersCount) > 0 ? (
                        <span 
                          style={{ 
                            background: '#eff6ff', 
                            color: '#1d4ed8', 
                            fontWeight: 700, 
                            fontSize: '0.82rem',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            border: '1px solid #bfdbfe'
                          }}
                        >
                          {cust.ordersCount} orders
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontStyle: 'italic' }}>
                          0 orders (New)
                        </span>
                      )}
                    </td>

                    {/* Total Purchases */}
                    <td style={{ fontWeight: 800, color: Number(cust.numericSpent) > 0 ? '#dc2626' : '#64748b', fontSize: '0.94rem' }}>
                      {cust.spent || '₹0'}
                    </td>

                    {/* Status */}
                    <td>
                      <span 
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background: cust.status === 'Active' ? '#f0fdf4' : '#f8fafc',
                          color: cust.status === 'Active' ? '#16a34a' : '#64748b',
                          border: cust.status === 'Active' ? '1px solid #bbf7d0' : '1px solid #e2e8f0'
                        }}
                      >
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: cust.status === 'Active' ? '#16a34a' : '#94a3b8' }} />
                        {cust.status || 'Active'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ textAlign: 'center', paddingRight: '20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                        <button
                          onClick={() => setSelectedCustomer(cust)}
                          style={{
                            background: '#f1f5f9',
                            border: '1px solid #cbd5e1',
                            borderRadius: '6px',
                            padding: '6px 10px',
                            cursor: 'pointer',
                            color: '#0f172a',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '0.75rem',
                            fontWeight: 700
                          }}
                          title="View Full Customer Profile"
                        >
                          <Eye size={14} style={{ color: '#2563eb' }} />
                          <span>View</span>
                        </button>

                        <button
                          className="btn-action-delete"
                          style={{ 
                            background: 'transparent', 
                            border: '1px solid #fee2e2', 
                            borderRadius: '6px',
                            cursor: 'pointer', 
                            color: '#dc2626', 
                            padding: '6px' 
                          }}
                          title="Delete Customer"
                          onClick={() => onDeleteCustomer && onDeleteCustomer(cust.id || cust._id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: VIEW ALL CUSTOMER DETAILS */}
      {selectedCustomer && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedCustomer(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '600px',
              width: '100%',
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              border: '1px solid #cbd5e1',
              maxHeight: '90vh',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              zIndex: 100000
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '20px 24px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#f8fafc'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #dc2626 0%, #ea580c 100%)',
                    color: '#ffffff',
                    fontWeight: 900,
                    fontSize: '1.2rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 10px rgba(220, 38, 38, 0.25)'
                  }}
                >
                  {selectedCustomer.initials || 'CU'}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a' }}>
                    {selectedCustomer.name}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      ID: {selectedCustomer.id || selectedCustomer._id}
                    </span>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        background: '#dcfce7',
                        color: '#16a34a',
                        padding: '1px 8px',
                        borderRadius: '10px',
                        fontWeight: 700
                      }}
                    >
                      {selectedCustomer.status || 'Active'}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                style={{
                  background: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  color: '#475569',
                  cursor: 'pointer',
                  padding: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
              {/* Quick Summary Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Orders Count</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#2563eb', marginTop: '2px' }}>
                    {selectedCustomer.ordersCount || 0}
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Total Spent</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#dc2626', marginTop: '2px' }}>
                    {selectedCustomer.spent || '₹0'}
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Account Type</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>
                    'User'
                  </div>
                </div>
              </div>

              {/* Contact & Personal Details Card */}
              <div style={{ background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '16px', marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={16} style={{ color: '#dc2626' }} />
                  Customer Information & Contact
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <span style={{ fontSize: '0.73rem', color: '#64748b', display: 'block', fontWeight: 600 }}>Email Address</span>
                    <a href={`mailto:${selectedCustomer.email}`} style={{ fontSize: '0.88rem', color: '#0f172a', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                      <Mail size={14} style={{ color: '#dc2626' }} />
                      <span>{selectedCustomer.email || 'N/A'}</span>
                    </a>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.73rem', color: '#64748b', display: 'block', fontWeight: 600 }}>Phone Number</span>
                    <a href={`tel:${selectedCustomer.phone}`} style={{ fontSize: '0.88rem', color: '#0f172a', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                      <Phone size={14} style={{ color: '#16a34a' }} />
                      <span>{selectedCustomer.phone || 'N/A'}</span>
                    </a>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.73rem', color: '#64748b', display: 'block', fontWeight: 600 }}>Assigned Location / Hub</span>
                    <div style={{ fontSize: '0.88rem', color: '#0f172a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                      <MapPin size={14} style={{ color: '#dc2626' }} />
                      <span>{selectedCustomer.location || 'Tamil Nadu'}</span>
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.73rem', color: '#64748b', display: 'block', fontWeight: 600 }}>Registered On</span>
                    <div style={{ fontSize: '0.85rem', color: '#0f172a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                      <Calendar size={14} style={{ color: '#64748b' }} />
                      <span>{formatDate(selectedCustomer.createdAt)}</span>
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: '0.73rem', color: '#64748b', display: 'block', fontWeight: 600 }}>Delivery / Shipping Address</span>
                  <div style={{ fontSize: '0.85rem', color: '#334155', fontWeight: 600, marginTop: '3px' }}>
                    {selectedCustomer.fullAddress || (selectedCustomer.location ? `${selectedCustomer.location}, Tamil Nadu` : 'Tamil Nadu, India')}
                  </div>
                </div>
              </div>

              {/* Recent Orders Section */}
              <div style={{ background: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '16px' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShoppingBag size={16} style={{ color: '#dc2626' }} />
                  Recent Cement Orders History
                </h4>

                {selectedCustomer.recentOrders && selectedCustomer.recentOrders.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedCustomer.recentOrders.map((ord, idx) => (
                      <div 
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 12px',
                          background: '#f8fafc',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0f172a' }}>
                            {ord.orderNumber}
                          </div>
                          <div style={{ fontSize: '0.73rem', color: '#64748b', marginTop: '2px' }}>
                            {formatDate(ord.createdAt)} • {ord.itemsCount || 1} cement item(s)
                          </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 800, color: '#dc2626', fontSize: '0.9rem' }}>
                            ₹{Number(ord.totalAmount).toLocaleString('en-IN')}
                          </div>
                          <span
                            style={{
                              fontSize: '0.68rem',
                              padding: '2px 6px',
                              borderRadius: '6px',
                              fontWeight: 700,
                              textTransform: 'capitalize',
                              background: ord.orderStatus === 'delivered' ? '#dcfce7' : ord.orderStatus === 'dispatched' ? '#fef3c7' : '#eff6ff',
                              color: ord.orderStatus === 'delivered' ? '#16a34a' : ord.orderStatus === 'dispatched' ? '#d97706' : '#2563eb'
                            }}
                          >
                            {ord.orderStatus || 'Pending'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#64748b', fontSize: '0.85rem' }}>
                    <Clock size={20} style={{ margin: '0 auto 6px', color: '#cbd5e1', display: 'block' }} />
                    <div>No cement orders placed yet</div>
                    <div style={{ fontSize: '0.75rem', marginTop: '2px' }}>This user has registered and their account is active.</div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: '16px 24px',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'flex-end',
                backgroundColor: '#f8fafc'
              }}
            >
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#475569',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
