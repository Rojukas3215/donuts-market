'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  User, 
  Gamepad2, 
  Check, 
  AlertCircle,
  Sparkles,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

export default function OnboardingPage() {
  const { user, loading, completeOnboarding } = useAuth();
  const router = useRouter();

  const [minecraftUsername, setMinecraftUsername] = useState('');
  const [discordUsername, setDiscordUsername] = useState('');
  const [avatarPreview, setAvatarPreview] = useState('https://mc-heads.net/avatar/Steve');
  
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already onboarded
  useEffect(() => {
    if (!loading && user?.profile) {
      router.push('/');
    }
  }, [user, loading, router]);

  // Auto-fill discord username if user was signed in with Discord
  useEffect(() => {
    if (user && user.email.startsWith('discord_')) {
      // Extract a mock discord username or use default
      setDiscordUsername('DiscordUser#1337');
    }
  }, [user]);

  // Update avatar preview as username changes
  useEffect(() => {
    const trimmed = minecraftUsername.trim();
    if (trimmed) {
      setAvatarPreview(`https://mc-heads.net/avatar/${encodeURIComponent(trimmed)}`);
    } else {
      setAvatarPreview('https://mc-heads.net/avatar/Steve');
    }
  }, [minecraftUsername]);

  if (loading) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground text-xs mt-4">Checking your session...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <ShieldAlert className="h-12 w-12 text-destructive mx-auto mb-2" />
        <h2 className="text-xl font-bold text-white">Unauthorized</h2>
        <p className="text-muted-foreground text-sm">Please sign in to complete onboarding.</p>
      </div>
    );
  }

  // If already onboarded, do not render page content
  if (user.profile) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!minecraftUsername.trim()) {
      setError('Minecraft username is required');
      return;
    }

    setLoadingSubmit(true);
    setError('');

    const res = await completeOnboarding(minecraftUsername, discordUsername);
    if (res.success) {
      router.push('/');
    } else {
      setError(res.error || 'Failed to complete onboarding profile.');
      setLoadingSubmit(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 space-y-6">
      
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-black text-white flex items-center justify-center space-x-1.5">
          <Sparkles className="h-5 w-5 text-primary animate-pulse" />
          <span>Player Onboarding</span>
        </h1>
        <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
          Link your Minecraft character to initialize your reputation reviews and activate listing submissions.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 shadow-xl space-y-5">
        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-xs font-semibold flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Real-time Avatar Preview */}
        <div className="flex flex-col items-center space-y-2 pb-2">
          <div className="text-[10px] font-bold text-muted-foreground uppercase">Avatar Preview</div>
          <img 
            src={avatarPreview} 
            alt="Minecraft Head" 
            className="h-20 w-20 rounded-xl bg-slate-900 border border-border shadow-md"
            onError={() => setAvatarPreview('https://mc-heads.net/avatar/Steve')}
          />
          <span className="text-[10px] text-muted-foreground">Auto-generated skin face</span>
        </div>

        {/* Minecraft Username */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-muted-foreground uppercase">Minecraft Username (Required)</label>
          <div className="relative flex items-center">
            <input
              type="text"
              required
              placeholder="e.g. Steve"
              value={minecraftUsername}
              onChange={(e) => setMinecraftUsername(e.target.value)}
              className="w-full h-10 pl-9 pr-3 bg-input border border-border rounded-lg text-xs text-white focus:border-primary focus:outline-none transition-all"
            />
            <User className="absolute left-3 h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        {/* Discord Tag (Optional) */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-muted-foreground uppercase">Discord Username (Optional)</label>
          <div className="relative flex items-center">
            <input
              type="text"
              placeholder="e.g. Steve#9999"
              value={discordUsername}
              onChange={(e) => setDiscordUsername(e.target.value)}
              className="w-full h-10 pl-9 pr-3 bg-input border border-border rounded-lg text-xs text-white focus:border-primary focus:outline-none transition-all"
            />
            <Gamepad2 className="absolute left-3 h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        <button
          type="submit"
          disabled={loadingSubmit || !minecraftUsername.trim()}
          className="w-full h-11 bg-primary hover:bg-primary/95 disabled:bg-muted text-primary-foreground font-extrabold rounded-lg text-xs transition-all active:scale-98 flex items-center justify-center space-x-1.5 cursor-pointer shadow"
        >
          <span>Complete Profile Setup</span>
          <ArrowRight className="h-4 w-4 stroke-[2.5px]" />
        </button>
      </form>
    </div>
  );
}
