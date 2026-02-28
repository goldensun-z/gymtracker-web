'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'

interface Props {
  onTorna: () => void
}

interface SerieData {
  id: number
  numero_serie: number
  peso: number
  ripetizioni: number
  recupero_secondi: number
}

export default function NuovoAllenamento({ onTorna }: Props) {
  const [allenamentoId, setAllenamentoId] = useState<number | null>(null)
  const [esercizioId, setEsercizioId] = useState<number | null>(null)
  const [nomeEsercizio, setNomeEsercizio] = useState('')
  const [esercizioInCorso, setEsercizioInCorso] = useState(false)
  const [serie, setSerie] = useState<SerieData[]>([])
  const [peso, setPeso] = useState('')
  const [ripetizioni, setRipetizioni] = useState('')
  const [mostraRecupero, setMostraRecupero] = useState(false)
  const [recupero, setRecupero] = useState('')
  const [suggerimenti, setSuggerimenti] = useState<string[]>([])

  // Autocomplete dal catalogo
  const cercaSuggerimenti = async (testo: string) => {
    setNomeEsercizio(testo)
    if (testo.length < 2) { setSuggerimenti([]); return }
    const { data } = await supabase
      .from('catalogo_esercizi')
      .select('nome')
      .ilike('nome', `%${testo}%`)
      .limit(5)
    setSuggerimenti(data?.map(d => d.nome) || [])
  }

  const iniziaAllenamento = async (nome: string) => {
  let alId = allenamentoId
  if (!alId) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('allenamenti')
      .insert({ note: '', user_id: user.id })
      .select()
      .single()
    if (error || !data) return
    alId = data.id
    setAllenamentoId(alId)
  }

  const { data, error } = await supabase
    .from('esercizi')
    .insert({ allenamento_id: alId, nome })
    .select()
    .single()
  if (error || !data) return

  setEsercizioId(data.id)
  setSerie([])
  setEsercizioInCorso(true)
  setSuggerimenti([])
}
  const aggiungiSerie = async () => {
    const p = parseFloat(peso)
    const r = parseInt(ripetizioni)
    if (isNaN(p) || isNaN(r) || !esercizioId) return

    const { data, error } = await supabase
      .from('serie')
      .insert({
        esercizio_id: esercizioId,
        numero_serie: serie.length + 1,
        peso: p,
        ripetizioni: r,
        recupero_secondi: 0
      })
      .select()
      .single()

    if (error || !data) return

    setSerie([...serie, data])
    setPeso('')
    setRipetizioni('')
    setMostraRecupero(true)
  }

  const confermaRecupero = async () => {
    const rec = parseInt(recupero) || 0
    const ultimaSerie = serie[serie.length - 1]
    if (!ultimaSerie) return

    await supabase
      .from('serie')
      .update({ recupero_secondi: rec })
      .eq('id', ultimaSerie.id)

    setSerie(serie.map((s, i) =>
      i === serie.length - 1 ? { ...s, recupero_secondi: rec } : s
    ))
    setRecupero('')
    setMostraRecupero(false)
  }

  const fineEsercizio = () => {
    setNomeEsercizio('')
    setEsercizioInCorso(false)
    setMostraRecupero(false)
    setSerie([])
  }

  return (
    <main className="min-h-screen p-6 bg-gray-950 text-white max-w-lg mx-auto">
      <h1 className="text-2xl font-black mb-4">🏋️ Allenamento in corso</h1>
      <hr className="border-gray-800 mb-4" />

      {!esercizioInCorso ? (
        // ── Inserimento esercizio ──
        <div className="flex flex-col gap-3">
          <p className="text-lg font-semibold">Aggiungi esercizio</p>
          <div className="relative">
            <input
              className="bg-gray-800 rounded-xl p-3 text-white w-full"
              placeholder="Nome esercizio (es. Panca Piana)"
              value={nomeEsercizio}
              onChange={e => cercaSuggerimenti(e.target.value)}
            />
            {suggerimenti.length > 0 && (
              <div className="absolute z-10 w-full bg-gray-700 rounded-xl mt-1 overflow-hidden shadow-lg">
                {suggerimenti.map(s => (
                  <div
                    key={s}
                    className="px-4 py-3 hover:bg-gray-600 cursor-pointer transition border-b border-gray-600 last:border-0"
                    onClick={() => {
                      setNomeEsercizio(s)
                      setSuggerimenti([])
                    }}
                  >
                    {s}
                  </div>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={() => nomeEsercizio.trim() && iniziaAllenamento(nomeEsercizio)}
            className="bg-orange-500 hover:bg-orange-600 font-bold py-3 rounded-xl transition"
          >
            Inizia Esercizio
          </button>
        </div>
      ) : (
        // ── Esercizio in corso ──
        <div className="flex flex-col gap-3">
          <p className="text-xl font-bold">📋 {nomeEsercizio}</p>

          {/* Lista serie registrate */}
          {serie.length > 0 && (
            <div className="bg-gray-900 rounded-xl p-3 flex flex-col gap-1 mb-2">
              {serie.map(s => (
                <p key={s.id} className="text-sm text-gray-300">
                  Serie {s.numero_serie} — {s.peso}kg × {s.ripetizioni} reps
                  {s.recupero_secondi > 0 && ` | ⏱ ${s.recupero_secondi}s`}
                </p>
              ))}
            </div>
          )}

          {!mostraRecupero ? (
            // ── Form nuova serie ──
            <>
              <p className="font-semibold">Nuova serie</p>
              <input
                className="bg-gray-800 rounded-xl p-3 text-white w-full"
                placeholder="Peso (kg)"
                value={peso}
                onChange={e => setPeso(e.target.value)}
                type="number"
              />
              <input
                className="bg-gray-800 rounded-xl p-3 text-white w-full"
                placeholder="Ripetizioni"
                value={ripetizioni}
                onChange={e => setRipetizioni(e.target.value)}
                type="number"
              />
              <button
                onClick={aggiungiSerie}
                className="bg-orange-500 hover:bg-orange-600 font-bold py-3 rounded-xl transition"
              >
                + Aggiungi Serie
              </button>
            </>
          ) : (
            // ── Recupero dopo serie ──
            <>
              <p className="font-semibold">⏱ Recupero dopo serie {serie.length}</p>
              <input
                className="bg-gray-800 rounded-xl p-3 text-white w-full"
                placeholder="Secondi di recupero"
                value={recupero}
                onChange={e => setRecupero(e.target.value)}
                type="number"
              />
              <button
                onClick={confermaRecupero}
                className="bg-orange-500 hover:bg-orange-600 font-bold py-3 rounded-xl transition"
              >
                Conferma Recupero →
              </button>
            </>
          )}

          <button
            onClick={fineEsercizio}
            className="border border-gray-600 hover:border-gray-400 font-bold py-3 rounded-xl transition mt-2"
          >
            Esercizio Finito → Prossimo
          </button>
        </div>
      )}

      <button
        onClick={onTorna}
        className="border border-gray-700 hover:border-gray-500 font-bold py-3 rounded-xl transition w-full mt-6"
      >
        Termina Allenamento
      </button>
    </main>
  )
}