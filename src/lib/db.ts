import prisma from './prisma';

// Type definitions to mirror Prisma models in typescript
export type UserRole = 'USER' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'BANNED';
export type ListingStatus = 'ACTIVE' | 'SOLD' | 'CANCELLED';
export type ListingType = 'FIXED' | 'AUCTION';
export type AuctionStatus = 'ACTIVE' | 'ENDED' | 'CANCELLED';
export type TradeStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'DISPUTED' | 'CANCELLED';
export type EscrowStatus = 'PENDING' | 'ACTIVE' | 'RELEASED' | 'REFUNDED';
export type PaymentStatus = 'UNPAID' | 'PAID' | 'REFUNDED';
export type NotificationType = 'MESSAGE' | 'OUTBID' | 'AUCTION_WON' | 'AUCTION_ENDING' | 'REVIEW' | 'LISTING_SOLD' | 'TRADE_UPDATE';
export type ReportTarget = 'USER' | 'LISTING' | 'TRADE';
export type ReportStatus = 'PENDING' | 'RESOLVED' | 'DISMISSED';

export interface User {
  id: string;
  email: string;
  password?: string;
  role: UserRole;
  status: UserStatus;
  createdAt: Date;
  profile?: Profile | null;
}

export interface Profile {
  id: string;
  userId: string;
  minecraftUsername: string;
  discordUsername?: string | null;
  avatarUrl: string;
  completedTrades: number;
  averageRating: number;
  reviewCount: number;
  verified: boolean;
  createdAt: Date;
}

export interface Listing {
  id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  images: string[];
  sellerId: string;
  sellerUsername?: string;
  sellerAvatar?: string;
  status: ListingStatus;
  type: ListingType;
  viewsCount: number;
  favoritesCount: number;
  propertyWarning: boolean;
  isFeatured: boolean;
  createdAt: Date;
  auction?: Auction | null;
}

export interface Auction {
  id: string;
  listingId: string;
  startingBid: number;
  minimumIncrement: number;
  endDate: Date;
  currentBid: number;
  currentBidderId: string | null;
  currentBidderUsername?: string | null;
  winnerId: string | null;
  bidCount: number;
  status: AuctionStatus;
  bids?: Bid[];
}

export interface Bid {
  id: string;
  auctionId: string;
  bidderId: string;
  bidderUsername: string;
  amount: number;
  createdAt: Date;
}

export interface Conversation {
  id: string;
  listingId: string;
  listingTitle: string;
  buyerId: string;
  buyerUsername: string;
  sellerId: string;
  sellerUsername: string;
  updatedAt: Date;
  lastMessage?: string;
  unreadCount?: number;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderUsername: string;
  content: string;
  read: boolean;
  createdAt: Date;
}

export interface TradeTicket {
  id: string;
  listingId: string;
  listingTitle: string;
  listingPrice: number;
  listingType: ListingType;
  buyerId: string;
  buyerUsername: string;
  sellerId: string;
  sellerUsername: string;
  status: TradeStatus;
  escrowStatus: EscrowStatus;
  paymentStatus: PaymentStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface TradeMessage {
  id: string;
  tradeTicketId: string;
  senderId: string | null;
  senderUsername: string | null;
  content: string;
  attachmentUrls: string[];
  isSystem: boolean;
  createdAt: Date;
}

export interface Review {
  id: string;
  reviewerId: string;
  reviewerUsername: string;
  revieweeId: string;
  rating: number;
  text: string;
  tradeTicketId: string;
  createdAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  content: string;
  read: boolean;
  link?: string | null;
  createdAt: Date;
}

export interface Report {
  id: string;
  reporterId: string;
  reporterUsername: string;
  targetType: ReportTarget;
  targetId: string;
  targetName?: string; // e.g. listing title or username
  reason: string;
  status: ReportStatus;
  createdAt: Date;
  resolverId?: string | null;
  resolverUsername?: string | null;
  resolutionNotes?: string | null;
  updatedAt: Date;
}

// IN-MEMORY MOCK DATABASE ENGINE
class MockDatabase {
  users: User[] = [];
  profiles: Profile[] = [];
  listings: Listing[] = [];
  auctions: Auction[] = [];
  bids: Bid[] = [];
  favorites: { id: string; userId: string; listingId: string; createdAt: Date }[] = [];
  conversations: Conversation[] = [];
  messages: Message[] = [];
  tradeTickets: TradeTicket[] = [];
  tradeMessages: TradeMessage[] = [];
  reviews: Review[] = [];
  notifications: Notification[] = [];
  reports: Report[] = [];
  adminLogs: { id: string; adminId: string; action: string; target: string; details?: string; createdAt: Date }[] = [];

  constructor() {
    this.seed();
  }

