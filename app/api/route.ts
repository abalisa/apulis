import { NextResponse } from "next/server"
import { setCorsHeaders } from "@/app/lib/cors"

export const runtime = "edge"

export const revalidate = 86400 // Revalidate every 24 hours (1 day)

export async function GET(request: Request) {
  const { headers } = request
  const acceptHeader = headers.get("accept") || ""

  if (acceptHeader.includes("text/html")) {
    return getHTMLDocumentation()
  }

  const currentTime = new Date().toISOString()

  const response = NextResponse.json({
    msg: "API Documentation",
    server_time: currentTime,
    status: 200,
    endpoints: [
      {
        method: "GET",
        path: "/api/list",
        description: "Mengambil daftar data dengan paginasi dan pencarian dengan cache ekstrem (7 hari).",
        params: [
          { name: "page", type: "integer", description: "Nomor halaman (default: 1)" },
          { name: "per_page", type: "integer", description: "Jumlah item per halaman (default: 10)" },
        ],
        response: {
          msg: "OK",
          server_time: "string",
          status: 200,
          result: {
            total_pages: "integer",
            files: [
              {
                single_img: "string",
                protected_embed: "string",
                splash_img: "string",
                views: "integer",
                last_view: "integer",
                filecode: "string",
                canplay: "boolean",
                title: "string",
                status: 200,
                size: "integer",
                protected_dl: "string",
                uploaded: "string",
                length: "integer",
                file_code: "string",
              },
            ],
            results_total: "integer",
            results: "integer",
          },
        },
      },
      {
        method: "GET",
        path: "/api/rand",
        description: "Mengambil daftar data secara acak dengan paginasi dan cache ekstrem (7 hari).",
        params: [
          { name: "page", type: "integer", description: "Nomor halaman (default: 1)" },
          { name: "per_page", type: "integer", description: "Jumlah item per halaman (default: 50)" },
        ],
        response: {
          msg: "OK",
          server_time: "string",
          status: 200,
          result: {
            total_pages: "integer",
            files: [
              {
                single_img: "string",
                protected_embed: "string",
                splash_img: "string",
                views: "integer",
                last_view: "integer",
                filecode: "string",
                canplay: "boolean",
                title: "string",
                status: 200,
                size: "integer",
                protected_dl: "string",
                uploaded: "string",
                length: "integer",
                file_code: "string",
              },
            ],
            results_total: "integer",
            results: "integer",
          },
        },
      },
      {
        method: "GET",
        path: "/api/info",
        description: "Mengambil informasi detail tentang file berdasarkan file_code dengan cache ekstrem (7 hari).",
        params: [{ name: "file_code", type: "string", description: "Kode unik file" }],
        response: {
          msg: "OK",
          server_time: "string",
          status: 200,
          result: {
            single_img: "string",
            protected_embed: "string",
            splash_img: "string",
            views: "integer",
            last_view: "integer",
            filecode: "string",
            canplay: "boolean",
            title: "string",
            status: 200,
            size: "integer",
            protected_dl: "string",
            uploaded: "string",
            length: "integer",
            file_code: "string",
          },
        },
      },
      {
        method: "GET",
        path: "/api/search",
        description: "Mencari data berdasarkan query pencarian dengan cache ekstrem (7 hari).",
        params: [
          { name: "q", type: "string", description: "Query pencarian" },
          { name: "page", type: "integer", description: "Nomor halaman (default: 1)" },
          { name: "per_page", type: "integer", description: "Jumlah item per halaman (default: 10)" },
        ],
        response: {
          msg: "OK",
          result: [
            {
              single_img: "string",
              protected_embed: "string",
              splash_img: "string",
              views: "integer",
              last_view: "integer",
              filecode: "string",
              canplay: "boolean",
              title: "string",
              status: 200,
              size: "integer",
              protected_dl: "string",
              uploaded: "string",
              length: "integer",
              file_code: "string",
            },
          ],
          status: 200,
          server_time: "string",
          pagination: {
            page: "integer",
            per_page: "integer",
            total_results: "integer",
            total_pages: "integer",
          },
        },
      },
    ],
  })

  return setCorsHeaders(response)
}

