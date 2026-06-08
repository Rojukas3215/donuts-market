'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  ShoppingBag, 
  MessageSquare, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Send,
  Camera,
  Star,
  Shield,
  ThumbsUp,
  FileText
} from 'lucide-react';
import Link from 'next/link';

export default function TradeTicketDetailPage() {
  const { id } = useParams() as { id: string };
  const { user } = useAuth();
  const router = useRouter();

  const [ticket, setTicket] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Messaging & Proof Attach
  const [newMessage, setNewMessage] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [showProofInput, setShowProofInput] = useState(false);
  const [sendingMsg, setSendingMsg] = useState(false);
  
  // Review Form
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Load ticket details & messages
  const fetchTicket = async () => {
    try {
      const res = await fetch(`/api/trades/${id}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setTicket(data.ticket);
      } else {
        setError(data.error || 'Failed to load trade ticket');
      }
    } catch {
      setError('Network error loading trade ticket.');
    }
  };

  const fetchMessages = async (silent = false) => {
    try {
      const res = await fetch(`/api/trades/${id}/messages`);
      const data = await res.json();
      if (res.ok && data.success) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error('Failed to load trade messages', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    
    const init = async () => {
      await fetchTicket();
      await fetchMessages();
    };
    init();

    // Auto refresh chat every 5 seconds
    const interval = setInterval(() => {
      fetchMessages(true);
      fetchTicket(); // sync status changes
    }, 5000);

    return () => clearInterval(interval);
  }, [id, user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const updateTradeStatus = async (newStatus: string) => {
    if (!confirm(`Are you sure you want to change trade status to ${newStatus}?`)) return;

    try {
      const res = await fetch(`/api/trades/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchTicket();
        await fetchMessages();
      } else {
        alert(data.error || 'Failed to update status');
      }
    } catch {
      alert('Error updating status.');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() && !proofUrl.trim()) return;

    setSendingMsg(true);
    const text = newMessage.trim();
    const attachments = proofUrl.trim() ? [proofUrl.trim()] : [];

    setNewMessage('');
    setProofUrl('');
    setShowProofInput(false);

    try {
      const res = await fetch(`/api/trades/${id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text, attachmentUrls: attachments })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessages(prev => [...prev, data.message]);
      }
    } catch (err) {
      console.error('Failed to send message', err);
    } finally {
      setSendingMsg(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewText.trim()) return;

    setSubmittingReview(true);
    setReviewError('');

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tradeTicketId: id,
          rating,
          text: reviewText.trim()
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setReviewSubmitted(true);
      } else {
        setReviewError(data.error || 'Failed to submit review');
      }
    } catch {
      setReviewError('Server error while saving review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-12 space-y-6 animate-pulse">
        <div className="h-6 w-32 bg-muted rounded"></div>
        <div className="h-40 w-full bg-muted rounded-xl"></div>
        <div className="h-[400px] w-full bg-muted rounded-xl"></div>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="max-w-md mx-auto text-center py-20 space-y-4">
        <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
        <h2 className="text-xl font-bold text-white">Ticket Unavailable</h2>
        <p className="text-muted-foreground text-sm">{error || 'Trade ticket not found'}</p>
        <button
          onClick={() => router.push('/messages')}
          className="px-6 py-2 bg-secondary text-white font-bold rounded-md"
        >
          Back to Messages
        </button>
      </div>
    );
  }

  const isBuyer = user?.id === ticket.buyerId;
  const isSeller = user?.id === ticket.sellerId;
  const isAdmin = user?.role === 'ADMIN';
  const partnerName = isBuyer ? ticket.sellerUsername : ticket.buyerUsername;

  // Escrow columns mapping CSS colors
  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    IN_PROGRESS: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    COMPLETED: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    DISPUTED: 'bg-red-500/10 text-red-500 border-red-500/20',
    CANCELLED: 'bg-gray-500/10 text-gray-500 border-gray-500/20'
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Top Header Card */}
      <div className="bg-card border border-border rounded-xl p-5 md:p-6 shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center space-x-3 text-center md:text-left flex-col md:flex-row gap-3">
          <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-base font-black text-white">Trade Ticket #{ticket.id.substring(0, 8)}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Asset: <span className="text-white font-bold">{ticket.listingTitle}</span> &bull; Price: <span className="text-primary font-bold">{ticket.listingPrice.toLocaleString()} Dollars</span>
            </p>
          </div>
        </div>

        {/* Trade Status Badge */}
        <div className="flex items-center space-x-2">
          <span className="text-xs text-muted-foreground">Status:</span>
          <span className={`px-3 py-1 rounded-full text-xs font-extrabold border ${statusColors[ticket.status]}`}>
            {ticket.status}
          </span>
        </div>
      </div>

      {/* Escrow & Payment Preparation Columns (Future Plugin Integration Ready) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Trade status */}
        <div className="bg-card border border-border rounded-xl p-4 flex items-center space-x-3">
          <FileText className="h-5 w-5 text-primary" />
          <div>
            <div className="text-[10px] text-muted-foreground uppercase font-bold">Ticket Progress</div>
            <div className="text-xs font-bold text-white mt-0.5">{ticket.status}</div>
          </div>
        </div>
        
        {/* Escrow status */}
        <div className="bg-card border border-border rounded-xl p-4 flex items-center space-x-3">
          <DollarSign className="h-5 w-5 text-primary" />
          <div>
            <div className="text-[10px] text-muted-foreground uppercase font-bold">Escrow State</div>
            <div className="text-xs font-bold text-white mt-0.5">{ticket.escrowStatus}</div>
          </div>
        </div>

        {/* Payment status */}
        <div className="bg-card border border-border rounded-xl p-4 flex items-center space-x-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          <div>
            <div className="text-[10px] text-muted-foreground uppercase font-bold">Payment Status</div>
            <div className="text-xs font-bold text-white mt-0.5">{ticket.paymentStatus}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Private Trade Chat */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl flex flex-col h-[500px] overflow-hidden shadow-lg">
          <div className="p-4 border-b border-border/60 bg-card/40 flex justify-between items-center">
            <h3 className="text-xs font-bold text-white flex items-center space-x-1.5">
              <MessageSquare className="h-4 w-4 text-primary" />
              <span>Private Trade Chat</span>
            </h3>
            <span className="text-[10px] text-muted-foreground font-semibold">Only you, the other trader, and admins can view this.</span>
          </div>

          {/* Message History Bubble Feed */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-950/20">
            {messages.map((msg) => {
              if (msg.isSystem) {
                return (
                  <div key={msg.id} className="flex justify-center">
                    <div className="bg-slate-900/80 border border-border/80 px-4 py-2 rounded-lg text-[10px] text-muted-foreground font-semibold text-center max-w-md leading-normal shadow">
                      ⚙️ {msg.content}
                    </div>
                  </div>
                );
              }

              const isMe = msg.senderId === user?.id;
              
              return (
                <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  <div className="flex items-center space-x-1 mb-1">
                    {!isMe && (
                      <img 
                        src={`https://mc-heads.net/avatar/${msg.senderUsername}`} 
                        className="h-3.5 w-3.5 rounded-sm bg-muted border border-border/40" 
                        alt="avatar" 
                      />
                    )}
                    <span className="text-[9px] text-muted-foreground font-bold">{msg.senderUsername}</span>
                  </div>
                  
                  <div className={`p-3 rounded-xl border text-xs max-w-[80%] space-y-2 leading-relaxed ${
                    isMe 
                      ? 'bg-primary text-primary-foreground border-primary font-semibold rounded-tr-none' 
                      : 'bg-card text-white border-border rounded-tl-none'
                  }`}>
                    <div>{msg.content}</div>
                    
                    {/* Attachment Render */}
                    {msg.attachmentUrls && msg.attachmentUrls.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-white/10">
                        <span className="text-[9px] font-bold block mb-1 opacity-75">📂 Attachment Proof:</span>
                        <a 
                          href={msg.attachmentUrls[0]} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-1 text-[10px] underline text-white hover:text-accent"
                        >
                          <Camera className="h-3 w-3" />
                          <span>View Evidence Image</span>
                        </a>
                      </div>
                    )}
                  </div>
                  <span className="text-[8px] text-muted-foreground mt-0.5">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              );
            })}
            <div ref={chatEndRef} />
          </div>

          {/* Form input field */}
          <form onSubmit={handleSendMessage} className="p-4 bg-card border-t border-border space-y-2">
            {showProofInput && (
              <div className="flex space-x-2 items-center pb-2 border-b border-border/40 mb-2">
                <Camera className="h-4 w-4 text-primary" />
                <input
                  type="text"
                  placeholder="Paste proof image URL (e.g. Imgur)..."
                  value={proofUrl}
                  onChange={(e) => setProofUrl(e.target.value)}
                  className="w-full bg-input border border-border text-xs px-3 h-8 rounded-md text-white focus:outline-none"
                />
              </div>
            )}

            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setShowProofInput(!showProofInput)}
                className={`h-10 w-10 border rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                  showProofInput ? 'bg-accent/10 border-accent/30 text-accent' : 'bg-input border-border text-muted-foreground hover:text-white'
                }`}
                title="Attach Trade Evidence (Screenshot URL)"
              >
                <Camera className="h-4 w-4" />
              </button>
              
              <input
                type="text"
                placeholder="Negotiate trade details, share cords..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="w-full h-10 px-4 bg-input border border-border rounded-lg text-xs text-white focus:border-primary focus:outline-none"
              />
              <button
                type="submit"
                disabled={sendingMsg || (!newMessage.trim() && !proofUrl.trim())}
                className="h-10 w-10 bg-primary disabled:bg-muted text-primary-foreground rounded-lg flex items-center justify-center active:scale-95 transition-all cursor-pointer"
              >
                <Send className="h-4 w-4 stroke-[2.5px]" />
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Steps & Moderator Actions */}
        <div className="space-y-6">
          
          {/* Action Panel */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-4 shadow-md">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Trade Action Desk</h3>
            
            {ticket.status === 'PENDING' && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  The buyer has requested this trade. To begin, both players must coordinate and start.
                </p>
                {isSeller && (
                  <button
                    onClick={() => updateTradeStatus('IN_PROGRESS')}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all active:scale-95 cursor-pointer"
                  >
                    Accept Trade Request
                  </button>
                )}
                {isBuyer && (
                  <div className="p-3 bg-muted/20 border border-border rounded-lg text-center text-xs text-muted-foreground font-semibold">
                    Waiting for seller to accept request...
                  </div>
                )}
              </div>
            )}

            {ticket.status === 'IN_PROGRESS' && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Trade is in progress. Meet in-game on DonutSMP to hand over the items/coordinates.
                </p>
                
                <button
                  onClick={() => updateTradeStatus('COMPLETED')}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all active:scale-95 cursor-pointer flex items-center justify-center space-x-1.5"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Mark Trade as Completed</span>
                </button>

                <button
                  onClick={() => updateTradeStatus('DISPUTED')}
                  className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition-all active:scale-95 cursor-pointer flex items-center justify-center space-x-1.5"
                >
                  <AlertTriangle className="h-4 w-4" />
                  <span>Dispute Trade (Alert Admin)</span>
                </button>
              </div>
            )}

            {ticket.status === 'DISPUTED' && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-500 rounded-lg space-y-2">
                <div className="flex items-center space-x-1.5 text-xs font-bold">
                  <Shield className="h-4 w-4" />
                  <span>Trade Under Review</span>
                </div>
                <p className="text-[11px] leading-relaxed opacity-90">
                  This trade ticket is currently being investigated by an Admin due to a dispute. Please post all screenshots, coordinates, and conversation history inside the trade chat.
                </p>
                {isAdmin && (
                  <div className="flex gap-2 pt-2 border-t border-red-500/20 mt-2">
                    <button
                      onClick={() => updateTradeStatus('COMPLETED')}
                      className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold"
                    >
                      Resolve Complete
                    </button>
                    <button
                      onClick={() => updateTradeStatus('CANCELLED')}
                      className="flex-1 py-1.5 bg-gray-600 hover:bg-gray-500 text-white rounded text-[10px] font-bold"
                    >
                      Resolve Cancel
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Cancel option in pending */}
            {ticket.status === 'PENDING' && (
              <button
                onClick={() => updateTradeStatus('CANCELLED')}
                className="w-full py-2.5 bg-card hover:bg-white/5 border border-border text-muted-foreground hover:text-white rounded-lg text-xs font-bold transition-all active:scale-95 cursor-pointer"
              >
                Cancel Trade Ticket
              </button>
            )}

            {ticket.status === 'CANCELLED' && (
              <div className="p-4 bg-muted/20 border border-border rounded-lg text-center text-xs text-muted-foreground font-bold">
                ❌ This trade was cancelled.
              </div>
            )}

            {ticket.status === 'COMPLETED' && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 rounded-lg text-center text-xs font-bold flex flex-col items-center gap-1">
                <CheckCircle2 className="h-5 w-5" />
                <span>Trade successfully completed!</span>
              </div>
            )}
          </div>

          {/* Post-Trade Reputation Review System */}
          {ticket.status === 'COMPLETED' && (
            <div className="bg-card border border-border rounded-xl p-5 space-y-4 shadow-md">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center space-x-1.5">
                <Star className="h-4 w-4 text-primary fill-primary" />
                <span>Leave Trade Review</span>
              </h3>

              {reviewSubmitted ? (
                <div className="p-3 bg-green-500/10 border border-green-500/30 text-green-500 rounded-lg text-xs font-bold flex items-center space-x-2">
                  <ThumbsUp className="h-4 w-4" />
                  <span>Review submitted successfully!</span>
                </div>
              ) : (
                <form onSubmit={handleReviewSubmit} className="space-y-3">
                  {reviewError && (
                    <div className="p-2.5 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-xs">
                      {reviewError}
                    </div>
                  )}

                  {/* Rating selection */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Rate {partnerName}</label>
                    <div className="flex space-x-1 pt-1">
                      {[1, 2, 3, 4, 5].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setRating(val)}
                          className="p-1 hover:scale-110 transition-all cursor-pointer"
                        >
                          <Star 
                            className={`h-6 w-6 ${
                              val <= rating ? 'fill-primary text-primary' : 'text-muted-foreground hover:text-white'
                            }`} 
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Review Text */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-muted-foreground uppercase">Review Comments</label>
                    <textarea
                      required
                      rows={3}
                      placeholder={`Describe your transaction with ${partnerName}. Was the coordinate/item legit?`}
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      className="w-full p-3 bg-input border border-border rounded-lg text-xs text-white focus:outline-none resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="w-full py-2 bg-primary hover:bg-primary/95 text-primary-foreground text-xs font-extrabold rounded-lg transition-all"
                  >
                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Trade Info Guide */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-2 text-xs text-muted-foreground leading-relaxed">
            <span className="font-bold text-white block mb-1">Trading Protocol:</span>
            1. Coordinate a meetup location inside DonutSMP server using the private chat.
            <br />
            2. For items: exchange items securely.
            <br />
            3. For coordinates/services: wait for verification before marking the trade complete.
            <br />
            4. Report any scams immediately using the dispute button.
          </div>
        </div>
      </div>
    </div>
  );
}
