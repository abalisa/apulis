import { NextResponse } from "next/server"
import { fetchDataWithCache } from "@/app/lib/fetchData"
import { setCorsHeaders } from "@/app/lib/cors"
import { processTitle } from "@/app/lib/titleProcessor"
import { validatePagination } from "@/app/lib/validation"
import { getVercelCacheHeaders, CACHE_TTL } from "@/app/lib/cacheManager"

export const runtime = "edge"

export const revalidate = CACHE_TTL.RANDOM // 1 hour for random data to ensure variety

// Limit per_page for better performance
const SAFE_PER_PAGE = 100

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const page = searchParams.get("page") || "1"
  const perPage = Math.min(Math.max(1, parseInt(searchParams.get("per_page") || "20")), SAFE_PER_PAGE)

  const validation = validatePagination(page, perPage.toString())
  if (!validation.isValid) {
    const errorResponse = NextResponse.json({ error: validation.error }, { status: 400 })
    return setCorsHeaders(errorResponse)
  }

  const { page: pageNum, perPage: perPageNum } = validation.sanitized!

  try {
    const data = await fetchDataWithCache()

    if (!data || data.length === 0) {
      const notFoundResponse = NextResponse.json({ error: "No data available" }, { status: 404 })
      return setCorsHeaders(notFoundResponse)
    }

    // Seed-based shuffling tied to hour for consistency
    const hourSeed = Math.floor(Date.now() / (1000 * 60 * 60))
    const seededRandom = (seed: number) => {
      const x = Math.sin(seed) * 10000
      return x - Math.floor(x)
    }

    // Fisher-Yates shuffle with seed for consistent randomization
    const shuffledData = [...data]
    for (let i = shuffledData.length - 1; i > 0; i--) {
      const j = Math.floor(seededRandom(hourSeed + i) * (i + 1))
      ;[shuffledData[i], shuffledData[j]] = [shuffledData[j], shuffledData[i]]
    }

    const startIndex = (pageNum - 1) * perPageNum
    const endIndex = startIndex + perPageNum
    const paginatedFiles = shuffledData.slice(startIndex, endIndex)

    if (paginatedFiles.length === 0) {
      const notFoundResponse = NextResponse.json({ error: "No data available for this page" }, { status: 404 })
      return setCorsHeaders(notFoundResponse)
    }

    const response = NextResponse.json({
      result: {
        total_pages: Math.ceil(data.length / perPageNum),
        results_total: data.length.toString(),
        results: paginatedFiles.length,
        files: paginatedFiles.map((file) => ({
          public: "1",
          single_img: file.single_img,
          canplay: file.canplay ? 1 : 0,
          uploaded: file.uploaded,
          views: file.views.toString(),
          length: file.length.toString(),
          download_url: file.protected_dl,
          file_code: file.file_code,
          title: processTitle(file.title),
          fld_id: "0",
          splash_img: file.splash_img,
        })),
        per_page_limit: perPageNum.toString(),
      },
      status: 200,
      msg: "OK",
      server_time: new Date().toISOString().replace("T", " ").substring(0, 19),
    })

    const cacheHeaders = getVercelCacheHeaders(CACHE_TTL.RANDOM)
    Object.entries(cacheHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    return setCorsHeaders(response)
  } catch (error) {
    console.error("Random endpoint error:", error)
    const errorResponse = NextResponse.json({ error: "Failed to fetch data" }, { status: 500 })
    return setCorsHeaders(errorResponse)
  }
}

export async function OPTIONS() {
  return setCorsHeaders(new NextResponse(null, { status: 200 }))
}
