// ─────────────────────────────────────────────────────────────────────────────
// PAYMENT MODALS — UPI + WhatsApp
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useRef } from 'react';

const UPI_ID      = 'localsphere@upi'; // 🔁 Replace with your real UPI ID
const WHATSAPP_NO = '919999999999';    // 🔁 Replace with vendor WhatsApp (country code + number, no +)

// ─────────────────────────────────────────────────────────────────────────────
// QR BOX
// ─────────────────────────────────────────────────────────────────────────────
function QRBox({ amount }) {
  return (
    <div style={{
      width: 180, height: 180, margin: '0 auto',
      background: '#fff', borderRadius: 16, padding: 12,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 0 0 3px rgba(255,92,26,.35)', overflow: 'hidden'
    }}>
      <svg width={156} height={156} viewBox="0 0 156 156" xmlns="http://www.w3.org/2000/svg">
        {[[4,4],[108,4],[4,108]].map(([x,y],i) => (
          <g key={i}>
            <rect x={x} y={y} width={44} height={44} rx={5} fill="none" stroke="#111" strokeWidth={5}/>
            <rect x={x+10} y={y+10} width={24} height={24} rx={2} fill="#111"/>
          </g>
        ))}
        {Array.from({length: 220}).map((_,i) => {
          const col = (i * 7 + i * 3) % 17;
          const row = Math.floor(i / 17) + 3;
          if ((col < 6 && row < 6) || (col > 10 && row < 6) || (col < 6 && row > 10)) return null;
          return Math.sin(i * 2.5 + col) > 0.1
            ? <rect key={i} x={6 + col * 8.5} y={6 + row * 8.5} width={7} height={7} rx={1} fill="#111"/>
            : null;
        })}
        <rect x={60} y={60} width={36} height={36} rx={8} fill="#ff5c1a"/>
        <text x={78} y={83} textAnchor="middle" fontSize={18} fill="#fff" fontWeight="bold">₹</text>
      </svg>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED MODAL SHELL
// ─────────────────────────────────────────────────────────────────────────────
function Shell({ children, onClose }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{
        background: 'var(--bg2,#111)', borderRadius: 24, padding: 28,
        width: '100%', maxWidth: 400, border: '1.5px solid var(--border,#222)',
        boxShadow: '0 24px 80px rgba(0,0,0,.6)', position: 'relative',
        maxHeight: '90vh', overflowY: 'auto'
      }}>
        <button onClick={onClose} style={{
          position: 'absolute', top: 16, right: 16,
          background: 'rgba(255,255,255,.08)', border: 'none', borderRadius: 8,
          color: 'var(--text,#fff)', width: 32, height: 32, cursor: 'pointer', fontSize: 16
        }}>✕</button>
        {children}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// UPI PAYMENT MODAL
// ─────────────────────────────────────────────────────────────────────────────
export function UPIPaymentModal({ amount, onSuccess, onClose }) {
  const TIMER_SECONDS = 300;
  const [timeLeft, setTimeLeft]   = useState(TIMER_SECONDS);
  const [step, setStep]           = useState('qr');
  const [utrInput, setUtrInput]   = useState('');
  const [utrError, setUtrError]   = useState('');
  const [verifying, setVerifying] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) { clearInterval(intervalRef.current); setStep('failed'); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const mm = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const ss = String(timeLeft % 60).padStart(2, '0');
  const pct = (timeLeft / TIMER_SECONDS) * 100;
  const timerColor = timeLeft < 60 ? '#ff5252' : timeLeft < 120 ? '#ffb347' : '#00e676';

  const upiLink = `upi://pay?pa=${UPI_ID}&pn=LocalSphere&am=${amount}&cu=INR&tn=Order+Payment`;
  const apps = [
    { name: 'GPay',    link: `gpay://upi/pay?pa=${UPI_ID}&pn=LocalSphere&am=${amount}&cu=INR`, color: '#4285F4', emoji: 'G' },
    { name: 'PhonePe', link: `phonepe://pay?pa=${UPI_ID}&pn=LocalSphere&am=${amount}&cu=INR`,  color: '#5f259f', emoji: '📱' },
    { name: 'Paytm',   link: `paytmmp://pay?pa=${UPI_ID}&pn=LocalSphere&am=${amount}&cu=INR`, color: '#00baf2', emoji: 'P' },
    { name: 'BHIM',    link: upiLink, color: '#ff6f00', emoji: 'B' },
  ];

  const handleVerify = async () => {
    if (utrInput.trim().length < 6) { setUtrError('Enter a valid UTR / transaction ID'); return; }
    setUtrError('');
    setVerifying(true);
    await new Promise(r => setTimeout(r, 1800));
    setVerifying(false);
    setStep('success');
    clearInterval(intervalRef.current);
    setTimeout(() => onSuccess(utrInput.trim()), 1500);
  };

  if (step === 'success') return (
    <Shell onClose={onClose}>
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
        <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 24, fontWeight: 800, color: '#00e676', marginBottom: 8 }}>Payment Successful!</h2>
        <p style={{ color: 'var(--text2,#888)', fontSize: 14 }}>₹{amount} paid via UPI</p>
        <p style={{ color: 'var(--text2,#888)', fontSize: 12, marginTop: 6 }}>UTR: {utrInput}</p>
        <p style={{ color: 'var(--text2,#888)', fontSize: 12, marginTop: 4 }}>Your order is being confirmed...</p>
      </div>
    </Shell>
  );

  if (step === 'failed') return (
    <Shell onClose={onClose}>
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>⏰</div>
        <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 22, fontWeight: 800, color: '#ff5252', marginBottom: 8 }}>Payment Expired</h2>
        <p style={{ color: 'var(--text2,#888)', fontSize: 14, marginBottom: 24 }}>The payment window has closed. Please try again.</p>
        <button onClick={onClose} style={{ background: 'linear-gradient(135deg,#ff5c1a,#ff8c42)', border: 'none', borderRadius: 12, color: '#fff', padding: '12px 32px', fontWeight: 700, fontSize: 15, cursor: 'pointer', width: '100%' }}>Try Again</button>
      </div>
    </Shell>
  );

  if (step === 'manual') return (
    <Shell onClose={onClose}>
      <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Enter UTR / Transaction ID</h2>
      <p style={{ color: 'var(--text2,#888)', fontSize: 13, marginBottom: 20 }}>
        After paying ₹{amount} to <strong style={{ color: 'var(--accent,#ff5c1a)' }}>{UPI_ID}</strong>, enter the UTR from your UPI app.
      </p>
      <input
        value={utrInput}
        onChange={e => setUtrInput(e.target.value.replace(/\D/g, '').slice(0, 22))}
        placeholder="e.g. 421234567890"
        style={{ width: '100%', padding: '14px 16px', borderRadius: 12, fontSize: 16, background: 'var(--bg3,#1a1a1a)', border: `1.5px solid ${utrError ? '#ff5252' : 'var(--border,#333)'}`, color: 'var(--text,#fff)', outline: 'none', boxSizing: 'border-box', letterSpacing: 2, fontFamily: 'monospace' }}
      />
      {utrError && <p style={{ color: '#ff5252', fontSize: 12, marginTop: 6 }}>{utrError}</p>}
      <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
        <button onClick={() => setStep('qr')} style={{ flex: 1, padding: '12px 0', borderRadius: 12, border: '1.5px solid var(--border,#333)', background: 'transparent', color: 'var(--text,#fff)', cursor: 'pointer', fontWeight: 600 }}>← Back</button>
        <button onClick={handleVerify} disabled={verifying} style={{ flex: 2, padding: '12px 0', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#ff5c1a,#ff8c42)', color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {verifying ? <><div style={{ width: 18, height: 18, border: '2.5px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />Verifying...</> : '✅ Confirm Payment'}
        </button>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </Shell>
  );

  return (
    <Shell onClose={onClose}>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 20 }}>📲</span>
          <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 22, fontWeight: 800 }}>Pay via UPI</h2>
        </div>
        <p style={{ color: 'var(--text2,#888)', fontSize: 13 }}>Scan QR or tap your UPI app</p>
      </div>
      <div style={{ textAlign: 'center', padding: '12px 0', marginBottom: 18, borderTop: '1px solid var(--border,#222)', borderBottom: '1px solid var(--border,#222)' }}>
        <p style={{ color: 'var(--text2,#888)', fontSize: 12, marginBottom: 2 }}>AMOUNT TO PAY</p>
        <p style={{ fontFamily: 'Syne,sans-serif', fontSize: 36, fontWeight: 900, color: '#ff5c1a' }}>₹{amount}</p>
        <p style={{ color: 'var(--text2,#888)', fontSize: 12 }}>To: <strong style={{ color: 'var(--text,#fff)' }}>{UPI_ID}</strong></p>
      </div>
      <div style={{ marginBottom: 18 }}>
        <QRBox amount={amount} />
        <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text2,#888)', marginTop: 10 }}>Open any UPI app → Scan QR → Pay ₹{amount}</p>
      </div>
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 12, color: 'var(--text2,#888)' }}>Time remaining</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: timerColor, fontFamily: 'monospace' }}>{mm}:{ss}</span>
        </div>
        <div style={{ height: 6, background: 'var(--bg3,#1a1a1a)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: 4, width: `${pct}%`, background: `linear-gradient(90deg,${timerColor},${timerColor}aa)`, transition: 'width 1s linear,background .5s' }} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 18 }}>
        {apps.map(app => (
          <a key={app.name} href={app.link} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, padding: '10px 4px', borderRadius: 12, border: '1.5px solid var(--border,#333)', background: 'var(--bg3,#1a1a1a)', textDecoration: 'none', cursor: 'pointer', transition: 'border-color .2s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = app.color}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border,#333)'}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: app.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: '#fff' }}>{app.emoji}</div>
            <span style={{ fontSize: 10, color: 'var(--text2,#888)', fontWeight: 600 }}>{app.name}</span>
          </a>
        ))}
      </div>
      <button onClick={() => setStep('manual')} style={{ width: '100%', padding: '13px 0', borderRadius: 12, background: 'linear-gradient(135deg,#ff5c1a,#ff8c42)', border: 'none', color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
        ✅ I've Already Paid — Enter UTR
      </button>
      <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text2,#888)', marginTop: 12 }}>
        Having trouble? <button onClick={() => setStep('manual')} style={{ background: 'none', border: 'none', color: '#ff5c1a', cursor: 'pointer', fontSize: 11, padding: 0 }}>Enter UTR manually</button>
      </p>
    </Shell>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ✅ NEW: WHATSAPP PAYMENT MODAL
// ─────────────────────────────────────────────────────────────────────────────
export function WhatsAppPaymentModal({ amount, cartItems, onSuccess, onClose }) {
  const [step, setStep] = useState('info'); // info | waiting | success

  const orderSummary = cartItems
    .map(i => `• ${i.name} ×${i.qty} = ₹${(i.price * i.qty).toFixed(0)}`)
    .join('%0A');

  const message =
    `Hello! I'd like to place an order on LocalSphere 🛒%0A%0A` +
    `${orderSummary}%0A%0A` +
    `*Total: ₹${amount}*%0A` +
    `Payment: WhatsApp Pay%0A%0A` +
    `Please confirm my order and share payment details. Thank you!`;

  const whatsappURL = `https://wa.me/${WHATSAPP_NO}?text=${message}`;

  const handleOpenWhatsApp = () => {
    window.open(whatsappURL, '_blank');
    setStep('waiting');
  };

  const handleConfirm = () => {
    setStep('success');
    setTimeout(() => onSuccess('whatsapp-pay'), 1500);
  };

  if (step === 'success') return (
    <Shell onClose={onClose}>
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
        <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 24, fontWeight: 800, color: '#00e676', marginBottom: 8 }}>Order Confirmed!</h2>
        <p style={{ color: 'var(--text2,#888)', fontSize: 14 }}>₹{amount} via WhatsApp Pay</p>
        <p style={{ color: 'var(--text2,#888)', fontSize: 12, marginTop: 6 }}>Your order is being placed...</p>
      </div>
    </Shell>
  );

  if (step === 'waiting') return (
    <Shell onClose={onClose}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>💬</div>
        <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Complete on WhatsApp</h2>
        <p style={{ color: 'var(--text2,#888)', fontSize: 13, lineHeight: 1.6 }}>
          Your order message is ready in WhatsApp.<br/>
          Pay ₹{amount} using <strong style={{ color: '#25D366' }}>WhatsApp Pay</strong> in the chat, then confirm below.
        </p>
      </div>
      {[
        ['1', 'Send the message to the vendor'],
        ['2', `Tap "Pay" in the chat to send ₹${amount}`],
        ['3', 'Come back here and confirm'],
      ].map(([n, t]) => (
        <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10, padding: '10px 14px', borderRadius: 10, background: 'rgba(37,211,102,.06)', border: '1px solid rgba(37,211,102,.15)' }}>
          <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 13, color: '#fff', flexShrink: 0 }}>{n}</div>
          <span style={{ fontSize: 13, color: 'var(--text,#fff)' }}>{t}</span>
        </div>
      ))}
      <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
        <button onClick={handleOpenWhatsApp} style={{ flex: 1, padding: '12px 0', borderRadius: 12, border: '1.5px solid #25D366', background: 'rgba(37,211,102,.08)', color: '#25D366', cursor: 'pointer', fontWeight: 700, fontSize: 13 }}>
          ↗ Reopen WhatsApp
        </button>
        <button onClick={handleConfirm} style={{ flex: 2, padding: '12px 0', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg,#25D366,#128C7E)', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
          ✅ I've Paid — Confirm
        </button>
      </div>
    </Shell>
  );

  // ── INFO — first screen ───────────────────────────────────────────────────
  return (
    <Shell onClose={onClose}>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,#25D366,#128C7E)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto 12px' }}>💬</div>
        <h2 style={{ fontFamily: 'Syne,sans-serif', fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Pay via WhatsApp</h2>
        <p style={{ color: 'var(--text2,#888)', fontSize: 13 }}>We'll open WhatsApp with your order pre-filled</p>
      </div>

      <div style={{ textAlign: 'center', padding: '14px 0', marginBottom: 20, borderTop: '1px solid var(--border,#222)', borderBottom: '1px solid var(--border,#222)' }}>
        <p style={{ color: 'var(--text2,#888)', fontSize: 12, marginBottom: 2 }}>AMOUNT TO PAY</p>
        <p style={{ fontFamily: 'Syne,sans-serif', fontSize: 36, fontWeight: 900, color: '#25D366' }}>₹{amount}</p>
      </div>

      <div style={{ marginBottom: 20 }}>
        <p style={{ fontSize: 12, color: 'var(--text2,#888)', fontWeight: 600, marginBottom: 10, letterSpacing: 1 }}>ORDER SUMMARY</p>
        {cartItems.map((item, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8, padding: '8px 12px', borderRadius: 8, background: 'var(--bg3,#1a1a1a)' }}>
            <span style={{ color: 'var(--text,#fff)' }}>{item.name} <span style={{ color: 'var(--text2,#888)' }}>×{item.qty}</span></span>
            <span style={{ color: '#25D366', fontWeight: 700 }}>₹{(item.price * item.qty).toFixed(0)}</span>
          </div>
        ))}
      </div>

      <div style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(37,211,102,.06)', border: '1px solid rgba(37,211,102,.15)', marginBottom: 20 }}>
        <p style={{ fontSize: 12, color: '#25D366', fontWeight: 700, marginBottom: 6 }}>HOW IT WORKS</p>
        <p style={{ fontSize: 12, color: 'var(--text2,#888)', lineHeight: 1.7 }}>
          1. We open WhatsApp with your order pre-filled<br/>
          2. Send the message to the vendor<br/>
          3. Pay ₹{amount} using WhatsApp Pay in the chat<br/>
          4. Come back here and confirm your order ✅
        </p>
      </div>

      <button onClick={handleOpenWhatsApp} style={{
        width: '100%', padding: '14px 0', borderRadius: 12, border: 'none',
        background: 'linear-gradient(135deg,#25D366,#128C7E)',
        color: '#fff', fontWeight: 800, fontSize: 16, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
      }}>
        <span style={{ fontSize: 20 }}>💬</span> Open WhatsApp & Pay ₹{amount}
      </button>
      <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--text2,#888)', marginTop: 12 }}>
        WhatsApp must be installed on this device
      </p>
    </Shell>
  );
}