import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, CartProvider, useAuth } from './context/AppContext';
import Navbar from './components/common/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Products from './pages/Products';
import Cart from './pages/Cart';
import Reviews from './pages/Reviews';
import VendorDashboard from './pages/VendorDashboard';
import { Orders, Vendors, GroupBuy } from './pages/OtherPages';

const Loader = () => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
    <div style={{ width: 48, height: 48, border: '3px solid var(--border2)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
  </div>
);

const Block = ({ msg, link, linkLabel }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '70vh', gap: 16, padding: 24 }}>
    <div style={{ fontSize: 56 }}>🚫</div>
    <h2 style={{ fontFamily: 'Syne', fontSize: 24, textAlign: 'center' }}>{msg}</h2>
    <a href={link} style={{ padding: '12px 24px', background: 'linear-gradient(135deg,var(--accent),var(--accent2))', color: '#fff', borderRadius: 10, fontWeight: 600 }}>{linkLabel}</a>
  </div>
);

const BuyerRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Loader />;
  if (!user) return <Navigate to="/login" />;
  if (user.role === 'vendor') return <Block msg="This page is for buyers only." link="/vendor/dashboard" linkLabel="Go to Dashboard" />;
  return children;
};

const VendorRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Loader />;
  if (!user) return <Navigate to="/login" />;
  if (user.role !== 'vendor') return <Block msg="This page is for vendors only." link="/products" linkLabel="Browse Products" />;
  return children;
};

function AppContent() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/products" element={<Products />} />
        <Route path="/vendors" element={<Vendors />} />
        <Route path="/groupbuy" element={<GroupBuy />} />
        <Route path="/reviews" element={<Reviews />} />
        <Route path="/cart" element={<BuyerRoute><Cart /></BuyerRoute>} />
        <Route path="/orders" element={<BuyerRoute><Orders /></BuyerRoute>} />
        <Route path="/vendor/dashboard" element={<VendorRoute><VendorDashboard /></VendorRoute>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <Toaster position="top-right" toastOptions={{ style: { background: 'var(--card)', color: 'var(--text)', border: '1.5px solid var(--border2)', borderRadius: 12, fontSize: 14, boxShadow: 'var(--shadow)' }, success: { iconTheme: { primary: '#00e676', secondary: '#111120' } }, error: { iconTheme: { primary: '#ff5252', secondary: '#111120' } } }} />
          <AppContent />
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}