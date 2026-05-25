'use client'

import { useState } from 'react'

type ImportStep = 'idle' | 'running' | 'done' | 'error'

interface ImportResult {
  teams?: number
  players?: number
  matches?: number
  error?: string
}

export default function AdminImportPage() {
  const [step, setStep] = useState<ImportStep>('idle')
  const [result, setResult] = useState<ImportResult | null>(null)
  const [season, setSeason] = useState('2026')
  const [leagueId, setLeagueId] = useState('1')  // API-Football WC league ID

  async function runImport(type: 'teams' | 'players' | 'matches') {
    setStep('running')
    setResult(null)
    try {
      const res = await fetch('/api/admin/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, season, league_id: leagueId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Import failed')
      setResult(data)
      setStep('done')
    } catch (e) {
      setResult({ error: String(e) })
      setStep('error')
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Import Dati</h1>
        <p className="text-sm text-gray-500 mt-1">Importa squadre, giocatori e partite da API-Football.</p>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 p-4 text-sm text-amber-800 dark:text-amber-300">
        ⚠️ Richiede <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded">API_FOOTBALL_KEY</code> nel file <code>.env.local</code>.
        Tutti i risultati vengono messi in cache su Upstash Redis (TTL 24h).
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#161b22] p-5 space-y-4">
        <h2 className="font-semibold">Parametri</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Stagione</label>
            <input value={season} onChange={e => setSeason(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">League ID (API-Football)</label>
            <input value={leagueId} onChange={e => setLeagueId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {([
          { type: 'teams',   icon: '🏳', label: 'Importa Squadre',   desc: '/teams?league&season' },
          { type: 'players', icon: '👤', label: 'Importa Giocatori', desc: '/players?team&league&season' },
          { type: 'matches', icon: '📅', label: 'Importa Partite',   desc: '/fixtures?league&season' },
        ] as const).map(item => (
          <button key={item.type}
            onClick={() => runImport(item.type)}
            disabled={step === 'running'}
            className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#161b22] hover:border-green-400 hover:bg-green-50 dark:hover:bg-green-950/20 transition-colors disabled:opacity-50 text-left">
            <div className="text-2xl mb-2">{item.icon}</div>
            <div className="font-semibold text-sm">{item.label}</div>
            <div className="text-xs text-gray-500 mt-0.5 font-mono">{item.desc}</div>
          </button>
        ))}
      </div>

      {step === 'running' && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 text-sm text-blue-700 dark:text-blue-300">
          <span className="animate-spin">⏳</span> Import in corso…
        </div>
      )}

      {step === 'done' && result && (
        <div className="p-4 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 text-sm text-green-700 dark:text-green-300 space-y-1">
          <p className="font-semibold">✅ Import completato</p>
          {result.teams   != null && <p>Squadre importate: <strong>{result.teams}</strong></p>}
          {result.players != null && <p>Giocatori importati: <strong>{result.players}</strong></p>}
          {result.matches != null && <p>Partite importate: <strong>{result.matches}</strong></p>}
        </div>
      )}

      {step === 'error' && result?.error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-300">
          ❌ {result.error}
        </div>
      )}

      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#161b22] p-5">
        <h2 className="font-semibold mb-2">Override ruoli (role_override.json)</h2>
        <p className="text-sm text-gray-500 mb-3">API-Football non fornisce ruoli fantasy. Carica un file JSON per impostare i ruoli manualmente.</p>
        <label className="inline-flex items-center gap-2 cursor-pointer px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm transition-colors">
          📁 Carica role_override.json
          <input type="file" accept=".json" className="hidden"
            onChange={async e => {
              const file = e.target.files?.[0]
              if (!file) return
              const json = JSON.parse(await file.text())
              const res = await fetch('/api/admin/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'roles', data: json }),
              })
              const d = await res.json()
              setResult(d); setStep(res.ok ? 'done' : 'error')
            }} />
        </label>
      </div>
    </div>
  )
}
