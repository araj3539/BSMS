// src/pages/Checkout.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import PaymentForm from '../components/PaymentForm';
import { useAuth } from '../context/AuthContext';

const stripePromise = loadStripe('pk_test_51SUo4cEBSigHVgLU4DOyQhwUJpLjbnYBsd6UspdP8v9yjQQV2xXalrMVPxd4w864foMUkrihLTfGAuvGrrQmTWHO00OH7PW3kO'); 

// Utility: Round to 2 decimal places to fix floating point errors (e.g., 719.1000004 -> 719.1)
const round = (num) => Math.round((num + Number.EPSILON) * 100) / 100;

function ProcessingScreen() {
  return (
    <div className="fixed inset-0 bg-white/90 backdrop-blur-sm z-[9999] flex items-center justify-center cursor-wait">
      <div className="text-left p-8 max-w-lg">
        <h2 className="text-slate-400 font-bold text-xl mb-6 uppercase tracking-wider">Processing Payment</h2>
        <div className="flex items-center gap-4 mb-6">
           <div className="loader"></div>
           <p className="text-slate-700 font-medium">Confirming transaction...</p>
        </div>
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded">
          <div className="flex items-start">
            <p className="text-amber-700 text-sm font-medium">
              Please do not refresh or close this window. This may take a moment.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Checkout(){
  const { user, updateProfile } = useAuth();
  const nav = useNavigate();
  const location = useLocation(); 

  const [cart, setCart] = useState([]);
  const [shippingAddress, setShippingAddress] = useState('');
  const [saveAddress, setSaveAddress] = useState(false);
  const [addressLabel, setAddressLabel] = useState('');
  
  const [promoCode, setPromoCode] = useState(location.state?.promoCode || ''); 
  const [promoInfo, setPromoInfo] = useState(null);
  const [promoErr, setPromoErr] = useState('');
  const [availablePromos, setAvailablePromos] = useState([]); 

  const [clientSecret, setClientSecret] = useState('');
  const [readyToPay, setReadyToPay] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [tempOrderId, setTempOrderId] = useState(null);

  const cartKey = user ? `cart_${user._id}` : 'cart_guest';

  useEffect(()=> {
    setCart(JSON.parse(localStorage.getItem(cartKey) || '[]'));
    fetchPromotions(); 
  }, [user, cartKey]);

  // 1. Auto-check promo from Cart page
  useEffect(() => {
    if(location.state?.promoCode && cart.length > 0) {
        checkPromo(location.state.promoCode); 
    }
  }, [cart.length]); // Run once on load if cart has items

  // 2. CALCULATE TOTALS (Live)
  const subtotal = round(cart.reduce((s, it)=> s + (it.price || 0) * (it.qty || 0), 0));
  
  // 3. WATCH FOR CART CHANGES (The Fix)
  useEffect(() => {
    if (cart.length === 0 || subtotal === 0) {
        // Cart cleared? Reset EVERYTHING.
        setPromoInfo(null);
        setPromoErr('');
        setClientSecret('');
        setReadyToPay(false);
    } else if (promoInfo) {
        // Cart changed but items remain? Re-validate promo to update discount math
        checkPromo(promoInfo.promo.code);
    }
  }, [cart, subtotal]); 

  const discountAmount = promoInfo ? round(promoInfo.discount) : 0;
  const finalTotal = round(Math.max(0, subtotal - discountAmount));

  async function fetchPromotions() {
      try {
          const res = await api.get('/promotions');
          setAvailablePromos(res.data || []);
      } catch(e) { console.error(e); }
  }

  const sortedPromotions = availablePromos.map(p => {
      const isEligible = subtotal >= (p.minOrderValue || 0);
      let savings = 0;
      if(isEligible) {
          savings = p.type === 'percent' ? round(subtotal * p.value / 100) : p.value;
      }
      return { ...p, isEligible, savings };
  }).sort((a, b) => {
      if (a.isEligible && !b.isEligible) return -1;
      if (!a.isEligible && b.isEligible) return 1;
      return b.savings - a.savings;
  });

  async function checkPromo(codeToCheck = promoCode){
    if(!codeToCheck) { setPromoErr('Enter code'); setPromoInfo(null); return; }
    try{
      const r = await api.get('/promotions/validate', { params: { code: codeToCheck, subtotal } });
      setPromoInfo(r.data);
      setPromoCode(codeToCheck); 
      setPromoErr('');
      setReadyToPay(false); // Reset payment if price changes
    }catch(err){
      setPromoInfo(null);
      setPromoErr(err.response?.data?.msg || 'Invalid code');
    }
  }

  function applyCoupon(code) {
      setPromoCode(code);
      checkPromo(code);
  }

  async function initPayment() {
  // ... validations ...
  try {
    const items = cart.map(it => ({ bookId: it.bookId, qty: it.qty }));

    // Call the NEW init endpoint
    const res = await api.post('/orders/checkout-init', { 
        items, 
        promotionCode: promoInfo ? promoInfo.promo.code : '',
        shippingAddress,
        saveAddress,
        addressLabel
    });

    setClientSecret(res.data.clientSecret);
    setTempOrderId(res.data.orderId); // Store the ID for redirect
    setReadyToPay(true);
  } catch (err) {
    toast.error(err.response?.data?.msg || 'Failed to initialize');
  }
}

  async function handlePaymentSuccess(paymentId) {
  // We do NOT create the order here anymore. The Webhook does it.
  // We just clear cart and redirect.

  localStorage.removeItem(cartKey);
  toast.success('Payment Successful!');

  // Navigate to the order we created in initPayment
  nav(`/order/${tempOrderId}`);
}

  function updateQty(i, qty){
    const newQty = Math.max(1, Math.floor(Number(qty)));
    const c = [...cart]; c[i].qty = newQty; setCart(c); localStorage.setItem(cartKey, JSON.stringify(c)); setReadyToPay(false);
  }
  function removeItem(i){
    const c = cart.filter((_, idx)=> idx !== i); setCart(c); localStorage.setItem(cartKey, JSON.stringify(c)); setReadyToPay(false);
  }

  return (
    <div className="max-w-6xl mx-auto p-6 min-h-screen bg-slate-50">
      {isProcessing && <ProcessingScreen />}
      <h2 className="text-3xl font-serif font-bold mb-8 text-slate-900">Checkout</h2>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          {/* Address */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-serif text-xl font-bold text-slate-900">Shipping Address</h3>
              <button onClick={() => nav('/profile')} className="text-sm text-indigo-600 font-medium hover:underline">Manage Addresses</button>
            </div>
            {user?.addresses?.length > 0 && (
              <div className="flex flex-wrap gap-3 mb-4">
                {user.addresses.map(addr => (
                  <button
                    key={addr._id}
                    onClick={() => setShippingAddress(addr.address)}
                    className={`text-left p-3 rounded-xl border transition-all ${shippingAddress === addr.address ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500' : 'bg-white hover:bg-slate-50 border-slate-200'}`}
                  >
                    <span className="font-bold text-slate-800 block text-sm">{addr.label}</span>
                    <span className="text-slate-500 text-xs truncate max-w-[200px] block mt-1">{addr.address}</span>
                  </button>
                ))}
              </div>
            )}
            <textarea
              value={shippingAddress}
              onChange={e => setShippingAddress(e.target.value)}
              placeholder="Enter your full shipping address here..."
              className="w-full border border-slate-200 p-4 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none h-28 resize-none bg-slate-50 focus:bg-white transition-colors"
            />
            <div className="mt-4 flex items-center gap-3">
              <input type="checkbox" id="saveAddr" checked={saveAddress} onChange={e => setSaveAddress(e.target.checked)} className="accent-indigo-600 w-4 h-4" />
              <label htmlFor="saveAddr" className="text-sm text-slate-700 cursor-pointer font-medium">Save address for next time</label>
            </div>
            {saveAddress && (
              <div className="mt-3 animate-in fade-in slide-in-from-top-2">
                <input value={addressLabel} onChange={e => setAddressLabel(e.target.value)} placeholder="Address Label (e.g. My Office)" className="border border-slate-200 p-2 rounded-lg text-sm w-full md:w-1/2 focus:ring-2 focus:ring-indigo-500 outline-none" />
              </div>
            )}
          </div>

          {/* Items */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="font-serif text-xl font-bold text-slate-900 mb-4">Review Items</h3>
            {cart.length === 0 ? <div className="text-slate-500">Cart is empty.</div> : (
              <div className="space-y-6">
                {cart.map((it, idx) => (
                  <div key={it.bookId} className="flex items-center gap-4 border-b border-slate-50 pb-4 last:border-0 last:pb-0">
                    <div className="flex-1">
                      <div className="font-bold text-slate-800 text-lg">{it.title}</div>
                      <div className="text-sm text-slate-500 flex items-center mt-1 gap-3">
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-medium">₹{it.price}</span>
                        <div className="flex items-center border border-slate-200 rounded-md bg-white h-7">
                          <button onClick={() => updateQty(idx, it.qty - 1)} disabled={it.qty <= 1} className="px-2 hover:bg-slate-50 text-slate-500 rounded-l-md disabled:opacity-50">-</button>
                          <div className="px-2 font-semibold text-slate-700 text-xs border-x border-slate-100">{it.qty}</div>
                          <button onClick={() => updateQty(idx, it.qty + 1)} className="px-2 hover:bg-slate-50 text-slate-500 rounded-r-md">+</button>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900 text-lg">₹{round(it.price * it.qty).toFixed(2)}</div>
                      <button onClick={()=> removeItem(idx)} className="text-xs text-red-500 mt-1 hover:underline font-medium">Remove</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Coupons */}
          <div className={`bg-white p-6 rounded-2xl shadow-sm border border-slate-100 ${readyToPay ? 'opacity-50 pointer-events-none' : ''}`}>
             <h3 className="font-serif text-xl font-bold text-slate-900 mb-4">Available Coupons</h3>
             <div className="flex gap-3 mb-6">
                <input value={promoCode} onChange={e=> setPromoCode(e.target.value)} placeholder="Enter promo code" className="border border-slate-200 p-3 rounded-xl flex-1 focus:ring-2 focus:ring-indigo-500 outline-none uppercase" />
                <button onClick={()=>checkPromo()} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-indigo-600 transition-colors">Apply</button>
             </div>
             {promoErr && <div className="text-red-500 text-sm mb-4 bg-red-50 p-3 rounded-lg border border-red-100">⚠️ {promoErr}</div>}
             {promoInfo && <div className="text-emerald-700 text-sm mb-4 bg-emerald-50 p-3 rounded-lg border border-emerald-100">✅ Coupon Applied! You saved ₹{discountAmount.toFixed(2)}</div>}

             <div className="space-y-3">
                {sortedPromotions.map(p => (
                    <div key={p._id} className={`border rounded-xl p-4 flex justify-between items-center transition-all ${p.isEligible ? 'border-slate-200 bg-white' : 'border-slate-100 bg-slate-50 opacity-60'}`}>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-800 tracking-wide">{p.code}</span>
                                {p.isEligible && <span className="text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Eligible</span>}
                            </div>
                            <div className="text-sm text-slate-500 mt-1">{p.name}</div>
                        </div>
                        <div>
                            {p.isEligible ? (
                                <button onClick={() => applyCoupon(p.code)} className="text-sm font-bold text-indigo-600 bg-indigo-50 px-4 py-2 rounded-lg hover:bg-indigo-100 transition-colors">
                                    {promoInfo?.promo?.code === p.code ? 'Applied' : 'Apply'}
                                </button>
                            ) : (
                                <span className="text-xs text-slate-400 font-medium">Locked</span>
                            )}
                        </div>
                    </div>
                ))}
             </div>
          </div>
        </div>

        {/* Right Column: Summary */}
        <aside className="bg-white p-6 rounded-2xl shadow-xl border border-slate-100 h-fit sticky top-24">
          <h4 className="font-serif text-2xl font-bold text-slate-900 mb-6">Order Summary</h4>
          <div className="space-y-3 text-slate-600 mb-6">
            <div className="flex justify-between"><span>Subtotal</span><span className="font-medium">₹{subtotal.toFixed(2)}</span></div>
            {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600"><span>Discount</span><span className="font-medium">-{discountAmount.toFixed(2)}</span></div>
            )}
            <div className="h-px bg-slate-100 my-2"></div>
            <div className="flex justify-between text-xl font-bold text-slate-900"><span>Total</span><span>₹{finalTotal.toFixed(2)}</span></div>
          </div>
          {!readyToPay && (
            <button onClick={initPayment} disabled={cart.length === 0} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all disabled:opacity-50">Proceed to Payment</button>
          )}
          {readyToPay && clientSecret && (
            <div className="mt-4 animate-in fade-in zoom-in-95 duration-300">
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <PaymentForm onSuccess={handlePaymentSuccess} amount={finalTotal} setProcessing={setIsProcessing} />
              </Elements>
              <button onClick={() => setReadyToPay(false)} className="mt-4 w-full text-slate-500 text-sm hover:text-red-500 font-medium transition-colors">Cancel Payment</button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}