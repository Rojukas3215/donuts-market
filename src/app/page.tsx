'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Gavel, 
  Clock, 
  ChevronRight, 
  Sparkles,
  Flame,
  Plus
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  
  const [featuredListings, setFeaturedListings] = useState<any[]>([]);
  const [latestListings, setLatestListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      // Fetch featured / latest listings
      const listRes = await fetch('/api/listings');
      const listData = await listRes.json();
      if (resOk(listRes, listData)) {
        const items = listData.listings;
        // Featured: auctions or isFeatured
        setFeaturedListings(items.filter((l: any) => l.isFeatured || l.type === 'AUCTION').slice(0, 4));
        // Latest
        setLatestListings(items.slice(0, 6));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resOk = (res: any, data: any) => res.ok && data.success;

  useEffect(() => {
    fetchData();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/listings?search=${encodeURIComponent(search.trim())}`);
    }
  };

  return (
    <div className="space-y-16 py-4">
      
      {/* 1. Hero Section */}
      <section className="relative rounded-3xl overflow-hidden bg-radial from-[#1e1b4b] via-card to-card border border-border/80 px-6 py-16 md:py-24 text-center space-y-8 shadow-xl">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:30px_30px]" />
        
        <div className="relative space-y-4 max-w-3xl mx-auto">
          <span className="px-3 py-1 rounded-full text-[10px] font-extrabold tracking-widest uppercase bg-primary/10 text-primary border border-primary/20 inline-flex items-center space-x-1.5">
            <Sparkles className="h-3 w-3 animate-pulse" />
            <span>Minecraft Asset Trading platform</span>
          </span>
          
          <h1 className="text-4xl md:text-6xl font-black tracking-tight text-white leading-tight">
            Buy, Sell and Auction on <span className="text-gradient-gold">DonutSMP</span>
          </h1>
          
          <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Trade items, keys, kits, spawners, bases, and professional services securely using our formal trade ticket system.
          </p>
        </div>

        {/* Hero Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative max-w-xl mx-auto flex items-center shadow-lg">
          <input
            type="text"
            placeholder="Search Sharpness VI Netherite Swords, Spawners, Bases..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-14 pl-12 pr-28 rounded-xl bg-card border border-border focus:border-primary focus:outline-none text-sm font-medium transition-all"
          />
          <Search className="absolute left-4.5 h-5 w-5 text-muted-foreground" />
          <button 
            type="submit" 
            className="absolute right-2 h-10 px-5 rounded-lg bg-gradient-to-r from-primary to-accent hover:from-primary/95 hover:to-accent/95 text-xs font-extrabold text-primary-foreground transition-all active:scale-95 cursor-pointer"
          >
            Search Market
          </button>
        </form>
      </section>



      {/* 3. Featured Auctions */}
      <section className="space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-xl font-black text-white flex items-center space-x-2">
              <Flame className="h-5 w-5 text-accent fill-accent/10" />
              <span>Hot Auctions & Featured Listings</span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">Bid on rare timed spawners, god gears, and keys before the clock runs out.</p>
          </div>
          <Link href="/listings?type=AUCTION" className="text-xs font-bold text-primary hover:underline flex items-center space-x-1">
            <span>View All</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-64 bg-card border border-border rounded-xl"></div>
            ))}
          </div>
        ) : featuredListings.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
            No active auctions at this moment. Create one using the "+ New Listing" button!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredListings.map((item) => (
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
                    <span className="text-[9px] text-primary font-bold uppercase">{item.category}</span>
                    <h3 className="text-xs font-bold text-white line-clamp-1">
                      <Link href={`/listings/${item.id}`}>{item.title}</Link>
                    </h3>
                    <p className="text-[11px] text-muted-foreground line-clamp-2">{item.description}</p>
                  </div>
                </div>

                <div className="p-4 pt-0 mt-4">
                  <div className="flex justify-between items-center pt-3 border-t border-border/20">
                    <div>
                      <div className="text-[8px] text-muted-foreground uppercase leading-none">Current Bid</div>
                      <div className="text-xs font-black text-primary mt-1">
                        {(item.auction ? item.auction.currentBid : item.price).toLocaleString()} Dollars
                      </div>
                    </div>
                    <Link href={`/listings/${item.id}`} className="px-2.5 py-1 rounded text-[10px] font-bold bg-accent hover:bg-accent/90 text-white">
                      Bid Now
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 4. Latest Listings */}
      <section className="space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-lg font-black text-white">Latest Listings</h2>
            <p className="text-xs text-muted-foreground mt-0.5 font-medium">Buy instantly before other players secure the deal.</p>
          </div>
          <Link href="/listings" className="text-xs font-bold text-primary hover:underline flex items-center space-x-1">
            <span>View All</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="space-y-3 animate-pulse">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-card rounded-xl"></div>
              ))}
            </div>
          ) : latestListings.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
              No listings yet. Be the first to list something!
            </div>
          ) : (
            latestListings.map((item) => (
              <div key={item.id} className="bg-card border border-border p-4 rounded-xl flex justify-between items-center gap-4 hover:border-primary/40 transition-all">
                <div className="flex items-center space-x-3 min-w-0">
                  <span className="text-3xl select-none hidden sm:inline shrink-0">
                    {item.category === 'Spawners' ? '🌀' : item.category === 'Armor' ? '🛡️' : item.category === 'Weapons' ? '⚔️' : item.category === 'Resources' ? '💎' : item.category === 'Kits' ? '📦' : item.category === 'Bases' ? '🏰' : '🍪'}
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-xs font-bold text-white truncate">
                      <Link href={`/listings/${item.id}`} className="hover:text-primary transition-all">{item.title}</Link>
                    </h3>
                    <div className="text-[10px] text-muted-foreground mt-1 flex items-center space-x-2">
                      <span>{item.category}</span>
                      <span>&bull;</span>
                      <span>{item.type === 'AUCTION' ? '⏱ Auction' : 'Fixed Price'}</span>
                      <span>&bull;</span>
                      <span>by {item.sellerUsername || 'Unknown'}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0 flex items-center space-x-3">
                  <div className="space-y-0.5">
                    <div className="text-[8px] text-muted-foreground uppercase leading-none">{item.type === 'AUCTION' ? 'Starting Bid' : 'Buy Now'}</div>
                    <div className="text-xs font-black text-primary">{item.price.toLocaleString()} Dollars</div>
                  </div>
                  <Link href={`/listings/${item.id}`} className="px-2.5 py-1.5 bg-primary hover:bg-primary/95 text-primary-foreground text-[10px] font-bold rounded">
                    {item.type === 'AUCTION' ? 'Bid' : 'Buy'}
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
