'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import Auth from './components/Auth'
import NuovoAllenamento from './components/NuovoAllenamento'
import Storico from './components/Storico'
import Catalogo from './components/Catalogo'
import Analytics from './components/Analytics'
import type { User } from '@supabase/supabase-js'

type Schermata = 'home' | 'nuovo' | 'storico' | 'catalogo' | 'analytics'

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [schermata, setSchermata] = useState<Schermata>('home')

  useEffect(() => {
    // Controlla sessione attiva
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Ascolta cambiamenti auth (login/logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const logout = async () => {
    await supabase.auth.signOut()
    setSchermata('home')
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
        <p className="text-gray-400">Caricamento...</p>
      </main>
    )
  }

  if (!user) return <Auth />

  if (schermata === 'nuovo') return <NuovoAllenamento onTorna={() => setSchermata('home')} />
  if (schermata === 'storico') return <Storico onTorna={() => setSchermata('home')} />
  if (schermata === 'catalogo') return <Catalogo onTorna={() => setSchermata('home')} />
  if (schermata === 'analytics') return <Analytics onTorna={() => setSchermata('home')} />

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-950 text-white">
      <h1 className="text-4xl font-black mb-2">💪 GymTracker</h1>
      <p className="text-gray-400 mb-1 text-sm">{user.email}</p>
      <p className="text-gray-600 mb-8 text-xs">Bentornato!</p>

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
        <button
          onClick={logout}
          className="text-gray-600 hover:text-gray-400 text-sm transition mt-2"
        >
          Esci
        </button>
      </div>
    </main>
  )
}