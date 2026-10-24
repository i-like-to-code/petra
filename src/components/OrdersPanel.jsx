import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Check, 
  X, 
  Truck, 
  CheckCircle2, 
  Eye, 
  MapPin, 
  Building2, 
  CreditCard, 
  PackageCheck, 
  Printer, 
  Search, 
  Clock
} from 'lucide-react';

const ORDER_STATUSES = ['Pending', 'Dispatched', 'Delivered', 'Cancelled'];

// 'YYYY-MM-DD' for <input type="date"> from an ISO date (local day)
const toDateInputValue = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const formatEta = (iso) => {
  const d = iso ? new Date(iso) : null;
  return d && !isNaN(d.getTime()) ? d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
};

const paymentStatusLabel = (order) => {
  if (order.paymentStatus === 'paid') return { text: 'Paid in full', color: '#16a34a' };
  if (order.paymentStatus === 'partial') return { text: 'Advance paid (20%)', color: '#b45309' };
  if (order.paymentStatus === 'failed') return { text: 'Payment failed', color: '#dc2626' };
  return { text: order.paymentMethod === 'cod' ? 'Pay on delivery' : 'Not paid yet', color: '#b45309' };
};

export default function OrdersPanel({ orders = [], setOrders, onUpdateOrderStatus, onUpdateOrderEta }) {
  const [filterTab, setFilterTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Status counters
  const counts = {
    All: orders.length,
    Pending: orders.filter(o => o.status === 'Pending').length,
    Dispatched: orders.filter(o => o.status === 'Dispatched').length,
    Delivered: orders.filter(o => o.status === 'Delivered').length,
    Cancelled: orders.filter(o => o.status === 'Cancelled').length,
  };

  const filteredOrders = orders.filter(ord => {
    // Tab filter
    if (filterTab !== 'All' && ord.status !== filterTab) return false;
    
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const code = (ord.code || ord.orderNumber || '').toLowerCase();
      const customer = (ord.customer || '').toLowerCase();
      const location = (ord.location || '').toLowerCase();
      const details = (ord.details || '').toLowerCase();
      return code.includes(q) || customer.includes(q) || location.includes(q) || details.includes(q);
    }
    return true;
  });

  const handleStatusChange = async (id, newStatus) => {
    if (newStatus === 'Cancelled' && !window.confirm('Cancel this order? Its stock is returned and the agent\'s unpaid commission is removed.')) {
      return;
    }
    if (onUpdateOrderStatus) {
      const ok = await onUpdateOrderStatus(id, newStatus);
      if (ok === false) return;
    } else if (setOrders) {
      setOrders(orders.map(o => (o.id === id || o.code === id) ? { ...o, status: newStatus } : o));
    }
    // If the modal for this order is open, update selectedOrder state too
    if (selectedOrder && (selectedOrder.id === id || selectedOrder.code === id)) {
      setSelectedOrder(prev => ({ ...prev, status: newStatus, orderStatus: newStatus.toLowerCase() }));
    }
  };

  const handleEtaChange = async (id, date) => {
    if (!onUpdateOrderEta) return;
    const ok = await onUpdateOrderEta(id, date);
    if (ok && selectedOrder && (selectedOrder.id === id || selectedOrder.code === id)) {
      setSelectedOrder(prev => ({ ...prev, estimatedDelivery: date ? new Date(`${date}T12:00:00`).toISOString() : null }));
    }
  };

  const handlePrintInvoice = (order) => {
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) {
      alert('Please allow popups to view and print the tax invoice.');
      return;
    }

    const orderNumber = order.code || order.orderNumber || 'PC-ORDER';
    const customer = order.customer || 'Valued Customer';
    const location = order.location || 'Tamil Nadu';
    const amount = order.amount || ('₹' + (order.totalAmount || 0).toLocaleString('en-IN'));
    const details = order.details || 'Cement Consignment';
    const dateStr = order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : new Date().toLocaleDateString('en-IN');
    const paymentMethod = order.paymentMethod ? String(order.paymentMethod).toUpperCase() : 'ONLINE / UPI';
    const fullAddress = order.shippingAddress 
      ? `${order.shippingAddress.addressLine1 || ''}, ${order.shippingAddress.city || ''} ${order.shippingAddress.pincode || ''}`
      : `${location} Hub, Tamil Nadu`;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Tax Invoice - ${orderNumber}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1e293b; padding: 40px; margin: 0; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; }
          .logo { font-size: 24px; font-weight: 800; color: #dc2626; }
          .logo span { color: #0f172a; }
          .invoice-tag { text-align: right; }
          .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin: 30px 0; }
          .meta-box h4 { margin: 0 0 8px 0; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
          .meta-box p { margin: 0; font-size: 14px; font-weight: 600; }
          table { width: 100%; border-collapse: collapse; margin: 25px 0; }
          th { background: #f8fafc; border-bottom: 2px solid #cbd5e1; padding: 12px; text-align: left; font-size: 12px; color: #475569; text-transform: uppercase; }
          td { padding: 14px 12px; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
          .total-box { margin-left: auto; width: 300px; padding: 15px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }
          .total-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
          .total-row.grand { border-top: 2px solid #cbd5e1; margin-top: 8px; padding-top: 10px; font-size: 18px; font-weight: 800; color: #dc2626; }
          .footer { text-align: center; margin-top: 50px; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="logo">PETRA <span>CEMENTS</span></div>
            <div style="font-size: 13px; color: #64748b; margin-top: 4px;">Direct Construction Logistics & Procurement</div>
            <div style="font-size: 12px; color: #94a3b8;">GSTIN: 33AAACP8921K1ZM · Tamil Nadu, India</div>
          </div>
          <div class="invoice-tag">
            <h2 style="margin: 0; color: #0f172a;">TAX INVOICE</h2>
            <div style="font-size: 15px; font-weight: 700; color: #dc2626; margin-top: 4px;">#${orderNumber}</div>
            <div style="font-size: 13px; color: #64748b;">Date: ${dateStr}</div>
          </div>
        </div>

        <div class="meta-grid">
          <div class="meta-box">
            <h4>Billed & Shipped To:</h4>
            <p>${customer}</p>
            <p style="font-weight: 400; color: #475569; margin-top: 4px;">${fullAddress}</p>
            ${order.shippingAddress?.phone ? `<p style="font-weight: 400; color: #475569;">Contact: ${order.shippingAddress.phone}</p>` : ''}
          </div>
          <div class="meta-box">
            <h4>Dispatch & Payment Info:</h4>
            <p>Payment Mode: ${paymentMethod}</p>
            <p style="font-weight: 400; color: #475569; margin-top: 4px;">Fulfillment: ${order.status || 'Verified'}</p>
            <p style="font-weight: 400; color: #475569;">Regional Hub: ${location} Hub</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Consignment Description</th>
              <th>Packaging</th>
              <th>Rate / Unit</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1</td>
              <td><strong>${details}</strong><div style="font-size: 12px; color: #64748b;">IS Certified Structural Grade Cement</div></td>
              <td>50 kg HDPE Bag</td>
              <td>Standard Bulk</td>
              <td style="text-align: right; font-weight: 700;">${amount}</td>
            </tr>
          </tbody>
        </table>

        <div class="total-box">
          <div class="total-row"><span>Consignment Total:</span><span>${amount}</span></div>
          <div class="total-row"><span>GST (28% Included):</span><span>Included</span></div>
          <div class="total-row"><span>Site Freight / Unloading:</span><span style="color: #16a34a; font-weight: 600;">FREE</span></div>
          <div class="total-row grand"><span>Total Payable:</span><span>${amount}</span></div>
        </div>

        <div class="footer">
          This is an official system-generated tax invoice for Petra Cements construction supplies. Authorized by Super Administrator.
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 300);
  };

  return (
    <div>
      {/* Scoped CSS Styles for Sleek Button & Modal Redesigns */}
      <style>{`
        .orders-header-card {
          background: #ffffff;
          border-radius: 14px;
          border: 1px solid #e2e8f0;
          padding: 20px 24px;
          margin-bottom: 20px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }
        .orders-filter-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }
        .orders-search-wrapper {
          display: flex;
          align-items: center;
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          border-radius: 9px;
          padding: 8px 14px;
          width: 320px;
          max-width: 100%;
          transition: all 0.2s ease;
        }
        .orders-search-wrapper:focus-within {
          border-color: #dc2626;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
        }
        .orders-search-input {
          border: none;
          background: transparent;
          outline: none;
          font-size: 0.85rem;
          color: #0f172a;
          margin-left: 8px;
          width: 100%;
        }

        /* Redesigned Action Buttons */
        .order-actions-cell {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: nowrap;
        }

        /* Completed Tag */
        .badge-action-completed {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 5px 12px;
          font-size: 0.76rem;
          font-weight: 700;
          color: #047857;
          background: #ecfdf5;
          border: 1px solid #a7f3d0;
          border-radius: 20px;
          white-space: nowrap;
        }

        /* Table Status Badges */
        .badge-status-pending {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: #fef3c7;
          color: #92400e;
          border: 1px solid #fde68a;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 0.74rem;
          font-weight: 700;
        }
        .badge-status-dispatched {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: #dbeafe;
          color: #1e40af;
          border: 1px solid #bfdbfe;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 0.74rem;
          font-weight: 700;
        }
        .badge-status-delivered {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: #dcfce7;
          color: #166534;
          border: 1px solid #bbf7d0;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 0.74rem;
          font-weight: 700;
        }

        /* Full Details Modal Styling */
        .order-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.7);
          backdrop-filter: blur(5px);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: modalFadeIn 0.2s ease-out;
        }
        .order-modal-dialog {
          background: #ffffff;
          border-radius: 18px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          width: 760px;
          max-width: 100%;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: modalSlideUp 0.25s ease-out;
        }
        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .order-modal-header {
          padding: 20px 24px;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #f8fafc;
        }
        .order-modal-body {
          padding: 24px;
          overflow-y: auto;
          flex: 1;
        }
        .order-modal-footer {
          padding: 16px 24px;
          border-top: 1px solid #e2e8f0;
          background: #f8fafc;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          flex-wrap: wrap;
        }

        /* Modal Lifecycle Step Tracker */
        .order-tracker-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 18px 20px;
          margin-bottom: 22px;
        }
        .order-tracker-steps {
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: relative;
        }
        .tracker-step-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          z-index: 2;
          width: 120px;
          text-align: center;
        }
        .tracker-icon-circle {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 8px;
          transition: all 0.2s ease;
        }
        .tracker-circle-done {
          background: #16a34a;
          color: #ffffff;
          box-shadow: 0 0 0 4px #dcfce7;
        }
        .tracker-circle-active {
          background: #2563eb;
          color: #ffffff;
          box-shadow: 0 0 0 4px #dbeafe;
        }
        .tracker-circle-pending {
          background: #e2e8f0;
          color: #94a3b8;
        }
        .tracker-step-title {
          font-size: 0.78rem;
          font-weight: 700;
          color: #0f172a;
        }
        .tracker-step-sub {
          font-size: 0.7rem;
          color: #64748b;
          margin-top: 2px;
        }
        .tracker-line-connector {
          position: absolute;
          top: 18px;
          left: 60px;
          right: 60px;
          height: 3px;
          background: #e2e8f0;
          z-index: 1;
        }
        .tracker-line-fill {
          height: 100%;
          background: #16a34a;
          transition: width 0.3s ease;
        }

        /* 2-Column Info Grid */
        .order-detail-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 22px;
        }
        @media (max-width: 640px) {
          .order-detail-grid {
            grid-template-columns: 1fr;
          }
        }
        .order-info-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 16px 18px;
        }
        .order-info-card-title {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #64748b;
          font-weight: 700;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .order-info-row {
          display: flex;
          justify-content: space-between;
          padding: 5px 0;
          font-size: 0.84rem;
        }
        .order-info-label {
          color: #64748b;
        }
        .order-info-val {
          font-weight: 600;
          color: #0f172a;
          text-align: right;
        }

        /* Consignment Bag Table */
        .consignment-box {
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          overflow: hidden;
        }
        .consignment-header {
          background: #f8fafc;
          padding: 12px 18px;
          border-bottom: 1px solid #e2e8f0;
          font-size: 0.78rem;
          font-weight: 700;
          color: #475569;
          text-transform: uppercase;
          display: flex;
          justify-content: space-between;
        }
        .consignment-item-row {
          padding: 14px 18px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid #f1f5f9;
        }
        .consignment-item-row:last-child {
          border-bottom: none;
        }
      `}</style>

      {/* Top Filter & Search Bar */}
      <div className="orders-header-card">
        <div className="orders-filter-row">
          <div>
            <h2 className="web-card-title" style={{ fontSize: '1.25rem', margin: 0, fontWeight: 800 }}>
              Order Management
            </h2>
            <span className="web-card-subtitle" style={{ fontSize: '0.84rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
              {orders.length} active construction orders tracked live across Tamil Nadu
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {/* Search Box */}
            <div className="orders-search-wrapper">
              <Search size={15} color="#94a3b8" />
              <input
                type="text"
                placeholder="Search order code, customer, product..."
                className="orders-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#94a3b8' }}
                  onClick={() => setSearchQuery('')}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Filter Tabs with Live Counters */}
            <div style={{ display: 'flex', gap: '6px' }}>
              {[
                { key: 'All', label: 'All', count: counts.All },
                { key: 'Pending', label: 'Pending', count: counts.Pending },
                { key: 'Dispatched', label: 'Dispatched', count: counts.Dispatched },
                { key: 'Delivered', label: 'Delivered', count: counts.Delivered },
                { key: 'Cancelled', label: 'Cancelled', count: counts.Cancelled },
              ].map(tab => (
                <button 
                  key={tab.key}
                  className={`nav-item ${filterTab === tab.key ? 'active' : ''}`}
                  style={{ 
                    padding: '6px 14px', 
                    width: 'auto', 
                    fontSize: '0.82rem', 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '6px' 
                  }}
                  onClick={() => setFilterTab(tab.key)}
                >
                  <span>{tab.label}</span>
                  <span style={{ 
                    fontSize: '0.72rem', 
                    padding: '1px 6px', 
                    borderRadius: '10px', 
                    background: filterTab === tab.key ? '#dc2626' : '#e2e8f0',
                    color: filterTab === tab.key ? '#ffffff' : '#475569',
                    fontWeight: 700
                  }}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Orders Desktop Table */}
      <div className="web-card">
        <div className="table-responsive">
          <table className="web-table">
            <thead>
              <tr>
                <th style={{ width: '130px' }}>Order Code</th>
                <th>Customer & Location</th>
                <th>Product & Quantity</th>
                <th>Amount</th>
                <th style={{ width: '130px' }}>Status</th>
                <th style={{ width: '250px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '48px 20px', color: '#64748b' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                      <ShoppingBag size={38} color="#cbd5e1" />
                      <div style={{ fontWeight: 700, fontSize: '1rem', color: '#334155' }}>No orders found</div>
                      <div style={{ fontSize: '0.82rem' }}>
                        {searchQuery ? 'No orders match your search criteria. Clear search to view all.' : 'No orders in this status category.'}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map(ord => {
                  const orderCode = ord.code || ord.orderNumber || (ord.id ? 'PC-' + String(ord.id).slice(-5).toUpperCase() : 'PC-20000');
                  const isPending = ord.status === 'Pending';
                  const isDispatched = ord.status === 'Dispatched';
                  const isDelivered = ord.status === 'Delivered';

                  return (
                    <tr key={ord.id || ord.code}>
                      <td>
                        <span 
                          className="order-code-badge" 
                          style={{ cursor: 'pointer' }}
                          title="Click to view details"
                          onClick={() => setSelectedOrder(ord)}
                        >
                          {orderCode}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 800, color: '#0f172a' }}>{ord.customer || 'Direct Contractor'}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                          <MapPin size={11} color="#94a3b8" />
                          <span>{ord.location || 'Chennai'} Hub</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>{ord.details || 'Cement Consignment'}</div>
                      </td>
                      <td style={{ fontWeight: 800, color: '#dc2626', fontSize: '0.98rem' }}>
                        {ord.amount}
                      </td>
                      <td>
                        {isPending && (
                          <span className="badge-status-pending">
                            <Clock size={11} /> Pending
                          </span>
                        )}
                        {isDispatched && (
                          <span className="badge-status-dispatched">
                            <Truck size={11} /> Dispatched
                          </span>
                        )}
                        {isDelivered && (
                          <span className="badge-status-delivered">
                            <CheckCircle2 size={11} /> Delivered
                          </span>
                        )}
                        {ord.status === 'Cancelled' && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 10px', borderRadius: '999px', background: '#f1f5f9', color: '#64748b', fontSize: '0.75rem', fontWeight: 700 }}>
                            <X size={11} /> Cancelled
                          </span>
                        )}
                        {(isPending || isDispatched) && (
                          <div style={{ fontSize: '0.72rem', color: ord.estimatedDelivery ? '#475569' : '#b45309', marginTop: '4px', fontWeight: 600 }}>
                            {ord.estimatedDelivery ? `ETA ${formatEta(ord.estimatedDelivery)}` : 'No ETA set'}
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="order-actions-cell">
                          {/* SHOW FULL DETAIL BUTTON */}
                          <button 
                            className="btn-action-detail"
                            onClick={() => setSelectedOrder(ord)}
                            title="View full order breakdown, customer info & tax invoice"
                          >
                            <Eye size={13} color="#2563eb" />
                            <span>Details</span>
                          </button>

                          {/* REDESIGNED DISPATCH BUTTON */}
                          {isPending && (
                            <button 
                              className="btn-action-dispatch"
                              onClick={() => handleStatusChange(ord.id || ord.code, 'Dispatched')}
                              title="Dispatch truck consignment from plant hub"
                            >
                              <Truck size={13} />
                              <span>Dispatch</span>
                            </button>
                          )}

                          {/* REDESIGNED MARK DELIVERED BUTTON */}
                          {isDispatched && (
                            <button 
                              className="btn-action-deliver"
                              onClick={() => handleStatusChange(ord.id || ord.code, 'Delivered')}
                              title="Confirm unloading and complete delivery"
                            >
                              <CheckCircle2 size={13} />
                              <span>Mark Delivered</span>
                            </button>
                          )}

                          {/* COMPLETED PILL */}
                          {isDelivered && (
                            <span className="badge-action-completed">
                              <CheckCircle2 size={13} />
                              <span>Delivered</span>
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FULL ORDER DETAILS MODAL */}
      {selectedOrder && (
        <div className="order-modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="order-modal-dialog" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="order-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  background: '#dc2626',
                  color: '#ffffff',
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <PackageCheck size={20} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="order-code-badge" style={{ fontSize: '0.9rem' }}>
                      {selectedOrder.code || selectedOrder.orderNumber}
                    </span>
                    <span className={
                      selectedOrder.status === 'Pending' ? 'badge-status-pending' :
                      selectedOrder.status === 'Dispatched' ? 'badge-status-dispatched' :
                      selectedOrder.status === 'Cancelled' ? '' : 'badge-status-delivered'
                    } style={selectedOrder.status === 'Cancelled' ? { padding: '3px 10px', borderRadius: '999px', background: '#f1f5f9', color: '#64748b', fontSize: '0.75rem', fontWeight: 700 } : undefined}>
                      {selectedOrder.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                    Consignment Order Details & Fulfillment Tracking
                  </div>
                </div>
              </div>

              <button 
                type="button" 
                className="modal-close-btn"
                onClick={() => setSelectedOrder(null)}
                style={{ cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="order-modal-body">
              {/* Order Fulfillment Lifecycle Tracker */}
              <div className="order-tracker-box">
                <div className="order-tracker-steps">
                  <div className="tracker-line-connector">
                    <div 
                      className="tracker-line-fill" 
                      style={{ 
                        width: selectedOrder.status === 'Delivered' ? '100%' : selectedOrder.status === 'Dispatched' ? '50%' : '0%' 
                      }} 
                    />
                  </div>

                  {/* Step 1: Placed */}
                  <div className="tracker-step-item">
                    <div className="tracker-icon-circle tracker-circle-done">
                      <Check size={18} />
                    </div>
                    <div className="tracker-step-title">Order Placed</div>
                    <div className="tracker-step-sub">Verified & Confirmed</div>
                  </div>

                  {/* Step 2: Dispatched */}
                  <div className="tracker-step-item">
                    <div className={`tracker-icon-circle ${
                      selectedOrder.status === 'Delivered' ? 'tracker-circle-done' :
                      selectedOrder.status === 'Dispatched' ? 'tracker-circle-active' : 'tracker-circle-pending'
                    }`}>
                      <Truck size={18} />
                    </div>
                    <div className="tracker-step-title">Dispatched</div>
                    <div className="tracker-step-sub">
                      {selectedOrder.status === 'Pending' ? 'Pending Transit' : 'Out for Site Delivery'}
                    </div>
                  </div>

                  {/* Step 3: Delivered */}
                  <div className="tracker-step-item">
                    <div className={`tracker-icon-circle ${
                      selectedOrder.status === 'Delivered' ? 'tracker-circle-done' : 'tracker-circle-pending'
                    }`}>
                      <CheckCircle2 size={18} />
                    </div>
                    <div className="tracker-step-title">Delivered</div>
                    <div className="tracker-step-sub">
                      {selectedOrder.status === 'Delivered' ? 'Site Offloaded' : 'Awaiting Delivery'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery status & estimated arrival (both shown to the customer in the app) */}
              <div className="order-info-card" style={{ marginBottom: '16px' }}>
                <div className="order-info-card-title">
                  <Clock size={14} color="#dc2626" />
                  <span>Delivery Status & Estimated Arrival</span>
                </div>
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>
                    ORDER STATUS
                    <select
                      className="web-form-select"
                      value={selectedOrder.status}
                      onChange={(e) => handleStatusChange(selectedOrder.id || selectedOrder.code, e.target.value)}
                      style={{ minWidth: '180px' }}
                    >
                      {ORDER_STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.75rem', fontWeight: 700, color: '#475569' }}>
                    ESTIMATED DELIVERY DATE
                    <input
                      type="date"
                      className="web-form-input"
                      value={toDateInputValue(selectedOrder.estimatedDelivery)}
                      onChange={(e) => handleEtaChange(selectedOrder.id || selectedOrder.code, e.target.value)}
                      disabled={selectedOrder.status === 'Delivered' || selectedOrder.status === 'Cancelled'}
                    />
                  </label>
                  {selectedOrder.estimatedDelivery && selectedOrder.status !== 'Delivered' && selectedOrder.status !== 'Cancelled' && (
                    <button
                      type="button"
                      className="btn-action-detail"
                      onClick={() => handleEtaChange(selectedOrder.id || selectedOrder.code, '')}
                      style={{ height: '44px' }}
                    >
                      Clear date
                    </button>
                  )}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '10px' }}>
                  The customer sees this status and date on their Orders page. Without a date, they see &quot;Arrival date to be confirmed&quot;.
                </div>
              </div>

              {/* 2-Column Info Grid */}
              <div className="order-detail-grid">
                {/* Column 1: Customer & Site Info */}
                <div className="order-info-card">
                  <div className="order-info-card-title">
                    <Building2 size={14} color="#dc2626" />
                    <span>Customer & Delivery Site</span>
                  </div>
                  <div className="order-info-row">
                    <span className="order-info-label">Customer / Firm:</span>
                    <span className="order-info-val">{selectedOrder.customer || 'Contractor'}</span>
                  </div>
                  <div className="order-info-row">
                    <span className="order-info-label">Phone Contact:</span>
                    <span className="order-info-val">
                      {selectedOrder.shippingAddress?.phone || '+91 98765 43210'}
                    </span>
                  </div>
                  <div className="order-info-row">
                    <span className="order-info-label">Regional Hub:</span>
                    <span className="order-info-val">{selectedOrder.location || 'Chennai'} Hub</span>
                  </div>
                  <div className="order-info-row" style={{ alignItems: 'flex-start' }}>
                    <span className="order-info-label">Site Address:</span>
                    <span className="order-info-val" style={{ maxWidth: '60%' }}>
                      {selectedOrder.shippingAddress?.addressLine1 
                        ? `${selectedOrder.shippingAddress.addressLine1}, ${selectedOrder.shippingAddress.city || ''} ${selectedOrder.shippingAddress.pincode || ''}`
                        : `Plot ${selectedOrder.code?.slice(-4) || '102'}, Construction Site, ${selectedOrder.location || 'Chennai'}, Tamil Nadu`}
                    </span>
                  </div>
                </div>

                {/* Column 2: Payment & Financials */}
                <div className="order-info-card">
                  <div className="order-info-card-title">
                    <CreditCard size={14} color="#2563eb" />
                    <span>Payment & Invoicing</span>
                  </div>
                  <div className="order-info-row">
                    <span className="order-info-label">Payment Method:</span>
                    <span className="order-info-val">
                      {selectedOrder.paymentMethod ? String(selectedOrder.paymentMethod).toUpperCase() : 'UPI / NetBanking'}
                    </span>
                  </div>
                  <div className="order-info-row">
                    <span className="order-info-label">Payment Status:</span>
                    <span className="order-info-val" style={{ color: paymentStatusLabel(selectedOrder).color }}>
                      {paymentStatusLabel(selectedOrder).text}
                    </span>
                  </div>
                  <div className="order-info-row">
                    <span className="order-info-label">GST Compliance:</span>
                    <span className="order-info-val">28% GST Included</span>
                  </div>
                  <div className="order-info-row">
                    <span className="order-info-label">Site Freight:</span>
                    <span className="order-info-val" style={{ color: '#16a34a' }}>FREE Bulk Logistics</span>
                  </div>
                  <div className="order-info-row" style={{ borderTop: '1px solid #e2e8f0', marginTop: '6px', paddingTop: '8px' }}>
                    <span className="order-info-label" style={{ fontWeight: 700, color: '#0f172a' }}>Total Amount:</span>
                    <span className="order-info-val" style={{ color: '#dc2626', fontSize: '1.05rem', fontWeight: 800 }}>
                      {selectedOrder.amount}
                    </span>
                  </div>
                </div>
              </div>

              {/* Consignment Products Breakdown */}
              <div className="consignment-box">
                <div className="consignment-header">
                  <span>Ordered Consignment Items</span>
                  <span>Packaging: 50 KG Moisture-Proof HDPE</span>
                </div>
                <div className="consignment-item-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '42px',
                      height: '42px',
                      borderRadius: '8px',
                      background: '#fff1f2',
                      border: '1px solid #fecdd3',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#dc2626'
                    }}>
                      <ShoppingBag size={20} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.92rem' }}>
                        {selectedOrder.details || 'Cement Consignment'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                        Grade Standard: Certified High Compressive Strength
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, color: '#dc2626', fontSize: '1rem' }}>
                      {selectedOrder.amount}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>
                      In Stock & Assigned
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="order-modal-footer">
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className="btn-action-detail"
                  onClick={() => handlePrintInvoice(selectedOrder)}
                  style={{ padding: '8px 16px', fontSize: '0.82rem' }}
                >
                  <Printer size={15} color="#475569" />
                  <span>Print Tax Invoice</span>
                </button>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                {selectedOrder.status === 'Pending' && (
                  <button
                    type="button"
                    className="btn-action-dispatch"
                    style={{ padding: '8px 18px', fontSize: '0.82rem' }}
                    onClick={() => handleStatusChange(selectedOrder.id || selectedOrder.code, 'Dispatched')}
                  >
                    <Truck size={15} />
                    <span>Dispatch Order Now</span>
                  </button>
                )}

                {selectedOrder.status === 'Dispatched' && (
                  <button
                    type="button"
                    className="btn-action-deliver"
                    style={{ padding: '8px 18px', fontSize: '0.82rem' }}
                    onClick={() => handleStatusChange(selectedOrder.id || selectedOrder.code, 'Delivered')}
                  >
                    <CheckCircle2 size={15} />
                    <span>Confirm Delivery to Site</span>
                  </button>
                )}

                {selectedOrder.status === 'Delivered' && (
                  <span className="badge-action-completed" style={{ padding: '8px 16px', fontSize: '0.82rem' }}>
                    <CheckCircle2 size={16} />
                    <span>Delivery Verified & Complete</span>
                  </span>
                )}

                <button
                  type="button"
                  className="nav-item"
                  style={{ width: 'auto', padding: '8px 16px', fontSize: '0.82rem', margin: 0 }}
                  onClick={() => setSelectedOrder(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
