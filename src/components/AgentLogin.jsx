import React, { useState } from 'react';
import { 
  User, 
  Lock, 
  Eye, 
  EyeOff, 
  Check, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  X 
} from 'lucide-react';
import PetraLogoMark from './PetraLogoMark';

export default function AgentLogin() {
  const [agentId, setAgentId] = useState('');
  const [password, setPassword] = useState('');
  const [location, setLocation] = useState('Chennai');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loginSuccess, setLoginSuccess] = useState(false);
  
  // Forgot Password Modal
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  // Demo autofill state
  const [isDemoFilling, setIsDemoFilling] = useState(false);

  // Handle Submit
  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!agentId.trim() || !password.trim()) {
      setErrorMessage('Please enter both your Agent ID and Password to proceed.');
      return;
    }

    setIsLoading(true);

    // Simulate Authentication
    setTimeout(() => {
      setIsLoading(false);
      setLoginSuccess(true);
    }, 800);
  };

  // Handle Demo Autofill
  const handleDemoSignIn = () => {
    setErrorMessage('');
    setIsDemoFilling(true);

    setAgentId('AG-10245');
    setPassword('••••••••');
    setLocation('Chennai');

    setTimeout(() => {
      setIsDemoFilling(false);
      setIsLoading(true);

      setTimeout(() => {
        setIsLoading(false);
        setLoginSuccess(true);
      }, 700);
    }, 300);
  };

  // Reset login state
  const handleResetLogin = () => {
    setLoginSuccess(false);
    setAgentId('');
    setPassword('');
    setErrorMessage('');
  };

  return (
    <div className="login-page-container">
      <div className="card-wrapper">
        <div className="login-card">
          {/* Top Gradient Red Bar */}
          <div className="card-top-accent" />

          <div className="card-body">
            {/* Header Emblem & Title */}
            <div className="card-brand-header">
              <div className="card-logo-emblem">
                <PetraLogoMark size={32} />
              </div>
              <h2 className="card-title">Agent Login</h2>
              <span className="card-subtitle">Login with your agent credentials</span>
            </div>

            {/* Success State Screen */}
            {loginSuccess ? (
              <div className="login-success-box">
                <div className="success-icon-badge">
                  <CheckCircle2 size={36} />
                </div>
                <h3 className="success-title">Authentication Successful!</h3>
                <p className="success-desc">
                  Welcome back, Agent <strong>{agentId || 'AG-10245'}</strong>. Your session for <strong>{location}</strong> zone is now active.
                </p>
                
                <button 
                  type="button" 
                  className="btn-demo-fill"
                  onClick={handleResetLogin}
                  style={{ marginTop: '16px' }}
                >
                  Sign Out / Back to Login
                </button>
              </div>
            ) : (
              /* Login Form */
              <form onSubmit={handleSubmit} className="login-form">
                {/* Error Banner */}
                {errorMessage && (
                  <div className="error-alert" role="alert">
                    <AlertCircle size={18} />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Agent ID Input */}
                <div className="form-group">
                  <label htmlFor="agent-id-input" className="field-label">
                    AGENT ID
                  </label>
                  <div className="input-container">
                    <User size={18} className="input-icon-left" />
                    <input
                      id="agent-id-input"
                      type="text"
                      value={agentId}
                      onChange={(e) => setAgentId(e.target.value)}
                      placeholder="e.g. AG-10245"
                      className="form-input"
                      disabled={isLoading || isDemoFilling}
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="form-group">
                  <label htmlFor="password-input" className="field-label">
                    PASSWORD
                  </label>
                  <div className="input-container">
                    <Lock size={18} className="input-icon-left" />
                    <input
                      id="password-input"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="form-input has-right-icon"
                      disabled={isLoading || isDemoFilling}
                    />
                    <button
                      type="button"
                      className="input-toggle-right"
                      onClick={() => setShowPassword(!showPassword)}
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Select Location Dropdown */}
                <div className="form-group">
                  <label htmlFor="location-select" className="field-label">
                    SELECT LOCATION
                  </label>
                  <select
                    id="location-select"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="form-select"
                    disabled={isLoading || isDemoFilling}
                  >
                    <option value="Chennai">Chennai Hub</option>
                    <option value="Coimbatore">Coimbatore Hub</option>
                    <option value="Madurai">Madurai Hub</option>
                    <option value="Trichy">Trichy Hub</option>
                    <option value="Salem">Salem Hub</option>
                  </select>
                </div>

                {/* Options Row: Remember Me & Forgot Password */}
                <div className="form-options-row">
                  <label className="remember-label">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="checkbox-input"
                    />
                    <span className="checkbox-custom">
                      {rememberMe && <Check size={12} strokeWidth={3} />}
                    </span>
                    <span>Remember me</span>
                  </label>

                  <button
                    type="button"
                    className="forgot-link"
                    onClick={() => {
                      setForgotSubmitted(false);
                      setShowForgotModal(true);
                    }}
                  >
                    Forgot Password?
                  </button>
                </div>

                {/* Primary Submit Button */}
                <button
                  type="submit"
                  className="btn-primary-submit"
                  disabled={isLoading || isDemoFilling}
                >
                  {isLoading ? (
                    <>
                      <div className="btn-spinner" />
                      <span>Authenticating Agent...</span>
                    </>
                  ) : (
                    <>
                      <span>LOGIN</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>

                {/* Divider */}
                <div className="divider-container">
                  <div className="divider-line" />
                  <span className="divider-text">OR DEMO ACCESS</span>
                  <div className="divider-line" />
                </div>

                {/* Quick Demo Agent Login */}
                <button
                  type="button"
                  className="btn-demo-fill"
                  onClick={handleDemoSignIn}
                  disabled={isLoading || isDemoFilling}
                >
                  <Sparkles size={16} className="demo-sparkle-icon" />
                  <span>{isDemoFilling ? "Autofilling Demo Agent..." : "One-Click Demo Agent Sign In"}</span>
                </button>

                {/* Help Notice */}
                <p className="help-caption">
                  New agent? Contact admin for your Agent ID
                </p>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="modal-overlay" onClick={() => setShowForgotModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-box">
                <ShieldCheck size={20} style={{ color: '#dc2626' }} />
                <h3 className="modal-title">Reset Agent Password</h3>
              </div>
              <button 
                type="button" 
                className="modal-close-btn"
                onClick={() => setShowForgotModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              {!forgotSubmitted ? (
                <form onSubmit={(e) => { e.preventDefault(); setForgotSubmitted(true); }}>
                  <p className="modal-desc">
                    Enter your Agent ID or registered mobile/email address to receive password recovery instructions from your admin supervisor.
                  </p>
                  <div className="form-group" style={{ marginBottom: '20px' }}>
                    <label className="field-label">Agent ID or Corporate Email</label>
                    <div className="input-container">
                      <User size={18} className="input-icon-left" />
                      <input
                        type="text"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="e.g. AG-10245 or agent@petracement.com"
                        className="form-input"
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn-primary-submit">
                    <span>Send Recovery Instructions</span>
                    <ArrowRight size={18} />
                  </button>
                </form>
              ) : (
                <div style={{ textAlign: 'center', padding: '12px 0' }}>
                  <div style={{ width: '48px', height: '48px', background: '#f0fdf4', borderRadius: '50%', color: '#166534', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
                    <CheckCircle2 size={28} />
                  </div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '8px', color: '#0f172a' }}>Instructions Dispatched</h4>
                  <p style={{ fontSize: '0.88rem', color: '#64748b', lineHeight: 1.5, marginBottom: '20px' }}>
                    Recovery instructions have been sent to your supervisor for verification.
                  </p>
                  <button 
                    type="button" 
                    className="btn-demo-fill"
                    onClick={() => setShowForgotModal(false)}
                  >
                    Back to Agent Login
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
