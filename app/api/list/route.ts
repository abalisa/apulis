import { NextResponse } from "next/server"
import { fetchDataWithCache, fetchDoodApiList } from "@/app/lib/fetchData"
import { setCorsHeaders } from "@/app/lib/cors"
import { processTitle } from "@/app/lib/titleProcessor"
import { validatePagination } from "@/app/lib/validation"
import { getVercelCacheHeaders, CACHE_TTL } from "@/app/lib/cacheManager"

export const runtime = "edge"

// Aggressive caching untuk list endpoint
export const revalidate = CACHE_TTL.FULL_LIST // Use optimized TTL

// Reduce payload size with smart pagination
const SAFE_PER_PAGE = 50 // Keep per_page reasonable for edge runtime

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const page = searchParams.get("page") || "1"
  const perPage = Math.min(Math.max(1, parseInt(searchParams.get("per_page") || "10")), SAFE_PER_PAGE)

  const validation = validatePagination(page, perPage.toString())
  if (!validation.isValid) {
    const errorResponse = NextResponse.json({ error: validation.error }, { status: 400 })
    return setCorsHeaders(errorResponse)
  }

  const { page: pageNum, perPage: perPageNum } = validation.sanitized!

  try {
    // Fetch in parallel but with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 25000) // 25s timeout

    try {
      const [localData, doodData] = await Promise.all([
        fetchDataWithCache(),
        fetchDoodApiList(pageNum, perPageNum),
      ])

      clearTimeout(timeoutId)

      const startIndex = (pageNum - 1) * perPageNum
      const endIndex = startIndex + perPageNum

      // Lazy-load only required page data
      const paginatedLocalFiles = localData.slice(startIndex, endIndex)

      // Fast transformation without heavy processing
      const luluStreamFiles = paginatedLocalFiles.map((file) => ({
        public: "1",
        single_img: file.single_img,
        canplay: file.canplay ? 1 : 0,
        uploaded: file.uploaded,
        views: file.views.toString(),
        length: file.length,
        download_url: file.protected_dl,
        file_code: file.file_code,
        title: processTitle(file.title),
        fld_id: "0",
        splash_img: file.splash_img,
        api_source: "lulustream",
      }))

      let doodStreamFiles: any[] = []
      if (doodData && doodData.result && doodData.result.files) {
        doodStreamFiles = doodData.result.files.map((file: any) => ({
          public: file.public,
          single_img: file.single_img,
          canplay: file.canplay,
          uploaded: file.uploaded,
          views: file.views.toString(),
          length: file.length,
          download_url: file.download_url,
          file_code: file.file_code,
          title: processTitle(file.title),
          fld_id: file.fld_id,
          splash_img: file.splash_img,
          api_source: "doodstream",
        }))
      }

      const combinedFiles = [...luluStreamFiles, ...doodStreamFiles]

      const seenFileCodes = new Set<string>()
      const uniqueFiles = combinedFiles.filter((file) => {
        if (seenFileCodes.has(file.file_code)) {
          return false
        }
        seenFileCodes.add(file.file_code)
        return true
      })

      if (uniqueFiles.length === 0) {
        const notFoundResponse = NextResponse.json({ error: "No data available" }, { status: 404 })
        return setCorsHeaders(notFoundResponse)
      }

      const totalResults =
        localData.length + (doodData?.result?.results_total ? Number.parseInt(doodData.result.results_total) : 0)
      const totalPages = Math.ceil(totalResults / perPageNum)

      const result = {
        result: {
          total_pages: totalPages,
          results_total: totalResults.toString(),
          results: uniqueFiles.length,
          files: uniqueFiles,
          per_page_limit: perPageNum.toString(),
        },
        status: 200,
        msg: "OK",
        server_time: new Date().toISOString().replace("T", " ").substring(0, 19),
      }

      const response = NextResponse.json(result)

      const cacheHeaders = getVercelCacheHeaders(CACHE_TTL.FULL_LIST)
      Object.entries(cacheHeaders).forEach(([key, value]) => {
        response.headers.set(key, value)
      })

      return setCorsHeaders(response)
    } finally {
      clearTimeout(timeoutId)
    }
  } catch (error) {
    console.error("List endpoint error:", error)
    const errorResponse = NextResponse.json({ error: "Failed to fetch data" }, { status: 500 })
    return setCorsHeaders(errorResponse)
  }
}

export async function OPTIONS() {
  return setCorsHeaders(new NextResponse(null, { status: 200 }))
}