  seed() {
    // No seed data — marketplace starts empty.
    // Real listings will be created by users once the database is connected.
  }

}


const mockDb = new MockDatabase();

// MAIN DATABASE CLIENT Wrapper (combines PostgreSQL and Resilient Mock Fallback)
export const db = {
  // HELPER: Check if PostgreSQL database is responsive
  async isDatabaseOnline(): Promise<boolean> {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  },

  user: {
    async create(data: any): Promise<User> {
      try {
        const dbUser = await prisma.user.create({
          data,
          include: { profile: true }
        });
        return dbUser as any;
      } catch (err) {
        console.warn("PostgreSQL not responding, executing mock user creation", err);
        const newUser: User = {
          id: 'u-' + Math.random().toString(36).substr(2, 9),
          email: data.email,
          password: data.password,
          role: data.role || 'USER',
          status: 'ACTIVE',
          createdAt: new Date()
        };
        mockDb.users.push(newUser);
        return newUser;
      }
    },

    async findUnique(where: { id?: string; email?: string }): Promise<User | null> {
      try {
        const dbUser = await prisma.user.findUnique({
          where: where as any,
          include: { profile: true }
        });
        return dbUser as any;
      } catch {
        if (where.id) {
          const user = mockDb.users.find(u => u.id === where.id);
          if (user) {
            const profile = mockDb.profiles.find(p => p.userId === user.id);
            return { ...user, profile };
          }
        }
        if (where.email) {
          const user = mockDb.users.find(u => u.email === where.email);
          if (user) {
            const profile = mockDb.profiles.find(p => p.userId === user.id);
            return { ...user, profile };
          }
        }
        return null;
      }
    },

    async updateProfile(userId: string, data: { minecraftUsername: string; discordUsername?: string; avatarUrl?: string }): Promise<Profile> {
      try {
        const profile = await prisma.profile.upsert({
          where: { userId },
          update: data,
          create: {
            userId,
            minecraftUsername: data.minecraftUsername,
            discordUsername: data.discordUsername || null,
            avatarUrl: data.avatarUrl || `https://mc-heads.net/avatar/${data.minecraftUsername}`
          }
        });
        return profile as any;
      } catch {
        let profile = mockDb.profiles.find(p => p.userId === userId);
        if (profile) {
          profile.minecraftUsername = data.minecraftUsername;
          profile.discordUsername = data.discordUsername || null;
          profile.avatarUrl = data.avatarUrl || `https://mc-heads.net/avatar/${data.minecraftUsername}`;
        } else {
          profile = {
            id: 'p-' + Math.random().toString(36).substr(2, 9),
            userId,
            minecraftUsername: data.minecraftUsername,
            discordUsername: data.discordUsername || null,
            avatarUrl: data.avatarUrl || `https://mc-heads.net/avatar/${data.minecraftUsername}`,
            completedTrades: 0,
            averageRating: 0.0,
            reviewCount: 0,
            verified: false,
            createdAt: new Date()
          };
          mockDb.profiles.push(profile);
        }
        return profile;
      }
    },

    async findByMinecraftUsername(username: string): Promise<Profile | null> {
      try {
        const p = await prisma.profile.findFirst({
          where: { minecraftUsername: { equals: username, mode: 'insensitive' } }
        });
        return p as any;
      } catch {
        return mockDb.profiles.find(p => p.minecraftUsername.toLowerCase() === username.toLowerCase()) || null;
      }
    },

    async getAllUsers(): Promise<User[]> {
      try {
        const list = await prisma.user.findMany({
          include: { profile: true },
          orderBy: { createdAt: 'desc' }
        });
        return list as any;
      } catch {
        return mockDb.users.map((u: any) => ({
          ...u,
          profile: mockDb.profiles.find(p => p.userId === u.id) || null
        }));
      }
    },

    async updateStatus(userId: string, status: UserStatus): Promise<boolean> {
      try {
        await prisma.user.update({
          where: { id: userId },
          data: { status }
        });
        return true;
      } catch {
        const u = mockDb.users.find(u => u.id === userId);
        if (u) {
          u.status = status;
          return true;
        }
        return false;
      }
    },

    async updateRole(userId: string, role: UserRole): Promise<boolean> {
      try {
        await prisma.user.update({
          where: { id: userId },
          data: { role }
        });
        return true;
      } catch {
        const u = mockDb.users.find(u => u.id === userId);
        if (u) {
          u.role = role;
          return true;
        }
        return false;
      }
    }
  },

  listing: {
    async create(data: {
      title: string;
      description: string;
      category: string;
      price: number;
      images: string[];
      sellerId: string;
      type: ListingType;
      propertyWarning: boolean;
      auctionDetails?: {
        startingBid: number;
        minimumIncrement: number;
        endDate: Date;
      }
    }): Promise<Listing> {
      try {
        const item = await prisma.listing.create({
          data: {
            title: data.title,
            description: data.description,
            category: data.category,
            price: data.price,
            images: data.images,
            sellerId: data.sellerId,
            type: data.type,
            propertyWarning: data.propertyWarning,
            auction: data.type === 'AUCTION' && data.auctionDetails ? {
              create: {
                startingBid: data.auctionDetails.startingBid,
                minimumIncrement: data.auctionDetails.minimumIncrement,
                endDate: data.auctionDetails.endDate,
                currentBid: data.auctionDetails.startingBid,
                status: 'ACTIVE'
              }
            } : undefined
          },
          include: {
            auction: true,
            seller: { include: { profile: true } }
          }
        });
        return item as any;
      } catch (err) {
        console.warn("PostgreSQL offline, creating mock listing", err);
        const sellerProfile = mockDb.profiles.find(p => p.userId === data.sellerId);
        const listingId = 'l-' + Math.random().toString(36).substr(2, 9);
        const newListing: Listing = {
          id: listingId,
          title: data.title,
          description: data.description,
          category: data.category,
          price: data.price,
          images: data.images.length > 0 ? data.images : ['/placeholder.png'],
          sellerId: data.sellerId,
          sellerUsername: sellerProfile?.minecraftUsername || 'Unknown',
          sellerAvatar: sellerProfile?.avatarUrl || 'https://mc-heads.net/avatar/Steve',
          status: 'ACTIVE',
          type: data.type,
          viewsCount: 0,
          favoritesCount: 0,
          propertyWarning: data.propertyWarning,
          isFeatured: false,
          createdAt: new Date()
        };

        if (data.type === 'AUCTION' && data.auctionDetails) {
          const newAuction: Auction = {
            id: 'a-' + Math.random().toString(36).substr(2, 9),
            listingId: listingId,
            startingBid: data.auctionDetails.startingBid,
            minimumIncrement: data.auctionDetails.minimumIncrement,
            endDate: data.auctionDetails.endDate,
            currentBid: data.auctionDetails.startingBid,
            currentBidderId: null,
            winnerId: null,
            bidCount: 0,
            status: 'ACTIVE'
          };
          mockDb.auctions.push(newAuction);
          newListing.auction = newAuction;
        }

        mockDb.listings.push(newListing);
        return newListing;
      }
    },

    async get(id: string): Promise<Listing | null> {
      try {
        const item = await prisma.listing.update({
          where: { id },
          data: { viewsCount: { increment: 1 } },
          include: {
            auction: { include: { bids: { orderBy: { amount: 'desc' } } } },
            seller: { include: { profile: true } }
          }
        });
        return item as any;
      } catch {
        const item = mockDb.listings.find(l => l.id === id);
        if (item) {
          item.viewsCount++;
          const auction = mockDb.auctions.find(a => a.listingId === item.id);
          if (auction) {
            const bids = mockDb.bids.filter(b => b.auctionId === auction.id).sort((a, b) => b.amount - a.amount);
            item.auction = { ...auction, bids };
          }
          const profile = mockDb.profiles.find(p => p.userId === item.sellerId);
          item.sellerUsername = profile?.minecraftUsername;
          item.sellerAvatar = profile?.avatarUrl;
        }
        return item || null;
      }
    },

    async list(filters?: {
      category?: string;
      type?: ListingType;
      search?: string;
      sortBy?: string;
      sellerId?: string;
      onlyFeatured?: boolean;
    }): Promise<Listing[]> {
      try {
        const where: any = {};
        if (filters?.category && filters.category !== 'All') where.category = filters.category;
        if (filters?.type) where.type = filters.type;
        if (filters?.sellerId) where.sellerId = filters.sellerId;
        if (filters?.onlyFeatured) where.isFeatured = true;
        if (filters?.search) {
          where.OR = [
            { title: { contains: filters.search, mode: 'insensitive' } },
            { description: { contains: filters.search, mode: 'insensitive' } }
          ];
        }

        let orderBy: any = { createdAt: 'desc' };
        if (filters?.sortBy) {
          if (filters.sortBy === 'newest') orderBy = { createdAt: 'desc' };
          if (filters.sortBy === 'oldest') orderBy = { createdAt: 'asc' };
          if (filters.sortBy === 'price_low') orderBy = { price: 'asc' };
          if (filters.sortBy === 'price_high') orderBy = { price: 'desc' };
          if (filters.sortBy === 'views') orderBy = { viewsCount: 'desc' };
        }

        const items = await prisma.listing.findMany({
          where,
          orderBy,
          include: {
            auction: true,
            seller: { include: { profile: true } }
          }
        });
        return items as any;
      } catch {
        let list = [...mockDb.listings];
        if (filters?.category && filters.category !== 'All') {
          list = list.filter(l => l.category === filters.category);
        }
        if (filters?.type) {
          list = list.filter(l => l.type === filters.type);
        }
        if (filters?.sellerId) {
          list = list.filter(l => l.sellerId === filters.sellerId);
        }
        if (filters?.onlyFeatured) {
          list = list.filter(l => l.isFeatured);
        }
        if (filters?.search) {
          const q = filters.search.toLowerCase();
          list = list.filter(l => l.title.toLowerCase().includes(q) || l.description.toLowerCase().includes(q));
        }

        // Attach auction info & profiles
        list = list.map((item: any) => {
          const auction = mockDb.auctions.find(a => a.listingId === item.id);
          const profile = mockDb.profiles.find(p => p.userId === item.sellerId);
          return {
            ...item,
            auction,
            sellerUsername: profile?.minecraftUsername,
            sellerAvatar: profile?.avatarUrl
          };
        });

        if (filters?.sortBy) {
          if (filters.sortBy === 'newest') list.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
          if (filters.sortBy === 'oldest') list.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
          if (filters.sortBy === 'price_low') list.sort((a, b) => a.price - b.price);
          if (filters.sortBy === 'price_high') list.sort((a, b) => b.price - a.price);
          if (filters.sortBy === 'views') list.sort((a, b) => b.viewsCount - a.viewsCount);
          if (filters.sortBy === 'ending_soon') {
            list = list.filter(l => l.type === 'AUCTION' && l.auction && l.auction.status === 'ACTIVE');
            list.sort((a, b) => (a.auction?.endDate.getTime() || 0) - (b.auction?.endDate.getTime() || 0));
          }
        }

        return list;
      }
    },

    async updateStatus(id: string, status: ListingStatus): Promise<boolean> {
      try {
        await prisma.listing.update({
          where: { id },
          data: { status }
        });
        
        if (status === 'SOLD') {
          setTimeout(async () => {
            try {
              // Delete listing from database after 1 minute
              await prisma.listing.delete({
                where: { id }
              });
            } catch (err) {
              console.error("Failed to auto-delete sold listing:", err);
            }
          }, 60000);
        }
        return true;
      } catch {
        const item = mockDb.listings.find(l => l.id === id);
        if (item) {
          item.status = status;
          if (status === 'SOLD') {
            setTimeout(() => {
              const index = mockDb.listings.findIndex(l => l.id === id);
              if (index !== -1) {
                mockDb.listings.splice(index, 1);
              }
            }, 60000);
          }
          return true;
        }
        return false;
      }
    },

    async toggleFavorite(userId: string, listingId: string): Promise<{ favorited: boolean }> {
      try {
        const existing = await prisma.favorite.findUnique({
          where: { userId_listingId: { userId, listingId } }
        });
        if (existing) {
          await prisma.favorite.delete({
            where: { id: existing.id }
          });
          await prisma.listing.update({
            where: { id: listingId },
            data: { favoritesCount: { decrement: 1 } }
          });
          return { favorited: false };
        } else {
          await prisma.favorite.create({
            data: { userId, listingId }
          });
          await prisma.listing.update({
            where: { id: listingId },
            data: { favoritesCount: { increment: 1 } }
          });
          return { favorited: true };
        }
      } catch {
        const idx = mockDb.favorites.findIndex(f => f.userId === userId && f.listingId === listingId);
        const listing = mockDb.listings.find(l => l.id === listingId);
        if (idx !== -1) {
          mockDb.favorites.splice(idx, 1);
          if (listing) listing.favoritesCount = Math.max(0, listing.favoritesCount - 1);
          return { favorited: false };
        } else {
          mockDb.favorites.push({ id: 'fav-' + Math.random().toString(36).substr(2, 9), userId, listingId, createdAt: new Date() });
          if (listing) listing.favoritesCount++;
          return { favorited: true };
        }
      }
    },

    async isFavorited(userId: string, listingId: string): Promise<boolean> {
      try {
        const existing = await prisma.favorite.findUnique({
          where: { userId_listingId: { userId, listingId } }
        });
        return !!existing;
      } catch {
        return mockDb.favorites.some(f => f.userId === userId && f.listingId === listingId);
      }
    },

    async getFavorites(userId: string): Promise<Listing[]> {
      try {
        const favs = await prisma.favorite.findMany({
          where: { userId },
          include: {
            listing: {
              include: {
                auction: true,
                seller: { include: { profile: true } }
              }
            }
          }
        });
        return favs.map((f: any) => f.listing) as any;
      } catch {
        const listIds = mockDb.favorites.filter((f: any) => f.userId === userId).map((f: any) => f.listingId);
        return mockDb.listings
          .filter((l: any) => listIds.includes(l.id))
          .map((item: any) => {
            const auction = mockDb.auctions.find(a => a.listingId === item.id);
            const profile = mockDb.profiles.find(p => p.userId === item.sellerId);
            return {
              ...item,
              auction,
              sellerUsername: profile?.minecraftUsername,
              sellerAvatar: profile?.avatarUrl
            };
          });
      }
    },

    async setFeatured(id: string, isFeatured: boolean): Promise<boolean> {
      try {
        await prisma.listing.update({
          where: { id },
          data: { isFeatured }
        });
        return true;
      } catch {
        const l = mockDb.listings.find(l => l.id === id);
        if (l) {
          l.isFeatured = isFeatured;
          return true;
        }
        return false;
      }
    }
  },

  auction: {
    async placeBid(userId: string, auctionId: string, amount: number): Promise<{ success: boolean; error?: string }> {
      try {
        // Run Prisma transaction to prevent race conditions
        const result = await prisma.$transaction(async (tx: any) => {
          const auction = await tx.auction.findUnique({
            where: { id: auctionId },
            include: { listing: true }
          });
          if (!auction || auction.status !== 'ACTIVE') throw new Error('Auction is not active');
          if (new Date() > auction.endDate) throw new Error('Auction has ended');

          const minRequired = auction.currentBid + auction.minimumIncrement;
          if (amount < minRequired) {
            throw new Error(`Bid must be at least ${minRequired}`);
          }

          const previousBidderId = auction.currentBidderId;

          // Update auction
          const updated = await tx.auction.update({
            where: { id: auctionId },
            data: {
              currentBid: amount,
              currentBidderId: userId,
              bidCount: { increment: 1 }
            }
          });

          // Create Bid entry
          await tx.bid.create({
            data: {
              auctionId,
              bidderId: userId,
              amount
            }
          });

          return { updated, previousBidderId, listingTitle: auction.listing.title };
        });

        // Async notify previous outbid user
        if (result.previousBidderId && result.previousBidderId !== userId) {
          await db.notification.create({
            userId: result.previousBidderId,
            type: 'OUTBID',
            title: 'Outbid Alert!',
            content: `You have been outbid on "${result.listingTitle}". New highest bid is ${amount} Donut Dollars.`,
            link: `/listings/${result.updated.listingId}`
          });
        }

        return { success: true };
      } catch (err: any) {
        console.warn("PostgreSQL bid error, executing mock transaction", err.message);
        const auction = mockDb.auctions.find(a => a.id === auctionId);
        if (!auction || auction.status !== 'ACTIVE') return { success: false, error: 'Auction is not active' };
        if (new Date() > new Date(auction.endDate)) return { success: false, error: 'Auction has ended' };

        const minRequired = auction.currentBid + auction.minimumIncrement;
        if (amount < minRequired) {
          return { success: false, error: `Bid must be at least ${minRequired} Donut Dollars.` };
        }

        const prevBidder = auction.currentBidderId;
        auction.currentBid = amount;
        auction.currentBidderId = userId;
        const profile = mockDb.profiles.find(p => p.userId === userId);
        auction.currentBidderUsername = profile?.minecraftUsername || 'Unknown';
        auction.bidCount++;

        mockDb.bids.push({
          id: 'b-' + Math.random().toString(36).substr(2, 9),
          auctionId,
          bidderId: userId,
          bidderUsername: profile?.minecraftUsername || 'Unknown',
          amount,
          createdAt: new Date()
        });

        if (prevBidder && prevBidder !== userId) {
          const l = mockDb.listings.find(item => item.id === auction.listingId);
          await db.notification.create({
            userId: prevBidder,
            type: 'OUTBID',
            title: 'Outbid Alert!',
            content: `You have been outbid on "${l?.title}". New highest bid is ${amount} Donut Dollars.`,
            link: `/listings/${auction.listingId}`
          });
        }

        return { success: true };
      }
    }
  },

  trade: {
    async create(listingId: string, buyerId: string): Promise<TradeTicket> {
      try {
        const listing = await prisma.listing.findUnique({ where: { id: listingId } });
        if (!listing) throw new Error("Listing not found");

        const ticket = await prisma.tradeTicket.create({
          data: {
            listingId,
            buyerId,
            sellerId: listing.sellerId,
            status: 'PENDING'
          },
          include: {
            listing: true,
            buyer: { include: { profile: true } },
            seller: { include: { profile: true } }
          }
        });

        // Create initial system log message in the ticket
        await prisma.tradeMessage.create({
          data: {
            tradeTicketId: ticket.id,
            content: `Trade ticket opened by buyer. Status set to Pending.`,
            isSystem: true
          }
        });

        // Notify seller
        await db.notification.create({
          userId: listing.sellerId,
          type: 'TRADE_UPDATE',
          title: 'New Trade Ticket Opened',
          content: `A player has requested to buy your listing "${listing.title}". Click here to open details.`,
          link: `/trades/${ticket.id}`
        });

        return ticket as any;
      } catch (err) {
        console.warn("Postgres trade open error, executing mock", err);
        const l = mockDb.listings.find(item => item.id === listingId);
        if (!l) throw new Error("Listing not found");

        const buyerProfile = mockDb.profiles.find(p => p.userId === buyerId);
        const sellerProfile = mockDb.profiles.find(p => p.userId === l.sellerId);

        const ticketId = 't-' + Math.random().toString(36).substr(2, 9);
        const ticket: TradeTicket = {
          id: ticketId,
          listingId,
          listingTitle: l.title,
          listingPrice: l.price,
          listingType: l.type,
          buyerId,
          buyerUsername: buyerProfile?.minecraftUsername || 'Unknown',
          sellerId: l.sellerId,
          sellerUsername: sellerProfile?.minecraftUsername || 'Unknown',
          status: 'PENDING',
          escrowStatus: 'PENDING',
          paymentStatus: 'UNPAID',
          createdAt: new Date(),
          updatedAt: new Date()
        };

        mockDb.tradeTickets.push(ticket);

        mockDb.tradeMessages.push({
          id: 'tm-' + Math.random().toString(36).substr(2, 9),
          tradeTicketId: ticketId,
          senderId: null,
          senderUsername: null,
          content: `Trade ticket opened by buyer. Status set to Pending. Manual Trade Warning: Make sure to capture screenshots/video of the trade inside Minecraft!`,
          attachmentUrls: [],
          isSystem: true,
          createdAt: new Date()
        });

        await db.notification.create({
          userId: l.sellerId,
          type: 'TRADE_UPDATE',
          title: 'New Trade Ticket Opened',
          content: `A player has requested to buy your listing "${l.title}". Click here to open details.`,
          link: `/trades/${ticketId}`
        });

        return ticket;
      }
    },

    async get(id: string): Promise<TradeTicket | null> {
      try {
        const ticket = await prisma.tradeTicket.findUnique({
          where: { id },
          include: {
            listing: true,
            buyer: { include: { profile: true } },
            seller: { include: { profile: true } }
          }
        });
        if (!ticket) return null;
        return {
          id: ticket.id,
          listingId: ticket.listingId,
          listingTitle: ticket.listing.title,
          listingPrice: ticket.listing.price,
          listingType: ticket.listing.type,
          buyerId: ticket.buyerId,
          buyerUsername: ticket.buyer.profile?.minecraftUsername || 'Unknown',
          sellerId: ticket.sellerId,
          sellerUsername: ticket.seller.profile?.minecraftUsername || 'Unknown',
          status: ticket.status as any,
          escrowStatus: ticket.escrowStatus as any,
          paymentStatus: ticket.paymentStatus as any,
          createdAt: ticket.createdAt,
          updatedAt: ticket.updatedAt
        };
      } catch {
        return mockDb.tradeTickets.find(t => t.id === id) || null;
      }
    },

    async list(userId: string): Promise<TradeTicket[]> {
      try {
        const tickets = await prisma.tradeTicket.findMany({
          where: {
            OR: [
              { buyerId: userId },
              { sellerId: userId }
            ]
          },
          include: {
            listing: true,
            buyer: { include: { profile: true } },
            seller: { include: { profile: true } }
          },
          orderBy: { updatedAt: 'desc' }
        });
        return tickets.map((ticket: any) => ({
          id: ticket.id,
          listingId: ticket.listingId,
          listingTitle: ticket.listing.title,
          listingPrice: ticket.listing.price,
          listingType: ticket.listing.type,
          buyerId: ticket.buyerId,
          buyerUsername: ticket.buyer.profile?.minecraftUsername || 'Unknown',
          sellerId: ticket.sellerId,
          sellerUsername: ticket.seller.profile?.minecraftUsername || 'Unknown',
          status: ticket.status as any,
          escrowStatus: ticket.escrowStatus as any,
          paymentStatus: ticket.paymentStatus as any,
          createdAt: ticket.createdAt,
          updatedAt: ticket.updatedAt
        }));
      } catch {
        return mockDb.tradeTickets.filter(t => t.buyerId === userId || t.sellerId === userId);
      }
    },

    async updateStatus(id: string, status: TradeStatus, userId: string): Promise<boolean> {
      try {
        const ticket = await prisma.tradeTicket.findUnique({
          where: { id },
          include: { listing: true }
        });
        if (!ticket) return false;

        let escrowStatus = ticket.escrowStatus;
        let paymentStatus = ticket.paymentStatus;

        // Custom escrow simulation flow based on state shifts
        if (status === 'IN_PROGRESS') {
          escrowStatus = 'ACTIVE';
          paymentStatus = 'PAID';
        } else if (status === 'COMPLETED') {
          escrowStatus = 'RELEASED';
          
          // Complete profile transaction increment
          await prisma.profile.update({
            where: { userId: ticket.buyerId },
            data: { completedTrades: { increment: 1 } }
          });
          await prisma.profile.update({
            where: { userId: ticket.sellerId },
            data: { completedTrades: { increment: 1 } }
          });

          // Mark listing as sold
          await db.listing.updateStatus(ticket.listingId, 'SOLD');
        } else if (status === 'CANCELLED') {
          escrowStatus = 'REFUNDED';
          paymentStatus = 'REFUNDED';
        }

        await prisma.tradeTicket.update({
          where: { id },
          data: { status, escrowStatus, paymentStatus }
        });

        const userProfile = await prisma.profile.findFirst({ where: { userId } });
        const name = userProfile?.minecraftUsername || 'Moderator';

        await prisma.tradeMessage.create({
          data: {
            tradeTicketId: id,
            content: `Trade status updated to ${status} by ${name}.`,
            isSystem: true
          }
        });

        // Notify counter-party
        const targetUser = ticket.buyerId === userId ? ticket.sellerId : ticket.buyerId;
        await db.notification.create({
          userId: targetUser,
          type: 'TRADE_UPDATE',
          title: `Trade ${status}`,
          content: `Trade for "${ticket.listing.title}" is now ${status}.`,
          link: `/trades/${id}`
        });

        return true;
      } catch {
        const t = mockDb.tradeTickets.find(ticket => ticket.id === id);
        if (!t) return false;

        t.status = status;
        if (status === 'IN_PROGRESS') {
          t.escrowStatus = 'ACTIVE';
          t.paymentStatus = 'PAID';
        } else if (status === 'COMPLETED') {
          t.escrowStatus = 'RELEASED';
          
          const buyerP = mockDb.profiles.find(p => p.userId === t.buyerId);
          if (buyerP) buyerP.completedTrades++;
          
          const sellerP = mockDb.profiles.find(p => p.userId === t.sellerId);
          if (sellerP) sellerP.completedTrades++;

          const l = mockDb.listings.find(item => item.id === t.listingId);
          if (l) {
            await db.listing.updateStatus(t.listingId, 'SOLD');
          }
        } else if (status === 'CANCELLED') {
          t.escrowStatus = 'REFUNDED';
          t.paymentStatus = 'REFUNDED';
        }

        t.updatedAt = new Date();

        const userProfile = mockDb.profiles.find(p => p.userId === userId);
        const name = userProfile?.minecraftUsername || 'System';

        mockDb.tradeMessages.push({
          id: 'tm-' + Math.random().toString(36).substr(2, 9),
          tradeTicketId: id,
          senderId: null,
          senderUsername: null,
          content: `Trade status updated to ${status} by ${name}.`,
          attachmentUrls: [],
          isSystem: true,
          createdAt: new Date()
        });

        const targetUser = t.buyerId === userId ? t.sellerId : t.buyerId;
        await db.notification.create({
          userId: targetUser,
          type: 'TRADE_UPDATE',
          title: `Trade ${status}`,
          content: `Trade for "${t.listingTitle}" is now ${status}.`,
          link: `/trades/${id}`
        });

        return true;
      }
    },

    async getMessages(tradeTicketId: string): Promise<TradeMessage[]> {
      try {
        const list = await prisma.tradeMessage.findMany({
          where: { tradeTicketId },
          include: { sender: { include: { profile: true } } },
          orderBy: { createdAt: 'asc' }
        });
        return list.map((m: any) => ({
          id: m.id,
          tradeTicketId: m.tradeTicketId,
          senderId: m.senderId,
          senderUsername: m.sender?.profile?.minecraftUsername || null,
          content: m.content,
          attachmentUrls: m.attachmentUrls,
          isSystem: m.isSystem,
          createdAt: m.createdAt
        }));
      } catch {
        return mockDb.tradeMessages.filter(m => m.tradeTicketId === tradeTicketId);
      }
    },

    async sendMessage(tradeTicketId: string, senderId: string, content: string, attachmentUrls: string[] = []): Promise<TradeMessage> {
      try {
        const m = await prisma.tradeMessage.create({
          data: {
            tradeTicketId,
            senderId,
            content,
            attachmentUrls
          },
          include: { sender: { include: { profile: true } } }
        });

        await prisma.tradeTicket.update({
          where: { id: tradeTicketId },
          data: { updatedAt: new Date() }
        });

        return {
          id: m.id,
          tradeTicketId: m.tradeTicketId,
          senderId: m.senderId,
          senderUsername: m.sender?.profile?.minecraftUsername || null,
          content: m.content,
          attachmentUrls: m.attachmentUrls,
          isSystem: m.isSystem,
          createdAt: m.createdAt
        };
      } catch {
        const profile = mockDb.profiles.find(p => p.userId === senderId);
        const m: TradeMessage = {
          id: 'tm-' + Math.random().toString(36).substr(2, 9),
          tradeTicketId,
          senderId,
          senderUsername: profile?.minecraftUsername || 'Unknown',
          content,
          attachmentUrls,
          isSystem: false,
          createdAt: new Date()
        };
        mockDb.tradeMessages.push(m);

        const ticket = mockDb.tradeTickets.find(t => t.id === tradeTicketId);
        if (ticket) ticket.updatedAt = new Date();

        return m;
      }
    }
  },

  messages: {
    async startConversation(listingId: string, buyerId: string): Promise<Conversation> {
      try {
        const l = await prisma.listing.findUnique({ where: { id: listingId } });
        if (!l) throw new Error("Listing not found");

        const conv = await prisma.conversation.upsert({
          where: {
            listingId_buyerId_sellerId: {
              listingId,
              buyerId,
              sellerId: l.sellerId
            }
          },
          update: {},
          create: {
            listingId,
            buyerId,
            sellerId: l.sellerId
          },
          include: {
            listing: true,
            buyer: { include: { profile: true } },
            seller: { include: { profile: true } }
          }
        });

        return {
          id: conv.id,
          listingId: conv.listingId,
          listingTitle: conv.listing.title,
          buyerId: conv.buyerId,
          buyerUsername: conv.buyer.profile?.minecraftUsername || 'Unknown',
          sellerId: conv.sellerId,
          sellerUsername: conv.seller.profile?.minecraftUsername || 'Unknown',
          updatedAt: conv.updatedAt
        };
      } catch {
        const l = mockDb.listings.find(item => item.id === listingId);
        if (!l) throw new Error("Listing not found");

        let conv = mockDb.conversations.find(c => c.listingId === listingId && c.buyerId === buyerId && c.sellerId === l.sellerId);
        if (!conv) {
          const buyerProfile = mockDb.profiles.find(p => p.userId === buyerId);
          const sellerProfile = mockDb.profiles.find(p => p.userId === l.sellerId);
          conv = {
            id: 'c-' + Math.random().toString(36).substr(2, 9),
            listingId,
            listingTitle: l.title,
            buyerId,
            buyerUsername: buyerProfile?.minecraftUsername || 'Unknown',
            sellerId: l.sellerId,
            sellerUsername: sellerProfile?.minecraftUsername || 'Unknown',
            updatedAt: new Date()
          };
          mockDb.conversations.push(conv);
        }
        return conv;
      }
    },

    async listConversations(userId: string): Promise<Conversation[]> {
      try {
        const convs = await prisma.conversation.findMany({
          where: {
            OR: [
              { buyerId: userId },
              { sellerId: userId }
            ]
          },
          include: {
            listing: true,
            buyer: { include: { profile: true } },
            seller: { include: { profile: true } },
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          },
          orderBy: { updatedAt: 'desc' }
        });

        return convs.map((c: any) => {
          const lastMsg = c.messages[0];
          return {
            id: c.id,
            listingId: c.listingId,
            listingTitle: c.listing.title,
            buyerId: c.buyerId,
            buyerUsername: c.buyer.profile?.minecraftUsername || 'Unknown',
            sellerId: c.sellerId,
            sellerUsername: c.seller.profile?.minecraftUsername || 'Unknown',
            updatedAt: c.updatedAt,
            lastMessage: lastMsg ? lastMsg.content : undefined
          };
        });
      } catch {
        return mockDb.conversations
          .filter((c: any) => c.buyerId === userId || c.sellerId === userId)
          .map((c: any) => {
            const msgs = mockDb.messages.filter((m: any) => m.conversationId === c.id).sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime());
            return {
              ...c,
              lastMessage: msgs[0]?.content
            };
          });
      }
    },

    async getMessages(conversationId: string): Promise<Message[]> {
      try {
        // Mark as read first
        await prisma.message.updateMany({
          where: { conversationId, read: false },
          data: { read: true }
        });

        const msgs = await prisma.message.findMany({
          where: { conversationId },
          include: { sender: { include: { profile: true } } },
          orderBy: { createdAt: 'asc' }
        });

        return msgs.map((m: any) => ({
          id: m.id,
          conversationId: m.conversationId,
          senderId: m.senderId,
          senderUsername: m.sender.profile?.minecraftUsername || 'Unknown',
          content: m.content,
          read: m.read,
          createdAt: m.createdAt
        }));
      } catch {
        const msgs = mockDb.messages.filter(m => m.conversationId === conversationId);
        msgs.forEach(m => m.read = true);
        return msgs;
      }
    },

    async sendMessage(conversationId: string, senderId: string, content: string): Promise<Message> {
      try {
        const m = await prisma.message.create({
          data: {
            conversationId,
            senderId,
            content
          },
          include: { sender: { include: { profile: true } } }
        });

        const conv = await prisma.conversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() }
        });

