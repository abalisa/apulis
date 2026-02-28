interface VideoItem {
  protected_embed: string
  size: string
  length: string
  protected_dl: string
  views: number
  single_img: string
  title: string
  status: string
  uploaded: string
  last_view: string
  splash_img: string
  filecode: string
  file_code: string
  canplay: boolean
  source: string
  tag: string[]
  deskripsi: string
  matched_keyword?: string // Optional field to track matched keyword
}

const cachedData: VideoItem[] | null = null
const lastFetchTime = 0
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 hari dalam ms (extreme caching)
const LOCALSTORAGE_KEY = "api_kaya_cache"
const LOCALSTORAGE_TIME_KEY = "api_kaya_cache_time"
const API_KEY = "37943j35tc5i1bg3gje5y"
const BASE_URL = "https://api.lulustream.com/api/file/list"
const DOOD_API_KEY = "112623ifbcbltzajwjrpjx"
const DOOD_BASE_URL = "https://doodapi.com/api"
const DOOD_SEARCH_URL = "https://doodapi.com/api"

import { cacheManager, CACHE_TTL } from "./cacheManager"

function saveToLocalStorage(data: VideoItem[]): void {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      localStorage.setItem(LOCALSTORAGE_KEY, JSON.stringify(data))
      localStorage.setItem(LOCALSTORAGE_TIME_KEY, Date.now().toString())
    }
  } catch (error) {
    console.error("Failed to save to localStorage:", error)
  }
}

function loadFromLocalStorage(): { data: VideoItem[] | null; timestamp: number } {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const data = localStorage.getItem(LOCALSTORAGE_KEY)
      const timestamp = localStorage.getItem(LOCALSTORAGE_TIME_KEY)

      if (data && timestamp) {
        return {
          data: JSON.parse(data),
          timestamp: Number.parseInt(timestamp),
        }
      }
    }
  } catch (error) {
    console.error("Failed to load from localStorage:", error)
  }

  return { data: null, timestamp: 0 }
}

// Helper functions
const parseDuration = (duration: any): number => {
  if (typeof duration === "number") return duration

  if (typeof duration === "string") {
    // Format HH:MM:SS atau MM:SS
    const parts = duration.split(":").reverse()
    return parts.reduce((total, val, idx) => {
      return total + (Number.parseInt(val) || 0) * Math.pow(60, idx)
    }, 0)
  }

  return 0
}

const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + " " + sizes[i]
}

const cleanTitle = (title: string): string => {
  return title.replace(/[^\w\s-]/g, "").trim()
}

const generateDescription = (title: string, tags: string[]): string => {
  return `${title} - Streaming video berkualitas tinggi. Tags: ${tags.join(", ")}`
}

const normalizeLuluItem = (item: any): VideoItem => {
  const filecode = item.file_code || item.filecode || ""
  const duration = parseDuration(item.file_length || item.length || 0)
  const rawTitle = item.title || item.file_title || ""
  const cleanedTitle = cleanTitle(rawTitle)
  const titleWords = rawTitle
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .split(/\s+/)
    .filter(Boolean)
  const titleTags = Array.from([...new Set(titleWords)].slice(0, 15)) as string[]
  const description = generateDescription(cleanedTitle, titleTags)

  return {
    protected_embed: item.protected_embed || `https://luvluv.pages.dev/${filecode}`,
    size: item.length || "",
    length: item.length || "",
    protected_dl: item.download_url || `https://lulustream.com/d/${filecode}`,
    views: item.views || item.file_views || 0,
    single_img: item.player_img || `https://img.lulucdn.com/${filecode}_t.jpg`,
    title: cleanedTitle,
    status: item.status || "active",
    uploaded: item.uploaded || "",
    last_view: item.last_view || "",
    splash_img: item.player_img || `https://img.lulucdn.com/${filecode}_xt.jpg`,
    filecode,
    file_code: filecode,
    canplay: item.canplay !== undefined ? item.canplay : true,
    source: item.api_source || "lulustream",
    tag: titleTags,
    deskripsi: description,
  }
}

