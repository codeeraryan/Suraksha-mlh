import { StyleSheet, Text, View, TouchableOpacity, Image, ActivityIndicator, ScrollView } from 'react-native';
import React, { useContext, useEffect, useState } from 'react';
import { colors } from '../colors';
import { SecurityContext } from '../context/securityContext';
import { firebaseAuth } from '../../firebase';
import { useAuth } from '../context/AuthContext';

const ProfileScreen = ({ navigation }) => {
  const { contacts, connectedDevice, disconnectDevice } = useContext(SecurityContext);
  const { signOut, isLoggingOut, fetchUserData, isLoadingData, userData } = useAuth();
  const user = firebaseAuth.currentUser;
  console.log(user.email);

  useEffect(() => {

    if (user?.uid) {
      fetchUserData(user.uid);

    }
  }
    , [user?.uid]);



  if (isLoadingData && !userData) {
    return (
      <View style={[styles.mainContainer, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#00FFAA" />
      </View>
    );
  }
  return (
    <View style={styles.mainContainer}>

      {/* HEADER */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>Profile</Text>
      </View>
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} >
        {/* PROFILE CARD  */}
        <View style={styles.profileCard}>
          <Image
            source={{ uri: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png' }}
            style={styles.avatar}
          />
          <Text style={styles.name}>{userData?.name}</Text>
          <Text style={{ color: 'gray' }}>{userData?.mobile}</Text>
          <Text style={{ color: 'gray' }}>{user?.email}</Text>
          <Text style={styles.subText}>Stay Safe 💙</Text>
        </View>

        {/* CONTACT CARD */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>👥 Emergency Contacts</Text>
          <Text style={styles.cardValue}>{contacts.length} Added</Text>

          <TouchableOpacity
            style={styles.smallBtn}
            onPress={() => navigation.navigate('Contacts')}
          >
            <Text style={styles.smallBtnText}>Manage Contacts</Text>
          </TouchableOpacity>
        </View>

        {/* BLUETOOTH CARD */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📡 Bluetooth Device</Text>
          <Text style={styles.cardValue}>
            {connectedDevice
              ? `Connected to ${connectedDevice.name}`
              : 'No device connected'}
          </Text>

          {connectedDevice ? (
            <TouchableOpacity
              style={styles.disconnectBtn}
              onPress={disconnectDevice}
            >
              <Text style={styles.btnText}>Disconnect</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.smallBtn}
              onPress={() => navigation.navigate('Bluetooth')}
            >
              <Text style={styles.smallBtnText}>Connect Device</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* SAFETY STATUS */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🛡 Safety Status</Text>
          <Text style={styles.cardValue}>All systems ready</Text>
        </View>

        {/* LOGOUT */}
        <TouchableOpacity
          disabled={isLoggingOut}
          style={styles.logoutBtn}
          onPress={() => signOut()}
        >
          {isLoggingOut ? <ActivityIndicator size={'small'} color={"black"} /> : <Text style={styles.btnText}>Logout</Text>}
        </TouchableOpacity>

      </ScrollView>

    </View>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  mainContainer: {
    backgroundColor: colors.background_color,
    flex: 1,
    paddingTop: 10,
    paddingBottom: 100,
  },

  /* HEADER */
  headerContainer: {
    marginTop: 20,
    marginHorizontal: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#00FFAA",
    alignItems: "center",
  },

  headerText: {
    fontSize: 20,
    color: "#fff",
    fontWeight: "bold",
    marginBottom: 8,
  },

  /* AUTH UI */
  authContainer: {
    marginTop: 80,
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  authTitle: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 10,
  },

  authSubtitle: {
    color: '#888',
    textAlign: 'center',
    marginBottom: 30,
  },

  loginBtn: {
    backgroundColor: '#00FFAA',
    padding: 14,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
    marginBottom: 15,
  },

  signupBtn: {
    backgroundColor: '#3D5AFE',
    padding: 14,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },

  authBtnText: {
    color: '#000',
    fontWeight: 'bold',
  },

  /* PROFILE */
  profileCard: {
    alignItems: 'center',
    marginTop: 25,
    marginBottom: 20,
  },

  /* Updated Styles */
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: '#00FFAA', // Matching your header
    marginBottom: 10,
  },
  card: {
    backgroundColor: 'rgba(30, 30, 30, 0.8)', // Glass effect
    marginHorizontal: 15,
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 0.2,
    borderColor: '#333',
  },

  name: {
    color: colors.primary_text,
    fontSize: 18,
    fontWeight: 'bold',
  },

  subText: {
    marginTop: 15,
    color: colors.secondary_text,
    fontSize: 14,
  },


  cardTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },

  cardValue: {
    color: '#B0B0B0',
    marginBottom: 10,
  },

  /* BUTTONS */
  smallBtn: {
    backgroundColor: '#00FFAA',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },

  smallBtnText: {
    color: '#000',
    fontWeight: 'bold',
  },

  disconnectBtn: {
    backgroundColor: '#FF3B30',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },

  logoutBtn: {
    backgroundColor: '#FF3B30',
    marginHorizontal: 15,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },

  btnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});