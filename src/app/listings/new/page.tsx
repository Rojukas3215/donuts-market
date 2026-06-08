'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  Tag, 
  Gavel, 
  ArrowLeft, 
  Info, 
  AlertTriangle, 
  Sparkles, 
  Upload,
  DollarSign
} from 'lucide-react';

const CATEGORIES = [
  'Items', 'Armor', 'Weapons', 'Resources', 'Kits', 
  'Spawners', 'Bases', 'Farms', 'Services', 'Other'
];

export default function NewListingPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [type, setType] = useState<'FIXED' | 'AUCTION' | null>(null);
  
  // Form fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Items');
  const [price, setPrice] = useState('');
  
  // Auction specific
  const [minIncrement, setMinIncrement] = useState('1000');
  const [durationDays, setDurationDays] = useState('3'); // 1, 3, 5, 7 days
  
  // Images
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Compress image client-side before uploading to stay within Vercel's body limit
  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const MAX = 1024;
        const ratio = Math.min(MAX / img.width, MAX / img.height, 1);
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * ratio);
        canvas.height = Math.round(img.height * ratio);
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Compression failed')), 'image/jpeg', 0.75);
      };
      img.onerror = reject;
      img.src = url;
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');

    try {
      const compressed = await compressImage(file);
      const formData = new FormData();
      formData.append('file', compressed, file.name);

      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok && data.success) {
        setImageUrl(data.url);
      } else {
        setError(data.error || 'Failed to upload image file.');
      }
    } catch {
      setError('Network error uploading file.');
    } finally {
      setUploading(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-md mx-auto text-center py-20 space-y-4">
        <AlertTriangle className="h-12 w-12 text-primary mx-auto" />
        <h2 className="text-xl font-bold text-white">Sign In Required</h2>
        <p className="text-muted-foreground text-sm">
          You must be signed in to list items on the marketplace.
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

  if (!user.profile) {
    return (
      <div className="max-w-md mx-auto text-center py-20 space-y-4">
        <AlertTriangle className="h-12 w-12 text-primary mx-auto" />
        <h2 className="text-xl font-bold text-white">Minecraft Profile Required</h2>
        <p className="text-muted-foreground text-sm">
          Please complete your onboarding profile first by linking your Minecraft username.
        </p>
        <button
          onClick={() => router.push('/onboarding')}
          className="px-6 py-2 bg-accent text-white font-bold rounded-md"
        >
          Onboard Profile
        </button>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!type) return;

    setLoading(true);
    setError('');

    // Pre-calculate auction end date
    let auctionDetails = undefined;
    if (type === 'AUCTION') {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + Number(durationDays));
      auctionDetails = {
        minimumIncrement: Number(minIncrement),
        endDate: endDate.toISOString()
      };
    }

    // Assign a default item emoji avatar as the image if none is provided
    let images: string[] = [];
    if (imageUrl) {
      images.push(imageUrl);
    }

    try {
      const res = await fetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          category,
          price: Number(price),
          images,
          type,
          auctionDetails
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        router.push(`/listings/${data.listing.id}`);
      } else {
        setError(data.error || 'Failed to create listing');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Select Type
  if (!type) {
    return (
      <div className="max-w-3xl mx-auto space-y-8 py-4">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Create a New Listing</h1>
          <p className="text-muted-foreground text-sm">Select which type of listing you would like to publish.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          {/* Fixed Price Listing option */}
          <button
            onClick={() => setType('FIXED')}
            className="mc-card p-6 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 hover:scale-[1.02] border-border hover:border-primary cursor-pointer active:scale-95"
          >
            <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center text-primary">
              <Tag className="h-8 w-8 stroke-[2px]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Marketplace Listing</h2>
              <p className="text-xs text-muted-foreground mt-2 max-w-[240px]">
                Sell items, bases, or coordinates for a fixed price. Buyers can request purchase instantly.
              </p>
            </div>
          </button>

          {/* Auction option */}
          <button
            onClick={() => setType('AUCTION')}
            className="mc-card p-6 rounded-2xl flex flex-col items-center justify-center text-center space-y-4 hover:scale-[1.02] border-border hover:border-accent cursor-pointer active:scale-95"
          >
            <div className="h-16 w-16 bg-accent/10 rounded-full flex items-center justify-center text-accent">
              <Gavel className="h-8 w-8 stroke-[2px]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Auction Listing</h2>
              <p className="text-xs text-muted-foreground mt-2 max-w-[240px]">
                Create a timed auction. Players bid increments, and the highest bidder automatically wins at expiration.
              </p>
            </div>
          </button>
        </div>
      </div>
    );
  }

  const isManualCategory = ['Bases', 'Farms', 'Services', 'Other'].includes(category);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <button
          onClick={() => setType(null)}
          className="p-2 bg-card border border-border hover:text-white rounded-lg transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">
            New {type === 'AUCTION' ? 'Auction' : 'Fixed Price'} Listing
          </h1>
          <p className="text-xs text-muted-foreground">Configure the details of your marketplace asset.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 space-y-5 shadow-lg">
        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Title */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-muted-foreground uppercase">Listing Title</label>
          <input
            type="text"
            required
            placeholder="e.g. Sharpness VI Netherite Sword"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full h-10 px-3 bg-input border border-border rounded-lg text-sm text-white focus:border-primary focus:outline-none transition-all"
          />
        </div>

        {/* Category & Category warning */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-10 px-3 bg-input border border-border rounded-lg text-sm text-white focus:border-primary focus:outline-none cursor-pointer"
            >
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground uppercase">
              {type === 'AUCTION' ? 'Starting Bid' : 'Price'} (Donut Dollars)
            </label>
            <div className="relative flex items-center">
              <input
                type="number"
                required
                min="1"
                placeholder={type === 'AUCTION' ? '10000' : '45000'}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full h-10 pl-9 pr-3 bg-input border border-border rounded-lg text-sm text-white focus:border-primary focus:outline-none transition-all"
              />
              <DollarSign className="absolute left-3 h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </div>

        {/* Category Warnings */}
        {isManualCategory && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-500 rounded-lg text-xs flex items-start space-x-2">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Manual Trade Warning:</span> This category cannot be automatically verified in-game. A warning badge will be displayed, and players will use the Trade Ticket Escrow system to complete this transaction safely.
            </div>
          </div>
        )}

        {/* Auction Fields */}
        {type === 'AUCTION' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/20 border border-border rounded-lg">
            <div className="space-y-2">
              <label className="text-xs font-bold text-accent uppercase">Minimum Bid Increment</label>
              <input
                type="number"
                required
                min="100"
                value={minIncrement}
                onChange={(e) => setMinIncrement(e.target.value)}
                className="w-full h-10 px-3 bg-input border border-border rounded-lg text-sm text-white focus:border-accent focus:outline-none transition-all"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-accent uppercase">Auction Duration</label>
              <select
                value={durationDays}
                onChange={(e) => setDurationDays(e.target.value)}
                className="w-full h-10 px-3 bg-input border border-border rounded-lg text-sm text-white focus:border-accent focus:outline-none cursor-pointer"
              >
                <option value="1">1 Day</option>
                <option value="3">3 Days (Standard)</option>
                <option value="5">5 Days</option>
                <option value="7">7 Days</option>
              </select>
            </div>
          </div>
        )}

        {/* Description */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-muted-foreground uppercase">Item Description</label>
          <textarea
            required
            rows={4}
            placeholder="Explain what stats, enchantments, coordinates or services this listing includes. Add any details needed to coordinate the trade."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-3 bg-input border border-border rounded-lg text-sm text-white focus:border-primary focus:outline-none transition-all resize-y"
          ></textarea>
        </div>

        {/* File Image Upload */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-muted-foreground uppercase">Upload Item Screenshot</label>
            <span className="text-[10px] text-muted-foreground">Local file upload</span>
          </div>
          
          <div className="flex items-center gap-3">
            <label className="h-10 px-4 rounded-lg bg-input border border-border text-xs font-bold text-white flex items-center justify-center cursor-pointer hover:bg-white/5 active:scale-95 transition-all">
              <Upload className="h-4 w-4 mr-2" />
              <span>Choose File</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
            
            {uploading ? (
              <span className="text-xs text-muted-foreground">Uploading image...</span>
            ) : imageUrl ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-emerald-500 font-bold">✓ Image Uploaded</span>
                <span className="text-[10px] text-muted-foreground max-w-[200px] truncate">({imageUrl})</span>
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">No file chosen (optional fallback used)</span>
            )}
          </div>

          {imageUrl && (
            <div className="mt-2 relative h-20 w-32 rounded bg-slate-900 border border-border/60 overflow-hidden flex items-center justify-center">
              <img src={imageUrl} alt="preview" className="h-full object-cover" />
            </div>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 rounded-lg text-sm font-extrabold transition-all active:scale-98 cursor-pointer flex items-center justify-center space-x-2 ${
            type === 'AUCTION'
              ? 'bg-accent hover:bg-accent/90 text-white'
              : 'bg-primary hover:bg-primary/95 text-primary-foreground'
          }`}
        >
          {loading ? (
            <span>Publishing Listing...</span>
          ) : (
            <>
              {type === 'AUCTION' ? <Gavel className="h-4 w-4" /> : <Tag className="h-4 w-4" />}
              <span>Publish Listing</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
