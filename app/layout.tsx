import "./globals.css"
import type React from "react"

export const metadata = {
  title: "ENVYSKY",
  description: "Flight hours management system",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
