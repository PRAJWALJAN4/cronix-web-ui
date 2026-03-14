import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use(config => {
    const token = localStorage.getItem('sc_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
})

api.interceptors.response.use(
    r => r,
    err => {
        if (err.response?.status === 401) {
            localStorage.removeItem('sc_token')
            localStorage.removeItem('sc_user')
            window.location.href = '/login'
        }
        return Promise.reject(err)
    }
)

// AUTH
export const sendOtp = (phoneNumber) => api.post('/auth/send-otp', { phoneNumber })
export const verifyOtp = (phoneNumber, otp) => api.post('/auth/verify-otp', { phoneNumber, otp })
export const adminLogin = (phoneNumber, password) => api.post('/auth/admin-login', { phoneNumber, password })
export const updateProfile = (name, email) => api.put('/auth/profile', { name, email })

// USER - Terminals
export const getTerminals = () => api.get('/user/terminals')
export const getTerminal = (id) => api.get(`/user/terminals/${id}`)
export const getUserTerminalMetadata = (id) => api.get(`/user/terminals/${id}/metadata`)
export const getBoxLayout = (terminalId) => api.get(`/user/terminals/${terminalId}/boxes`)

// USER - Allocation
export const allocateBox = (terminalId, boxId, durationHours) => api.post('/user/allocate', { terminalId, boxId, durationHours })

// USER - Orders
export const getMyOrders = () => api.get('/user/orders')
export const processDropoff = (orderId, code) => api.post(`/user/orders/${orderId}/dropoff`, { code })
export const processPickup = (orderId, code, paymentDone) => api.post(`/user/orders/${orderId}/pickup`, { code, paymentDone: paymentDone ? 'true' : 'false' })
export const cancelOrder = (orderId) => api.post(`/user/orders/${orderId}/cancel`)

// USER - Box Access
export const openBox = (boxId, otp) => api.post(`/user/boxes/${boxId}/open`, { otp })
export const closeBox = (boxId) => api.post(`/user/boxes/${boxId}/close`)

// USER - Profile
export const getProfile = () => api.get('/user/profile')

// ADMIN - Sites
export const getSites = () => api.get('/admin/sites')
export const createSite = (data) => api.post('/admin/sites', data)
export const updateSite = (id, data) => api.put(`/admin/sites/${id}`, data)
export const deleteSite = (id) => api.delete(`/admin/sites/${id}`)

// ADMIN - Terminals
export const getAdminTerminals = () => api.get('/admin/terminals')
export const createTerminal = (data) => api.post('/admin/terminals', data)
export const updateTerminal = (id, data) => api.put(`/admin/terminals/${id}`, data)
export const deleteTerminal = (id) => api.delete(`/admin/terminals/${id}`)
export const updateAdminTerminalStatus = (id, status) => api.put(`/admin/terminals/${id}/status`, { status });
export const getTerminalMetadata = (id) => api.get(`/admin/terminals/${id}/metadata`)
export const createTerminalMetadata = (id, data) => api.post(`/admin/terminals/${id}/metadata`, data)
export const updateTerminalMetadata = (id, data) => api.put(`/admin/terminals/${id}/metadata`, data)
export const generateBoxes = (id) => api.post(`/admin/terminals/${id}/generate-boxes`)
export const getAdminBoxes = (terminalId) => api.get(`/admin/terminals/${terminalId}/boxes`)
export const updateBoxStatus = (boxId, status) => api.put(`/admin/boxes/${boxId}/status`, { status })

// ADMIN - Pricing
export const getPricing = () => api.get('/admin/pricing')
export const createPricing = (data) => api.post('/admin/pricing', data)
export const updatePricing = (id, data) => api.put(`/admin/pricing/${id}`, data)

// ADMIN - Orders
export const getAllOrders = () => api.get('/admin/orders')
export const updateOrderStatus = (id, status) => api.put(`/admin/orders/${id}/status`, { status })
export const markOrderReady = (id) => api.post(`/admin/orders/${id}/ready`)
