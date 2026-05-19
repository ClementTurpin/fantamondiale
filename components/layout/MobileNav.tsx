import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'FantaMondiale', template: '%s | FantaMondiale' },
  description: 'Il fantasy football del Mondiale 2026.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it" suppressHydrationWarning>
      <head>
        {/* Google Fonts — Bebas Neue per titoli, DM Sans per body */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;0,9..40,900;1,9..40,400&display=swap" rel="stylesheet" />
        <style>{`
          :root {
            --font-display: 'Bebas Neue', system-ui;
            --font-body: 'DM Sans', system-ui;
          }
          * { box-sizing: border-box; }
          body {
            font-family: var(--font-body);
            background: #080d1a;
            color: white;
            margin: 0;
          }
          /* Scrollbar */
          ::-webkit-scrollbar { width: 4px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 2px; }
          ::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.2); }
          /* Selection */
          ::selection { background: rgba(245,158,11,0.3); color: white; }
        `}</style>
      </head>
      <body className="antialiased" style={{
        background: '#080d1a',
        backgroundImage: `
          radial-gradient(ellipse at 20% 0%, rgba(56,189,248,0.04) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 100%, rgba(245,158,11,0.04) 0%, transparent 50%)
        `
      }}>
        {children}
      </body>
    </html>
  )
}
