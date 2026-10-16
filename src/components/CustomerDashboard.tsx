import React, { useState, useEffect } from 'react';
import { User, Order, Book } from '../types.js';
import { api } from '../services/api.js';
import { BookOpen, Download, Clock, CheckCircle2, AlertCircle, ShoppingBag, LogOut, X } from 'lucide-react';

interface CustomerDashboardProps {
  currentUser: User | null;
  onClose?: () => void;
  onLogout: () => void;
  onNavigate: (view: string, param?: string) => void;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({
  currentUser,
  onClose,
  onLogout,
  onNavigate
}) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [entitledBooks, setEntitledBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser) return;
    loadCustomerData();
  }, [currentUser]);

  const loadCustomerData = async () => {
    setIsLoading(true);
    try {
      const [ordersRes, entRes] = await Promise.all([
        api.getCustomerOrders(),
        api.getCustomerEntitlements()
      ]);
      setOrders(ordersRes.orders || []);
      setEntitledBooks(entRes.books || []);
    } catch (err) {
      console.error('Failed to load customer data', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadBook = async (book: Book) => {
    setDownloadingId(book.id);
    setDownloadError(null);
    try {
      const token = localStorage.getItem('sw_auth_token');
      const res = await fetch(`/api/download/book/${book.id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'Failed to download publication.');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = book.fileName || `${book.slug}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      setDownloadError(err.message || 'Error downloading book');
    } finally {
      setDownloadingId(null);
    }
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#E5E5E5] gap-4 mb-8">
        <div>
          <span className="text-xs uppercase tracking-widest text-[#666666] font-semibold">
            Customer Account & Digital Library
          </span>
          <h1 className="text-3xl font-bold font-editorial text-[#111111] mt-1">
            Welcome, {currentUser.name}
          </h1>
          <p className="text-xs text-[#666666] mt-0.5">
            {currentUser.email} {currentUser.phone ? `· ${currentUser.phone}` : ''}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('books')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#111111] border border-[#111111] hover:bg-[#F5F5F5] transition-colors"
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Browse Bookstore</span>
          </button>
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {downloadError && (
        <div className="p-4 bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2 mb-6">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{downloadError}</span>
        </div>
      )}

      {/* Grid: 1. Unlocked Digital Books (Entitlements) */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold font-editorial text-[#111111] flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            <span>Your Unlocked PDF Books</span>
          </h2>
          <span className="text-xs text-[#666666]">{entitledBooks.length} Publications Available</span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-sm text-[#666666] bg-[#F5F5F5]">
            Loading your digital library...
          </div>
        ) : entitledBooks.length === 0 ? (
          <div className="p-8 text-center bg-[#F5F5F5] border border-[#E5E5E5]">
            <BookOpen className="w-10 h-10 text-neutral-400 mx-auto mb-3 opacity-50" />
            <h4 className="text-sm font-bold text-[#111111] mb-1">No verified purchases yet</h4>
            <p className="text-xs text-[#666666] max-w-md mx-auto mb-4">
              When you order a paid publication and JazzCash payment is verified, your PDF download will automatically appear here.
            </p>
            <button
              onClick={() => onNavigate('books')}
              className="px-4 py-2 bg-[#111111] text-white text-xs uppercase tracking-wider font-semibold"
            >
              Explore Bookstore
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {entitledBooks.map(book => (
              <div
                key={book.id}
                className="bg-white border border-[#E5E5E5] p-5 flex flex-col justify-between shadow-sm hover:border-[#111111] transition-colors"
              >
                <div>
                  <div className="aspect-[3/4] bg-[#F5F5F5] mb-4 p-4 flex items-center justify-center border border-[#E5E5E5]">
                    <img
                      src={book.coverImage}
                      alt={book.title}
                      className="w-auto h-full max-h-44 object-contain shadow"
                    />
                  </div>
                  <div className="text-[11px] text-emerald-700 font-semibold uppercase tracking-wider mb-1">
                    Verified Digital Access
                  </div>
                  <h3 className="text-sm font-bold text-[#111111] line-clamp-2 mb-2">
                    {book.title}
                  </h3>
                  <p className="text-xs text-[#666666] line-clamp-2 mb-4">
                    {book.shortDescription}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#F5F5F5]">
                  <button
                    onClick={() => handleDownloadBook(book)}
                    disabled={downloadingId === book.id}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-[#111111] text-white text-xs uppercase tracking-wider font-semibold hover:bg-neutral-800 transition-colors disabled:opacity-50"
                  >
                    <Download className="w-4 h-4" />
                    <span>{downloadingId === book.id ? 'Downloading...' : 'Download PDF'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Grid: 2. Order History */}
      <section>
        <h2 className="text-xl font-bold font-editorial text-[#111111] mb-4">
          Order History & Verification Status
        </h2>

        {isLoading ? (
          <div className="p-8 text-center text-sm text-[#666666] bg-[#F5F5F5]">
            Loading orders...
          </div>
        ) : orders.length === 0 ? (
          <div className="p-6 text-center text-xs text-[#666666] bg-[#F5F5F5] border border-[#E5E5E5]">
            No previous orders found for this email address.
          </div>
        ) : (
          <div className="border border-[#E5E5E5] overflow-x-auto bg-white">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F5F5] border-b border-[#E5E5E5] text-[#111111] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 font-semibold">Order #</th>
                  <th className="py-3 px-4 font-semibold">Publication</th>
                  <th className="py-3 px-4 font-semibold">Date</th>
                  <th className="py-3 px-4 font-semibold">Amount</th>
                  <th className="py-3 px-4 font-semibold">Payment Status</th>
                  <th className="py-3 px-4 font-semibold">Action / Access</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E5]">
                {orders.map(order => (
                  <tr key={order.id} className="hover:bg-neutral-50/50">
                    <td className="py-3 px-4 font-mono font-bold text-[#111111]">
                      {order.orderNumber}
                    </td>
                    <td className="py-3 px-4 font-medium text-[#111111] max-w-xs truncate">
                      {order.bookTitle}
                    </td>
                    <td className="py-3 px-4 text-[#666666]">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 font-bold text-[#111111] tabular-nums">
                      {order.amount} {order.currency}
                    </td>
                    <td className="py-3 px-4">
                      {order.paymentStatus === 'paid' ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                        </span>
                      ) : order.paymentStatus === 'under_review' ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-amber-600">
                          <Clock className="w-3.5 h-3.5" /> Under Review
                        </span>
                      ) : order.paymentStatus === 'rejected' ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-red-600">
                          <AlertCircle className="w-3.5 h-3.5" /> Rejected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-semibold text-neutral-600">
                          <Clock className="w-3.5 h-3.5" /> Pending Payment
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {order.paymentStatus === 'paid' ? (
                        <span className="text-emerald-700 font-semibold">Access Unlocked</span>
                      ) : (
                        <span className="text-[#666666]">Verifying JazzCash</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
