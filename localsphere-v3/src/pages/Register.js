import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { register } from '../services/api';
import { useAuth } from '../context/AppContext';
import toast from 'react-hot-toast';

export default function Register() {
  const [sp] = useSearchParams();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: sp.get('role') || 'buyer' });
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== confirm) return toast.error('Passwords do not match');
    if (form.password.length < 6) return toast.error('Min 6 characters');
    setLoading(true);
    try {
      const { data } = await register(form);
      loginUser(data.user, data.token);
      toast.success(`Welcome, ${data.user.name}! 🎉`);
      navigate(data.user.role === 'vendor' ? '/vendor/dashboard' : '/products');
    } catch (err) { toast.error(err.response?.data?.msg || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      <div className="hide-mobile" style={{ width: '42%', position: 'relative', overflow: 'hidden' }}>
        <img src={form.role === 'vendor' ? 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80' : 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=800&q=80'} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.2, transition: 'all .5s' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 40% 50%,rgba(255,92,26,.2) 0%,transparent 60%)', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: 48 }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>{form.role === 'vendor' ? '🏪' : '🛒'}</div>
          <h2 style={{ fontFamily: 'Syne', fontSize: 26, fontWeight: 800, marginBottom: 20 }}>{form.role === 'vendor' ? 'Sell to your community' : 'Shop from local vendors'}</h2>
          {(form.role === 'buyer' ? ['Browse local products', 'Negotiate prices', 'Join group buys', 'Track expenses'] : ['List unlimited products', 'Set your own prices', 'WhatsApp orders', 'Build trust score']).map(p => (
            <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(0,230,118,.2)', border: '1px solid var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: 'var(--green)', flexShrink: 0 }}>✓</div>
              <span style={{ color: 'var(--text2)', fontSize: 14 }}>{p}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <div className="fade-in" style={{ width: '100%', maxWidth: 420 }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,var(--accent),var(--accent2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne', fontWeight: 800, color: '#fff' }}>L</div>
            <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 19 }}>Local<span style={{ color: 'var(--accent)' }}>Sphere</span></span>
          </Link>
          <h1 style={{ fontFamily: 'Syne', fontSize: 30, fontWeight: 800, marginBottom: 6 }}>Create account</h1>
          <p style={{ color: 'var(--text2)', marginBottom: 20 }}>Join the local commerce revolution</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20, padding: 4, background: 'var(--bg3)', borderRadius: 12 }}>
            {['buyer', 'vendor'].map(r => (
              <button key={r} type="button" onClick={() => setForm({ ...form, role: r })} style={{ padding: '10px', borderRadius: 9, border: 'none', background: form.role === r ? 'linear-gradient(135deg,var(--accent),var(--accent2))' : 'transparent', color: form.role === r ? '#fff' : 'var(--text2)', fontWeight: 600, fontSize: 14, transition: 'all .2s', cursor: 'pointer' }}>
                {r === 'buyer' ? '🛒 Buyer' : '🏪 Vendor'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {[['name', 'Full Name', 'text', 'Your name'], ['email', 'Email', 'email', 'you@example.com'], ['password', 'Password', 'password', 'Min 6 characters']].map(([k, l, t, p]) => (
              <div key={k} style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: 'var(--text2)' }}>{l}</label>
                <input type={t} placeholder={p} value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} required />
              </div>
            ))}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: 'var(--text2)' }}>Confirm Password</label>
              <input type="password" placeholder="Repeat password" value={confirm} onChange={e => setConfirm(e.target.value)} required />
            </div>
            <div style={{ padding: 12, borderRadius: 10, background: 'rgba(79,195,247,.06)', border: '1px solid rgba(79,195,247,.15)', marginBottom: 20 }}>
              <p style={{ fontSize: 12, color: 'var(--text2)' }}>🔒 <strong style={{ color: 'var(--blue)' }}>{form.role === 'vendor' ? 'Vendor' : 'Buyer'} account</strong> — Access limited to {form.role === 'vendor' ? 'dashboard & product management' : 'shopping & orders'}.</p>
            </div>
            <button type="submit" className="btn btn-primary w-full" style={{ height: 50 }} disabled={loading}>
              {loading ? <div className="spinner" /> : `Create ${form.role === 'vendor' ? 'Vendor' : 'Buyer'} Account →`}
            </button>
          </form>
          <p style={{ textAlign: 'center', marginTop: 20, color: 'var(--text2)', fontSize: 13 }}>Have account? <Link to="/login" style={{ color: 'var(--accent)' }}>Sign in</Link></p>
        </div>
      </div>
    </div>
  );
}
