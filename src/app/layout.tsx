import type { Metadata } from "next"
import { Geist, Black_Ops_One } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" })
const stencil = Black_Ops_One({ weight: "400", subsets: ["latin"], variable: "--font-stencil" })

export const metadata: Metadata = {
  title: "NSR Elite — Snapshot",
  description: "Field photo documentation and project management for New Standard Restoration",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "NSR Snapshot" },
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
}

export const viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${stencil.variable} h-full antialiased`}>
      <body className="min-h-full bg-gray-50 text-gray-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
