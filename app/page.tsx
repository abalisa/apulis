"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Database, Shuffle, Info, List, Code } from "lucide-react"

interface ApiEndpoint {
  method: string
  path: string
  description: string
  params?: Array<{
    name: string
    type: string
    description: string
  }>
  icon: React.ReactNode
  cache?: string
}

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("")
  const [apiData, setApiData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const endpoints: ApiEndpoint[] = [
    {
      method: "GET",
      path: "/api",
      description: "API Documentation - Dokumentasi lengkap semua endpoint dengan format JSON atau HTML",
      icon: <Code className="w-5 h-5" />,
      cache: "24 jam",
    },
    {
      method: "GET",
      path: "/api/list",
      description: "Daftar File - Mengambil daftar data gabungan dari LuluStream dan DoodStream dengan paginasi",
      params: [
        { name: "page", type: "integer", description: "Nomor halaman (default: 1)" },
        { name: "per_page", type: "integer", description: "Item per halaman (default: 10)" },
      ],
      icon: <List className="w-5 h-5" />,
      cache: "7 hari",
    },
    {
      method: "GET",
      path: "/api/rand",
      description: "Random File - Mengambil daftar data secara acak menggunakan Fisher-Yates shuffle",
      params: [
        { name: "page", type: "integer", description: "Nomor halaman (default: 1)" },
        { name: "per_page", type: "integer", description: "Item per halaman (default: 50)" },
      ],
      icon: <Shuffle className="w-5 h-5" />,
      cache: "24 jam",
    },
    {
      method: "GET",
      path: "/api/info",
      description: "Info File - Detail informasi file berdasarkan file_code dengan fallback ke DoodStream API",
      params: [{ name: "file_code", type: "string", description: "Kode unik file (required)" }],
      icon: <Info className="w-5 h-5" />,
      cache: "7 hari",
    },
    {
      method: "GET",
      path: "/api/search",
      description: "Pencarian - Mencari data dengan relevance scoring dan fuzzy matching dari multi-source",
      params: [
        { name: "q", type: "string", description: "Query pencarian (required)" },
        { name: "page", type: "integer", description: "Nomor halaman (default: 1)" },
        { name: "per_page", type: "integer", description: "Item per halaman (default: 10)" },
      ],
      icon: <Search className="w-5 h-5" />,
      cache: "7 hari",
    },
  ]

  useEffect(() => {
    fetch("/api")
      .then((res) => res.json())
      .then((data) => {
        setApiData(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    document.title = "API Kaya - Web API Documentation"
  }, [])

  const filteredEndpoints = endpoints.filter(
    (endpoint) =>
      endpoint.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      endpoint.description.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleTryEndpoint = (path: string) => {
    let url = path
    if (path === "/api/info") {
      url = "/api/info?file_code=example_code"
    } else if (path === "/api/search") {
      url = "/api/search?q=example"
    }
    window.open(url, "_blank")
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="bg-gradient-to-r from-gray-900 to-black border-b border-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-2">
              <Database className="w-8 h-8 text-blue-400" />
              <h1 className="text-3xl font-bold text-white bg-gradient-to-r from-blue-400 to-green-400 bg-clip-text [-webkit-background-clip:text] [-webkit-text-fill-color:transparent] [background-clip:text]">
                API Kaya
              </h1>
            </div>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Web API dengan data gabungan dari LuluStream dan DoodStream - Edge Runtime dengan cache ekstrem untuk
              performa optimal
            </p>
            {!loading && apiData && (
              <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
                <Badge variant="outline" className="border-green-500 text-green-400">
                  Status: {apiData.status}
                </Badge>
                <span>Server Time: {apiData.server_time}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="text"
              placeholder="Cari endpoint..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-900 border-gray-700 text-white placeholder-gray-400 focus:border-blue-400"
            />
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredEndpoints.map((endpoint, index) => (
            <Card key={index} className="bg-gray-900 border-gray-700 hover:border-blue-400 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">{endpoint.icon}</div>
                    <Badge variant="outline" className="border-green-500 text-green-400 text-xs">
                      {endpoint.method}
                    </Badge>
                  </div>
                  {endpoint.cache && (
                    <Badge variant="outline" className="border-orange-500 text-orange-400 text-xs">
                      Cache: {endpoint.cache}
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-white text-lg">{endpoint.path}</CardTitle>
                <CardDescription className="text-gray-400">{endpoint.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {endpoint.params && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-300">Parameters:</h4>
                    <div className="space-y-1">
                      {endpoint.params.map((param, paramIndex) => (
                        <div key={paramIndex} className="text-xs bg-gray-800 p-2 rounded">
                          <span className="text-blue-400 font-mono">{param.name}</span>
                          <span className="text-gray-500 mx-2">({param.type})</span>
                          <div className="text-gray-400 mt-1">{param.description}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <Button
                  onClick={() => handleTryEndpoint(endpoint.path)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  size="sm"
                >
                  Try Endpoint
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 text-center space-y-4">
          <div className="border-t border-gray-800 pt-8">
            <p className="text-gray-500 text-sm">
              Built with Next.js • Edge Runtime • Multi-Source Data • Advanced Caching
            </p>
            <div className="flex items-center justify-center space-x-4 mt-4 text-xs text-gray-600">
              <span>CORS Enabled</span>
              <span>•</span>
              <span>JSON Response</span>
              <span>•</span>
              <span>Relevance Scoring</span>
              <span>•</span>
              <span>Fuzzy Matching</span>
              <span>•</span>
              <span>Multi-Source Search</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
