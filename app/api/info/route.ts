import { NextResponse } from "next/server"
import { fetchDataWithCache, fetchDoodApiInfo } from "@/app/lib/fetchData"
import { setCorsHeaders } from "@/app/lib/cors"
import { processTitle } from "@/app/lib/titleProcessor"
import { validateFileCode } from "@/app/lib/validation"
import { getVercelCacheHeaders, CACHE_TTL } from "@/app/lib/cacheManager"

export const runtime = "edge"

export const revalidate = CACHE_TTL.FILE_INFO // 30 days for file info

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const fileCode = searchParams.get("file_code")

  const validation = validateFileCode(fileCode || "")
  if (!validation.isValid) {
    const errorResponse = NextResponse.json({ error: validation.error }, { status: 400 })
    return setCorsHeaders(errorResponse)
  }

  const sanitizedFileCode = validation.sanitized!

  try {
    const data = await fetchDataWithCache()
    const fileInfo = data.find((file: any) => file.file_code === sanitizedFileCode)

    if (!fileInfo) {
      const doodData = await fetchDoodApiInfo(sanitizedFileCode)

      if (!doodData) {
        const notFoundResponse = NextResponse.json({ error: "File not found" }, { status: 404 })
        return setCorsHeaders(notFoundResponse)
      }

      // If doodapi has valid data, return it with api_source
      const doodFile = doodData.result[0]
      const result = {
        status: 200,
        result: [
          {
            filecode: doodFile.filecode,
            size: doodFile.size,
            status: doodFile.status,
            protected_embed: `https://dodl.pages.dev/${doodFile.filecode}`,
            uploaded: doodFile.uploaded,
            last_view: doodFile.last_view,
            canplay: doodFile.canplay,
            protected_dl:  `https://doodstream.com/d/${doodFile.filecode}`,
            single_img: doodFile.single_img,
            title: processTitle(doodFile.title),
            views: doodFile.views,
            length: doodFile.length,
            splash_img: doodFile.splash_img,
            api_source: "doodstream",
          },
        ],
        server_time: doodData.server_time,
        msg: doodData.msg,
      }
      const response = NextResponse.json(result)

      const cacheHeaders = getVercelCacheHeaders(CACHE_TTL.FILE_INFO)
      Object.entries(cacheHeaders).forEach(([key, value]) => {
        response.headers.set(key, value)
      })

      return setCorsHeaders(response)
    }

    const result = {
      status: 200,
      result: [
        {
          filecode: fileInfo.file_code,
          size: fileInfo.length,
          status: 200,
          protected_embed: fileInfo.protected_embed,
          uploaded: fileInfo.uploaded,
          last_view: new Date().toISOString().replace("T", " ").substr(0, 19),
          canplay: fileInfo.canplay ? 1 : 0,
          protected_dl: fileInfo.protected_dl,
          single_img: fileInfo.single_img,
          title: processTitle(fileInfo.title),
          views: fileInfo.views.toString(),
          length: fileInfo.length,
          splash_img: fileInfo.splash_img,
          api_source: "lulustream",
        },
      ],
      server_time: new Date().toISOString().replace("T", " ").substr(0, 19),
      msg: "OK",
    }

    const response = NextResponse.json(result)

    const cacheHeaders = getVercelCacheHeaders(CACHE_TTL.FILE_INFO)
    Object.entries(cacheHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    return setCorsHeaders(response)
  } catch (error) {
    if (error instanceof Error && error.message === "File not found") {
      const notFoundResponse = NextResponse.json({ error: "File not found" }, { status: 404 })
      return setCorsHeaders(notFoundResponse)
    }

    const errorResponse = NextResponse.json({ error: "Failed to fetch data" }, { status: 500 })
    return setCorsHeaders(errorResponse)
  }
}

export async function OPTIONS() {
  return setCorsHeaders(new NextResponse(null, { status: 200 }))
}
