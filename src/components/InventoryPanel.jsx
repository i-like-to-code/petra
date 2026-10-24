import React, { useState, useMemo } from 'react';
import { 
  Warehouse, 
  Package, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Plus, 
  Edit3, 
  TrendingUp, 
  RefreshCw, 
  Filter,
  Check,
  Building2,
  Boxes,
  ArrowUpRight
} from 'lucide-react';
import adminApi from '../services/api';

export default function InventoryPanel({ 
  products = [], 
  setProducts, 
  brands = [], 
  onUpdateProduct 
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [adjustModalProduct, setAdjustModalProduct] = useState(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [loadingId, setLoadingId] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Helper: Extract numeric stock from product
  const getNumericStock = (p) => {
    if (typeof p.stock === 'number') return p.stock;
    const match = String(p.stock || '0').match(/\d+/);
    return match ? parseInt(match[0], 10) : 0;
  };

  // Helper: Extract numeric price from product
  const getNumericPrice = (p) => {
    if (typeof p.numericPrice === 'number') return p.numericPrice;
    if (typeof p.price === 'number') return p.price;
    const match = String(p.price || '0').match(/\d+/);
    return match ? parseInt(match[0], 10) : 400;
  };

  // Summary Metrics
  const metrics = useMemo(() => {
    let totalBags = 0;
    let totalValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    products.forEach((p) => {
      const stock = getNumericStock(p);
      const price = getNumericPrice(p);
      totalBags += stock;
      totalValue += stock * price;

      if (stock === 0) {
        outOfStockCount++;
      } else if (stock < 100) {
        lowStockCount++;
      }
    });

    const formattedValue = totalValue >= 10000000 
      ? `₹${(totalValue / 10000000).toFixed(2)} Cr`
      : totalValue >= 100000 
      ? `₹${(totalValue / 100000).toFixed(2)} Lakhs`
      : `₹${totalValue.toLocaleString('en-IN')}`;

    return {
      totalBags,
      totalValue: formattedValue,
      lowStockCount,
      outOfStockCount,
      totalSKUs: products.length,
    };
  }, [products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const stock = getNumericStock(p);
      const bName = (p.brand || p.brandName || '').toLowerCase();
      const bId = (p.brandId || '').toLowerCase();
      const pName = (p.name || '').toLowerCase();

      // Brand filter
      if (selectedBrand !== 'all') {
        const sel = selectedBrand.toLowerCase();
        if (bId !== sel && !bName.includes(sel)) return false;
      }

      // Status filter
      if (selectedStatus === 'low' && (stock >= 100 || stock === 0)) return false;
      if (selectedStatus === 'out' && stock > 0) return false;
      if (selectedStatus === 'healthy' && stock < 100) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return pName.includes(q) || bName.includes(q) || (p.specs?.type || '').toLowerCase().includes(q);
      }

      return true;
    });
  }, [products, selectedBrand, selectedStatus, searchQuery]);

  // Quick Restock handler (+50, +100, +500)
  const handleQuickAdd = async (product, amount) => {
    const currentStock = getNumericStock(product);
    const newStock = currentStock + amount;
    await executeStockUpdate(product, newStock, `Added +${amount} bags to ${product.name}`);
  };

  // Execute and persist stock update
  const executeStockUpdate = async (product, newStock, successMsg) => {
    setLoadingId(product.id);
    const numericStock = Math.max(0, parseInt(newStock, 10) || 0);

    const updatedProduct = {
      ...product,
      stock: `${numericStock} bags`,
      status: numericStock > 0 ? 'In Stock' : 'Out of Stock',
      active: numericStock > 0,
    };

    // Optimistic UI update in parent
    setProducts((prev) => prev.map((p) => (p.id === product.id ? updatedProduct : p)));

    try {
      if (onUpdateProduct) {
        await onUpdateProduct(updatedProduct);
      } else {
        await adminApi.updateProduct(product.id, { stock: numericStock });
      }
      showToast(successMsg || `Stock updated to ${numericStock.toLocaleString()} bags`, 'success');
    } catch (err) {
      showToast('Failed to save stock update to server', 'error');
    } finally {
      setLoadingId(null);
    }
  };

  // Submit manual adjustment modal
  const handleManualAdjustSubmit = (e) => {
    e.preventDefault();
    if (!adjustModalProduct) return;
    const qty = parseInt(adjustAmount, 10);
    if (isNaN(qty) || qty < 0) {
      alert('Please enter a valid stock quantity (0 or greater)');
      return;
    }
    executeStockUpdate(
      adjustModalProduct, 
      qty, 
      `Updated ${adjustModalProduct.name} stock to ${qty.toLocaleString()} bags`
    );
    setAdjustModalProduct(null);
    setAdjustAmount('');
  };

  return (
    <div className="panel-container">
      {/* Toast Notification */}
      {toast && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 9999,
          background: toast.type === 'error' ? '#ef4444' : '#10b981',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '10px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontWeight: 700,
          fontSize: '0.88rem'
        }}>
          {toast.type === 'error' ? <XCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Banner & Header */}
      <div className="web-card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: '#fee2e2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#dc2626'
              }}>
                <Warehouse size={22} />
              </div>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                  Warehouse Cement Inventory
                </h2>
                <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                  Stock levels for each product. Changes apply to the customer and agent apps.
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* 4 Summary Metric Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '14px',
          marginTop: '20px'
        }}>
          {/* Metric 1: Total Bags */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px'
          }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
              <Boxes size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                Total Bags in Stock
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f172a', marginTop: '2px' }}>
                {metrics.totalBags.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 600 }}>Across Tamil Nadu Hubs</div>
            </div>
          </div>

          {/* Metric 2: Total Valuation */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px'
          }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
              <TrendingUp size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                Inventory Valuation
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f172a', marginTop: '2px' }}>
                {metrics.totalValue}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>At current wholesale rate</div>
            </div>
          </div>

          {/* Metric 3: Low Stock Warnings */}
          <div style={{
            background: metrics.lowStockCount > 0 ? '#fffbeb' : '#f8fafc',
            border: `1px solid ${metrics.lowStockCount > 0 ? '#fde68a' : '#e2e8f0'}`,
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px'
          }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              background: metrics.lowStockCount > 0 ? '#fef3c7' : '#f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: metrics.lowStockCount > 0 ? '#d97706' : '#94a3b8'
            }}>
              <AlertTriangle size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                Low Stock Alerts (&lt;100)
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 900, color: metrics.lowStockCount > 0 ? '#b45309' : '#0f172a', marginTop: '2px' }}>
                {metrics.lowStockCount} {metrics.lowStockCount === 1 ? 'Product' : 'Products'}
              </div>
              <div style={{ fontSize: '0.72rem', color: metrics.lowStockCount > 0 ? '#b45309' : '#64748b', fontWeight: 600 }}>
                {metrics.lowStockCount > 0 ? 'Requires Depot Restock' : 'All SKUs healthy'}
              </div>
            </div>
          </div>

          {/* Metric 4: Total Formulations */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px'
          }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: '#fae8ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a855f7' }}>
              <Package size={22} />
            </div>
            <div>
              <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                Active Cement SKUs
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: 900, color: '#0f172a', marginTop: '2px' }}>
                {metrics.totalSKUs} Formulations
              </div>
              <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>Across {brands.length} Brands</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="web-card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
          {/* Search Box */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#f8fafc',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            padding: '8px 14px',
            width: '320px',
            maxWidth: '100%'
          }}>
            <Search size={16} style={{ color: '#94a3b8' }} />
            <input 
              type="text" 
              placeholder="Search cement by name or brand..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontSize: '0.85rem',
                color: '#0f172a',
                width: '100%'
              }}
            />
            {searchQuery && (
              <button 
                type="button" 
                onClick={() => setSearchQuery('')}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
              >
                ×
              </button>
            )}
          </div>

          {/* Status Filter Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, marginRight: '4px' }}>Status:</span>
            {[
              { id: 'all', label: `All (${products.length})` },
              { id: 'healthy', label: 'Healthy Stock (≥100)' },
              { id: 'low', label: `Low Stock (${metrics.lowStockCount})`, alert: metrics.lowStockCount > 0 },
              { id: 'out', label: `Out of Stock (${metrics.outOfStockCount})`, critical: metrics.outOfStockCount > 0 },
            ].map((chip) => {
              const active = selectedStatus === chip.id;
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setSelectedStatus(chip.id)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: active ? '1px solid #dc2626' : '1px solid #e2e8f0',
                    background: active ? '#fee2e2' : '#ffffff',
                    color: active ? '#dc2626' : chip.alert ? '#d97706' : chip.critical ? '#ef4444' : '#475569',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Brand Selector Filter Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #f1f5f9', overflowX: 'auto', paddingBottom: '4px' }}>
          <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700, flexShrink: 0 }}>Brands:</span>
          <button
            type="button"
            onClick={() => setSelectedBrand('all')}
            style={{
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '0.76rem',
              fontWeight: 700,
              cursor: 'pointer',
              border: selectedBrand === 'all' ? '1px solid #0f172a' : '1px solid #e2e8f0',
              background: selectedBrand === 'all' ? '#0f172a' : '#f8fafc',
              color: selectedBrand === 'all' ? '#ffffff' : '#64748b',
              flexShrink: 0
            }}
          >
            All Brands
          </button>
          {brands.map((b) => {
            const active = selectedBrand.toLowerCase() === b.id.toLowerCase();
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => setSelectedBrand(b.id)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: active ? '1px solid #dc2626' : '1px solid #e2e8f0',
                  background: active ? '#dc2626' : '#ffffff',
                  color: active ? '#ffffff' : '#334155',
                  flexShrink: 0
                }}
              >
                {b.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Stock Table */}
      <div className="web-card">
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building2 size={18} style={{ color: '#dc2626' }} />
            <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0f172a' }}>
              Cement Stock Inventory ({filteredProducts.length} Formulations)
            </span>
          </div>
          <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
            Quick-click +50 or +100 bags to immediately restock and sync across all platforms
          </span>
        </div>

        <div className="table-responsive">
          <table className="web-table">
            <thead>
              <tr>
                <th>Product & Manufacturer</th>
                <th>Grade / Type</th>
                <th>Price / Bag</th>
                <th>Current Warehouse Stock</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Quick Restock Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                    <Package size={36} style={{ color: '#cbd5e1', marginBottom: '8px' }} />
                    <p style={{ margin: 0, fontWeight: 700 }}>No cement products match your filter.</p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const stock = getNumericStock(p);
                  const price = getNumericPrice(p);
                  const isLoading = loadingId === p.id;
                  const isOutOfStock = stock <= 0;
                  const isLow = stock > 0 && stock < 100;

                  return (
                    <tr key={p.id}>
                      {/* Product & Manufacturer */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            background: '#f8fafc',
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            <img 
                              src={p.image || '/cements/ultratech-super-ppc.png'} 
                              alt={p.name}
                              style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '2px' }}
                              onError={(e) => { e.target.src = '/cements/ultratech-super-ppc.png'; }}
                            />
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#0f172a' }}>
                              {p.name}
                            </div>
                            <div style={{ fontSize: '0.74rem', color: '#dc2626', fontWeight: 700 }}>
                              {p.brand || p.brandName || 'Cement'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Grade / Type */}
                      <td>
                        <span style={{
                          display: 'inline-block',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          background: '#f1f5f9',
                          color: '#334155',
                          fontSize: '0.75rem',
                          fontWeight: 700
                        }}>
                          {p.specs?.type || p.type || 'PPC 50kg'}
                        </span>
                      </td>

                      {/* Price / Bag */}
                      <td>
                        <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>
                          ₹{price}
                          <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 500 }}>/bag</span>
                        </div>
                      </td>

                      {/* Current Warehouse Stock */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                          <span style={{
                            fontSize: '1.25rem',
                            fontWeight: 900,
                            color: isOutOfStock ? '#dc2626' : isLow ? '#d97706' : '#059669'
                          }}>
                            {stock.toLocaleString('en-IN')}
                          </span>
                          <span style={{ fontSize: '0.76rem', color: '#64748b', fontWeight: 600 }}>bags</span>
                        </div>
                        {/* Stock Progress Bar */}
                        <div style={{
                          width: '120px',
                          height: '5px',
                          borderRadius: '3px',
                          background: '#e2e8f0',
                          marginTop: '4px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${Math.min(100, (stock / 1500) * 100)}%`,
                            height: '100%',
                            background: isOutOfStock ? '#dc2626' : isLow ? '#f59e0b' : '#10b981',
                            borderRadius: '3px'
                          }} />
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontSize: '0.74rem',
                          fontWeight: 800,
                          background: isOutOfStock ? '#fee2e2' : isLow ? '#fef3c7' : '#ecfdf5',
                          color: isOutOfStock ? '#b91c1c' : isLow ? '#b45309' : '#047857'
                        }}>
                          <span style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: isOutOfStock ? '#dc2626' : isLow ? '#f59e0b' : '#10b981'
                          }} />
                          {isOutOfStock ? 'OUT OF STOCK' : isLow ? 'LOW STOCK' : 'IN STOCK'}
                        </span>
                      </td>

                      {/* Quick Restock Actions */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                          <button
                            type="button"
                            disabled={isLoading}
                            onClick={() => handleQuickAdd(p, 50)}
                            style={{
                              padding: '5px 9px',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                              background: '#ffffff',
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              color: '#0f172a'
                            }}
                            title="Restock +50 Bags"
                          >
                            +50
                          </button>

                          <button
                            type="button"
                            disabled={isLoading}
                            onClick={() => handleQuickAdd(p, 100)}
                            style={{
                              padding: '5px 9px',
                              borderRadius: '6px',
                              border: '1px solid #a7f3d0',
                              background: '#ecfdf5',
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              color: '#065f46'
                            }}
                            title="Restock +100 Bags"
                          >
                            +100
                          </button>

                          <button
                            type="button"
                            disabled={isLoading}
                            onClick={() => handleQuickAdd(p, 500)}
                            style={{
                              padding: '5px 9px',
                              borderRadius: '6px',
                              border: '1px solid #bfdbfe',
                              background: '#eff6ff',
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              color: '#1e40af'
                            }}
                            title="Restock +500 Bags (Full Truckload)"
                          >
                            +500
                          </button>

                          <button
                            type="button"
                            disabled={isLoading}
                            onClick={() => {
                              setAdjustModalProduct(p);
                              setAdjustAmount(String(stock));
                            }}
                            style={{
                              padding: '5px 9px',
                              borderRadius: '6px',
                              border: '1px solid #e2e8f0',
                              background: '#f8fafc',
                              fontSize: '0.74rem',
                              fontWeight: 700,
                              cursor: 'pointer',
                              color: '#64748b',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                            title="Set Exact Custom Stock Quantity"
                          >
                            <Edit3 size={12} />
                            <span>Edit</span>
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

      {/* Manual Stock Adjustment Modal */}
      {adjustModalProduct && (
        <div className="modal-overlay" onClick={() => setAdjustModalProduct(null)}>
          <div 
            className="modal-card" 
            style={{ maxWidth: '440px' }} 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-title-box">
                <h3 className="modal-title">Adjust Warehouse Stock</h3>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  {adjustModalProduct.name} ({adjustModalProduct.brand || 'Cement'})
                </span>
              </div>
              <button 
                type="button" 
                className="modal-close-btn" 
                onClick={() => setAdjustModalProduct(null)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleManualAdjustSubmit}>
              <div className="modal-body" style={{ padding: '20px' }}>
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '14px',
                  marginBottom: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626' }}>
                    <Boxes size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>CURRENT INVENTORY</div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                      {getNumericStock(adjustModalProduct).toLocaleString('en-IN')} Bags
                    </div>
                  </div>
                </div>

                <div className="web-form-group">
                  <label className="web-form-label">SET NEW EXACT STOCK QUANTITY (BAGS)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    className="web-form-input"
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(e.target.value)}
                    placeholder="Enter total available bags (e.g. 1200)"
                    required
                    style={{ fontSize: '1.1rem', fontWeight: 800 }}
                  />
                  <span style={{ fontSize: '0.74rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                    Customers and agents see the updated stock right away.
                  </span>
                </div>

                {/* Quick Add Buttons in Modal */}
                <div style={{ marginTop: '14px' }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '8px' }}>
                    QUICK PRESETS:
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[
                      { label: '+50 Bags', val: 50 },
                      { label: '+100 Bags', val: 100 },
                      { label: '+500 Bags', val: 500 },
                      { label: 'Set 0 (Out)', val: -getNumericStock(adjustModalProduct) }
                    ].map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          const base = parseInt(adjustAmount, 10) || getNumericStock(adjustModalProduct);
                          setAdjustAmount(String(Math.max(0, base + p.val)));
                        }}
                        style={{
                          flex: 1,
                          padding: '6px 8px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          background: '#ffffff',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="modal-footer" style={{ padding: '14px 20px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={() => setAdjustModalProduct(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-modal-submit"
                  style={{ background: '#dc2626' }}
                >
                  Save Stock Quantity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
