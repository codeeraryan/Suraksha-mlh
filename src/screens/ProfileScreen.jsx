import { StyleSheet, Text, View, TouchableOpacity, Image, ActivityIndicator, ScrollView } from 'react-native';
import React, { useContext, useEffect, useState } from 'react';
import { colors } from '../colors';
import { SecurityContext } from '../context/securityContext';
import { firebaseAuth } from '../../firebase';
import { useAuth } from '../context/AuthContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

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
          <Text style={{ color: 'gray', marginTop: 4 }}>{userData?.mobile}</Text>
          <Text style={{ color: 'gray' }}>{user?.email}</Text>
          <Text style={styles.subText}>Stay Safe 💙</Text>
        </View>

        {/* FAKE CALL BUTTON */}
        <TouchableOpacity
          style={styles.fakeCallBtn}
          onPress={() => navigation.navigate('FakeCall')}
        >
          <Text style={styles.fakeCallBtnText}>📞 Get A Fake Call</Text>
        </TouchableOpacity>

        {/* CONTACT CARD */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Icon name="account-multiple-outline" size={24} color={colors.primary_text} />
            <Text style={styles.cardTitle}>Emergency Contacts</Text>
          </View>
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
          <View style={styles.cardHeader}>
            <Icon name="bluetooth" size={24} color={colors.primary_text} />
            <Text style={styles.cardTitle}>Bluetooth Device</Text>
          </View>
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
          <View style={styles.cardHeader}>
            <Icon name="shield-check-outline" size={24} color={colors.accent} />
            <Text style={styles.cardTitle}>Safety Status</Text>
          </View>
          <Text style={styles.cardValue}>All systems ready</Text>
        </View>

        {/* LOGOUT */}
        <TouchableOpacity
          disabled={isLoggingOut}
          style={styles.logoutBtn}
          onPress={() => signOut()}
        >
          {isLoggingOut ? (
            <ActivityIndicator size={'small'} color={"black"} />
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Icon name="logout" size={20} color={colors.primary_text} style={{ marginRight: 8 }} />
              <Text style={styles.btnText}>Logout</Text>
            </View>
          )}
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
    marginHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.card_border,
    alignItems: "center",
    paddingBottom: 10,
  },

  headerText: {
    fontSize: 22,
    color: colors.primary_text,
    fontWeight: "800",
    letterSpacing: 0.5,
  },

  /* PROFILE */
  profileCard: {
    alignItems: 'center',
    marginTop: 30,
    marginBottom: 25,
  },

  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: colors.accent,
    marginBottom: 15,
  },

  card: {
    backgroundColor: colors.card,
    marginHorizontal: 15,
    padding: 18,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.card_border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },

  name: {
    color: colors.primary_text,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  subText: {
    marginTop: 15,
    color: colors.accent,
    fontSize: 15,
    fontWeight: '700',
  },

  cardTitle: {
    color: colors.primary_text,
    fontSize: 16,
    fontWeight: '800',
    marginLeft: 10,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  fakeCallBtn: {
    backgroundColor: colors.accent,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
    marginHorizontal: 15,
    marginVertical: 15,
  },
  fakeCallBtnText: {
    color: '#000000',
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  cardValue: {
    color: colors.secondary_text,
    marginBottom: 15,
    fontSize: 15,
  },

  /* BUTTONS */
  smallBtn: {
    backgroundColor: colors.accent,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },

  smallBtnText: {
    color: '#000000',
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  disconnectBtn: {
    backgroundColor: colors.danger,
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: colors.danger,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },

  logoutBtn: {
    backgroundColor: colors.input_bg,
    borderWidth: 1,
    borderColor: colors.card_border,
    marginHorizontal: 15,
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 15,
  },

  btnText: {
    color: colors.primary_text,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
