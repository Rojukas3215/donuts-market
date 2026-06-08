'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { 
  User, 
  Star, 
  Award, 
  Clock, 
  MapPin, 
  ShieldAlert,
  Calendar,
  MessageSquare,
  Tag,
  ThumbsUp,
  Inbox
} from 'lucide-react';

export default function UserProfilePage() {
  const { username } = useParams() as { username: string };
  const { user: currentUser } = useAuth();
  const router = useRouter();

  const [profileData, setProfileData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'listings' | 'reviews'>('listings');

  const fetchProfile = async () => {
    try {
      const res = await fetch(`/api/users/${username}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setProfileData(data);
      } else {
        setError(data.error || 'Failed to load profile');
      }
    } catch {
      setError('Network error loading profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [username]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-12 space-y-6 animate-pulse">
        <div className="flex flex-col md:flex-row gap-6 items-center">
          <div className="h-24 w-24 bg-muted rounded-full"></div>
          <div className="space-y-3 flex-1">
            <div className="h-6 w-48 bg-muted rounded"></div>
            <div className="h-4 w-32 bg-muted rounded"></div>
          </div>
        </div>
        <div className="h-10 w-full bg-muted rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-40 bg-muted rounded-xl"></div>
          <div className="h-40 bg-muted rounded-xl"></div>
          <div className="h-40 bg-muted rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="max-w-md mx-auto text-center py-20 space-y-4">
        <ShieldAlert className="h-12 w-12 text-destructive mx-auto" />
        <h2 className="text-xl font-bold text-white">Profile Unavailable</h2>
        <p className="text-muted-foreground text-sm">{error || 'This profile does not exist.'}</p>
        <button
          onClick={() => router.push('/listings')}
          className="px-6 py-2 bg-secondary text-white font-bold rounded-md"
        >
          Back to Marketplace
        </button>
      </div>
    );
  }

  const { profile, listings, reviews } = profileData;
  const isOwnProfile = currentUser?.id === profile.userId;

  const memberSince = new Date(profile.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long'
  });

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Top Banner Profile Card */}
      <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-lg relative overflow-hidden flex flex-col md:flex-row items-center md:items-start text-center md:text-left gap-6">
        
        {/* Avatar */}
        <div className="relative shrink-0">
          <img 
            src={profile.avatarUrl} 
            alt={profile.minecraftUsername} 
            className="h-24 w-24 rounded-2xl bg-slate-900 border-2 border-border shadow-md"
          />
          {profile.verified && (
            <div 
              className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1.5 rounded-full border-2 border-card shadow"
              title="Verified Trader Badge"
            >
              <Award className="h-4 w-4" />
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="space-y-3 flex-1">
          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 justify-center md:justify-start">
            <h1 className="text-2xl font-black text-white">{profile.minecraftUsername}</h1>
            
            <div className="flex gap-2 justify-center">
              {profile.verified && (
                <span className="px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  Verified Trader
                </span>
              )}
              {isOwnProfile && (
                <span className="px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase bg-primary/10 text-primary border border-primary/20">
                  You
                </span>
              )}
            </div>
          </div>

          <p className="text-xs text-muted-foreground flex items-center justify-center md:justify-start gap-1">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            <span>Member since {memberSince}</span>
          </p>

          {profile.discordUsername && (
            <p className="text-xs bg-slate-900 px-3 py-1.5 rounded-md inline-flex items-center space-x-1.5 border border-border">
              <span className="text-muted-foreground">Discord:</span>
              <span className="text-white font-semibold">{profile.discordUsername}</span>
            </p>
          )}
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-4 shrink-0 w-full md:w-auto">
          <div className="bg-slate-900 border border-border rounded-xl px-4 py-3 text-center">
            <div className="text-[10px] font-bold text-muted-foreground uppercase leading-none">Completed Trades</div>
            <div className="text-lg font-black text-white mt-1">{profile.completedTrades}</div>
          </div>

          <div className="bg-slate-900 border border-border rounded-xl px-4 py-3 text-center">
            <div className="text-[10px] font-bold text-muted-foreground uppercase leading-none">Rating Score</div>
            <div className="text-lg font-black text-primary flex items-center justify-center space-x-1 mt-1">
              <span>{profile.averageRating > 0 ? profile.averageRating.toFixed(1) : '—'}</span>
              <Star className="h-4 w-4 fill-primary text-primary" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="border-b border-border/80 flex items-center space-x-6">
        <button
          onClick={() => setActiveTab('listings')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'listings'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-white'
          }`}
        >
          Active Listings ({listings.length})
        </button>
        <button
          onClick={() => setActiveTab('reviews')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${
            activeTab === 'reviews'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-white'
          }`}
        >
          Reputation Reviews ({reviews.length})
        </button>
      </div>

      {/* Active Listings Grid */}
      {activeTab === 'listings' && (
        <div>
          {listings.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-border rounded-2xl bg-card/10">
              <Inbox className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <h3 className="text-sm font-bold text-white">No Active Listings</h3>
              <p className="text-xs text-muted-foreground mt-0.5">This user has no active listings on the market.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {listings.map((item: any) => {
                const isAuction = item.type === 'AUCTION';
                return (
                  <div key={item.id} className="mc-card rounded-xl overflow-hidden flex flex-col justify-between">
                    <div>
                      {/* Image Box */}
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
                        <span className="text-[10px] text-muted-foreground uppercase font-bold">{item.category}</span>
                        <h3 className="text-sm font-bold text-white line-clamp-1">
                          <Link href={`/listings/${item.id}`}>{item.title}</Link>
                        </h3>
                        <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                      </div>
                    </div>

                    <div className="p-4 pt-0 border-t border-border/20 flex items-center justify-between mt-4">
                      <div>
                        <div className="text-[9px] text-muted-foreground uppercase">{isAuction ? 'Min Bid' : 'Price'}</div>
                        <div className="text-sm font-black text-primary">
                          {item.price.toLocaleString()} Dollars
                        </div>
                      </div>
                      <Link 
                        href={`/listings/${item.id}`}
                        className="px-3 py-1.5 rounded text-xs font-bold bg-secondary hover:bg-secondary/80 text-white"
                      >
                        Details
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Reviews Tab */}
      {activeTab === 'reviews' && (
        <div className="space-y-4">
          {reviews.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-border rounded-2xl bg-card/10">
              <ThumbsUp className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <h3 className="text-sm font-bold text-white">No Reviews Yet</h3>
              <p className="text-xs text-muted-foreground mt-0.5">This user hasn't received any reputation reviews yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reviews.map((rev: any) => (
                <div key={rev.id} className="bg-card border border-border rounded-xl p-5 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    {/* Review Header */}
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-2">
                        <img 
                          src={`https://mc-heads.net/avatar/${rev.reviewerUsername}`} 
                          className="h-5 w-5 rounded-sm bg-muted" 
                          alt={rev.reviewerUsername} 
                        />
                        <span className="text-xs font-bold text-white">{rev.reviewerUsername}</span>
                      </div>
                      
                      {/* Star Rating */}
                      <div className="flex items-center space-x-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`h-3 w-3 ${
                              i < rev.rating ? 'fill-primary text-primary' : 'text-muted'
                            }`} 
                          />
                        ))}
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed">
                      "{rev.text}"
                    </p>
                  </div>

                  <div className="text-[10px] text-muted-foreground pt-2 border-t border-border/20 flex justify-between items-center">
                    <span>Trade Ticket Completed</span>
                    <span>{new Date(rev.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
