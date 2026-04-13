import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart, useAuth } from '../context/AppContext';
import { placeOrder } from '../services/api';
import { CATEGORY_IMAGES } from '../data/defaults';
import { UPIPaymentModal, WhatsAppPaymentModal } from './UPIPaymentModal'; // ✅ ADDED
import toast from 'react-hot-toast';

const isDefaultProduct = (id) => String(id).startsWith('default');

export default function Cart() {
  const { cart, removeFromCart, updateQty, clearCart, total } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [payment, setPayment]         = useState('cod');
  const [placing, setPlacing]         = useState(false);
  const [budget, setBudget]           = useState('');
  const [showUPI, setShowUPI]         = useState(false);       // ✅ ADDED
  const [showWA, setShowWA]           = useState(false);       // ✅ ADDED
  const [pendingOrders, setPendingOrders] = useState(null);    // ✅ ADDED

  const over = budget && total > parseFloat(budget);
  const getImg = (item) => item.images?.[0] || CATEGORY_IMAGES[item.category] || CATEGORY_IMAGES['Other'];

  // ✅ ADDED — builds per-vendor order list without placing
  const buildOrders = (method) => {
    const byVendor = {};
    cart.forEach(item => {
      const vid = item.vendor?._id || item.vendor || 'default_vendor';
      const vName = item.vendor?.shopName || 'Local Vendor';
      if (!byVendor[vid]) byVendor[vid] = { items: [], vendorName: vName };
      byVendor[vid].items.push(item);
    });
    return Object.entries(byVendor).map(([vendorId, group]) => ({
      vendor: isDefaultProduct(vendorId) ? undefined : vendorId,
      vendorName: group.vendorName,
      items: group.items.map(item => ({
        product: isDefaultProduct(item._id) ? undefined : item._id,
        productName: item.name,
        quantity: item.qty,
        price: item.price
      })),
      paymentMethod: method,
      totalAmount: group.items.reduce((s, i) => s + i.price * i.qty, 0)
    }));
  };

  // ✅ ADDED — fires the API calls
  const fireOrders = async (orders, ref = null) => {
    for (const order of orders) {
      await placeOrder(ref ? { ...order, paymentRef: ref } : order);
    }
  };

  const handleCheckout = async () => {
    if (!user) return toast.error('Login first');
    if (cart.length === 0) return toast.error('Cart is empty');

    // ✅ CHANGED — intercept UPI & WhatsApp before placing
    if (payment === 'upi') {
      setPendingOrders(buildOrders('upi'));
      setShowUPI(true);
      return;
    }
    if (payment === 'whatsapp') {
      setPendingOrders(buildOrders('whatsapp'));
      setShowWA(true);
      return;
    }

    // COD — place immediately
    setPlacing(true);
    try {
      await fireOrders(buildOrders('cod'));
      clearCart();
      toast.success('Order placed! 🎉');
      navigate('/orders');
    } catch (err) {
      console.error('Checkout error:', err);
      toast.error(err.response?.data?.msg || 'Order failed. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  // ✅ ADDED — called by UPI modal after UTR confirmed
  const handleUPISuccess = async (utr) => {
    setShowUPI(false);
    setPlacing(true);
    try {
      await fireOrders(pendingOrders, utr);
      clearCart();
      toast.success('🎉 Order placed & payment confirmed!');
      navigate('/orders');
    } catch (err) {
      toast.error('Order failed. Save your UTR: ' + utr);
    } finally {
      setPlacing(false);
    }
  };

  // ✅ ADDED — called by WhatsApp modal after user confirms
  const handleWASuccess = async (ref) => {
    setShowWA(false);
    setPlacing(true);
    try {
      await fireOrders(pendingOrders, ref);
      clearCart();
      toast.success('🎉 Order placed via WhatsApp!');
      navigate('/orders');
    } catch (err) {
      toast.error('Order failed. Please contact support.');
    } finally {
      setPlacing(false);
    }
  };

  if (cart.length === 0) return (
    <div className="page flex-center" style={{ minHeight: '70vh', flexDirection: 'column', gap: 20 }}>
      <img src="https://images.unsplash.com/photo-1590845947376-2638caa89309?w=300&q=80" alt="Empty" style={{ width: 180, borderRadius: 20, opacity: 0.5 }} />
      <h2 style={{ fontFamily: 'Syne', fontSize: 26 }}>Cart is empty</h2>
      <p className="text-muted">Add products to get started</p>
      <Link to="/products" className="btn btn-primary" style={{ padding: '12px 28px' }}>Browse Products →</Link>
    </div>
  );

  // Button label based on payment method
  const btnLabel = () => {
    if (placing) return <div className="spinner" />;
    if (payment === 'upi')       return `📲 Pay ₹${total.toFixed(0)} via UPI`;
    if (payment === 'whatsapp')  return `💬 Pay ₹${total.toFixed(0)} via WhatsApp`;
    return `Place Order — ₹${total.toFixed(0)}`;
  };

  return (
    <div className="page">
      <div className="flex-between" style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'Syne', fontSize: 30, fontWeight: 800 }}>🛒 Cart ({cart.length})</h1>
        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} onClick={() => { clearCart(); toast('Cart cleared', { icon: '🗑️' }); }}>Clear all</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, alignItems: 'start' }}>
        {/* Cart items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {cart.map(item => (
            <div key={item._id} className="card" style={{ display: 'flex', gap: 14, alignItems: 'center', padding: '14px 18px' }}>
              <img src={getImg(item)} alt={item.name}
                style={{ width: 68, height: 68, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }}
                onError={e => e.target.src = CATEGORY_IMAGES['Other']} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 15, marginBottom: 2 }}>{item.name}</h3>
                <p style={{ color: 'var(--text2)', fontSize: 12, marginBottom: 8 }}>{item.vendor?.shopName || 'Local Vendor'}</p>
                <div className="flex-between">
                  <span className="price-tag" style={{ fontSize: 18 }}>₹{(item.price * item.qty).toFixed(0)}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {[['−', item.qty - 1], ['+', item.qty + 1]].map(([l, v]) => (
                      <button key={l} onClick={() => updateQty(item._id, v)}
                        style={{ width: 28, height: 28, borderRadius: 7, border: '1.5px solid var(--border2)', background: 'var(--bg3)', color: 'var(--text)', cursor: 'pointer', fontSize: 16 }}>
                        {l}
                      </button>
                    ))}
                    <span style={{ fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{item.qty}</span>
                    <button onClick={() => removeFromCart(item._id)}
                      style={{ width: 28, height: 28, borderRadius: 7, border: '1.5px solid rgba(255,82,82,.3)', background: 'rgba(255,82,82,.1)', color: 'var(--red)', cursor: 'pointer', marginLeft: 4 }}>
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order summary */}
        <div style={{ position: 'sticky', top: 88 }}>
          <div className="card">
            <h3 style={{ fontFamily: 'Syne', fontSize: 18, fontWeight: 700, marginBottom: 18 }}>Order Summary</h3>

            {/* Budget */}
            <div style={{ padding: 12, borderRadius: 10, background: 'var(--bg3)', border: '1px solid var(--border2)', marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: 'var(--text2)', fontWeight: 600, display: 'block', marginBottom: 6 }}>💰 Budget Limit</label>
              <input type="number" placeholder="Set limit ₹" value={budget} onChange={e => setBudget(e.target.value)} style={{ fontSize: 13, padding: '10px 12px' }} />
              {over && (
                <div style={{ marginTop: 8, padding: '6px 10px', borderRadius: 8, background: 'rgba(255,82,82,.1)', border: '1px solid rgba(255,82,82,.2)' }}>
                  <p style={{ fontSize: 12, color: 'var(--red)' }}>⚠️ ₹{(total - parseFloat(budget)).toFixed(0)} over budget!</p>
                </div>
              )}
            </div>

            {/* Item list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {cart.map(i => (
                <div key={i._id} className="flex-between" style={{ fontSize: 13 }}>
                  <span style={{ color: 'var(--text2)' }}>{i.name} ×{i.qty}</span>
                  <span>₹{(i.price * i.qty).toFixed(0)}</span>
                </div>
              ))}
              <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />
              <div className="flex-between" style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 20 }}>
                <span>Total</span>
                <span style={{ color: 'var(--accent)' }}>₹{total.toFixed(0)}</span>
              </div>
            </div>

            {/* Payment method */}
            <div style={{ marginBottom: 16 }}>
              <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 8, fontWeight: 600 }}>Payment Method</p>
              {[
                ['cod',      '💵 Cash on Delivery'],
                ['upi',      '📱 UPI'],
                ['whatsapp', '💬 WhatsApp Pay'],
              ].map(([v, l]) => (
                <label key={v} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '9px 12px', borderRadius: 8, border: `1.5px solid ${payment === v ? (v === 'whatsapp' ? '#25D366' : 'var(--accent)') : 'var(--border)'}`, background: payment === v ? (v === 'whatsapp' ? 'rgba(37,211,102,.06)' : 'rgba(255,92,26,.06)') : 'var(--bg3)', marginBottom: 6, transition: 'all .2s' }}>
                  <input type="radio" name="pay" value={v} checked={payment === v} onChange={() => setPayment(v)} />
                  <span style={{ fontSize: 13, color: payment === v ? (v === 'whatsapp' ? '#25D366' : 'var(--accent)') : 'var(--text2)' }}>{l}</span>
                </label>
              ))}
            </div>

            {/* Hints */}
            {payment === 'upi' && (
              <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 10, background: 'rgba(255,92,26,.07)', border: '1px solid rgba(255,92,26,.2)' }}>
                <p style={{ fontSize: 12, color: 'var(--accent)' }}>📲 You'll see a QR code & UPI app links to pay before your order is placed.</p>
              </div>
            )}
            {payment === 'whatsapp' && (
              <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 10, background: 'rgba(37,211,102,.07)', border: '1px solid rgba(37,211,102,.2)' }}>
                <p style={{ fontSize: 12, color: '#25D366' }}>💬 WhatsApp will open with your order pre-filled. Pay the vendor directly via WhatsApp Pay.</p>
              </div>
            )}

            <button className="btn btn-primary w-full" style={{ height: 48, background: payment === 'whatsapp' ? 'linear-gradient(135deg,#25D366,#128C7E)' : undefined }} onClick={handleCheckout} disabled={placing}>
              {btnLabel()}
            </button>
            <Link to="/products" style={{ display: 'block', textAlign: 'center', marginTop: 12, fontSize: 13, color: 'var(--text2)' }}>← Continue Shopping</Link>
          </div>
        </div>
      </div>

      {/* ✅ UPI Modal */}
      {showUPI && (
        <UPIPaymentModal
          amount={total.toFixed(0)}
          onSuccess={handleUPISuccess}
          onClose={() => setShowUPI(false)}
        />
      )}

      {/* ✅ WhatsApp Modal */}
      {showWA && (
        <WhatsAppPaymentModal
          amount={total.toFixed(0)}
          cartItems={cart}
          onSuccess={handleWASuccess}
          onClose={() => setShowWA(false)}
        />
      )}
    </div>
  );
}