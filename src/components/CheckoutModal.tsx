import { useState } from "react";
import { api } from "../lib/api";
import { useStore } from "../lib/store";
import { IconX } from "../components/Icons";

interface CheckoutModalProps {
  courseId: string;
  amount: number;
  currency: 'NGN' | 'USD';
  courseTitle: string;
  onClose: () => void;
}

export default function CheckoutModal({ courseId, amount, currency, courseTitle, onClose }: CheckoutModalProps) {
  const { user, toast, go } = useStore();
  const [method, setMethod] = useState<'card' | 'bank'>('card');
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInitiate = async () => {
    if (!user) {
      toast("Please sign in to continue");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const res = await api.initiatePayment({
        courseId,
        amount,
        method,
        currency
      });
      
      setPaymentData(res.data);
      
      if (method === 'card') {
        // Paystack Integration
        const handler = (window as any).PaystackPop.setup({
          key: 'pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', // REPLACE WITH YOUR PAYSTACK PUBLIC KEY
          email: user.email,
          amount: amount * 100, // Paystack expects amount in kobo/cents
          currency: currency, // Dynamically set to 'NGN' or 'USD'
          reference: res.data.reference,
          onClose: () => {
            toast("Payment window closed");
            setLoading(false);
          },
          callback: (response: any) => {
            toast("Payment successful! Welcome to the course.");
            go({ view: "course", courseId });
          },
        });
        handler.openIframe();
      }
    } catch (e: any) {
      console.error("Payment initiation failed:", e);
      setError(e.message || "Failed to initiate payment. Please try again.");
      toast(e.message || "Failed to initiate payment");
    } finally {
      setLoading(false);
    }
  };

  const handleBankTransferComplete = () => {
    // Opens Telegram to send proof
    const botUsername = "jsagebutlerbot";
    window.open(`https://t.me/${botUsername}?start=PROOF_${paymentData.reference}`, '_blank');
    toast("Please send your payment slip to the bot.");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/90 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-bone/10 bg-coal p-8 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-smoke hover:text-bone">
          <IconX className="h-5 w-5" />
        </button>

        <h3 className="font-display text-2xl font-bold text-bone mb-2">Checkout</h3>
        <p className="text-sm text-smoke mb-6">{courseTitle}</p>

        {/* Payment Method Toggle */}
        <div className="mb-6 flex gap-2 p-1 rounded-lg bg-ink border border-bone/10">
          <button
            onClick={() => { setMethod('card'); setPaymentData(null); setError(null); }}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-md transition-colors ${
              method === 'card' ? 'bg-amber text-ink' : 'text-smoke hover:text-bone'
            }`}
          >
            Pay with Card
          </button>
          <button
            onClick={() => { setMethod('bank'); setPaymentData(null); setError(null); }}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-md transition-colors ${
              method === 'bank' ? 'bg-amber text-ink' : 'text-smoke hover:text-bone'
            }`}
          >
            Bank Transfer
          </button>
        </div>

        <div className="mb-6 text-center">
          <p className="text-xs text-smoke uppercase tracking-widest mb-1">Total Amount</p>
          <p className="font-display text-4xl font-extrabold text-amber">
            {currency === 'NGN' ? '₦' : '$'}{amount.toLocaleString()}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 rounded-lg border border-alert/30 bg-alert/5 p-3 text-sm text-alert">
            {error}
          </div>
        )}

        {/* Bank Transfer Details View */}
        {method === 'bank' && paymentData ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="rounded-lg border border-amber/20 bg-amber/5 p-4 space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-amber mb-2">Bank Transfer Details</p>
              
              <div className="flex justify-between text-sm">
                <span className="text-smoke">Bank Name:</span>
                <span className="font-bold text-bone">First Bank</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-smoke">Account Number:</span>
                <span className="font-mono font-bold text-bone">3085245915</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-smoke">Account Name:</span>
                <span className="font-bold text-bone">Ehichoya Ogbebor Ferguson</span>
              </div>
              
              {currency === 'USD' && (
                <div className="mt-2 p-2 rounded bg-tgsky/10 border border-tgsky/20">
                  <p className="text-[10px] text-tgsky font-bold uppercase">Note for International Students</p>
                  <p className="text-xs text-smoke mt-1">
                    Please use a service like Wise, Sendwave, or your local bank's international transfer to send USD. 
                    Include your reference code in the transfer narration.
                  </p>
                </div>
              )}
              
              <div className="mt-3 pt-3 border-t border-amber/10">
                <p className="text-xs text-smoke mb-1">Your Unique Reference (Include in narration):</p>
                <p className="font-mono text-sm font-bold text-amber bg-amber/10 p-2 rounded text-center">
                  {paymentData.reference}
                </p>
              </div>
            </div>

            <button
              onClick={handleBankTransferComplete}
              className="w-full stripe-btn rounded-md bg-tgsky py-3 font-display text-sm font-extrabold uppercase tracking-widest text-ink hover:bg-tgsky/90 transition-colors"
            >
              I've Sent It, Upload Proof on Telegram →
            </button>
            
            <button
              onClick={() => setPaymentData(null)}
              className="w-full text-xs text-smoke hover:text-bone underline"
            >
              ← Go back
            </button>
          </div>
        ) : (
          /* Initial Pay Button */
          <button
            onClick={handleInitiate}
            disabled={loading}
            className="w-full stripe-btn rounded-md bg-amber py-3 font-display text-sm font-extrabold uppercase tracking-widest text-ink disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-ink border-t-transparent" />
                Processing...
              </>
            ) : method === 'bank' ? (
              "Get Bank Details"
            ) : (
              `Pay ${currency === 'NGN' ? '₦' : '$'}${amount.toLocaleString()} with Card`
            )}
          </button>
        )}
      </div>
    </div>
  );
}