import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth, useCart } from '../../context/AppContext';
import toast from 'react-hot-toast';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const loc = useLocation();
  const [open, setOpen] = useState(false);

  const handleLogout = () => { logout(); toast.success('Logged out'); navigate('/'); setOpen(false); };
  const active = (p) => loc.pathname.startsWith(p);

  return (
    <>
      <nav style={{ background: 'rgba(8,8,16,0.95)', borderBottom: '1px solid var(--border)', backdropFilter: 'blur(24px)', position: 'sticky', top: 0, zIndex: 200 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', height: 68, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg,var(--accent),var(--accent2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne', fontWeight: 800, fontSize: 18, color: '#fff', boxShadow: 'var(--shadow-accent)' }}>L</div>
            <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 20 }}>Local<span style={{ color: 'var(--accent)' }}>Sphere</span></span>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {user?.role !== 'vendor' && [
            ['/products', 'Products'], ['/vendors', 'Vendors'], ['/groupbuy', 'Group Buy'], ['/reviews', '⭐ Reviews']
            ].map(([p, l]) => (
              <Link key={p} to={p} style={{ padding: '7px 14px', borderRadius: 8, fontSize: 14, fontWeight: 500, color: active(p) ? 'var(--accent)' : 'var(--text2)', background: active(p) ? 'rgba(255,92,26,.1)' : 'transparent', border: active(p) ? '1px solid rgba(255,92,26,.2)' : '1px solid transparent', transition: 'all .2s' }}>{l}</Link>
            ))}
            {user?.role === 'vendor' && [
              ['/vendor/dashboard', '📊 Dashboard'], ['/vendor/orders', '📦 Orders']
            ].map(([p, l]) => (
              <Link key={p} to={p} style={{ padding: '7px 14px', borderRadius: 8, fontSize: 14, fontWeight: 500, color: active(p) ? 'var(--accent)' : 'var(--text2)', background: active(p) ? 'rgba(255,92,26,.1)' : 'transparent', border: active(p) ? '1px solid rgba(255,92,26,.2)' : '1px solid transparent', transition: 'all .2s' }}>{l}</Link>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {user ? (
              <>
                <span className={`badge ${user.role === 'vendor' ? 'badge-orange' : 'badge-blue'}`} style={{ fontSize: 11 }}>
                  {user.role === 'vendor' ? '🏪 Vendor' : '🛒 Buyer'}
                </span>
                {user.role === 'buyer' && (
                  <Link to="/cart">
                    <button className="btn btn-ghost btn-sm" style={{ gap: 6 }}>
                      🛒
                      {count > 0 && <span style={{ background: 'var(--accent)', color: '#fff', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>{count}</span>}
                    </button>
                  </Link>
                )}
                {user.role === 'buyer' && <Link to="/orders" className="btn btn-ghost btn-sm">Orders</Link>}
                <div style={{ position: 'relative' }}>
                  <button onClick={() => setOpen(!open)} style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,var(--accent),var(--accent2))', border: 'none', fontWeight: 800, fontSize: 14, color: '#fff', cursor: 'pointer' }}>
                    {user.name?.charAt(0).toUpperCase()}
                  </button>
                  {open && (
                    <div style={{ position: 'absolute', top: 44, right: 0, background: 'var(--card)', border: '1.5px solid var(--border2)', borderRadius: 14, padding: 8, minWidth: 180, boxShadow: 'var(--shadow)', zIndex: 50 }}>
                      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{user.name}</div>
                        <div style={{ color: 'var(--text2)', fontSize: 12 }}>{user.email}</div>
                      </div>
                      <button onClick={handleLogout} style={{ width: '100%', padding: '9px 14px', background: 'none', border: 'none', color: 'var(--red)', fontSize: 13, textAlign: 'left', borderRadius: 8, cursor: 'pointer' }}>🚪 Logout</button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost btn-sm">Login</Link>
                <Link to="/register" className="btn btn-primary btn-sm">Register</Link>
              </>
            )}
          </div>
        </div>
      </nav>
      {open && <div style={{ position: 'fixed', inset: 0, zIndex: 199 }} onClick={() => setOpen(false)} />}
    </>
  );
}
