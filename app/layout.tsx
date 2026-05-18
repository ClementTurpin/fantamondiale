import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'FantaMondiale', template: '%s | FantaMondiale' },
  description: 'Il fantasy football del Mondiale 2026.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" suppressHydrationWarning>
      <body className="antialiased bg-gray-50 dark:bg-[#0f1117]">{children}</body>
    </html>
  )
}
