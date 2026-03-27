import { useState, useEffect } from 'react'

export default function CountdownTimer({ targetTime, onEnd }) {
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    if (!targetTime) return

    const calculate = () => {
      // Handle Firestore Timestamp or JS Date
      const target = targetTime.toDate ? targetTime.toDate().getTime() : new Date(targetTime).getTime()
      const now = Date.now()
      const diff = target - now

      if (diff <= 0) {
        setTimeLeft('00:00')
        onEnd?.()
        return
      }

      const mins = Math.floor(diff / 1000 / 60)
      const secs = Math.floor((diff / 1000) % 60)
      setTimeLeft(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`)
    }

    calculate()
    const timer = setInterval(calculate, 1000)
    return () => clearInterval(timer)
  }, [targetTime, onEnd])

  if (!targetTime) return null

  return (
    <div className="flex items-center gap-2 font-mono text-lg font-black tracking-tighter">
      <span className={timeLeft === '00:00' ? 'text-red-500' : 'text-orange-600 animate-pulse'}>
        {timeLeft}
      </span>
    </div>
  )
}
