import React from 'react';
import { DollarSign, ShoppingBag, Users, Clock, ArrowRight } from 'lucide-react';
import HomeBannerEditor from './HomeBannerEditor';

export default function DashboardPanel({ 
  setActiveTab, 
  orders = [], 
  products = [], 
  customers = [], 
  payments = [], 
  stats = null 
}) {
  const displayTodaySales = stats?.todaySales || '₹0';
  const displayTotalOrders = stats?.totalOrders || orders.length || 0;
  const displayActiveCustomers = stats?.activeCustomers || customers.filter(c => c.status === 'Active').length || 0;
  const displayPendingInvoices = stats?.pendingInvoices || '₹0';

  return (
    <div>
      {/* KPI Cards Grid */}
      <div className="kpi-grid-4">
        <div className="web-card kpi-card">
          <div className="kpi-info">
            <span className="kpi-label">Today's Sales</span>
            <span className="kpi-value">{displayTodaySales}</span>
            <span className="kpi-sub" style={{ color: '#64748b' }}>Orders placed today</span>
          </div>
          <div className="kpi-icon-box"><DollarSign size={24} /></div>
        </div>

        <div className="web-card kpi-card">
          <div className="kpi-info">
            <span className="kpi-label">Total Orders</span>
            <span className="kpi-value">{displayTotalOrders}</span>
            <span className="kpi-sub" style={{ color: '#64748b' }}>All time</span>
          </div>
          <div className="kpi-icon-box"><ShoppingBag size={24} /></div>
        </div>

        <div className="web-card kpi-card">
          <div className="kpi-info">
            <span className="kpi-label">Active Customers</span>
            <span className="kpi-value">{displayActiveCustomers}</span>
            <span className="kpi-sub" style={{ color: '#64748b' }}>Registered customers</span>
          </div>
          <div className="kpi-icon-box"><Users size={24} /></div>
        </div>

        <div className="web-card kpi-card">
          <div className="kpi-info">
            <span className="kpi-label">Pending Invoices</span>
            <span className="kpi-value">{displayPendingInvoices}</span>
            <span className="kpi-sub" style={{ color: '#991b1b' }}>Awaiting settlement</span>
          </div>
          <div className="kpi-icon-box"><Clock size={24} /></div>
        </div>
      </div>

      <HomeBannerEditor />

      {/* Main Charts & Recent Orders Grid */}
      <div className="tracking-web-grid">
        {/* Weekly Sales Chart Card */}
        <div className="web-card">
          <div className="web-card-header">
            <div>
              <h3 className="web-card-title">Weekly Sales Trend</h3>
              <span className="web-card-subtitle">Revenue overview across Tamil Nadu distribution zones</span>
            </div>
            <button className="btn-quick-action" style={{ padding: '4px 12px', fontSize: '0.78rem' }} onClick={() => setActiveTab('reports')}>
              View Analytics <ArrowRight size={14} />
            </button>
          </div>

          <div className="chart-bar-container" style={{ height: '220px' }}>
            <div className="bar-column"><div className="bar-fill" style={{ height: '50%' }}></div><span className="bar-label">M</span></div>
            <div className="bar-column"><div className="bar-fill" style={{ height: '65%' }}></div><span className="bar-label">T</span></div>
            <div className="bar-column"><div className="bar-fill" style={{ height: '40%' }}></div><span className="bar-label">W</span></div>
            <div className="bar-column"><div className="bar-fill" style={{ height: '80%' }}></div><span className="bar-label">T</span></div>
            <div className="bar-column"><div className="bar-fill" style={{ height: '95%', background: '#dc2626' }}></div><span className="bar-label" style={{ color: '#dc2626', fontWeight: 800 }}>F</span></div>
            <div className="bar-column"><div className="bar-fill" style={{ height: '70%' }}></div><span className="bar-label">S</span></div>
            <div className="bar-column"><div className="bar-fill" style={{ height: '85%' }}></div><span className="bar-label">S</span></div>
          </div>
        </div>

        {/* Recent Orders Card */}
        <div className="web-card">
          <div className="web-card-header">
            <div>
              <h3 className="web-card-title">Recent Brand Orders</h3>
              <span className="web-card-subtitle">Latest batch orders placed by distributors & builders</span>
            </div>
            <button className="btn-quick-action" style={{ padding: '4px 12px', fontSize: '0.78rem' }} onClick={() => setActiveTab('orders')}>
              See All <ArrowRight size={14} />
            </button>
          </div>

          <div className="table-responsive">
            <table className="web-table">
              <thead>
                <tr>
                  <th>Order Code</th>
                  <th>Customer & Item</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 5).map(ord => (
                  <tr key={ord.id || ord.code}>
                    <td>
                      <span className="order-code-badge">{ord.code || ord.orderNumber}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700 }}>{ord.customer}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{ord.details}</div>
                    </td>
                    <td style={{ fontWeight: 800, color: '#dc2626' }}>{ord.amount}</td>
                    <td>
                      <span className={
                        ord.status === 'Pending' ? 'badge-pending' :
                        ord.status === 'Dispatched' ? 'badge-dispatched' : 'badge-paid'
                      }>
                        {ord.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
