interface CacheEntry<T> {
  data: T
  timestamp: number
  expiry: number
  etag?: string
  lastModified?: string
}

interface CacheStats {
  memoryHits: number
  localStorageHits: number
  edgeCacheHits: number
  apiCalls: number
  totalRequests: number
}

class VercelExtremeCacheManager {
  private memoryCache = new Map<string, CacheEntry<any>>()
  private readonly DEFAULT_TTL = 7 * 24 * 60 * 60 * 1000 // 7 days
  private readonly EDGE_CACHE_TTL = 24 * 60 * 60 // 24 hours for edge cache
  private readonly STALE_WHILE_REVALIDATE = 30 * 24 * 60 * 60 // 30 days stale-while-revalidate
  private stats: CacheStats = {
    memoryHits: 0,
    localStorageHits: 0,
    edgeCacheHits: 0,
    apiCalls: 0,
    totalRequests: 0,
  }

  // Vercel Edge Cache headers for maximum caching
  getVercelCacheHeaders(maxAge: number = this.EDGE_CACHE_TTL): Record<string, string> {
    return {
      "Cache-Control": `public, max-age=${maxAge}, s-maxage=${maxAge}, stale-while-revalidate=${this.STALE_WHILE_REVALIDATE}`,
      "CDN-Cache-Control": `public, max-age=${maxAge}`,
      "Vercel-CDN-Cache-Control": `public, max-age=${maxAge}`,
      "Surrogate-Control": `public, max-age=${maxAge}`,
      "Edge-Cache": "cache,platform=vercel",
    }
  }

  // Generate cache key with version for cache busting
  generateCacheKey(baseKey: string, params?: Record<string, any>): string {
    const version = "v2" // Increment when cache structure changes
    const paramString = params ? JSON.stringify(params) : ""
    return `${version}_${baseKey}_${this.hashString(paramString)}`
  }

