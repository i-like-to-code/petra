import React, { useEffect, useState } from 'react';
import { X, Pencil, Mail, Phone, MapPin, Calendar, Save } from 'lucide-react';
import adminApi from '../services/api';

const STATUSES = ['Active On Site', 'In Transit', 'Client Meeting', 'Offline'];
const formatINR = (n) => '₹' + (Number(n) || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
const formatDate = (iso) => {
  const d = iso ? new Date(iso) : null;
  return d && !isNaN(d.getTime()) ? d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
};

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '8px',
  background: '#ffffff',
  border: '1px solid #cbd5e1',
  color: '#0f172a',
  fontSize: '0.9rem',
  boxSizing: 'border-box',
};
const labelStyle = { display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '6px' };

/**
 * View an agent's profile and commission totals, and edit their details.
 * `cityHolder` maps lowercase city name -> agent holding it (one agent per city).
 */
export default function AgentDetailsModal({ agentId, initialMode = 'view', cityOptions = [], cityHolder = {}, onClose, onSaved }) {
  const [mode, setMode] = useState(initialMode);
  const [agent, setAgent] = useState(null);
  const [form, setForm] = useState(null);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    adminApi.getAgentDetails(agentId).then((res) => {
      if (res?.success && res.data) {
        setAgent(res.data);
        setForm({
          fullName: res.data.fullName,
          email: res.data.email,
          phone: res.data.phone,
          city: res.data.city || '',
          status: res.data.status,
          password: '',
        });
      } else {
        setError(res?.message || 'Could not load this agent.');
      }
    });
  }, [agentId]);

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    const payload = {
      fullName: form.fullName,
      email: form.email,
      phone: form.phone,
      city: form.city,
      status: form.status,
      ...(form.password.trim() ? { password: form.password.trim() } : {}),
    };
    setIsSaving(true);
    const res = await adminApi.updateAgent(agentId, payload);
    setIsSaving(false);
    if (!res?.success) {
      setError(res?.message || 'Could not save changes.');
      return;
    }
    onSaved?.();
    // Reload details so stats and fields reflect the saved state
    const fresh = await adminApi.getAgentDetails(agentId);
    if (fresh?.success) setAgent(fresh.data);
    setForm((f) => ({ ...f, password: '' }));
    setMode('view');
  };

  const stats = agent?.stats;

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '16px' }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: '#ffffff', borderRadius: '16px', width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 40px rgba(15,23,42,0.25)' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid #f1f5f9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#dc2626', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
              {(agent?.fullName || '?').split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a' }}>{agent?.fullName || 'Loading...'}</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                {mode === 'edit' ? 'Edit agent' : agent?.agentRole || 'Field Sales Agent'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {mode === 'view' && agent && (
              <button type="button" className="btn-action-detail" onClick={() => setMode('edit')}>
                <Pencil size={14} /> <span>Edit</span>
              </button>
            )}
            <button type="button" className="modal-close-btn" onClick={onClose} aria-label="Close" style={{ cursor: 'pointer' }}>
              <X size={18} />
            </button>
          </div>
        </div>

        <div style={{ padding: '20px 22px' }}>
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', padding: '10px 12px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, marginBottom: '16px' }}>
              {error}
            </div>
          )}

          {!agent || !form ? (
            !error && <div style={{ color: '#64748b', fontSize: '0.9rem' }}>Loading agent...</div>
          ) : mode === 'view' ? (
            <>
              {/* Contact */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px', marginBottom: '20px' }}>
                {[
                  { Icon: Mail, value: agent.email },
                  { Icon: Phone, value: agent.phone },
                  { Icon: MapPin, value: agent.city || 'Unassigned (no city)' },
                  { Icon: Calendar, value: `Joined ${formatDate(agent.createdAt)}` },
                ].map(({ Icon, value }, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem', color: '#334155' }}>
                    <Icon size={15} color="#94a3b8" /> <span>{value}</span>
                  </div>
                ))}
              </div>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '20px' }}>
                {[
                  { label: 'Total commission', value: formatINR(stats.totalEarned) },
                  { label: 'Pending payout', value: formatINR(stats.pending) },
                  { label: 'Paid out', value: formatINR(stats.paid) },
                  { label: 'Orders', value: stats.orders },
                  { label: 'Bags', value: stats.bags.toLocaleString('en-IN') },
                  { label: 'Order value', value: formatINR(stats.orderValue) },
                ].map((s) => (
                  <div key={s.label} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '10px 12px' }}>
                    <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>{s.label}</div>
                    <div style={{ fontSize: '1.05rem', color: '#0f172a', fontWeight: 800, marginTop: '2px' }}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Recent commissions */}
              <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a', marginBottom: '8px' }}>Recent commissions</div>
              {agent.recentCommissions.length === 0 ? (
                <div style={{ fontSize: '0.85rem', color: '#64748b' }}>No commissions yet.</div>
              ) : (
                <div className="table-responsive">
                  <table className="web-table">
                    <thead>
                      <tr>
                        <th>Order</th>
                        <th>Customer</th>
                        <th>Order value</th>
                        <th>Commission</th>
                        <th>Payout</th>
                      </tr>
                    </thead>
                    <tbody>
                      {agent.recentCommissions.map((c) => (
                        <tr key={c.id}>
                          <td style={{ fontWeight: 700 }}>{c.orderId || '—'}</td>
                          <td>{c.customerName}</td>
                          <td>{formatINR(c.orderAmount)}</td>
                          <td style={{ fontWeight: 800, color: '#047857' }}>{formatINR(c.commissionEarned)}</td>
                          <td>
                            <span style={{ padding: '2px 8px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 700, background: c.status === 'Paid' ? '#dcfce7' : '#fef3c7', color: c.status === 'Paid' ? '#166534' : '#b45309' }}>
                              {c.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <form onSubmit={handleSave} style={{ display: 'grid', gap: '14px' }}>
              <div>
                <label style={labelStyle} htmlFor="agent-edit-name">Full name</label>
                <input id="agent-edit-name" required style={inputStyle} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle} htmlFor="agent-edit-email">Email (login)</label>
                  <input id="agent-edit-email" type="email" required style={inputStyle} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle} htmlFor="agent-edit-phone">Phone</label>
                  <input id="agent-edit-phone" required style={inputStyle} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={labelStyle} htmlFor="agent-edit-city">City</label>
                  <select id="agent-edit-city" style={inputStyle} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}>
                    <option value="">Unassigned</option>
                    {cityOptions.map((c) => {
                      const holder = cityHolder[c.toLowerCase()];
                      const takenByOther = holder && String(holder.id) !== String(agentId);
                      return (
                        <option key={c} value={c} disabled={takenByOther}>
                          {takenByOther ? `${c} (${holder.fullName})` : c}
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div>
                  <label style={labelStyle} htmlFor="agent-edit-status">Field status</label>
                  <select id="agent-edit-status" style={inputStyle} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label style={labelStyle} htmlFor="agent-edit-password">New password (optional)</label>
                <input
                  id="agent-edit-password"
                  type="text"
                  autoComplete="new-password"
                  placeholder="Leave blank to keep the current password"
                  style={inputStyle}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
                <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', marginTop: '3px' }}>
                  At least 6 characters. Share the new password with the agent.
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button type="button" className="nav-item" style={{ width: 'auto', padding: '8px 16px', margin: 0 }} onClick={() => setMode('view')}>
                  Cancel
                </button>
                <button type="submit" className="btn-quick-action" disabled={isSaving} style={{ opacity: isSaving ? 0.7 : 1 }}>
                  <Save size={15} /> <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