        // Notify recipient
        const recipientId = conv.buyerId === senderId ? conv.sellerId : conv.buyerId;
        const senderProfile = m.sender.profile?.minecraftUsername || 'A buyer';
        await db.notification.create({
          userId: recipientId,
          type: 'MESSAGE',
          title: `New Message from ${senderProfile}`,
          content: content.length > 40 ? content.substring(0, 40) + '...' : content,
          link: `/messages?id=${conversationId}`
        });

        return {
          id: m.id,
          conversationId: m.conversationId,
          senderId: m.senderId,
          senderUsername: m.sender.profile?.minecraftUsername || 'Unknown',
          content: m.content,
          read: m.read,
          createdAt: m.createdAt
        };
      } catch {
        const profile = mockDb.profiles.find(p => p.userId === senderId);
        const m: Message = {
          id: 'msg-' + Math.random().toString(36).substr(2, 9),
          conversationId,
          senderId,
          senderUsername: profile?.minecraftUsername || 'Unknown',
          content,
          read: false,
          createdAt: new Date()
        };
        mockDb.messages.push(m);

        const conv = mockDb.conversations.find(c => c.id === conversationId);
        if (conv) {
          conv.updatedAt = new Date();
          const recipientId = conv.buyerId === senderId ? conv.sellerId : conv.buyerId;
          await db.notification.create({
            userId: recipientId,
            type: 'MESSAGE',
            title: `New Message from ${profile?.minecraftUsername || 'A buyer'}`,
            content: content.length > 40 ? content.substring(0, 40) + '...' : content,
            link: `/messages?id=${conversationId}`
          });
        }

        return m;
      }
    }
  },

  reviews: {
    async create(reviewerId: string, tradeTicketId: string, rating: number, text: string): Promise<Review> {
      try {
        const ticket = await prisma.tradeTicket.findUnique({
          where: { id: tradeTicketId },
          include: { listing: true }
        });
        if (!ticket) throw new Error("Trade ticket not found");

        const revieweeId = ticket.buyerId === reviewerId ? ticket.sellerId : ticket.buyerId;

        const rev = await prisma.review.create({
          data: {
            reviewerId,
            revieweeId,
            tradeTicketId,
            rating,
            text
          },
          include: { reviewer: { include: { profile: true } } }
        });

        // Update target profile ratings cache
        const allReviews = await prisma.review.findMany({ where: { revieweeId } });
        const avg = allReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / allReviews.length;

        await prisma.profile.update({
          where: { userId: revieweeId },
          data: {
            averageRating: avg,
            reviewCount: allReviews.length
          }
        });

        // Notify reviewee
        await db.notification.create({
          userId: revieweeId,
          type: 'REVIEW',
          title: 'New Trade Review Received',
          content: `${rev.reviewer.profile?.minecraftUsername || 'A user'} rated you ${rating}/5 stars.`,
          link: `/u/${rev.reviewer.profile?.minecraftUsername}`
        });

        return {
          id: rev.id,
          reviewerId: rev.reviewerId,
          reviewerUsername: rev.reviewer.profile?.minecraftUsername || 'Unknown',
          revieweeId: rev.revieweeId,
          rating: rev.rating,
          text: rev.text,
          tradeTicketId: rev.tradeTicketId,
          createdAt: rev.createdAt
        };
      } catch {
        const ticket = mockDb.tradeTickets.find(t => t.id === tradeTicketId);
        if (!ticket) throw new Error("Trade ticket not found");

        const revieweeId = ticket.buyerId === reviewerId ? ticket.sellerId : ticket.buyerId;
        const revProfile = mockDb.profiles.find(p => p.userId === reviewerId);

        const rev: Review = {
          id: 'rev-' + Math.random().toString(36).substr(2, 9),
          reviewerId,
          reviewerUsername: revProfile?.minecraftUsername || 'Unknown',
          revieweeId,
          rating,
          text,
          tradeTicketId,
          createdAt: new Date()
        };

        mockDb.reviews.push(rev);

        // Update mock profiles stats
        const revieweeP = mockDb.profiles.find(p => p.userId === revieweeId);
        if (revieweeP) {
          const allR = mockDb.reviews.filter(r => r.revieweeId === revieweeId);
          const sum = allR.reduce((s: number, r: any) => s + r.rating, 0);
          revieweeP.reviewCount = allR.length;
          revieweeP.averageRating = Number((sum / allR.length).toFixed(1));
          // Apply Verified trader badge logic: older than 30 days (mocking true) and threshold
          if (revieweeP.completedTrades >= 15) {
            revieweeP.verified = true;
          }
        }

        await db.notification.create({
          userId: revieweeId,
          type: 'REVIEW',
          title: 'New Trade Review Received',
          content: `${revProfile?.minecraftUsername || 'A user'} rated you ${rating}/5 stars: "${text}"`,
          link: `/u/${revieweeP?.minecraftUsername}`
        });

        return rev;
      }
    },

    async listForUser(userId: string): Promise<Review[]> {
      try {
        const revs = await prisma.review.findMany({
          where: { revieweeId: userId },
          include: { reviewer: { include: { profile: true } } },
          orderBy: { createdAt: 'desc' }
        });
        return revs.map((r: any) => ({
          id: r.id,
          reviewerId: r.reviewerId,
          reviewerUsername: r.reviewer.profile?.minecraftUsername || 'Unknown',
          revieweeId: r.revieweeId,
          rating: r.rating,
          text: r.text,
          tradeTicketId: r.tradeTicketId,
          createdAt: r.createdAt
        }));
      } catch {
        return mockDb.reviews.filter(r => r.revieweeId === userId);
      }
    }
  },

  notification: {
    async create(data: { userId: string; type: NotificationType; title: string; content: string; link?: string }): Promise<Notification> {
      try {
        const n = await prisma.notification.create({
          data: {
            userId: data.userId,
            type: data.type,
            title: data.title,
            content: data.content,
            link: data.link
          }
        });
        return n as any;
      } catch {
        const n: Notification = {
          id: 'notif-' + Math.random().toString(36).substr(2, 9),
          userId: data.userId,
          type: data.type,
          title: data.title,
          content: data.content,
          read: false,
          link: data.link,
          createdAt: new Date()
        };
        mockDb.notifications.push(n);
        return n;
      }
    },

    async list(userId: string): Promise<Notification[]> {
      try {
        const list = await prisma.notification.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' }
        });
        return list as any;
      } catch {
        return mockDb.notifications.filter(n => n.userId === userId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      }
    },

    async markAllRead(userId: string): Promise<boolean> {
      try {
        await prisma.notification.updateMany({
          where: { userId, read: false },
          data: { read: true }
        });
        return true;
      } catch {
        mockDb.notifications.filter(n => n.userId === userId).forEach(n => n.read = true);
        return true;
      }
    }
  },

  report: {
    async create(reporterId: string, targetType: ReportTarget, targetId: string, reason: string): Promise<Report> {
      try {
        const r = await prisma.report.create({
          data: {
            reporterId,
            targetType,
            targetId,
            reason
          },
          include: { reporter: { include: { profile: true } } }
        });
        return {
          id: r.id,
          reporterId: r.reporterId,
          reporterUsername: r.reporter.profile?.minecraftUsername || 'Unknown',
          targetType: r.targetType as any,
          targetId: r.targetId,
          reason: r.reason,
          status: r.status as any,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt
        };
      } catch {
        const p = mockDb.profiles.find(p => p.userId === reporterId);
        
        let targetName = targetId;
        if (targetType === 'LISTING') {
          targetName = mockDb.listings.find(l => l.id === targetId)?.title || targetId;
        } else if (targetType === 'USER') {
          targetName = mockDb.profiles.find(u => u.userId === targetId)?.minecraftUsername || targetId;
        }

        const r: Report = {
          id: 'rep-' + Math.random().toString(36).substr(2, 9),
          reporterId,
          reporterUsername: p?.minecraftUsername || 'Unknown',
          targetType,
          targetId,
          targetName,
          reason,
          status: 'PENDING',
          createdAt: new Date(),
          updatedAt: new Date()
        };
        mockDb.reports.push(r);
        return r;
      }
    },

    async list(): Promise<Report[]> {
      try {
        const list = await prisma.report.findMany({
          include: {
            reporter: { include: { profile: true } },
            resolver: { include: { profile: true } }
          },
          orderBy: { createdAt: 'desc' }
        });
        return list.map((r: any) => ({
          id: r.id,
          reporterId: r.reporterId,
          reporterUsername: r.reporter.profile?.minecraftUsername || 'Unknown',
          targetType: r.targetType as any,
          targetId: r.targetId,
          reason: r.reason,
          status: r.status as any,
          createdAt: r.createdAt,
          resolverId: r.resolverId,
          resolverUsername: r.resolver?.profile?.minecraftUsername,
          resolutionNotes: r.resolutionNotes,
          updatedAt: r.updatedAt
        }));
      } catch {
        return mockDb.reports;
      }
    },

    async resolve(id: string, resolverId: string, status: ReportStatus, notes: string): Promise<boolean> {
      try {
        await prisma.report.update({
          where: { id },
          data: {
            status,
            resolverId,
            resolutionNotes: notes,
            updatedAt: new Date()
          }
        });
        return true;
      } catch {
        const r = mockDb.reports.find(rep => rep.id === id);
        if (!r) return false;

        const resolverP = mockDb.profiles.find(p => p.userId === resolverId);
        r.status = status;
        r.resolverId = resolverId;
        r.resolverUsername = resolverP?.minecraftUsername || 'Admin';
        r.resolutionNotes = notes;
        r.updatedAt = new Date();
        return true;
      }
    }
  },

  admin: {
    async getStats(): Promise<{
      totalListings: number;
      completedTrades: number;
      registeredUsers: number;
      activeAuctions: number;
    }> {
      try {
        const totalListings = await prisma.listing.count();
        const completedTrades = await prisma.tradeTicket.count({ where: { status: 'COMPLETED' } });
        const registeredUsers = await prisma.user.count();
        const activeAuctions = await prisma.auction.count({ where: { status: 'ACTIVE' } });
        return { totalListings, completedTrades, registeredUsers, activeAuctions };
      } catch {
        return {
          totalListings: mockDb.listings.length,
          completedTrades: mockDb.tradeTickets.filter(t => t.status === 'COMPLETED').length,
          registeredUsers: mockDb.users.length,
          activeAuctions: mockDb.auctions.filter(a => a.status === 'ACTIVE').length
        };
      }
    },

    async log(adminId: string, action: string, target: string, details?: string): Promise<void> {
      try {
        await prisma.adminLog.create({
          data: { adminId, action, target, details }
        });
      } catch {
        mockDb.adminLogs.push({
          id: 'log-' + Math.random().toString(36).substr(2, 9),
          adminId,
          action,
          target,
          details,
          createdAt: new Date()
        });
      }
    }
  }
};

export default db;
