'use server'

import { createClient } from '@vercel/kv'
import { revalidatePath } from 'next/cache'

// Tady definujeme typ skóre
export type Score = {
  name: string
  value: number
  timestamp: number
}

// ⚠️ MANUÁLNÍ PŘIPOJENÍ
// Tohle je bezpečnější než "import { kv }", protože vidíme, co se děje.
// Pokud nemáš nastavené proměnné, použijeme prázdný string, aby to hned nespadlo,
// ale vyhodí to chybu až při pokusu o uložení.
const kv = createClient({
  url: process.env.KV_REST_API_URL || process.env.KV_URL || '',
  token: process.env.KV_REST_API_TOKEN || process.env.KV_TOKEN || '',
})

export async function saveScore(name: string, score: number) {
  // Debugging: Vypíše do logů na Vercelu, jestli vidí databázi
  console.log('Pokus o uložení. URL databáze:', process.env.KV_REST_API_URL ? 'Nalezena' : 'CHYBÍ!')

  if (!process.env.KV_REST_API_URL && !process.env.KV_URL) {
    return { error: 'Chyba serveru: Databáze není připojena (chybí URL).' }
  }

  if (!name || name.length > 15) return { error: 'Jméno je moc dlouhé nebo chybí' }
  
  const entry: Score = {
    name,
    value: score,
    timestamp: Date.now()
  }

  try {
    await kv.zadd('leaderboard', { score: score, member: JSON.stringify(entry) })
    revalidatePath('/')
    return { success: true }
  } catch (err) {
    console.error('Chyba při zápisu do KV:', err)
    return { error: 'Nepodařilo se uložit skóre.' }
  }
}

export async function getTopScores() {
  try {
    if (!process.env.KV_REST_API_URL && !process.env.KV_URL) return []
    
    const rawScores = await kv.zrange('leaderboard', 0, 9, { rev: true })
    const scores = rawScores.map((s) => (typeof s === 'string' ? JSON.parse(s) : s)) as Score[]
    return scores
  } catch (error) {
    console.error('Chyba při načítání:', error)
    return []
  }
}