/**
 * Petra Cements Admin Web API Service
 * Connects Admin Portal directly to Central Express + MongoDB Backend (Port 5000)
 */

// Dev: separate backend on :5000. Production: backend serves this panel, so the API is on the same origin.
const API_BASE_URL = import.meta.env.DEV ? 'http://localhost:5000/api' : '/api';

const TOKEN_KEY = 'petra_admin_token';
const USER_KEY = 'petra_admin_user';

// Fired when the backend rejects the stored token so the app can return to the login screen
export const AUTH_EXPIRED_EVENT = 'petra-admin-auth-expired';

export function getAdminToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function getAdminUser() {
  try {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function setAdminSession(token, user) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {}
}

export function clearAdminSession() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch {}
}

/**
 * Helper to handle HTTP JSON requests with robust error catching
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAdminToken();
  const defaultHeaders = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };

  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    if ((res.status === 401 || res.status === 403) && token) {
      clearAdminSession();
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    }

    const data = await res.json();
    return data;
  } catch (err) {
    console.warn(`[API Service] Request to ${endpoint} failed or server offline:`, err.message);
    return { success: false, error: err.message, offline: true };
  }
}

export const adminApi = {
  // Health Check
  checkHealth: () => request('/health'),

  // Auth API
  login: (identifier, password) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: identifier, password }),
  }),
  getMe: () => request('/auth/me'),

  // Brands API
  getBrands: (all = true) => request(`/admin/brands${all ? '' : '?all=false'}`),
  getBrandById: (id) => request(`/brands/${id}`),
  createBrand: (brandData) => request('/admin/brands', {
    method: 'POST',
    body: JSON.stringify(brandData),
  }),
  updateBrand: (id, brandData) => request(`/admin/brands/${id}`, {
    method: 'PUT',
    body: JSON.stringify(brandData),
  }),
  toggleBrand: (id, active) => request(`/admin/brands/${id}/toggle`, {
    method: 'PATCH',
    body: JSON.stringify({ active }),
  }),

  // Products API
  getProducts: (query = {}) => {
    const params = new URLSearchParams(query).toString();
    return request(`/admin/products?${params}`);
  },
  getProductById: (id) => request(`/admin/products/${id}`),
  createProduct: (productData) => request('/admin/products', {
    method: 'POST',
    body: JSON.stringify(productData),
  }),
  updateProduct: (id, productData) => request(`/admin/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(productData),
  }),
  toggleProduct: (id, active) => request(`/admin/products/${id}/toggle`, {
    method: 'PATCH',
    body: JSON.stringify({ active }),
  }),
  getCementTypes: () => request('/products/types'),
  toggleCementType: (type, active) => request('/admin/products/types/toggle', {
    method: 'PATCH',
    body: JSON.stringify({ type, active }),
  }),
  deleteProduct: (id, hard = true) => request(`/admin/products/${id}?hard=${hard}`, {
    method: 'DELETE',
  }),

  // Categories API
  getCategories: () => request('/admin/categories'),
  createCategory: (categoryData) => request('/admin/categories', {
    method: 'POST',
    body: JSON.stringify(categoryData),
  }),
  updateCategory: (id, categoryData) => request(`/admin/categories/${id}`, {
    method: 'PUT',
    body: JSON.stringify(categoryData),
  }),
  deleteCategory: (id) => request(`/admin/categories/${id}`, {
    method: 'DELETE',
  }),

  // Orders API
  getOrders: (status) => request(`/admin/orders${status && status !== 'All' ? `?status=${status}` : ''}`),
  getOrderById: (id) => request(`/admin/orders/${id}`),
  updateOrderStatus: (id, status) => request(`/admin/orders/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status, orderStatus: status.toLowerCase() }),
  }),
  // date: 'YYYY-MM-DD' to set, '' to clear; shown to the customer as the estimated arrival
  updateOrderEta: (id, date) => request(`/admin/orders/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ estimatedDelivery: date || null }),
  }),

  // Customers Directory API
  getCustomers: () => request('/admin/customers'),
  createCustomer: (customerData) => request('/admin/customers', {
    method: 'POST',
    body: JSON.stringify(customerData),
  }),
  updateCustomer: (id, customerData) => request(`/admin/customers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(customerData),
  }),
  deleteCustomer: (id) => request(`/admin/customers/${id}`, {
    method: 'DELETE',
  }),

  // Payments & Settlements API
  getPayments: () => request('/admin/payments'),
  createPayment: (paymentData) => request('/admin/payments', {
    method: 'POST',
    body: JSON.stringify(paymentData),
  }),
  updatePaymentStatus: (id, status) => request(`/admin/payments/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  }),

  // Dashboard & Reports KPI Analytics API
  getDashboardStats: () => request('/admin/dashboard/stats'),
  getReports: () => request('/admin/dashboard/reports'),

  // Field Agent Management API
  getAgentStats: () => request('/admin/agents/stats'),
  getAgents: (query = {}) => {
    const params = new URLSearchParams(query).toString();
    return request(`/admin/agents?${params}`);
  },
  getAgentDetails: (id) => request(`/admin/agents/${id}`),

  // Agent withdrawal requests (status: Pending | Approved | Rejected; omit for all)
  getWithdrawals: (status) => request(`/admin/withdrawals${status ? `?status=${status}` : ''}`),
  // body: { status: 'Approved', payoutReference?, adminNote? } or { status: 'Rejected', adminNote }
  updateWithdrawal: (id, body) => request(`/admin/withdrawals/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  }),
  createAgent: (agentData) => request('/admin/agents', {
    method: 'POST',
    body: JSON.stringify(agentData),
  }),
  updateAgent: (id, agentData) => request(`/admin/agents/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(agentData),
  }),
  deleteAgent: (id) => request(`/admin/agents/${id}`, {
    method: 'DELETE',
  }),
  getAgentLeads: (query = {}) => {
    const params = new URLSearchParams(query).toString();
    return request(`/admin/agents/leads?${params}`);
  },
  updateLeadStatus: (id, status) => request(`/admin/agents/leads/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }),
  getAgentCommissions: (status) => request(`/admin/agents/commissions${status && status !== 'All' ? `?status=${status}` : ''}`),
  updateCommissionStatus: (id, status) => request(`/admin/agents/commissions/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  }),
  getAgentLocations: () => request('/admin/agents/locations'),

  // Delivery Cities API (all cities incl. inactive for admin; active-only list is public)
  getCities: () => request('/admin/cities'),
  getActiveCities: () => request('/cities'),
  createCity: (cityData) => request('/admin/cities', {
    method: 'POST',
    body: JSON.stringify(cityData),
  }),
  updateCity: (id, cityData) => request(`/admin/cities/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(cityData),
  }),
  deleteCity: (id) => request(`/admin/cities/${id}`, {
    method: 'DELETE',
  }),

  // Mobile Home screen banner ({ badge, title, buttonText })
  getHomeBanner: () => request('/admin/settings/home-banner'),
  updateHomeBanner: (banner) => request('/admin/settings/home-banner', {
    method: 'PUT',
    body: JSON.stringify(banner),
  }),

  // Agent Commission Settings API ({ type: 'percent' | 'per_bag', value })
  getCommissionSettings: () => request('/admin/settings/commission'),
  updateCommissionSettings: (settings) => request('/admin/settings/commission', {
    method: 'PUT',
    body: JSON.stringify(settings),
  }),
};

export default adminApi;
