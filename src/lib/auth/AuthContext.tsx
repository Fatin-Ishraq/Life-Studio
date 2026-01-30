'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { onAuthChange, signOut as firebaseSignOutFn } from '@/lib/firebase/auth';
import { User } from '@/types/database';
import { supabase } from '@/lib/supabase/client';

interface AuthContextType {
    firebaseUser: FirebaseUser | null;
    supabaseUser: User | null;
    loading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    firebaseUser: null,
    supabaseUser: null,
    loading: true,
    signOut: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
    const [supabaseUser, setSupabaseUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const handleSignOut = async () => {
        await firebaseSignOutFn();
        setFirebaseUser(null);
        setSupabaseUser(null);
    };

    useEffect(() => {
        const unsubscribe = onAuthChange(async (user) => {
            setFirebaseUser(user);

            if (user) {
                // Fetch Supabase user data
                const { data } = await supabase
                    .from('users')
                    .select('*')
                    .eq('firebase_uid', user.uid)
                    .single();

                setSupabaseUser(data);
            } else {
                setSupabaseUser(null);
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ firebaseUser, supabaseUser, loading, signOut: handleSignOut }}>
            {children}
        </AuthContext.Provider>
    );
}

