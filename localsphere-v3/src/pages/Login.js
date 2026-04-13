import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../services/api';
import { useAuth } from '../context/AppContext';
import toast from 'react-hot-toast';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await login(form);
      loginUser(data.user, data.token);
      toast.success(`Welcome back, ${data.user.name}! 👋`);
      navigate(data.user.role === 'vendor' ? '/vendor/dashboard' : '/products');
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Invalid credentials');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      <div className="hide-mobile" style={{ width: '45%', position: 'relative', overflow: 'hidden' }}>
        <img src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80" alt="Market" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.25 }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 40% 60%,rgba(255,92,26,.2) 0%,rgba(8,8,16,.8) 70%)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 48 }}>
          <h2 style={{ fontFamily: 'Syne', fontSize: 34, fontWeight: 800, marginBottom: 12 }}>Your local market,<br /><span style={{ color: 'var(--accent)' }}>reimagined.</span></h2>
          <p style={{ color: 'var(--text2)', fontSize: 15, lineHeight: 1.7, marginBottom: 24 }}>Connect with thousands of local vendors. Negotiate prices, join group deals.</p>
          <div style={{ display: 'flex', gap: 10 }}>
            {['500+ Vendors', '10K+ Products', '25K+ Buyers'].map(s => (
              <span key={s} style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(255,92,26,.1)', border: '1px solid rgba(255,92,26,.2)', fontSize: 12, color: 'var(--accent2)' }}>{s}</span>
            ))}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <div className="fade-in" style={{ width: '100%', maxWidth: 400 }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 40 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg,var(--accent),var(--accent2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne', fontWeight: 800, color: '#fff' }}>L</div>
            <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 20 }}>Local<span style={{ color: 'var(--accent)' }}>Sphere</span></span>
          </Link>
          <h1 style={{ fontFamily: 'Syne', fontSize: 32, fontWeight: 800, marginBottom: 8 }}>Sign in</h1>
          <p style={{ color: 'var(--text2)', marginBottom: 32 }}>Welcome back to LocalSphere</p>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: 'var(--text2)' }}>Email</label>
              <input type="email" placeholder="you@example.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required autoFocus />
            </div>
            <div style={{ marginBottom: 28 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: 'var(--text2)' }}>Password</label>
              <input type="password" placeholder="••••••••" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
            </div>
            <button type="submit" className="btn btn-primary w-full" style={{ height: 50 }} disabled={loading}>
              {loading ? <div className="spinner" /> : 'Sign In →'}
            </button>
          </form>
          <div style={{ margin: '24px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} /><span style={{ color: 'var(--text3)', fontSize: 12 }}>OR</span><div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Link to="/register?role=buyer" className="btn btn-secondary" style={{ justifyContent: 'center' }}>🛒 Buyer signup</Link>
            <Link to="/register?role=vendor" className="btn btn-secondary" style={{ justifyContent: 'center' }}>🏪 Vendor signup</Link>
          </div>
          <p style={{ textAlign: 'center', marginTop: 20, color: 'var(--text2)', fontSize: 13 }}>No account? <Link to="/register" style={{ color: 'var(--accent)' }}>Create one free</Link></p>
        </div>
      </div>
    </div>
  );
}
