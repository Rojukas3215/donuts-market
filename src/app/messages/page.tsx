'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  Send, 
  MessageSquare, 
  User, 
  Tag, 
  Clock, 
  ExternalLink,
  ShieldAlert,
  ChevronLeft
} from 'lucide-react';
import Link from 'next/link';

function MessagesContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedConv, setSelectedConv] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Get active conversation ID from URL query
  const queryId = searchParams.get('id');

  // Fetch conversations list
  const fetchConversations = async () => {
    try {
      const res = await fetch('/api/conversations');
      const data = await res.json();
      if (res.ok && data.success) {
        setConversations(data.conversations);
        
        // Auto-select conversation if query ID matches
        if (queryId) {
          const matched = data.conversations.find((c: any) => c.id === queryId);
          if (matched) setSelectedConv(matched);
        }
      }
    } catch (err) {
      console.error('Failed to load conversations', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch messages for selected conversation
  const fetchMessages = async (convId: string, silent = false) => {
    if (!silent) setLoadingMessages(true);
    try {
      const res = await fetch(`/api/conversations/${convId}/messages`);
      const data = await res.json();
      if (res.ok && data.success) {
        setMessages(data.messages);
      }
    } catch (err) {
      console.error('Failed to load messages', err);
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchConversations();
  }, [user, queryId]);

  useEffect(() => {
    if (!selectedConv) return;
    fetchMessages(selectedConv.id);

    // Periodically poll for new messages (simulate real-time chat)
    const interval = setInterval(() => {
      fetchMessages(selectedConv.id, true);
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedConv]);

  // Scroll to bottom when messages load
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConv || !newMessage.trim()) return;

    const msgText = newMessage.trim();
    setNewMessage('');

    try {
      const res = await fetch(`/api/conversations/${selectedConv.id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: msgText })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessages(prev => [...prev, data.message]);
        
        // Update last message in conversations list
        setConversations(prev => prev.map(c => {
          if (c.id === selectedConv.id) {
            return { ...c, lastMessage: msgText, updatedAt: new Date().toISOString() };
          }
          return c;
        }));
      }
    } catch (err) {
      console.error('Error sending message', err);
    }
  };

  const handleSelectConv = (conv: any) => {
    setSelectedConv(conv);
    router.push(`/messages?id=${conv.id}`);
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto text-center py-20 space-y-4">
        <ShieldAlert className="h-12 w-12 text-primary mx-auto" />
        <h2 className="text-xl font-bold text-white">Sign In Required</h2>
        <p className="text-muted-foreground text-sm">
          Please sign in to view your messages and chat with traders.
        </p>
        <button
          onClick={() => router.push('/login')}
          className="px-6 py-2 bg-primary text-primary-foreground font-bold rounded-md"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl h-[calc(100vh-170px)] min-h-[500px] overflow-hidden flex shadow-lg">
      
      {/* Left panel: Conversations List */}
      <div className={`w-full md:w-80 shrink-0 border-r border-border/80 flex flex-col ${
        selectedConv ? 'hidden md:flex' : 'flex'
      }`}>
        <div className="p-4 border-b border-border/60">
          <h1 className="text-lg font-bold text-white flex items-center space-x-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            <span>Conversations</span>
          </h1>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-border/30">
          {loading ? (
            <div className="p-4 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex space-x-3 items-center animate-pulse">
                  <div className="h-10 w-10 bg-muted rounded-full"></div>
                  <div className="space-y-2 flex-1">
                    <div className="h-4 w-1/2 bg-muted rounded"></div>
                    <div className="h-3 w-3/4 bg-muted rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No active conversations yet. Visit a listing to contact a seller!
            </div>
          ) : (
            conversations.map((conv) => {
              const isBuyer = conv.buyerId === user.id;
              const chatPartner = isBuyer ? conv.sellerUsername : conv.buyerUsername;
              const isSelected = selectedConv?.id === conv.id;
              
              return (
                <button
                  key={conv.id}
                  onClick={() => handleSelectConv(conv)}
                  className={`w-full p-4 text-left hover:bg-white/5 transition-all flex items-center space-x-3 cursor-pointer ${
                    isSelected ? 'bg-primary/5 border-l-2 border-primary' : ''
                  }`}
                >
                  <img 
                    src={`https://mc-heads.net/avatar/${chatPartner}`} 
                    alt={chatPartner} 
                    className="h-10 w-10 rounded bg-muted border border-border"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h4 className="text-xs font-bold text-white truncate">{chatPartner}</h4>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {new Date(conv.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <div className="text-[10px] text-primary font-semibold truncate leading-none mb-1.5 flex items-center space-x-1">
                      <Tag className="h-2.5 w-2.5 shrink-0" />
                      <span className="truncate">{conv.listingTitle}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {conv.lastMessage || 'Click to view conversation'}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right panel: Chat Area */}
      <div className={`flex-1 flex flex-col bg-slate-950/40 ${
        !selectedConv ? 'hidden md:flex items-center justify-center' : 'flex'
      }`}>
        {selectedConv ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-border bg-card/40 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setSelectedConv(null)}
                  className="p-1.5 hover:bg-white/5 rounded-lg text-muted-foreground hover:text-white md:hidden"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <img 
                  src={`https://mc-heads.net/avatar/${selectedConv.buyerId === user.id ? selectedConv.sellerUsername : selectedConv.buyerUsername}`} 
                  alt="partner" 
                  className="h-9 w-9 rounded bg-muted border border-border"
                />
                <div>
                  <h3 className="text-xs font-bold text-white">
                    {selectedConv.buyerId === user.id ? selectedConv.sellerUsername : selectedConv.buyerUsername}
                  </h3>
                  <Link 
                    href={`/listings/${selectedConv.listingId}`}
                    className="text-[10px] text-primary font-bold hover:underline flex items-center space-x-1"
                  >
                    <Tag className="h-2.5 w-2.5" />
                    <span>Inquiry about: {selectedConv.listingTitle}</span>
                    <ExternalLink className="h-2.5 w-2.5" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Messages Feed */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {loadingMessages ? (
                <div className="space-y-4 animate-pulse">
                  <div className="flex justify-start"><div className="h-10 w-48 bg-muted rounded-xl"></div></div>
                  <div className="flex justify-end"><div className="h-10 w-48 bg-muted rounded-xl"></div></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-20 text-xs text-muted-foreground">
                  Send a message to start the conversation!
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.senderId === user.id;
                  return (
                    <div 
                      key={msg.id} 
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[70%] p-3.5 rounded-xl border text-xs leading-relaxed space-y-1 ${
                        isMe 
                          ? 'bg-primary text-primary-foreground border-primary font-semibold rounded-tr-none' 
                          : 'bg-card text-white border-border rounded-tl-none'
                      }`}>
                        <div className="break-words">{msg.content}</div>
                        <div className={`text-[8px] text-right mt-1 font-semibold ${isMe ? 'text-primary-foreground/75' : 'text-muted-foreground'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Send Area */}
            <form onSubmit={handleSend} className="p-4 bg-card/60 border-t border-border flex space-x-2">
              <input
                type="text"
                placeholder="Type your message here..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="w-full h-10 px-4 bg-input border border-border rounded-lg text-xs text-white focus:border-primary focus:outline-none"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="h-10 w-10 bg-primary disabled:bg-muted text-primary-foreground rounded-lg flex items-center justify-center active:scale-95 transition-all cursor-pointer"
              >
                <Send className="h-4 w-4 stroke-[2.5px]" />
              </button>
            </form>
          </>
        ) : (
          <div className="text-center py-20 text-muted-foreground flex flex-col items-center space-y-2">
            <MessageSquare className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="text-sm font-bold text-white">Select a Conversation</h3>
            <p className="text-xs max-w-xs leading-relaxed">
              Choose a trader from the left panel to display messages and negotiate trades.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="py-20 text-center text-muted-foreground">
        Loading messaging center...
      </div>
    }>
      <Suspense fallback={null}>
        <MessagesContent />
      </Suspense>
    </Suspense>
  );
}