function getHTMLDocumentation() {
  const currentTime = new Date().toISOString()

  const html = `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API Kaya - Dokumentasi API</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
        }
        
        .header {
            text-align: center;
            margin-bottom: 3rem;
            color: white;
        }
        
        .header h1 {
            font-size: 3rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        
        .header p {
            font-size: 1.2rem;
            opacity: 0.9;
        }
        
        .server-info {
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 1.5rem;
            margin-bottom: 2rem;
            color: white;
            border: 1px solid rgba(255,255,255,0.2);
        }
        
        .endpoints {
            display: grid;
            gap: 2rem;
        }
        
        .endpoint {
            background: white;
            border-radius: 15px;
            padding: 2rem;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            border: 1px solid rgba(0,0,0,0.05);
            transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .endpoint:hover {
            transform: translateY(-5px);
            box-shadow: 0 20px 40px rgba(0,0,0,0.15);
        }
        
        .endpoint-header {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-bottom: 1.5rem;
        }
        
        .method {
            background: #10b981;
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 8px;
            font-weight: 600;
            font-size: 0.9rem;
        }
        
        .path {
            font-family: 'Monaco', 'Menlo', monospace;
            background: #f3f4f6;
            padding: 0.5rem 1rem;
            border-radius: 8px;
            font-size: 1.1rem;
            color: #1f2937;
        }
        
        .description {
            color: #6b7280;
            margin-bottom: 2rem;
            font-size: 1.1rem;
        }
        
        .section {
            margin-bottom: 2rem;
        }
        
        .section h3 {
            color: #1f2937;
            margin-bottom: 1rem;
            font-size: 1.3rem;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 0.5rem;
        }
        
        .params-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 1rem;
        }
        
        .params-table th,
        .params-table td {
            padding: 0.75rem;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
        }
        
        .params-table th {
            background: #f9fafb;
            font-weight: 600;
            color: #374151;
        }
        
        .params-table td:first-child {
            font-family: 'Monaco', 'Menlo', monospace;
            color: #7c3aed;
            font-weight: 500;
        }
        
        .params-table td:nth-child(2) {
            color: #059669;
            font-weight: 500;
        }
        
        .response-example {
            background: #1f2937;
            color: #e5e7eb;
            padding: 1.5rem;
            border-radius: 10px;
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 0.9rem;
            overflow-x: auto;
            line-height: 1.5;
        }
        
        .cache-info {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 8px;
            padding: 1rem;
            margin-top: 1rem;
        }
        
        .cache-info strong {
            color: #92400e;
        }
        
        .features {
            background: rgba(255,255,255,0.1);
            backdrop-filter: blur(10px);
            border-radius: 15px;
            padding: 2rem;
            margin-top: 2rem;
            color: white;
            border: 1px solid rgba(255,255,255,0.2);
        }
        
        .features h2 {
            margin-bottom: 1rem;
            font-size: 1.5rem;
        }
        
        .features ul {
            list-style: none;
            padding-left: 0;
        }
        
        .features li {
            padding: 0.5rem 0;
            padding-left: 1.5rem;
            position: relative;
        }
        
        .features li:before {
            content: "✓";
            position: absolute;
            left: 0;
            color: #10b981;
            font-weight: bold;
        }
        
        @media (max-width: 768px) {
            .container {
                padding: 1rem;
            }
            
            .header h1 {
                font-size: 2rem;
            }
            
            .endpoint {
                padding: 1.5rem;
            }
            
            .endpoint-header {
                flex-direction: column;
                align-items: flex-start;
                gap: 0.5rem;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>API Kaya</h1>
            <p>Dokumentasi API dengan Cache Ekstrem & Offline Support</p>
        </div>
        
        <div class="server-info">
            <h2>📊 Status Server</h2>
            <p><strong>Server Time:</strong> ${currentTime}</p>
            <p><strong>Status:</strong> ✅ Online</p>
            <p><strong>Cache Duration:</strong> 7 hari (604800 detik)</p>
        </div>
        
        <div class="endpoints">
            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="method">GET</span>
                    <span class="path">/api/list</span>
                </div>
                <p class="description">Mengambil daftar data dengan paginasi dan pencarian dengan cache ekstrem (7 hari).</p>
                
                <div class="section">
                    <h3>📝 Parameter</h3>
                    <table class="params-table">
                        <thead>
                            <tr>
                                <th>Parameter</th>
                                <th>Tipe</th>
                                <th>Deskripsi</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>page</td>
                                <td>integer</td>
                                <td>Nomor halaman (default: 1)</td>
                            </tr>
                            <tr>
                                <td>per_page</td>
                                <td>integer</td>
                                <td>Jumlah item per halaman (default: 10)</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                
                <div class="cache-info">
                    <strong>🚀 Cache Ekstrem:</strong> Data disimpan selama 7 hari dengan fallback offline support
                </div>
            </div>
            
            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="method">GET</span>
                    <span class="path">/api/rand</span>
                </div>
                <p class="description">Mengambil daftar data secara acak dengan paginasi dan cache ekstrem (7 hari).</p>
                
                <div class="section">
                    <h3>📝 Parameter</h3>
                    <table class="params-table">
                        <thead>
                            <tr>
                                <th>Parameter</th>
                                <th>Tipe</th>
                                <th>Deskripsi</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>page</td>
                                <td>integer</td>
                                <td>Nomor halaman (default: 1)</td>
                            </tr>
                            <tr>
                                <td>per_page</td>
                                <td>integer</td>
                                <td>Jumlah item per halaman (default: 50)</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                
                <div class="cache-info">
                    <strong>🚀 Cache Ekstrem:</strong> Data acak disimpan selama 7 hari dengan fallback offline support
                </div>
            </div>
            
            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="method">GET</span>
                    <span class="path">/api/info</span>
                </div>
                <p class="description">Mengambil informasi detail tentang file berdasarkan file_code dengan cache ekstrem (7 hari).</p>
                
                <div class="section">
                    <h3>📝 Parameter</h3>
                    <table class="params-table">
                        <thead>
                            <tr>
                                <th>Parameter</th>
                                <th>Tipe</th>
                                <th>Deskripsi</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>file_code</td>
                                <td>string</td>
                                <td>Kode unik file</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                
                <div class="cache-info">
                    <strong>🚀 Cache Ekstrem:</strong> Info file disimpan selama 7 hari dengan fallback offline support
                </div>
            </div>
            
            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="method">GET</span>
                    <span class="path">/api/search</span>
                </div>
                <p class="description">Mencari data berdasarkan query pencarian dengan cache ekstrem (7 hari).</p>
                
                <div class="section">
                    <h3>📝 Parameter</h3>
                    <table class="params-table">
                        <thead>
                            <tr>
                                <th>Parameter</th>
                                <th>Tipe</th>
                                <th>Deskripsi</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>q</td>
                                <td>string</td>
                                <td>Query pencarian</td>
                            </tr>
                            <tr>
                                <td>page</td>
                                <td>integer</td>
                                <td>Nomor halaman (default: 1)</td>
                            </tr>
                            <tr>
                                <td>per_page</td>
                                <td>integer</td>
                                <td>Jumlah item per halaman (default: 10)</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                
                <div class="cache-info">
                    <strong>🚀 Cache Ekstrem:</strong> Hasil pencarian disimpan selama 7 hari dengan fallback offline support
                </div>
            </div>
        </div>
        
        <div class="features">
            <h2>🚀 Fitur Unggulan</h2>
            <ul>
                <li>Cache ekstrem 7 hari untuk performa maksimal</li>
                <li>Service Worker untuk offline support</li>
                <li>Multi-layer caching (Memory + LocalStorage + Service Worker)</li>
                <li>Fallback data ketika API mati</li>
                <li>Auto cache warming untuk performa optimal</li>
                <li>CORS support untuk cross-origin requests</li>
                <li>Edge runtime untuk response time minimal</li>
            </ul>
        </div>
    </div>
</body>
</html>
  `

  const response = new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  })

  return setCorsHeaders(response)
}

export async function OPTIONS() {
  return setCorsHeaders(new NextResponse(null, { status: 200 }))
}
