import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
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
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      try {
        if (firebaseUser) {
          const profile = await getUserProfile(firebaseUser.uid)
          // Only update userProfile when a profile is found. If null is returned,
          // don't override — this prevents a race condition during sign-up where
          // onAuthStateChanged fires before the Firestore profile has been created.
          if (profile) {
            setUserProfile(profile)
          }
        } else {
          setUserProfile(null)
        }
      } catch {
        if (!firebaseUser) setUserProfile(null)
      } finally {
        setLoading(false)
      }
    })
    return unsub
  }, [])

  const signIn = async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    setUser(cred.user)
    const profile = await getUserProfile(cred.user.uid)
    if (profile) setUserProfile(profile)
  }

  const signUp = async (email: string, password: string, displayName: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    setUser(cred.user)
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
    const cred = await signInWithPopup(auth, provider)
    setUser(cred.user)
    const existing = await getUserProfile(cred.user.uid)
    if (!existing) {
      const profile: Omit<User, 'id'> = {
        displayName: cred.user.displayName || 'User',
        email: cred.user.email || '',
        photoURL: cred.user.photoURL || undefined,
        createdAt: Timestamp.now(),
      }
      await createUserProfile(cred.user.uid, profile)
      setUserProfile({ id: cred.user.uid, ...profile })
    } else {
      setUserProfile(existing)
    }
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
