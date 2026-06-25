// Market Engine - Dynamic pricing and player market system

import { priceMultiplierFromMarketSupply } from './caravanEconomy';

// Item base prices
const BASE_PRICES: Record<string, number> = {
  health_potion: 50,
  mana_potion: 75,
  iron_sword: 200,
  steel_armor: 500,
  healing_herb: 25,
  magic_crystal: 150,
  quest_item: 100,
  rare_item: 1000,
};

// Price history for tracking
interface PriceRecord {
  itemId: string;
  price: number;
  timestamp: number;
  location: string;
}

// Player market listing
export interface MarketListing {
  id: string;
  sellerId: string;
  itemId: string;
  quantity: number;
  pricePerUnit: number;
  listedAt: number;
  expiresAt: number;
}

// Transaction record
export interface Transaction {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  itemId: string;
  quantity: number;
  totalPrice: number;
  completedAt: number;
}

// Active listings
const activeListings = new Map<string, MarketListing>();
const transactionHistory: Transaction[] = [];
const priceHistory: PriceRecord[] = [];

// Create a new listing
export function createListing(
  sellerId: string,
  itemId: string,
  quantity: number,
  pricePerUnit: number,
  durationHours = 24
): MarketListing | null {
  if (quantity <= 0 || pricePerUnit <= 0) return null;

  const listing: MarketListing = {
    id: `listing_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    sellerId,
    itemId,
    quantity,
    pricePerUnit,
    listedAt: Date.now(),
    expiresAt: Date.now() + durationHours * 60 * 60 * 1000,
  };

  activeListings.set(listing.id, listing);
  return listing;
}

// Get listings for an item
export function getListingsForItem(itemId: string): MarketListing[] {
  const now = Date.now();
  return Array.from(activeListings.values())
    .filter(l => l.itemId === itemId && l.expiresAt > now)
    .sort((a, b) => a.pricePerUnit - b.pricePerUnit);
}

// Purchase from listing
export function purchaseListing(
  listingId: string,
  buyerId: string,
  quantity: number
): Transaction | null {
  const listing = activeListings.get(listingId);
  if (!listing) return null;

  if (listing.expiresAt < Date.now()) {
    activeListings.delete(listingId);
    return null;
  }

  if (quantity > listing.quantity) return null;

  const totalPrice = listing.pricePerUnit * quantity;

  const transaction: Transaction = {
    id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    listingId,
    buyerId,
    sellerId: listing.sellerId,
    itemId: listing.itemId,
    quantity,
    totalPrice,
    completedAt: Date.now(),
  };

  transactionHistory.push(transaction);

  // Update listing
  listing.quantity -= quantity;
  if (listing.quantity <= 0) {
    activeListings.delete(listingId);
  }

  // Record price history
  priceHistory.push({
    itemId: listing.itemId,
    price: listing.pricePerUnit,
    timestamp: Date.now(),
    location: 'market',
  });

  return transaction;
}

// Get dynamic price with market modifiers
export function getDynamicPrice(
  itemId: string,
  locationId: string,
  supplyModifier = 0
): number {
  const basePrice = BASE_PRICES[itemId] ?? 100;

  // Apply supply modifier
  const supplyMultiplier = priceMultiplierFromMarketSupply(supplyModifier);

  // Calculate dynamic price based on recent sales
  const recentPrices = priceHistory
    .filter(p => p.itemId === itemId)
    .slice(-10);

  let marketFactor = 1;
  if (recentPrices.length > 0) {
    const avgPrice = recentPrices.reduce((a, b) => a + b.price, 0) / recentPrices.length;
    marketFactor = avgPrice / basePrice;
  }

  return Math.round(basePrice * supplyMultiplier * marketFactor);
}

// Cancel a listing
export function cancelListing(listingId: string, sellerId: string): boolean {
  const listing = activeListings.get(listingId);
  if (!listing) return false;

  if (listing.sellerId !== sellerId) return false;

  activeListings.delete(listingId);
  return true;
}

// Get market statistics
export function getMarketStats(itemId: string): {
  lowestPrice: number;
  averagePrice: number;
  totalListings: number;
  volume24h: number;
} {
  const listings = getListingsForItem(itemId);
  const recentPrices = priceHistory.filter(
    p => p.itemId === itemId && Date.now() - p.timestamp < 24 * 60 * 60 * 1000
  );

  return {
    lowestPrice: listings.length > 0 ? listings[0].pricePerUnit : BASE_PRICES[itemId] ?? 100,
    averagePrice:
      recentPrices.length > 0
        ? recentPrices.reduce((a, b) => a + b.price, 0) / recentPrices.length
        : BASE_PRICES[itemId] ?? 100,
    totalListings: listings.length,
    volume24h: recentPrices.length,
  };
}

// Export
export const marketEngine = {
  createListing,
  getListingsForItem,
  purchaseListing,
  getDynamicPrice,
  cancelListing,
  getMarketStats,
};

export default marketEngine;