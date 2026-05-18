'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors">
      {copied ? <Check size={16} /> : <Copy size={16} />}
    </button>
  )
}
