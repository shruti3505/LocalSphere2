import axios from 'axios';

const API = axios.create({ baseURL: 'http://localhost:5000/api' });

API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

// ── Auth ──────────────────────────────────────────────────────────────────────
export const register = (data) => API.post('/auth/register', data);
export const login    = (data) => API.post('/auth/login', data);

// ── Vendor ────────────────────────────────────────────────────────────────────
export const registerVendor    = (data)          => API.post('/vendors/register', data);
export const updateVendor      = (data)          => API.put('/vendors/update', data);
export const getNearbyVendors  = (lat, lng, r)   => API.get(`/vendors/nearby?lat=${lat}&lng=${lng}&radius=${r || 15000}`);

// ── Products ──────────────────────────────────────────────────────────────────
export const getProducts   = (params)    => API.get('/products', { params });
export const getMyProducts = ()          => API.get('/products/my');
export const addProduct    = (data)      => API.post('/products', data);
export const updateProduct = (id, data)  => API.put(`/products/${id}`, data);
export const deleteProduct = (id)        => API.delete(`/products/${id}`);

// ── Orders ────────────────────────────────────────────────────────────────────
export const placeOrder         = (data)         => API.post('/orders', data);
export const getMyOrders        = ()             => API.get('/orders/my');
export const cancelOrder        = (id)           => API.put(`/orders/${id}/cancel`);
export const getVendorOrders    = ()             => API.get('/orders/vendor');           // ✅ NEW
export const updateOrderStatus  = (id, status)   => API.put(`/orders/${id}/status`, { status }); // ✅ NEW

// ── Group Buy ─────────────────────────────────────────────────────────────────
export const getGroupBuys  = ()   => API.get('/groupbuy');
export const joinGroupBuy  = (id) => API.post(`/groupbuy/join/${id}`);

// ── Negotiate ─────────────────────────────────────────────────────────────────
export const negotiate = (data) => API.post('/negotiate', data);

// ── Image Upload (base64, no external service needed) ─────────────────────────
export const uploadImage = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = (e) => resolve(e.target.result);
    reader.onerror = ()  => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

// ── Helpers ───────────────────────────────────────────────────────────────────
export const getImageSrc = (product) => {
  if (product?.images?.[0]) return product.images[0];
  const { CATEGORY_IMAGES } = require('../data/defaults');
  return CATEGORY_IMAGES[product?.category] || CATEGORY_IMAGES['Other'];
};

export default API;