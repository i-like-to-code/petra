import React, { useState, useMemo } from 'react';
import { 
  CreditCard, 
  Download, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Calendar, 
  Search, 
  FileText, 
  X, 
  Printer, 
  Check, 
  ArrowUpRight,
  ShieldCheck,
  Building2,
  RefreshCw
} from 'lucide-react';

export default function PaymentsPanel({ 
  payments = [], 
  setPayments, 
  onUpdatePaymentStatus,
  orders = []
}) {
  // Timeframe Filter: 'week' | 'month' | 'year' | 'all'
  const [timeframe, setTimeframe] = useState('month');
  
  // Status Filter: 'All' | 'Paid' | 'Pending' | 'Failed'
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Search Query
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Payment for Receipt Modal
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // Helper to parse payment date into a valid Date object
  const parseDate = (item) => {
    if (item.createdAt) {
      const d = new Date(item.createdAt);
      if (!isNaN(d.getTime())) return d;
    }
    if (item.date) {
      const raw = String(item.date).trim();
      const withYear = raw.includes('202') ? raw : `${raw} 2026`;
      const d = new Date(withYear);
      if (!isNaN(d.getTime())) return d;
    }
    return new Date();
  };

  // Merge payments with any live user orders to guarantee ALL real user activity appears
  const allMergedPayments = useMemo(() => {
    const list = [...payments];
    const existingOrderCodes = new Set(list.map(p => p.orderCode).filter(Boolean));

    // If an order from the user mobile app isn't already in payments list, dynamically append it
    if (Array.isArray(orders)) {
      orders.forEach(ord => {
        const orderNum = ord.code || ord.orderNumber || '';
        if (orderNum && !existingOrderCodes.has(orderNum)) {
          const custName = ord.customer || (ord.shippingAddress && ord.shippingAddress.fullName) || 'Direct Customer';
          const initials = custName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'CU';
          const num = typeof ord.totalAmount === 'number' ? ord.totalAmount : (parseInt(String(ord.amount || ord.totalAmount).replace(/[^0-9]/g, '')) || 0);
          const payMode = ord.paymentMethod === 'online' ? 'UPI / NetBanking' : 
                          ord.paymentMethod === 'cod' ? 'Cash on Delivery (COD)' : 
                          ord.paymentMethod === 'bank_transfer' ? 'Bank NEFT' : 'Online Payment';
          const status = ord.paymentStatus === 'paid' ? 'Paid' : (ord.paymentStatus === 'failed' ? 'Failed' : 'Pending');

          list.push({
            id: ord.id || ord._id || orderNum,
            _id: ord._id || ord.id,
            name: custName,
            initials,
            mode: payMode,
            date: ord.createdAt ? new Date(ord.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'Today',
            amount: '₹' + num.toLocaleString('en-IN'),
            numericAmount: num,
            status,
            orderCode: orderNum,
            referenceId: `UPI-${orderNum.replace(/[^0-9]/g, '') || '9820'}`,
            createdAt: ord.createdAt || new Date().toISOString(),
          });
          existingOrderCodes.add(orderNum);
        }
      });
    }

    return list;
  }, [payments, orders]);

  // Filter payments by selected Timeframe (Week / Month / Year / All)
  const timeframePayments = useMemo(() => {
    const now = new Date('2026-10-17T12:00:00'); // Align with current calendar date

    return allMergedPayments.filter(pay => {
      if (timeframe === 'all') return true;

      const pDate = parseDate(pay);
      const diffMs = now.getTime() - pDate.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      if (timeframe === 'week') {
        // Last 7 days or same calendar week
        return diffDays >= -1 && diffDays <= 7;
      }

      if (timeframe === 'month') {
        // Same month & year (or last 30 days)
        return (
          (pDate.getMonth() === now.getMonth() && pDate.getFullYear() === now.getFullYear()) ||
          (diffDays >= -1 && diffDays <= 31)
        );
      }

      if (timeframe === 'year') {
        // Same year
        return pDate.getFullYear() === now.getFullYear() || diffDays <= 365;
      }

      return true;
    });
  }, [allMergedPayments, timeframe]);

  // KPI Calculations based on the active timeframe
  const totalPaid = useMemo(() => {
    return timeframePayments
      .filter(p => p.status === 'Paid')
      .reduce((sum, p) => sum + (p.numericAmount || parseInt(String(p.amount).replace(/[^0-9]/g, '')) || 0), 0);
  }, [timeframePayments]);

  const totalPending = useMemo(() => {
    return timeframePayments
      .filter(p => p.status === 'Pending')
      .reduce((sum, p) => sum + (p.numericAmount || parseInt(String(p.amount).replace(/[^0-9]/g, '')) || 0), 0);
  }, [timeframePayments]);

  const totalOverall = totalPaid + totalPending;
  const settlementRate = totalOverall > 0 
    ? ((totalPaid / totalOverall) * 100).toFixed(1) + '%' 
    : '100.0%';

  // Status counters for the current timeframe
  const counts = useMemo(() => ({
    All: timeframePayments.length,
    Paid: timeframePayments.filter(p => p.status === 'Paid').length,
    Pending: timeframePayments.filter(p => p.status === 'Pending').length,
    Failed: timeframePayments.filter(p => p.status === 'Failed').length,
  }), [timeframePayments]);

  // Final Filtered list matching Status and Search query
  const displayPayments = useMemo(() => {
    return timeframePayments.filter(pay => {
      // Status filter
      if (statusFilter !== 'All' && pay.status !== statusFilter) return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const name = (pay.name || '').toLowerCase();
        const mode = (pay.mode || '').toLowerCase();
        const code = (pay.orderCode || '').toLowerCase();
        const ref = (pay.referenceId || '').toLowerCase();
        const amt = (pay.amount || '').toLowerCase();
        return name.includes(q) || mode.includes(q) || code.includes(q) || ref.includes(q) || amt.includes(q);
      }
      return true;
    });
  }, [timeframePayments, statusFilter, searchQuery]);

  const handleStatusChange = (id, newStatus) => {
    if (onUpdatePaymentStatus) {
      onUpdatePaymentStatus(id, newStatus);
    } else if (setPayments) {
      setPayments(payments.map(p => p.id === id ? { ...p, status: newStatus } : p));
    }
  };

  // Export Financial Statement as CSV
  const handleExportStatement = () => {
    const timeframeTitle = timeframe === 'week' ? 'Weekly' : timeframe === 'month' ? 'Monthly' : timeframe === 'year' ? 'Yearly' : 'All_Time';
    const filename = `Petra_Cements_${timeframeTitle}_Statement_${new Date().toISOString().slice(0, 10)}.csv`;

    const headers = ['Transaction Ref', 'Order Code', 'Customer / Firm', 'Payment Mode', 'Date', 'Amount (INR)', 'Status'];
    const rows = displayPayments.map(p => [
      `"${p.referenceId || 'N/A'}"`,
      `"${p.orderCode || 'N/A'}"`,
      `"${(p.name || '').replace(/"/g, '""')}"`,
      `"${p.mode || 'UPI'}"`,
      `"${p.date || ''} 2026"`,
      p.numericAmount || parseInt(String(p.amount).replace(/[^0-9]/g, '')) || 0,
      `"${p.status || 'Paid'}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrintReceipt = (pay) => {
    const printWindow = window.open('', '_blank', 'width=750,height=800');
    if (!printWindow) {
      alert('Please allow popups to view and print the transaction receipt.');
      return;
    }

    const ref = pay.referenceId || `TXN-${Date.now().toString().slice(-6)}`;
    const amt = pay.amount || '₹0';
    const dateStr = pay.date ? `${pay.date} 2026` : '17 Oct 2026';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Payment Receipt - ${ref}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #0f172a; margin: 0; }
          .receipt-box { border: 2px solid #e2e8f0; border-radius: 12px; padding: 30px; max-width: 600px; margin: 0 auto; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; }
          .logo { font-size: 22px; font-weight: 800; color: #dc2626; }
          .logo span { color: #0f172a; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 25px 0; }
          .item-label { font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: 700; margin-bottom: 4px; }
          .item-value { font-size: 15px; font-weight: 600; color: #0f172a; }
          .total-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-top: 20px; }
          .total-row { display: flex; justify-content: space-between; font-size: 18px; font-weight: 800; color: #dc2626; }
          .badge { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 700; background: #dcfce7; color: #166534; }
          .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #94a3b8; }
          @media print { body { padding: 0; } .receipt-box { border: none; } }
        </style>
      </head>
      <body>
        <div class="receipt-box">
          <div class="header">
            <div>
              <div class="logo">PETRA <span>CEMENTS</span></div>
              <div style="font-size: 12px; color: #64748b; margin-top: 2px;">Official Payment & Settlement Voucher</div>
            </div>
            <div style="text-align: right;">
              <span class="badge">RECONCILED PAID</span>
              <div style="font-size: 12px; color: #64748b; margin-top: 4px;">Ref: ${ref}</div>
            </div>
          </div>

          <div class="grid">
            <div>
              <div class="item-label">Customer / Contractor</div>
              <div class="item-value">${pay.name || 'Contractor'}</div>
            </div>
            <div>
              <div class="item-label">Payment Mode</div>
              <div class="item-value">${pay.mode || 'UPI / NetBanking'}</div>
            </div>
            <div>
              <div class="item-label">Transaction Date</div>
              <div class="item-value">${dateStr}</div>
            </div>
            <div>
              <div class="item-label">Order Code</div>
              <div class="item-value">${pay.orderCode || 'Direct Dispatch'}</div>
            </div>
          </div>

          <div class="total-card">
            <div class="total-row">
              <span>Gross Settled Amount:</span>
              <span>${amt}</span>
            </div>
          </div>

          <div class="footer">
            Petra Cements Financial Division · Verified Online Settlement Record
          </div>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const timeframeLabel = timeframe === 'week' ? 'This Week' : timeframe === 'month' ? 'This Month' : timeframe === 'year' ? 'This Year' : 'All Time';

  return (
    <div>
      {/* Scoped CSS for Modern Timeframe Tabs and Receipt Design */}
      <style>{`
        .timeframe-pill-container {
          display: flex;
          align-items: center;
          gap: 6px;
          background: #f1f5f9;
          padding: 4px;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
        }
        .timeframe-pill-btn {
          border: none;
          background: transparent;
          padding: 6px 14px;
          border-radius: 7px;
          font-size: 0.82rem;
          font-weight: 700;
          color: #64748b;
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 5px;
        }
        .timeframe-pill-btn:hover {
          color: #0f172a;
        }
        .timeframe-pill-btn.active {
          background: #ffffff;
          color: #dc2626;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .pay-search-input-wrap {
          display: flex;
          align-items: center;
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 7px 12px;
          width: 280px;
          max-width: 100%;
          transition: all 0.2s ease;
        }
        .pay-search-input-wrap:focus-within {
          border-color: #dc2626;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
        }
        .pay-search-input {
          border: none;
          background: transparent;
          outline: none;
          font-size: 0.82rem;
          color: #0f172a;
          margin-left: 6px;
          width: 100%;
        }

        .status-chip-btn {
          border: 1px solid #e2e8f0;
          background: #ffffff;
          padding: 5px 12px;
          border-radius: 20px;
          font-size: 0.78rem;
          font-weight: 600;
          color: #475569;
          cursor: pointer;
          transition: all 0.2s ease;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .status-chip-btn:hover {
          border-color: #cbd5e1;
          background: #f8fafc;
        }
        .status-chip-btn.active {
          border-color: #dc2626;
          background: #fef2f2;
          color: #dc2626;
        }

        .btn-receipt-action {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          font-size: 0.74rem;
          font-weight: 600;
          color: #2563eb;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .btn-receipt-action:hover {
          background: #dbeafe;
          border-color: #93c5fd;
          transform: translateY(-1px);
        }
      `}</style>

      {/* Top Bar: Timeframe Selector & Export Button */}
      <div className="web-card" style={{ marginBottom: '20px', padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Financial Settlement Period
            </div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>
              {timeframeLabel} Collections
            </div>
          </div>

          {/* Timeframe Selector Buttons (Week / Month / Year / All) */}
          <div className="timeframe-pill-container">
            {[
              { id: 'week', label: 'This Week' },
              { id: 'month', label: 'This Month' },
              { id: 'year', label: 'This Year' },
              { id: 'all', label: 'All Time' },
            ].map(tf => (
              <button
                key={tf.id}
                type="button"
                className={`timeframe-pill-btn ${timeframe === tf.id ? 'active' : ''}`}
                onClick={() => setTimeframe(tf.id)}
              >
                <Calendar size={13} />
                <span>{tf.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3 Dynamic KPI Cards (Automatically update based on Week / Month / Year) */}
      <div className="kpi-grid-3" style={{ marginBottom: '24px' }}>
        {/* Card 1: Received Amount */}
        <div className="web-card kpi-card">
          <div className="kpi-info">
            <span className="kpi-label">Received ({timeframeLabel})</span>
            <span className="kpi-value">₹{totalPaid.toLocaleString('en-IN')}</span>
            <span className="kpi-sub" style={{ color: '#166534', fontWeight: 600 }}>
              Verified Gross Collections
            </span>
          </div>
          <div className="kpi-icon-box" style={{ background: '#dcfce7', color: '#15803d', borderColor: '#bbf7d0' }}>
            <CheckCircle2 size={24} />
          </div>
        </div>

        {/* Card 2: Pending Collection */}
        <div className="web-card kpi-card">
          <div className="kpi-info">
            <span className="kpi-label">Pending Collection ({timeframeLabel})</span>
            <span className="kpi-value">₹{totalPending.toLocaleString('en-IN')}</span>
            <span className="kpi-sub" style={{ color: '#92400e', fontWeight: 600 }}>
              Awaiting Settlement
            </span>
          </div>
          <div className="kpi-icon-box" style={{ background: '#fef3c7', color: '#b45309', borderColor: '#fde68a' }}>
            <Clock size={24} />
          </div>
        </div>

        {/* Card 3: Reconciled Settlement Rate */}
        <div className="web-card kpi-card">
          <div className="kpi-info">
            <span className="kpi-label">Reconciled Settlement</span>
            <span className="kpi-value">{settlementRate}</span>
            <span className="kpi-sub" style={{ color: '#1e40af', fontWeight: 600 }}>
              Settlement Success Rate ({timeframeLabel})
            </span>
          </div>
          <div className="kpi-icon-box" style={{ background: '#dbeafe', color: '#1d4ed8', borderColor: '#bfdbfe' }}>
            <CreditCard size={24} />
          </div>
        </div>
      </div>

      {/* Payments Table Card */}
      <div className="web-card">
        {/* Card Top Header */}
        <div className="web-card-header" style={{ flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <h3 className="web-card-title">Transaction Log ({timeframeLabel})</h3>
            <span className="web-card-subtitle">
              Live user payments & settlements for cement dispatches · {displayPayments.length} transactions
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {/* Real-time Search Box */}
            <div className="pay-search-input-wrap">
              <Search size={14} color="#94a3b8" />
              <input
                type="text"
                placeholder="Search customer, order, mode..."
                className="pay-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#94a3b8' }}
                  onClick={() => setSearchQuery('')}
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Export Statement Button */}
            <button 
              className="btn-quick-action" 
              onClick={handleExportStatement}
              style={{ padding: '0 16px', height: '36px', fontSize: '0.82rem', gap: '6px' }}
              title="Download official CSV financial statement"
            >
              <Download size={14} /> 
              <span>Export Statement</span>
            </button>
          </div>
        </div>

        {/* Status Filter Chips Row */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {[
            { id: 'All', label: 'All', count: counts.All },
            { id: 'Paid', label: 'Paid / Settled', count: counts.Paid },
            { id: 'Pending', label: 'Pending', count: counts.Pending },
            { id: 'Failed', label: 'Failed', count: counts.Failed },
          ].map(chip => (
            <button
              key={chip.id}
              type="button"
              className={`status-chip-btn ${statusFilter === chip.id ? 'active' : ''}`}
              onClick={() => setStatusFilter(chip.id)}
            >
              <span>{chip.label}</span>
              <span style={{ 
                background: statusFilter === chip.id ? '#dc2626' : '#f1f5f9',
                color: statusFilter === chip.id ? '#ffffff' : '#64748b',
                padding: '1px 6px',
                borderRadius: '10px',
                fontSize: '0.72rem',
                fontWeight: 700
              }}>
                {chip.count}
              </span>
            </button>
          ))}
        </div>

        {/* Transactions Table */}
        <div className="table-responsive">
          <table className="web-table">
            <thead>
              <tr>
                <th>Customer / Firm</th>
                <th>Payment Mode</th>
                <th>Transaction Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {displayPayments.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                      <CreditCard size={32} color="#cbd5e1" />
                      <div style={{ fontWeight: 700, color: '#334155' }}>No transactions found for {timeframeLabel}</div>
                      <div style={{ fontSize: '0.8rem' }}>
                        {searchQuery ? 'Try adjusting your search keywords.' : `Switch timeframe tabs to view historical payments.`}
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                displayPayments.map(pay => {
                  const isPaid = pay.status === 'Paid';
                  const isPending = pay.status === 'Pending';
                  const isFailed = pay.status === 'Failed';
                  const payAmount = pay.numericAmount 
                    ? `₹${pay.numericAmount.toLocaleString('en-IN')}` 
                    : pay.amount;

                  return (
                    <tr key={pay.id || pay._id || pay.referenceId}>
                      {/* Customer / Firm */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div 
                            className="user-avatar-badge" 
                            style={{ 
                              background: '#f1f5f9', 
                              color: '#0f172a', 
                              fontWeight: 800,
                              width: '36px',
                              height: '36px',
                              borderRadius: '9px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '0.8rem'
                            }}
                          >
                            {pay.initials || 'CU'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, color: '#0f172a' }}>{pay.name}</div>
                            {pay.orderCode && (
                              <span style={{ 
                                fontSize: '0.7rem', 
                                background: '#f8fafc', 
                                color: '#64748b', 
                                padding: '1px 6px', 
                                borderRadius: '4px',
                                border: '1px solid #e2e8f0',
                                fontWeight: 700
                              }}>
                                {pay.orderCode}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Payment Mode */}
                      <td style={{ fontWeight: 700, color: '#475569' }}>
                        {pay.mode}
                      </td>

                      {/* Transaction Date */}
                      <td style={{ color: '#64748b', fontSize: '0.84rem' }}>
                        {pay.date ? `${pay.date} 2026` : 'Recent'}
                      </td>

                      {/* Amount */}
                      <td style={{ fontWeight: 800, color: '#dc2626', fontSize: '0.98rem' }}>
                        {payAmount}
                      </td>

                      {/* Status Badge */}
                      <td>
                        {isPaid && (
                          <span className="badge-paid" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle2 size={12} /> Paid
                          </span>
                        )}
                        {isPending && (
                          <span className="badge-pending" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} /> Pending
                          </span>
                        )}
                        {isFailed && (
                          <span style={{ 
                            background: '#fef2f2', 
                            color: '#991b1b', 
                            fontSize: '0.72rem', 
                            fontWeight: 700, 
                            padding: '4px 10px', 
                            borderRadius: '999px', 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '4px',
                            border: '1px solid #fecaca'
                          }}>
                            <XCircle size={12} /> Failed
                          </span>
                        )}
                      </td>

                      {/* Action */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {isPaid && (
                            <>
                              <span style={{ fontSize: '0.74rem', color: '#059669', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                <Check size={12} /> Settled
                              </span>
                              <button
                                type="button"
                                className="btn-receipt-action"
                                onClick={() => handlePrintReceipt(pay)}
                                title="Print payment receipt"
                              >
                                <FileText size={11} />
                                <span>Receipt</span>
                              </button>
                            </>
                          )}

                          {isPending && (
                            <button 
                              className="btn-quick-action"
                              style={{ padding: '4px 10px', fontSize: '0.74rem', background: '#10b981', borderColor: '#059669', color: '#fff' }}
                              onClick={() => handleStatusChange(pay.id || pay._id, 'Paid')}
                            >
                              <CheckCircle2 size={12} style={{ marginRight: '4px' }} /> Confirm Paid
                            </button>
                          )}

                          {isFailed && (
                            <button 
                              className="btn-quick-action"
                              style={{ padding: '4px 10px', fontSize: '0.74rem', background: '#f1f5f9', borderColor: '#cbd5e1', color: '#0f172a' }}
                              onClick={() => handleStatusChange(pay.id || pay._id, 'Pending')}
                            >
                              <RefreshCw size={11} style={{ marginRight: '4px' }} /> Retry
                            </button>
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
    </div>
  );
}
