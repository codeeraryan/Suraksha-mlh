import React, { useContext, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import { SecurityContext } from '../context/securityContext';
import { colors } from '../colors';
import RNFS from 'react-native-fs';
import Sound from 'react-native-sound';

Sound.setCategory('Playback');

const AlertScreen = ({ navigation }) => {
  const { contacts, cancelSOS, isSOSActive, guardianAlert } = useContext(SecurityContext);
  const soundRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const playVoiceRecording = async () => {
    if (!guardianAlert?.audioData) {
      Alert.alert('No Recording', 'No voice recording available for this alert yet. It may still be uploading.');
      return;
    }

    // If already playing, stop it
    if (isPlaying && soundRef.current) {
      soundRef.current.stop();
      soundRef.current.release();
      soundRef.current = null;
      setIsPlaying(false);
      return;
    }

    try {
      console.log('Saving audio to temp file...');
      const path = `${RNFS.CachesDirectoryPath}/sos_playback.wav`;
      await RNFS.writeFile(path, guardianAlert.audioData, 'base64');
      console.log('Audio saved to:', path);

      setIsPlaying(true);
      const sound = new Sound(path, '', (error) => {
        if (error) {
          console.error('Sound load error:', error);
          Alert.alert('Playback Error', 'Could not play the voice recording.');
          setIsPlaying(false);
          return;
        }
        sound.play((success) => {
          console.log('Playback finished, success:', success);
          setIsPlaying(false);
          sound.release();
          soundRef.current = null;
        });
      });
      soundRef.current = sound;
    } catch (error) {
      console.error('Playback Error:', error);
      setIsPlaying(false);
      Alert.alert('Error', 'Could not play the recording.');
    }
  };

  return (
    <View style={styles.container}>

      {/* HEADER */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>Alert Status</Text>
      </View>

      <View style={styles.mainContainer}>

        {!isSOSActive ? (
          guardianAlert ? (
            // 🚨 INCOMING ALERT FROM CONTACT
            <View style={styles.guardianAlertContainer}>
              <Text style={styles.guardianHeader}>🚨 INCOMING ALERT</Text>

              <View style={styles.alertCard}>
                <Text style={styles.alertLabel}>From Contact:</Text>
                <Text style={styles.alertValue}>{guardianAlert.fromUserName}</Text>
              </View>

              <View style={styles.alertCard}>
                <Text style={styles.alertLabel}>Status:</Text>
                <Text style={[styles.alertValue, { color: '#FF3B30' }]}>
                  {guardianAlert.status.toUpperCase()}
                </Text>
              </View>

              <View style={styles.alertCard}>
                <Text style={styles.alertLabel}>Time:</Text>
                <Text style={styles.alertValue}>
                  {new Date(guardianAlert.timestamp).toLocaleString()}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.trackButton}
                onPress={() => Linking.openURL(guardianAlert.locationLink)}
              >
                <Text style={styles.trackButtonText}>📍 TRACK LIVE LOCATION</Text>
              </TouchableOpacity>

              {/* Voice Recording Button */}
              {guardianAlert.audioData && (
                <TouchableOpacity
                  style={[
                    styles.playButton,
                    isPlaying && styles.playButtonActive,
                  ]}
                  onPress={playVoiceRecording}
                >
                  <Text style={styles.playButtonText}>
                    {isPlaying ? '⏹ STOP PLAYBACK' : '🔊 PLAY VOICE RECORDING'}
                  </Text>
                </TouchableOpacity>
              )}

              <Text style={styles.helperText}>
                Please check on them immediately or contact emergency services.
              </Text>
            </View>
          ) : (
            // 🟢 NO ALERT STATE
            <View style={styles.noAlertContainer}>
              <Text style={styles.noAlertText}>
                🟢 You are safe. No alerts active.
              </Text>
            </View>
          )
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

  mainContainer: {
    paddingHorizontal: 20,
    paddingVertical: 25,
  },

  header: {
    color: colors.danger,
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 25,
    letterSpacing: 1,
  },

  statusContainer: {
    alignItems: 'center',
    marginBottom: 25,
  },

  pulseDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.danger,
    marginBottom: 12,
    shadowColor: colors.danger,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 10,
  },

  title: {
    color: colors.primary_text,
    fontSize: 24,
    fontWeight: '800',
  },

  subtitle: {
    color: colors.secondary_text,
    fontSize: 15,
    marginTop: 6,
    fontWeight: '500',
  },

  card: {
    backgroundColor: colors.card,
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

  cardTitle: {
    color: colors.primary_text,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 10,
  },

  cardText: {
    color: colors.secondary_text,
    fontSize: 15,
    lineHeight: 20,
  },

  contactItem: {
    color: colors.accent,
    fontSize: 15,
    marginBottom: 6,
    fontWeight: '600',
  },

  stopButton: {
    backgroundColor: colors.danger,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 30,
    shadowColor: colors.danger,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },

  stopButtonText: {
    color: '#000000',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 1,
  },

  noAlertContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 150,
  },

  noAlertText: {
    color: colors.secondary_text,
    fontSize: 18,
    textAlign: 'center',
    fontWeight: '500',
  },

  // GUARDIAN ALERT STYLES
  guardianAlertContainer: {
    marginTop: 5,
  },
  guardianHeader: {
    color: colors.danger,
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 30,
    letterSpacing: 1,
  },
  alertCard: {
    backgroundColor: colors.input_bg,
    padding: 20,
    borderRadius: 16,
    marginBottom: 14,
    borderLeftWidth: 5,
    borderLeftColor: colors.danger,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  alertLabel: {
    color: colors.secondary_text,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  alertValue: {
    color: colors.primary_text,
    fontSize: 19,
    fontWeight: '800',
  },
  trackButton: {
    backgroundColor: colors.danger,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 25,
    shadowColor: colors.danger,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  trackButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  playButton: {
    backgroundColor: colors.accent,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 15,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  playButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  playButtonActive: {
    backgroundColor: colors.warning,
    shadowColor: colors.warning,
  },
  playButtonPending: {
    backgroundColor: colors.input_bg,
    borderWidth: 1,
    borderColor: colors.card_border,
    elevation: 0,
    shadowOpacity: 0,
  },
  helperText: {
    color: colors.secondary_text,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 25,
    fontStyle: 'italic',
    lineHeight: 20,
  },
});
