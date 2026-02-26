'use client'

import { useState } from 'react'
import NuovoAllenamento from './components/NuovoAllenamento'
import Storico from './components/Storico'
import Catalogo from './components/Catalogo'
import Analytics from './components/Analytics'

export default function Home() {
  const [schermata, setSchermata] = useState<'home' | 'nuovo' | 'storico' | 'catalogo' | 'analytics'>('home')

  if (schermata === 'nuovo') return <NuovoAllenamento onTorna={() => setSchermata('home')} />
  if (schermata === 'storico') return <Storico onTorna={() => setSchermata('home')} />
  if (schermata === 'catalogo') return <Catalogo onTorna={() => setSchermata('home')} />
  if (schermata === 'analytics') return <Analytics onTorna={() => setSchermata('home')} />

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-950 text-white">
      <h1 className="text-4xl font-black mb-4">💪 GymTracker</h1>
      <p className="text-gray-400 mb-8">Benvenuto! Inizia il tuo allenamento.</p>
      <div className="flex flex-col gap-3 w-full max-w-sm">
        <button
          onClick={() => setSchermata('nuovo')}
          className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-xl transition"
        >
          Nuovo Allenamento
        </button>
        <button
          onClick={() => setSchermata('storico')}
          className="border border-gray-700 hover:border-gray-500 text-white font-bold py-3 px-6 rounded-xl transition"
        >
          📋 Storico Allenamenti
        </button>
        <button
          onClick={() => setSchermata('catalogo')}
          className="border border-gray-700 hover:border-gray-500 text-white font-bold py-3 px-6 rounded-xl transition"
        >
          📚 Catalogo Esercizi
        </button>
        <button
          onClick={() => setSchermata('analytics')}
          className="border border-gray-700 hover:border-gray-500 text-white font-bold py-3 px-6 rounded-xl transition"
        >
          📊 Analytics
        </button>
      </div>
    </main>
  )
}