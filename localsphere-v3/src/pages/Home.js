import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AppContext';

export default function Home() {
  const { user } = useAuth();
  const features = [
    { i: '📍', t: 'Hyperlocal Stock Pulse', d: 'Real-time distance & travel time to nearby vendors', b: '⭐ UNIQUE', c: 'var(--accent)' },
    { i: '🤝', t: 'Group Buying', d: '5+ locals unlock group discount within 24 hours', b: 'SOCIAL', c: 'var(--green)' },
    { i: '💬', t: 'Negotiate Now', d: 'Chatbot bargains within vendor-set discount range', b: '⭐ UNIQUE', c: 'var(--accent)' },
    { i: '📱', t: 'WhatsApp Orders', d: 'One-click ordering with auto-generated messages', b: 'DIRECT', c: 'var(--green2)' },
    { i: '💰', t: 'Budget Assistant', d: 'Set limits, get alerts, find cheaper alternatives', b: 'SMART', c: 'var(--blue)' },
    { i: '⭐', t: 'Vendor Trust Score', d: 'Transparent rating from reviews & delivery data', b: 'VERIFIED', c: 'var(--accent3)' },
    { i: '🌱', t: 'Sustainability Score', d: 'Eco-ratings with greener product suggestions', b: 'ECO', c: 'var(--green)' },
    { i: '📊', t: 'Expense Tracker', d: 'Category-wise spending insights and reports', b: 'INSIGHTS', c: 'var(--purple)' },
  ];
  const cats = [
    { n: 'Vegetables', img: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300&q=80', c: '240+ products' },
    { n: 'Fruits', img: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=300&q=80', c: '180+ products' },
    { n: 'Dairy', img: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300&q=80', c: '90+ products' },
    { n: 'Food', img: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&q=80', c: '320+ products' },
    { n: 'Handicrafts', img: 'https://images.unsplash.com/photo-1606722590583-6951b5ea92ad?w=300&q=80', c: '150+ products' },
    { n: 'Clothing', img: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=300&q=80', c: '200+ products' },
  ];

  return (
    <div>
      {/* Hero */}
      <div style={{ position: 'relative', minHeight: '90vh', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0 }}>
          <img src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1600&q=80" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.07 }} />
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 25% 50%,rgba(255,92,26,.14) 0%,transparent 55%)' }} />
        </div>
        <div className="page fade-in" style={{ position: 'relative', zIndex: 1, paddingTop: 60, paddingBottom: 60 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
            <div>
              <div className="badge badge-orange" style={{ marginBottom: 18 }}>🚀 Smart Hyperlocal Marketplace</div>
              <h1 style={{ fontFamily: 'Syne', fontSize: 'clamp(40px,5vw,70px)', fontWeight: 800, lineHeight: 1.08, marginBottom: 22 }}>
                Shop Local,<br /><span style={{ color: 'var(--accent)' }}>Smarter</span><br />
                <span style={{ background: 'linear-gradient(135deg,var(--accent),var(--accent3))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>& Faster.</span>
              </h1>
              <p style={{ fontSize: 16, color: 'var(--text2)', lineHeight: 1.75, marginBottom: 32, maxWidth: 460 }}>Connect with vendors in your neighborhood. Negotiate prices, join group deals, support local businesses.</p>
              <div style={{ display: 'flex', gap: 12 }}>
                {user ? <Link to={user.role === 'vendor' ? '/vendor/dashboard' : '/products'} className="btn btn-primary" style={{ fontSize: 15, padding: '13px 28px' }}>{user.role === 'vendor' ? '📊 Dashboard →' : '🛒 Browse Products →'}</Link>
                  : <><Link to="/register?role=buyer" className="btn btn-primary" style={{ fontSize: 15, padding: '13px 28px' }}>Shop Now →</Link><Link to="/register?role=vendor" className="btn btn-secondary" style={{ fontSize: 15, padding: '13px 28px' }}>Sell with Us</Link></>}
              </div>
              <div style={{ display: 'flex', gap: 24, marginTop: 36, paddingTop: 28, borderTop: '1px solid var(--border)' }}>
                {[['500+', 'Vendors'], ['10K+', 'Products'], ['25K+', 'Buyers']].map(([v, l]) => (
                  <div key={l}><div style={{ fontFamily: 'Syne', fontSize: 22, fontWeight: 800, color: 'var(--accent)' }}>{v}</div><div style={{ color: 'var(--text2)', fontSize: 12 }}>{l}</div></div>
                ))}
              </div>
            </div>
            <div className="hide-mobile" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { img: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=80', l: 'Fresh Produce' },
                { img: 'https://images.unsplash.com/photo-1481349518771-20055b2a7b24?w=400&q=80', l: 'Local Bakery' },
                { img: 'https://images.unsplash.com/photo-1606722590583-6951b5ea92ad?w=400&q=80', l: 'Handicrafts' },
                { img: 'https://images.unsplash.com/photo-1550989460-0adf9ea622e2?w=400&q=80', l: 'Dairy & More' },
              ].map(({ img, l }, i) => (
                <div key={i} style={{ borderRadius: 14, overflow: 'hidden', position: 'relative', aspectRatio: '1/1', border: '1.5px solid var(--border)', animation: `float ${2.5 + i * 0.4}s ease-in-out infinite`, animationDelay: `${i * 0.25}s` }}>
                  <img src={img} alt={l} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 10px 10px', background: 'linear-gradient(transparent,rgba(0,0,0,.8))', color: '#fff', fontSize: 12, fontWeight: 600 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div style={{ padding: '56px 0', background: 'var(--bg2)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="page">
          <div className="flex-between" style={{ marginBottom: 24 }}>
            <h2 style={{ fontFamily: 'Syne', fontSize: 26, fontWeight: 800 }}>Browse Categories</h2>
            <Link to="/products" style={{ color: 'var(--accent)', fontSize: 14, fontWeight: 600 }}>View all →</Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12 }}>
            {cats.map(({ n, img, c }) => (
              <Link to={`/products?category=${n}`} key={n} style={{ borderRadius: 14, overflow: 'hidden', position: 'relative', aspectRatio: '3/4', border: '1.5px solid var(--border)', display: 'block', transition: 'all .3s' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = 'var(--accent)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.borderColor = 'var(--border)'; }}>
                <img src={img} alt={n} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '24px 12px 12px', background: 'linear-gradient(transparent,rgba(0,0,0,.85))' }}>
                  <div style={{ color: '#fff', fontFamily: 'Syne', fontWeight: 700, fontSize: 14 }}>{n}</div>
                  <div style={{ color: 'rgba(255,255,255,.6)', fontSize: 11, marginTop: 2 }}>{c}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Features */}
      <div style={{ padding: '72px 0' }}>
        <div className="page">
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div className="badge badge-orange" style={{ marginBottom: 12 }}>Why LocalSphere</div>
            <h2 style={{ fontFamily: 'Syne', fontSize: 38, fontWeight: 800 }}>Smart Features</h2>
            <p style={{ color: 'var(--text2)', marginTop: 10, fontSize: 15 }}>Built for real-world local commerce</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(250px,1fr))', gap: 14 }}>
            {features.map(({ i, t, d, b, c }) => (
              <div key={t} className="card card-glow">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ fontSize: 34 }}>{i}</div>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20, background: `${c}18`, color: c, border: `1px solid ${c}30`, letterSpacing: '.05em' }}>{b}</span>
                </div>
                <h3 style={{ fontFamily: 'Syne', fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{t}</h3>
                <p style={{ color: 'var(--text2)', fontSize: 13, lineHeight: 1.6 }}>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {!user && (
        <div style={{ padding: '56px 0', borderTop: '1px solid var(--border)' }}>
          <div className="page" style={{ textAlign: 'center' }}>
            <h2 style={{ fontFamily: 'Syne', fontSize: 36, fontWeight: 800, marginBottom: 10 }}>Ready to go local?</h2>
            <p style={{ color: 'var(--text2)', fontSize: 16, marginBottom: 32 }}>Join buyers and vendors already on LocalSphere</p>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
              <Link to="/register?role=buyer" className="btn btn-primary" style={{ fontSize: 15, padding: '13px 32px' }}>🛒 Start Shopping</Link>
              <Link to="/register?role=vendor" className="btn btn-secondary" style={{ fontSize: 15, padding: '13px 32px' }}>🏪 Start Selling</Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
