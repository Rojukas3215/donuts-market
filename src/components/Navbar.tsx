'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  ShoppingBag, 
  Gavel, 
  Map, 
  Briefcase, 
  MessageSquare, 
  Bell, 
  User as UserIcon, 
  Plus, 
  LogOut, 
  Shield, 
  Menu, 
  X,
  Compass
} from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadNotifs, setUnreadNotifs] = useState(0);

  useEffect(() => {
    if (!user) return;
    const fetchUnreadCount = async () => {
      try {
        const res = await fetch('/api/notifications');
        const data = await res.json();
        if (res.ok && Array.isArray(data.notifications)) {
          const unread = data.notifications.filter((n: any) => !n.read).length;
          setUnreadNotifs(unread);
        }
      } catch {
        // Fallback
      }
    };
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, [user]);

  const navLinks = [
    { name: 'Marketplace', href: '/listings?type=FIXED', icon: ShoppingBag },
    { name: 'Auctions', href: '/listings?type=AUCTION', icon: Gavel },
    { name: 'Property', href: '/listings?category=Bases', icon: Map },
    { name: 'Services', href: '/listings?category=Services', icon: Briefcase },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border glass">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl font-black tracking-wider text-gradient-blue-pink">
                DONUTS<span className="text-white font-semibold text-lg ml-1">MARKET</span>
              </span>
            </Link>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname.startsWith(link.href.split('?')[0]);
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`flex items-center space-x-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                    isActive 
                      ? 'text-primary bg-primary/10' 
                      : 'text-muted-foreground hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Section / Auth / CTA */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                {/* Messages */}
                <Link 
                  href="/messages" 
                  className={`relative p-2 text-muted-foreground hover:text-white hover:bg-white/5 rounded-full transition-all ${
                    pathname === '/messages' ? 'text-primary' : ''
                  }`}
                >
                  <MessageSquare className="h-5 w-5" />
                </Link>

                {/* Notifications */}
                <Link 
                  href="/notifications" 
                  className={`relative p-2 text-muted-foreground hover:text-white hover:bg-white/5 rounded-full transition-all ${
                    pathname === '/notifications' ? 'text-primary' : ''
                  }`}
                >
                  <Bell className="h-5 w-5" />
                  {unreadNotifs > 0 && (
                    <span className="absolute top-0 right-0 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-white ring-2 ring-card animate-pulse">
                      {unreadNotifs}
                    </span>
                  )}
                </Link>

                {/* Profile Link */}
                {user.profile ? (
                  <Link 
                    href={`/u/${user.profile.minecraftUsername}`}
                    className="flex items-center space-x-2 pl-2 border-l border-border hover:opacity-95"
                  >
                    <img 
                      src={user.profile.avatarUrl} 
                      alt={user.profile.minecraftUsername} 
                      className="h-8 w-8 rounded bg-muted border border-border" 
                    />
                    <div className="text-left">
                      <div className="text-xs font-semibold leading-none text-white max-w-[90px] truncate">
                        {user.profile.minecraftUsername}
                      </div>
                      <div className="text-[10px] text-muted-foreground leading-tight">
                        {user.role === 'ADMIN' ? 'Admin' : 'Trader'}
                      </div>
                    </div>
                  </Link>
                ) : (
                  <Link 
                    href="/onboarding" 
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-md text-xs font-semibold bg-accent/10 border border-accent/30 text-accent hover:bg-accent/20"
                  >
                    <UserIcon className="h-3.5 w-3.5" />
                    <span>Onboard</span>
                  </Link>
                )}

                {/* Admin Page Link if admin */}
                {user.role === 'ADMIN' && (
                  <Link 
                    href="/admin"
                    className="p-2 text-primary hover:bg-primary/10 rounded-full transition-all"
                    title="Admin Dashboard"
                  >
                    <Shield className="h-5 w-5" />
                  </Link>
                )}

                {/* Logout Button */}
                <button 
                  onClick={logout} 
                  className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-full transition-all"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link 
                  href="/login" 
                  className="px-4 py-2 rounded-md text-sm font-medium text-white hover:bg-white/5 transition-all"
                >
                  Sign In
                </Link>
                <Link 
                  href="/login?tab=register" 
                  className="px-4 py-2 rounded-md text-sm font-medium bg-secondary text-white hover:bg-secondary/80 transition-all"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Large CTA button */}
            <Link
              href={user ? (user.profile ? '/listings/new' : '/onboarding') : '/login'}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-md bg-gradient-to-r from-primary to-accent hover:from-primary/95 hover:to-accent/95 text-primary-foreground text-sm font-bold shadow-md transition-all active:scale-95"
            >
              <Plus className="h-4 w-4 stroke-[3px]" />
              <span>New Listing</span>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center space-x-2">
            {user && unreadNotifs > 0 && (
              <Link href="/notifications" className="relative p-2 text-muted-foreground">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-accent"></span>
              </Link>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-muted-foreground hover:text-white"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-card/95 backdrop-blur px-4 py-4 space-y-3">
          <nav className="flex flex-col space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center space-x-2 px-3 py-2.5 rounded-md text-base font-medium text-muted-foreground hover:text-white hover:bg-white/5"
                >
                  <Icon className="h-5 w-5 text-primary" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-border/50 my-2 pt-3">
            {user ? (
              <div className="space-y-2">
                <div className="flex items-center space-x-3 px-3 py-1">
                  <img src={user.profile?.avatarUrl || 'https://mc-heads.net/avatar/Steve'} className="h-9 w-9 rounded border border-border" />
                  <div>
                    <div className="text-sm font-bold text-white">{user.profile?.minecraftUsername || 'New User'}</div>
                    <div className="text-xs text-muted-foreground">{user.email}</div>
                  </div>
                </div>

                <div className="flex flex-col space-y-1 pt-2">
                  <Link
                    href="/messages"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-white hover:bg-white/5"
                  >
                    <MessageSquare className="h-4 w-4" />
                    <span>Conversations</span>
                  </Link>
                  <Link
                    href="/notifications"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-white hover:bg-white/5"
                  >
                    <Bell className="h-4 w-4" />
                    <span>Notifications</span>
                  </Link>
                  <Link
                    href="/favorites"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-white hover:bg-white/5"
                  >
                    <UserIcon className="h-4 w-4" />
                    <span>My Favorites</span>
                  </Link>
                  {user.role === 'ADMIN' && (
                    <Link
                      href="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm text-primary hover:bg-primary/5"
                    >
                      <Shield className="h-4 w-4" />
                      <span>Admin Control Panel</span>
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logout();
                    }}
                    className="flex w-full items-center space-x-2 px-3 py-2 rounded-md text-sm text-destructive hover:bg-destructive/5"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col space-y-2 px-2">
                <Link 
                  href="/login" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex justify-center py-2 bg-secondary rounded-md text-sm font-semibold"
                >
                  Sign In
                </Link>
                <Link 
                  href="/login?tab=register" 
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex justify-center py-2 border border-border rounded-md text-sm font-semibold hover:bg-white/5"
                >
                  Create Account
                </Link>
              </div>
            )}

            <div className="px-2 pt-4">
              <Link
                href={user ? (user.profile ? '/listings/new' : '/onboarding') : '/login'}
                onClick={() => setMobileMenuOpen(false)}
                className="flex w-full justify-center items-center space-x-2 py-2.5 rounded-md bg-gradient-to-r from-primary to-accent text-primary-foreground text-sm font-bold shadow-md"
              >
                <Plus className="h-4 w-4" />
                <span>New Listing</span>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
