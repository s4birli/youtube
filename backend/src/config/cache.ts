import { logger } from './logger';
import { env } from './env';

/**
 * Simple in-memory cache with TTL support
 */
interface CacheItem<T> {
  value: T;
  expiry: number; // Timestamp when this item expires
}

/**
 * Cache configuration
 */
export interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  maxSize: number; // Maximum number of items in cache
}

/**
 * Cache service for storing and retrieving data with TTL
 */
export class CacheService {
  private cache: Map<string, CacheItem<unknown>> = new Map();
  private config: CacheConfig;

  constructor(config?: Partial<CacheConfig>) {
    this.config = {
      ttl: (config?.ttl || 30 * 60) * 1000, // Default: 30 minutes in ms
      maxSize: config?.maxSize || 100, // Default: maximum 100 items
    };

    // Start cleanup process
    this.startCleanupInterval();
    logger.info(
      `Cache initialized with TTL: ${this.config.ttl}ms, max size: ${this.config.maxSize}`
    );
  }

  /**
   * Set a value in the cache
   * @param key Cache key
   * @param value Value to store
   * @param ttl Optional custom TTL for this specific item (in seconds)
   */
  set<T>(key: string, value: T, ttl?: number): void {
    // Check if we need to enforce size limits
    if (this.cache.size >= this.config.maxSize) {
      this.enforceMaxSize();
    }

    // Calculate expiry time
    const expiryMs = ttl ? ttl * 1000 : this.config.ttl;
    const expiry = Date.now() + expiryMs;

    // Store in cache
    this.cache.set(key, { value, expiry } as CacheItem<unknown>);
    logger.debug(`Cache: Set key "${key}" with expiry in ${expiryMs}ms`);
  }

  /**
   * Get a value from the cache
   * @param key Cache key
   * @returns The cached value or undefined if not found/expired
   */
  get<T>(key: string): T | undefined {
    const item = this.cache.get(key) as CacheItem<T> | undefined;

    // If item doesn't exist or is expired, return undefined
    if (!item || item.expiry < Date.now()) {
      if (item) {
        // Remove expired item
        this.cache.delete(key);
        logger.debug(`Cache: Key "${key}" expired and was removed`);
      }
      return undefined;
    }

    logger.debug(`Cache: Hit for key "${key}"`);
    return item.value;
  }

  /**
   * Check if a key exists in the cache and is not expired
   * @param key Cache key
   * @returns True if the key exists and is not expired
   */
  has(key: string): boolean {
    const item = this.cache.get(key);
    return !!item && item.expiry >= Date.now();
  }

  /**
   * Delete a key from the cache
   * @param key Cache key
   */
  delete(key: string): void {
    this.cache.delete(key);
    logger.debug(`Cache: Deleted key "${key}"`);
  }

  /**
   * Clear the entire cache
   */
  clear(): void {
    this.cache.clear();
    logger.info('Cache: Cleared all items');
  }

  /**
   * Remove expired items from the cache
   */
  cleanup(): void {
    const now = Date.now();
    let removedCount = 0;

    for (const [key, item] of this.cache.entries()) {
      if (item.expiry < now) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      logger.debug(`Cache: Removed ${removedCount} expired items`);
    }
  }

  /**
   * Reduce cache size when it exceeds maximum
   */
  private enforceMaxSize(): void {
    // If we're at the limit, remove oldest items (30% of max)
    const itemsToRemove = Math.ceil(this.config.maxSize * 0.3);

    // Convert to array to sort by expiry
    const items = Array.from(this.cache.entries()).sort((a, b) => a[1].expiry - b[1].expiry);

    // Remove the items with earliest expiry
    for (let i = 0; i < Math.min(itemsToRemove, items.length); i++) {
      this.cache.delete(items[i][0]);
    }

    logger.debug(`Cache: Removed ${itemsToRemove} oldest items to enforce max size`);
  }

  /**
   * Start automatic cleanup interval
   */
  private startCleanupInterval(): void {
    // Run cleanup every 5 minutes
    const CLEANUP_INTERVAL = 5 * 60 * 1000;

    setInterval(() => {
      this.cleanup();
    }, CLEANUP_INTERVAL);

    logger.debug(`Cache: Cleanup interval started (every ${CLEANUP_INTERVAL}ms)`);
  }
}

// Create a global cache instance with settings from environment
export const cache = new CacheService({
  ttl: env.CACHE_TTL,
  maxSize: env.CACHE_MAX_ITEMS,
});
