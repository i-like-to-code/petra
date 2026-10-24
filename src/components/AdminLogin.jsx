import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';
import adminApi, { setAdminSession } from '../services/api';
import PetraLogoMark from './PetraLogoMark';
import './AdminLogin.css';

export default function AdminLogin({ onLoginSuccess }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!identifier.trim() || !password) {
      setErrorMessage('Please enter your email and password.');
      return;
    }

    setIsLoading(true);
    const result = await adminApi.login(identifier.trim(), password);
    setIsLoading(false);

    if (result.offline) {
      setErrorMessage('Unable to reach the server. Please make sure the backend is running.');
      return;
    }

    if (!result.success || !result.data?.token) {
      setErrorMessage(result.message || 'Invalid credentials.');
      return;
    }

    if (result.data.user?.role !== 'admin') {
      setErrorMessage('This account does not have admin access.');
      return;
    }

    setAdminSession(result.data.token, result.data.user);
    onLoginSuccess(result.data.user);
  };

  return (
    <div className="admin-login-page">
      <form className="admin-login-card" onSubmit={handleSubmit}>
        <div className="admin-login-brand">
          <div className="admin-login-logo">
            <PetraLogoMark size={28} />
          </div>
          <h1 className="admin-login-title">Admin Portal</h1>
          <p className="admin-login-subtitle">Sign in to manage Petra Cements</p>
        </div>

        {errorMessage && (
          <div className="admin-login-error" role="alert">
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        <label className="admin-login-label" htmlFor="admin-login-identifier">Email or phone</label>
        <div className="admin-login-input-wrap">
          <Mail size={18} className="admin-login-input-icon" />
          <input
            id="admin-login-identifier"
            type="text"
            autoComplete="username"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            placeholder="admin@petracement.com"
            className="admin-login-input"
          />
        </div>

        <label className="admin-login-label" htmlFor="admin-login-password">Password</label>
        <div className="admin-login-input-wrap">
          <Lock size={18} className="admin-login-input-icon" />
          <input
            id="admin-login-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="admin-login-input"
          />
          <button
            type="button"
            className="admin-login-toggle"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <button type="submit" className="admin-login-submit" disabled={isLoading}>
          {isLoading ? 'Signing in...' : (
            <>
              <span>Sign In</span>
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
