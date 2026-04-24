import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tenant Manager',
  description: 'Manage your rental properties and tenants',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