// Get total pages first for parallel fetching
async function getTotalPages(): Promise<number> {
  const cacheKey = "lulu_total_pages"
  return cacheManager.withFunctionCache(
    cacheKey,
    async () => {
      try {
        const response = await fetch(`${BASE_URL}?key=${API_KEY}&per_page=1&page=1`)
        const data = await response.json()
        return data.result?.pages || 1
      } catch (error) {
        console.error("Error getting total pages", error)
        return 1
      }
    },
    60 * 60 * 1000,
  ) // Cache for 1 hour
}

async function fetchAllLuluData(): Promise<VideoItem[]> {
  try {
    // Get total pages first
    const totalPages = await getTotalPages()
    const perPage = 1000

    // Fetch pages in parallel - fetch all at once
    const maxPages = Math.min(totalPages, 20) // Limit to 20 pages
    const pagePromises: Promise<VideoItem[]>[] = []

    for (let page = 1; page <= maxPages; page++) {
      const pagePromise = (async () => {
        try {
          const cacheKey = `lulu_page_${page}`
          const pageData = await cacheManager.deduplicatedRequest(cacheKey, async () => {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 15000)

            try {
              const response = await fetch(
                `${BASE_URL}?key=${API_KEY}&per_page=${perPage}&page=${page}`,
                { signal: controller.signal },
              )
              const data = await response.json()
              clearTimeout(timeoutId)
              return data
            } finally {
              clearTimeout(timeoutId)
            }
          })

          if (pageData.status === 200 && pageData.result?.files?.length) {
            return pageData.result.files.map(normalizeLuluItem)
          }
          return []
        } catch (error) {
          console.error(`Error fetching page ${page}:`, error)
          return []
        }
      })()

      pagePromises.push(pagePromise)
    }

    // Wait for all pages in parallel
    const allPages = await Promise.all(pagePromises)
    const allItems = allPages.flat()

    console.log(`[v0] Fetched ${allItems.length} items from ${maxPages} pages in parallel`)
    return allItems
  } catch (error) {
    console.error("Error in fetchAllLuluData", error)
    return []
  }
}

