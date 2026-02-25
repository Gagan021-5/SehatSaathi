import { createContext, useContext, useState, useEffect } from 'react';
import { auth, googleProvider } from '../config/firebase';
import {
    onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword,
    signInWithPopup, signInWithRedirect, getRedirectResult, signOut, sendPasswordResetEmail, updateProfile as fbUpdateProfile,
} from 'firebase/auth';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [firebaseUser, setFirebaseUser] = useState(null);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getRedirectResult(auth).catch(() => { });

        const unsub = onAuthStateChanged(auth, (fbUser) => {
            setFirebaseUser(fbUser);
            setLoading(false);

            if (fbUser) {
                // Do not block login UX on backend sync.
                (async () => {
                    try {
                        const token = await fbUser.getIdToken();
                        const res = await api.post('/auth/sync', {}, {
                            headers: { Authorization: `Bearer ${token}` },
                        });
                        setUser(res.data);
                    } catch {
                        setUser({ name: fbUser.displayName || '', email: fbUser.email });
                    }
                })();
            } else {
                setUser(null);
            }
        });
        return unsub;
    }, []);

    const login = (email, password) => signInWithEmailAndPassword(auth, email, password);

    const loginWithGoogle = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
            return 'popup';
        } catch (error) {
            if (
                error?.code === 'auth/popup-blocked' ||
                error?.code === 'auth/operation-not-supported-in-this-environment'
            ) {
                await signInWithRedirect(auth, googleProvider);
                return 'redirect';
            }
            throw error;
        }
    };

    const register = async (email, password, name) => {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        if (name) await fbUpdateProfile(cred.user, { displayName: name });
        return cred;
    };

    const logout = () => { signOut(auth); setUser(null); };

    const resetPassword = (email) => sendPasswordResetEmail(auth, email);

    const updateUserProfile = async (data) => {
        const res = await api.put('/auth/profile', data);
        setUser(res.data);
        return res.data;
    };

    return (
        <AuthContext.Provider value={{
            user, firebaseUser, loading, login, loginWithGoogle, register, logout, resetPassword, updateProfile: updateUserProfile,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be inside AuthProvider');
    return ctx;
};
