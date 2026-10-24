import React, { useEffect, useState } from 'react';
import { Check, X, Wallet } from 'lucide-react';
import adminApi from '../services/api';

const formatINR = (n) => '₹' + (Number(n) || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
const formatDate = (iso) => {
  const d = iso ? new Date(iso) : null;
  return d && !isNaN(d.getTime()) ? d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
};

const STATUS_STYLE = {
  Pending: { background: '#dbeafe', color: '#1d4ed8', label: 'Pending' },
  Approved: { background: '#dcfce7', color: '#166534', label: 'Paid' },
  Rejected: { background: '#fee2e2', color: '#b91c1c', label: 'Rejected' },
};

/**
 * Agent withdrawal requests. Approving marks the request's commissions as Paid;
 * rejecting releases them so the agent can request again.
 */
export default function WithdrawalsPanel({ onChanged }) {
  const [filter, setFilter] = useState('Pending');
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);

  const load = (status) => {
    setIsLoading(true);
    adminApi.getWithdrawals(status === 'All' ? '' : status).then((res) => {
      if (res?.success && Array.isArray(res.data)) setRequests(res.data);
      setIsLoading(false);
    });
  };

  useEffect(() => {
    load(filter);
  }, [filter]);

  const handleApprove = async (req) => {
    const reference = window.prompt(
      `Approve payout of ${formatINR(req.amount)} to ${req.agent?.fullName || 'this agent'}?\n\nEnter the payment reference (UPI / bank transaction ID), or leave blank:`,
      ''
    );
    if (reference === null) return; // cancelled
    setBusyId(req.id);
    const res = await adminApi.updateWithdrawal(req.id, { status: 'Approved', payoutReference: reference });
    setBusyId(null);
    if (!res?.success) {
      alert(res?.message || 'Could not approve the withdrawal.');
      return;
    }
    load(filter);
    onChanged?.();
  };

  const handleReject = async (req) => {
    const reason = window.prompt(`Reject ${req.agent?.fullName || 'this agent'}'s request for ${formatINR(req.amount)}?\n\nReason (shown to the agent):`, '');
    if (reason === null) return;
    if (!reason.trim()) {
      alert('Please enter a reason so the agent knows why.');
      return;
    }
    setBusyId(req.id);
    const res = await adminApi.updateWithdrawal(req.id, { status: 'Rejected', adminNote: reason });
    setBusyId(null);
    if (!res?.success) {
      alert(res?.message || 'Could not reject the withdrawal.');
      return;
    }
    load(filter);
    onChanged?.();
  };

  return (
    <div className="web-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
        <div>
          <h3 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 800, color: '#0f172a' }}>Withdrawal Requests</h3>
          <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
            Agents can withdraw commission from delivered orders. Approving marks those commissions as paid.
          </span>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          {['Pending', 'Approved', 'Rejected', 'All'].map((s) => (
            <button
              key={s}
              type="button"
              className={`nav-item ${filter === s ? 'active' : ''}`}
              style={{ padding: '6px 14px', width: 'auto', fontSize: '0.82rem', margin: 0, borderRadius: '6px' }}
              onClick={() => setFilter(s)}
            >
              {s === 'Approved' ? 'Paid' : s}
            </button>
          ))}
        </div>
      </div>

      <div className="table-responsive">
        <table className="web-table">
          <thead>
            <tr>
              <th>Agent</th>
              <th>Amount</th>
              <th>Orders</th>
              <th>Requested</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: '#64748b' }}>Loading requests...</td></tr>
            ) : requests.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                  <Wallet size={32} color="#cbd5e1" style={{ display: 'block', margin: '0 auto 8px' }} />
                  {filter === 'Pending' ? 'No withdrawal requests waiting for approval.' : 'No withdrawal requests here.'}
                </td>
              </tr>
            ) : (
              requests.map((req) => {
                const st = STATUS_STYLE[req.status];
                return (
                  <tr key={req.id}>
                    <td>
                      <div style={{ fontWeight: 800, color: '#0f172a' }}>{req.agent?.fullName || 'Deleted agent'}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {[req.agent?.city, req.agent?.phone].filter(Boolean).join(' · ')}
                      </div>
                    </td>
                    <td style={{ fontWeight: 800, color: '#047857', fontSize: '0.95rem' }}>{formatINR(req.amount)}</td>
                    <td>{req.orderCount}</td>
                    <td>{formatDate(req.createdAt)}</td>
                    <td>
                      <span style={{ padding: '3px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700, background: st.background, color: st.color }}>
                        {st.label}
                      </span>
                      {req.status === 'Approved' && req.payoutReference && (
                        <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '4px' }}>Ref: {req.payoutReference}</div>
                      )}
                      {req.status === 'Rejected' && req.adminNote && (
                        <div style={{ fontSize: '0.72rem', color: '#b91c1c', marginTop: '4px', maxWidth: '220px' }}>{req.adminNote}</div>
                      )}
                      {req.status !== 'Pending' && (
                        <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: '2px' }}>{formatDate(req.processedAt)}</div>
                      )}
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {req.status === 'Pending' && (
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button
                            type="button"
                            className="btn-action-deliver"
                            disabled={busyId === req.id}
                            onClick={() => handleApprove(req)}
                            style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                          >
                            <Check size={14} /> <span>Approve & Pay</span>
                          </button>
                          <button
                            type="button"
                            className="btn-action-detail"
                            disabled={busyId === req.id}
                            onClick={() => handleReject(req)}
                            style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                          >
                            <X size={14} color="#b91c1c" /> <span>Reject</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