// DoodAPI List function
export async function fetchDoodApiList(page: number, perPage: number) {
  const cacheKey = cacheManager.generateCacheKey("doodapi_list", { page, perPage })

  return cacheManager.getWithFallback(
    cacheKey,
    async () => {
      const response = await fetch(`${DOOD_BASE_URL}/file/list?key=${DOOD_API_KEY}&per_page=${perPage}&page=${page}`, {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      return response.json()
    },
    null,
    {
      maxAge: CACHE_TTL.DOOD_LIST * 1000,
      staleWhileRevalidate: true,
    },
  )
}

// DoodAPI Search function
export async function fetchDoodApiResults(searchTerm: string): Promise<any[]> {
  const cacheKey = cacheManager.generateCacheKey("doodapi_search", { searchTerm })

  return cacheManager.getWithFallback(
    cacheKey,
    async () => {
      const keywords = searchTerm
        .toLowerCase()
        .split(/\s+/)
        .filter((keyword) => keyword.length >= 2)
        .slice(0, 5)

      if (keywords.length === 0) {
        return []
      }

      console.log(`[v0] Searching DoodStream for keywords: ${keywords.join(", ")}`)

      const searchPromises = keywords.map(async (keyword) => {
        const url = `${DOOD_SEARCH_URL}/search/videos?key=${DOOD_API_KEY}&search_term=${encodeURIComponent(keyword)}`

        try {
          // Use deduplication untuk concurrent requests
          const cacheKey = `dood_search_${keyword}`
          const response = await cacheManager.deduplicatedRequest(cacheKey, async () => {
            return fetch(url, {
              headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
              },
            })
          })

          if (!response.ok) {
            console.log(`[v0] DoodAPI request failed for keyword "${keyword}":`, response.status)
            return []
          }

          const data = await response.json()

          if (data.status === 200 && data.result) {
            return data.result.map((item: any) => ({
              single_img: item.single_img,
              length: item.length,
              views: item.views,
              title: item.title,
              file_code: item.file_code,
              uploaded: item.uploaded,
              splash_img: item.splash_img,
              canplay: item.canplay,
              api_source: "doodstream",
              matched_keyword: keyword,
            }))
          }

          return []
        } catch (error) {
          console.log(`[v0] DoodAPI fetch error for keyword "${keyword}":`, error)
          return []
        }
      })

      const allResults = await Promise.all(searchPromises)
      const flatResults = allResults.flat()
      const uniqueResults = new Map()

      flatResults.forEach((item) => {
        const fileCode = item.file_code
        if (!uniqueResults.has(fileCode)) {
          uniqueResults.set(fileCode, item)
        } else {
          const existing = uniqueResults.get(fileCode)
          if (item.views > existing.views) {
            uniqueResults.set(fileCode, item)
          }
        }
      })

      const finalResults = Array.from(uniqueResults.values())
      console.log(`[v0] DoodStream search found ${finalResults.length} unique results from ${keywords.length} keywords`)

      return finalResults
    },
    [],
    {
      maxAge: CACHE_TTL.DOOD_SEARCH * 1000,
      staleWhileRevalidate: true,
    },
  )
}

export async function fetchDoodApiInfo(fileCode: string) {
  const cacheKey = cacheManager.generateCacheKey("doodapi_info", { fileCode })

  return cacheManager.getWithFallback(
    cacheKey,
    async () => {
      const doodApiUrl = `${DOOD_BASE_URL}/file/info?key=${DOOD_API_KEY}&file_code=${fileCode}`
      const doodResponse = await fetch(doodApiUrl)
      const doodData = await doodResponse.json()

      if (doodData.status === 400 && doodData.msg === "Invalid file codes") {
        return null
      }

      if (doodData.status === 200 && doodData.result && doodData.result.length > 0) {
        return doodData
      }

      return null
    },
    null,
    {
      maxAge: CACHE_TTL.DOOD_INFO * 1000,
      staleWhileRevalidate: true,
    },
  )
}

export async function fetchDataWithCache(): Promise<VideoItem[]> {
  const cacheKey = cacheManager.generateCacheKey("lulustream_all_data")

  return cacheManager.getWithFallback(
    cacheKey,
    async () => {
      console.log("[v0] Fetching fresh data from LuluStream API...")
      const freshData = await fetchAllLuluData()

      if (!freshData || freshData.length === 0) {
        throw new Error("No data received from API")
      }

      return freshData
    },
    [], // Empty array as fallback
    {
      maxAge: CACHE_TTL.FULL_LIST * 1000,
      staleWhileRevalidate: true,
    },
  )
}

export async function getLuluVideos(): Promise<VideoItem[]> {
  return fetchDataWithCache()
}

export async function warmCache(): Promise<void> {
  try {
    await cacheManager.warmCache()
    console.log("[v0] Cache warmed successfully")
  } catch (error) {
    console.error("[v0] Failed to warm cache:", error)
  }
}

export function getCacheStatus(): { hasMemoryCache: boolean; hasLocalStorageCache: boolean; lastFetchTime: number } {
  const { data: localStorageData, timestamp: localStorageTime } = loadFromLocalStorage()

  return {
    hasMemoryCache: cachedData !== null,
    hasLocalStorageCache: localStorageData !== null,
    lastFetchTime: Math.max(lastFetchTime, localStorageTime),
  }
}

// Utility functions for search relevance and fuzzy matching
export async function calculateRelevance(
  title: string,
  keywords: string[],
  originalQuery: string,
): Promise<number> {
  // Cache key berdasarkan normalized inputs
  const cacheKey = `relevance_${Buffer.from(`${title}|${keywords.join(",")}|${originalQuery}`).toString("base64")}`

  return cacheManager.withFunctionCache(cacheKey, async () => {
    const titleLower = title.toLowerCase()
    const queryLower = originalQuery.toLowerCase()
    let score = 0

    // Count how many keywords are found in the title
    const matchedKeywords = keywords.filter((keyword) => {
      if (keyword.length < 2) return false
      const wordBoundaryRegex = new RegExp(`\\b${keyword}\\b`, "i")
      return wordBoundaryRegex.test(title) || titleLower.includes(keyword)
    })

    const keywordMatchRatio = matchedKeywords.length / keywords.length

    // Massive bonus for having ALL keywords (prioritize complete matches)
    if (keywordMatchRatio === 1.0) {
      score += 1000 // Very high score for complete keyword matches
    } else if (keywordMatchRatio >= 0.8) {
      score += 500 // High score for most keywords
    } else if (keywordMatchRatio >= 0.6) {
      score += 250 // Medium score for many keywords
    } else if (keywordMatchRatio >= 0.4) {
      score += 100 // Lower score for some keywords
    }

    // Exact phrase match gets additional high score
    if (titleLower.includes(queryLower)) {
      score += 200
    }

    // Position-based scoring - matches at the beginning are more relevant
    const queryIndex = titleLower.indexOf(queryLower)
    if (queryIndex === 0) {
      score += 100 // Starts with query
    } else if (queryIndex > 0) {
      score += 50 // Contains query somewhere
    }

    // Individual keyword scoring with position bonus
    keywords.forEach((keyword, index) => {
      if (keyword.length < 2) return

      const keywordIndex = titleLower.indexOf(keyword)
      if (keywordIndex !== -1) {
        // Exact word boundary match
        const wordBoundaryRegex = new RegExp(`\\b${keyword}\\b`, "i")
        if (wordBoundaryRegex.test(title)) {
          score += 30 + (keywords.length - index) * 5 // Earlier keywords get more weight
        } else {
          score += 15 + (keywords.length - index) * 2 // Partial match with position weight
        }

        // Bonus for keyword at the beginning
        if (keywordIndex === 0) {
          score += 25
        }

        // Bonus for consecutive keywords
        if (index > 0) {
          const prevKeyword = keywords[index - 1]
          const prevIndex = titleLower.indexOf(prevKeyword)
          if (prevIndex !== -1 && Math.abs(keywordIndex - prevIndex - prevKeyword.length) <= 3) {
            score += 20 // Bonus for keywords appearing close together
          }
        }
      }
    })

    // Keyword density bonus
    const totalKeywordLength = matchedKeywords.reduce((sum, keyword) => sum + keyword.length, 0)
    const densityRatio = totalKeywordLength / title.length
    if (densityRatio > 0.3) {
      score += 30 // High keyword density
    } else if (densityRatio > 0.2) {
      score += 15 // Medium keyword density
    }

    // Length penalty for very long titles (they might be less relevant)
    if (title.length > 150) {
      score -= 10
    } else if (title.length > 100) {
      score -= 5
    }

    // Bonus for shorter, more focused titles when they match well
    if (title.length < 50 && keywordMatchRatio >= 0.5) {
      score += 20
    }

    return Math.max(0, score) // Ensure non-negative score
  }, CACHE_TTL.FUNCTION_RESULTS * 1000) // Cache for optimized TTL
}

export function fuzzyMatch(text: string, pattern: string): boolean {
  const textLower = text.toLowerCase()
  const patternLower = pattern.toLowerCase()

  // Simple fuzzy matching - allows for some character differences
  if (patternLower.length < 3) return textLower.includes(patternLower)

  let patternIndex = 0
  for (let i = 0; i < textLower.length && patternIndex < patternLower.length; i++) {
    if (textLower[i] === patternLower[patternIndex]) {
      patternIndex++
    }
  }

  return patternIndex >= patternLower.length * 0.8 // Allow 20% character misses
}

// Utility functions for formatting
export function formatFileSize(bytes: string | number): string {
  const size = typeof bytes === "string" ? Number.parseInt(bytes) : bytes
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`
  return `${(size / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

export function formatDuration(seconds: string | number): string {
  const totalSeconds = typeof seconds === "string" ? Number.parseInt(seconds) : seconds
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const secs = totalSeconds % 60
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
}
