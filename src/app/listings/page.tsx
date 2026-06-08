'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Search, 
  Tag, 
  Gavel, 
  Map, 
  Briefcase, 
  Filter, 
  ArrowUpDown, 
  Eye, 
  Clock, 
  Flame, 
  Sparkles,
  MapPin,
  Hammer,
  Compass
} from 'lucide-react';

const CATEGORIES = [
  'All', 'Items', 'Armor', 'Weapons', 'Resources', 'Kits', 
  'Spawners', 'Bases', 'Farms', 'Services', 'Other'
];

function ListingsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Load initial filters from URL params
  const initialCategory = searchParams.get('category') || 'All';
  const initialType = searchParams.get('type') || '';
  const initialSearch = searchParams.get('search') || '';
  const initialSortBy = searchParams.get('sortBy') || 'newest';

  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState(initialCategory);
  const [type, setType] = useState(initialType);
  const [sortBy, setSortBy] = useState(initialSortBy);

  // Fetch listings
  const fetchListings = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (category !== 'All') q.set('category', category);
      if (type) q.set('type', type);
      if (search) q.set('search', search);
      if (sortBy) q.set('sortBy', sortBy);

      const res = await fetch(`/api/listings?${q.toString()}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setListings(data.listings);
      }
    } catch (err) {
      console.error('Error loading listings', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [category, type, sortBy]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchListings();
    
    // Sync to URL
    const params = new URLSearchParams(searchParams.toString());
    if (search) params.set('search', search);
    else params.delete('search');
    router.push(`/listings?${params.toString()}`);
  };

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    
    if (key === 'category') setCategory(value || 'All');
    if (key === 'type') setType(value);
    if (key === 'sortBy') setSortBy(value);
    
    router.push(`/listings?${params.toString()}`);
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white flex items-center space-x-2">
          <Compass className="h-8 w-8 text-primary" />
          <span>DonutSMP Marketplace</span>
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Browse items, bases, spawners, and services listed by the community.
        </p>
      </div>

      {/* Search & Main Filter Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="lg:col-span-2 relative flex items-center">
          <input
            type="text"
            placeholder="Search listings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-lg bg-card border border-border focus:border-primary focus:outline-none text-sm font-medium transition-all"
          />
          <Search className="absolute left-3.5 h-4 w-4 text-muted-foreground" />
          <button 
            type="submit" 
            className="absolute right-2 h-7.5 px-3 rounded-md bg-secondary hover:bg-secondary/80 text-xs font-bold text-white transition-all"
          >
            Search
          </button>
        </form>

        {/* Listing Type Filter */}
        <div className="flex bg-card p-1 rounded-lg border border-border h-11">
          <button
            onClick={() => updateFilter('type', '')}
            className={`flex-1 flex items-center justify-center rounded-md text-xs font-bold transition-all ${
              !type ? 'bg-secondary text-white shadow' : 'text-muted-foreground hover:text-white'
            }`}
          >
            All Listings
          </button>
          <button
            onClick={() => updateFilter('type', 'FIXED')}
            className={`flex-1 flex items-center justify-center space-x-1 rounded-md text-xs font-bold transition-all ${
              type === 'FIXED' ? 'bg-secondary text-white shadow' : 'text-muted-foreground hover:text-white'
            }`}
          >
            <Tag className="h-3 w-3" />
            <span>Buy Now</span>
          </button>
          <button
            onClick={() => updateFilter('type', 'AUCTION')}
            className={`flex-1 flex items-center justify-center space-x-1 rounded-md text-xs font-bold transition-all ${
              type === 'AUCTION' ? 'bg-secondary text-white shadow' : 'text-muted-foreground hover:text-white'
            }`}
          >
            <Gavel className="h-3 w-3" />
            <span>Auctions</span>
          </button>
        </div>

        {/* Sorting Dropdown */}
        <div className="relative flex items-center bg-card rounded-lg border border-border px-3 h-11">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground mr-2" />
          <select
            value={sortBy}
            onChange={(e) => updateFilter('sortBy', e.target.value)}
            className="w-full bg-transparent border-none outline-none text-xs font-bold text-white cursor-pointer"
          >
            <option value="newest" className="bg-card">Newest Listings</option>
            <option value="oldest" className="bg-card">Oldest Listings</option>
            <option value="price_low" className="bg-card">Price: Low to High</option>
            <option value="price_high" className="bg-card">Price: High to Low</option>
            <option value="views" className="bg-card">Most Viewed</option>
            {type === 'AUCTION' && (
              <option value="ending_soon" className="bg-card">Ending Soon</option>
            )}
          </select>
        </div>
      </div>

      {/* Category Pills Slider */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => updateFilter('category', cat)}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-semibold border transition-all ${
              category === cat
                ? 'bg-primary border-primary text-primary-foreground font-bold shadow-sm shadow-primary/25'
                : 'bg-card border-border text-muted-foreground hover:text-white hover:border-muted'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Listings Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="mc-card rounded-xl border-border bg-card p-4 space-y-4 animate-pulse">
              <div className="aspect-video w-full rounded-lg bg-muted"></div>
              <div className="h-5 w-2/3 rounded bg-muted"></div>
              <div className="h-4 w-1/2 rounded bg-muted"></div>
              <div className="flex justify-between items-center pt-2">
                <div className="h-6 w-1/3 rounded bg-muted"></div>
                <div className="h-8 w-1/4 rounded bg-muted"></div>
              </div>
            </div>
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-border rounded-xl bg-card/20 p-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted text-muted-foreground mb-4">
            <Filter className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-white">No Listings Found</h3>
          <p className="text-muted-foreground text-sm max-w-sm mt-1">
            Try adjusting your search criteria or changing categories.
          </p>
          <button
            onClick={() => {
              setSearch('');
              setCategory('All');
              setType('');
              setSortBy('newest');
              router.push('/listings');
            }}
            className="mt-4 px-4 py-2 text-xs font-bold bg-secondary hover:bg-secondary/80 rounded-md text-white transition-all"
          >
            Reset All Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {listings.map((item) => {
            const isAuction = item.type === 'AUCTION';
            const priceLabel = isAuction ? 'Current Bid' : 'Price';
            const isManualTrade = item.propertyWarning;
            
            return (
              <div 
                key={item.id} 
                className="mc-card rounded-xl flex flex-col justify-between overflow-hidden relative"
              >
                {/* Featured Glow / Badge */}
                {item.isFeatured && (
                  <div className="absolute top-0 right-0 z-10 bg-primary/20 backdrop-blur-sm border-b border-l border-primary/40 text-primary px-3 py-1 text-[10px] font-bold tracking-widest uppercase flex items-center space-x-1 rounded-bl">
                    <Sparkles className="h-3 w-3 animate-spin" />
                    <span>Featured</span>
                  </div>
                )}

                <div>
                  {/* Image Area */}
                  <div className="aspect-video w-full bg-slate-900 flex items-center justify-center border-b border-border/60 relative overflow-hidden group">
                    {item.images && item.images.length > 0 ? (
                      <img src={item.images[0]} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <span className="text-5xl group-hover:scale-110 transition-all duration-300">
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
                    <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 text-[10px] text-muted-foreground font-semibold">
                      {item.category}
                    </span>

                    {/* Manual Trade Indicator */}
                    {isManualTrade && (
                      <span 
                        className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-accent/80 text-white text-[9px] font-bold"
                        title="Manual Trade Warning: Requires manual transaction in Minecraft"
                      >
                        ⚠️ Manual
                      </span>
                    )}
                  </div>

                  {/* Body */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <img 
                        src={item.sellerAvatar || 'https://mc-heads.net/avatar/Steve'} 
                        alt={item.sellerUsername} 
                        className="h-4 w-4 rounded-sm bg-muted" 
                      />
                      <span className="truncate hover:text-white transition-all">
                        {item.sellerUsername || 'Steve'}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white line-clamp-1 hover:text-primary transition-all">
                      <Link href={`/listings/${item.id}`}>{item.title}</Link>
                    </h3>
                    
                    <p className="text-xs text-muted-foreground line-clamp-2 min-h-[32px]">
                      {item.description}
                    </p>
                  </div>
                </div>

                {/* Footer Section */}
                <div className="p-4 pt-0 border-t border-border/40 mt-auto bg-card/30">
                  <div className="flex items-center justify-between pt-3">
                    <div>
                      <div className="text-[10px] text-muted-foreground font-semibold uppercase leading-none">
                        {priceLabel}
                      </div>
                      <div className="text-sm font-extrabold text-primary flex items-center space-x-1 mt-0.5">
                        <span className="text-gradient-gold">
                          {(isAuction && item.auction ? item.auction.currentBid : item.price).toLocaleString()}
                        </span>
                        <span className="text-[10px] text-muted-foreground ml-0.5">Dollars</span>
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
                      {isAuction ? (
                        <>
                          <Gavel className="h-3.5 w-3.5" />
                          <span>Bid</span>
                        </>
                      ) : (
                        <>
                          <Tag className="h-3.5 w-3.5" />
                          <span>View</span>
                        </>
                      )}
                    </Link>
                  </div>

                  {/* Views / Expiration Metadata */}
                  <div className="flex items-center justify-between text-[9px] text-muted-foreground mt-3 pt-2 border-t border-border/20">
                    <div className="flex items-center space-x-1">
                      <Eye className="h-3 w-3" />
                      <span>{item.viewsCount} views</span>
                    </div>
                    {isAuction && item.auction && (
                      <div className="flex items-center space-x-1 text-accent font-medium">
                        <Clock className="h-3 w-3" />
                        <span>Ends soon</span>
                      </div>
                    )}
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

export default function ListingsPage() {
  return (
    <Suspense fallback={
      <div className="py-20 text-center text-muted-foreground">
        Loading listings...
      </div>
    }>
      <ListingsContent />
    </Suspense>
  );
}
