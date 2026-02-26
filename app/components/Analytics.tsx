'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts'

interface Props {
  onTorna: () => void
}

interface PuntoGrafico {
  data: string
  pesoMax: number
  volume: number
  orm: number
  numSerie: number
}

interface EsercizioStats {
  nome: string
  dati: PuntoGrafico[]
}

type Metrica = 'pesoMax' | 'volume' | 'orm' | 'numSerie'

const METRICHE: { key: Metrica; label: string; unita: string }[] = [
  { key: 'pesoMax', label: 'Peso massimo', unita: 'kg' },
  { key: 'volume', label: 'Volume', unita: 'kg' },
  { key: 'orm', label: '1RM stimato', unita: 'kg' },
  { key: 'numSerie', label: 'N° serie', unita: '' },
]

export default function Analytics({ onTorna }: Props) {
  const [esercizi, setEsercizi] = useState<string[]>([])
  const [esercizioSelezionato, setEsercizioSelezionato] = useState<string | null>(null)
  const [dati, setDati] = useState<PuntoGrafico[]>([])
  const [metrica, setMetrica] = useState<Metrica>('pesoMax')
  const [loading, setLoading] = useState(true)
  const [loadingGrafico, setLoadingGrafico] = useState(false)

  useEffect(() => {
    caricaEsercizi()
  }, [])

  useEffect(() => {
    if (esercizioSelezionato) caricaDati(esercizioSelezionato)
  }, [esercizioSelezionato])

  const caricaEsercizi = async () => {
    const { data } = await supabase
      .from('esercizi')
      .select('nome')
    const nomiUnici = [...new Set(data?.map(e => e.nome) || [])].sort()
    setEsercizi(nomiUnici)
    setLoading(false)
  }

  const caricaDati = async (nome: string) => {
    setLoadingGrafico(true)

    const { data } = await supabase
      .from('allenamenti')
      .select(`
        data,
        esercizi!inner (
          nome,
          serie (
            peso,
            ripetizioni,
            numero_serie
          )
        )
      `)
      .eq('esercizi.nome', nome)
      .order('data', { ascending: true })

    if (!data) { setLoadingGrafico(false); return }

    const punti: PuntoGrafico[] = data.map(a => {
      const tutteLeSerie = (a.esercizi as any[]).flatMap(e => e.serie)

      const pesoMax = Math.max(...tutteLeSerie.map((s: any) => s.peso))
      const volume = tutteLeSerie.reduce((acc: number, s: any) => acc + s.peso * s.ripetizioni, 0)
      const orm = Math.max(...tutteLeSerie.map((s: any) => s.peso * (1 + s.ripetizioni / 30)))
      const numSerie = tutteLeSerie.length

      return {
        data: new Date(a.data).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' }),
        pesoMax: Math.round(pesoMax * 10) / 10,
        volume: Math.round(volume),
        orm: Math.round(orm * 10) / 10,
        numSerie
      }
    })

    setDati(punti)
    setLoadingGrafico(false)
  }

  const metricaCorrente = METRICHE.find(m => m.key === metrica)!

  const ultimo = dati[dati.length - 1]?.[metrica] ?? 0
  const record = Math.max(...dati.map(d => d[metrica]))
  const primo = dati[0]?.[metrica] ?? 0
  const delta = ultimo - primo
  const deltaStr = `${delta >= 0 ? '+' : ''}${Math.round(delta * 10) / 10}`

  // Vista lista esercizi
  if (!esercizioSelezionato) {
    return (
      <main className="min-h-screen p-6 bg-gray-950 text-white max-w-lg mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-black">📊 Analytics</h1>
          <button
            onClick={onTorna}
            className="border border-gray-700 hover:border-gray-500 py-2 px-4 rounded-xl transition text-sm"
          >
            ← Indietro
          </button>
        </div>

        <p className="text-gray-400 text-sm mb-4">
          Seleziona un esercizio per visualizzare la progressione
        </p>

        {loading ? (
          <p className="text-gray-400 text-center mt-12">Caricamento...</p>
        ) : esercizi.length === 0 ? (
          <p className="text-gray-400 text-center mt-12">
            Nessun dato. Completa almeno un allenamento per vedere i grafici.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {esercizi.map(nome => (
              <button
                key={nome}
                onClick={() => setEsercizioSelezionato(nome)}
                className="bg-gray-900 hover:bg-gray-800 rounded-xl px-4 py-4 text-left flex items-center justify-between transition"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">🏋️</span>
                  <span className="font-medium">{nome}</span>
                </div>
                <span className="text-gray-500">›</span>
              </button>
            ))}
          </div>
        )}
      </main>
    )
  }

  // Vista grafico esercizio
  return (
    <main className="min-h-screen p-6 bg-gray-950 text-white max-w-lg mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => setEsercizioSelezionato(null)}
          className="border border-gray-700 hover:border-gray-500 py-2 px-4 rounded-xl transition text-sm"
        >
          ← Indietro
        </button>
        <h1 className="text-xl font-black truncate">{esercizioSelezionato}</h1>
      </div>

      {loadingGrafico ? (
        <p className="text-gray-400 text-center mt-12">Caricamento...</p>
      ) : dati.length === 0 ? (
        <p className="text-gray-400 text-center mt-12">Nessun dato per questo esercizio.</p>
      ) : (
        <>
          {/* Selettore metriche */}
          <div className="flex flex-wrap gap-2 mb-4">
            {METRICHE.map(m => (
              <button
                key={m.key}
                onClick={() => setMetrica(m.key)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                  metrica === m.key
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Grafico */}
          <div className="bg-gray-900 rounded-2xl p-4 mb-4">
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={dati} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2D2D2D" />
                <XAxis
                  dataKey="data"
                  tick={{ fill: '#9CA3AF', fontSize: 11 }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#9CA3AF', fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{ background: '#1F2937', border: 'none', borderRadius: 12 }}
                  labelStyle={{ color: '#F9FAFB' }}
                  formatter={(value: any) => [`${value} ${metricaCorrente.unita}`, metricaCorrente.label]}
                />
                <Line
                  type="monotone"
                  dataKey={metrica}
                  stroke="#F97316"
                  strokeWidth={2.5}
                  dot={{ fill: '#F97316', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Statistiche sommario */}
          <div className="grid grid-cols-4 gap-2 mb-6">
            {[
              { label: 'Ultimo', value: `${ultimo} ${metricaCorrente.unita}`.trim() },
              { label: 'Record', value: `${record} ${metricaCorrente.unita}`.trim() },
              { label: 'Δ totale', value: `${deltaStr} ${metricaCorrente.unita}`.trim() },
              { label: 'Sessioni', value: `${dati.length}` },
            ].map(stat => (
              <div key={stat.label} className="bg-gray-900 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">{stat.label}</p>
                <p className="text-sm font-bold">{stat.value}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  )
}