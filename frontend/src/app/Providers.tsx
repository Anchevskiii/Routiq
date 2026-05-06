import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
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

  const login = async (credentials: LoginDto) => {
    setIsLoading(true)
    try {
      await authApi.login(credentials)
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (payload: RegisterDto) => {
    setIsLoading(true)
    try {
      await authApi.register(payload)
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    setIsLoading(true)
    try {
      await authApi.logout()
    } finally {
      setIsLoading(false)
    }
  }

  const refreshToken = async () => Promise.resolve()

  const value: AuthContextType = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      register,
      logout,
      loginWithGoogle: authApi.loginWithGoogle,
      refreshToken,
    }),
    [user, isLoading, login, logout, register]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
