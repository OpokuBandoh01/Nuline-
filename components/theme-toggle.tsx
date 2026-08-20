'use client'

import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)

  // Sync state with DOM on mount
  useEffect(() => {
    const root = document.documentElement
    const activeDark = root.classList.contains('dark')
    setIsDark(activeDark)
  }, [])

  const toggleTheme = () => {
    const newDark = !isDark
    setIsDark(newDark)
    
    const root = document.documentElement
    if (newDark) {
      root.classList.add('dark')
      root.classList.remove('light')
      localStorage.setItem('theme', 'dark')
    } else {
      root.classList.remove('dark')
      root.classList.add('light')
      localStorage.setItem('theme', 'light')
    }
  }

  // Prevent hydration flicker
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  if (!mounted) {
    return <div className="size-9 rounded-full border border-memo-line bg-memo-panel/35" />
  }

  return (
    <button
      onClick={toggleTheme}
      className="flex size-9 items-center justify-center rounded-full border border-memo-line bg-memo-panel/40 hover:bg-memo-panel-hover text-memo-gold transition-colors outline-none cursor-pointer"
      aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  )
}
