import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
} from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { authApi } from '@/api/auth.api'
import { supabase } from '@/api/supabase'
import type { LoginDto, RegisterDto, User } from '@/types/auth.types'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (credentials: LoginDto) => Promise<void>
  register: (payload: RegisterDto) => Promise<void>
  logout: () => Promise<void>
  loginWithGoogle: () => void
  refreshToken: () => Promise<void>
  refreshUser: () => Promise<void>
  setLoginAnimating: (v: boolean) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoginAnimating, setIsLoginAnimating] = useState(false)
  const isE2E = import.meta.env.VITE_E2E_BYPASS_AUTH === 'true'
  const queryClient = useQueryClient()

  const userRef = useRef(user)
  userRef.current = user

  const isLoginAnimatingRef = useRef(isLoginAnimating)
  isLoginAnimatingRef.current = isLoginAnimating

  useEffect(() => {
    let isMounted = true

    if (isE2E) {
      if (isMounted) {
        setUser({ id: 'e2e-user', email: 'e2e@routiq.test', name: 'E2E User' })
        setIsLoading(false)
      }
      return () => { isMounted = false }
    }

    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) {
          const u = await authApi.getMe()
          if (isMounted) {
            setUser(u)
          }
        } else {
          if (isMounted) {
            setUser(null)
          }
        }
      } catch {
        if (isMounted) {
          setUser(null)
          queryClient.clear()
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    initAuth()

    // Listen for subsequent changes on auth state
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'INITIAL_SESSION') {
          // Already handled by initAuth
          return
        }

        if (event === 'SIGNED_IN' && session?.user) {
          if (!userRef.current && !isLoginAnimatingRef.current) {
            setIsLoading(true)
          }
          try {
            const u = await authApi.getMe()
            if (isMounted) {
              setUser(u)
            }
          } catch {
            if (isMounted) {
              setUser(null)
              queryClient.clear()
            }
          } finally {
            if (isMounted) {
              setIsLoading(false)
            }
          }
        } else if (event === 'SIGNED_OUT') {
          if (isMounted) {
            setUser(null)
            queryClient.clear()
            setIsLoading(false)
          }
        }
      }
    )

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [isE2E, queryClient])

  const login = useCallback(async (credentials: LoginDto) => {
    await authApi.login(credentials)
  }, [])

  const register = useCallback(async (payload: RegisterDto) => {
    await authApi.register(payload)
  }, [])

  const logout = useCallback(async () => {
    setIsLoading(true)
    try {
      await authApi.logout()
      queryClient.clear()
    } finally {
      setIsLoading(false)
    }
  }, [queryClient])

  const refreshToken = useCallback(async () => Promise.resolve(), [])

  const refreshUser = useCallback(async () => {
    const updatedUser = await authApi.getMe().catch(() => {
      queryClient.clear()
      return null
    })
    setUser(updatedUser)
  }, [queryClient])

  const value: AuthContextType = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user) && !isLoginAnimating,
      isLoading,
      login,
      register,
      logout,
      loginWithGoogle: authApi.loginWithGoogle,
      refreshToken,
      refreshUser,
      setLoginAnimating: setIsLoginAnimating,
    }),
    [user, isLoading, isLoginAnimating, login, logout, register, refreshToken, refreshUser]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

