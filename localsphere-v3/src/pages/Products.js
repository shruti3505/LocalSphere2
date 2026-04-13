import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getProducts, negotiate } from '../services/api';
import { DEFAULT_PRODUCTS, CATEGORY_IMAGES } from '../data/defaults';
import { useAuth, useCart } from '../context/AppContext';
import toast from 'react-hot-toast';

const CATEGORIES = ['Food', 'Vegetables', 'Fruits', 'Electronics', 'Clothing', 'Handicrafts', 'Dairy', 'Other'];

const getImg = (p) => {
  if (p?.images?.[0]) return p.images[0];
  return CATEGORY_IMAGES[p?.category] || CATEGORY_IMAGES['Other'];
};

function ProductCard({ product, onNegotiate, onWhatsApp, onCart, userRole }) {
  const [imgSrc, setImgSrc] = useState(getImg(product));

  return (
    <div className="card card-glow fade-in" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Image */}
      <div style={{ position: 'relative', height: 185, overflow: 'hidden', flexShrink: 0 }}>
        <img src={imgSrc} alt={product.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform .4s' }}
          onMouseEnter={e => e.target.style.transform = 'scale(1.06)'}
          onMouseLeave={e => e.target.style.transform = 'scale(1)'}
          onError={() => setImgSrc(CATEGORY_IMAGES[product.category] || CATEGORY_IMAGES['Other'])}
        />
        <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {product.negotiable && <span className="badge badge-green" style={{ fontSize: 10, backdropFilter: 'blur(8px)' }}>💬 Negotiable</span>}
          {product.sustainabilityScore > 6 && <span className="badge badge-green" style={{ fontSize: 10, backdropFilter: 'blur(8px)' }}>🌱 Eco</span>}
          {product.isDefault && <span className="badge badge-blue" style={{ fontSize: 10, backdropFilter: 'blur(8px)' }}>⭐ Featured</span>}
        </div>
        {product.stock > 0 && product.stock < 10 && (
          <span className="badge badge-orange" style={{ position: 'absolute', top: 10, right: 10, fontSize: 10, backdropFilter: 'blur(8px)' }}>⚡ Low Stock</span>
        )}
        {product.stock === 0 && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.65)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="badge badge-red" style={{ fontSize: 13 }}>Out of Stock</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: '14px 16px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
          <h3 style={{ fontFamily: 'Syne', fontSize: 15, fontWeight: 700, flex: 1, marginRight: 8 }}>{product.name}</h3>
          <span className="badge badge-blue" style={{ fontSize: 10, flexShrink: 0 }}>{product.category}</span>
        </div>
        {product.description && <p style={{ color: 'var(--text2)', fontSize: 12, lineHeight: 1.5, marginBottom: 8, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{product.description}</p>}
        {product.vendor?.shopName && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'linear-gradient(135deg,var(--accent),var(--accent2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{product.vendor.shopName.charAt(0)}</div>
            <span style={{ fontSize: 12, color: 'var(--text2)' }}>{product.vendor.shopName}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span className="price-tag" style={{ fontSize: 20 }}>₹{product.price}</span>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {product.sustainabilityScore > 0 && <span style={{ fontSize: 11, color: 'var(--green)' }}>🌱{product.sustainabilityScore}</span>}
            <span style={{ fontSize: 11, color: 'var(--text2)' }}>Qty:{product.stock}</span>
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: `1fr${product.vendor?.whatsapp ? ' auto' : ''}${product.negotiable ? ' auto' : ''}`, gap: 7, marginTop: 'auto' }}>
          <button className="btn btn-primary" style={{ padding: '9px', fontSize: 13 }}
            onClick={() => onCart(product)} disabled={product.stock === 0}>
            {product.stock === 0 ? 'Out of Stock' : '🛒 Add to Cart'}
          </button>
          {product.vendor?.whatsapp && (
            <button className="btn btn-whatsapp" style={{ padding: '9px 11px' }} title="Order via WhatsApp" onClick={() => onWhatsApp(product)}>📱</button>
          )}
          {product.negotiable && (
            <button className="btn btn-secondary" style={{ padding: '9px 11px' }} title="Negotiate price" onClick={() => onNegotiate(product)}>💬</button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Products() {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [sp] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ search: '', category: sp.get('category') || '', minPrice: '', maxPrice: '', sort: '', vendor: '' });
  const [negotiating, setNegotiating] = useState(null);
  const [offerPrice, setOfferPrice] = useState('');
  const [negotiateResult, setNegotiateResult] = useState(null);
  const [negotiateLoading, setNegotiateLoading] = useState(false);

  useEffect(() => { fetchProducts(); }, [filters]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.search) params.search = filters.search;
      if (filters.category) params.category = filters.category;
      if (filters.minPrice) params.minPrice = filters.minPrice;
      if (filters.maxPrice) params.maxPrice = filters.maxPrice;
      if (filters.sort) params.sort = filters.sort;
      const { data } = await getProducts(params);
      // Merge with default products
      const ids = new Set(data.map(p => p._id));
      const defaults = DEFAULT_PRODUCTS.filter(p =>
        (!filters.category || p.category === filters.category) &&
        (!filters.search || p.name.toLowerCase().includes(filters.search.toLowerCase())) &&
        (!filters.minPrice || p.price >= parseFloat(filters.minPrice)) &&
        (!filters.maxPrice || p.price <= parseFloat(filters.maxPrice))
      );
      setProducts([...data, ...defaults]);
    } catch {
      setProducts(DEFAULT_PRODUCTS.filter(p =>
        (!filters.category || p.category === filters.category) &&
        (!filters.search || p.name.toLowerCase().includes(filters.search.toLowerCase()))
      ));
    } finally { setLoading(false); }
  };

  const handleCart = (product) => {
    if (!user) return toast.error('Login to add to cart');
    if (user.role === 'vendor') return toast.error('Vendors cannot shop. Use a buyer account.', { icon: '🚫' });
    addToCart(product);
  };

  const handleWhatsApp = (product) => {
    const wa = product.vendor?.whatsapp;
    if (!wa) return toast.error('WhatsApp not available');
    const msg = encodeURIComponent(`Hi! I want to order:\n\n🛒 *${product.name}*\n💰 Price: ₹${product.price}\n📦 Quantity: 1\n\nPlease confirm availability. Thank you!`);
    window.open(`https://wa.me/${wa}?text=${msg}`, '_blank');
  };

  const handleNegotiate = (product) => {
    if (!user) return toast.error('Login to negotiate');
    if (user.role === 'vendor') return toast.error('Vendors cannot negotiate as buyers');
    setNegotiating(product);
    setNegotiateResult(null);
    setOfferPrice('');
  };

  const submitNegotiate = async () => {
    if (!offerPrice) return toast.error('Enter your offer price');
    setNegotiateLoading(true);
    try {
      if (negotiating.isDefault) {
        const min = negotiating.price * (1 - negotiating.discountMax / 100);
        const offered = parseFloat(offerPrice);
        if (offered >= min && offered <= negotiating.price) {
          setNegotiateResult({ status: 'accepted', finalPrice: offered, msg: `Deal accepted at ₹${offered}! 🎉` });
        } else if (offered < min) {
          setNegotiateResult({ status: 'counter', finalPrice: Math.ceil(min), msg: `Best we can do: ₹${Math.ceil(min)}` });
        } else {
          setNegotiateResult({ status: 'rejected', msg: 'Offer too high. Buy at listed price.' });
        }
      } else {
        const { data } = await negotiate({ productId: negotiating._id, offeredPrice: parseFloat(offerPrice) });
        setNegotiateResult(data);
      }
    } catch { toast.error('Negotiation failed'); }
    finally { setNegotiateLoading(false); }
  };

  // Get unique vendors for filter
  const vendors = [...new Set(products.map(p => p.vendor?.shopName).filter(Boolean))];
  const displayed = filters.vendor ? products.filter(p => p.vendor?.shopName === filters.vendor) : products;

  return (
    <div className="page">
      <div className="flex-between" style={{ marginBottom: 20 }}>
        <div>
          <h1 style={{ fontFamily: 'Syne', fontSize: 30, fontWeight: 800 }}>Products</h1>
          <p style={{ color: 'var(--text2)', fontSize: 13, marginTop: 4 }}>{displayed.length} items available</p>
        </div>
        {user?.role === 'buyer' && <Link to="/cart" className="btn btn-secondary btn-sm">🛒 View Cart</Link>}
        {user?.role === 'vendor' && <div style={{ padding: '8px 14px', borderRadius: 10, background: 'rgba(79,195,247,.08)', border: '1px solid rgba(79,195,247,.2)', fontSize: 13, color: 'var(--blue)' }}>Browsing as Vendor — switch to buyer to shop</div>}
      </div>

      {/* Category chips */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
        <button className={`chip ${!filters.category ? 'active' : ''}`} onClick={() => setFilters({ ...filters, category: '' })}>All</button>
        {CATEGORIES.map(c => (
          <button key={c} className={`chip ${filters.category === c ? 'active' : ''}`} onClick={() => setFilters({ ...filters, category: filters.category === c ? '' : c })}>{c}</button>
        ))}
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20, padding: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: 10, alignItems: 'center' }}>
          <input placeholder="🔍 Search..." value={filters.search} onChange={e => setFilters({ ...filters, search: e.target.value })} />
          <input type="number" placeholder="Min ₹" value={filters.minPrice} onChange={e => setFilters({ ...filters, minPrice: e.target.value })} />
          <input type="number" placeholder="Max ₹" value={filters.maxPrice} onChange={e => setFilters({ ...filters, maxPrice: e.target.value })} />
          <select value={filters.sort} onChange={e => setFilters({ ...filters, sort: e.target.value })}>
            <option value="">Sort by</option>
            <option value="price_asc">Price ↑</option>
            <option value="price_desc">Price ↓</option>
            <option value="sustainability">🌱 Eco Score</option>
          </select>
          <select value={filters.vendor} onChange={e => setFilters({ ...filters, vendor: e.target.value })}>
            <option value="">All Vendors</option>
            {vendors.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
          <button className="btn btn-ghost btn-sm" onClick={() => setFilters({ search: '', category: '', minPrice: '', maxPrice: '', sort: '', vendor: '' })}>✕ Clear</button>
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 20 }}>
          {[...Array(6)].map((_, i) => <div key={i} className="card" style={{ padding: 0, overflow: 'hidden' }}><div className="skeleton" style={{ height: 185 }} /><div style={{ padding: 16 }}><div className="skeleton" style={{ height: 18, marginBottom: 10 }} /><div className="skeleton" style={{ height: 40 }} /></div></div>)}
        </div>
      ) : displayed.length === 0 ? (
        <div className="flex-center" style={{ padding: 80, flexDirection: 'column', gap: 16 }}>
          <img src="https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=300&q=80" alt="Empty" style={{ width: 180, borderRadius: 16, opacity: 0.4 }} />
          <h3 style={{ fontFamily: 'Syne' }}>No products found</h3>
          <button className="btn btn-secondary" onClick={() => setFilters({ search: '', category: '', minPrice: '', maxPrice: '', sort: '', vendor: '' })}>Clear filters</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 20 }}>
          {displayed.map((p, i) => (
            <ProductCard key={p._id} product={p} userRole={user?.role}
              onCart={handleCart} onWhatsApp={handleWhatsApp} onNegotiate={handleNegotiate} />
          ))}
        </div>
      )}

      {/* Negotiate Modal */}
      {negotiating && (
        <div className="modal-backdrop" onClick={() => setNegotiating(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', gap: 14, marginBottom: 20 }}>
              <img src={getImg(negotiating)} alt={negotiating.name} style={{ width: 68, height: 68, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} onError={e => e.target.src = CATEGORY_IMAGES['Other']} />
              <div>
                <h3 style={{ fontFamily: 'Syne', fontSize: 19, fontWeight: 700 }}>💬 Negotiate Price</h3>
                <p style={{ color: 'var(--text2)', fontSize: 13 }}>{negotiating.name}</p>
                <span className="price-tag" style={{ fontSize: 18 }}>₹{negotiating.price}</span>
              </div>
            </div>
            <div style={{ padding: 12, borderRadius: 10, background: 'var(--bg3)', marginBottom: 16 }}>
              <p style={{ fontSize: 13, color: 'var(--text2)' }}>
                Vendor allows <strong style={{ color: 'var(--accent)' }}>{negotiating.discountMin}–{negotiating.discountMax}%</strong> discount.
                Min: <strong style={{ color: 'var(--green)' }}>₹{Math.ceil(negotiating.price * (1 - negotiating.discountMax / 100))}</strong>
              </p>
            </div>

            {!negotiateResult ? (
              <>
                <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: 'var(--text2)' }}>Your offer price (₹)</label>
                <input type="number" placeholder={`Enter between ₹${Math.ceil(negotiating.price * (1 - negotiating.discountMax / 100))} – ₹${negotiating.price}`} value={offerPrice} onChange={e => setOfferPrice(e.target.value)} style={{ marginBottom: 16 }} />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10 }}>
                  <button className="btn btn-primary" onClick={submitNegotiate} disabled={negotiateLoading}>
                    {negotiateLoading ? <div className="spinner" /> : 'Send Offer 🤝'}
                  </button>
                  <button className="btn btn-ghost" onClick={() => setNegotiating(null)}>Cancel</button>
                </div>
              </>
            ) : (
              <div style={{ padding: 20, borderRadius: 12, textAlign: 'center', background: negotiateResult.status === 'accepted' ? 'rgba(0,230,118,.08)' : negotiateResult.status === 'counter' ? 'rgba(255,179,71,.08)' : 'rgba(255,82,82,.08)', border: `1.5px solid ${negotiateResult.status === 'accepted' ? 'rgba(0,230,118,.3)' : negotiateResult.status === 'counter' ? 'rgba(255,179,71,.3)' : 'rgba(255,82,82,.3)'}` }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>{negotiateResult.status === 'accepted' ? '🎉' : negotiateResult.status === 'counter' ? '🔄' : '❌'}</div>
                <p style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{negotiateResult.msg}</p>
                {negotiateResult.finalPrice && <p style={{ color: 'var(--text2)', fontSize: 13 }}>Final: <span className="price-tag" style={{ fontSize: 20 }}>₹{negotiateResult.finalPrice}</span></p>}
                <div style={{ display: 'flex', gap: 10, marginTop: 14, justifyContent: 'center' }}>
                  {negotiateResult.status !== 'rejected' && (
                    <button className="btn btn-primary" onClick={() => { addToCart({ ...negotiating, price: negotiateResult.finalPrice }); setNegotiating(null); }}>🛒 Add at this price</button>
                  )}
                  <button className="btn btn-ghost" onClick={() => setNegotiating(null)}>Close</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
