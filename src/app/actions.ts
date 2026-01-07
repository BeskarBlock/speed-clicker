'use server'

import Redis from 'ioredis'
import { revalidatePath } from 'next/cache'

export type Score = {
  name: string
  value: number
  timestamp: number
}

// Funkce pro získání klienta. 
// Pokud nemáme URL (např. při buildování), nezkoušíme se připojit, aby to nespadlo.
const getRedis = () => {
  if (process.env.REDIS_URL) {
    return new Redis(process.env.REDIS_URL)
  }
  return null
}

export async function saveScore(name: string, score: number) {
  const redis = getRedis()
  if (!redis) return { error: 'Chybí REDIS_URL' }

  if (!name || name.length > 15) return { error: 'Jméno je moc dlouhé nebo chybí' }
  
  const entry: Score = {
    name,
    value: score,
    timestamp: Date.now()
  }

  try {
    // ioredis syntaxe: zadd(key, score, value)
    await redis.zadd('leaderboard', score, JSON.stringify(entry))
    revalidatePath('/')
    return { success: true }
  } catch (err) {
    console.error('Chyba Redis:', err)
    return { error: 'Chyba při ukládání' }
  }
}

export async function getTopScores() {
  const redis = getRedis()
  if (!redis) return []

  try {
    // Získáme top 10 skóre (od nejvyššího)
    const rawScores = await redis.zrange('leaderboard', 0, 9, 'REV')
    
    // Převedeme JSON stringy zpět na objekty
    const scores = rawScores.map((s) => JSON.parse(s)) as Score[]
    return scores
  } catch (error) {
    console.error('Chyba Redis:', error)
    return []
  }
}