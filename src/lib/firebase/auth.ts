import {
    signInWithPopup,
    GoogleAuthProvider,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    User as FirebaseUser
} from 'firebase/auth';
import { auth } from './config';
import { supabase } from '../supabase/client';

// Google Sign-In
export const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
        const result = await signInWithPopup(auth, provider);
        await syncUserToSupabase(result.user);
        return result.user;
    } catch (error) {
        console.error('Google sign-in error:', error);
        throw error;
    }
};

// Email/Password Sign-In
export const signInWithEmail = async (email: string, password: string) => {
    try {
        const result = await signInWithEmailAndPassword(auth, email, password);
        await syncUserToSupabase(result.user);
        return result.user;
    } catch (error) {
        console.error('Email sign-in error:', error);
        throw error;
    }
};

// Email/Password Sign-Up
export const signUpWithEmail = async (email: string, password: string, displayName?: string) => {
    try {
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await syncUserToSupabase(result.user, displayName);
        return result.user;
    } catch (error) {
        console.error('Email sign-up error:', error);
        throw error;
    }
};

// Sign Out
export const signOut = async () => {
    try {
        await firebaseSignOut(auth);
    } catch (error) {
        console.error('Sign-out error:', error);
        throw error;
    }
};

// Sync Firebase user to Supabase
export const syncUserToSupabase = async (firebaseUser: FirebaseUser, displayName?: string) => {
    try {
        const { data: existingUser } = await supabase
            .from('users')
            .select('*')
            .eq('firebase_uid', firebaseUser.uid)
            .single();

        if (!existingUser) {
            // Create new user in Supabase
            const { error } = await supabase.from('users').insert({
                firebase_uid: firebaseUser.uid,
                email: firebaseUser.email!,
                display_name: displayName || firebaseUser.displayName,
                photo_url: firebaseUser.photoURL,
            });

            if (error) throw error;
        } else {
            // Update existing user
            const { error } = await supabase
                .from('users')
                .update({
                    email: firebaseUser.email!,
                    display_name: displayName || firebaseUser.displayName,
                    photo_url: firebaseUser.photoURL,
                    updated_at: new Date().toISOString(),
                })
                .eq('firebase_uid', firebaseUser.uid);

            if (error) throw error;
        }
    } catch (error) {
        console.error('User sync error:', error);
        throw error;
    }
};

// Auth state observer
export const onAuthChange = (callback: (user: FirebaseUser | null) => void) => {
    return onAuthStateChanged(auth, callback);
};
