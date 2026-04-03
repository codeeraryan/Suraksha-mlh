import React, { createContext, useContext, useState } from 'react';
import { Alert } from 'react-native';
import { firebaseAuth, db } from '../../firebase'; // Ensure these are exported correctly in firebase.js

const AuthContext = createContext();

// 1. Change 'child' to 'children'
const AuthProvider = ({ children }) => {
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [isSigningUp, setIsSigningUp] = useState(false);
    const [userData, setUserData] = useState(null);
    const [isLoadingData, setIsLoadingData] = useState(false);

    const fetchUserData = async (uid) => {
        try {
            setIsLoadingData(true);
            const userDoc = await db.collection("users").doc(uid).get();

            if (userDoc.exists) {
                setUserData(userDoc.data());
                console.log("User Data:", userDoc.data());
            } else {
                console.log("No such document!");
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
        } finally {
            setIsLoadingData(false);
        }
    };

    const signUp = async (email, password, name, mobile) => {
        try {
            setIsSigningUp(true);
            const userCredential = await firebaseAuth.createUserWithEmailAndPassword(email, password);
            const userId = userCredential.user.uid;

            await db.collection("users").doc(userId).set({
                name,
                mobile,
                userId,
                createdAt: new Date().toISOString(),
            });

            Alert.alert("Success", "User registered successfully");
        } catch (error) {
            Alert.alert("Sign Up Error", error.message);
        } finally {
            setIsSigningUp(false);
        }
    };

    const signIn = async (email, password) => {
        try {
            setIsLoggingIn(true);
            await firebaseAuth.signInWithEmailAndPassword(email, password);
            // No need for success alert here usually, as App.js will switch screens automatically
        } catch (error) {
            Alert.alert("Login Error", error.message);
        } finally {
            setIsLoggingIn(false);
        }
    };

    const signOut = async () => {
        try {
            setIsLoggingOut(true);
            await firebaseAuth.signOut();
        } catch (error) {
            Alert.alert("Logout Error", error.message);
        } finally {
            setIsLoggingOut(false);
        }
    };

    return (
        <AuthContext.Provider value={{ signIn, signOut, signUp, isLoggingIn, isLoggingOut, isSigningUp, fetchUserData, isLoadingData, userData }}>
            {children}
        </AuthContext.Provider>
    );
};

// 2. Export a hook instead of a top-level variable
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};

export default AuthProvider;