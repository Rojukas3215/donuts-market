'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  Lock, 
  Mail, 
  ArrowRight, 
  AlertCircle,
  Gamepad2,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';

function LoginContent() {
  const { user, login, register, loginWithDiscord } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Handle URL tabs redirect e.g. /login?tab=register
  const initialTab = searchParams.get('tab') === 'register' ? 'register' : 'login';
  const [activeTab, setActiveTab] = useState<'login' | 'register'>(initialTab);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Loading & error
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Read error parameter from URL query string if present
  useEffect(() => {
    const errParam = searchParams.get('error');
    if (errParam) {
      setError(errParam);
    }
  }, [searchParams]);

  // Handle session redirection
  useEffect(() => {
    if (user) {
      if (!user.profile) {
        router.push('/onboarding');
      } else {
        router.push('/');
      }
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (activeTab === 'register') {
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }
      const res = await register(email, password);
      if (!res.success) {
        setError(res.error || 'Failed to register account.');
        setLoading(false);
      }
    } else {
      const res = await login(email, password);
      if (!res.success) {
        setError(res.error || 'Failed to sign in.');
        setLoading(false);
      }
    }
  };

  const handleDiscordLogin = async () => {
    setError('');
    setLoading(true);
    // Trigger mock Discord login callback
    const res = await loginWithDiscord();
    if (!res.success) {
      setError(res.error || 'Discord authentication failed.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 space-y-6">
      
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <span className="text-3xl font-black tracking-wider text-gradient-blue-pink">
          DONUTS<span className="text-white font-semibold text-lg ml-1">MARKET</span>
        </span>
        <p className="text-xs text-muted-foreground font-medium">SMP Assets Marketplace & Auctions</p>
      </div>

      {/* Auth Card */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-xl space-y-6 relative overflow-hidden">
        
        {/* Tabs */}
        <div className="flex bg-slate-900 p-1 rounded-lg border border-border/80 h-10">
          <button
            onClick={() => { setActiveTab('login'); setError(''); }}
            className={`flex-1 rounded-md text-xs font-bold transition-all ${
              activeTab === 'login' ? 'bg-secondary text-white shadow' : 'text-muted-foreground hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setActiveTab('register'); setError(''); }}
            className={`flex-1 rounded-md text-xs font-bold transition-all ${
              activeTab === 'register' ? 'bg-secondary text-white shadow' : 'text-muted-foreground hover:text-white'
            }`}
          >
            Register
          </button>
        </div>

        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-xs font-semibold flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Email */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Email Address</label>
            <div className="relative flex items-center">
              <input
                type="email"
                required
                placeholder="you@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-10 pl-9 pr-3 bg-input border border-border rounded-lg text-xs text-white focus:border-primary focus:outline-none transition-all"
              />
              <Mail className="absolute left-3 h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase">Password</label>
            <div className="relative flex items-center">
              <input
                type="password"
                required
                placeholder="******"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-10 pl-9 pr-3 bg-input border border-border rounded-lg text-xs text-white focus:border-primary focus:outline-none transition-all"
              />
              <Lock className="absolute left-3 h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          {/* Confirm Password */}
          {activeTab === 'register' && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Confirm Password</label>
              <div className="relative flex items-center">
                <input
                  type="password"
                  required
                  placeholder="******"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full h-10 pl-9 pr-3 bg-input border border-border rounded-lg text-xs text-white focus:border-primary focus:outline-none transition-all"
                />
                <Lock className="absolute left-3 h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-primary hover:bg-primary/95 disabled:bg-muted text-primary-foreground font-extrabold rounded-lg text-xs transition-all active:scale-98 cursor-pointer flex items-center justify-center space-x-1.5 shadow"
          >
            <span>{activeTab === 'login' ? 'Sign In' : 'Create Account'}</span>
            <ArrowRight className="h-4 w-4 stroke-[2.5px]" />
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex items-center justify-center my-4">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border/60"></div></div>
          <span className="relative bg-card px-3 text-[10px] text-muted-foreground font-bold uppercase">Or Continue With</span>
        </div>

        {/* Discord OAuth mock */}
        <button
          onClick={handleDiscordLogin}
          disabled={loading}
          className="w-full h-11 bg-[#5865F2] hover:bg-[#4752C4] disabled:bg-muted text-white font-extrabold rounded-lg text-xs transition-all active:scale-98 flex items-center justify-center space-x-2 shadow cursor-pointer"
        >
          <Gamepad2 className="h-4.5 w-4.5" />
          <span>Continue with Discord</span>
        </button>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="py-20 text-center text-muted-foreground">
        Loading authentication page...
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
