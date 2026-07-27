import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

const COOKIE_PREFIX = 'routiq_session_'
const SESSION_COOKIE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

function getCookie(key: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${key}=([^;]*)`))
  return match ? decodeURIComponent(match[1]) : null
}

function setCookie(key: string, value: string, maxAgeSeconds: number): void {
  document.cookie = `${key}=${encodeURIComponent(value)}; max-age=${maxAgeSeconds}; path=/; SameSite=Lax; Secure`
}

function removeCookie(key: string): void {
  document.cookie = `${key}=; max-age=0; path=/`
}

function createStorageAdapter(): Storage {
  const fallback = new Map<string, string>()

  return {
    getItem(key: string): string | null {
      const sessionVal = sessionStorage.getItem(key)
      if (sessionVal) return sessionVal
      const cookieVal = getCookie(COOKIE_PREFIX + key)
      if (cookieVal) {
        try {
          sessionStorage.setItem(key, cookieVal)
        } catch {
          // sessionStorage full or unavailable
        }
        return cookieVal
      }
      return fallback.get(key) ?? null
    },

    setItem(key: string, value: string): void {
      try {
        sessionStorage.setItem(key, value)
      } catch {
        fallback.set(key, value)
      }
      setCookie(COOKIE_PREFIX + key, value, Math.floor(SESSION_COOKIE_EXPIRY_MS / 1000))
    },

    removeItem(key: string): void {
      try {
        sessionStorage.removeItem(key)
      } catch {
        // ignore
      }
      removeCookie(COOKIE_PREFIX + key)
      fallback.delete(key)
    },

    get length(): number {
      return sessionStorage.length + fallback.size
    },

    key(index: number): string | null {
      return sessionStorage.key(index) ?? [...fallback.keys()][index] ?? null
    },

    clear(): void {
      sessionStorage.clear()
      fallback.clear()
      const cookies = document.cookie.split('; ')
      for (const cookie of cookies) {
        if (cookie.startsWith(COOKIE_PREFIX)) {
          const name = cookie.split('=')[0]
          removeCookie(name)
        }
      }
    },
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: typeof window !== 'undefined' ? createStorageAdapter() : undefined,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})


