import { useState, useMemo } from "react";
import { api } from "../lib/api";
import { useStore } from "../lib/store";
import { IconX } from "../components/Icons";

interface CheckoutModalProps {
  courseId: string;
  amount: number;
  ngnAmount: number; // Added to calculate max months accurately
  currency: 'NGN' | 'USD';
  courseTitle: string;
  onClose: () => void;
}

export default function CheckoutModal({ courseId, amount, ngnAmount, currency, courseTitle, onClose }: CheckoutModalProps) {
  const { user, toast, go } = useStore();
  const [method, setMethod] = useState<'card' | 'bank'>('card');
  const [paymentType, setPaymentType] = useState<'full' | 'installment'>('full');
  const [months, setMonths] = useState(2);
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // Calculate max months based on NGN price tiers
  const maxMonths = useMemo(() => {
    if (ngnAmount > 100000) return 5;
    if (ngnAmount > 60000) return 4;
    if (ngnAmount > 30000) return 3;
    if (ngnAmount > 10000) return 2;
    return 1;
  }, [ngnAmount]);

  const monthlyAmount = paymentType === 'installment' ? Math.ceil(amount / months) : amount;
  const currencySymbol = currency === 'NGN' ? '₦' : '$';

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
        amount: monthlyAmount, // For installments, this is the first month's amount
        method,
        currency,
        paymentPlan: paymentType,
        months: paymentType === 'installment' ? months : 1
      });
      
      setPaymentData(res.data);
      
      if (method === 'card') {
        const handler = (window as any).PaystackPop.setup({
          key: 'pk_live_YOUR_ACTUAL_LIVE_PUBLIC_KEY_HERE',
          email: user.email,
          amount: monthlyAmount * 100,
          currency: currency,
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
    const botUsername = "jsagebutlerbot"; // Replace with your actual bot username
    const deepLink = paymentType === 'installment' && paymentData 
      ? `https://t.me/${botUsername}?start=INST_PROOF_${paymentData.reference}` 
      : `https://t.me/${botUsername}?start=PROOF_${paymentData.reference}`;
      
    window.open(deepLink, '_blank');
    toast("Please send your payment slip to the bot.");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/90 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-bone/10 bg-coal p-8 relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-smoke hover:text-bone">
          <IconX className="h-5 w-5" />
        </button>

        <h3 className="font-display text-2xl font-bold text-bone mb-2">Checkout</h3>
        <p className="text-sm text-smoke mb-6">{courseTitle}</p>

        {/* Payment Type Toggle (Full vs Installment) */}
        {maxMonths > 1 && (
          <div className="mb-4 flex gap-2 p-1 rounded-lg bg-ink border border-bone/10">
            <button
              onClick={() => { setPaymentType('full'); setPaymentData(null); }}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-md transition-colors ${
                paymentType === 'full' ? 'bg-amber text-ink' : 'text-smoke hover:text-bone'
              }`}
            >
              Pay in Full
            </button>
            <button
              onClick={() => { setPaymentType('installment'); setPaymentData(null); }}
              className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-md transition-colors ${
                paymentType === 'installment' ? 'bg-amber text-ink' : 'text-smoke hover:text-bone'
              }`}
            >
              Installments (Max {maxMonths} mos)
            </button>
          </div>
        )}

        {/* Installment Month Selector */}
        {paymentType === 'installment' && maxMonths > 1 && (
          <div className="mb-4">
            <label className="text-xs text-smoke uppercase tracking-widest mb-2 block">
              Select Duration: {months} Month{months > 1 ? 's' : ''}
            </label>
            <input
              type="range"
              min="2"
              max={maxMonths}
              value={months}
              onChange={(e) => setMonths(parseInt(e.target.value))}
              className="w-full accent-amber"
            />
            <p className="text-xs text-amber mt-1">
              {currencySymbol}{monthlyAmount.toLocaleString()} / month
            </p>
          </div>
        )}

        {/* Payment Method Toggle (Card vs Bank) */}
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
          <p className="text-xs text-smoke uppercase tracking-widest mb-1">
            {paymentType === 'installment' ? 'First Installment Amount' : 'Total Amount'}
          </p>
          <p className="font-display text-4xl font-extrabold text-amber">
            {currencySymbol}{monthlyAmount.toLocaleString()}
          </p>
          {paymentType === 'installment' && (
            <p className="text-xs text-smoke mt-1">
              Remaining balance will be charged monthly.
            </p>
          )}
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
                    Please use a service like Wise, Sendwave, or your local bank's international transfer. 
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
              `Pay ${currencySymbol}${monthlyAmount.toLocaleString()} with Card`
            )}
          </button>
        )}
      </div>
    </div>
  );
}