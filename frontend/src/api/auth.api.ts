import type { User as SupabaseUser } from '@supabase/supabase-js'
import { supabase } from '@/api/supabase'
import type { LoginDto, RegisterDto, User } from '@/types/auth.types'

const mapSupabaseUser = (user: SupabaseUser): User => ({
  id: user.id,
  email: user.email!,
  name: user.user_metadata?.name || '',
  avatarUrl: user.user_metadata?.avatar_url,
  createdAt: user.created_at,
})

export const authApi = {
  async login({ email, password }: LoginDto) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return { user: mapSupabaseUser(data.user) }
  },

  async register({ email, password, name }: RegisterDto) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name }
      }
    })
    if (error) throw error
    if (!data.user) throw new Error('Registration failed')
    return { user: mapSupabaseUser(data.user) }
  },

  async logout(): Promise<void> {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  async getMe(): Promise<User> {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    if (!user) throw new Error('No user found')
    return mapSupabaseUser(user)
  },

  loginWithGoogle(): void {
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin
      }
    })
  },
}
