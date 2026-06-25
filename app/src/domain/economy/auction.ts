// Auction System - Timed auctions for rare items

export interface Auction {
  id: string;
  sellerId: string;
  itemId: string;
  description: string;
  startingBid: number;
  currentBid: number;
  currentBidder: string | null;
  bids: AuctionBid[];
  endsAt: number;
  isEnded: boolean;
  itemSnapshot: Record<string, unknown>;
}

export interface AuctionBid {
  bidderId: string;
  amount: number;
  timestamp: number;
}

// Active auctions
const auctions = new Map<string, Auction>();

// Create auction
export function createAuction(
  sellerId: string,
  itemId: string,
  description: string,
  startingBid: number,
  durationHours: number,
  itemSnapshot: Record<string, unknown>
): Auction {
  const auction: Auction = {
    id: `auction_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    sellerId,
    itemId,
    description,
    startingBid,
    currentBid: startingBid,
    currentBidder: null,
    bids: [],
    endsAt: Date.now() + durationHours * 60 * 60 * 1000,
    isEnded: false,
    itemSnapshot,
  };

  auctions.set(auction.id, auction);
  return auction;
}

// Place bid
export function placeBid(
  auctionId: string,
  bidderId: string,
  amount: number
): Auction | null {
  const auction = auctions.get(auctionId);
  if (!auction) return null;

  if (auction.isEnded || auction.endsAt < Date.now()) {
    auction.isEnded = true;
    return auction;
  }

  // Must be higher than current bid
  if (amount <= auction.currentBid) return null;

  const bid: AuctionBid = {
    bidderId,
    amount,
    timestamp: Date.now(),
  };

  auction.bids.push(bid);
  auction.currentBid = amount;
  auction.currentBidder = bidderId;

  return auction;
}

// Get active auctions
export function getActiveAuctions(): Auction[] {
  const now = Date.now();
  return Array.from(auctions.values())
    .filter(a => !a.isEnded && a.endsAt > now)
    .sort((a, b) => a.endsAt - b.endsAt);
}

// Get auction by ID
export function getAuction(auctionId: string): Auction | null {
  return auctions.get(auctionId) ?? null;
}

// End auction and get winner
export function endAuction(auctionId: string): {
  auction: Auction;
  winner: string | null;
  finalBid: number;
} | null {
  const auction = auctions.get(auctionId);
  if (!auction) return null;

  auction.isEnded = true;

  return {
    auction,
    winner: auction.currentBidder,
    finalBid: auction.currentBid,
  };
}

// Get auction history for player
export function getPlayerAuctions(playerId: string): Auction[] {
  return Array.from(auctions.values()).filter(
    a => a.sellerId === playerId ||
      a.bids.some(b => b.bidderId === playerId)
  );
}

// Auto-expire auctions
export function tickAuctions(): Auction[] {
  const now = Date.now();
  const ended: Auction[] = [];

  for (const auction of auctions.values()) {
    if (!auction.isEnded && auction.endsAt <= now) {
      auction.isEnded = true;
      ended.push(auction);
    }
  }

  return ended;
}

// Export
export const auctionSystem = {
  createAuction,
  placeBid,
  getActiveAuctions,
  getAuction,
  endAuction,
  getPlayerAuctions,
  tickAuctions,
};

export default auctionSystem;