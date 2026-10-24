import React, { useState } from 'react';
import { X, Upload, Image as ImageIcon } from 'lucide-react';

export default function AddModal({ 
  isOpen, 
  onClose, 
  activeTab, 
  brands = [], 
  onAddItem 
}) {
  // Product Fields
  const [name, setName] = useState('');
  const [brandName, setBrandName] = useState('UltraTech Cement');
  const [stock, setStock] = useState('500 bags');
  const [price, setPrice] = useState('₹410/bag');
  const [imagePreview, setImagePreview] = useState('/cements/ultratech-super-ppc.png');
  
  // Cement Specification Fields
  const [packagingSize, setPackagingSize] = useState('50 kg');
  const [cementType, setCementType] = useState('PPC (Pozzolana Portland Cement)');
  const [packagingType, setPackagingType] = useState('HDPE Sack Bag');
  const [usage, setUsage] = useState('Construction & Structural RCC');
  const [color, setColor] = useState('Grey');
  const [features, setFeatures] = useState('Engineered particle distribution, low risk of cracking');
  const [compressiveStrength, setCompressiveStrength] = useState('33+ MPa at 28 days');
  const [standard, setStandard] = useState('IS 1489 (Part 1)');

  // Category / Brand Fields
  const [catName, setCatName] = useState('');
  const [catStandard, setCatStandard] = useState('IS 12269');
  // Customer Fields
  const [custName, setCustName] = useState('');
  const [custLocation, setCustLocation] = useState('Chennai');
  const [phone, setPhone] = useState('+91 98765 43210');

  // Available bag image presets
  const imagePresets = [
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

  // Auto-switch image preset based on selected brand
  const handleBrandChange = (newBrand) => {
    setBrandName(newBrand);
    const matchedPreset = imagePresets.find(p => p.brand.toLowerCase() === newBrand.toLowerCase());
    if (matchedPreset) {
      setImagePreview(matchedPreset.src);
    }
  };

  if (!isOpen) return null;

  // Image Upload File Handler
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (activeTab === 'products') {
      if (!name.trim()) return;

      const matchedBrand = brands.find(b => b.name === brandName);

      onAddItem('products', {
        id: Date.now(),
        brandId: matchedBrand ? matchedBrand.id : 'custom',
        brandName,
        name,
        subtitle: `${brandName} - ${cementType}`,
        stock: stock.includes('bags') ? stock : `${stock} bags`,
        price: price.startsWith('₹') ? price : `₹${price}/bag`,
        numericPrice: parseInt(price.replace(/[^0-9]/g, '')) || 400,
        status: 'In Stock',
        image: imagePreview || '/petra_cement_bag.jpg',
        specs: {
          packagingSize,
          type: cementType,
          packagingType,
          brand: brandName,
          usage,
          color,
          features,
          compressiveStrength,
          standard
        }
      });
      setName('');
    } else if (activeTab === 'categories') {
      if (!catName.trim()) return;
      onAddItem('categories', {
        id: Date.now(),
        name: catName,
        standard: catStandard,
        productsCount: 0,
        active: true
      });
      setCatName('');
    } else if (activeTab === 'customers') {
      if (!custName.trim()) return;
      onAddItem('customers', {
        id: Date.now(),
        initials: custName.substring(0, 2).toUpperCase(),
        name: custName,
        location: custLocation,
        ordersCount: 1,
        spent: '₹1.5L',
        status: 'Active'
      });
      setCustName('');
    }

    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-card" 
        style={{ maxWidth: activeTab === 'products' ? '680px' : '480px' }} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title-box">
            <h3 className="modal-title">
              {activeTab === 'products' && 'Add New Cement Product & Specifications'}
              {activeTab === 'categories' && 'Add New Technical Cement Category'}
              {activeTab === 'customers' && 'Register New Customer Firm'}
            </h3>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
          <form onSubmit={handleSubmit}>
            {/* Products Form */}
            {activeTab === 'products' && (
              <>
                {/* Brand Selector Dropdown */}
                <div className="web-form-group">
                  <label className="web-form-label">MANUFACTURER BRAND (USER CATALOG)</label>
                  <select 
                    className="web-form-select"
                    value={brandName}
                    onChange={(e) => handleBrandChange(e.target.value)}
                    style={{ fontWeight: 800 }}
                  >
                    {brands.map(b => (
                      <option key={b.id} value={b.name}>{b.name} ({b.company})</option>
                    ))}
                    <option value="Petra Cement">Petra Cement (In-House)</option>
                  </select>
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    Select which partner brand catalogue this product appears under in the user mobile app.
                  </span>
                </div>

                {/* Image Selection & Preview */}
                <div className="web-form-group">
                  <label className="web-form-label">PRODUCT BAG IMAGE</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                    <div style={{ width: '64px', height: '64px', borderRadius: '8px', overflow: 'hidden', background: '#ffffff', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {imagePreview ? (
                        <img src={imagePreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={(e) => { e.target.src = '/petra_cement_bag.jpg'; }} />
                      ) : (
                        <ImageIcon size={24} style={{ color: '#94a3b8' }} />
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>
                        Choose bag preset or upload image:
                      </label>
                      <select 
                        className="web-form-select"
                        value={imagePreview}
                        onChange={(e) => setImagePreview(e.target.value)}
                        style={{ marginBottom: '8px' }}
                      >
                        {imagePresets.map((bg, idx) => (
                          <option key={idx} value={bg.src}>{bg.brand} - {bg.label}</option>
                        ))}
                      </select>

                      <input 
                        type="file" 
                        accept="image/*" 
                        id="product-img-upload" 
                        style={{ display: 'none' }}
                        onChange={handleImageChange}
                      />
                      <label 
                        htmlFor="product-img-upload" 
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', borderRadius: '6px', background: 'white', border: '1px solid #cbd5e1', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}
                      >
                        <Upload size={13} /> Or Upload Custom File
                      </label>
                    </div>
                  </div>
                </div>

                <div className="form-grid-2col">
                  <div className="web-form-group">
                    <label className="web-form-label">PRODUCT NAME</label>
                    <input 
                      type="text" 
                      required 
                      className="web-form-input"
                      placeholder="e.g. UltraTech Super PPC / Ramco 53 Grade"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>

                  <div className="web-form-group">
                    <label className="web-form-label">CEMENT GRADE / TYPE</label>
                    <select 
                      className="web-form-select"
                      value={cementType}
                      onChange={(e) => setCementType(e.target.value)}
                    >
                      <option value="PPC (Pozzolana Portland Cement)">PPC (Pozzolana Portland Cement)</option>
                      <option value="OPC 53 Grade">OPC 53 Grade (Ordinary Portland)</option>
                      <option value="PSC (Portland Slag Cement)">PSC (Portland Slag Cement)</option>
                      <option value="White Portland Cement">White Portland Cement</option>
                      <option value="Premium Structural Cement">Premium Structural Cement</option>
                      <option value="Water Repellent Cement">Water Repellent Cement</option>
                    </select>
                  </div>
                </div>

                <div className="form-grid-2col">
                  <div className="web-form-group">
                    <label className="web-form-label">PRICE PER BAG</label>
                    <input 
                      type="text" 
                      className="web-form-input"
                      placeholder="₹410/bag"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                    />
                  </div>

                  <div className="web-form-group">
                    <label className="web-form-label">INITIAL WAREHOUSE STOCK</label>
                    <input 
                      type="text" 
                      className="web-form-input"
                      placeholder="500 bags"
                      value={stock}
                      onChange={(e) => setStock(e.target.value)}
                    />
                  </div>
                </div>

                {/* Cement Specification Fields */}
                <h4 style={{ fontSize: '0.82rem', fontWeight: 800, color: '#dc2626', margin: '14px 0 10px 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Technical Specifications
                </h4>

                <div className="form-grid-2col">
                  <div className="web-form-group">
                    <label className="web-form-label">PACKAGING SIZE</label>
                    <input 
                      type="text" 
                      className="web-form-input"
                      placeholder="50 kg"
                      value={packagingSize}
                      onChange={(e) => setPackagingSize(e.target.value)}
                    />
                  </div>

                  <div className="web-form-group">
                    <label className="web-form-label">PACKAGING TYPE</label>
                    <input 
                      type="text" 
                      className="web-form-input"
                      placeholder="HDPE Sack Bag"
                      value={packagingType}
                      onChange={(e) => setPackagingType(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-grid-2col">
                  <div className="web-form-group">
                    <label className="web-form-label">USAGE / APPLICATION</label>
                    <input 
                      type="text" 
                      className="web-form-input"
                      placeholder="Structural RCC, Slabs & Beams"
                      value={usage}
                      onChange={(e) => setUsage(e.target.value)}
                    />
                  </div>

                  <div className="web-form-group">
                    <label className="web-form-label">COLOR</label>
                    <input 
                      type="text" 
                      className="web-form-input"
                      placeholder="Light Grey"
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-grid-2col">
                  <div className="web-form-group">
                    <label className="web-form-label">COMPRESSIVE STRENGTH</label>
                    <input 
                      type="text" 
                      className="web-form-input"
                      placeholder="33+ MPa at 28 days"
                      value={compressiveStrength}
                      onChange={(e) => setCompressiveStrength(e.target.value)}
                    />
                  </div>

                  <div className="web-form-group">
                    <label className="web-form-label">BIS STANDARD CODE</label>
                    <input 
                      type="text" 
                      className="web-form-input"
                      placeholder="IS 1489 (Part 1)"
                      value={standard}
                      onChange={(e) => setStandard(e.target.value)}
                    />
                  </div>
                </div>

                <div className="web-form-group">
                  <label className="web-form-label">KEY FEATURES</label>
                  <input 
                    type="text" 
                    className="web-form-input"
                    placeholder="Engineered particle distribution, low risk of cracking"
                    value={features}
                    onChange={(e) => setFeatures(e.target.value)}
                  />
                </div>
              </>
            )}

            {/* Category Form */}
            {activeTab === 'categories' && (
              <>
                <div className="web-form-group">
                  <label className="web-form-label">CATEGORY NAME</label>
                  <input 
                    type="text" 
                    required 
                    className="web-form-input"
                    placeholder="e.g. Portland Slag Cement Range"
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                  />
                </div>
                <div className="web-form-group">
                  <label className="web-form-label">BIS STANDARD SPECIFICATION</label>
                  <input 
                    type="text" 
                    className="web-form-input"
                    placeholder="e.g. IS 455:2015"
                    value={catStandard}
                    onChange={(e) => setCatStandard(e.target.value)}
                  />
                </div>
              </>
            )}

            {/* Customer Form */}
            {activeTab === 'customers' && (
              <>
                <div className="web-form-group">
                  <label className="web-form-label">CUSTOMER / FIRM NAME</label>
                  <input 
                    type="text" 
                    required 
                    className="web-form-input"
                    placeholder="e.g. Apex Builders & Constructions"
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                  />
                </div>
                <div className="web-form-group">
                  <label className="web-form-label">PHONE NUMBER</label>
                  <input 
                    type="text" 
                    className="web-form-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
                <div className="web-form-group">
                  <label className="web-form-label">LOCATION HUB</label>
                  <select 
                    className="web-form-select"
                    value={custLocation}
                    onChange={(e) => setCustLocation(e.target.value)}
                  >
                    <option value="Chennai">Chennai</option>
                    <option value="Coimbatore">Coimbatore</option>
                    <option value="Madurai">Madurai</option>
                    <option value="Trichy">Trichy</option>
                    <option value="Salem">Salem</option>
                  </select>
                </div>
              </>
            )}

            <button type="submit" className="btn-primary-submit" style={{ marginTop: '20px' }}>
              <span>Submit & Save to Catalog</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
