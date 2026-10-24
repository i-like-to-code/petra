import React, { useEffect, useState } from 'react';
import { Save, Smartphone } from 'lucide-react';
import adminApi from '../services/api';

// Must match HOME_BANNER_LIMITS in the backend settings service
const LIMITS = { badge: 20, title: 50, buttonText: 16 };
const FIELDS = [
  { key: 'badge', label: 'Badge', placeholder: 'e.g. BULK OFFER' },
  { key: 'title', label: 'Heading', placeholder: 'e.g. Save more on 100+ bags' },
  { key: 'buttonText', label: 'Button text', placeholder: 'e.g. Order Now' },
];

/**
 * Edits the promotional banner shown on the mobile app's Home screen.
 */
export default function HomeBannerEditor() {
  const [banner, setBanner] = useState({ badge: '', title: '', buttonText: '' });
  const [saved, setSaved] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    adminApi.getHomeBanner().then((res) => {
      if (res?.success && res.data) {
        setBanner(res.data);
        setSaved(res.data);
      }
    });
  }, []);

  const isDirty = !saved || FIELDS.some(({ key }) => (banner[key] || '') !== (saved[key] || ''));
  const isValid = FIELDS.every(({ key }) => banner[key]?.trim() && banner[key].trim().length <= LIMITS[key]);

  const handleSave = async () => {
    setIsSaving(true);
    const res = await adminApi.updateHomeBanner(banner);
    setIsSaving(false);
    if (res?.success) {
      setSaved(res.data);
      setBanner(res.data);
      setMessage({ type: 'success', text: 'Banner saved. The app shows it the next time Home loads.' });
    } else {
      setMessage({ type: 'error', text: res?.message || 'Could not save the banner.' });
    }
    setTimeout(() => setMessage(null), 4000);
  };

  return (
    <div className="web-card" style={{ marginBottom: '28px' }}>
      <div className="web-card-header">
        <div>
          <div className="web-card-title">Home Screen Banner</div>
          <div className="web-card-subtitle">The offer banner customers see at the top of the app&apos;s Home screen</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', alignItems: 'start' }}>
        <div>
          {FIELDS.map(({ key, label, placeholder }) => {
            const value = banner[key] || '';
            const tooLong = value.length > LIMITS[key];
            return (
              <div className="web-form-group" key={key}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <label className="web-form-label" htmlFor={`banner-${key}`}>{label}</label>
                  <span style={{ fontSize: '0.72rem', color: tooLong ? '#dc2626' : '#94a3b8', fontWeight: 600 }}>
                    {value.length}/{LIMITS[key]}
                  </span>
                </div>
                <input
                  id={`banner-${key}`}
                  type="text"
                  className="web-form-input"
                  value={value}
                  placeholder={placeholder}
                  onChange={(e) => setBanner({ ...banner, [key]: e.target.value })}
                  style={tooLong ? { borderColor: '#dc2626' } : undefined}
                />
              </div>
            );
          })}

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn-quick-action"
              onClick={handleSave}
              disabled={isSaving || !isDirty || !isValid}
              style={{ opacity: isSaving || !isDirty || !isValid ? 0.6 : 1 }}
            >
              <Save size={16} />
              <span>{isSaving ? 'Saving...' : 'Save Banner'}</span>
            </button>
            {message && (
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: message.type === 'success' ? '#166534' : '#b91c1c' }}>
                {message.text}
              </span>
            )}
          </div>
        </div>

        {/* Preview, styled like the app banner */}
        <div>
          <div className="web-form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <Smartphone size={14} /> Preview
          </div>
          <div style={{ background: '#E11D48', borderRadius: '20px', padding: '18px 20px', color: '#ffffff', maxWidth: '380px' }}>
            <span style={{ display: 'inline-block', background: 'rgba(255,255,255,0.22)', padding: '3px 10px', borderRadius: '12px', fontSize: '10px', fontWeight: 800, letterSpacing: '0.6px' }}>
              {(banner.badge || 'BADGE').toUpperCase()}
            </span>
            <div style={{ fontSize: '20px', fontWeight: 900, lineHeight: 1.25, margin: '8px 0 12px' }}>
              {banner.title || 'Banner heading'}
            </div>
            <span style={{ display: 'inline-block', background: '#ffffff', color: '#E11D48', padding: '8px 18px', borderRadius: '20px', fontSize: '13px', fontWeight: 800 }}>
              {banner.buttonText || 'Button'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
