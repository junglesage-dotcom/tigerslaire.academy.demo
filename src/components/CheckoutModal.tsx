import { useState } from "react";
import { api } from "../lib/api";
import { useStore } from "../lib/store";
import { IconX } from "./Icons";

interface CheckoutModalProps {
  courseId: string;
  amount: number;
  courseTitle: string;
  onClose: () => void;
}

export default function CheckoutModal({ courseId, amount, courseTitle, onClose }: CheckoutModalProps) {
  const { user, toast, go } = useStore();
  const [method, setMethod] = useState<'card' | 'bank'>('card');
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState<any>(null);

  const handleInitiate = async () => {
    if (!user) {
      toast("Please sign in to continue");
      return;
    }
    setLoading(true);
    try {
      const res = await api.initiatePayment({
        courseId,
        amount,
        method
      });
      setPaymentData(res.data);
      
      if (method === 'card') {
        // Paystack Integration
        const handler = (window as any).PaystackPop.setup({
          key: 'pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', // REPLACE WITH YOUR PAYSTACK PUBLIC KEY
          email: user.email,
          amount: amount * 100, // Paystack expects amount in kobo
          currency: 'NGN',
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
      toast(e.message || "Failed to initiate payment");
    } finally {
      setLoading(false);
    }
  };

  const handleBankTransferComplete = () => {
    // Opens Telegram to send proof
    window.open(`https://t.me/TigersLairBot?start=PROOF_${paymentData.reference}`, '_blank');
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

        <div className="mb-6 flex gap-2 p-1 rounded-lg bg-ink border border-bone/10">
          <button
            onClick={() => setMethod('card')}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-md transition-colors ${
              method === 'card' ? 'bg-amber text-ink' : 'text-smoke hover:text-bone'
            }`}
          >
            Pay with Card
          </button>
          <button
            onClick={() => setMethod('bank')}
            className={`flex-1 py-2 text-xs font-bold uppercase tracking-widest rounded-md transition-colors ${
              method === 'bank' ? 'bg-amber text-ink' : 'text-smoke hover:text-bone'
            }`}
          >
            Bank Transfer
          </button>
        </div>

        <div className="mb-6 text-center">
          <p className="text-xs text-smoke uppercase tracking-widest mb-1">Total Amount</p>
          <p className="font-display text-4xl font-extrabold text-amber">₦{amount.toLocaleString()}</p>
        </div>

        {method === 'bank' && paymentData ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-amber/20 bg-amber/5 p-4 space-y-2">
              <p className="text-xs font-bold uppercase tracking-widest text-amber">Bank Details</p>
              <div className="flex justify-between text-sm">
                <span className="text-smoke">Bank Name:</span>
                <span className="font-bold text-bone">Wema Bank</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-smoke">Account Number:</span>
                <span className="font-bold text-bone">0123456789</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-smoke">Account Name:</span>
                <span className="font-bold text-bone">Tiger's Lair Academy</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-smoke">Reference:</span>
                <span className="font-mono text-xs text-amber">{paymentData.reference}</span>
              </div>
            </div>
            <button
              onClick={handleBankTransferComplete}
              className="w-full stripe-btn rounded-md bg-tgsky py-3 font-display text-sm font-extrabold uppercase tracking-widest text-ink"
            >
              I've Sent It, Upload Proof on Telegram →
            </button>
          </div>
        ) : (
          <button
            onClick={handleInitiate}
            disabled={loading}
            className="w-full stripe-btn rounded-md bg-amber py-3 font-display text-sm font-extrabold uppercase tracking-widest text-ink disabled:opacity-50"
          >
            {loading ? 'Processing...' : `Pay ₦${amount.toLocaleString()}`}
          </button>
        )}
      </div>
    </div>
  );
}