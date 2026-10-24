import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserCheck, 
  MapPin, 
  BadgePercent, 
  Search, 
  Plus, 
  Trash2, 
  Phone, 
  Mail, 
  Briefcase, 
  CheckCircle2, 
  Clock, 
  Building2, 
  TrendingUp, 
  X,
  Star,
  Eye,
  Pencil,
  Wallet,
} from 'lucide-react';
import adminApi from '../services/api';
import AgentDetailsModal from './AgentDetailsModal';
import WithdrawalsPanel from './WithdrawalsPanel';

export default function AgentsPanel() {
  const [activeSubTab, setActiveSubTab] = useState('roster'); // 'roster' | 'leads' | 'commissions' | 'hubs'
  const [stats, setStats] = useState({
    totalAgents: 0,
    activeAgents: 0,
    totalLeads: 0,
    convertedLeads: 0,
    conversionRate: 0,
    pendingCommissions: 0,
    totalCommissionsPaid: 0,
  });
  const [agents, setAgents] = useState([]);
  const [leads, setLeads] = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('All Cities');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Add Agent Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  // Active delivery cities managed in Cities & Commission; an agent must cover one of them
  const [cityOptions, setCityOptions] = useState([]);
  const [pendingWithdrawalCount, setPendingWithdrawalCount] = useState(0);
  const [newAgent, setNewAgent] = useState({
    fullName: '',
    email: '',
    phone: '',
    city: '',
    agentRole: 'Senior Field Agent',
    currentSite: '',
    status: 'Active On Site',
  });
  const [submitting, setSubmitting] = useState(false);
  // View / Edit agent modal: { id, mode: 'view' | 'edit' } or null
  const [agentModal, setAgentModal] = useState(null);

  // Load All Agent Data
  const loadData = async () => {
    try {
      setLoading(true);
      const [statsRes, agentsRes, leadsRes, commissionsRes, locsRes, citiesRes, withdrawalsRes] = await Promise.all([
        adminApi.getAgentStats(),
        adminApi.getAgents(),
        adminApi.getAgentLeads(),
        adminApi.getAgentCommissions(),
        adminApi.getAgentLocations(),
        adminApi.getActiveCities(),
        adminApi.getWithdrawals('Pending'),
      ]);

      if (statsRes?.success) setStats(statsRes.data);
      if (agentsRes?.success) setAgents(agentsRes.data);
      if (leadsRes?.success) setLeads(leadsRes.data);
      if (commissionsRes?.success) setCommissions(commissionsRes.data);
      if (locsRes?.success) setLocations(locsRes.data);
      if (citiesRes?.success && Array.isArray(citiesRes.data)) setCityOptions(citiesRes.data.map((c) => c.name));
      if (withdrawalsRes?.success && Array.isArray(withdrawalsRes.data)) setPendingWithdrawalCount(withdrawalsRes.data.length);
    } catch (err) {
      console.error('Error loading agent management data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // City -> agent that receives its orders. Each city has one agent; if older data has several,
  // the earliest-created one is the one orders go to (matches the backend).
  const cityHolder = {};
  [...agents]
    .sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0))
    .forEach((ag) => {
      const key = (ag.city || '').toLowerCase();
      if (key && !cityHolder[key]) cityHolder[key] = ag;
    });

  // Filter Agents
  const filteredAgents = agents.filter((ag) => {
    const matchesSearch =
      ag.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ag.phone?.includes(searchQuery) ||
      ag.currentSite?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ag.city?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCity = selectedCity === 'All Cities' || ag.city === selectedCity;
    const matchesStatus = selectedStatus === 'All' || ag.status === selectedStatus;

    return matchesSearch && matchesCity && matchesStatus;
  });

  // Handle Create Agent
  const handleCreateAgent = async (e) => {
    e.preventDefault();
    if (!newAgent.fullName?.trim() || !newAgent.email?.trim() || !newAgent.phone?.trim() || !newAgent.city?.trim()) {
      alert('Please fill out Name, Email, Phone, and Assigned Territory/City');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        fullName: newAgent.fullName.trim(),
        email: newAgent.email.trim(),
        phone: newAgent.phone.trim(),
        password: newAgent.password?.trim() || 'agent123',
        city: newAgent.city.trim(),
        agentRole: 'Field Sales Agent',
        status: 'Active On Site',
        currentSite: newAgent.currentSite?.trim() || 'Assigned Site',
      };

      const res = await adminApi.createAgent(payload);
      if (res?.success) {
        setIsAddModalOpen(false);
        setNewAgent({
          fullName: '',
          email: '',
          phone: '',
          password: 'agent123',
          city: '',
          agentRole: 'Field Sales Agent',
          currentSite: '',
          status: 'Active On Site',
        });
        await loadData();
      } else {
        alert(res?.message || res?.error || 'Failed to create agent');
      }
    } catch (err) {
      alert(err.message || 'Error creating agent');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Delete Agent
  const handleDeleteAgent = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove agent "${name}" from field operations?`)) {
      return;
    }

    try {
      const res = await adminApi.deleteAgent(id);
      if (res?.success) {
        setAgents((prev) => prev.filter((a) => a.id !== id));
        loadData();
      } else {
        alert(res?.error || 'Failed to remove agent');
      }
    } catch (err) {
      alert(err.message || 'Error removing agent');
    }
  };

  // Handle Update Agent Status
  const handleUpdateAgentStatus = async (id, newStatus) => {
    try {
      const res = await adminApi.updateAgent(id, { status: newStatus });
      if (res?.success) {
        setAgents((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
        );
        loadData();
      }
    } catch (err) {
      alert('Error updating agent status');
    }
  };

  // Handle Update Agent City
  const handleUpdateAgentCity = async (id, newCity) => {
    const res = await adminApi.updateAgent(id, { city: newCity });
    if (res?.success) {
      setAgents((prev) => prev.map((a) => (a.id === id ? { ...a, city: newCity } : a)));
      loadData();
    } else {
      alert(res?.message || 'Could not change the agent\'s city');
    }
  };

  // Handle Update Lead Status
  const handleUpdateLeadStatus = async (id, newStatus) => {
    try {
      const res = await adminApi.updateLeadStatus(id, newStatus);
      if (res?.success) {
        setLeads((prev) =>
          prev.map((l) => (l._id === id ? { ...l, status: newStatus } : l))
        );
        loadData();
      }
    } catch (err) {
      alert('Error updating lead status');
    }
  };

  // Handle Approve Commission
  const handleApproveCommission = async (id, customerName, amount) => {
    try {
      const res = await adminApi.updateCommissionStatus(id, 'Paid');
      if (res?.success) {
        setCommissions((prev) =>
          prev.map((c) => (c._id === id ? { ...c, status: 'Paid', paidAt: new Date() } : c))
        );
        loadData();
      }
    } catch (err) {
      alert('Error approving commission');
    }
  };

  return (
    <div>
      {/* Top Header Card */}
      <div className="web-card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'var(--petra-red-light, #fee2e2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--petra-red, #dc2626)' }}>
                <Users size={20} />
              </div>
              <h2 className="web-card-title" style={{ fontSize: '1.25rem', margin: 0 }}>Field Agent Operations & Commissions</h2>
            </div>
            <span className="web-card-subtitle" style={{ display: 'block', marginTop: '6px' }}>
              Manage sales agents, customer leads and commission payouts across Tamil Nadu
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button 
              className="btn-quick-action" 
              onClick={() => setIsAddModalOpen(true)}
            >
              <Plus size={16} />
              <span>Register Field Agent</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards 4-Column Grid */}
      <div className="kpi-grid-4">
        <div className="web-card kpi-card">
          <div className="kpi-info">
            <span className="kpi-label">Total Field Agents</span>
            <span className="kpi-value">{stats.totalAgents || agents.length}</span>
            <span className="kpi-sub" style={{ color: '#166534' }}>
              {stats.activeAgents} active in the field
            </span>
          </div>
          <div className="kpi-icon-box" style={{ background: '#fef2f2', borderColor: '#fecaca', color: '#dc2626' }}>
            <Users size={22} />
          </div>
        </div>

        <div className="web-card kpi-card">
          <div className="kpi-info">
            <span className="kpi-label">Customer Leads Sourced</span>
            <span className="kpi-value">{stats.totalLeads || leads.length}</span>
            <span className="kpi-sub" style={{ color: '#2563eb' }}>
              {stats.convertedLeads} Converted ({stats.conversionRate}% Win Rate)
            </span>
          </div>
          <div className="kpi-icon-box" style={{ background: '#eff6ff', borderColor: '#bfdbfe', color: '#2563eb' }}>
            <TrendingUp size={22} />
          </div>
        </div>

        <div className="web-card kpi-card">
          <div className="kpi-info">
            <span className="kpi-label">Pending Commissions</span>
            <span className="kpi-value" style={{ color: '#d97706' }}>₹{stats.pendingCommissions?.toLocaleString('en-IN')}</span>
            <span className="kpi-sub" style={{ color: '#d97706' }}>
              Awaiting Admin Payout Approval
            </span>
          </div>
          <div className="kpi-icon-box" style={{ background: '#fffbeb', borderColor: '#fde68a', color: '#d97706' }}>
            <Clock size={22} />
          </div>
        </div>

        <div className="web-card kpi-card">
          <div className="kpi-info">
            <span className="kpi-label">Total Commissions Paid</span>
            <span className="kpi-value" style={{ color: '#16a34a' }}>₹{stats.totalCommissionsPaid?.toLocaleString('en-IN')}</span>
            <span className="kpi-sub" style={{ color: '#16a34a' }}>
              2% sales commission on orders
            </span>
          </div>
          <div className="kpi-icon-box" style={{ background: '#f0fdf4', borderColor: '#bbf7d0', color: '#16a34a' }}>
            <BadgePercent size={22} />
          </div>
        </div>
      </div>

      {/* Sub-Tab Navigation Bar */}
      <div className="web-card" style={{ padding: '8px 12px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', alignItems: 'center' }}>
          {[
            { id: 'roster', label: `Field Agents Roster (${agents.length})`, icon: Users },
            { id: 'leads', label: `Agent Customer Leads (${leads.length})`, icon: TrendingUp },
            { id: 'commissions', label: `Commissions & Payouts (${commissions.length})`, icon: BadgePercent },
            { id: 'withdrawals', label: `Withdrawals (${pendingWithdrawalCount} pending)`, icon: Wallet },
            { id: 'hubs', label: 'Tamil Nadu Regional Hubs (5)', icon: MapPin },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 18px',
                  borderRadius: '10px',
                  border: isActive ? 'none' : '1px solid #e2e8f0',
                  background: isActive ? 'var(--petra-gradient, linear-gradient(135deg, #dc2626 0%, #ea580c 100%))' : '#ffffff',
                  color: isActive ? '#ffffff' : '#475569',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  boxShadow: isActive ? '0 2px 8px rgba(220, 38, 38, 0.25)' : 'none',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* VIEW 1: FIELD AGENTS ROSTER */}
      {activeSubTab === 'roster' && (
        <div className="web-card">
          {/* Controls Bar */}
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div className="header-search-container" style={{ width: '320px', maxWidth: '100%' }}>
              <Search size={16} className="header-search-icon" />
              <input 
                type="text" 
                placeholder="Search agent name, phone, or site..." 
                className="header-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <select 
                value={selectedCity} 
                onChange={(e) => setSelectedCity(e.target.value)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#0f172a',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                <option value="All Cities">All Cities</option>
                {Array.from(new Set([
                  'Chennai', 'Coimbatore', 'Madurai', 'Salem', 'Trichy',
                  ...agents.map(a => a.city).filter(Boolean)
                ])).map(city => (
                  <option key={city} value={city}>{city} Hub</option>
                ))}
              </select>

              <select 
                value={selectedStatus} 
                onChange={(e) => setSelectedStatus(e.target.value)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#0f172a',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                <option value="All">All Statuses</option>
                <option value="Active On Site">Active On Site</option>
                <option value="In Transit">In Transit</option>
                <option value="Client Meeting">Client Meeting</option>
                <option value="Offline">Offline</option>
              </select>
            </div>
          </div>

          {/* Agents Web Table */}
          <div className="table-responsive">
            <table className="web-table">
              <thead>
                <tr>
                  <th style={{ width: '22%' }}>Agent Name & Role</th>
                  <th style={{ width: '18%' }}>Contact Details</th>
                  <th style={{ width: '12%' }}>Region / City</th>
                  <th style={{ width: '18%' }}>Current Assignment</th>
                  <th style={{ width: '13%' }}>Field Status</th>
                  <th style={{ width: '8%' }}>Today's Visits</th>
                  <th style={{ width: '5%', textAlign: 'center' }}>Rating</th>
                  <th style={{ width: '4%', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAgents.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                      No field agents found matching your filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredAgents.map((ag) => {
                    const initials = ag.fullName
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2);

                    return (
                      <tr key={ag.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div className="user-avatar-badge" style={{ background: '#fee2e2', color: '#dc2626', fontWeight: 800 }}>
                              {initials}
                            </div>
                            <div>
                              <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0f172a' }}>{ag.fullName}</div>
                              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{ag.agentRole}</span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Phone size={13} style={{ color: '#16a34a' }} />
                            <span>{ag.phone}</span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Mail size={12} />
                            <span>{ag.email}</span>
                          </div>
                        </td>

                        <td>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            color: '#334155'
                          }}>
                            <MapPin size={13} style={{ color: '#ea580c' }} />
                            <select
                              value={ag.city || ''}
                              onChange={(e) => handleUpdateAgentCity(ag.id, e.target.value)}
                              title="Change this agent's city"
                              style={{ border: 'none', background: 'transparent', fontSize: '0.82rem', fontWeight: 700, color: '#334155', cursor: 'pointer', outline: 'none' }}
                            >
                              <option value="">Unassigned</option>
                              {cityOptions.map((c) => {
                                const holder = cityHolder[c.toLowerCase()];
                                const takenByOther = holder && holder.id !== ag.id;
                                return (
                                  <option key={c} value={c} disabled={takenByOther}>
                                    {takenByOther ? `${c} (${holder.fullName})` : c}
                                  </option>
                                );
                              })}
                            </select>
                          </span>
                          {ag.city && cityHolder[ag.city.toLowerCase()]?.id !== ag.id && (
                            <div style={{ fontSize: '0.72rem', color: '#b45309', fontWeight: 600, marginTop: '4px', maxWidth: '200px' }}>
                              Duplicate: {ag.city} orders go to {cityHolder[ag.city.toLowerCase()]?.fullName}. Move this agent to another city.
                            </div>
                          )}
                        </td>

                        <td>
                          <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={ag.currentSite}>
                            {ag.currentSite || 'Standby Hub'}
                          </div>
                        </td>

                        <td>
                          <select
                            value={ag.status}
                            onChange={(e) => handleUpdateAgentStatus(ag.id, e.target.value)}
                            style={{
                              padding: '5px 10px',
                              borderRadius: '999px',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              border: 'none',
                              background: 
                                ag.status === 'Active On Site' ? '#dcfce7' :
                                ag.status === 'In Transit' ? '#dbeafe' :
                                ag.status === 'Client Meeting' ? '#fef3c7' : '#f1f5f9',
                              color: 
                                ag.status === 'Active On Site' ? '#15803d' :
                                ag.status === 'In Transit' ? '#1d4ed8' :
                                ag.status === 'Client Meeting' ? '#b45309' : '#64748b'
                            }}
                          >
                            <option value="Active On Site">Active On Site</option>
                            <option value="In Transit">In Transit</option>
                            <option value="Client Meeting">Client Meeting</option>
                            <option value="Offline">Offline</option>
                          </select>
                        </td>

                        <td>
                          <span style={{ fontWeight: 800, color: '#ea580c', fontSize: '0.88rem' }}>
                            {ag.dailyVisits || 3} sites
                          </span>
                        </td>

                        <td style={{ textAlign: 'center' }}>
                          <span style={{ fontWeight: 800, color: '#d97706', fontSize: '0.88rem', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <Star size={13} fill="#d97706" />
                            {ag.rating || 4.8}
                          </span>
                        </td>

                        <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <button
                            onClick={() => setAgentModal({ id: ag.id, mode: 'view' })}
                            title="View agent details and commissions"
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#2563eb', padding: '6px' }}
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => setAgentModal({ id: ag.id, mode: 'edit' })}
                            title="Edit agent"
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#475569', padding: '6px' }}
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            className="btn-action-delete"
                            onClick={() => handleDeleteAgent(ag.id, ag.fullName)}
                            title="Remove agent from field roster"
                            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '6px' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: CUSTOMER LEADS PIPELINE */}
      {activeSubTab === 'leads' && (
        <div className="web-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 800, color: '#0f172a' }}>Agent-Generated Customer Leads</h3>
              <span style={{ fontSize: '0.82rem', color: '#64748b' }}>Leads registered by field agents from their mobile app</span>
            </div>
            <span className="badge-status-live">{leads.length} Active Leads</span>
          </div>

          <div className="table-responsive">
            <table className="web-table">
              <thead>
                <tr>
                  <th>Customer Name & Contact</th>
                  <th>Sponsoring Field Agent</th>
                  <th>Location</th>
                  <th>Interested Product & Qty</th>
                  <th>Pipeline Status</th>
                  <th>Site Notes</th>
                  <th>Date Registered</th>
                </tr>
              </thead>
              <tbody>
                {leads.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                      No agent customer leads found.
                    </td>
                  </tr>
                ) : (
                  leads.map((lead) => (
                    <tr key={lead._id}>
                      <td>
                        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.92rem' }}>{lead.customerName}</div>
                        <div style={{ fontSize: '0.8rem', color: '#16a34a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                          <Phone size={12} />
                          <span>{lead.phoneNumber}</span>
                        </div>
                      </td>

                      <td>
                        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a' }}>
                          {lead.agentId?.fullName || 'Karthik Sales Agent'}
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{lead.agentId?.phone || '+91 98765 43212'}</span>
                      </td>

                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>
                          <MapPin size={13} style={{ color: '#ea580c' }} />
                          {lead.location}
                        </span>
                      </td>

                      <td>
                        <div style={{ fontWeight: 700, color: '#dc2626', fontSize: '0.88rem' }}>{lead.interestedProduct}</div>
                        <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Qty: {lead.expectedQuantity}</span>
                      </td>

                      <td>
                        <select
                          value={lead.status}
                          onChange={(e) => handleUpdateLeadStatus(lead._id, e.target.value)}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            background: '#f8fafc',
                            border: '1px solid #cbd5e1',
                            color: '#0f172a',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="New Lead">New Lead</option>
                          <option value="Contacted">Contacted</option>
                          <option value="Negotiating">Negotiating</option>
                          <option value="Converted">Converted (Won)</option>
                          <option value="Lost">Lost</option>
                        </select>
                      </td>

                      <td>
                        <span style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: lead.notes ? 'normal' : 'italic' }}>
                          {lead.notes || 'No notes added'}
                        </span>
                      </td>

                      <td>
                        <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                          {new Date(lead.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: COMMISSIONS & PAYOUTS */}
      {activeSubTab === 'commissions' && (
        <div className="web-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div>
              <h3 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 800, color: '#0f172a' }}>Agent Commission Payout Reconciliation</h3>
              <span style={{ fontSize: '0.82rem', color: '#64748b' }}>2% standard sales incentive per order. Approve payouts directly to update agent balances</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span className="badge-pending" style={{ fontSize: '0.78rem' }}>₹{stats.pendingCommissions?.toLocaleString('en-IN')} Pending Approval</span>
            </div>
          </div>

          <div className="table-responsive">
            <table className="web-table">
              <thead>
                <tr>
                  <th>Agent Name</th>
                  <th>Customer / Client</th>
                  <th>Order Reference</th>
                  <th>Order Amount (₹)</th>
                  <th>Rate</th>
                  <th>Commission Earned</th>
                  <th>Payout Status</th>
                  <th style={{ textAlign: 'right' }}>Admin Action</th>
                </tr>
              </thead>
              <tbody>
                {commissions.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '36px', color: '#64748b' }}>
                      No commission records found.
                    </td>
                  </tr>
                ) : (
                  commissions.map((comm) => (
                    <tr key={comm._id}>
                      <td>
                        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.92rem' }}>
                          {comm.agentId?.fullName || 'Karthik Sales Agent'}
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{comm.agentId?.city || 'Chennai'} Region</span>
                      </td>

                      <td>
                        <div style={{ fontWeight: 700, color: '#334155', fontSize: '0.9rem' }}>{comm.customerName}</div>
                      </td>

                      <td>
                        <span className="order-code-badge">
                          {comm.orderId || 'Direct Supply'}
                        </span>
                      </td>

                      <td>
                        <span style={{ fontWeight: 800, color: '#0f172a' }}>
                          ₹{comm.orderAmount?.toLocaleString('en-IN')}
                        </span>
                      </td>

                      <td>
                        <span style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>{comm.commissionRate || 2}%</span>
                      </td>

                      <td>
                        <span style={{ fontWeight: 800, color: '#16a34a', fontSize: '0.95rem' }}>
                          ₹{comm.commissionEarned?.toLocaleString('en-IN')}
                        </span>
                      </td>

                      <td>
                        {comm.status === 'Paid' ? (
                          <span className="badge-status-live" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle2 size={12} />
                            Paid
                          </span>
                        ) : (
                          <span className="badge-pending" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <Clock size={12} />
                            Pending Review
                          </span>
                        )}
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        {comm.status === 'Pending' ? (
                          <button
                            className="btn-quick-action"
                            onClick={() => handleApproveCommission(comm._id, comm.customerName, comm.commissionEarned)}
                            style={{ height: '32px', padding: '0 12px', fontSize: '0.78rem' }}
                          >
                            Approve & Pay (₹{comm.commissionEarned})
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>
                            Settled {comm.paidAt ? new Date(comm.paidAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Recently'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 4: TAMIL NADU REGIONAL HUBS */}
      {activeSubTab === 'withdrawals' && (
        <WithdrawalsPanel onChanged={loadData} />
      )}

      {activeSubTab === 'hubs' && (
        <div>
          <div className="web-card" style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 800, color: '#0f172a' }}>Tamil Nadu Regional Agent Deployment</h3>
            <span style={{ fontSize: '0.82rem', color: '#64748b' }}>Agents and active sites by city</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
            {[
              { name: 'Chennai Hub', city: 'Chennai', totalAgents: 12, activeAgents: 9, zone: 'North & South Metros', majorSites: ['Metro Rail Phase 2', 'TIDEL Park Extension', 'DLF IT Flyover'], isLive: true },
              { name: 'Coimbatore Hub', city: 'Coimbatore', totalAgents: 8, activeAgents: 6, zone: 'Western Industrial Corridor', majorSites: ['TIDEL Coimbatore', 'Avinashi Elevated Expressway'], isLive: true },
              { name: 'Madurai Hub', city: 'Madurai', totalAgents: 6, activeAgents: 4, zone: 'Southern Central Region', majorSites: ['Hospital Block Extension', 'Ring Road Commercial Complex'], isLive: true },
              { name: 'Salem Hub', city: 'Salem', totalAgents: 5, activeAgents: 3, zone: 'Steel & Textile Belt', majorSites: ['Modern Textile Mill Shed', 'Steel Plant Road Logistics'], isLive: true },
              { name: 'Trichy Hub', city: 'Trichy', totalAgents: 4, activeAgents: 2, zone: 'Delta Commercial Center', majorSites: ['Thillai Nagar Complex', 'Central Flyover Site'], isLive: true },
            ].map((hub, idx) => (
              <div key={idx} className="web-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626' }}>
                        <Building2 size={16} />
                      </div>
                      <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>{hub.name}</h4>
                    </div>
                    <span className="badge-status-live" style={{ fontSize: '0.72rem' }}>Active Hub</span>
                  </div>

                  <div style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '14px', fontWeight: 500 }}>{hub.zone}</div>

                  <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Active Agents On Duty:</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#16a34a' }}>{hub.activeAgents} / {hub.totalAgents}</span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${(hub.activeAgents / hub.totalAgents) * 100}%`, height: '100%', background: '#16a34a' }}></div>
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 800 }}>Active Projects:</span>
                    <ul style={{ margin: '6px 0 0 0', paddingLeft: '18px', fontSize: '0.82rem', color: '#334155' }}>
                      {hub.majorSites.map((site, sIdx) => (
                        <li key={sIdx} style={{ marginBottom: '3px', fontWeight: 600 }}>{site}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #e2e8f0' }}>
                  <button 
                    className="btn-quick-action"
                    onClick={() => {
                      setSelectedCity(hub.city);
                      setActiveSubTab('roster');
                    }}
                    style={{ fontSize: '0.78rem', height: '34px', width: '100%', justifyContent: 'center' }}
                  >
                    View {hub.city} Agents ({hub.totalAgents})
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: REGISTER NEW FIELD AGENT */}
      {agentModal && (
        <AgentDetailsModal
          key={`${agentModal.id}-${agentModal.mode}`}
          agentId={agentModal.id}
          initialMode={agentModal.mode}
          cityOptions={cityOptions}
          cityHolder={cityHolder}
          onClose={() => setAgentModal(null)}
          onSaved={loadData}
        />
      )}

      {isAddModalOpen && (
        <div 
          className="modal-overlay" 
          onClick={() => {
            setIsAddModalOpen(false);
          }}
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
              maxWidth: '540px', 
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
            {/* Header */}
            <div 
              className="modal-header" 
              style={{ 
                padding: '18px 24px', 
                borderBottom: '1px solid #e2e8f0', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                backgroundColor: '#f8fafc'
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Users size={20} style={{ color: '#dc2626' }} />
                  Register New Field Sales Agent
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginTop: '2px' }}>
                  Provision mobile credentials & territory order routing
                </span>
              </div>
              <button 
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                }}
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

            {/* Form */}
            <form onSubmit={handleCreateAgent} style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Agent Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Senthil Nathan"
                    value={newAgent.fullName}
                    onChange={(e) => setNewAgent({ ...newAgent, fullName: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a', fontSize: '0.9rem' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      Email Address (Login ID) *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="agent@petracement.com"
                      value={newAgent.email}
                      onChange={(e) => setNewAgent({ ...newAgent, email: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a', fontSize: '0.9rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      Phone Number *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="+91 98401 23456"
                      value={newAgent.phone}
                      onChange={(e) => setNewAgent({ ...newAgent, phone: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a', fontSize: '0.9rem' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      Mobile App Password *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. agent123"
                      value={newAgent.password || 'agent123'}
                      onChange={(e) => setNewAgent({ ...newAgent, password: e.target.value })}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a', fontSize: '0.9rem' }}
                    />
                    <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', marginTop: '3px' }}>
                      Password for agent mobile app login
                    </span>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                      Assigned City *
                    </label>
                    <select
                      required
                      value={newAgent.city}
                      onChange={(e) => setNewAgent({ ...newAgent, city: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        color: '#0f172a',
                        fontSize: '0.9rem',
                        fontWeight: 700
                      }}
                    >
                      <option value="" disabled>Select a city</option>
                      {cityOptions.map((c) => {
                        const holder = cityHolder[c.toLowerCase()];
                        return (
                          <option key={c} value={c} disabled={!!holder}>
                            {holder ? `${c} (assigned to ${holder.fullName})` : c}
                          </option>
                        );
                      })}
                    </select>
                    <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', marginTop: '3px' }}>
                      One agent per city. Cities that already have an agent are unavailable. Add cities under Cities &amp; Commission.
                    </span>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Assigned Site / Project Location (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Metro Rail Phase 2 Guindy Site, TIDEL Park, Anna Nagar Site, etc."
                    value={newAgent.currentSite}
                    onChange={(e) => setNewAgent({ ...newAgent, currentSite: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', background: '#ffffff', border: '1px solid #cbd5e1', color: '#0f172a', fontSize: '0.9rem' }}
                  />
                  <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block', marginTop: '3px' }}>
                    Type specific construction site, project, or depot manually
                  </span>
                </div>

                <div style={{ background: '#f0fdf4', padding: '12px 14px', borderRadius: '8px', border: '1px solid #bbf7d0', fontSize: '0.8rem', color: '#166534', lineHeight: 1.5 }}>
                  <strong>Order routing:</strong> Orders delivered to <strong>{newAgent.city || 'the selected city'}</strong> are assigned to this agent, who earns the commission set under Cities &amp; Commission.
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                  }}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#475569',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-quick-action"
                  disabled={submitting}
                  style={{
                    padding: '9px 20px',
                    borderRadius: '8px',
                    background: 'var(--petra-gradient, linear-gradient(135deg, #dc2626 0%, #ea580c 100%))',
                    color: '#ffffff',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Users size={16} />
                  <span>{submitting ? 'Registering...' : 'Register Field Agent'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}