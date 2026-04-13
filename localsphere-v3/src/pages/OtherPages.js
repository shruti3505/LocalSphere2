import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getMyOrders, getNearbyVendors, getGroupBuys, cancelOrder } from '../services/api';
import { NEARBY_VENDORS, DEFAULT_PRODUCTS, CATEGORY_IMAGES } from '../data/defaults';
import { useAuth, useCart } from '../context/AppContext';
import toast from 'react-hot-toast';

const STATUS = {
  pending:   { bg: 'rgba(255,179,71,.1)',  c: '#ffb347', b: 'rgba(255,179,71,.3)',  l: '⏳ Pending' },
  confirmed: { bg: 'rgba(79,195,247,.1)',  c: '#4fc3f7', b: 'rgba(79,195,247,.3)',  l: '✅ Confirmed' },
  delivered: { bg: 'rgba(0,230,118,.1)',   c: '#00e676', b: 'rgba(0,230,118,.3)',   l: '🎉 Delivered' },
  cancelled: { bg: 'rgba(255,82,82,.1)',   c: '#ff5252', b: 'rgba(255,82,82,.3)',   l: '❌ Cancelled' },
};

// ── Order tracking steps ──────────────────────────────────────────────────────
const TRACK_STEPS = [
  { key: 'pending',   icon: '📋', label: 'Order Placed' },
  { key: 'confirmed', icon: '✅', label: 'Confirmed' },
  { key: 'delivered', icon: '🎉', label: 'Delivered' },
];

const stepIndex = (status) => {
  if (status === 'cancelled') return -1;
  return TRACK_STEPS.findIndex(s => s.key === status);
};

