'use client'

import { useState, useEffect, useRef } from 'react'
import { saveScore, getTopScores, type Score } from './actions'

export default function Home() {
  const [gameStarted, setGameStarted] = useState(false)
  const [timeLeft, setTimeLeft] = useState(15)
  const [score, setScore] = useState(0)
  const [position, setPosition] = useState({ top: '50%', left: '50%' })
  const [leaderboard, setLeaderboard] = useState<Score[]>([])
  const [playerName, setPlayerName] = useState('')
  const [isGameOver, setIsGameOver] = useState(false)
  
  // Načtení scoreboardu při startu
  useEffect(() => {
    refreshLeaderboard()
  }, [])

  const refreshLeaderboard = async () => {
    const data = await getTopScores()
    setLeaderboard(data)
  }

  // Herní časovač
  useEffect(() => {
    if (gameStarted && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0 && gameStarted) {
      endGame()
    }
  }, [timeLeft, gameStarted])

  const moveTarget = () => {
    const top = Math.floor(Math.random() * 80 + 10) + '%' // 10% až 90%
    const left = Math.floor(Math.random() * 80 + 10) + '%'
    setPosition({ top, left })
  }

  const handleClick = () => {
    setScore(score + 1)
    moveTarget()
  }

  const startGame = () => {
    setScore(0)
    setTimeLeft(15)
    setGameStarted(true)
    setIsGameOver(false)
    moveTarget()
  }

  const endGame = () => {
    setGameStarted(false)
    setIsGameOver(true)
  }

  const handleSubmitScore = async () => {
    if (!playerName) return alert('Zadej jméno!')
    await saveScore(playerName, score)
    setIsGameOver(false) // Reset UI
    setPlayerName('')
    refreshLeaderboard() // Aktualizuj tabulku
  }

  return (
    <main className="min-h-screen bg-slate-900 text-white flex flex-col items-center p-4 font-mono">
      <h1 className="text-4xl font-bold mb-4 text-emerald-400">Rychlé Prsty</h1>
      
      {/* Herní plocha */}
      <div className="relative w-full max-w-md h-96 bg-slate-800 rounded-xl border-2 border-slate-700 overflow-hidden mb-8 shadow-2xl">
        {!gameStarted && !isGameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-slate-900/80">
            <button 
              onClick={startGame}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 px-8 rounded-full text-xl transition transform hover:scale-105"
            >
              START HRY
            </button>
            <p className="mt-4 text-slate-400">Klikni na co nejvíce čtverců za 15s!</p>
          </div>
        )}

        {/* Cíl ke kliknutí */}
        {gameStarted && (
          <div 
            onClick={handleClick}
            style={{ top: position.top, left: position.left }}
            className="absolute w-16 h-16 bg-emerald-400 rounded-lg cursor-pointer transform -translate-x-1/2 -translate-y-1/2 active:scale-90 transition-transform duration-75 border-b-4 border-emerald-600 shadow-lg hover:bg-emerald-300"
          ></div>
        )}

        {/* UI ve hře */}
        <div className="absolute top-2 right-2 text-xl font-bold text-slate-300">
          Čas: <span className={timeLeft < 5 ? 'text-red-500' : 'text-white'}>{timeLeft}s</span>
        </div>
        <div className="absolute top-2 left-2 text-xl font-bold text-slate-300">
          Skóre: <span className="text-emerald-400">{score}</span>
        </div>

        {/* Formuář po hře */}
        {isGameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-slate-900/95 p-6 text-center">
            <h2 className="text-3xl font-bold mb-2">Konec hry!</h2>
            <p className="text-xl mb-6">Tvé skóre: <span className="text-emerald-400 font-bold">{score}</span></p>
            
            <input 
              type="text" 
              placeholder="Tvé jméno..." 
              maxLength={12}
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="bg-slate-700 border border-slate-600 rounded px-4 py-2 mb-4 w-full max-w-xs text-white focus:outline-none focus:border-emerald-500"
            />
            <button 
              onClick={handleSubmitScore}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded w-full max-w-xs"
            >
              Uložit do žebříčku
            </button>
            <button 
              onClick={() => setIsGameOver(false)}
              className="mt-4 text-slate-400 hover:text-white underline"
            >
              Zrušit
            </button>
          </div>
        )}
      </div>

      {/* Global Scoreboard */}
      <div className="w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4 text-center border-b border-slate-700 pb-2">🏆 Globální Žebříček</h2>
        <div className="bg-slate-800 rounded-lg p-4 shadow-lg border border-slate-700">
          {leaderboard.length === 0 ? (
            <p className="text-center text-slate-500">Zatím žádné skóre. Buď první!</p>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="text-slate-400 border-b border-slate-700">
                  <th className="pb-2">#</th>
                  <th className="pb-2">Jméno</th>
                  <th className="pb-2 text-right">Skóre</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, idx) => (
                  <tr key={idx} className="border-b border-slate-700/50 last:border-0 hover:bg-slate-700/30">
                    <td className="py-2 text-slate-500 font-mono">{idx + 1}.</td>
                    <td className="py-2 font-bold text-slate-200">{entry.name}</td>
                    <td className="py-2 text-right font-mono text-emerald-400 font-bold">{entry.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>
  )
}