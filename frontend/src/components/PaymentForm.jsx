// src/components/PaymentForm.jsx
import React, { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { toast } from 'react-hot-toast';

// Accept 'setProcessing' prop
export default function PaymentForm({ onSuccess, amount, setProcessing }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    
    // 1. TRIGGER PROCESSING SCREEN
    if (setProcessing) setProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: 'if_required', 
      });

      if (error) {
        // Error: Hide screen and show message
        toast.error(error.message);
        setLoading(false);
        if (setProcessing) setProcessing(false);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Success: KEEP screen open while parent redirects
        // Do NOT setProcessing(false) here
        onSuccess(paymentIntent.id);
      } else {
        toast.error('Payment failed or processing.');
        setLoading(false);
        if (setProcessing) setProcessing(false);
      }
    } catch (err) {
      console.error(err);
      setLoading(false);
      if (setProcessing) setProcessing(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 border-t pt-4">
      <h4 className="font-semibold mb-3 text-lg">Payment Details</h4>
      <p className="text-sm text-gray-600 mb-3">Total to pay: <span className="font-bold">₹{amount}</span></p>
      
      <PaymentElement />
      
      <button 
        disabled={!stripe || loading} 
        className="mt-4 w-full bg-blue-600 text-white py-2 rounded disabled:opacity-50 hover:bg-blue-700 font-semibold transition-colors"
      >
        {loading ? 'Processing...' : `Pay ₹${amount}`}
      </button>
    </form>
  );
}