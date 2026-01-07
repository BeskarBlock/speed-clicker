'use server'

import { kv } from '@vercel/kv'
import { revalidatePath } from 'next/cache'

export type Score = {
  name: string
  value: number
  timestamp: number
}

// Uloží skóre do Redis (Sorted Set)
export async function saveScore(name: string, score: number) {
  // Validace
  if (!name || name.length > 15) return { error: 'Jméno je moc dlouhé nebo chybí' }
  
  const entry: Score = {
    name,
    value: score,
    timestamp: Date.now()
  }

  // Uložíme do Sorted Setu s názvem 'leaderboard'. 
  // Redis řadí primárně podle skóre.
  // Používáme unikátní member string, abychom nepřepsali stejná jména.
  await kv.zadd('leaderboard', { score: score, member: JSON.stringify(entry) })
  
  revalidatePath('/')
  return { success: true }
}

// Načte TOP 10 hráčů
export async function getTopScores() {
  try {
    // Zrevrange vrátí prvky od nejvyššího skóre po nejnižší
    const rawScores = await kv.zrange('leaderboard', 0, 9, { rev: true })
    
    // Parsujeme JSON stringy zpět na objekty
    const scores = rawScores.map((s) => (typeof s === 'string' ? JSON.parse(s) : s)) as Score[]
    return scores
  } catch (error) {
    return []
  }
}