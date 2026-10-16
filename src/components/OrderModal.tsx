import React, { useState } from 'react';
import { X, Copy, Check, Upload, ArrowRight, ShieldCheck, MessageCircle, AlertCircle, Clock } from 'lucide-react';
import { Book, SiteSettings, Order } from '../types.js';
import { api } from '../services/api.js';

interface OrderModalProps {
  book: Book;
  settings: SiteSettings;
  onClose: () => void;
  onOrderComplete: (order: Order) => void;
}

export const OrderModal: React.FC<OrderModalProps> = ({
  book,
  settings,
  onClose,
  onOrderComplete
}) => {
  const [step, setStep] = useState<number>(1); // 1: Info/Form, 2: Payment Instructions, 3: Confirmation/WhatsApp
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [whatsappUrl, setWhatsappUrl] = useState('');
  
  const [copiedDetails, setCopiedDetails] = useState(false);
  const [tid, setTid] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofUploadUrl, setProofUploadUrl] = useState('');
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [orderFinalStatus, setOrderFinalStatus] = useState<'under_review' | 'pending'>('under_review');

  const amount = book.salePrice || book.price;

  // Step 2 & 3: Submit Customer Details to create Order
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerEmail.trim()) {
      setErrorMessage('Full name and email address are required.');
      return;
    }
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const res = await api.createOrder({
        customerName,
        customerEmail,
        customerPhone,
        bookId: book.id
      });

      if (res.success && res.order) {
        setCreatedOrder(res.order);
        setWhatsappUrl(res.whatsappUrl);
        setStep(2); // Move to Payment Instructions
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Copy payment details
  const handleCopyPaymentDetails = () => {
    const details = `JazzCash Account: ${settings.jazzcashNumber}\nAccount Title: ${settings.jazzcashAccountTitle}\nAmount: ${amount} ${settings.currency}\nOrder: ${createdOrder?.orderNumber}`;
    navigator.clipboard.writeText(details);
    setCopiedDetails(true);
    setTimeout(() => setCopiedDetails(false), 2500);
  };

  // Proof File Selection
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProofFile(file);
      setIsUploadingProof(true);
      try {
        const res = await api.uploadPaymentProof(file);
        if (res.success && res.url) {
          setProofUploadUrl(res.url);
        }
      } catch (err) {
        console.error('Proof upload error', err);
      } finally {
        setIsUploadingProof(false);
      }
    }
  };

  // Step 5: Handle "Payment Done"
  const handlePaymentDone = async () => {
    if (!createdOrder) return;
    setIsSubmitting(true);
    try {
      const res = await api.submitPaymentDone(createdOrder.orderNumber, {
        proofUrl: proofUploadUrl,
        transactionId: tid.trim(),
        notes: `Paid ${amount} PKR via JazzCash`
      });

      if (res.success) {
        setCreatedOrder(res.order);
        if (res.whatsappUrl) setWhatsappUrl(res.whatsappUrl);
        setOrderFinalStatus('under_review');
        setStep(3); // Go to final confirmation screen
        onOrderComplete(res.order);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit payment details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 5: Handle "Pay Later"
  const handlePayLater = () => {
    if (!createdOrder) return;
    setOrderFinalStatus('pending');
    setStep(3);
    onOrderComplete(createdOrder);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative bg-white w-full max-w-xl border border-[#111111] shadow-2xl p-6 sm:p-8 my-8">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-neutral-500 hover:text-[#111111] p-1 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* STEP 1: Buy Now Order Form */}
        {step === 1 && (
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#666666] font-semibold mb-1">
              <span>Checkout · Step 1 of 3</span>
            </div>
            <h2 className="text-2xl font-bold font-editorial text-[#111111] mb-6">
              Purchase Digital Publication
            </h2>

            {/* Book Summary Card */}
            <div className="flex items-center gap-4 p-4 bg-[#F5F5F5] border border-[#E5E5E5] mb-6">
              <img
                src={book.coverImage}
                alt={book.title}
                className="w-16 h-20 object-contain bg-white border border-[#E5E5E5] p-1 shadow-sm shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-[#111111] truncate">{book.title}</h4>
                <div className="text-xs text-[#666666] mt-0.5">{book.category} · PDF Edition</div>
                <div className="text-base font-bold text-[#111111] mt-1 tabular-nums">
                  Total: {amount} {settings.currency || 'PKR'}
                </div>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2 mb-4">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Customer Details Form */}
            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#111111] uppercase tracking-wider mb-1">
                  Full Name <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Tariq Mehmood"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-[#E5E5E5] focus:border-[#111111] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111111] uppercase tracking-wider mb-1">
                  Gmail / Email Address <span className="text-red-600">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. yourname@gmail.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-[#E5E5E5] focus:border-[#111111] focus:outline-none"
                />
                <span className="text-[11px] text-[#666666] mt-0.5 block">
                  Your Gmail will be attached to your order and sent in the WhatsApp verification message.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111111] uppercase tracking-wider mb-1">
                  WhatsApp / Phone Number <span className="text-neutral-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 03001234567"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-[#E5E5E5] focus:border-[#111111] focus:outline-none"
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-[#111111] hover:bg-neutral-800 text-white text-xs uppercase tracking-widest font-bold transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>Creating Order...</span>
                  ) : (
                    <>
                      <span>Continue to Payment</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 2: JazzCash Payment Instructions & Payment Done / Pay Later */}
        {step === 2 && createdOrder && (
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#666666] font-semibold mb-1">
              <span>Checkout · Step 2 of 3 · Order #{createdOrder.orderNumber}</span>
            </div>
            <h2 className="text-2xl font-bold font-editorial text-[#111111] mb-2">
              JazzCash Payment Instructions
            </h2>
            <p className="text-xs text-[#666666] mb-6">
              Please transfer <span className="font-bold text-[#111111]">{amount} {settings.currency}</span> to the official Soch Wale JazzCash account below.
            </p>

            {/* JazzCash Info Box */}
            <div className="p-5 bg-[#F5F5F5] border border-[#111111] mb-6 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#666666] uppercase tracking-wider font-semibold">Payment Method</span>
                <span className="text-sm font-bold text-red-600 bg-red-50 px-2 py-0.5 border border-red-200">JazzCash</span>
              </div>
              <div className="flex items-center justify-between border-t border-[#E5E5E5] pt-2">
                <span className="text-xs text-[#666666]">Account / Mobile:</span>
                <span className="text-base font-mono font-bold text-[#111111]">{settings.jazzcashNumber}</span>
              </div>
              <div className="flex items-center justify-between border-t border-[#E5E5E5] pt-2">
                <span className="text-xs text-[#666666]">Account Title:</span>
                <span className="text-sm font-bold text-[#111111]">{settings.jazzcashAccountTitle}</span>
              </div>
              <div className="flex items-center justify-between border-t border-[#E5E5E5] pt-2">
                <span className="text-xs text-[#666666]">Order Amount:</span>
                <span className="text-sm font-bold text-[#111111] tabular-nums">{amount} {settings.currency}</span>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleCopyPaymentDetails}
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-[#111111] bg-white border border-[#E5E5E5] hover:border-[#111111] transition-colors"
                >
                  {copiedDetails ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedDetails ? 'Details Copied!' : 'Copy Payment Details'}</span>
                </button>
              </div>
            </div>

            {/* Verification Inputs */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-semibold text-[#111111] uppercase tracking-wider mb-1">
                  JazzCash Transaction ID (TID) / Reference
                </label>
                <input
                  type="text"
                  placeholder="e.g. TID 1234567890"
                  value={tid}
                  onChange={(e) => setTid(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[#E5E5E5] focus:border-[#111111] focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111111] uppercase tracking-wider mb-1">
                  Upload Payment Screenshot / Receipt (Optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full text-xs text-neutral-600 file:mr-3 file:py-1.5 file:px-3 file:border file:border-[#111111] file:text-xs file:font-semibold file:bg-[#F5F5F5] file:text-[#111111] hover:file:bg-[#111111] hover:file:text-white file:transition-colors cursor-pointer"
                />
                {isUploadingProof && (
                  <span className="text-[11px] text-neutral-500 mt-1 block">Uploading screenshot...</span>
                )}
                {proofUploadUrl && (
                  <span className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Screenshot attached successfully
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons: Payment Done vs Pay Later */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handlePaymentDone}
                disabled={isSubmitting || isUploadingProof}
                className="w-full sm:flex-1 py-3 px-4 bg-[#111111] hover:bg-neutral-800 text-white text-xs uppercase tracking-widest font-bold transition-colors disabled:opacity-50 text-center"
              >
                {isSubmitting ? 'Submitting...' : 'Payment Done (Under Review)'}
              </button>

              <button
                type="button"
                onClick={handlePayLater}
                disabled={isSubmitting}
                className="w-full sm:w-auto py-3 px-4 border border-[#111111] text-[#111111] hover:bg-[#F5F5F5] text-xs uppercase tracking-widest font-semibold transition-colors text-center"
              >
                Pay Later
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Order Confirmation & WhatsApp Verification Link */}
        {step === 3 && createdOrder && (
          <div className="text-center py-4">
            <div className="w-12 h-12 bg-neutral-100 border border-[#111111] text-[#111111] flex items-center justify-center mx-auto mb-4">
              {orderFinalStatus === 'under_review' ? (
                <Check className="w-6 h-6" />
              ) : (
                <Clock className="w-6 h-6" />
              )}
            </div>

            <span className="text-xs uppercase tracking-widest text-[#666666] font-semibold block mb-1">
              {orderFinalStatus === 'under_review' ? 'Payment Submitted · Under Review' : 'Order Preserved · Pending Payment'}
            </span>

            <h2 className="text-2xl font-bold font-editorial text-[#111111] mb-2">
              Order #{createdOrder.orderNumber}
            </h2>

            <p className="text-sm text-[#666666] max-w-md mx-auto leading-relaxed mb-6">
              {orderFinalStatus === 'under_review' ? (
                <>
                  Thank you, <strong className="text-[#111111]">{customerName}</strong>! Your JazzCash submission is now Under Review by our administrator. Once verified, your digital PDF will be automatically available in your customer library.
                </>
              ) : (
                <>
                  Your order is saved with status <strong>Pending</strong>. You can complete your JazzCash payment anytime and send the confirmation via WhatsApp.
                </>
              )}
            </p>

            {/* WhatsApp Direct Link (Customer Gmail guaranteed in payload) */}
            {(() => {
              const whatsappNum = settings.whatsappNumber ? settings.whatsappNumber.replace(/[^0-9]/g, '') : '923032226181';
              const messageText = `Assalam-o-Alaikum Soch Wale,
I have placed an order for the following book:

*Order Number:* ${createdOrder.orderNumber}
*Book Title:* ${book.title}
*Total Amount:* ${amount} ${settings.currency}
*Customer Name:* ${customerName}
*Customer Gmail:* ${customerEmail}
${customerPhone ? `*Customer Phone:* ${customerPhone}\n` : ''}*Status:* ${orderFinalStatus === 'under_review' ? 'Payment Done (Under Review)' : 'Pending Payment'}
${tid ? `*JazzCash TID:* ${tid}\n` : ''}
Please verify my JazzCash payment for my Gmail account: ${customerEmail}. Thank you!`;

              const computedWhatsappUrl = whatsappUrl || `https://wa.me/${whatsappNum}?text=${encodeURIComponent(messageText)}`;

              return (
                <div className="p-4 bg-[#F5F5F5] border border-[#E5E5E5] text-left max-w-md mx-auto mb-6 space-y-2">
                  <div className="text-xs font-semibold text-[#111111] flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <MessageCircle className="w-4 h-4 text-emerald-600" />
                      <span>Instant WhatsApp Verification</span>
                    </div>
                    <span className="text-[10px] font-mono bg-emerald-50 text-emerald-800 px-2 py-0.5 border border-emerald-200 rounded">
                      Gmail Attached
                    </span>
                  </div>
                  <p className="text-xs text-[#666666]">
                    Click below to send order confirmation with your Gmail (<strong className="text-[#111111]">{customerEmail}</strong>) directly to Soch Wale on WhatsApp:
                  </p>
                  <a
                    href={computedWhatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-center py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded transition-colors shadow-sm active:scale-95"
                  >
                    Send Order on WhatsApp ({customerEmail})
                  </a>
                </div>
              );
            })()}

            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 bg-[#111111] text-white text-xs uppercase tracking-widest font-semibold hover:bg-neutral-800 transition-colors"
              >
                Done / Close
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