// ── Order tracking timeline component ────────────────────────────────────────
function TrackingTimeline({ order }) {
  const current = stepIndex(order.status);
  if (order.status === 'cancelled') return null;

  return (
    <div style={{ padding: '14px 0 4px', borderTop: '1px solid var(--border)', marginTop: 14 }}>
      <p style={{ fontSize: 11, color: 'var(--text2)', fontWeight: 600, marginBottom: 14, letterSpacing: 1 }}>ORDER TRACKING</p>
      <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
        {/* Progress line */}
        <div style={{ position: 'absolute', top: 16, left: 16, right: 16, height: 3, background: 'var(--border)', borderRadius: 4, zIndex: 0 }} />
        <div style={{
          position: 'absolute', top: 16, left: 16, height: 3, borderRadius: 4, zIndex: 1,
          background: 'linear-gradient(90deg,var(--accent),var(--green))',
          width: current === 0 ? '0%' : current === 1 ? '50%' : '100%',
          transition: 'width .6s ease'
        }} />

        {/* Steps */}
        {TRACK_STEPS.map((step, i) => {
          const done    = i <= current;
          const active  = i === current;
          return (
            <div key={step.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', zIndex: 2 }}>
              <div style={{
                width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, transition: 'all .3s',
                background: done ? 'linear-gradient(135deg,var(--accent),var(--green))' : 'var(--bg3)',
                border: `2px solid ${done ? 'var(--accent)' : 'var(--border)'}`,
                boxShadow: active ? '0 0 12px rgba(255,92,26,.4)' : 'none',
              }}>
                {step.icon}
              </div>
              <p style={{ fontSize: 11, marginTop: 7, fontWeight: done ? 700 : 400, color: done ? 'var(--text)' : 'var(--text2)', textAlign: 'center' }}>
                {step.label}
              </p>
              {/* timestamp from statusHistory */}
              {order.statusHistory?.find(h => h.status === step.key) && (
                <p style={{ fontSize: 10, color: 'var(--text2)', marginTop: 2, textAlign: 'center' }}>
                  {new Date(order.statusHistory.find(h => h.status === step.key).timestamp)
                    .toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Status note */}
      {order.statusHistory?.length > 0 && (
        <p style={{ fontSize: 12, color: 'var(--text2)', marginTop: 14, textAlign: 'center', fontStyle: 'italic' }}>
          {order.statusHistory[order.statusHistory.length - 1]?.note}
        </p>
      )}
    </div>
  );
}

// ── Orders Page ───────────────────────────────────────────────────────────────
export function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);
  const [expanded, setExpanded] = useState(null);

  const fetchOrders = () => {
    setLoading(true);
    getMyOrders()
      .then(({ data }) => setOrders(data))
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleCancel = async (orderId) => {
    if (!window.confirm('Cancel this order?')) return;
    setCancelling(orderId);
    try {
      await cancelOrder(orderId);
      toast.success('Order cancelled successfully');
      fetchOrders();
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Cannot cancel this order');
    } finally {
      setCancelling(null);
    }
  };

  if (loading) return (
    <div className="flex-center" style={{ padding: 120 }}>
      <div className="spinner" style={{ width: 40, height: 40 }} />
    </div>
  );

  return (
    <div className="page">
      <div className="flex-between" style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'Syne', fontSize: 30, fontWeight: 800 }}>📦 My Orders</h1>
        <button className="btn btn-ghost btn-sm" onClick={fetchOrders}>↻ Refresh</button>
      </div>

      {orders.length === 0 ? (
        <div className="flex-center" style={{ padding: 80, flexDirection: 'column', gap: 16 }}>
          <img src="https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=300&q=80" alt="None" style={{ width: 180, borderRadius: 16, opacity: 0.4 }} />
          <h3 style={{ fontFamily: 'Syne', fontSize: 22 }}>No orders yet</h3>
          <Link to="/products" className="btn btn-primary">Start Shopping →</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {orders.map(order => {
            const s          = STATUS[order.status] || STATUS.pending;
            const isExpanded = expanded === order._id;
            const canCancel  = order.status === 'pending';

            return (
              <div key={order._id} className="card fade-in" style={{
                border: order.status === 'cancelled' ? '1.5px solid rgba(255,82,82,.3)' :
                        order.status === 'delivered' ? '1.5px solid rgba(0,230,118,.3)' : '1.5px solid var(--border)'
              }}>
                {/* Top row */}
                <div className="flex-between" style={{ marginBottom: 14 }}>
                  <div>
                    <span style={{ fontSize: 11, color: 'var(--text2)', letterSpacing: 1 }}>ORDER</span>
                    <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 15 }}>#{order._id.slice(-8).toUpperCase()}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    <span style={{ fontSize: 12, color: 'var(--text2)' }}>
                      {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                    <span style={{ padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, background: s.bg, color: s.c, border: `1px solid ${s.b}` }}>
                      {s.l}
                    </span>
                  </div>
                </div>

                {/* Items */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                  {order.items?.map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 10, background: 'var(--bg3)', border: '1px solid var(--border)' }}>
                      <span style={{ fontSize: 13 }}>{item.product?.name || item.productName || 'Product'} ×{item.quantity}</span>
                      <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 13 }}>₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>

                {/* Bottom row */}
                <div className="flex-between" style={{ flexWrap: 'wrap', gap: 10 }}>
                  <span style={{ fontSize: 13, color: 'var(--text2)' }}>
                    {order.paymentMethod?.toUpperCase()} · {order.vendor?.shopName || order.vendorName || 'Local Vendor'}
                  </span>
                  <span style={{ fontFamily: 'Syne', fontSize: 22, fontWeight: 800, color: 'var(--accent)' }}>₹{order.totalAmount}</span>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                  {/* Track order toggle */}
                  {order.status !== 'cancelled' && (
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ flex: 1, fontSize: 12 }}
                      onClick={() => setExpanded(isExpanded ? null : order._id)}
                    >
                      {isExpanded ? '▲ Hide Tracking' : '📍 Track Order'}
                    </button>
                  )}

                  {/* Cancel button — only for pending */}
                  {canCancel && (
                    <button
                      className="btn btn-sm"
                      style={{ flex: 1, fontSize: 12, background: 'rgba(255,82,82,.1)', color: '#ff5252', border: '1.5px solid rgba(255,82,82,.3)', borderRadius: 8, cursor: 'pointer', height: 34 }}
                      onClick={() => handleCancel(order._id)}
                      disabled={cancelling === order._id}
                    >
                      {cancelling === order._id ? <div className="spinner" style={{ width: 14, height: 14 }} /> : '✕ Cancel Order'}
                    </button>
                  )}

                  {/* Cancelled label */}
                  {order.status === 'cancelled' && (
                    <div style={{ flex: 1, textAlign: 'center', padding: '7px 0', fontSize: 12, color: '#ff5252', fontWeight: 600 }}>
                      This order was cancelled
                    </div>
                  )}
                </div>

                {/* ✅ Tracking timeline — shown when expanded */}
                {isExpanded && <TrackingTimeline order={order} />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Vendor Modal ──────────────────────────────────────────────────────────────
function VendorModal({ vendor, onClose }) {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const products = DEFAULT_PRODUCTS.filter(p => p.vendor._id === vendor._id);
  const img = vendor.img || CATEGORY_IMAGES[vendor.category] || CATEGORY_IMAGES['Other'];

  const handleAdd = (product) => {
    if (!user) return toast.error('Please login to add to cart');
    if (user.role === 'vendor') return toast.error('Vendors cannot place orders');
    addToCart(product);
    toast.success(`${product.name} added to cart!`);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 680, maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
        <div style={{ position: 'relative', marginBottom: 20 }}>
          <img src={img} alt={vendor.shopName} style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 12 }} onError={e => e.target.src = CATEGORY_IMAGES['Other']} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(0,0,0,.7),transparent)', borderRadius: 12, display: 'flex', alignItems: 'flex-end', padding: 16 }}>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontFamily: 'Syne', fontSize: 22, fontWeight: 800, color: '#fff' }}>{vendor.shopName}</h2>
              <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' }}>
                <span className="badge badge-blue" style={{ fontSize: 10 }}>{vendor.category}</span>
                {vendor.trustScore && <span className="badge badge-orange" style={{ fontSize: 10 }}>⭐ {vendor.trustScore}</span>}
                {vendor.distance && <span style={{ fontSize: 11, color: 'rgba(255,255,255,.7)' }}>{vendor.distance}km away</span>}
              </div>
            </div>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,.15)', border: 'none', color: '#fff', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 16 }}>✕</button>
          </div>
        </div>
        {vendor.description && <p style={{ color: 'var(--text2)', fontSize: 13, marginBottom: 18, lineHeight: 1.6 }}>{vendor.description}</p>}
        <h3 style={{ fontFamily: 'Syne', fontSize: 16, fontWeight: 700, marginBottom: 14 }}>🛍️ Products ({products.length})</h3>
        {products.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text2)' }}>No products available</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 12 }}>
            {products.map(p => (
              <div key={p._id} style={{ borderRadius: 12, border: '1.5px solid var(--border)', overflow: 'hidden', background: 'var(--bg3)', display: 'flex', flexDirection: 'column' }}>
                <img src={p.images?.[0] || CATEGORY_IMAGES[p.category]} alt={p.name} style={{ width: '100%', height: 100, objectFit: 'cover' }} onError={e => e.target.src = CATEGORY_IMAGES['Other']} />
                <div style={{ padding: '10px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 13 }}>{p.name}</p>
                  <p style={{ fontSize: 11, color: 'var(--text2)', flex: 1 }}>{p.description}</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                    <span style={{ fontFamily: 'Syne', fontWeight: 800, color: 'var(--accent)', fontSize: 15 }}>₹{p.price}</span>
                    <span style={{ fontSize: 10, color: 'var(--text2)' }}>Stock: {p.stock}</span>
                  </div>
                  {p.negotiable && <span className="badge badge-green" style={{ fontSize: 9, width: 'fit-content' }}>💬 Negotiable</span>}
                  <button className="btn btn-primary btn-sm" style={{ marginTop: 8, height: 32, fontSize: 12 }} onClick={() => handleAdd(p)}>
                    + Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        {vendor.whatsapp && (
          <a href={`https://wa.me/${vendor.whatsapp}`} target="_blank" rel="noreferrer" className="btn btn-whatsapp w-full"
            style={{ display: 'block', textAlign: 'center', marginTop: 20, padding: 12, borderRadius: 10 }}>
            💬 Chat on WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}

// ── Vendors Page ──────────────────────────────────────────────────────────────
export function Vendors() {
  const [vendors, setVendors] = useState(NEARBY_VENDORS);
  const [locating, setLocating] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);

  const findNearby = () => {
    setLocating(true);
    if (!navigator.geolocation) { toast.error('Geolocation not supported'); setLocating(false); return; }
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const { data } = await getNearbyVendors(coords.latitude, coords.longitude);
          if (data.length > 0) setVendors(data);
          else { setVendors(NEARBY_VENDORS); toast('Showing featured vendors', { icon: '📍' }); }
        } catch { setVendors(NEARBY_VENDORS); }
        finally { setLocating(false); }
      },
      () => { toast('Showing featured vendors', { icon: '📍' }); setLocating(false); }
    );
  };

  const imgs = [
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&q=80',
    'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80',
    'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=400&q=80',
    'https://images.unsplash.com/photo-1533900298318-6b8da08a523e?w=400&q=80',
    'https://images.unsplash.com/photo-1532336414038-cf19250c5757?w=400&q=80',
    'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&q=80',
    'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&q=80',
    'https://images.unsplash.com/photo-1606722590583-6951b5ea92ad?w=400&q=80',
  ];

  return (
    <div className="page">
      <div style={{ position: 'relative', borderRadius: 22, overflow: 'hidden', marginBottom: 32 }}>
        <img src="https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1200&q=80" alt="Map" style={{ width: '100%', height: 280, objectFit: 'cover', opacity: 0.2 }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 60%,rgba(255,92,26,.15) 0%,rgba(8,8,16,.7) 70%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
          <h1 style={{ fontFamily: 'Syne', fontSize: 36, fontWeight: 800 }}>Nearby Vendors</h1>
          <p style={{ color: 'var(--text2)', fontSize: 15 }}>Discover local businesses in your area</p>
          <button className="btn btn-primary" style={{ padding: '12px 28px' }} onClick={findNearby} disabled={locating}>
            {locating ? <><div className="spinner" /> Locating...</> : 'Use My Location'}
          </button>
        </div>
      </div>
      <div className="flex-between" style={{ marginBottom: 20 }}>
        <p style={{ color: 'var(--text2)', fontSize: 13 }}>{vendors.length} vendors shown</p>
        <button className="btn btn-ghost btn-sm" onClick={findNearby}>Refresh</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 18 }}>
        {vendors.map((v, i) => (
          <div key={v._id} className="card card-glow fade-in"
            style={{ padding: 0, overflow: 'hidden', animationDelay: `${i * 0.05}s`, cursor: 'pointer', transition: 'transform .2s' }}
            onClick={() => setSelectedVendor(v)}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
            <div style={{ position: 'relative' }}>
              <img src={v.img || imgs[i % imgs.length]} alt={v.shopName} style={{ width: '100%', height: 140, objectFit: 'cover' }} onError={e => e.target.src = imgs[i % imgs.length]} />
              <span style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,.65)', color: '#fff', fontSize: 10, borderRadius: 20, padding: '3px 8px' }}>
                {DEFAULT_PRODUCTS.filter(p => p.vendor._id === v._id).length} products
              </span>
            </div>
            <div style={{ padding: '14px 16px' }}>
              <div className="flex-between" style={{ marginBottom: 6 }}>
                <h3 style={{ fontFamily: 'Syne', fontSize: 16, fontWeight: 700 }}>{v.shopName}</h3>
                <span className="badge badge-blue" style={{ fontSize: 10 }}>{v.category}</span>
              </div>
              {v.description && <p style={{ color: 'var(--text2)', fontSize: 12, marginBottom: 10, lineHeight: 1.5 }}>{v.description}</p>}
              <div className="flex-between">
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  {v.trustScore && <span className="badge badge-orange" style={{ fontSize: 10 }}>⭐ {v.trustScore}</span>}
                  {v.distance && <span style={{ fontSize: 11, color: 'var(--text2)' }}>{v.distance}km</span>}
                </div>
                <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600 }}>View Products →</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      {selectedVendor && <VendorModal vendor={selectedVendor} onClose={() => setSelectedVendor(null)} />}
    </div>
  );
}

// ── Group Buy Page ────────────────────────────────────────────────────────────
export function GroupBuy() {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [joined, setJoined] = useState({});

  useEffect(() => { fetchGroups(); }, []);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const { data } = await getGroupBuys();
      setGroups(data);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  };

  const seedDemo = async () => {
    setSeeding(true);
    try {
      const res = await fetch('http://localhost:5000/api/groupbuy/seed-demo', { method: 'POST' });
      const data = await res.json();
      if (data.msg?.includes('created')) { toast.success(data.msg); fetchGroups(); }
      else toast.error(data.msg || 'Failed');
    } catch { toast.error('Seed failed.'); }
    finally { setSeeding(false); }
  };

  const handleJoin = async (id) => {
    if (!user) return toast.error('Login to join');
    if (user.role === 'vendor') return toast.error('Vendors cannot join group buys');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/groupbuy/join/${id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.unlocked) {
        toast.success('🎉 Discount Unlocked! Add to cart now!', { duration: 4000 });
      } else if (data.group) {
        toast.success('Joined! Waiting for others...');
      } else {
        toast.error(data.msg || 'Failed to join');
        return;
      }
      setJoined(prev => ({ ...prev, [id]: true }));
      fetchGroups();
    } catch { toast.error('Failed to join'); }
  };

  const handleAddGroupToCart = (group) => {
    if (!user) return toast.error('Login first');
    if (user.role === 'vendor') return toast.error('Vendors cannot place orders');
    const name = group.product?.name || group.productName;
    const price = group.product?.price || group.productPrice;
    const image = group.product?.images?.[0] || group.productImage;
    const category = group.product?.category || group.productCategory;
    const vendorName = group.vendor?.shopName || group.vendorName || 'Local Vendor';
    if (!price) return toast.error('Product info missing');
    const discountedPrice = Math.ceil(price * (1 - group.discountPercent / 100));
    addToCart({ _id: `groupbuy_${group._id}`, name, price: discountedPrice, originalPrice: price, images: image ? [image] : [], category, stock: 99, vendor: { _id: 'groupbuy', shopName: vendorName }, isGroupBuy: true, discountPercent: group.discountPercent });
    toast.success(`Added at ₹${discountedPrice} (${group.discountPercent}% off)! 🎉`);
  };

  const timeLeft = (exp) => {
    const d = new Date(exp) - new Date();
    if (d <= 0) return 'Expired';
    return `${Math.floor(d / 3600000)}h ${Math.floor((d % 3600000) / 60000)}m left`;
  };

  const isJoined = (group) => {
    if (joined[group._id]) return true;
    if (!user) return false;
    return group.participants?.some(p => (p._id || p)?.toString() === user.id?.toString());
  };

  const getProductName  = (g) => g.product?.name        || g.productName     || 'Product Deal';
  const getProductImage = (g) => g.product?.images?.[0]  || g.productImage    || null;
  const getProductPrice = (g) => g.product?.price        || g.productPrice    || null;
  const getVendorName   = (g) => g.vendor?.shopName      || g.vendorName      || 'Local Vendor';
  const getCategory     = (g) => g.product?.category     || g.productCategory || null;

  return (
    <div className="page">
      <div style={{ position: 'relative', borderRadius: 22, overflow: 'hidden', marginBottom: 32 }}>
        <img src="https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&q=80" alt="Group buy" style={{ width: '100%', height: 240, objectFit: 'cover', opacity: 0.18 }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 30% 50%,rgba(0,230,118,.12) 0%,transparent 60%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px' }}>
          <div>
            <div className="badge badge-green" style={{ marginBottom: 12 }}>Social Commerce</div>
            <h1 style={{ fontFamily: 'Syne', fontSize: 36, fontWeight: 800 }}>Group Buying</h1>
            <p style={{ color: 'var(--text2)', marginTop: 6 }}>Join locals, unlock discounts together</p>
          </div>
          <button className="btn btn-secondary" onClick={seedDemo} disabled={seeding} style={{ flexShrink: 0 }}>
            {seeding ? <div className="spinner" /> : 'Load Demo Deals'}
          </button>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 32 }}>
        {[['1','Browse Deals','Find open group buys'],['2','Join Group','Click before expiry'],['3','Get 3-5 People','Reach minimum threshold'],['4','Add to Cart','Buy at group discount!']].map(([st,ti,de]) => (
          <div key={st} className="card" style={{ textAlign: 'center', padding: '16px 12px' }}>
            <div style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700, marginBottom: 4 }}>Step {st}</div>
            <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{ti}</div>
            <div style={{ color: 'var(--text2)', fontSize: 11 }}>{de}</div>
          </div>
        ))}
      </div>
      {loading ? (
        <div className="flex-center" style={{ padding: 80 }}><div className="spinner" style={{ width: 40, height: 40 }} /></div>
      ) : groups.length === 0 ? (
        <div className="flex-center" style={{ padding: 60, flexDirection: 'column', gap: 16 }}>
          <img src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=300&q=80" alt="None" style={{ width: 160, borderRadius: 16, opacity: 0.4 }} />
          <h3 style={{ fontFamily: 'Syne', fontSize: 22 }}>No active group buys</h3>
          <button className="btn btn-primary" onClick={seedDemo} disabled={seeding}>{seeding ? <div className="spinner" /> : 'Load Demo Deals'}</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 20 }}>
          {groups.map(group => {
            const pct = Math.min((group.participants?.length / group.minUsers) * 100, 100);
            const joined_ = isJoined(group);
            const remaining = group.minUsers - (group.participants?.length || 0);
            const productPrice = getProductPrice(group);
            const discountedPrice = productPrice ? Math.ceil(productPrice * (1 - group.discountPercent / 100)) : null;
            const isUnlocked = group.status === 'successful';
            return (
              <div key={group._id} className="card card-glow fade-in" style={{ border: isUnlocked ? '1.5px solid var(--green)' : '1.5px solid var(--border)' }}>
                <div className="flex-between" style={{ marginBottom: 14 }}>
                  <span className="badge badge-green" style={{ fontSize: 13 }}>{group.discountPercent}% OFF</span>
                  <span style={{ fontSize: 12, color: 'var(--text2)' }}>{timeLeft(group.expiresAt)}</span>
                </div>
                {getProductImage(group) && <img src={getProductImage(group)} alt={getProductName(group)} style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 10, marginBottom: 12 }} onError={e => e.target.style.display = 'none'} />}
                <h3 style={{ fontFamily: 'Syne', fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{getProductName(group)}</h3>
                <div className="flex-between" style={{ marginBottom: 10 }}>
                  <p style={{ color: 'var(--text2)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {getVendorName(group)}
                    {getCategory(group) && <span className="badge badge-blue" style={{ fontSize: 10 }}>{getCategory(group)}</span>}
                  </p>
                  {productPrice && <div><span style={{ textDecoration: 'line-through', color: 'var(--text2)', fontSize: 12 }}>₹{productPrice}</span><span style={{ color: 'var(--green)', fontWeight: 800, marginLeft: 6, fontSize: 16 }}>₹{discountedPrice}</span></div>}
                </div>
                <div style={{ marginBottom: 14 }}>
                  <div className="flex-between" style={{ marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: 'var(--text2)' }}>{group.participants?.length || 0} / {group.minUsers} joined</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: pct >= 100 ? 'var(--green)' : 'var(--accent)' }}>{Math.round(pct)}%</span>
                  </div>
                  <div style={{ height: 10, background: 'var(--bg3)', borderRadius: 6, overflow: 'hidden', border: '1px solid var(--border)' }}>
                    <div style={{ height: '100%', borderRadius: 6, width: `${pct}%`, background: pct >= 100 ? 'linear-gradient(90deg,var(--green),var(--green2))' : 'linear-gradient(90deg,var(--accent),var(--accent2))', transition: 'width .6s ease' }} />
                  </div>
                  {remaining > 0 && !isUnlocked && <p style={{ fontSize: 12, color: 'var(--accent2)', marginTop: 6 }}>{remaining} more {remaining === 1 ? 'person' : 'people'} needed!</p>}
                </div>
                {isUnlocked ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(0,230,118,.08)', border: '1px solid rgba(0,230,118,.2)', textAlign: 'center' }}>
                      <p style={{ color: 'var(--green)', fontWeight: 700, fontSize: 15 }}>🎉 Discount Unlocked!</p>
                      <p style={{ color: 'var(--text2)', fontSize: 12, marginTop: 2 }}>{group.participants?.length} people get {group.discountPercent}% off · You pay <strong style={{ color: 'var(--green)' }}>₹{discountedPrice}</strong></p>
                    </div>
                    <button className="btn btn-primary w-full" style={{ height: 44, fontSize: 14, background: 'linear-gradient(135deg,var(--green),#00c853)' }} onClick={() => handleAddGroupToCart(group)}>🛒 Add to Cart at ₹{discountedPrice}</button>
                    <button className="btn btn-secondary w-full" style={{ height: 38, fontSize: 13 }} onClick={() => navigate('/cart')}>Go to Cart →</button>
                  </div>
                ) : joined_ ? (
                  <div style={{ padding: 12, borderRadius: 10, background: 'rgba(79,195,247,.08)', border: '1px solid rgba(79,195,247,.2)', textAlign: 'center' }}>
                    <p style={{ color: 'var(--blue)', fontWeight: 600 }}>✅ You joined! Waiting for {remaining} more...</p>
                  </div>
                ) : (
                  <button className="btn btn-primary w-full" style={{ height: 46, fontSize: 15 }} onClick={() => handleJoin(group._id)}>Join Group Buy — Save {group.discountPercent}%</button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}