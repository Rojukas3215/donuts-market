'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  Bell, 
  MessageSquare, 
  Gavel, 
  ShoppingBag, 
  Star, 
  Award, 
  Clock, 
  Check, 
  Trash2,
  ShieldAlert,
  Inbox
} from 'lucide-react';
import Link from 'next/link';

export default function NotificationsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      if (res.ok && data.success) {
        setNotifications(data.notifications);
      }
    } catch {
      setError('Failed to fetch notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
  }, [user]);

  const handleMarkAllRead = async () => {
    if (notifications.length === 0) return;

    try {
      const res = await fetch('/api/notifications', { method: 'PUT' });
      if (res.ok) {
        // Update local state
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto text-center py-20 space-y-4">
        <ShieldAlert className="h-12 w-12 text-primary mx-auto" />
        <h2 className="text-xl font-bold text-white">Sign In Required</h2>
        <p className="text-muted-foreground text-sm">
          Please sign in to access your notification center.
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

  // Helper mapping icon categories
  const getNotificationConfig = (type: string) => {
    switch (type) {
      case 'MESSAGE':
        return { icon: MessageSquare, color: 'text-blue-500 bg-blue-500/10 border-blue-500/20' };
      case 'OUTBID':
        return { icon: Gavel, color: 'text-accent bg-accent/10 border-accent/20' };
      case 'AUCTION_WON':
        return { icon: Award, color: 'text-accent bg-accent/10 border-accent/20' };
      case 'REVIEW':
        return { icon: Star, color: 'text-purple-500 bg-purple-500/10 border-purple-500/20' };
      case 'LISTING_SOLD':
      case 'TRADE_UPDATE':
        return { icon: ShoppingBag, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' };
      default:
        return { icon: Bell, color: 'text-primary bg-primary/10 border-primary/20' };
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex justify-between items-center pb-3 border-b border-border/60">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center space-x-2">
            <Bell className="h-5 w-5 text-primary" />
            <span>Notification Center</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">Keep track of your bids, trades, messages, and reviews.</p>
        </div>

        {notifications.some(n => !n.read) && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-secondary hover:bg-secondary/80 text-white text-xs font-bold transition-all active:scale-95 cursor-pointer"
          >
            <Check className="h-3.5 w-3.5" />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      {/* Alert Feed */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 w-full bg-muted rounded-xl"></div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border bg-card/10 rounded-2xl p-8">
          <Inbox className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
          <h3 className="text-sm font-bold text-white">No Notifications</h3>
          <p className="text-xs text-muted-foreground mt-0.5">We will alert you when you receive bids, messages, or trade updates!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => {
            const { icon: Icon, color } = getNotificationConfig(notif.type);
            
            const timeAgo = new Date(notif.createdAt).toLocaleDateString([], {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            const content = (
              <div className={`p-4 rounded-xl border flex items-start space-x-3 transition-all ${
                notif.read 
                  ? 'bg-card/50 border-border/60 opacity-75 hover:opacity-95' 
                  : 'bg-card border-border hover:border-primary/40 shadow'
              }`}>
                {/* Icon wrapper */}
                <div className={`h-9 w-9 rounded-lg border flex items-center justify-center shrink-0 ${color}`}>
                  <Icon className="h-4.5 w-4.5" />
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex justify-between items-baseline gap-2">
                    <h4 className={`text-xs font-bold truncate ${notif.read ? 'text-muted-foreground' : 'text-white'}`}>
                      {notif.title}
                    </h4>
                    <span className="text-[10px] text-muted-foreground shrink-0 flex items-center space-x-1">
                      <Clock className="h-3 w-3" />
                      <span>{timeAgo}</span>
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground leading-normal">
                    {notif.content}
                  </p>
                </div>

                {/* Unread indicator */}
                {!notif.read && (
                  <span className="h-2 w-2 rounded-full bg-accent shrink-0 mt-1.5"></span>
                )}
              </div>
            );

            return notif.link ? (
              <Link href={notif.link} key={notif.id} className="block cursor-pointer">
                {content}
              </Link>
            ) : (
              <div key={notif.id}>{content}</div>
            );
          })}
        </div>
      )}
    </div>
  );
}
