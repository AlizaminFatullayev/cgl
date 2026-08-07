import { createContext } from 'react'
import type { Session } from '@supabase/supabase-js'
import type { Profile } from '@/types/database'

/** Shape returned by the auth actions: null error means success. */
export interface AuthResult {
  error: string | null
}

export interface AuthContextValue {
  /** Current Supabase session, or null when signed out. */
  session: Session | null
  /** The signed-in user's profiles row, including their role. */
  profile: Profile | null
  /** True until both the session and (if any) the profile have resolved. */
  loading: boolean
  signIn: (email: string, password: string) => Promise<AuthResult>
  signUp: (
    fullName: string,
    email: string,
    password: string,
  ) => Promise<AuthResult>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(
  undefined,
)
