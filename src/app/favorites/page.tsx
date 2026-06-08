'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  Heart, 
  Tag, 
  Gavel, 
  Clock,
  Inbox,
  ShieldAlert,
  Compass
} from 'lucide-react';
import Link from 'next/link';

export default function FavoritesPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchFavorites = async () => {
    try {
      const res = await fetch('/api/listings/favorites');
      const data = await res.json();
      if (res.ok && data.success) {
        setFavorites(data.listings);
      }
    } catch {
      setError('Failed to load favorites.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchFavorites();
  }, [user]);

  if (!user) {
    return (
      <div className="max-w-md mx-auto text-center py-20 space-y-4">
        <ShieldAlert className="h-12 w-12 text-primary mx-auto" />
        <h2 className="text-xl font-bold text-white">Sign In Required</h2>
        <p className="text-muted-foreground text-sm">
          Please sign in to access your bookmarked favorites.
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
    <div className="space-y-6">
      {/* Header */}
      <div className="pb-3 border-b border-border/60">
        <h1 className="text-xl font-bold text-white flex items-center space-x-2">
          <Heart className="h-5 w-5 text-accent fill-accent" />
          <span>My Favorite Bookmarks</span>
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">Keep track of the items and auctions you're interested in.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-64 bg-card border border-border rounded-xl"></div>
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-border bg-card/10 rounded-2xl p-8 max-w-lg mx-auto">
          <Inbox className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
          <h3 className="text-sm font-bold text-white">No Favorites Yet</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Bookmarks allow you to save items to follow their prices and bids.</p>
          <button
            onClick={() => router.push('/listings')}
            className="mt-4 px-4 py-2 bg-secondary text-white text-xs font-bold rounded-md flex items-center space-x-1.5 mx-auto"
          >
            <Compass className="h-3.5 w-3.5" />
            <span>Browse Marketplace</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {favorites.map((item) => {
            const isAuction = item.type === 'AUCTION';
            return (
              <div key={item.id} className="mc-card rounded-xl overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="aspect-video w-full bg-slate-900 border-b border-border flex items-center justify-center text-4xl select-none relative overflow-hidden">
                    {item.images && item.images.length > 0 ? (
                      <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-5xl">
                        {item.category === 'Spawners' && '🌀'}
                        {item.category === 'Armor' && '🛡️'}
                        {item.category === 'Weapons' && '⚔️'}
                        {item.category === 'Resources' && '💎'}
                        {item.category === 'Kits' && '📦'}
                        {item.category === 'Bases' && '🏰'}
                        {item.category === 'Farms' && '🌾'}
                        {item.category === 'Services' && '🛠️'}
                        {!['Spawners','Armor','Weapons','Resources','Kits','Bases','Farms','Services'].includes(item.category) && '🍪'}
                      </span>
                    )}
                  </div>
                  
                  <div className="p-4 space-y-1">
                    <span className="text-[9px] text-muted-foreground uppercase font-bold">{item.category}</span>
                    <h3 className="text-xs font-bold text-white line-clamp-1">
                      <Link href={`/listings/${item.id}`}>{item.title}</Link>
                    </h3>
                    <p className="text-[11px] text-muted-foreground line-clamp-2">{item.description}</p>
                  </div>
                </div>

                <div className="p-4 pt-0 mt-4">
                  <div className="flex justify-between items-center pt-3 border-t border-border/20">
                    <div>
                      <div className="text-[8px] text-muted-foreground uppercase leading-none">{isAuction ? 'Current Bid' : 'Price'}</div>
                      <div className="text-xs font-black text-primary mt-1">
                        {item.price.toLocaleString()} Dollars
                      </div>
                    </div>
                    <Link 
                      href={`/listings/${item.id}`}
                      className={`px-3 py-1.5 rounded text-xs font-bold flex items-center space-x-1 transition-all active:scale-95 ${
                        isAuction
                          ? 'bg-accent hover:bg-accent/90 text-white'
                          : 'bg-primary hover:bg-primary/95 text-primary-foreground'
                      }`}
                    >
                      {isAuction ? <Gavel className="h-3.5 w-3.5" /> : <Tag className="h-3.5 w-3.5" />}
                      <span>{isAuction ? 'Bid' : 'View'}</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
