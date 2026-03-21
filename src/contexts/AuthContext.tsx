import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth'
import { auth } from '../lib/firebase'
import { createUserProfile, getUserProfile } from '../lib/firestore'
import type { User } from '../types'
import { Timestamp } from 'firebase/firestore'

interface AuthContextValue {
  user: FirebaseUser | null
  userProfile: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, displayName: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [userProfile, setUserProfile] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Handle the result when returning from Google redirect sign-in
    getRedirectResult(auth).then(async (result) => {
      if (result?.user) {
        const existing = await getUserProfile(result.user.uid)
        if (!existing) {
          const profile: Omit<User, 'id'> = {
            displayName: result.user.displayName || 'User',
            email: result.user.email || '',
            photoURL: result.user.photoURL || undefined,
            createdAt: Timestamp.now(),
          }
          await createUserProfile(result.user.uid, profile)
          setUserProfile({ id: result.user.uid, ...profile })
        }
      }
    }).catch(() => {
      // Redirect result errors are handled by onAuthStateChanged
    })

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        const profile = await getUserProfile(firebaseUser.uid)
        setUserProfile(profile)
      } else {
        setUserProfile(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password)
  }

  const signUp = async (email: string, password: string, displayName: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(cred.user, { displayName })
    const profile: Omit<User, 'id'> = {
      displayName,
      email,
      createdAt: Timestamp.now(),
    }
    await createUserProfile(cred.user.uid, profile)
    setUserProfile({ id: cred.user.uid, ...profile })
  }

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider()
    await signInWithRedirect(auth, provider)
  }

  const signOut = async () => {
    await firebaseSignOut(auth)
    setUser(null)
    setUserProfile(null)
  }

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, signIn, signUp, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
