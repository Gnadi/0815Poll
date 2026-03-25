import { createContext } from 'react'
import type { User as FirebaseUser } from 'firebase/auth'
import type { User } from '../types'

// This file contains ONLY the context definition — no Firebase runtime imports.
// Using `import type` means these are erased at build time and add zero bytes to any bundle.
// ThemeContext imports from here so it can read auth state without pulling in Firebase.

export interface AuthContextValue {
  user: FirebaseUser | null
  userProfile: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, displayName: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
