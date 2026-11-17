export const API_BASE_URL = (
  import.meta.env.VITE_API_URL || 
  import.meta.env.VITE_API_BASE_URL || 
  'http://localhost:5000'
).replace(/\/+$/, '')

const API = API_BASE_URL
const tok = () => { try { return JSON.parse(localStorage.getItem('lb_user') || 'null')?.access_token } catch { return null } }
const authH = () => { const t = tok(); return t ? { Authorization: `Bearer ${t}` } : {} }

const handleRes = async (res) => {
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    let msg = t;
    try { const j = JSON.parse(t); msg = j.detail || j.message || t; } catch(e) {}
    throw new Error(msg || `${res.status} Error`);
  }
  return res.json();
}

const req = async (path, opts = {}) => {
  const res = await fetch(`${API}${path}`, { ...opts, headers: { 'Content-Type': 'application/json', ...authH(), ...opts.headers } })
  return handleRes(res)
}

export const authAPI = {
  signup: (payloadOrEmail, password, company, purpose, source, captchaToken, role = 'user') => {
    let body = {}
    if (typeof payloadOrEmail === 'object' && payloadOrEmail !== null) {
      body = payloadOrEmail
    } else {
      body = { email: payloadOrEmail, password, company, purpose, source, captcha_token: captchaToken, role }
    }
    return fetch(`${API}/api/auth/signup`, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(body) 
    }).then(handleRes)
  },

  login: (payloadOrEmail, password, captchaToken) => {
    let body = {}
    if (typeof payloadOrEmail === 'object' && payloadOrEmail !== null) {
      body = payloadOrEmail
    } else {
      body = { email: payloadOrEmail, password, captcha_token: captchaToken }
    }
    return fetch(`${API}/api/auth/login`, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(body) 
    }).then(handleRes)
  },

  verifyOTP: (temp_token, otp) => 
    fetch(`${API}/api/auth/verify-otp`, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ temp_token, otp }) 
    }).then(handleRes),

  verifyOtp: (temp_token, otp) => 
    fetch(`${API}/api/auth/verify-otp`, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ temp_token, otp }) 
    }).then(handleRes),

  googleAuth: (payload) => 
    fetch(`${API}/api/auth/google`, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(payload) 
    }).then(handleRes),

  linkedinAuth: (payload) => 
    fetch(`${API}/api/auth/linkedin`, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify(payload) 
    }).then(handleRes),

  getLinkedInUrl: () => req('/api/auth/linkedin/url'),

  getMe: (token) => 
    fetch(`${API}/api/auth/me`, { 
      headers: { 'Authorization': `Bearer ${token}` } 
    }).then(handleRes),

  updateProfile: (data) => 
    fetch(`${API}/api/auth/profile`, { 
      method: 'PUT', 
      headers: authH(), 
      body: JSON.stringify(data) 
    }).then(handleRes),

  createOrder: async () => {
    const res = await paymentAPI.createOrder('pro_monthly', 'phonepe')
    return {
      order_id: res.merchant_transaction_id || res.order_id,
      redirect_url: res.checkout_url || res.redirect_url,
      ...res
    }
  },

  paymentStatus: async (orderId) => {
    try {
      const res = await paymentAPI.verifyPayment({ merchant_transaction_id: orderId, gateway: 'phonepe' })
      if (res?.success) {
        return {
          state: 'COMPLETED',
          expires: res.subscription_expiry,
          ...res
        }
      }
      if (res?.pending) {
        return {
          state: 'PENDING',
          ...res
        }
      }
      return {
        state: 'FAILED',
        ...res
      }
    } catch (err) {
      return { state: 'PENDING', error: err.message }
    }
  },
}

export const adminAPI = {
  getAllUsers: () => req('/api/auth/admin/users/all'),
  resetLimit: (id) => req(`/api/auth/admin/users/reset-limit/${id}`, { method: 'POST' }),
  toggleRole: (id) => req(`/api/auth/admin/users/toggle-role/${id}`, { method: 'POST' }),
  setUnlimited: (id) => req(`/api/auth/admin/users/set-unlimited/${id}`, { method: 'POST' }),
  deleteUser: (id) => req(`/api/auth/admin/users/${id}`, { method: 'DELETE' }),
  getStats: () => req('/api/auth/admin/stats'),

  // Backwards compatibility aliases
  getAllAgents: () => req('/api/auth/admin/users/all'),
  getPendingAgents: () => req('/api/auth/admin/users/all'),
  approveAgent: (id) => req(`/api/auth/admin/users/reset-limit/${id}`, { method: 'POST' }),
  approveUser: (id) => req(`/api/auth/admin/users/reset-limit/${id}`, { method: 'POST' }),
}

export const documentAPI = {
  upload: async (file) => {
    const fd = new FormData(); fd.append('file', file)
    const res = await fetch(`${API}/api/documents/upload`, { method:'POST', headers: authH(), body: fd })
    return handleRes(res)
  },
  list:   () => req('/api/documents'),
  get:    (id) => req(`/api/documents/${id}`),
  delete: (id) => req(`/api/documents/${id}`, { method:'DELETE' }),
  fileUrl: (id) => `${API}/api/documents/${id}/file`,
}

export const summarizeAPI = {
  trigger: (docId) => req(`/summarize/${docId}`, { method: 'POST' }),
  get: (docId) => req(`/result/${docId}`),
  cancel: (docId) => req(`/api/documents/${docId}/cancel`, { method: 'POST' })
}

export const paymentAPI = {
  getPlans: () => req('/api/payments/plans'),
  getSubscription: () => req('/api/payments/subscription'),
  createOrder: (planId = 'pro_monthly', gateway = null, redirectUrl = null) => 
    req('/api/payments/create-order', { 
      method: 'POST', 
      body: JSON.stringify({ plan_id: planId, gateway, redirect_url: redirectUrl }) 
    }),
  createPhonePeOrder: (planId = 'pro_monthly', redirectUrl = null) => 
    req('/api/payments/phonepe/create-order', { 
      method: 'POST', 
      body: JSON.stringify({ plan_id: planId, redirect_url: redirectUrl }) 
    }),
  verifyPayment: (payload) => 
    req('/api/payments/verify', { 
      method: 'POST', 
      body: JSON.stringify(payload) 
    }),
  verifyPhonePe: (merchantTransactionId, simulatedSuccess = false) => 
    req('/api/payments/phonepe/verify', { 
      method: 'POST', 
      body: JSON.stringify({ merchant_transaction_id: merchantTransactionId, simulated_success: simulatedSuccess }) 
    }),
  getUpiQr: (planId = 'pro_monthly') => 
    req(`/api/payments/upi-qr?plan_id=${planId}`),
  getHistory: () => req('/api/payments/history')
}

export const fetchFileAsBlob = async (docId) => {
  const res = await fetch(`${API}/api/documents/${docId}/file`, { headers: authH() })
  if (!res.ok) throw new Error('Cannot fetch file')
  return res.blob()
}

export const healthCheck = async () => { try { return (await fetch(`${API}/health`)).ok } catch { return false } }
