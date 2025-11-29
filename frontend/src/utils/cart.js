// src/utils/cart.js
import api from '../services/api';

export const syncCart = async (userId, cart) => {
  if (!userId) return; // Guest? Do nothing (already saved to localStorage)
  try {
    await api.put('/auth/cart', { cart });
  } catch (err) {
    console.error("Cart sync failed", err);
  }
};