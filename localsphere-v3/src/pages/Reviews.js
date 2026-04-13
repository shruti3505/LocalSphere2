import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AppContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const API = axios.create({ baseURL: 'http://localhost:5000/api' });
API.interceptors.request.use(req => {
  const token = localStorage.getItem('token');
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

function StarRating({ value, onChange, readOnly }) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map(star => (
        <span key={star} onClick={() => !readOnly && onChange(star)}
          style={{ fontSize: 28, cursor: readOnly ? 'default' : 'pointer', color: star <= value ? 'var(--accent3)' : 'var(--border2)', transition: 'all .15s' }}>★</span>
      ))}
    </div>
  );
}

export default function Reviews() {
  const { user } = useAuth();
  const [vendors, setVendors] = useState([]);
  const [selected, setSelected] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [form, setForm] = useState({ rating: 5, comment: '' });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const res = await API.get('/vendors/nearby?lat=19.0760&lng=72.8777&radius=999999999');
        if (res.data.length > 0) {
          setVendors(res.data);
        } else {
          const prod = await API.get('/products');
          const vendorMap = {};
          prod.data.forEach(p => {
            if (p.vendor && p.vendor._id) vendorMap[p.vendor._id] = p.vendor;
          });
          setVendors(Object.values(vendorMap).map(v => ({
            _id: v._id,
            shopName: v.shopName,
            category: v.category
          })));
        }
      } catch { setVendors([]); }
    };
    fetchVendors();
  }, []);
  const fetchReviews = async (vendorId) => {
    setLoading(true);
    try {
      const { data } = await API.get(`/reviews/${vendorId}`);
      setReviews(data);
    } catch { setReviews([]); }
    finally { setLoading(false); }
  };

  const selectVendor = (vendor) => {
    setSelected(vendor);
    fetchReviews(vendor._id);
    setForm({ rating: 5, comment: '' });
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!user) return toast.error('Login to submit review');
    if (user.role === 'vendor') return toast.error('Vendors cannot review shops');
    if (!form.comment.trim()) return toast.error('Please write a comment');
    setSubmitting(true);
    try {
      await API.post('/reviews', { vendor: selected._id, rating: form.rating, comment: form.comment });
      toast.success('Review submitted! ⭐');
      setForm({ rating: 5, comment: '' });
      fetchReviews(selected._id);
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to submit');
    } finally { setSubmitting(false); }
  };

  const avgRating = reviews.length ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1) : null;

  return (
    <div className="page">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'Syne', fontSize: 30, fontWeight: 800 }}>⭐ Vendor Reviews</h1>
        <p style={{ color: 'var(--text2)', marginTop: 6 }}>Rate and review local vendors</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 24, alignItems: 'start' }}>
        {/* Vendor list */}
        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ fontFamily: 'Syne', fontSize: 16, fontWeight: 700, marginBottom: 14 }}>Select Vendor</h3>
          {vendors.length === 0 ? (
            <p style={{ color: 'var(--text2)', fontSize: 13 }}>No vendors found. Add vendors first.</p>
          ) : (
            vendors.map(v => (
              <div key={v._id} onClick={() => selectVendor(v)}
                style={{ padding: '12px', borderRadius: 10, cursor: 'pointer', marginBottom: 8, border: `1.5px solid ${selected?._id === v._id ? 'var(--accent)' : 'var(--border)'}`, background: selected?._id === v._id ? 'rgba(255,92,26,.08)' : 'var(--bg3)', transition: 'all .2s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 14, fontFamily: 'Syne' }}>{v.shopName}</p>
                    <p style={{ color: 'var(--text2)', fontSize: 12, marginTop: 2 }}>{v.category}</p>
                  </div>
                  {v.trustScore > 0 && (
                    <span className="badge badge-orange" style={{ fontSize: 11 }}>⭐ {v.trustScore}</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Review panel */}
        <div>
          {!selected ? (
            <div className="flex-center" style={{ padding: 80, flexDirection: 'column', gap: 14 }}>
              <div style={{ fontSize: 56 }}>⭐</div>
              <h3 style={{ fontFamily: 'Syne', fontSize: 20 }}>Select a vendor to review</h3>
              <p style={{ color: 'var(--text2)', fontSize: 14 }}>Choose from the list on the left</p>
            </div>
          ) : (
            <>
              {/* Vendor header */}
              <div className="card" style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h2 style={{ fontFamily: 'Syne', fontSize: 22, fontWeight: 800 }}>{selected.shopName}</h2>
                    <p style={{ color: 'var(--text2)', fontSize: 13, marginTop: 4 }}>{selected.category} · {selected.location?.address || 'Local Vendor'}</p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: 'Syne', fontSize: 36, fontWeight: 800, color: 'var(--accent3)' }}>{avgRating || '—'}</div>
                    <div style={{ color: 'var(--text2)', fontSize: 12 }}>{reviews.length} reviews</div>
                  </div>
                </div>
              </div>

              {/* Write review form */}
              {user?.role === 'buyer' && (
                <div className="card" style={{ marginBottom: 20 }}>
                  <h3 style={{ fontFamily: 'Syne', fontSize: 18, fontWeight: 700, marginBottom: 16 }}>✍️ Write a Review</h3>
                  <form onSubmit={submitReview}>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: 'var(--text2)' }}>Your Rating</label>
                      <StarRating value={form.rating} onChange={r => setForm({ ...form, rating: r })} />
                    </div>
                    <div style={{ marginBottom: 16 }}>
                      <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: 'var(--text2)' }}>Your Comment</label>
                      <textarea placeholder="Share your experience with this vendor..." value={form.comment}
                        onChange={e => setForm({ ...form, comment: e.target.value })}
                        style={{ minHeight: 100, resize: 'vertical' }} required />
                    </div>
                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                      {submitting ? <div className="spinner" /> : '⭐ Submit Review'}
                    </button>
                  </form>
                </div>
              )}

              {!user && (
                <div style={{ padding: 16, borderRadius: 12, background: 'rgba(79,195,247,.08)', border: '1px solid rgba(79,195,247,.2)', marginBottom: 20 }}>
                  <p style={{ fontSize: 14, color: 'var(--blue)' }}>🔒 <a href="/login" style={{ color: 'var(--accent)' }}>Login as buyer</a> to write a review</p>
                </div>
              )}

              {/* Reviews list */}
              <div>
                <h3 style={{ fontFamily: 'Syne', fontSize: 18, fontWeight: 700, marginBottom: 14 }}>
                  All Reviews {reviews.length > 0 && <span style={{ color: 'var(--text2)', fontSize: 14, fontWeight: 400 }}>({reviews.length})</span>}
                </h3>
                {loading ? (
                  <div className="flex-center" style={{ padding: 40 }}><div className="spinner" /></div>
                ) : reviews.length === 0 ? (
                  <div className="card" style={{ textAlign: 'center', padding: 40 }}>
                    <div style={{ fontSize: 40, marginBottom: 10 }}>💬</div>
                    <p style={{ color: 'var(--text2)' }}>No reviews yet. Be the first!</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {reviews.map(review => (
                      <div key={review._id} className="card fade-in">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,var(--accent),var(--accent2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff', fontSize: 14 }}>
                              {review.buyer?.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div>
                              <p style={{ fontWeight: 700, fontSize: 14 }}>{review.buyer?.name || 'User'}</p>
                              <p style={{ color: 'var(--text2)', fontSize: 11 }}>{new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                            </div>
                          </div>
                          <StarRating value={review.rating} readOnly />
                        </div>
                        <p style={{ color: 'var(--text)', fontSize: 14, lineHeight: 1.6 }}>{review.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}