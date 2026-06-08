import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Donuts Market | DonutSMP Minecraft Asset Marketplace",
  description: "Buy, sell, auction, and trade Minecraft items, bases, spawners, and services securely on the Donuts Market player marketplace.",
  keywords: ["Minecraft", "DonutSMP", "Marketplace", "Auction House", "Minecraft Trading", "Bases", "Spawners", "Trade Ticket"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full scroll-smooth">
      <body className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-background text-foreground flex flex-col antialiased`}>
        <AuthProvider>
          <Navbar />
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </main>
          
          <footer className="w-full border-t border-border/60 bg-card/40 py-8 mt-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="text-center md:text-left">
                  <span className="text-lg font-black tracking-wider text-gradient-blue-pink">
                    DONUTS<span className="text-white font-semibold text-sm ml-1">MARKET</span>
                  </span>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                    The premium unofficial marketplace for players of the Minecraft DonutSMP server.
                  </p>
                </div>
                <div className="flex items-center space-x-6 text-xs text-muted-foreground">
                  <a href="/listings" className="hover:text-primary transition-all">Marketplace</a>
                  <a href="/listings?type=AUCTION" className="hover:text-primary transition-all">Auctions</a>
                  <a href="https://donutsmp.net" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-all">Official Server</a>
                  <span className="text-border">|</span>
                  <span className="text-muted-foreground/80">&copy; 2026 Donuts Market. All rights reserved.</span>
                </div>
              </div>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
