import React, { useEffect, useState, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SecurityProvider } from './src/context/securityContext'
import { db, firebaseAuth } from './firebase'
import { Alert, Linking, Text, View } from 'react-native';
import AppStack from './src/navigation/AppStack'
import AuthStack from './src/navigation/AuthStack'
import AuthProvider from './src/context/AuthContext'


const App = () => {
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const sessionStartTime = useRef(new Date().toISOString()).current;
  const shownAlerts = useRef(new Set()).current;

  useEffect(() => {
    const user = firebaseAuth.currentUser;
    if (!user) return;

    const unsubscribe = db.collection('alerts')
      .where('toUserId', '==', user.uid)
      .where('status', '==', 'active')
      .onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {
          if (change.type === 'added') {
            const data = change.doc.data();
            const alertId = change.doc.id;

            // Only show alerts that are NEW in this session and haven't been shown yet
            if (data.timestamp && data.timestamp > sessionStartTime && !shownAlerts.has(alertId)) {
              shownAlerts.add(alertId);
              // Trigger a high-priority system alert or navigation
              Alert.alert(
                "🚨 EMERGENCY ALERT",
                `${data.fromUserName} is in danger! Do you want to see their location?`,
                [
                  { text: "Dismiss", style: "cancel" },
                  { text: "Track Location", onPress: () => Linking.openURL(data.locationLink) }
                ]
              );
            }
          }
        });
      });

    return () => unsubscribe();
  }, [user]);


  function onAuthStateChanged(user) {
    console.log("user: ", user);

    setUser(user);
    if (initializing) {
      setInitializing(false);
    }
  }

  useEffect(() => {
    if (firebaseAuth) {
      const subscriber = firebaseAuth.onAuthStateChanged(onAuthStateChanged);
      return subscriber; // unsubscribe on unmount
    }
  }, []);

  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: 'white' }}>
        <Text style={{ color: "black" }}>Loading...</Text>
      </View>
    );
  }

  return (
    <AuthProvider>
      <SecurityProvider>
        <NavigationContainer>
          {user ? <AppStack /> : <AuthStack />}
        </NavigationContainer>
      </SecurityProvider>
    </AuthProvider>

  );
};

export default App;