import React, { useEffect, useMemo, useState } from 'react';
import { MapPin, Percent, IndianRupee, Plus, Search, Trash2, Save } from 'lucide-react';
import adminApi from '../services/api';

const EXAMPLE_BAGS = 100;
const EXAMPLE_PRICE = 400;

export default function CitiesPanel() {
  const [cities, setCities] = useState([]);
  const [agents, setAgents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [newCityName, setNewCityName] = useState('');
  const [newCityAliases, setNewCityAliases] = useState('');
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text }

  const [commissionType, setCommissionType] = useState('percent');
  const [commissionValue, setCommissionValue] = useState('2');
  const [savedCommission, setSavedCommission] = useState(null);
  const [isSavingCommission, setIsSavingCommission] = useState(false);

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  useEffect(() => {
    Promise.all([adminApi.getCities(), adminApi.getCommissionSettings(), adminApi.getAgents()]).then(
      ([cityRes, commRes, agentRes]) => {
        if (cityRes?.success && Array.isArray(cityRes.data)) setCities(cityRes.data);
        if (commRes?.success && commRes.data) {
          setCommissionType(commRes.data.type);
          setCommissionValue(String(commRes.data.value));
          setSavedCommission(commRes.data);
        }
        if (agentRes?.success && Array.isArray(agentRes.data)) setAgents(agentRes.data);
        setIsLoading(false);
      }
    );
  }, []);

  // City -> its agents, earliest-created first (that one receives the city's orders)
  const agentsByCity = useMemo(() => {
    const map = {};
    [...agents]
      .sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0))
      .forEach((a) => {
        const key = (a.city || '').toLowerCase();
        if (!key) return;
        (map[key] = map[key] || []).push(a);
      });
    return map;
  }, [agents]);

  const visibleCities = cities.filter((c) => {
    const q = search.trim().toLowerCase();
    return !q || c.name.toLowerCase().includes(q) || (c.aliases || []).some((a) => a.toLowerCase().includes(q));
  });
  const activeCount = cities.filter((c) => c.active).length;

  // Commission preview for an example order
  const numericValue = Number(commissionValue);
  const exampleTotal = EXAMPLE_BAGS * EXAMPLE_PRICE;
  const exampleCommission = Number.isFinite(numericValue)
    ? commissionType === 'percent'
      ? (exampleTotal * numericValue) / 100
      : EXAMPLE_BAGS * numericValue
    : 0;
  const isCommissionDirty =
    !savedCommission || savedCommission.type !== commissionType || String(savedCommission.value) !== String(commissionValue);

  const handleSaveCommission = async () => {
    if (!Number.isFinite(numericValue) || numericValue < 0) {
      showMessage('error', 'Enter a commission value of 0 or more.');
      return;
    }
    setIsSavingCommission(true);
    const res = await adminApi.updateCommissionSettings({ type: commissionType, value: numericValue });
    setIsSavingCommission(false);
    if (res?.success) {
      setSavedCommission(res.data);
      showMessage('success', 'Commission rule saved. It applies to new orders.');
    } else {
      showMessage('error', res?.message || 'Could not save commission settings.');
    }
  };

  const handleAddCity = async (e) => {
    e.preventDefault();
    if (!newCityName.trim()) return;
    const res = await adminApi.createCity({
      name: newCityName.trim(),
      aliases: newCityAliases.split(',').map((a) => a.trim()).filter(Boolean),
    });
    if (res?.success) {
      setCities((prev) => [...prev, res.data].sort((a, b) => a.name.localeCompare(b.name)));
      setNewCityName('');
      setNewCityAliases('');
      showMessage('success', `${res.data.name} added. Customers can now choose it at checkout.`);
    } else {
      showMessage('error', res?.message || 'Could not add city.');
    }
  };

  const handleToggleCity = async (city) => {
    const res = await adminApi.updateCity(city.id, { active: !city.active });
    if (res?.success) {
      setCities((prev) => prev.map((c) => (c.id === city.id ? res.data : c)));
    } else {
      showMessage('error', res?.message || 'Could not update city.');
    }
  };

  const handleDeleteCity = async (city) => {
    if (!window.confirm(`Delete ${city.name}? Customers will no longer be able to choose it.`)) return;
    const res = await adminApi.deleteCity(city.id);
    if (res?.success) {
      setCities((prev) => prev.filter((c) => c.id !== city.id));
      showMessage('success', `${city.name} deleted.`);
    } else {
      showMessage('error', res?.message || 'Could not delete city.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {message && (
        <div
          role="status"
          style={{
            padding: '12px 16px',
            borderRadius: '10px',
            fontSize: '0.88rem',
            fontWeight: 600,
            background: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
            color: message.type === 'success' ? '#166534' : '#991b1b',
            border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
          }}
        >
          {message.text}
        </div>
      )}

      {/* Commission settings */}
      <div className="web-card">
        <div className="web-card-header">
          <div>
            <div className="web-card-title">Agent Commission</div>
            <div className="web-card-subtitle">
              Earned by the agent assigned to the customer&apos;s delivery city on every new order
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', alignItems: 'start' }}>
          <div>
            <div className="web-form-label" style={{ marginBottom: '8px' }}>Commission type</div>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
              {[
                { id: 'percent', label: '% of order value', Icon: Percent },
                { id: 'per_bag', label: 'Fixed ₹ per bag', Icon: IndianRupee },
              ].map(({ id, label, Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setCommissionType(id)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    height: '44px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    border: commissionType === id ? '1.5px solid #dc2626' : '1px solid #e2e8f0',
                    background: commissionType === id ? '#fef2f2' : '#ffffff',
                    color: commissionType === id ? '#b91c1c' : '#334155',
                  }}
                >
                  <Icon size={16} />
                  {label}
                </button>
              ))}
            </div>

            <div className="web-form-group">
              <label className="web-form-label" htmlFor="commission-value">
                {commissionType === 'percent' ? 'Percentage (%)' : 'Amount per bag (₹)'}
              </label>
              <input
                id="commission-value"
                type="number"
                min="0"
                step={commissionType === 'percent' ? '0.1' : '0.5'}
                className="web-form-input"
                value={commissionValue}
                onChange={(e) => setCommissionValue(e.target.value)}
              />
            </div>

            <button
              type="button"
              className="btn-quick-action"
              onClick={handleSaveCommission}
              disabled={isSavingCommission || !isCommissionDirty}
              style={{ opacity: isSavingCommission || !isCommissionDirty ? 0.6 : 1 }}
            >
              <Save size={16} />
              <span>{isSavingCommission ? 'Saving...' : 'Save Commission Rule'}</span>
            </button>
          </div>

          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
            <div className="web-form-label" style={{ marginBottom: '10px' }}>Example</div>
            <div style={{ fontSize: '0.88rem', color: '#475569', lineHeight: 1.7 }}>
              Order of {EXAMPLE_BAGS} bags × ₹{EXAMPLE_PRICE} = <strong>₹{exampleTotal.toLocaleString('en-IN')}</strong>
              <br />
              Agent earns{' '}
              <strong style={{ color: '#047857', fontSize: '1rem' }}>
                ₹{exampleCommission.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
              </strong>
              {commissionType === 'percent' ? ` (${commissionValue || 0}%)` : ` (₹${commissionValue || 0} × ${EXAMPLE_BAGS} bags)`}
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '10px' }}>
              Changes apply to new orders only. Existing commissions keep the rate they were created with.
            </div>
          </div>
        </div>
      </div>

      {/* Cities */}
      <div className="web-card">
        <div className="web-card-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div className="web-card-title">Delivery Cities</div>
            <div className="web-card-subtitle">
              {activeCount} active of {cities.length}. Customers pick one at checkout, and agents are assigned to one.
            </div>
          </div>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
            <input
              type="text"
              className="web-form-input"
              placeholder="Search cities"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '36px', width: '220px' }}
            />
          </div>
        </div>

        <form onSubmit={handleAddCity} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '18px' }}>
          <input
            type="text"
            required
            className="web-form-input"
            placeholder="New city name (e.g. Bengaluru)"
            value={newCityName}
            onChange={(e) => setNewCityName(e.target.value)}
            style={{ flex: '2 1 220px' }}
          />
          <input
            type="text"
            className="web-form-input"
            placeholder="Other spellings, comma separated (optional)"
            value={newCityAliases}
            onChange={(e) => setNewCityAliases(e.target.value)}
            style={{ flex: '3 1 260px' }}
          />
          <button type="submit" className="btn-quick-action" style={{ height: '44px' }}>
            <Plus size={16} />
            <span>Add City</span>
          </button>
        </form>

        <div className="table-responsive">
          <table className="web-table">
            <thead>
              <tr>
                <th>City</th>
                <th>Also matches</th>
                <th>Agent</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: '#64748b' }}>Loading cities...</td></tr>
              ) : visibleCities.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: '#64748b' }}>No cities match your search.</td></tr>
              ) : (
                visibleCities.map((city) => {
                  const cityAgents = agentsByCity[city.name.toLowerCase()] || [];
                  return (
                    <tr key={city.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                          <MapPin size={15} style={{ color: '#dc2626' }} />
                          {city.name}
                        </div>
                      </td>
                      <td style={{ color: '#64748b' }}>{(city.aliases || []).join(', ') || '—'}</td>
                      <td>
                        {cityAgents.length > 0 ? (
                          <>
                            <span style={{ fontWeight: 700 }}>{cityAgents[0].fullName}</span>
                            {cityAgents.length > 1 && (
                              <div style={{ fontSize: '0.72rem', color: '#b45309', fontWeight: 600, marginTop: '2px' }}>
                                +{cityAgents.length - 1} more assigned. Only one agent per city; move the others in Field Agents.
                              </div>
                            )}
                          </>
                        ) : (
                          <span style={{ color: '#b45309', fontSize: '0.8rem', fontWeight: 600 }}>No agent</span>
                        )}
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => handleToggleCity(city)}
                          title={city.active ? 'Click to hide from checkout' : 'Click to show at checkout'}
                          style={{
                            padding: '4px 12px',
                            borderRadius: '999px',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            background: city.active ? '#dcfce7' : '#f1f5f9',
                            color: city.active ? '#166534' : '#64748b',
                          }}
                        >
                          {city.active ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => handleDeleteCity(city)}
                          title="Delete city"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px' }}
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
    </div>
  );
}
