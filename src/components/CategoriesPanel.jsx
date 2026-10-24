import React, { useState } from 'react';
import { 
  Tags, 
  Award, 
  Plus, 
  ToggleLeft, 
  ToggleRight, 
  Edit2, 
  X, 
  Layers, 
  Building2,
  ArrowLeft,
  Package,
  Check,
  Power,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sliders,
  Filter
} from 'lucide-react';
import adminApi from '../services/api';

export default function CategoriesPanel({ 
  categories = [], 
  setCategories, 
  brands = [], 
  setBrands,
  products = [], 
  setProducts,
  onToggleBrand, 
  onToggleProduct,
  onToggleCementType,
  onUpdateBrand, 
  onAddItem,
  onOpenAddModal 
}) {
  const [activeTab, setActiveTab] = useState('brands'); // 'brands' or 'categories'
  const [selectedBrandId, setSelectedBrandId] = useState(null); // When set, shows Brand Detail Page
  const [editingBrand, setEditingBrand] = useState(null);
  const [loadingAction, setLoadingAction] = useState(null);
  const [selectedGradeFilter, setSelectedGradeFilter] = useState('all');
  const [toast, setToast] = useState(null);
  const [isAddBrandOpen, setIsAddBrandOpen] = useState(false);
  const [isAddFormulationOpen, setIsAddFormulationOpen] = useState(false);
  const [formulationBrand, setFormulationBrand] = useState(null);

  // New Brand Form State
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandCompany, setNewBrandCompany] = useState('');
  const [newBrandTagline, setNewBrandTagline] = useState('');
  const [newBrandColor, setNewBrandColor] = useState('#ca8a04');
  const [newBrandImage, setNewBrandImage] = useState('/petra_cement_bag.jpg');

  // New Formulation Form State
  const [newProdName, setNewProdName] = useState('');
  const [newProdGrade, setNewProdGrade] = useState('PPC (Pozzolana Portland Cement)');
  const [newProdPrice, setNewProdPrice] = useState('390');
  const [newProdStock, setNewProdStock] = useState('500');
  const [newProdUsage, setNewProdUsage] = useState('Structural concrete, columns, slabs & brick masonry');
  const [newProdFeatures, setNewProdFeatures] = useState('High compressive strength, low heat of hydration, crack resistant');
  const [newProdStrength, setNewProdStrength] = useState('53+ MPa at 28 days');

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Find currently selected brand object
  
  // Helper: Robust product visibility check
  const checkProductIsLive = (p) => {
    if (!p) return false;
    if (typeof p.active === 'boolean') return p.active;
    if (p.status === 'inactive' || p.status === 'Inactive' || p.status === 'Out') return false;
    if (p.rawStatus === 'inactive') return false;
    return true;
  };

  const selectedBrand = selectedBrandId 
    ? brands.find(b => b.id === selectedBrandId) || null 
    : null;

  // Helper: Filter products by brand
  const getBrandProducts = (brand) => {
    if (!brand) return [];
    const bId = (brand.id || '').toLowerCase();
    const bName = (brand.name || '').toLowerCase();
    return products.filter(p => {
      const pBrandId = (p.brandId || '').toLowerCase();
      const pBrandName = (p.brand || p.brandName || '').toLowerCase();
      const pName = (p.name || '').toLowerCase();
      return pBrandId === bId || 
             pBrandName.includes(bId) || 
             bName.includes(pBrandName) || 
             pName.includes(bId);
    });
  };

  // Helper: Extract distinct cement formulation types for a brand
  const getBrandCementTypes = (brand) => {
    const brandProds = getBrandProducts(brand);
    const typeMap = {};

    brandProds.forEach(p => {
      let grade = ((p.specs && p.specs.grade) || p.grade || p.type || '').toUpperCase();
      if (!grade) {
        if (p.name.includes('53') || p.name.includes('OPC')) grade = 'OPC 53';
        else if (p.name.includes('PPC')) grade = 'PPC';
        else if (p.name.includes('PSC')) grade = 'PSC';
        else if (p.name.includes('White') || p.name.includes('Birla')) grade = 'White';
        else grade = 'Standard';
      }

      if (!typeMap[grade]) {
        typeMap[grade] = {
          grade,
          products: [],
          activeCount: 0
        };
      }
      typeMap[grade].products.push(p);
      const isLive = checkProductIsLive(p);
      if (isLive) {
        typeMap[grade].activeCount++;
      }
    });

    return Object.values(typeMap).map(t => ({
      ...t,
      productCount: t.products.length,
      isActive: t.activeCount > 0
    }));
  };

  // 1. Master Toggle for Total Brand (Entire brand ON / OFF)
  const handleToggleBrandTotal = async (brand) => {
    const newActiveState = !brand.active;
    setLoadingAction(`brand-${brand.id}`);

    try {
      if (onToggleBrand) {
        await onToggleBrand(brand.id);
      } else {
        await adminApi.toggleBrand(brand.id, newActiveState);
        if (setBrands) {
          setBrands(brands.map(b => b.id === brand.id ? { ...b, active: newActiveState } : b));
        }
      }

      // Also update all products of this brand to match brand visibility
      const brandProds = getBrandProducts(brand);
      for (const p of brandProds) {
        const isLive = checkProductIsLive(p);
        if (isLive !== newActiveState) {
          if (onToggleProduct) {
            await onToggleProduct(p.id, newActiveState);
          } else {
            await adminApi.toggleProduct(p.id, newActiveState);
          }
        }
      }

      showToast(
        `Brand '${brand.name}' is now ${newActiveState ? 'LIVE on User App (All products active)' : 'OFF (Hidden from User App)'}!`,
        newActiveState ? 'success' : 'warning'
      );
    } catch (err) {
      console.error('Failed to toggle brand:', err);
      showToast(`Error updating brand: ${err.message || 'Server error'}`, 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  // 2. Toggle Specific Cement Formulation Type under this Brand
  const handleToggleBrandCementType = async (brand, typeName, currentActive) => {
    const newActiveState = !currentActive;
    setLoadingAction(`type-${typeName}`);

    try {
      const brandProds = getBrandProducts(brand);
      const matchingProds = brandProds.filter(p => {
        const g = ((p.specs && p.specs.grade) || p.grade || p.type || '').toUpperCase();
        const n = (p.name || '').toUpperCase();
        if (typeName === 'OPC 53') return g.includes('OPC') || g.includes('53') || n.includes('53');
        if (typeName === 'PPC') return g.includes('PPC') || n.includes('PPC');
        if (typeName === 'PSC') return g.includes('PSC') || n.includes('PSC');
        if (typeName === 'White') return g.includes('WHITE') || n.includes('WHITE') || n.includes('BIRLA');
        return g.includes(typeName.toUpperCase()) || n.includes(typeName.toUpperCase());
      });

      for (const p of matchingProds) {
        if (onToggleProduct) {
          await onToggleProduct(p.id, newActiveState);
        } else {
          await adminApi.toggleProduct(p.id, newActiveState);
        }
      }

      showToast(
        `'${typeName}' cement type in '${brand.name}' turned ${newActiveState ? 'ON (Live on App)' : 'OFF (Hidden from App)'}!`,
        newActiveState ? 'success' : 'warning'
      );
    } catch (err) {
      console.error('Failed to toggle brand cement type:', err);
      showToast(`Error toggling type: ${err.message || 'Server error'}`, 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  // 3. Toggle Single Product
  const handleToggleSingleProduct = async (product) => {
    const isLive = checkProductIsLive(product);
    const newActiveState = !isLive;
    setLoadingAction(`prod-${product.id}`);

    try {
      if (onToggleProduct) {
        await onToggleProduct(product.id, newActiveState);
      } else {
        await adminApi.toggleProduct(product.id, newActiveState);
        if (setProducts) {
          setProducts(products.map(p => p.id === product.id ? { ...p, status: newActiveState ? 'active' : 'inactive', active: newActiveState } : p));
        }
      }

      showToast(
        `'${product.name}' is now ${newActiveState ? 'LIVE on Mobile App' : 'OFF (Hidden)'}!`,
        newActiveState ? 'success' : 'warning'
      );
    } catch (err) {
      console.error('Failed to toggle product:', err);
      showToast(`Error: ${err.message || 'Server error'}`, 'error');
    } finally {
      setLoadingAction(null);
    }
  };

  // Category toggle in Tab 2
  const toggleCategory = (id) => {
    if (setCategories) {
      setCategories(categories.map(c => {
        if (c.id === id) {
          return { ...c, active: !c.active };
        }
        return c;
      }));
    }
  };

  // Handler: Create Brand
  const handleCreateBrand = async (e) => {
    e.preventDefault();
    if (!newBrandName.trim()) return;

    const brandSlug = newBrandName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const newBrandObj = {
      id: brandSlug || ('brand_' + Date.now()),
      name: newBrandName.trim(),
      company: newBrandCompany.trim() || (newBrandName.trim() + ' Ltd.'),
      tagline: newBrandTagline.trim() || 'Engineered for Lifetime Strength',
      brandColor: newBrandColor || '#ca8a04',
      bgLightColor: '#f8fafc',
      image: newBrandImage || '/petra_cement_bag.jpg',
      active: true,
      productCount: 0
    };

    if (brands.some(b => (b.id || '').toLowerCase() === newBrandObj.id || (b.name || '').toLowerCase() === newBrandObj.name.toLowerCase())) {
      showToast(`A brand named '${newBrandObj.name}' already exists.`, 'error');
      return;
    }

    if (onAddItem) {
      await onAddItem('brands', newBrandObj);
    } else {
      const res = await adminApi.createBrand(newBrandObj);
      if (!res?.success) {
        showToast(`Could not create brand: ${res?.message || res?.error || 'Server error'}`, 'error');
        return;
      }
      if (setBrands) setBrands(prev => [{ ...newBrandObj, ...(res.data || {}) }, ...prev]);
    }

    showToast(`Brand '${newBrandObj.name}' added successfully and active in catalogue!`, 'success');
    setIsAddBrandOpen(false);
    setNewBrandName('');
    setNewBrandCompany('');
    setNewBrandTagline('');
    setNewBrandColor('#ca8a04');
    setNewBrandImage('/petra_cement_bag.jpg');
  };

  // Handler: Create Formulation under Brand
  const handleCreateFormulation = async (e) => {
    e.preventDefault();
    const targetBrand = formulationBrand || selectedBrand || (brands.length > 0 ? brands[0] : null);
    if (!targetBrand || !newProdName.trim()) return;

    let gradeCode = 'PPC';
    if (newProdGrade.includes('53') || newProdGrade.includes('OPC')) gradeCode = 'OPC 53';
    else if (newProdGrade.includes('PSC')) gradeCode = 'PSC';
    else if (newProdGrade.includes('White')) gradeCode = 'White';
    else if (newProdGrade.includes('Composite')) gradeCode = 'Composite';

    const numPrice = parseInt(String(newProdPrice).replace(/[^0-9]/g, '')) || 390;
    const numStock = parseInt(String(newProdStock).replace(/[^0-9]/g, '')) || 500;

    const newProdObj = {
      id: Date.now(),
      brandId: targetBrand.id,
      brandName: targetBrand.name,
      name: newProdName.trim(),
      subtitle: `${targetBrand.name} - ${gradeCode} Formulation`,
      stock: `${numStock} bags`,
      price: `₹${numPrice}/bag`,
      numericPrice: numPrice,
      status: 'In Stock',
      active: true,
      rawStatus: 'active',
      isLive: true,
      image: targetBrand.image || '/petra_cement_bag.jpg',
      specs: {
        packagingSize: '50 kg',
        grade: gradeCode,
        type: newProdGrade,
        packagingType: 'HDPE Sack Bag',
        brand: targetBrand.name,
        usage: newProdUsage,
        color: 'Grey',
        features: newProdFeatures,
        compressiveStrength: newProdStrength,
        standard: gradeCode.includes('53') ? 'IS 12269' : gradeCode.includes('PPC') ? 'IS 1489' : 'IS 455'
      }
    };

    if (onAddItem) {
      await onAddItem('products', newProdObj);
    } else {
      if (setProducts) setProducts(prev => [newProdObj, ...prev]);
      try {
        await adminApi.createProduct(newProdObj);
      } catch (err) {
        console.warn('Backend queued product:', err);
      }
    }

    showToast(`Formulation '${newProdObj.name}' added to '${targetBrand.name}' and live on User App!`, 'success');
    setIsAddFormulationOpen(false);
    setNewProdName('');
    setNewProdPrice('390');
    setNewProdStock('500');
  };

  const handleBrandSave = (e) => {
    e.preventDefault();
    if (!editingBrand) return;
    if (onUpdateBrand) {
      onUpdateBrand(editingBrand);
    }
    setEditingBrand(null);
    showToast(`Brand '${editingBrand.name}' details saved successfully!`);
  };

  return (
    <div>
      {/* Toast Alert Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          background: toast.type === 'error' ? '#991b1b' : toast.type === 'warning' ? '#92400e' : '#065f46',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '10px',
          boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.88rem',
          fontWeight: 700
        }}>
          {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div className="web-card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {selectedBrand && (
                <button
                  type="button"
                  onClick={() => setSelectedBrandId(null)}
                  style={{
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '6px 12px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: '#334155',
                    marginRight: '6px'
                  }}
                  title="Return to all brands"
                >
                  <ArrowLeft size={14} /> Back to All Brands
                </button>
              )}
              <h2 className="web-card-title" style={{ fontSize: '1.2rem', margin: 0 }}>
                {selectedBrand 
                  ? `${selectedBrand.name} - Products & Types Control` 
                  : 'Brands & Category Architecture'}
              </h2>
            </div>
            <span className="web-card-subtitle" style={{ display: 'block', marginTop: '4px' }}>
              {selectedBrand 
                ? `Turn off the total brand at the top, or turn off specific cement types and individual products in the table below` 
                : 'Configure manufacturer brand catalogues and cement grade classifications matching user side app'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* View Switcher Tabs (Only visible when not drilled into a brand) */}
            {!selectedBrand && (
              <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '8px', gap: '4px' }}>
                <button
                  type="button"
                  className={`nav-item ${activeTab === 'brands' ? 'active' : ''}`}
                  style={{ padding: '6px 14px', width: 'auto', fontSize: '0.82rem', margin: 0, borderRadius: '6px' }}
                  onClick={() => setActiveTab('brands')}
                >
                  <Award size={14} style={{ marginRight: '6px' }} />
                  <span>Brand Catalogues ({brands.length})</span>
                </button>
                <button
                  type="button"
                  className={`nav-item ${activeTab === 'categories' ? 'active' : ''}`}
                  style={{ padding: '6px 14px', width: 'auto', fontSize: '0.82rem', margin: 0, borderRadius: '6px' }}
                  onClick={() => setActiveTab('categories')}
                >
                  <Layers size={14} style={{ marginRight: '6px' }} />
                  <span>Grade Categories ({categories.length})</span>
                </button>
              </div>
            )}

            <button
              className="btn-quick-action"
              onClick={() => (activeTab === 'brands' ? setIsAddBrandOpen(true) : onOpenAddModal())}
            >
              <Plus size={16} />
              <span>{activeTab === 'brands' ? 'Add Brand' : 'Add Category'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* VIEW 1: ALL BRANDS LIST (When no brand is selected)                       */}
      {/* ========================================================================= */}
      {activeTab === 'brands' && !selectedBrand && (
        <div className="web-card">
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Building2 size={18} style={{ color: '#dc2626' }} />
              <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>
                Manufacturer Brand Catalogues ({brands.length} Brands)
              </span>
            </div>
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
              Click any brand to manage its cement types & products, or toggle the total brand ON/OFF
            </span>
          </div>

          <div className="table-responsive">
            <table className="web-table">
              <thead>
                <tr>
                  <th>Brand & Packaging</th>
                  <th>Parent Company</th>
                  <th>Products in Catalog</th>
                  <th>Customer App Status</th>
                  <th style={{ textAlign: 'right' }}>Actions & Visibility</th>
                </tr>
              </thead>
              <tbody>
                {brands.map(brand => {
                  const brandProds = getBrandProducts(brand);
                  const activeProdsCount = brandProds.filter(p => checkProductIsLive(p)).length;
                  const isBrandActive = brand.active !== false;
                  const isLoading = loadingAction === `brand-${brand.id}`;

                  return (
                    <tr 
                      key={brand.id}
                      style={{ 
                        cursor: 'pointer',
                        transition: 'background 0.15s ease'
                      }}
                      onClick={() => setSelectedBrandId(brand.id)}
                    >
                      {/* Brand Logo & Name */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <div style={{ 
                            width: '48px', 
                            height: '48px', 
                            borderRadius: '10px', 
                            border: '1px solid #e2e8f0', 
                            background: brand.bgLightColor || '#ffffff', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            overflow: 'hidden', 
                            flexShrink: 0 
                          }}>
                            {brand.image ? (
                              <img 
                                src={brand.image} 
                                alt={brand.name} 
                                style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '3px' }} 
                                onError={(e) => { e.target.src = '/petra_cement_bag.jpg'; }} 
                              />
                            ) : (
                              <Award size={22} style={{ color: brand.brandColor || '#dc2626' }} />
                            )}
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '0.98rem', color: '#0f172a' }}>
                              {brand.name}
                            </div>
                            <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600 }}>
                              {brand.tagline || `ID: ${brand.id}`}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Parent Company */}
                      <td>
                        <div style={{ fontWeight: 700, color: '#334155', fontSize: '0.9rem' }}>
                          {brand.company || 'Corporate Group'}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                          Official Manufacturer
                        </div>
                      </td>

                      {/* Products in Catalog */}
                      <td>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '4px 10px', borderRadius: '8px' }}>
                          <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>
                            {activeProdsCount} / {brandProds.length}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>
                            live formulations
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td>
                        <span className={isBrandActive ? 'brand-status-badge active' : 'brand-status-badge inactive'}>
                          
                          <span>{isBrandActive ? 'Live on Mobile App' : 'Turned OFF / Hidden'}</span>
                        </span>
                      </td>

                      {/* Actions & Visibility Toggle */}
                      <td>
                        <div 
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}
                          onClick={(e) => e.stopPropagation()} // Prevent double row trigger
                        >
                          {/* Manage Types & Products Button */}
                          <button
                            type="button"
                            onClick={() => setSelectedBrandId(brand.id)}
                            style={{
                              background: '#f8fafc',
                              border: '1px solid #cbd5e1',
                              borderRadius: '8px',
                              padding: '6px 12px',
                              fontSize: '0.78rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              color: '#0f172a'
                            }}
                            title="Open brand products and formulation types"
                          >
                            <span>Manage Types & Products</span>
                            <ChevronRight size={14} />
                          </button>

                          {/* Edit Brand Info */}
                          <button 
                            type="button"
                            className="btn-action-edit"
                            onClick={() => setEditingBrand(JSON.parse(JSON.stringify(brand)))}
                            title="Edit Brand Information"
                          >
                            <Edit2 size={13} />
                          </button>

                          {/* Quick Total Brand Toggle Switch */}
                          <button 
                            type="button"
                            disabled={isLoading}
                            className={`btn-brand-toggle ${isBrandActive ? 'active' : 'inactive'}`}
                            onClick={() => handleToggleBrandTotal(brand)}
                            title={isBrandActive ? 'Click to hide entire brand from user mobile app' : 'Click to show brand on user mobile app'}
                            aria-label="Toggle Visibility"
                          >
                            {isLoading ? (
                              <RefreshCw size={22} className="spin-anim" />
                            ) : isBrandActive ? (
                              <ToggleRight size={32} />
                            ) : (
                              <ToggleLeft size={32} />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW 2: DEDICATED BRAND CONTROL PAGE (ONE UNIFIED TABLE ONLY)             */}
      {/* ========================================================================= */}
      {activeTab === 'brands' && selectedBrand && (
        <div>
          {/* Card 1: TOTAL BRAND MASTER SWITCH */}
          <div className="web-card" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ 
                  width: '64px', 
                  height: '64px', 
                  borderRadius: '12px', 
                  border: '1px solid #e2e8f0', 
                  background: selectedBrand.bgLightColor || '#ffffff', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  overflow: 'hidden', 
                  flexShrink: 0 
                }}>
                  {selectedBrand.image ? (
                    <img 
                      src={selectedBrand.image} 
                      alt={selectedBrand.name} 
                      style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }} 
                      onError={(e) => { e.target.src = '/petra_cement_bag.jpg'; }} 
                    />
                  ) : (
                    <Award size={32} style={{ color: selectedBrand.brandColor || '#dc2626' }} />
                  )}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h3 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                      {selectedBrand.name}
                    </h3>
                    <span className={selectedBrand.active !== false ? 'brand-status-badge active' : 'brand-status-badge inactive'}>
                      
                      <span>{selectedBrand.active !== false ? 'Total Brand is LIVE' : 'Total Brand is TURNED OFF'}</span>
                    </span>
                  </div>
                  <div style={{ fontSize: '0.84rem', color: '#64748b', marginTop: '2px' }}>
                    {selectedBrand.company} • <em>{selectedBrand.tagline}</em>
                  </div>
                </div>
              </div>

              {/* Master Total Brand Switch */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: selectedBrand.active !== false ? '#059669' : '#dc2626' }}>
                  {selectedBrand.active !== false ? 'BRAND LIVE (ON)' : 'BRAND TURNED OFF'}
                </span>

                <button
                  type="button"
                  disabled={loadingAction === `brand-${selectedBrand.id}`}
                  className={`btn-brand-toggle ${selectedBrand.active !== false ? 'active' : 'inactive'}`}
                  onClick={() => handleToggleBrandTotal(selectedBrand)}
                  title={selectedBrand.active !== false ? 'Turn entire brand OFF' : 'Turn entire brand ON'}
                  aria-label="Toggle Total Brand"
                >
                  {loadingAction === `brand-${selectedBrand.id}` ? (
                    <RefreshCw size={26} className="spin-anim" />
                  ) : selectedBrand.active !== false ? (
                    <ToggleRight size={38} />
                  ) : (
                    <ToggleLeft size={38} />
                  )}
                </button>
              </div>
            </div>

            {/* Metrics Counters Bar */}
            {(() => {
              const brandProds = getBrandProducts(selectedBrand);
              const liveCount = brandProds.filter(p => checkProductIsLive(p)).length;
              const offCount = brandProds.length - liveCount;
              const brandTypes = getBrandCementTypes(selectedBrand);

              return (
                <div style={{ 
                  display: 'flex', 
                  gap: '12px', 
                  marginTop: '18px', 
                  paddingTop: '16px', 
                  borderTop: '1px solid #f1f5f9',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#f8fafc', padding: '6px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <Package size={14} style={{ color: '#64748b' }} />
                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>Total Brand Products:</span>
                    <span style={{ fontWeight: 800, fontSize: '0.86rem', color: '#0f172a' }}>{brandProds.length}</span>
                  </div>

                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#ecfdf5', padding: '6px 12px', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                    
                    <span style={{ fontSize: '0.78rem', color: '#047857', fontWeight: 600 }}>Live on Mobile App:</span>
                    <span style={{ fontWeight: 800, fontSize: '0.86rem', color: '#065f46' }}>{liveCount}</span>
                  </div>

                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#fef2f2', padding: '6px 12px', borderRadius: '8px', border: '1px solid #fecaca' }}>
                    
                    <span style={{ fontSize: '0.78rem', color: '#b91c1c', fontWeight: 600 }}>Turned OFF / Hidden:</span>
                    <span style={{ fontWeight: 800, fontSize: '0.86rem', color: '#991b1b' }}>{offCount}</span>
                  </div>

                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#eff6ff', padding: '6px 12px', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                    <Layers size={14} style={{ color: '#2563eb' }} />
                    <span style={{ fontSize: '0.78rem', color: '#1d4ed8', fontWeight: 600 }}>Formulation Types:</span>
                    <span style={{ fontWeight: 800, fontSize: '0.86rem', color: '#1e3a8a' }}>{brandTypes.length} Types</span>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Card 2: THE SINGLE UNIFIED TABLE (Products & Cement Type Switches) */}
          {(() => {
            const allBrandProds = getBrandProducts(selectedBrand);
            const brandTypes = getBrandCementTypes(selectedBrand);

            // Filter products by selected grade
            const displayedProducts = selectedGradeFilter === 'all'
              ? allBrandProds
              : allBrandProds.filter(p => {
                  const g = ((p.specs && p.specs.grade) || p.grade || p.type || '').toUpperCase();
                  const n = (p.name || '').toUpperCase();
                  return g.includes(selectedGradeFilter.toUpperCase()) || n.includes(selectedGradeFilter.toUpperCase());
                });

            return (
              <div className="web-card">
                {/* Table Header with Embedded Cement Type Switches */}
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Package size={18} style={{ color: '#dc2626' }} />
                      <span style={{ fontWeight: 800, fontSize: '0.98rem', color: '#0f172a' }}>
                        {selectedBrand.name} Products Catalog ({displayedProducts.length} items)
                      </span>
                    </div>

                    <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                      Toggle individual product bags ON or OFF, or use the Cement Type switches below
                    </span>
                  </div>

                  {/* CEMENT TYPE SWITCHES & FILTER BAR (All in this single card!) */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '10px',
                    background: '#f8fafc',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                        Cement Type Switches:
                      </span>

                      {/* Grade Switches: 1-click turn off whole grade for this brand! */}
                      {brandTypes.map(t => {
                        const isLoading = loadingAction === `type-${t.grade}`;
                        return (
                          <div 
                            key={t.grade}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              background: '#ffffff',
                              border: t.isActive ? '1px solid #a7f3d0' : '1px solid #fecaca',
                              padding: '3px 8px',
                              borderRadius: '6px'
                            }}
                          >
                            <span style={{ 
                              fontSize: '0.78rem', 
                              fontWeight: 800,
                              color: t.isActive ? '#065f46' : '#991b1b'
                            }}>
                              {t.grade} ({t.productCount})
                            </span>

                            <button
                              type="button"
                              disabled={isLoading}
                              className={`btn-brand-toggle ${t.isActive ? 'active' : 'inactive'}`}
                              onClick={() => handleToggleBrandCementType(selectedBrand, t.grade, t.isActive)}
                              title={`Turn ${t.grade} ${t.isActive ? 'OFF' : 'ON'} for ${selectedBrand.name}`}
                              style={{ display: 'flex', alignItems: 'center' }}
                            >
                              {isLoading ? (
                                <RefreshCw size={14} className="spin-anim" />
                              ) : t.isActive ? (
                                <ToggleRight size={22} />
                              ) : (
                                <ToggleLeft size={22} />
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>

                    {/* Filter Pills */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ fontSize: '0.74rem', color: '#64748b' }}>Filter:</span>
                      <button
                        type="button"
                        onClick={() => setSelectedGradeFilter('all')}
                        style={{
                          padding: '3px 8px',
                          borderRadius: '6px',
                          border: 'none',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          background: selectedGradeFilter === 'all' ? '#0f172a' : '#e2e8f0',
                          color: selectedGradeFilter === 'all' ? '#ffffff' : '#475569'
                        }}
                      >
                        All ({allBrandProds.length})
                      </button>
                      {brandTypes.map(t => (
                        <button
                          key={t.grade}
                          type="button"
                          onClick={() => setSelectedGradeFilter(t.grade)}
                          style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            border: '1px solid #cbd5e1',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            background: selectedGradeFilter === t.grade ? '#2563eb' : '#ffffff',
                            color: selectedGradeFilter === t.grade ? '#ffffff' : '#334155'
                          }}
                        >
                          {t.grade}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* THE SINGLE PRODUCTS TABLE */}
                <div className="table-responsive">
                  <table className="web-table">
                    <thead>
                      <tr>
                        <th>Product & Packaging</th>
                        <th>Formulation Grade</th>
                        <th>Price / Unit</th>
                        <th>Status on Mobile App</th>
                        <th style={{ textAlign: 'right', width: '220px' }}>Product Switch (ON / OFF)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedProducts.length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                            No products found matching this filter.
                          </td>
                        </tr>
                      ) : (
                        displayedProducts.map(p => {
                          const isLive = checkProductIsLive(p);
                          const grade = (p.specs && p.specs.grade) || p.grade || (p.name.includes('53') ? 'OPC 53' : p.name.includes('PPC') ? 'PPC' : 'Standard');
                          const isUpdating = loadingAction === `prod-${p.id}`;

                          return (
                            <tr key={p.id}>
                              {/* Product Info */}
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <div style={{ 
                                    width: '42px', 
                                    height: '42px', 
                                    borderRadius: '8px', 
                                    border: '1px solid #e2e8f0', 
                                    background: '#f8fafc', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center', 
                                    overflow: 'hidden', 
                                    flexShrink: 0 
                                  }}>
                                    <img 
                                      src={p.image || '/petra_cement_bag.jpg'} 
                                      alt={p.name} 
                                      style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                                      onError={(e) => { e.target.src = '/petra_cement_bag.jpg'; }} 
                                    />
                                  </div>
                                  <div>
                                    <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0f172a' }}>
                                      {p.name}
                                    </div>
                                    <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
                                      {p.subtitle || p.shortDescription || '50kg HDPE Bag'}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              {/* Grade */}
                              <td>
                                <span style={{
                                  background: grade.includes('53') ? '#eff6ff' : grade.includes('PPC') ? '#f0fdf4' : '#faf5ff',
                                  color: grade.includes('53') ? '#1d4ed8' : grade.includes('PPC') ? '#15803d' : '#7e22ce',
                                  border: `1px solid ${grade.includes('53') ? '#bfdbfe' : grade.includes('PPC') ? '#bbf7d0' : '#e9d5ff'}`,
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  fontWeight: 700,
                                  fontSize: '0.74rem'
                                }}>
                                  {grade}
                                </span>
                              </td>

                              {/* Price */}
                              <td>
                                <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.9rem' }}>
                                  ₹{p.price || 380}
                                </div>
                              </td>

                              {/* Status */}
                              <td>
                                <span className={isLive ? 'brand-status-badge active' : 'brand-status-badge inactive'}>
                                  
                                  <span>{isLive ? 'Live on Mobile App' : 'Turned OFF / Hidden'}</span>
                                </span>
                              </td>

                              {/* Product Toggle Switch */}
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
                                  <span style={{ 
                                    fontSize: '0.78rem', 
                                    fontWeight: 800, 
                                    color: isLive ? '#059669' : '#dc2626' 
                                  }}>
                                    {isLive ? 'LIVE' : 'OFF'}
                                  </span>

                                  <button
                                    type="button"
                                    disabled={isUpdating}
                                    className={`btn-brand-toggle ${isLive ? 'active' : 'inactive'}`}
                                    onClick={() => handleToggleSingleProduct(p)}
                                    title={isLive ? 'Click to Turn OFF this product' : 'Click to Turn ON this product'}
                                    aria-label="Toggle Product Visibility"
                                  >
                                    {isUpdating ? (
                                      <RefreshCw size={24} className="spin-anim" />
                                    ) : isLive ? (
                                      <ToggleRight size={34} />
                                    ) : (
                                      <ToggleLeft size={34} />
                                    )}
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
            );
          })()}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: GRADE CATEGORIES MANAGEMENT (Global BIS Categories)               */}
      {/* ========================================================================= */}
      {activeTab === 'categories' && !selectedBrand && (
        <div className="web-card">
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Tags size={18} style={{ color: '#dc2626' }} />
              <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>
                Technical Cement Grade Classifications
              </span>
            </div>
            <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
              Standard Bureau of Indian Standards (BIS) grade categories
            </span>
          </div>

          <div className="table-responsive">
            <table className="web-table">
              <thead>
                <tr>
                  <th>Category / Grade Name</th>
                  <th>BIS Technical Code</th>
                  <th>Active Products Count</th>
                  <th>Status</th>
                  <th>Category Toggle</th>
                </tr>
              </thead>
              <tbody>
                {categories.map(cat => (
                  <tr key={cat.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className="agent-loc-icon" style={{ background: '#fef2f2', color: '#dc2626' }}>
                          <Tags size={18} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{cat.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Industrial Construction Formulation</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontWeight: 700, color: '#475569', fontSize: '0.85rem' }}>
                      <span style={{ background: '#f1f5f9', padding: '3px 8px', borderRadius: '4px' }}>
                        {cat.standard || 'IS Standard'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: '#334155' }}>{cat.productsCount} products</td>
                    <td>
                      <span className={cat.active ? 'badge-status-live' : 'badge-status-offline'}>
                        {cat.active ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td>
                      <button 
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: cat.active ? '#dc2626' : '#94a3b8' }}
                        onClick={() => toggleCategory(cat.id)}
                        title="Toggle Category Visibility"
                      >
                        {cat.active ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* EDIT BRAND MODAL                                                          */}
      {/* ========================================================================= */}
      {editingBrand && (
        <div className="modal-overlay" onClick={() => setEditingBrand(null)}>
          <div className="modal-card" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-box">
                <Edit2 size={20} style={{ color: '#dc2626' }} />
                <h3 className="modal-title">Edit Brand Partner Details</h3>
              </div>
              <button 
                type="button" 
                className="modal-close-btn"
                onClick={() => setEditingBrand(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <form onSubmit={handleBrandSave}>
                <div className="web-form-group">
                  <label className="web-form-label">BRAND NAME</label>
                  <input 
                    type="text" 
                    required 
                    className="web-form-input"
                    value={editingBrand.name}
                    onChange={(e) => setEditingBrand({ ...editingBrand, name: e.target.value })}
                  />
                </div>

                <div className="web-form-group">
                  <label className="web-form-label">MANUFACTURER / PARENT COMPANY</label>
                  <input 
                    type="text" 
                    required 
                    className="web-form-input"
                    value={editingBrand.company}
                    onChange={(e) => setEditingBrand({ ...editingBrand, company: e.target.value })}
                  />
                </div>

                <div className="web-form-group">
                  <label className="web-form-label">OFFICIAL BRAND TAGLINE</label>
                  <input 
                    type="text" 
                    className="web-form-input"
                    value={editingBrand.tagline}
                    onChange={(e) => setEditingBrand({ ...editingBrand, tagline: e.target.value })}
                    placeholder="e.g. The Engineer's Choice"
                  />
                </div>

                <div className="form-grid-2col">
                  <div className="web-form-group">
                    <label className="web-form-label">BRAND ACCENT COLOR (HEX)</label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input 
                        type="color" 
                        value={editingBrand.brandColor || '#ca8a04'}
                        onChange={(e) => setEditingBrand({ ...editingBrand, brandColor: e.target.value })}
                        style={{ width: '40px', height: '38px', borderRadius: '6px', border: '1px solid #cbd5e1', cursor: 'pointer' }}
                      />
                      <input 
                        type="text" 
                        className="web-form-input"
                        value={editingBrand.brandColor}
                        onChange={(e) => setEditingBrand({ ...editingBrand, brandColor: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="web-form-group">
                    <label className="web-form-label">CATALOG STATUS</label>
                    <select 
                      className="web-form-select"
                      value={editingBrand.active ? 'active' : 'disabled'}
                      onChange={(e) => setEditingBrand({ ...editingBrand, active: e.target.value === 'active' })}
                    >
                      <option value="active">Active (Visible on User App)</option>
                      <option value="disabled">Disabled (Hidden from User App)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                  <button 
                    type="button" 
                    className="btn-modal-cancel"
                    onClick={() => setEditingBrand(null)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary-submit"
                    style={{ width: 'auto', padding: '0 24px' }}
                  >
                    Save Brand Updates
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    
      {/* ========================================================================= */}
      {/* MODAL 1: ADD NEW BRAND PARTNER                                            */}
      {/* ========================================================================= */}
      {isAddBrandOpen && (
        <div className="modal-overlay" onClick={() => setIsAddBrandOpen(false)}>
          <div className="modal-card" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-box">
                <Building2 size={20} style={{ color: '#dc2626' }} />
                <h3 className="modal-title">Register New Cement Brand</h3>
              </div>
              <button 
                type="button" 
                className="modal-close-btn"
                onClick={() => setIsAddBrandOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <form onSubmit={handleCreateBrand}>
                <div className="web-form-group">
                  <label className="web-form-label">BRAND NAME *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. ACC Cement, Chettinad Cement, Penna Cement"
                    className="web-form-input"
                    value={newBrandName}
                    onChange={(e) => setNewBrandName(e.target.value)}
                  />
                </div>

                <div className="web-form-group">
                  <label className="web-form-label">PARENT COMPANY *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Adani Group, Chettinad Group Ltd"
                    className="web-form-input"
                    value={newBrandCompany}
                    onChange={(e) => setNewBrandCompany(e.target.value)}
                  />
                </div>

                <div className="web-form-group">
                  <label className="web-form-label">OFFICIAL TAGLINE / SLOGAN</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Pahad Se Mazboot, As Strong As Steel"
                    className="web-form-input"
                    value={newBrandTagline}
                    onChange={(e) => setNewBrandTagline(e.target.value)}
                  />
                </div>

                <div className="form-grid-2col">
                  <div className="web-form-group">
                    <label className="web-form-label">BRAND THEME COLOR</label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input 
                        type="color" 
                        value={newBrandColor}
                        onChange={(e) => setNewBrandColor(e.target.value)}
                        style={{ width: '42px', height: '38px', borderRadius: '6px', border: '1px solid #cbd5e1', cursor: 'pointer' }}
                      />
                      <input 
                        type="text" 
                        className="web-form-input"
                        value={newBrandColor}
                        onChange={(e) => setNewBrandColor(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="web-form-group">
                    <label className="web-form-label">BAG IMAGE PRESET</label>
                    <select 
                      className="web-form-select"
                      value={newBrandImage}
                      onChange={(e) => setNewBrandImage(e.target.value)}
                    >
                      <option value="/petra_cement_bag.jpg">Petra Standard Bag</option>
                      <option value="/cements/ultratech-super-ppc.png">UltraTech Gold Style</option>
                      <option value="/cements/ramco-supergrade.png">Ramco Orange Style</option>
                      <option value="/cements/dalmia-dsp.png">Dalmia Blue Style</option>
                      <option value="/cements/jsw-concreel-hd.png">JSW Green Style</option>
                      <option value="/cements/zuari-ppc.png">Zuari Slate Style</option>
                      <option value="/cements/maha-bag.png">Maha Cement Style</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                  <button 
                    type="button" 
                    className="btn-modal-cancel"
                    onClick={() => setIsAddBrandOpen(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary-submit"
                    style={{ width: 'auto', padding: '0 24px', background: '#dc2626' }}
                  >
                    Save & Create Brand
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ADD NEW FORMULATION / CATEGORY UNDER BRAND                       */}
      {/* ========================================================================= */}
      {isAddFormulationOpen && (
        <div className="modal-overlay" onClick={() => setIsAddFormulationOpen(false)}>
          <div className="modal-card" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-box">
                <Package size={20} style={{ color: '#059669' }} />
                <h3 className="modal-title">
                  Add Formulation to {formulationBrand ? formulationBrand.name : (selectedBrand ? selectedBrand.name : 'Brand')}
                </h3>
              </div>
              <button 
                type="button" 
                className="modal-close-btn"
                onClick={() => setIsAddFormulationOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ maxHeight: '78vh', overflowY: 'auto' }}>
              <form onSubmit={handleCreateFormulation}>
                {/* Brand Selector if not fixed */}
                {!selectedBrand && (
                  <div className="web-form-group">
                    <label className="web-form-label">TARGET BRAND CATALOGUE *</label>
                    <select 
                      className="web-form-select"
                      value={formulationBrand ? formulationBrand.id : (brands[0]?.id || '')}
                      onChange={(e) => {
                        const found = brands.find(b => b.id === e.target.value);
                        setFormulationBrand(found);
                      }}
                    >
                      {brands.map(b => (
                        <option key={b.id} value={b.id}>{b.name} ({b.company})</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="form-grid-2col">
                  <div className="web-form-group">
                    <label className="web-form-label">PRODUCT / FORMULATION NAME *</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="e.g. UltraTech Super PPC, ACC Suraksha Power"
                      className="web-form-input"
                      value={newProdName}
                      onChange={(e) => setNewProdName(e.target.value)}
                    />
                  </div>

                  <div className="web-form-group">
                    <label className="web-form-label">CEMENT GRADE CATEGORY *</label>
                    <select 
                      className="web-form-select"
                      value={newProdGrade}
                      onChange={(e) => setNewProdGrade(e.target.value)}
                    >
                      <option value="OPC 53 (Ordinary Portland Cement)">OPC 53 Grade (High Structural RCC)</option>
                      <option value="PPC (Pozzolana Portland Cement)">PPC (Pozzolana Fly Ash Durable)</option>
                      <option value="PSC (Portland Slag Cement)">PSC (Portland Slag Marine / Coastal)</option>
                      <option value="White & Architectural Cement">White Architectural Cement</option>
                      <option value="Premium High Strength Structural">Premium High Strength Structural</option>
                    </select>
                  </div>
                </div>

                <div className="form-grid-2col">
                  <div className="web-form-group">
                    <label className="web-form-label">PRICE PER BAG (₹) *</label>
                    <input 
                      type="number" 
                      required 
                      placeholder="e.g. 390"
                      className="web-form-input"
                      value={newProdPrice}
                      onChange={(e) => setNewProdPrice(e.target.value)}
                    />
                  </div>

                  <div className="web-form-group">
                    <label className="web-form-label">INITIAL WAREHOUSE STOCK (BAGS) *</label>
                    <input 
                      type="number" 
                      required 
                      placeholder="e.g. 500"
                      className="web-form-input"
                      value={newProdStock}
                      onChange={(e) => setNewProdStock(e.target.value)}
                    />
                  </div>
                </div>

                <div className="web-form-group">
                  <label className="web-form-label">RECOMMENDED USAGE</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Concrete slabs, columns, foundations, plastering"
                    className="web-form-input"
                    value={newProdUsage}
                    onChange={(e) => setNewProdUsage(e.target.value)}
                  />
                </div>

                <div className="web-form-group">
                  <label className="web-form-label">ENGINEERING HIGHLIGHTS / FEATURES</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Low heat of hydration, sulfate resistant, ultra fine particles"
                    className="web-form-input"
                    value={newProdFeatures}
                    onChange={(e) => setNewProdFeatures(e.target.value)}
                  />
                </div>

                <div className="form-grid-2col">
                  <div className="web-form-group">
                    <label className="web-form-label">COMPRESSIVE STRENGTH</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 53+ MPa at 28 days"
                      className="web-form-input"
                      value={newProdStrength}
                      onChange={(e) => setNewProdStrength(e.target.value)}
                    />
                  </div>

                  <div className="web-form-group">
                    <label className="web-form-label">PACKAGING SPECIFICATION</label>
                    <input 
                      type="text" 
                      readOnly 
                      value="50 kg HDPE Tamper-Proof Sack Bag"
                      className="web-form-input"
                      style={{ background: '#f1f5f9' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '20px' }}>
                  <button 
                    type="button" 
                    className="btn-modal-cancel"
                    onClick={() => setIsAddFormulationOpen(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn-primary-submit"
                    style={{ width: 'auto', padding: '0 24px', background: '#059669' }}
                  >
                    Save & Publish to User App
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
