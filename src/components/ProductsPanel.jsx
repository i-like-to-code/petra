import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Search, 
  Plus, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  FileText, 
  Edit3, 
  Trash2, 
  X,
  Layers,
  Award,
  Power,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
  Eye,
  EyeOff
} from 'lucide-react';
import adminApi from '../services/api';

// Helper: Robust product visibility check
const checkProductIsLive = (p) => {
  if (!p) return false;
  if (typeof p.active === 'boolean') return p.active;
  if (p.status === 'inactive' || p.status === 'Inactive' || p.status === 'Out') return false;
  if (p.rawStatus === 'inactive') return false;
  return true;
};

export default function ProductsPanel({
  products = [], 
  setProducts, 
  brands = [], 
  onUpdateProduct,
  onToggleProduct,
  onToggleCementType,
  onDeleteProduct, 
  onOpenAddModal 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedSpecProduct, setSelectedSpecProduct] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);
  const [typeStatuses, setTypeStatuses] = useState({
    'PPC': true,
    'OPC': true,
    'PSC': true,
    'White': true,
    'Composite': true
  });
  const [actionNotice, setActionNotice] = useState(null);

  // Bag image presets for easy selection in Edit modal
  const bagPresets = [
    { label: 'UltraTech Super PPC', src: '/cements/ultratech-super-ppc.png', brand: 'UltraTech Cement' },
    { label: 'UltraTech OPC 53', src: '/cements/ultratech-opc.jpg', brand: 'UltraTech Cement' },
    { label: 'UltraTech Weather Plus', src: '/cements/ultratech-weather-plus.jpg', brand: 'UltraTech Cement' },
    { label: 'Birla White Cement', src: '/cements/ultratech-white.png', brand: 'UltraTech Cement' },
    { label: 'Ramco Supergrade PPC', src: '/cements/ramco-supergrade.png', brand: 'Ramco Cement' },
    { label: 'Ramco OPC 53 Grade', src: '/cements/ramco-53-grade.png', brand: 'Ramco Cement' },
    { label: 'Ramco Supercoast PSC', src: '/cements/ramco-super-coast.jpg', brand: 'Ramco Cement' },
    { label: 'Ramco Super Steel', src: '/cements/ramco-super-steel.png', brand: 'Ramco Cement' },
    { label: 'Dalmia DSP Cement', src: '/cements/dalmia-dsp.png', brand: 'Dalmia Cement' },
    { label: 'Dalmia OPC 53 Grade', src: '/cements/dalmia-53-grade.jpg', brand: 'Dalmia Cement' },
    { label: 'Dalmia Infra Pro PSC', src: '/cements/dalmia-infra-pro.png', brand: 'Dalmia Cement' },
    { label: 'JSW Concreel HD PPC', src: '/cements/jsw-concreel-hd.png', brand: 'JSW Cement' },
    { label: 'JSW OPC 53 Grade', src: '/cements/jsw-opc.png', brand: 'JSW Cement' },
    { label: 'JSW Composite Slag', src: '/cements/jsw-compcem.png', brand: 'JSW Cement' },
    { label: 'Zuari Super PPC', src: '/cements/zuari-ppc.png', brand: 'Zuari Cement' },
    { label: 'Zuari OPC 53 Grade', src: '/cements/zuari-opc.jpg', brand: 'Zuari Cement' },
    { label: 'Maha Solid PPC', src: '/cements/maha-bag.png', brand: 'Maha Cement' },
  ];

  // Core 5 Cement Formulation Types
  const CEMENT_TYPES_CONFIG = [
    { key: 'PPC', label: 'PPC Cement', subtitle: 'Pozzolana Portland', desc: 'Fly-ash based durable construction cement' },
    { key: 'OPC', label: 'OPC 53 Grade', subtitle: 'Ordinary Portland', desc: 'High early strength heavy structural RCC' },
    { key: 'PSC', label: 'PSC Slag', subtitle: 'Portland Slag', desc: 'Saline & chemical corrosion resistant cement' },
    { key: 'White', label: 'White Cement', subtitle: 'Architectural Grade', desc: 'Aesthetic plaster & decorative finishes' },
    { key: 'Composite', label: 'Composite Blends', subtitle: 'Specialty Slag', desc: 'Low-heat multi-compound formulation' },
  ];

  // Load live cement type statuses from backend or calculate from products
  useEffect(() => {
    adminApi.getCementTypes()
      .then((res) => {
        if (res?.success && Array.isArray(res.data)) {
          const map = {};
          res.data.forEach((t) => {
            map[t.name] = t.active !== false;
          });
          setTypeStatuses((prev) => ({ ...prev, ...map }));
        }
      })
      .catch((err) => {
        console.warn('Using local cement type status map');
      });
  }, []);

  // Show auto-dismiss notification
  const triggerNotice = (msg) => {
    setActionNotice(msg);
    setTimeout(() => {
      setActionNotice(null);
    }, 4500);
  };

  // Handle Toggle Single Product ON / OFF
  const handleToggleProductStatus = async (prod) => {
    const isCurrentlyActive = checkProductIsLive(prod);
    const newActiveState = !isCurrentlyActive;

    if (onToggleProduct) {
      await onToggleProduct(prod.id, newActiveState);
    } else {
      const updatedStatus = newActiveState ? 'In Stock' : 'inactive';
      setProducts(products.map(p => p.id === prod.id ? { ...p, status: updatedStatus, active: newActiveState } : p));
      await adminApi.toggleProduct(prod.id, newActiveState);
    }

    triggerNotice(
      newActiveState
        ? `"${prod.name}" turned ON (Now LIVE on User Mobile App)`
        : `"${prod.name}" turned OFF (Hidden from User Mobile App)`
    );
  };

  // Handle Toggle Entire Cement Type ON / OFF
  const handleToggleCementTypeStatus = async (typeKey) => {
    const currentActive = typeStatuses[typeKey] !== false;
    const newActive = !currentActive;

    setTypeStatuses(prev => ({ ...prev, [typeKey]: newActive }));

    if (onToggleCementType) {
      await onToggleCementType(typeKey, newActive);
    } else {
      await adminApi.toggleCementType(typeKey, newActive);
      setProducts(products.map(p => {
        const pType = (p.specs?.type || p.name || '').toUpperCase();
        if (pType.includes(typeKey.toUpperCase())) {
          return { ...p, status: newActive ? 'In Stock' : 'inactive', active: newActive };
        }
        return p;
      }));
    }

    triggerNotice(
      newActive
        ? `All ${typeKey} Cement products turned ON (Live on User App)`
        : `All ${typeKey} Cement products turned OFF (Concealed on User App)`
    );
  };

  // Filter products based on search, brand, and type
  const filteredProducts = products.filter(p => {
    const brandName = p.brandName || p.specs?.brand || p.brand || '';
    const typeName = p.specs?.type || p.name || '';

    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      brandName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      typeName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesBrand = selectedBrand === 'All' || 
      (p.brandId && p.brandId.toLowerCase() === selectedBrand.toLowerCase()) ||
      brandName.toLowerCase().includes(selectedBrand.toLowerCase());

    const matchesType = selectedType === 'All' || 
      typeName.toLowerCase().includes(selectedType.toLowerCase()) ||
      p.name.toLowerCase().includes(selectedType.toLowerCase());

    return matchesSearch && matchesBrand && matchesType;
  });

  // Calculate stats
  const totalBags = products.reduce((acc, p) => {
    const count = parseInt(String(p.stock).replace(/[^0-9]/g, '')) || 0;
    return acc + count;
  }, 0);

  const activeProductsCount = products.filter(p => checkProductIsLive(p)).length;
  const offProductsCount = products.length - activeProductsCount;

  const handleEditSave = (e) => {
    e.preventDefault();
    if (!editingProduct) return;

    const matchedBrand = brands.find(b => b.name === editingProduct.brandName || b.id === editingProduct.brandId);

    const updated = {
      ...editingProduct,
      brandId: matchedBrand ? matchedBrand.id : (editingProduct.brandId || 'custom'),
      brandName: matchedBrand ? matchedBrand.name : (editingProduct.brandName || editingProduct.specs?.brand || 'Petra Cement'),
      specs: {
        ...editingProduct.specs,
        brand: matchedBrand ? matchedBrand.name : (editingProduct.brandName || 'Petra Cement')
      }
    };

    if (onUpdateProduct) {
      onUpdateProduct(updated);
    } else {
      setProducts(products.map(p => p.id === updated.id ? updated : p));
    }

    setEditingProduct(null);
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Are you sure you want to remove "${name}" from the catalog?`)) {
      if (onDeleteProduct) {
        onDeleteProduct(id);
      } else {
        setProducts(products.filter(p => p.id !== id));
      }
    }
  };

  // Helper for brand badge color
  const getBrandBadgeStyle = (brandName = '') => {
    const lower = brandName.toLowerCase();
    if (lower.includes('ultra')) return { bg: '#fefce8', color: '#a16207', border: '#fef08a' };
    if (lower.includes('ramco')) return { bg: '#fffbeb', color: '#b45309', border: '#fde68a' };
    if (lower.includes('dalmia')) return { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' };
    if (lower.includes('jsw')) return { bg: '#f0f9ff', color: '#0369a1', border: '#bae6fd' };
    if (lower.includes('zuari')) return { bg: '#f8fafc', color: '#334155', border: '#cbd5e1' };
    if (lower.includes('maha')) return { bg: '#fef2f2', color: '#b91c1c', border: '#fecaca' };
    return { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' };
  };

  return (
    <div>
      {/* Live Action Toast Banner */}
      {actionNotice && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 9999,
          background: '#0f172a',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '10px',
          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          border: '1px solid #334155',
          fontSize: '0.88rem',
          fontWeight: 600,
          animation: 'slideIn 0.3s ease'
        }}>
          <CheckCircle2 size={18} style={{ color: '#10b981' }} />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* TOP SECTION 1: CEMENT FORMULATION TYPES ON/OFF SWITCH CONTROL BAR */}
      <div className="web-card" style={{ marginBottom: '20px', borderLeft: '4px solid #ea580c' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Layers size={18} style={{ color: '#ea580c' }} />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Cement Types & Grades ON / OFF Switch
              </h3>
              <span className="badge-status-live" style={{ fontSize: '0.72rem' }}>
                Instant User App Sync
              </span>
            </div>
            <span style={{ fontSize: '0.78rem', color: '#64748b', display: 'block', marginTop: '3px' }}>
              Turn off an entire cement category to immediately conceal all formulations of that type from mobile shoppers.
            </span>
          </div>

          <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
            <span style={{ color: '#15803d' }}>● {activeProductsCount} Live on App</span>
            <span style={{ margin: '0 8px', color: '#cbd5e1' }}>|</span>
            <span style={{ color: '#dc2626' }}>○ {offProductsCount} Turned OFF</span>
          </div>
        </div>

        {/* 5 Cement Types Cards Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          {CEMENT_TYPES_CONFIG.map((t) => {
            const isTypeActive = typeStatuses[t.key] !== false;
            const count = products.filter(p => {
              const pType = (p.specs?.type || p.name || '').toUpperCase();
              return pType.includes(t.key.toUpperCase());
            }).length;

            return (
              <div 
                key={t.key}
                style={{
                  background: isTypeActive ? '#ffffff' : '#f8fafc',
                  border: isTypeActive ? '1px solid #fed7aa' : '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '8px',
                  transition: 'all 0.2s ease',
                  boxShadow: isTypeActive ? '0 2px 6px rgba(234, 88, 12, 0.08)' : 'none',
                  opacity: isTypeActive ? 1 : 0.75
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.95rem', color: isTypeActive ? '#0f172a' : '#64748b' }}>
                      {t.label}
                    </span>
                    <span style={{
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: isTypeActive ? '#ffedd5' : '#e2e8f0',
                      color: isTypeActive ? '#c2410c' : '#64748b'
                    }}>
                      {count} items
                    </span>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '2px' }}>
                    {t.subtitle}
                  </div>
                </div>

                {/* ON / OFF Toggle Action Button */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: isTypeActive ? '#15803d' : '#991b1b' }}>
                    {isTypeActive ? '● Live on App' : '○ Turned OFF'}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleToggleCementTypeStatus(t.key)}
                    style={{
                      border: 'none',
                      borderRadius: '999px',
                      padding: '4px 10px',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      cursor: 'pointer',
                      background: isTypeActive ? '#dcfce7' : '#fee2e2',
                      color: isTypeActive ? '#15803d' : '#dc2626',
                      transition: 'all 0.2s ease'
                    }}
                    title={isTypeActive ? `Click to turn OFF all ${t.key} products` : `Click to turn ON all ${t.key} products`}
                  >
                    {isTypeActive ? (
                      <>
                        <Eye size={12} />
                        <span>ON</span>
                      </>
                    ) : (
                      <>
                        <EyeOff size={12} />
                        <span>OFF</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* TOP SECTION 2: BRAND QUICK FILTER PILLS */}
      <div className="web-card" style={{ marginBottom: '18px', padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Award size={18} style={{ color: '#dc2626' }} />
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Official Manufacturer Brand Filter
            </h3>
            <span style={{ fontSize: '0.78rem', color: '#64748b', background: '#f1f5f9', padding: '2px 8px', borderRadius: '999px', fontWeight: 700 }}>
              User App Catalog
            </span>
          </div>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
            Showing <strong>{filteredProducts.length}</strong> of {products.length} products
          </span>
        </div>

        <div className="brand-pills-row">
          <button 
            type="button"
            className={`brand-filter-pill ${selectedBrand === 'All' ? 'active' : ''}`}
            onClick={() => setSelectedBrand('All')}
          >
            <span>All Brands</span>
            <span className="brand-pill-count">{products.length}</span>
          </button>

          {brands.map(brand => {
            const count = products.filter(p => (p.brandId === brand.id) || (p.brandName && p.brandName.includes(brand.name))).length;
            const isSelected = selectedBrand === brand.id || selectedBrand === brand.name;
            return (
              <button
                key={brand.id}
                type="button"
                className={`brand-filter-pill ${isSelected ? 'active' : ''}`}
                onClick={() => setSelectedBrand(brand.id)}
                style={{
                  borderColor: isSelected ? brand.brandColor : undefined,
                  backgroundColor: isSelected ? brand.bgLightColor : undefined,
                  color: isSelected ? brand.brandColor : undefined
                }}
              >
                <span 
                  className="brand-color-dot" 
                  style={{ backgroundColor: brand.brandColor }} 
                />
                <span>{brand.name}</span>
                <span className="brand-pill-count">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SUMMARY KPI STRIP */}
      <div className="stats-summary-grid">
        <div className="web-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Package size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Active Catalog</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a' }}>{activeProductsCount} Live Formulations</div>
          </div>
        </div>

        <div className="web-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Layers size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Warehouse Stock</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#059669' }}>{totalBags.toLocaleString()} Bags</div>
          </div>
        </div>

        <div className="web-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Award size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Major Brands</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#2563eb' }}>{brands.length} Verified Brands</div>
          </div>
        </div>

        <div className="web-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: offProductsCount > 0 ? '#fffbeb' : '#f8fafc', color: offProductsCount > 0 ? '#d97706' : '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Turned OFF (Hidden)</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: offProductsCount > 0 ? '#dc2626' : '#0f172a' }}>
              {offProductsCount} Products OFF
            </div>
          </div>
        </div>
      </div>

      {/* TOP SEARCH & FILTER CONTROLS */}
      <div className="web-card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <h2 className="web-card-title" style={{ fontSize: '1.2rem' }}>Product Inventory & Specifications</h2>
            <span className="web-card-subtitle">
              Live pricing, stock allocations, and technical data matching user app catalog
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {/* Cement Type Filter Dropdown */}
            <select 
              className="location-filter-select"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              style={{ minWidth: '160px' }}
            >
              <option value="All">All Cement Types</option>
              <option value="PPC">PPC (Pozzolana)</option>
              <option value="OPC">OPC 53 Grade</option>
              <option value="PSC">PSC (Slag Cement)</option>
              <option value="White">White & Architectural</option>
              <option value="Composite">Composite Slag</option>
            </select>

            {/* Live Search */}
            <div className="header-search-container" style={{ width: '260px' }}>
              <Search size={16} className="header-search-icon" />
              <input 
                type="text" 
                placeholder="Search products, brands, specs..." 
                className="header-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <button className="btn-quick-action" onClick={onOpenAddModal}>
              <Plus size={16} />
              <span>Add New Product</span>
            </button>
          </div>
        </div>
      </div>

      {/* PRODUCTS TABLE WITH INDIVIDUAL PRODUCT ON/OFF TOGGLE */}
      <div className="web-card">
        <div className="table-responsive">
          <table className="web-table">
            <thead>
              <tr>
                <th style={{ width: '25%' }}>Product Image & Name</th>
                <th style={{ width: '15%' }}>Manufacturer Brand</th>
                <th style={{ width: '13%' }}>Cement Type</th>
                <th style={{ width: '10%' }}>Warehouse Stock</th>
                <th style={{ width: '11%' }}>Price per Bag</th>
                <th style={{ width: '14%' }}>User App Visibility (ON / OFF)</th>
                <th style={{ width: '12%', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                    <Package size={36} style={{ color: '#cbd5e1', marginBottom: '8px' }} />
                    <div style={{ fontWeight: 700, fontSize: '1rem', color: '#334155' }}>No products match your filter</div>
                    <div style={{ fontSize: '0.82rem' }}>Try selecting "All Brands" or clearing the search query.</div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map(prod => {
                  const brandStyle = getBrandBadgeStyle(prod.brandName || prod.specs?.brand);
                  const isProductLive = checkProductIsLive(prod);

                  return (
                    <tr 
                      key={prod.id}
                      style={{
                        opacity: isProductLive ? 1 : 0.65,
                        background: isProductLive ? 'transparent' : 'rgba(241, 245, 249, 0.4)'
                      }}
                    >
                      {/* Product Thumbnail & Name */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <div className="product-image-thumbnail">
                            {prod.image ? (
                              <img src={prod.image} alt={prod.name} className="prod-img" onError={(e) => { e.target.src = '/petra_cement_bag.jpg'; }} />
                            ) : (
                              <div className="prod-img-fallback">
                                <Package size={22} />
                              </div>
                            )}
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '0.94rem', color: isProductLive ? '#0f172a' : '#64748b' }}>
                              {prod.name}
                            </div>
                            <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                              {prod.subtitle || prod.specs?.features}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Brand Badge Column */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <span 
                            style={{ 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              gap: '6px', 
                              padding: '4px 10px', 
                              borderRadius: '6px', 
                              fontSize: '0.78rem', 
                              fontWeight: 800, 
                              background: brandStyle.bg, 
                              color: brandStyle.color, 
                              border: `1px solid ${brandStyle.border}`,
                              width: 'fit-content'
                            }}
                          >
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: brandStyle.color }} />
                            {prod.brandName || prod.specs?.brand || 'Petra Cement'}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                            {prod.specs?.standard || 'BIS Certified'}
                          </span>
                        </div>
                      </td>

                      {/* Cement Type */}
                      <td>
                        <div style={{ fontWeight: 700, color: '#334155', fontSize: '0.88rem' }}>{prod.specs?.type || prod.name}</div>
                        <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>Pack: {prod.specs?.packagingSize || '50 kg'}</div>
                      </td>

                      {/* Stock */}
                      <td>
                        <div style={{ fontWeight: 800, color: '#1e293b' }}>{prod.stock}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          {prod.status === 'In Stock' ? 'Ready for Dispatch' : prod.status === 'Low Stock' ? 'Low Quantity' : prod.status === 'inactive' ? 'Turned OFF' : 'Nil Stock'}
                        </div>
                      </td>

                      {/* Price */}
                      <td>
                        <div style={{ fontWeight: 800, color: '#dc2626', fontSize: '1rem', letterSpacing: '-0.01em' }}>
                          {prod.price}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>Incl. GST (50kg)</div>
                      </td>

                      {/* INDIVIDUAL PRODUCT ON / OFF TOGGLE SWITCH */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <button
                            type="button"
                            onClick={() => handleToggleProductStatus(prod)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '5px 12px',
                              borderRadius: '999px',
                              border: isProductLive ? '1px solid #86efac' : '1px solid #cbd5e1',
                              background: isProductLive ? '#dcfce7' : '#f1f5f9',
                              color: isProductLive ? '#15803d' : '#64748b',
                              fontWeight: 800,
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                              width: 'fit-content',
                              transition: 'all 0.2s ease'
                            }}
                            title={isProductLive ? 'Click to turn OFF (Hide from mobile app)' : 'Click to turn ON (Show on mobile app)'}
                          >
                            
                            <span>{isProductLive ? 'LIVE (ON)' : 'OFF (Hidden)'}</span>
                          </button>
                          <span style={{ fontSize: '0.7rem', color: isProductLive ? '#16a34a' : '#dc2626', fontWeight: 600 }}>
                            {isProductLive ? 'Visible on App' : 'Concealed on App'}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button 
                            className="btn-action-edit"
                            title="Edit Product, Brand & Price"
                            onClick={() => setEditingProduct(JSON.parse(JSON.stringify(prod)))}
                          >
                            <Edit3 size={13} />
                            <span>Edit</span>
                          </button>

                          <button 
                            className="btn-action-specs"
                            title="View Technical Specifications"
                            onClick={() => setSelectedSpecProduct(prod)}
                          >
                            <FileText size={13} />
                            <span>Specs</span>
                          </button>

                          <button 
                            className="btn-action-delete"
                            title="Remove Product"
                            onClick={() => handleDelete(prod.id, prod.name)}
                          >
                            <Trash2 size={13} />
                          </button>
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

      {/* EDIT PRODUCT MODAL */}
      {editingProduct && (
        <div className="modal-overlay" onClick={() => setEditingProduct(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit3 size={18} style={{ color: '#dc2626' }} />
                Edit Cement Product
              </h3>
              <button 
                onClick={() => setEditingProduct(null)}
                style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSave} style={{ padding: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Product Title *</label>
                  <input
                    type="text"
                    required
                    value={editingProduct.name}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Brand</label>
                    <select
                      value={editingProduct.brandName || editingProduct.brand}
                      onChange={(e) => {
                        const bName = e.target.value;
                        const matched = brands.find(b => b.name === bName);
                        setEditingProduct({
                          ...editingProduct,
                          brandName: bName,
                          brandId: matched ? matched.id : editingProduct.brandId
                        });
                      }}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    >
                      {brands.map(b => (
                        <option key={b.id} value={b.name}>{b.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Price per Bag (₹) *</label>
                    <input
                      type="number"
                      required
                      value={editingProduct.numericPrice || parseInt(String(editingProduct.price).replace(/[^0-9]/g, '')) || 400}
                      onChange={(e) => setEditingProduct({ ...editingProduct, price: `₹${e.target.value}/bag`, numericPrice: parseInt(e.target.value) || 0 })}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>Cement Image Preset</label>
                  <select
                    value={editingProduct.image}
                    onChange={(e) => setEditingProduct({ ...editingProduct, image: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                  >
                    {bagPresets.map((bg, idx) => (
                      <option key={idx} value={bg.src}>{bg.brand} - {bg.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  style={{ padding: '9px 18px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-quick-action"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TECH SPECS MODAL */}
      {selectedSpecProduct && (
        <div className="modal-overlay" onClick={() => setSelectedSpecProduct(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                Technical Data Sheet - {selectedSpecProduct.name}
              </h3>
              <button onClick={() => setSelectedSpecProduct(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>STANDARD:</span>
                  <div style={{ fontWeight: 800, color: '#0f172a' }}>{selectedSpecProduct.specs?.standard || 'IS 1489 Part 1'}</div>
                </div>
                <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>COMPRESSIVE STRENGTH:</span>
                  <div style={{ fontWeight: 800, color: '#0f172a' }}>{selectedSpecProduct.specs?.compressiveStrength || '33+ MPa'}</div>
                </div>
                <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>FORMULATION TYPE:</span>
                  <div style={{ fontWeight: 800, color: '#0f172a' }}>{selectedSpecProduct.specs?.type || selectedSpecProduct.name}</div>
                </div>
                <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px' }}>
                  <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 700 }}>PACKAGING:</span>
                  <div style={{ fontWeight: 800, color: '#0f172a' }}>{selectedSpecProduct.specs?.packagingSize || '50 kg'} HDPE Bag</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
