'use client'

import { useTheme } from '@/app/theme-provider'
import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    setMounted(true)
    const isDarkMode = document.documentElement.classList.contains('dark')
    setIsDark(isDarkMode)
  }, [])

  let toggleTheme = () => {
    const html = document.documentElement
    const isDarkNow = html.classList.contains('dark')
    if (isDarkNow) {
      html.classList.remove('dark')
      localStorage.setItem('darkdesire-theme', 'light')
      setIsDark(false)
    } else {
      html.classList.add('dark')
      localStorage.setItem('darkdesire-theme', 'dark')
      setIsDark(true)
    }
  }

  // Try to get the context theme if available
  try {
    const { toggleTheme: contextToggle } = useTheme()
    toggleTheme = contextToggle
  } catch {
    // Context not available, use local toggle
  }

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Sun className="w-5 h-5 text-yellow-400" />
      ) : (
        <Moon className="w-5 h-5 text-gray-700" />
      )}
    </button>
  )
}
