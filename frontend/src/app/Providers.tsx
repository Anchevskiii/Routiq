import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
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

  useEffect(() => {
    // Check active session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        authApi.getMe().then(setUser).catch(() => setUser(null))
      } else {
        setUser(null)
      }
      setIsLoading(false)
    })

    // Listen for changes on auth state (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          authApi.getMe().then(setUser).catch(() => setUser(null))
        } else {
          setUser(null)
        }
        setIsLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const login = useCallback(async (credentials: LoginDto) => {
    setIsLoading(true)
    try {
      await authApi.login(credentials)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const register = useCallback(async (payload: RegisterDto) => {
    setIsLoading(true)
    try {
      await authApi.register(payload)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    setIsLoading(true)
    try {
      await authApi.logout()
    } finally {
      setIsLoading(false)
    }
  }, [])

  const refreshToken = useCallback(async () => Promise.resolve(), [])

  const refreshUser = useCallback(async () => {
    const updatedUser = await authApi.getMe().catch(() => null)
    setUser(updatedUser)
  }, [])

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
    [user, isLoading, isLoginAnimating, login, logout, register, refreshToken]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
