'use client'

import { useState } from 'react'
import { supabase } from '../../lib/supabase'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [messaggio, setMessaggio] = useState('')
  const [errore, setErrore] = useState('')

  const handleEmailAuth = async () => {
    setLoading(true)
    setErrore('')
    setMessaggio('')

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setErrore(error.message)
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setErrore(error.message)
      else setMessaggio('Controlla la tua email per confermare la registrazione!')
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-gray-950 text-white">
      <h1 className="text-4xl font-black mb-2">💪 GymTracker</h1>
      <p className="text-gray-400 mb-8">
        {isLogin ? 'Accedi al tuo account' : 'Crea un account'}
      </p>

      <div className="w-full max-w-sm flex flex-col gap-3">
        <input
          className="bg-gray-800 rounded-xl p-3 text-white w-full"
          placeholder="Email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <input
          className="bg-gray-800 rounded-xl p-3 text-white w-full"
          placeholder="Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />

        {errore && <p className="text-red-400 text-sm">{errore}</p>}
        {messaggio && <p className="text-green-400 text-sm">{messaggio}</p>}

        <button
          onClick={handleEmailAuth}
          disabled={loading}
          className="bg-orange-500 hover:bg-orange-600 font-bold py-3 rounded-xl transition disabled:opacity-50"
        >
          {loading ? 'Caricamento...' : isLogin ? 'Accedi' : 'Registrati'}
        </button>

        <button
          onClick={() => { setIsLogin(!isLogin); setErrore(''); setMessaggio('') }}
          className="text-gray-400 hover:text-white text-sm transition"
        >
          {isLogin ? 'Non hai un account? Registrati' : 'Hai già un account? Accedi'}
        </button>
      </div>
    </main>
  )
}