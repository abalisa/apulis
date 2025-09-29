import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains-mono",
})

export const metadata: Metadata = {
  title: "API Kaya - Web API Documentation",
  description: "Modern web API with data from m.cewe.pro/data.json - Mobile-first minimalist interface",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}>
      <body className={inter.className}>
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js')
                    .then(function(registration) {
                      console.log('ServiceWorker registration successful');
                    })
                    .catch(function(err) {
                      console.log('ServiceWorker registration failed: ', err);
                    });
                });
              }
              
              if (typeof window !== 'undefined') {
                // Warm critical endpoints with staggered timing
                setTimeout(() => {
                  fetch('/api/list?page=1&per_page=20').catch(() => {});
                }, 500);
                
                setTimeout(() => {
                  fetch('/api/rand?page=1&per_page=10').catch(() => {});
                }, 1500);
                
                setTimeout(() => {
                  fetch('/api/search?q=video&page=1&per_page=10').catch(() => {});
                }, 2500);
                
                // Preload popular searches
                setTimeout(() => {
                  const popularQueries = ['anime', 'movie', 'series', 'drama'];
                  popularQueries.forEach((query, index) => {
                    setTimeout(() => {
                      fetch('/api/search?q=' + encodeURIComponent(query) + '&page=1&per_page=5').catch(() => {});
                    }, index * 1000);
                  });
                }, 5000);
              }
            `,
          }}
        />
      </body>
    </html>
  )
}
