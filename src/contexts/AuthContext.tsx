import { useContext, useEffect, useState, type ReactNode } from 'react'
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
import { initFCM } from '../lib/fcm'
import type { User } from '../types'
import { Timestamp } from 'firebase/firestore'
import { AuthContext } from './AuthContextDef'

export { AuthContext }

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [userProfile, setUserProfile] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        const profile = await getUserProfile(firebaseUser.uid)
        setUserProfile(profile)
        initFCM(firebaseUser.uid) // request push permission + store token (no-op if not configured)
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
    const cred = await signInWithPopup(auth, provider)
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