  private hashString(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36)
  }

  // Memory cache with LRU eviction
  setMemory<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    // Implement LRU eviction if cache gets too large
    if (this.memoryCache.size > 1000) {
      const oldestKey = this.memoryCache.keys().next().value
      this.memoryCache.delete(oldestKey)
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + ttl,
    }
    this.memoryCache.set(key, entry)
  }

  getMemory<T>(key: string): T | null {
    this.stats.totalRequests++
    const entry = this.memoryCache.get(key)
    if (!entry) return null

    if (Date.now() > entry.expiry) {
      this.memoryCache.delete(key)
      return null
    }

    this.stats.memoryHits++
    // Move to end for LRU
    this.memoryCache.delete(key)
    this.memoryCache.set(key, entry)
    return entry.data
  }

  // Enhanced localStorage with compression
  setLocalStorage<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const entry: CacheEntry<T> = {
          data,
          timestamp: Date.now(),
          expiry: Date.now() + ttl,
        }

        // Compress large data
        const serialized = JSON.stringify(entry)
        if (serialized.length > 50000) {
          // For large data, use compression-like technique
          const compressed = this.compressData(serialized)
          localStorage.setItem(`${key}_compressed`, compressed)
        } else {
          localStorage.setItem(key, serialized)
        }
      }
    } catch (error) {
      console.error("Failed to save to localStorage:", error)
      // Clear some space and retry
      this.clearOldLocalStorageEntries()
      try {
        const entry: CacheEntry<T> = { data, timestamp: Date.now(), expiry: Date.now() + ttl }
        localStorage.setItem(key, JSON.stringify(entry))
      } catch (retryError) {
        console.error("Failed to save to localStorage after cleanup:", retryError)
      }
    }
  }

  getLocalStorage<T>(key: string): T | null {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        let item = localStorage.getItem(key)

        // Try compressed version if regular version doesn't exist
        if (!item) {
          const compressed = localStorage.getItem(`${key}_compressed`)
          if (compressed) {
            item = this.decompressData(compressed)
          }
        }

        if (!item) return null

        const entry: CacheEntry<T> = JSON.parse(item)

        if (Date.now() > entry.expiry) {
          localStorage.removeItem(key)
          localStorage.removeItem(`${key}_compressed`)
          return null
        }

        this.stats.localStorageHits++
        return entry.data
      }
    } catch (error) {
      console.error("Failed to load from localStorage:", error)
    }
    return null
  }

  // Simple compression for localStorage
  private compressData(data: string): string {
    // Simple run-length encoding for JSON data
    return data.replace(/(.)\1+/g, (match, char) => {
      return match.length > 3 ? `${char}*${match.length}` : match
    })
  }

  private decompressData(data: string): string {
    return data.replace(/(.)\*(\d+)/g, (match, char, count) => {
      return char.repeat(Number.parseInt(count))
    })
  }

  // Clear old localStorage entries to free space
  private clearOldLocalStorageEntries(): void {
    if (typeof window !== "undefined" && window.localStorage) {
      const keys = Object.keys(localStorage)
      const now = Date.now()

      keys.forEach((key) => {
        if (key.startsWith("api_kaya_") || key.startsWith("v2_")) {
          try {
            const item = localStorage.getItem(key)
            if (item) {
              const entry = JSON.parse(item)
              if (entry.expiry && now > entry.expiry) {
                localStorage.removeItem(key)
              }
            }
          } catch (error) {
            // Remove corrupted entries
            localStorage.removeItem(key)
          }
        }
      })
    }
  }

  // Enhanced fallback chain with extreme caching
  async getWithFallback<T>(
    key: string,
    fetchFn: () => Promise<T>,
    fallbackData?: T,
    options: {
      maxAge?: number
      staleWhileRevalidate?: boolean
      forceRefresh?: boolean
    } = {},
  ): Promise<T> {
    const { maxAge = this.DEFAULT_TTL, staleWhileRevalidate = true, forceRefresh = false } = options

    if (!forceRefresh) {
      // Layer 1: Memory cache
      const memoryData = this.getMemory<T>(key)
      if (memoryData) {
        console.log(`[v0] Cache hit (memory): ${key}`)
        return memoryData
      }

      // Layer 2: localStorage
      const localData = this.getLocalStorage<T>(key)
      if (localData) {
        console.log(`[v0] Cache hit (localStorage): ${key}`)
        // Promote to memory cache
        this.setMemory(key, localData, maxAge)
        return localData
      }
    }

    // Layer 3: Try to fetch fresh data with retry logic
    let attempts = 0
    const maxAttempts = 3

    while (attempts < maxAttempts) {
      try {
        console.log(`[v0] Fetching fresh data (attempt ${attempts + 1}): ${key}`)
        this.stats.apiCalls++

        const data = await Promise.race([
          fetchFn(),
          new Promise<never>(
            (_, reject) => setTimeout(() => reject(new Error("Timeout")), 30000), // 30s timeout
          ),
        ])

        if (data) {
          // Store in all cache layers
          this.setMemory(key, data, maxAge)
          this.setLocalStorage(key, data, maxAge)
          console.log(`[v0] Fresh data cached: ${key}`)
          return data
        }
      } catch (error) {
        console.error(`[v0] Fetch attempt ${attempts + 1} failed for ${key}:`, error)
        attempts++

        if (attempts < maxAttempts) {
          // Exponential backoff
          await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempts) * 1000))
        }
      }
    }

    // Layer 4: Try expired localStorage data (stale-while-revalidate)
    if (staleWhileRevalidate) {
      try {
        if (typeof window !== "undefined" && window.localStorage) {
          const item = localStorage.getItem(key) || localStorage.getItem(`${key}_compressed`)
          if (item) {
            const decompressed = item.includes("*") ? this.decompressData(item) : item
            const entry: CacheEntry<T> = JSON.parse(decompressed)
            console.log(`[v0] Using stale cache: ${key}`)

            // Async revalidation in background
            setTimeout(() => {
              this.getWithFallback(key, fetchFn, undefined, { forceRefresh: true }).catch((err) =>
                console.error(`[v0] Background revalidation failed for ${key}:`, err),
              )
            }, 100)

            return entry.data
          }
        }
      } catch (error) {
        console.error(`[v0] Failed to load stale cache for ${key}:`, error)
      }
    }

    // Layer 5: Final fallback
    if (fallbackData) {
      console.log(`[v0] Using fallback data: ${key}`)
      return fallbackData
    }

    throw new Error(`No data available for ${key} after ${maxAttempts} attempts`)
  }

  // Preload critical data
  async preloadCriticalData(keys: Array<{ key: string; fetchFn: () => Promise<any> }>): Promise<void> {
    console.log(`[v0] Preloading ${keys.length} critical data entries`)

    const preloadPromises = keys.map(async ({ key, fetchFn }) => {
      try {
        // Check if we already have recent data
        const existing = this.getMemory(key) || this.getLocalStorage(key)
        if (existing) return

        // Preload in background
        await this.getWithFallback(key, fetchFn)
      } catch (error) {
        console.error(`[v0] Preload failed for ${key}:`, error)
      }
    })

    await Promise.allSettled(preloadPromises)
    console.log(`[v0] Preload completed`)
  }

  // Cache warming for popular endpoints
  async warmCache(): Promise<void> {
    const popularEndpoints = [
      { key: "list_page_1", fetchFn: () => fetch("/api/list?page=1&per_page=50").then((r) => r.json()) },
      { key: "search_popular", fetchFn: () => fetch("/api/search?q=video&page=1").then((r) => r.json()) },
      { key: "rand_page_1", fetchFn: () => fetch("/api/rand?page=1&per_page=20").then((r) => r.json()) },
    ]

    await this.preloadCriticalData(popularEndpoints)
  }

  // Get comprehensive cache statistics
  getStats(): CacheStats & {
    memorySize: number
    localStorageSize: number
    hitRate: number
    efficiency: number
  } {
    let localStorageSize = 0

    if (typeof window !== "undefined" && window.localStorage) {
      const keys = Object.keys(localStorage)
      keys.forEach((key) => {
        if (key.startsWith("api_kaya_") || key.startsWith("v2_")) {
          localStorageSize += localStorage.getItem(key)?.length || 0
        }
      })
    }

    const totalHits = this.stats.memoryHits + this.stats.localStorageHits + this.stats.edgeCacheHits
    const hitRate = this.stats.totalRequests > 0 ? (totalHits / this.stats.totalRequests) * 100 : 0
    const efficiency = this.stats.apiCalls > 0 ? totalHits / this.stats.apiCalls : 0

    return {
      ...this.stats,
      memorySize: this.memoryCache.size,
      localStorageSize,
      hitRate,
      efficiency,
    }
  }

  // Clear all caches
  clearAll(): void {
    this.memoryCache.clear()
    if (typeof window !== "undefined" && window.localStorage) {
      const keys = Object.keys(localStorage)
      keys.forEach((key) => {
        if (key.startsWith("api_kaya_") || key.startsWith("v2_")) {
          localStorage.removeItem(key)
        }
      })
    }

    // Reset stats
    this.stats = {
      memoryHits: 0,
      localStorageHits: 0,
      edgeCacheHits: 0,
      apiCalls: 0,
      totalRequests: 0,
    }
  }
}

export const cacheManager = new VercelExtremeCacheManager()

// Export cache headers helper for API routes
export const getVercelCacheHeaders = (maxAge?: number) => cacheManager.getVercelCacheHeaders(maxAge)
