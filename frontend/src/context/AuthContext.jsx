import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Initialize state from localStorage so it persists on refresh
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user')) || null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  
  // Ref to prevent double-fetching in React Strict Mode (Development)
  const isFetchingRef = useRef(false);

  // Login function
  const login = async (newToken, userData) => {
    setToken(newToken);
    localStorage.setItem('token', newToken);

    // A. Get Guest Cart
    const guestCart = JSON.parse(localStorage.getItem('cart_guest') || '[]');
    
    // B. Get Database Cart (from userData)
    const dbCart = userData.cart || [];

    // C. Merge Logic (Guest items overwrite/add to DB items)
    let finalCart = [...dbCart];

    guestCart.forEach(guestItem => {
      const existingIndex = finalCart.findIndex(i => i.bookId === guestItem.bookId);
      if (existingIndex > -1) {
        // If item exists, update qty (or you could sum them)
        finalCart[existingIndex] = guestItem; 
      } else {
        // If new, push it
        finalCart.push(guestItem);
      }
    });

    // D. Update State & Storage
    localStorage.setItem(`cart_${userData._id}`, JSON.stringify(finalCart));
    localStorage.removeItem('cart_guest'); 
    
    // E. Sync Merged Cart to Backend
    const updatedUser = { ...userData, cart: finalCart };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));

    try {
      await api.put('/auth/cart', { cart: finalCart }, {
        headers: { Authorization: `Bearer ${newToken}` }
      });
    } catch (e) {
      console.error("Failed to sync cart on login", e);
    }
  };

  // Logout function
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  useEffect(() => {
    async function fetchMe() {
      // 1. Guard clauses
      if (!token) return;
      if (isFetchingRef.current) return; // Prevent double firing
      
      isFetchingRef.current = true;

      try {
        // 2. Get fresh user data from DB
        const res = await api.get('/auth/me'); 
        const dbUser = res.data.user;

        // 3. Update Local Cart Storage (Device sync)
        if (dbUser.cart && dbUser.cart.length > 0) {
           const cartKey = `cart_${dbUser._id}`;
           localStorage.setItem(cartKey, JSON.stringify(dbUser.cart));
        }

        // 4. Update Context State
        setUser(dbUser);
        localStorage.setItem('user', JSON.stringify(dbUser));
        
      } catch (err) {
        // If 401, the interceptor handles it, but we can double check here
        console.error("Failed to sync session:", err);
      } finally {
        // Reset flag after delay to allow future refreshes if needed, 
        // but prevents immediate double-invocations
        setTimeout(() => { isFetchingRef.current = false; }, 1000);
      }
    }

    fetchMe();
  }, [token]);

  // Update profile function
  const updateProfile = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook for easy usage
export function useAuth() {
  return useContext(AuthContext);
}