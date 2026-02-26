'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

interface Serie {
  id: number
  numero_serie: number
  peso: number
  ripetizioni: number
  recupero_secondi: number
}

interface Esercizio {
  id: number
  nome: string
  serie: Serie[]
}

interface Allenamento {
  id: number
  data: string
  esercizi: Esercizio[]
}

interface Props {
  onTorna: () => void
}

export default function Storico({ onTorna }: Props) {
  const [allenamenti, setAllenamenti] = useState<Allenamento[]>([])
  const [loading, setLoading] = useState(true)
  const [espanso, setEspanso] = useState<number | null>(null)

  useEffect(() => {
    caricaStorico()
  }, [])

  const caricaStorico = async () => {
    setLoading(true)

    const { data: allenamentiData } = await supabase
      .from('allenamenti')
      .select('*')
      .order('data', { ascending: false })

    if (!allenamentiData) { setLoading(false); return }

    const risultati: Allenamento[] = []

    for (const a of allenamentiData) {
      const { data: eserciziData } = await supabase
        .from('esercizi')
        .select('*')
        .eq('allenamento_id', a.id)

      const esercizi: Esercizio[] = []

      for (const e of eserciziData || []) {
        const { data: serieData } = await supabase
          .from('serie')
          .select('*')
          .eq('esercizio_id', e.id)
          .order('numero_serie', { ascending: true })

        esercizi.push({ ...e, serie: serieData || [] })
      }

      risultati.push({ ...a, esercizi })
    }

    setAllenamenti(risultati)
    setLoading(false)
  }

  const eliminaAllenamento = async (id: number) => {
    if (!confirm('Sei sicuro di voler eliminare questo allenamento?')) return
    await supabase.from('allenamenti').delete().eq('id', id)
    setAllenamenti(allenamenti.filter(a => a.id !== id))
  }

  const formattaData = (data: string) => {
    return new Date(data).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <main className="min-h-screen p-6 bg-gray-950 text-white max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black">📋 Storico</h1>
        <button
          onClick={onTorna}
          className="border border-gray-700 hover:border-gray-500 py-2 px-4 rounded-xl transition text-sm"
        >
          ← Indietro
        </button>
      </div>

      {loading ? (
        <p className="text-gray-400 text-center mt-12">Caricamento...</p>
      ) : allenamenti.length === 0 ? (
        <p className="text-gray-400 text-center mt-12">
          Nessun allenamento registrato.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {allenamenti.map(a => (
            <div key={a.id} className="bg-gray-900 rounded-2xl p-4">
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setEspanso(espanso === a.id ? null : a.id)}
              >
                <div>
                  <p className="font-bold">{formattaData(a.data)}</p>
                  <p className="text-sm text-gray-400">
                    {a.esercizi.length} esercizi
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      eliminaAllenamento(a.id)
                    }}
                    className="text-gray-600 hover:text-red-400 transition text-lg"
                  >
                    🗑
                  </button>
                  <span className="text-gray-500 text-lg">
                    {espanso === a.id ? '▲' : '▼'}
                  </span>
                </div>
              </div>

              {espanso === a.id && (
                <div className="mt-4 flex flex-col gap-3">
                  <hr className="border-gray-800" />
                  {a.esercizi.length === 0 ? (
                    <p className="text-sm text-gray-500">Nessun esercizio.</p>
                  ) : (
                    a.esercizi.map(e => (
                      <div key={e.id}>
                        <p className="font-semibold text-orange-400 mb-1">
                          • {e.nome}
                        </p>
                        {e.serie.map(s => (
                          <p key={s.id} className="text-sm text-gray-300 pl-3">
                            Serie {s.numero_serie} — {s.peso}kg × {s.ripetizioni} reps
                            {s.recupero_secondi > 0 && ` | ⏱ ${s.recupero_secondi}s`}
                          </p>
                        ))}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  )
}