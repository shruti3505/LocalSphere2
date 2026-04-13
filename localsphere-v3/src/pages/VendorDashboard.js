import React, { useState, useEffect } from 'react';
import {
  getMyProducts, addProduct, updateProduct, deleteProduct,
  registerVendor, uploadImage,
  getVendorOrders, updateOrderStatus
} from '../services/api';
import { useAuth } from '../context/AppContext';
import { CATEGORY_IMAGES } from '../data/defaults';
import toast from 'react-hot-toast';

const EMPTY = { name: '', description: '', price: '', stock: '', category: 'Food', negotiable: false, discountMin: 0, discountMax: 10, sustainabilityScore: 0, images: [] };
const CATS  = ['Food', 'Vegetables', 'Fruits', 'Electronics', 'Clothing', 'Handicrafts', 'Dairy', 'Other'];
const STATUS_STYLE = {
  pending:   { bg: '#f59e0b22', color: '#f59e0b' },
  confirmed: { bg: '#3b82f622', color: '#3b82f6' },
  delivered: { bg: '#10b98122', color: '#10b981' },
  cancelled: { bg: '#ef444422', color: '#ef4444' },
};

export default function VendorDashboard() {
  const { user } = useAuth();
  const [products,      setProducts]      = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [showForm,      setShowForm]      = useState(false);
  const [form,          setForm]          = useState(EMPTY);
  const [editing,       setEditing]       = useState(null);
  const [saving,        setSaving]        = useState(false);
  const [imgPreview,    setImgPreview]    = useState('');
  const [imgUploading,  setImgUploading]  = useState(false);
  const [orders,        setOrders]        = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [pendingCount,  setPendingCount]  = useState(0);
  const [tab,           setTab]           = useState('products');
  const [vendorForm,    setVendorForm]    = useState({ shopName: '', description: '', category: 'Food', whatsapp: '', address: '' });
  const [shopSaved,     setShopSaved]     = useState(false);

  useEffect(() => { fetchProducts(); fetchPendingCount(); }, []);
  useEffect(() => { if (tab === 'orders') fetchOrders(); }, [tab]);

  const fetchProducts = async () => {
    try {
      const { data } = await getMyProducts();
      setProducts(data);
    } catch (err) {
      console.error('Fetch products error:', err);
      toast.error('Failed to load products');
    } finally { setLoading(false); }
  };

  const fetchPendingCount = async () => {
    try {
      const { data } = await getVendorOrders();
      setPendingCount(data.filter(o => o.status === 'pending').length);
    } catch { }
  };

  const fetchOrders = async () => {
    setOrdersLoading(true);
    try {
      const { data } = await getVendorOrders();
      setOrders(data);
      setPendingCount(data.filter(o => o.status === 'pending').length);
    } catch (err) {
      console.error('Fetch orders error:', err);
      toast.error(err.response?.data?.msg || 'Failed to load orders');
    } finally { setOrdersLoading(false); }
  };

  const handleStatusUpdate = async (orderId, status) => {
    try {
      await updateOrderStatus(orderId, status);
      toast.success('Order marked as ' + status + ' ✅');
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to update status');
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return toast.error('Only JPG, PNG, WEBP allowed');
    if (file.size > 2 * 1024 * 1024) return toast.error('Max file size: 2MB');
    setImgUploading(true);
    try {
      const base64 = await uploadImage(file);
      setImgPreview(base64);
      setForm({ ...form, images: [base64] });
      toast.success('Image ready!');
    } catch { toast.error('Image upload failed'); }
    finally { setImgUploading(false); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.stock) return toast.error('Fill all required fields');
    setSaving(true);
    try {
      const payload = { ...form, price: parseFloat(form.price), stock: parseInt(form.stock) };
      if (editing) { await updateProduct(editing, payload); toast.success('Product updated!'); }
      else         { await addProduct(payload); toast.success('Product added! 🎉'); }
      setForm(EMPTY); setImgPreview(''); setShowForm(false); setEditing(null);
      fetchProducts();
    } catch (err) {
      console.error('Save product error:', err);
      const msg = err.response?.data?.msg;
      if (msg)                           toast.error(msg);
      else if (err.response?.status === 403) toast.error('Please register your shop first via Shop Settings.');
      else if (err.response?.status === 401) toast.error('Session expired. Please log in again.');
      else                               toast.error('Failed to save product. Check your connection and try again.');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this product?')) return;
    try { await deleteProduct(id); toast.success('Removed'); fetchProducts(); }
    catch { toast.error('Failed to remove product'); }
  };

  const handleShopSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await registerVendor({ ...vendorForm, coordinates: [0, 0] });
      toast.success('Shop registered! Now add products. 🎉');
      setShopSaved(true); setTab('products');
    } catch (err) {
      const msg = err.response?.data?.msg || '';
      if (msg.includes('already')) { toast.success('Shop already registered!'); setShopSaved(true); setTab('products'); }
      else toast.error(msg || 'Failed to register shop');
    } finally { setSaving(false); }
  };

  const openAdd  = () => { setForm(EMPTY); setEditing(null); setImgPreview(''); setShowForm(true); };
  const openEdit = (p) => { setForm({ ...p }); setEditing(p._id); setImgPreview(p.images?.[0] || ''); setShowForm(true); };

  return (
    <div className="page">
      {/* Header */}
      <div className="flex-between" style={{ marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'Syne', fontSize: 30, fontWeight: 800 }}>📊 Vendor Dashboard</h1>
          <p style={{ color: 'var(--text2)', marginTop: 4, fontSize: 13 }}>Hi {user?.name} 👋 Manage your shop</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className={'btn ' + (tab === 'orders' ? 'btn-primary' : 'btn-secondary')}
            onClick={() => setTab('orders')} style={{ position: 'relative' }}>
            📦 Orders
            {pendingCount > 0 && (
              <span style={{ position: 'absolute', top: -7, right: -7, background: '#ef4444', color: '#fff', borderRadius: 99, padding: '1px 6px', fontSize: 10, fontWeight: 700, lineHeight: '16px' }}>
                {pendingCount}
              </span>
            )}
          </button>
          <button className="btn btn-secondary" onClick={() => setTab(tab === 'shop' ? 'products' : 'shop')}>
            ⚙️ {tab === 'shop' ? 'My Products' : 'Shop Settings'}
          </button>
          {tab === 'products' && <button className="btn btn-primary" onClick={openAdd}>+ Add Product</button>}
        </div>
      </div>

      {/* ORDERS TAB */}
      {tab === 'orders' && (
        <div className="card">
          <div className="flex-between" style={{ marginBottom: 20 }}>
            <h2 style={{ fontFamily: 'Syne', fontSize: 20, fontWeight: 700 }}>📦 Customer Orders</h2>
            <button className="btn btn-secondary btn-sm" onClick={fetchOrders}>🔄 Refresh</button>
          </div>
          {ordersLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 110, borderRadius: 12 }} />)}
            </div>
          ) : orders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text2)' }}>
              <div style={{ fontSize: 52, marginBottom: 14 }}>📭</div>
              <p style={{ fontSize: 16, fontFamily: 'Syne', fontWeight: 700, marginBottom: 6 }}>No orders yet</p>
              <p style={{ fontSize: 13 }}>When customers order your products, they will appear here.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {orders.map(order => {
                const sc = STATUS_STYLE[order.status] || STATUS_STYLE.pending;
                return (
                  <div key={order._id} style={{ border: '1.5px solid var(--border)', borderLeft: '4px solid ' + sc.color, borderRadius: 14, padding: 18, background: 'var(--bg3)' }}>
                    <div className="flex-between" style={{ marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
                      <div>
                        <p style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 2 }}>
                          Order #{order._id.slice(-8).toUpperCase()} · {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 15 }}>👤 {order.buyer?.name || 'Customer'}</p>
                        {(order.buyer?.phone || order.buyer?.email) && (
                          <p style={{ fontSize: 12, color: 'var(--text2)' }}>{order.buyer?.phone || order.buyer?.email}</p>
                        )}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 20, color: 'var(--accent)' }}>₹{order.totalAmount}</p>
                        <span style={{ display: 'inline-block', marginTop: 4, padding: '3px 12px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: sc.bg, color: sc.color }}>
                          {order.status?.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div style={{ padding: '10px 12px', background: 'var(--bg2)', borderRadius: 10, marginBottom: 12 }}>
                      {order.items.map((item, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: i < order.items.length - 1 ? 8 : 0, marginBottom: i < order.items.length - 1 ? 8 : 0, borderBottom: i < order.items.length - 1 ? '1px solid var(--border)' : 'none' }}>
                          {item.product?.images?.[0]
                            ? <img src={item.product.images[0]} alt="" style={{ width: 38, height: 38, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                            : <div style={{ width: 38, height: 38, borderRadius: 8, background: 'var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>📦</div>
                          }
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: 13, fontWeight: 600 }}>{item.product?.name || item.productName}</p>
                            <p style={{ fontSize: 12, color: 'var(--text2)' }}>Qty: {item.quantity} × ₹{item.price}</p>
                          </div>
                          <p style={{ fontSize: 13, fontWeight: 700 }}>₹{item.quantity * item.price}</p>
                        </div>
                      ))}
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 12 }}>
                      💳 Payment: <strong style={{ color: 'var(--text1)' }}>{order.paymentMethod?.toUpperCase()}</strong>
                    </p>
                    {order.status !== 'delivered' && order.status !== 'cancelled' && (
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {order.status === 'pending' && (
                          <button className="btn btn-primary btn-sm" onClick={() => handleStatusUpdate(order._id, 'confirmed')}>✅ Confirm Order</button>
                        )}
                        {order.status === 'confirmed' && (
                          <button className="btn btn-sm" style={{ background: 'var(--green)', color: '#fff', border: 'none' }} onClick={() => handleStatusUpdate(order._id, 'delivered')}>🚚 Mark Delivered</button>
                        )}
                        <button className="btn btn-danger btn-sm" onClick={() => handleStatusUpdate(order._id, 'cancelled')}>✕ Cancel</button>
                      </div>
                    )}
                    {(order.status === 'delivered' || order.status === 'cancelled') && (
                      <p style={{ fontSize: 12, color: sc.color, fontWeight: 600 }}>
                        {order.status === 'delivered' ? '✅ Order completed' : '❌ Order cancelled'}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SHOP TAB */}
      {tab === 'shop' && (
        <div className="card" style={{ maxWidth: 580 }}>
          <h2 style={{ fontFamily: 'Syne', fontSize: 22, fontWeight: 700, marginBottom: 6 }}>🏪 Shop Setup</h2>
          <p style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 20 }}>Register your shop to start adding products</p>
          <img src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80" alt="Shop" style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 12, marginBottom: 20 }} />
          <form onSubmit={handleShopSave}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: 'var(--text2)' }}>Shop Name *</label>
                <input placeholder="My Local Shop" value={vendorForm.shopName} onChange={e => setVendorForm({ ...vendorForm, shopName: e.target.value })} required />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: 'var(--text2)' }}>WhatsApp Number</label>
                <input placeholder="91XXXXXXXXXX" value={vendorForm.whatsapp} onChange={e => setVendorForm({ ...vendorForm, whatsapp: e.target.value })} />
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: 'var(--text2)' }}>Category</label>
              <select value={vendorForm.category} onChange={e => setVendorForm({ ...vendorForm, category: e.target.value })}>
                {CATS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: 'var(--text2)' }}>Address</label>
              <input placeholder="Shop address" value={vendorForm.address} onChange={e => setVendorForm({ ...vendorForm, address: e.target.value })} />
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: 'var(--text2)' }}>Description</label>
              <textarea placeholder="About your shop..." value={vendorForm.description} onChange={e => setVendorForm({ ...vendorForm, description: e.target.value })} style={{ minHeight: 80, resize: 'vertical' }} />
            </div>
            <button type="submit" className="btn btn-primary w-full" style={{ height: 48 }} disabled={saving}>
              {saving ? <div className="spinner" /> : 'Register / Update Shop →'}
            </button>
          </form>
        </div>
      )}

      {/* PRODUCTS TAB */}
      {tab === 'products' && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
            {[
              { l: 'Products',    v: products.length,                                       i: '📦', c: 'var(--blue)'   },
              { l: 'Total Stock', v: products.reduce((a, p) => a + (p.stock || 0), 0),      i: '🏪', c: 'var(--green)'  },
              { l: 'Negotiable',  v: products.filter(p => p.negotiable).length,             i: '💬', c: 'var(--accent)' },
              { l: 'Eco Products',v: products.filter(p => p.sustainabilityScore > 5).length, i: '🌱', c: 'var(--green2)' },
            ].map(({ l, v, i, c }) => (
              <div key={l} className="card" style={{ borderColor: c + '25' }}>
                <div style={{ fontSize: 26, marginBottom: 8 }}>{i}</div>
                <div style={{ fontFamily: 'Syne', fontSize: 28, fontWeight: 800, color: c }}>{v}</div>
                <div style={{ color: 'var(--text2)', fontSize: 13 }}>{l}</div>
              </div>
            ))}
          </div>
          <div className="card">
            <h2 style={{ fontFamily: 'Syne', fontSize: 20, fontWeight: 700, marginBottom: 20 }}>My Products</h2>
            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 14 }}>
                {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 200, borderRadius: 12 }} />)}
              </div>
            ) : products.length === 0 ? (
              <div className="flex-center" style={{ padding: 60, flexDirection: 'column', gap: 14 }}>
                <img src="https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=300&q=80" alt="Empty" style={{ width: 150, borderRadius: 12, opacity: 0.4 }} />
                <h3 style={{ fontFamily: 'Syne' }}>No products yet</h3>
                <p style={{ color: 'var(--text2)', fontSize: 13, textAlign: 'center' }}>First click <strong>⚙️ Shop Settings</strong> to register your shop, then add products.</p>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn btn-secondary" onClick={() => setTab('shop')}>⚙️ Setup Shop</button>
                  <button className="btn btn-primary" onClick={openAdd}>+ Add Product</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))', gap: 16 }}>
                {products.map(p => {
                  const imgSrc = p.images?.[0] || CATEGORY_IMAGES[p.category] || CATEGORY_IMAGES['Other'];
                  return (
                    <div key={p._id} style={{ borderRadius: 14, border: '1.5px solid var(--border)', overflow: 'hidden', background: 'var(--bg3)', transition: 'all .2s' }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                      <img src={imgSrc} alt={p.name} style={{ width: '100%', height: 120, objectFit: 'cover' }} onError={e => e.target.src = CATEGORY_IMAGES[p.category] || CATEGORY_IMAGES['Other']} />
                      <div style={{ padding: '12px 14px' }}>
                        <div className="flex-between" style={{ marginBottom: 4 }}>
                          <h4 style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 14 }}>{p.name}</h4>
                          <span className="badge badge-blue" style={{ fontSize: 10 }}>{p.category}</span>
                        </div>
                        <div className="flex-between" style={{ marginBottom: 10 }}>
                          <span style={{ fontFamily: 'Syne', fontWeight: 800, color: 'var(--accent)', fontSize: 17 }}>₹{p.price}</span>
                          <span style={{ fontSize: 11, color: 'var(--text2)' }}>Stock: {p.stock}</span>
                        </div>
                        <div style={{ display: 'flex', gap: 5, marginBottom: 10 }}>
                          {p.negotiable && <span className="badge badge-green" style={{ fontSize: 10 }}>💬 Negotiate</span>}
                          {p.sustainabilityScore > 5 && <span className="badge badge-green" style={{ fontSize: 10 }}>🌱 Eco</span>}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => openEdit(p)}>✏️ Edit</button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p._id)}>🗑️ Remove</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* MODAL */}
      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal" style={{ maxWidth: 520 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontFamily: 'Syne', fontSize: 20, fontWeight: 700 }}>{editing ? '✏️ Edit Product' : '➕ Add Product'}</h3>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: 'var(--text2)', fontSize: 20, cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: 'var(--text2)', fontWeight: 500 }}>Product Image</label>
              {imgPreview ? (
                <div style={{ position: 'relative' }}>
                  <img src={imgPreview} alt="Preview" className="img-preview" onError={() => setImgPreview('')} />
                  <button onClick={() => { setImgPreview(''); setForm({ ...form, images: [] }); }} style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,.7)', border: 'none', color: '#fff', borderRadius: 8, padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}>✕ Remove</button>
                </div>
              ) : (
                <label style={{ display: 'block', cursor: 'pointer' }}>
                  <div className="img-fallback" style={{ cursor: 'pointer', flexDirection: 'column', gap: 8, border: '2px dashed var(--border2)' }}>
                    {imgUploading ? <div className="spinner" /> : <>{CATEGORY_IMAGES[form.category] && <img src={CATEGORY_IMAGES[form.category]} alt="cat" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0, borderRadius: 10, opacity: 0.3 }} />}<div style={{ position: 'relative', textAlign: 'center' }}><div style={{ fontSize: 32, marginBottom: 6 }}>📷</div><p style={{ fontSize: 13, color: 'var(--text2)' }}>Click to upload image</p><p style={{ fontSize: 11, color: 'var(--text3)' }}>JPG, PNG, WEBP — max 2MB</p></div></>}
                  </div>
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageUpload} style={{ display: 'none' }} />
                </label>
              )}
            </div>
            <form onSubmit={handleSave}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                <div><label style={{ display: 'block', marginBottom: 5, fontSize: 13, color: 'var(--text2)' }}>Name *</label><input placeholder="Product name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
                <div><label style={{ display: 'block', marginBottom: 5, fontSize: 13, color: 'var(--text2)' }}>Category</label><select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{CATS.map(c => <option key={c}>{c}</option>)}</select></div>
                <div><label style={{ display: 'block', marginBottom: 5, fontSize: 13, color: 'var(--text2)' }}>Price ₹ *</label><input type="number" placeholder="0" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required /></div>
                <div><label style={{ display: 'block', marginBottom: 5, fontSize: 13, color: 'var(--text2)' }}>Stock *</label><input type="number" placeholder="0" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} required /></div>
              </div>
              <div style={{ marginBottom: 12 }}><label style={{ display: 'block', marginBottom: 5, fontSize: 13, color: 'var(--text2)' }}>Description</label><textarea placeholder="Describe your product..." value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} style={{ minHeight: 70, resize: 'vertical' }} /></div>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'block', marginBottom: 5, fontSize: 13, color: 'var(--text2)' }}>Eco / Sustainability Score: <strong style={{ color: 'var(--green)' }}>{form.sustainabilityScore}/10</strong></label>
                <input type="range" min="0" max="10" value={form.sustainabilityScore} onChange={e => setForm({ ...form, sustainabilityScore: parseInt(e.target.value) })} style={{ width: '100%' }} />
              </div>
              <div style={{ padding: 12, borderRadius: 10, background: 'var(--bg3)', border: '1px solid var(--border2)', marginBottom: 18 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: form.negotiable ? 12 : 0 }}>
                  <input type="checkbox" checked={form.negotiable} onChange={e => setForm({ ...form, negotiable: e.target.checked })} />
                  <span style={{ fontSize: 14, fontWeight: 500 }}>💬 Allow price negotiation</span>
                </label>
                {form.negotiable && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div><label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Min Discount %</label><input type="number" value={form.discountMin} onChange={e => setForm({ ...form, discountMin: parseInt(e.target.value) })} /></div>
                    <div><label style={{ fontSize: 12, color: 'var(--text2)', display: 'block', marginBottom: 4 }}>Max Discount %</label><input type="number" value={form.discountMax} onChange={e => setForm({ ...form, discountMax: parseInt(e.target.value) })} /></div>
                  </div>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10 }}>
                <button type="submit" className="btn btn-primary" style={{ height: 46 }} disabled={saving}>{saving ? <div className="spinner" /> : (editing ? 'Update Product' : 'Add Product')}</button>
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}