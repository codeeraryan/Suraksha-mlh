import React, { useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SecurityContext } from '../context/securityContext';
import { colors } from '../colors';

const AlertScreen = ({ navigation }) => {
  const { contacts, cancelSOS, isSOSActive } = useContext(SecurityContext);

  return (
    <View style={styles.container}>

      {/* HEADER */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>Alert Status</Text>
      </View>

      <View style={styles.mainContainer}>

        {!isSOSActive ? (
          // 🟢 NO ALERT STATE
          <View style={styles.noAlertContainer}>
            <Text style={styles.noAlertText}>
              🟢 You are safe. No alerts active.
            </Text>
          </View>
        ) : (
          // 🔴 ACTIVE SOS UI
          <>
            <Text style={styles.header}>🚨 SOS ACTIVE</Text>

            <View style={styles.statusContainer}>
              <View style={styles.pulseDot} />
              <Text style={styles.title}>SOS Sent Successfully</Text>
              <Text style={styles.subtitle}>Help is on the way</Text>
            </View>

            {/* LOCATION */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>📍 Location</Text>
              <Text style={styles.cardText}>
                Your location has been shared with contacts
              </Text>
            </View>

            {/* CONTACTS */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>👥 Contacts Notified</Text>
              <FlatList
                data={contacts}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <Text style={styles.contactItem}>✔ {item.name}</Text>
                )}
              />
            </View>

            {/* LIVE TRACKING */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>⏱ Live Tracking</Text>
              <Text style={styles.cardText}>
                Updating location every few seconds...
              </Text>
            </View>

            {/* STOP SOS BUTTON */}
            <TouchableOpacity
              style={styles.stopButton}
              onPress={() => {
                cancelSOS();
                navigation.navigate('Home');
              }}
            >
              <Text style={styles.stopButtonText}>STOP SOS</Text>
            </TouchableOpacity>
          </>
        )}

      </View>
    </View>
  );
};

export default AlertScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background_color,
    paddingTop: 10,
  },

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

  mainContainer: {
    paddingHorizontal: 20,
    paddingVertical: 25,
  },

  header: {
    color: '#FF3B30',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },

  statusContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },

  pulseDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FF3B30',
    marginBottom: 10,
  },

  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
  },

  subtitle: {
    color: '#B0B0B0',
    fontSize: 14,
    marginTop: 5,
  },

  card: {
    backgroundColor: '#1E1E1E',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },

  cardTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },

  cardText: {
    color: '#B0B0B0',
    fontSize: 14,
  },

  contactItem: {
    color: '#4CAF50',
    fontSize: 14,
    marginBottom: 5,
  },

  stopButton: {
    backgroundColor: '#FF3B30',
    padding: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 25,
  },

  stopButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },

  noAlertContainer: {
    alignItems: 'center',
    marginTop: 120,
  },

  noAlertText: {
    color: colors.secondary_text,
    fontSize: 18,
    textAlign: 'center',
  },
});