import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types/database'
import { AuthContext, type AuthContextValue, type AuthResult } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [sessionReady, setSessionReady] = useState(false)
  const [profileReady, setProfileReady] = useState(false)

  // Restore any persisted session, then keep it in sync with Supabase.
  useEffect(() => {
    let active = true

    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      setSessionReady(true)
    })

    // Only synchronous state updates belong in this callback -- awaiting a
    // Supabase call inside it can deadlock the auth client. The profile fetch
    // therefore lives in its own effect keyed on the user id.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setSessionReady(true)
    });

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  const userId = session?.user.id ?? null

  // Load the profiles row (and therefore the role) for the current user.
  useEffect(() => {
    if (userId === null) {
      setProfile(null)
      setProfileReady(true)
      return
    }

    let active = true
    setProfileReady(false)

    void supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle<Profile>()
      .then(({ data, error }) => {
        if (!active) return
        if (error) {
          console.error('Failed to load profile:', error.message)
        }
        setProfile(data ?? null)
        setProfileReady(true)
      })

    return () => {
      active = false
    }
  }, [userId])

  const signIn = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      return { error: error?.message ?? null }
    },
    [],
  )

  const signUp = useCallback(
    async (
      fullName: string,
      email: string,
      password: string,
    ): Promise<AuthResult> => {
      // full_name lands in raw_user_meta_data, where the handle_new_user
      // trigger picks it up. The role is set server-side and ignores anything
      // sent from here.
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      })
      return { error: error?.message ?? null }
    },
    [],
  )

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      profile,
      loading: !sessionReady || !profileReady,
      signIn,
      signUp,
      signOut,
    }),
    [session, profile, sessionReady, profileReady, signIn, signUp, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
