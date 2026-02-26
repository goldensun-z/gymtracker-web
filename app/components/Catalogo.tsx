'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'

interface Props {
  onTorna: () => void
}

interface Esercizio {
  id: number
  nome: string
  categoria: string
}

export default function Catalogo({ onTorna }: Props) {
  const [esercizi, setEsercizi] = useState<Esercizio[]>([])
  const [loading, setLoading] = useState(true)
  const [nuovoNome, setNuovoNome] = useState('')
  const [nuovaCategoria, setNuovaCategoria] = useState('altro')
  const [filtro, setFiltro] = useState('')

  useEffect(() => {
    caricaCatalogo()
  }, [])

  const caricaCatalogo = async () => {
    const { data } = await supabase
      .from('catalogo_esercizi')
      .select('*')
      .order('categoria', { ascending: true })
    setEsercizi(data || [])
    setLoading(false)
  }

  const aggiungiEsercizio = async () => {
    if (!nuovoNome.trim()) return
    const { error } = await supabase
      .from('catalogo_esercizi')
      .insert({ nome: nuovoNome.trim(), categoria: nuovaCategoria })
    if (!error) {
      setNuovoNome('')
      caricaCatalogo()
    }
  }

  const eliminaEsercizio = async (id: number) => {
    await supabase.from('catalogo_esercizi').delete().eq('id', id)
    caricaCatalogo()
  }

  const categorieUniche = [...new Set(esercizi.map(e => e.categoria))]
  const eserciziFiltrati = esercizi.filter(e =>
    e.nome.toLowerCase().includes(filtro.toLowerCase())
  )

  return (
    <main className="min-h-screen p-6 bg-gray-950 text-white max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-black">📚 Catalogo Esercizi</h1>
        <button
          onClick={onTorna}
          className="border border-gray-700 hover:border-gray-500 py-2 px-4 rounded-xl transition text-sm"
        >
          ← Indietro
        </button>
      </div>

      {/* Aggiungi nuovo esercizio */}
      <div className="bg-gray-900 rounded-2xl p-4 mb-6 flex flex-col gap-3">
        <p className="font-semibold text-orange-400">+ Aggiungi esercizio</p>
        <input
          className="bg-gray-800 rounded-xl p-3 text-white w-full"
          placeholder="Nome esercizio"
          value={nuovoNome}
          onChange={e => setNuovoNome(e.target.value)}
        />
        <select
          className="bg-gray-800 rounded-xl p-3 text-white w-full"
          value={nuovaCategoria}
          onChange={e => setNuovaCategoria(e.target.value)}
        >
          {['petto', 'schiena', 'gambe', 'spalle', 'bicipiti', 'tricipiti', 'addome', 'altro'].map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <button
          onClick={aggiungiEsercizio}
          className="bg-orange-500 hover:bg-orange-600 font-bold py-3 rounded-xl transition"
        >
          Aggiungi
        </button>
      </div>

      {/* Ricerca */}
      <input
        className="bg-gray-800 rounded-xl p-3 text-white w-full mb-4"
        placeholder="🔍 Cerca esercizio..."
        value={filtro}
        onChange={e => setFiltro(e.target.value)}
      />

      {/* Lista per categoria */}
      {loading ? (
        <p className="text-gray-400 text-center">Caricamento...</p>
      ) : (
        categorieUniche.map(categoria => {
          const eserciziCategoria = eserciziFiltrati.filter(e => e.categoria === categoria)
          if (eserciziCategoria.length === 0) return null
          return (
            <div key={categoria} className="mb-4">
              <p className="text-xs uppercase tracking-widest text-orange-400 mb-2">{categoria}</p>
              <div className="flex flex-col gap-2">
                {eserciziCategoria.map(e => (
                  <div key={e.id} className="bg-gray-900 rounded-xl px-4 py-3 flex items-center justify-between">
                    <span>{e.nome}</span>
                    <button
                      onClick={() => eliminaEsercizio(e.id)}
                      className="text-gray-600 hover:text-red-400 transition text-lg"
                    >
                      🗑
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )
        })
      )}
    </main>
  )
}