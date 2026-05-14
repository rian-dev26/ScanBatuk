import React, { createContext, useContext, useState, useEffect } from 'react';
import { User as AppUser } from '../types';
import { auth, db } from '../services/firebase';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider,
  signOut,
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          if (firebaseUser.isAnonymous) {
            setUser({
              id: firebaseUser.uid,
              email: 'guest@anonymous',
              name: 'Guest User',
              role: 'user'
            });
          } else {
            // Check if profile exists
            const userDocRef = doc(db, 'users', firebaseUser.uid);
            const userDocSnap = await getDoc(userDocRef);
            
            if (userDocSnap.exists()) {
              const userData = userDocSnap.data();
              // Upgrade to admin if email matches
              if (firebaseUser.email === 'rianandikasirait@gmail.com' && userData.role !== 'admin') {
                await updateDoc(userDocRef, { role: 'admin', updatedAt: serverTimestamp() });
                userData.role = 'admin';
              }
              setUser({ id: firebaseUser.uid, ...userData } as AppUser);
            } else {
              // Create user doc
              const newUserData = {
                email: firebaseUser.email || '',
                name: firebaseUser.displayName || 'User',
                role: firebaseUser.email === 'rianandikasirait@gmail.com' ? 'admin' : 'user',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
              };
              await setDoc(userDocRef, newUserData);
              setUser({ id: firebaseUser.uid, ...newUserData } as unknown as AppUser);
            }
          }
        } else {
          // If no user is logged in, silently sign in anonymously so they can use screening immediately!
          await signInAnonymously(auth);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    });
    
    return unsubscribe;
  }, []);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const loginWithEmail = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const registerWithEmail = async (email: string, pass: string, name: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    await updateProfile(userCredential.user, { displayName: name });
    
    // Perbarui dokumen Firestore untuk memastikan nama tersimpan dengan benar
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      name: name,
      updatedAt: serverTimestamp()
    }, { merge: true });

    // Paksa update state lokal agar nama di layar langsung berubah
    setUser((prev) => prev ? { ...prev, name: name } : null);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, loginWithEmail, registerWithEmail, resetPassword, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
