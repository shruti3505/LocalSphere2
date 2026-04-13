import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

const AuthContext = createContext();
const CartContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = localStorage.getItem('user');
    const t = localStorage.getItem('token');
    if (u && t) { try { setUser(JSON.parse(u)); } catch {} }
    setLoading(false);
  }, []);

  const loginUser = (userData, token) => {
    setUser(userData);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('cart');
  };

  return <AuthContext.Provider value={{ user, loading, loginUser, logout }}>{children}</AuthContext.Provider>;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cart')) || []; } catch { return []; }
  });

  const save = (c) => { setCart(c); localStorage.setItem('cart', JSON.stringify(c)); };

  const addToCart = (product, customPrice) => {
    const price = customPrice || product.price;
    const existing = cart.find(i => i._id === product._id);
    if (existing) {
      save(cart.map(i => i._id === product._id ? { ...i, qty: i.qty + 1 } : i));
      toast.success('Quantity updated!');
    } else {
      save([...cart, { ...product, price, qty: 1 }]);
      toast.success('Added to cart! 🛒');
    }
  };

  const removeFromCart = (id) => { save(cart.filter(i => i._id !== id)); toast('Removed', { icon: '🗑️' }); };
  const updateQty = (id, qty) => { if (qty < 1) return removeFromCart(id); save(cart.map(i => i._id === id ? { ...i, qty } : i)); };
  const clearCart = () => save([]);
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const count = cart.reduce((s, i) => s + i.qty, 0);

  return <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQty, clearCart, total, count }}>{children}</CartContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
export const useCart = () => useContext(CartContext);
