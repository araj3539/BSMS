import React, { createContext, useContext, useState, useEffect } from 'react';
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
        // If item exists, update qty (or you could sum them: finalCart[existingIndex].qty += guestItem.qty)
        finalCart[existingIndex] = guestItem; 
      } else {
        // If new, push it
        finalCart.push(guestItem);
      }
    });

    // D. Update State & Storage
    // Update the specific user's cart in localStorage
    localStorage.setItem(`cart_${userData._id}`, JSON.stringify(finalCart));
    // Clear guest cart
    localStorage.removeItem('cart_guest'); 
    
    // E. Sync Merged Cart to Backend
    // We attach the cart to the user object immediately for UI updates
    const updatedUser = { ...userData, cart: finalCart };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));

    // Send the merged cart to the database
    try {
      await api.put('/auth/cart', { cart: finalCart }, {
        headers: { Authorization: `Bearer ${newToken}` } // Manually pass token as interceptor might lag
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
      // Only fetch if we have a token
      if (!token) return;

      try {
        // 1. Get fresh user data from DB
        const res = await api.get('/auth/me'); 
        const dbUser = res.data.user;

        // 2. Update Local Cart Storage
        // This ensures Device B gets the items saved by Device A
        if (dbUser.cart && dbUser.cart.length > 0) {
           const cartKey = `cart_${dbUser._id}`;
           // We prioritize the DB cart over stale local data
           localStorage.setItem(cartKey, JSON.stringify(dbUser.cart));
        }

        // 3. Update Context State
        // This triggers the app to re-render with the new data
        setUser(dbUser);
        localStorage.setItem('user', JSON.stringify(dbUser));
        
      } catch (err) {
        console.error("Failed to sync session:", err);
      }
    }

    fetchMe();
  }, [token]); // Runs whenever token exists/changes

  // Update profile function (e.g. if name changes)
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