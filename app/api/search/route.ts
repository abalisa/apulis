import { NextResponse } from "next/server"
import { fetchDataWithCache, fetchDoodApiResults, calculateRelevance } from "@/app/lib/fetchData"
import { setCorsHeaders } from "@/app/lib/cors"
import { processTitle } from "@/app/lib/titleProcessor"
import { validateSearchQuery, validatePagination, validateUrl } from "@/app/lib/validation"
import { getVercelCacheHeaders, CACHE_TTL } from "@/app/lib/cacheManager"

export const runtime = "edge"

export const revalidate = CACHE_TTL.SEARCH_RESULTS // 2 hours for search results

export async function GET(request: Request) {
  if (!validateUrl(request.url)) {
    const errorResponse = NextResponse.json({ error: "Invalid request" }, { status: 400 })
    return setCorsHeaders(errorResponse)
  }

  const { searchParams } = new URL(request.url)
  const query = searchParams.get("q")
  // Set default page and per_page values if they are not provided
  const page = searchParams.get("page") || "1"
  const perPage = searchParams.get("per_page") || "200"

  const queryValidation = validateSearchQuery(query || "")
  if (!queryValidation.isValid) {
    const errorResponse = NextResponse.json({ error: queryValidation.error }, { status: 400 })
    return setCorsHeaders(errorResponse)
  }

  const paginationValidation = validatePagination(page, perPage)
  if (!paginationValidation.isValid) {
    const errorResponse = NextResponse.json({ error: paginationValidation.error }, { status: 400 })
    return setCorsHeaders(errorResponse)
  }

  const sanitizedQuery = queryValidation.sanitized!
  const { page: pageNum, perPage: perPageNum } = paginationValidation.sanitized!

  try {
    const [localData, doodApiResults] = await Promise.all([fetchDataWithCache(), fetchDoodApiResults(sanitizedQuery)])

    const keywords = sanitizedQuery
      .toLowerCase()
      .split(/\s+/)
      .filter(Boolean)
      .filter((keyword) => keyword.length >= 2) // Filter out very short keywords
      .slice(0, 10) // Limit to 10 keywords to prevent performance issues

    console.log(`[v0] Searching with keywords: ${keywords.join(", ")}`)

    const seenFileCodes = new Map<string, string>() // file_code -> api_source

    const luluStreamResults = localData
      .filter((file: any) => {
        const titleLower = file.title.toLowerCase()
        return keywords.some((keyword) => {
          const wordBoundaryRegex = new RegExp(`\\b${keyword}\\b`, "i")
          return wordBoundaryRegex.test(file.title) || titleLower.includes(keyword)
        })
      })
      .filter((file: any) => {
        if (seenFileCodes.has(file.file_code)) {
          return false // Skip duplicate file_code
        }
        seenFileCodes.set(file.file_code, "lulustream")
        return true
      })
      .map(async (file: any) => {
        const relevanceScore = await calculateRelevance(file.title, keywords, sanitizedQuery)

        return {
          single_img: file.single_img,
          length: file.length.toString(),
          views: file.views.toString(),
          title: processTitle(file.title),
          file_code: file.file_code,
          uploaded: file.uploaded,
          splash_img: file.splash_img,
          canplay: file.canplay ? 1 : 0,
          api_source: "lulustream",
          _relevance: relevanceScore,
        }
      })

    const doodStreamResults = doodApiResults
      .filter((file: any) => {
        if (seenFileCodes.has(file.file_code)) {
          return false // Skip duplicate file_code
        }
        seenFileCodes.set(file.file_code, file.api_source)
        return true
      })
      .map(async (file: any) => {
        const relevanceScore = await calculateRelevance(file.title, keywords, sanitizedQuery)

        return {
          single_img: file.single_img,
          length: file.length.toString(),
          views: file.views.toString(),
          title: processTitle(file.title),
          file_code: file.file_code,
          uploaded: file.uploaded,
          splash_img: file.splash_img,
          canplay: file.canplay ? 1 : 0,
          api_source: file.api_source,
          _relevance: relevanceScore,
        }
      })

    // Resolve all async calculations in parallel
    const resolvedLuluResults = await Promise.all(luluStreamResults)
    const resolvedDoodResults = await Promise.all(doodStreamResults)

    const allResults = [...resolvedLuluResults, ...resolvedDoodResults]
      .reduce((acc: any[], current: any) => {
        const isDuplicate = acc.some((item) => item.file_code === current.file_code)
        if (!isDuplicate) {
          acc.push(current)
        }
        return acc
      }, [])
      .sort((a: any, b: any) => {
        // Primary sort by relevance score (higher is better)
        if (b._relevance !== a._relevance) {
          return b._relevance - a._relevance
        }
        // Secondary sort by views (higher is better)
        const viewsA = Number.parseInt(a.views) || 0
        const viewsB = Number.parseInt(b.views) || 0
        if (viewsB !== viewsA) {
          return viewsB - viewsA
        }
        // Tertiary sort by title length (shorter titles often more relevant)
        return a.title.length - b.title.length
      })
      .map(({ _relevance, ...result }: any) => result)

    console.log(`[v0] Search completed. Found ${allResults.length} results for query: "${sanitizedQuery}"`)

    if (allResults.length === 0) {
      const notFoundResponse = NextResponse.json({ error: "No results found" }, { status: 404 })
      return setCorsHeaders(notFoundResponse)
    }

    const startIndex = (pageNum - 1) * perPageNum
    const endIndex = startIndex + perPageNum
    const paginatedResults = allResults.slice(startIndex, endIndex)

    if (paginatedResults.length === 0) {
      const notFoundResponse = NextResponse.json({ error: "No results found for this page" }, { status: 404 })
      return setCorsHeaders(notFoundResponse)
    }

    const result = {
      server_time: new Date().toISOString().replace("T", " ").substr(0, 19),
      status: 200,
      msg: "OK",
      result: paginatedResults,
      total_results: allResults.length,
      page: pageNum,
      per_page: perPageNum,
      total_pages: Math.ceil(allResults.length / perPageNum),
    }

    const response = NextResponse.json(result)

    const cacheHeaders = getVercelCacheHeaders(CACHE_TTL.SEARCH_RESULTS)
    Object.entries(cacheHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    return setCorsHeaders(response)
  } catch (error) {
    const errorResponse = NextResponse.json({ error: "Failed to fetch data" }, { status: 500 })
    return setCorsHeaders(errorResponse)
  }
}

export async function OPTIONS() {
  return setCorsHeaders(new NextResponse(null, { status: 200 }))
}
