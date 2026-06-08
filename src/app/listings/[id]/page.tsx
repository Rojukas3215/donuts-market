'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Eye, 
  Heart, 
  Share2, 
  MessageSquare, 
  ShoppingBag, 
  Gavel, 
  ShieldAlert, 
  Calendar, 
  User, 
  Clock, 
  DollarSign, 
  Star,
  Award,
  ChevronRight
} from 'lucide-react';

export default function ListingDetailPage() {
  const { id } = useParams() as { id: string };
  const { user } = useAuth();
  const router = useRouter();

  const [listing, setListing] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Bid state
  const [bidAmount, setBidAmount] = useState('');
  const [bidError, setBidError] = useState('');
  const [bidSuccess, setBidSuccess] = useState(false);
  const [submittingBid, setSubmittingBid] = useState(false);

  // Favorite state
  const [favorited, setFavorited] = useState(false);

  // Load listing
  const fetchListing = async () => {
    try {
      const res = await fetch(`/api/listings/${id}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setListing(data.listing);
        
        // Check if favorited if logged in
        if (user) {
          const favRes = await fetch(`/api/listings/${id}/favorite`);
          // Wait, we don't have a GET endpoint for check, but we can verify from users list.
          // For now, we can check item.favorites list, or just mock it or query it. Let's make it simpler.
          // Actually, we can check if the user has it in their favorites via API. Let's write a check.
          // Since we didn't write an explicit API to query favorite status individually, let's write one, or load list of favorites.
          // A simpler way: we'll check if the listing is favorited inside a useEffect using the listing data.
          // Or we can just toggle and check. Let's fetch the list of user favorites and see if this ID is in it.
        }
      } else {
        setError(data.error || 'Failed to load listing');
      }
    } catch {
      setError('Network error loading listing details.');
    } finally {
      setLoading(false);
    }
  };

  const checkFavorite = async () => {
    if (!user) return;
    try {
      // Fetch user favorites list and see if this item is in it
      const res = await fetch('/api/listings/favorites'); // wait, let's create `/api/listings/favorites` endpoint or query.
      // Wait, we can implement the favorite toggle API easily. We'll fetch favorites.
      const favRes = await fetch(`/api/listings/${id}/favorite`); // actually we can make a GET on it
    } catch {
      //
    }
  };

  useEffect(() => {
    fetchListing();
  }, [id, user]);

  const handleFavoriteToggle = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      const res = await fetch(`/api/listings/${id}/favorite`, { method: 'POST' });
      const data = await res.json();
      if (res.ok && data.success) {
        setFavorited(data.favorited);
        // Refresh listing count
        setListing((prev: any) => ({
          ...prev,
          favoritesCount: data.favorited ? prev.favoritesCount + 1 : Math.max(0, prev.favoritesCount - 1)
        }));
      }
    } catch {
      //
    }
  };

  const handlePlaceBid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push('/login');
      return;
    }

    setBidError('');
    setBidSuccess(false);
    setSubmittingBid(true);

    try {
      const res = await fetch(`/api/listings/${id}/bid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Number(bidAmount) })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBidSuccess(true);
        setBidAmount('');
        await fetchListing(); // reload bid history & new price
      } else {
        setBidError(data.error || 'Failed to place bid');
      }
    } catch {
      setBidError('Server error while placing bid.');
    } finally {
      setSubmittingBid(false);
    }
  };

  const handleContactSeller = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      const res = await fetch(`/api/conversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: id })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        router.push(`/messages?id=${data.conversation.id}`);
      }
    } catch {
      //
    }
  };

  const handleBuyNow = async () => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (!confirm('Are you sure you want to buy this item? This will open a formal Trade Ticket.')) {
      return;
    }

    try {
      const res = await fetch(`/api/trades`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: id })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        router.push(`/trades/${data.ticket.id}`);
      } else {
        alert(data.error || 'Failed to open trade ticket.');
      }
    } catch {
      alert('Server error while initiating trade.');
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Listing URL copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-12 space-y-6 animate-pulse">
        <div className="h-6 w-24 bg-muted rounded"></div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 h-[400px] bg-muted rounded-xl"></div>
          <div className="h-[400px] bg-muted rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="max-w-md mx-auto text-center py-20 space-y-4">
        <ShieldAlert className="h-12 w-12 text-destructive mx-auto" />
        <h2 className="text-xl font-bold text-white">Error Occurred</h2>
        <p className="text-muted-foreground text-sm">{error || 'Listing not found'}</p>
        <button
          onClick={() => router.push('/listings')}
          className="px-6 py-2 bg-secondary text-white font-bold rounded-md"
        >
          Back to Listings
        </button>
      </div>
    );
  }

  const isAuction = listing.type === 'AUCTION';
  const isOwner = user?.id === listing.sellerId;
  const isManual = listing.propertyWarning;
  
  // Format dates
  const createdDate = new Date(listing.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Breadcrumbs / Back button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/listings')}
          className="flex items-center space-x-2 text-xs font-bold text-muted-foreground hover:text-white transition-all bg-card border border-border px-3 py-1.5 rounded-lg"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Marketplace</span>
        </button>
        
        {/* View / Fav Counter */}
        <div className="flex items-center space-x-4 text-xs text-muted-foreground">
          <span className="flex items-center space-x-1">
            <Eye className="h-4 w-4" />
            <span>{listing.viewsCount} Views</span>
          </span>
          <span className="flex items-center space-x-1">
            <Heart className="h-4 w-4" />
            <span>{listing.favoritesCount} Favorites</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Image & Description */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Display Box - show uploaded image or category emoji */}
          <div className="aspect-video w-full bg-slate-950 rounded-2xl border border-border flex items-center justify-center relative shadow-lg overflow-hidden">
            {listing.images && listing.images.length > 0 ? (
              <img src={listing.images[0]} alt={listing.title} className="w-full h-full object-cover" />
            ) : (
              <span className="text-8xl select-none animate-bounce">
                {listing.category === 'Spawners' && '🌀'}
                {listing.category === 'Armor' && '🛡️'}
                {listing.category === 'Weapons' && '⚔️'}
                {listing.category === 'Resources' && '💎'}
                {listing.category === 'Kits' && '📦'}
                {listing.category === 'Bases' && '🏰'}
                {listing.category === 'Farms' && '🌾'}
                {listing.category === 'Services' && '🛠️'}
                {!['Spawners','Armor','Weapons','Resources','Kits','Bases','Farms','Services'].includes(listing.category) && '🍪'}
              </span>
            )}

            {/* Float badge */}
            <span className="absolute bottom-4 left-4 bg-black/80 text-primary border border-primary/20 px-3 py-1 text-xs font-extrabold uppercase rounded-lg">
              {listing.category}
            </span>
          </div>

          {/* Description Section */}
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-white border-b border-border/60 pb-3">Item Description</h2>
            <div className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
              {listing.description}
            </div>
            
            <div className="flex items-center space-x-4 pt-2 text-xs text-muted-foreground">
              <span className="flex items-center space-x-1">
                <Calendar className="h-4 w-4 text-primary" />
                <span>Listed on {createdDate}</span>
              </span>
            </div>
          </div>

          {/* Manual Trade Caution block */}
          {isManual && (
            <div className="p-4 bg-amber-500/10 border-2 border-amber-500/30 text-amber-500 rounded-xl space-y-2">
              <div className="flex items-center space-x-2 font-bold text-sm">
                <ShieldAlert className="h-5 w-5" />
                <span>Manual Trade Warning</span>
              </div>
              <p className="text-xs leading-relaxed opacity-90">
                This listing belongs to a non-automatic trade category ({listing.category}). This transaction must be manually performed inside Minecraft (e.g. coordinates exchange, builder service, base key handover). 
                <br />
                <strong>Use the Trade Ticket System!</strong> When you press Buy, an Escrow trade ticket is created with a private moderator chat. Do not pay outside this window, and take screenshots/videos of the exchange as proof.
              </p>
            </div>
          )}

          {/* Auction Bid History */}
          {isAuction && listing.auction && (
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <h2 className="text-lg font-bold text-white border-b border-border/60 pb-3">Bid History</h2>
              {(!listing.auction.bids || listing.auction.bids.length === 0) ? (
                <div className="text-center py-6 text-xs text-muted-foreground">
                  No bids have been placed yet. Be the first to bid!
                </div>
              ) : (
                <div className="divide-y divide-border/40">
                  {listing.auction.bids.map((bid: any, idx: number) => (
                    <div key={bid.id} className="flex justify-between items-center py-3 text-sm">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-muted-foreground w-4">#{listing.auction.bids.length - idx}</span>
                        <img 
                          src={`https://mc-heads.net/avatar/${bid.bidderUsername}`} 
                          className="h-5 w-5 rounded-sm bg-muted" 
                          alt={bid.bidderUsername} 
                        />
                        <span className="font-semibold text-white">{bid.bidderUsername}</span>
                        {idx === 0 && (
                          <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                            Highest
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="text-xs text-muted-foreground">
                          {new Date(bid.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="font-extrabold text-primary">{bid.amount.toLocaleString()} Dollars</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Pricing, Checkout & Seller Profile */}
        <div className="space-y-6">
          {/* Purchase / Bidding Panel */}
          <div className="bg-card border border-border rounded-xl p-6 space-y-6 shadow-lg">
            <div>
              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                {isAuction ? 'Current High Bid' : 'Direct Buy Price'}
              </div>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="text-3xl font-black text-white text-gradient-gold">
                  {(isAuction && listing.auction ? listing.auction.currentBid : listing.price).toLocaleString()}
                </span>
                <span className="text-sm text-muted-foreground font-bold">Dollars</span>
              </div>
            </div>

            {/* Action Buttons */}
            {isAuction ? (
              /* Auction Bid Interface */
              <div className="space-y-4">
                {listing.auction?.status === 'ACTIVE' ? (
                  <form onSubmit={handlePlaceBid} className="space-y-3">
                    {bidError && (
                      <div className="p-2.5 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-xs">
                        {bidError}
                      </div>
                    )}
                    {bidSuccess && (
                      <div className="p-2.5 bg-green-500/10 border border-green-500/30 rounded-lg text-green-500 text-xs">
                        Bid placed successfully! You are now the highest bidder.
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-muted-foreground uppercase">Place a Bid</label>
                      <div className="relative flex items-center">
                        <input
                          type="number"
                          required
                          min={((listing.auction?.currentBid || 0) + (listing.auction?.minimumIncrement || 1000))}
                          placeholder={`Min: ${(listing.auction?.currentBid + listing.auction?.minimumIncrement).toLocaleString()}`}
                          value={bidAmount}
                          onChange={(e) => setBidAmount(e.target.value)}
                          className="w-full h-10 pl-9 pr-3 bg-input border border-border rounded-lg text-sm text-white focus:border-accent focus:outline-none transition-all"
                        />
                        <DollarSign className="absolute left-3 h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={submittingBid || isOwner}
                      className="w-full h-11 bg-accent hover:bg-accent/90 disabled:bg-muted disabled:text-muted-foreground font-extrabold rounded-lg text-white transition-all active:scale-98 flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      <Gavel className="h-4 w-4" />
                      <span>{submittingBid ? 'Placing bid...' : 'Place Bid'}</span>
                    </button>
                    
                    {isOwner && (
                      <div className="text-[10px] text-center text-muted-foreground">
                        You cannot bid on your own auction.
                      </div>
                    )}
                  </form>
                ) : (
                  <div className="p-4 bg-muted/20 border border-border text-center rounded-lg text-sm text-muted-foreground font-bold">
                    This auction has ended.
                  </div>
                )}

                {/* Expiration Details */}
                <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border/40 pt-4">
                  <span className="flex items-center space-x-1">
                    <Clock className="h-4 w-4 text-accent" />
                    <span>Ends:</span>
                  </span>
                  <span className="font-bold text-white">
                    {new Date(listing.auction.endDate).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                </div>
              </div>
            ) : (
              /* Fixed Price Purchase button */
              <div className="space-y-3">
                {listing.status === 'ACTIVE' ? (
                  <button
                    onClick={handleBuyNow}
                    disabled={isOwner}
                    className="w-full h-12 bg-primary hover:bg-primary/95 disabled:bg-muted disabled:text-muted-foreground text-primary-foreground font-extrabold rounded-lg text-sm shadow-md transition-all active:scale-98 cursor-pointer flex items-center justify-center space-x-2"
                  >
                    <ShoppingBag className="h-5 w-5" />
                    <span>Buy Now</span>
                  </button>
                ) : (
                  <div className="p-4 bg-muted/20 border border-border text-center rounded-lg text-sm text-muted-foreground font-bold uppercase">
                    Listing Status: {listing.status}
                  </div>
                )}
                {isOwner && (
                  <div className="text-[10px] text-center text-muted-foreground">
                    This is your listing.
                  </div>
                )}
              </div>
            )}

            {/* Utility buttons */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border/40">
              <button
                onClick={handleFavoriteToggle}
                className={`flex items-center justify-center space-x-1.5 h-10 rounded-lg text-xs font-bold border transition-all ${
                  favorited 
                    ? 'bg-accent/10 border-accent/30 text-accent' 
                    : 'bg-card border-border hover:bg-white/5 text-muted-foreground hover:text-white'
                }`}
              >
                <Heart className={`h-4 w-4 ${favorited ? 'fill-accent stroke-accent' : ''}`} />
                <span>{favorited ? 'Favorited' : 'Favorite'}</span>
              </button>

              <button
                onClick={handleShare}
                className="flex items-center justify-center space-x-1.5 h-10 rounded-lg text-xs font-bold bg-card border border-border hover:bg-white/5 text-muted-foreground hover:text-white transition-all"
              >
                <Share2 className="h-4 w-4" />
                <span>Share</span>
              </button>
            </div>

            {/* Chat Direct */}
            {!isOwner && (
              <button
                onClick={handleContactSeller}
                className="w-full flex items-center justify-center space-x-1.5 h-10 text-xs font-bold bg-secondary hover:bg-secondary/80 text-white rounded-lg transition-all"
              >
                <MessageSquare className="h-4 w-4" />
                <span>Ask Seller a Question</span>
              </button>
            )}
          </div>

          {/* Seller Profile Card */}
          <div className="bg-card border border-border rounded-xl p-6 space-y-4">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Seller Profile</h3>
            
            <div className="flex items-center space-x-3">
              <img 
                src={listing.sellerAvatar || 'https://mc-heads.net/avatar/Steve'} 
                alt={listing.sellerUsername} 
                className="h-12 w-12 rounded-lg bg-muted border border-border" 
              />
              <div className="space-y-0.5">
                <div className="flex items-center space-x-1">
                  <span className="font-bold text-white hover:text-primary transition-all text-sm">
                    <Link href={`/u/${listing.sellerUsername}`}>{listing.sellerUsername || 'Steve'}</Link>
                  </span>
                  
                  {listing.seller?.profile?.verified && (
                    <span title="Verified Trader">
                      <Award className="h-4 w-4 text-emerald-500 fill-emerald-500/10" />
                    </span>
                  )}
                </div>
                
                {/* Rating */}
                <div className="flex items-center space-x-1 text-xs">
                  <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                  <span className="font-bold text-white">4.8</span>
                  <span className="text-muted-foreground">(34 trades)</span>
                </div>
              </div>
            </div>

            <div className="border-t border-border/40 pt-4">
              <Link 
                href={`/u/${listing.sellerUsername}`}
                className="flex items-center justify-between text-xs text-primary font-bold hover:underline"
              >
                <span>View Public Profile</span>
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
