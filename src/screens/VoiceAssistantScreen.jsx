import React, { useState, useEffect, useRef, useContext, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  SafeAreaView,
  StatusBar,
  Alert,
  Vibration,
} from 'react-native';
import { MotiView } from 'moti';
import { Easing } from 'react-native-reanimated';
import Geolocation from '@react-native-community/geolocation';

import VoiceService from '../services/VoiceService';
import WaveAnimation from '../components/WaveAnimation';
import { SecurityContext } from '../context/securityContext';
import { colors } from '../colors';

// ─── Constants ────────────────────────────────────────────
const ACCENT = '#00FFAA';
const SOS_COLOR = '#FF4B4B';
const USER_BUBBLE = '#1C3A2E';
const AI_BUBBLE = '#1E1E2E';

const STATUS = {
  IDLE: 'idle',
  LISTENING: 'listening',
  PROCESSING: 'processing',
  SPEAKING: 'speaking',
  ERROR: 'error',
};

// ─────────────────────────────────────────────────────────
const VoiceAssistantScreen = ({ navigation }) => {
  const { triggerSOS, contacts } = useContext(SecurityContext);

  const [status, setStatus] = useState(STATUS.IDLE);
  const [messages, setMessages] = useState([
    {
      id: '0',
      sender: 'ai',
      text: "Hello! I'm Suraksha AI. 🛡️ How can I keep you safe today? You can say 'SOS', 'fake call', or ask me anything.",
    },
  ]);
  const [liveText, setLiveText] = useState('');
  const [language, setLanguage] = useState('en-US');
  const [location, setLocation] = useState(null);

  const scrollRef = useRef(null);
  const micPulse = useRef(new Animated.Value(1)).current;

  // ─── Get Location on Mount ──────────────────────────────
  useEffect(() => {
    Geolocation.getCurrentPosition(
      pos => setLocation(pos.coords),
      err => console.warn('Location error:', err),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // ─── Register Voice Callbacks ───────────────────────────
  useEffect(() => {
    VoiceService.setCallbacks({
      onSpeechStart: () => setStatus(STATUS.LISTENING),
      onSpeechEnd: () => {
        setStatus(STATUS.PROCESSING);
        setLiveText('');
      },
      onSpeechPartialResults: text => setLiveText(text),
      onSpeechResults: text => handleUserSpeech(text),
      onSpeechError: err => {
        console.warn('Speech error:', err);
        setStatus(STATUS.IDLE);
        setLiveText('');
      },
    });

    return () => VoiceService.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, contacts]);

  // ─── Auto-scroll messages ───────────────────────────────
  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  // ─── Mic Pulse Animation ────────────────────────────────
  useEffect(() => {
    if (status === STATUS.LISTENING) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(micPulse, { toValue: 1.12, duration: 600, useNativeDriver: true }),
          Animated.timing(micPulse, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      micPulse.stopAnimation();
      Animated.timing(micPulse, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    }
  }, [status, micPulse]);

  // ─── Add Message ────────────────────────────────────────
  const addMessage = useCallback((sender, text) => {
    setMessages(prev => [
      ...prev,
      { id: Date.now().toString(), sender, text },
    ]);
  }, []);

  // ─── Handle User Speech ─────────────────────────────────
  const handleUserSpeech = useCallback(
    async text => {
      if (!text || text.trim() === '') {
        setStatus(STATUS.IDLE);
        return;
      }

      addMessage('user', text);
      const intent = VoiceService.detectIntent(text);

      switch (intent) {
        case 'SOS':
          await handleSOS();
          break;
        case 'FAKE_CALL':
          handleFakeCall();
          break;
        case 'SAFETY_CHECK':
        case 'AI_QUERY':
        default:
          await handleAIQuery(text);
          break;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [location, contacts]
  );

  // ─── SOS Handler ────────────────────────────────────────
  const handleSOS = async () => {
    Vibration.vibrate([0, 400, 200, 400]);
    const reply = contacts.length > 0
      ? '🚨 SOS ACTIVATED! Sending emergency alert to your contacts. A guardian will call you right now — stay calm!'
      : '🚨 No emergency contacts saved. Please add contacts and try again. Stay safe!';

    addMessage('ai', reply);
    setStatus(STATUS.SPEAKING);
    VoiceService.speak(reply, language);

    if (contacts.length > 0) {
      // Trigger SOS alerts (SMS + Firebase)
      setTimeout(() => triggerSOS(), 500);
      // After 2s, launch the fake incoming guardian call
      setTimeout(() => {
        setStatus(STATUS.IDLE);
        navigation.navigate('FakeCall', { fromSOS: true });
      }, 2000);
    } else {
      setTimeout(() => setStatus(STATUS.IDLE), 3000);
    }
  };


  // ─── Fake Call Handler ──────────────────────────────────
  const handleFakeCall = () => {
    const reply = "Triggering a fake incoming call for you right now. Stay safe!";
    addMessage('ai', reply);
    setStatus(STATUS.SPEAKING);
    VoiceService.speak(reply, language);
    setTimeout(() => {
      setStatus(STATUS.IDLE);
      navigation.navigate('FakeCall');
    }, 1500);
  };

  // ─── AI Query Handler ───────────────────────────────────
  const handleAIQuery = async text => {
    setStatus(STATUS.PROCESSING);
    try {
      const reply = await VoiceService.askGemini(text, location);
      addMessage('ai', reply);
      setStatus(STATUS.SPEAKING);
      VoiceService.speak(reply, language);
      setTimeout(() => setStatus(STATUS.IDLE), 500);
    } catch (e) {
      const fallback = "I couldn't process that. Please try again.";
      addMessage('ai', fallback);
      VoiceService.speak(fallback, language);
      setStatus(STATUS.IDLE);
    }
  };

  // ─── Toggle Listening ───────────────────────────────────
  const handleMicPress = async () => {
    if (status === STATUS.LISTENING) {
      await VoiceService.stopListening();
      setStatus(STATUS.IDLE);
      setLiveText('');
      return;
    }
    if (status === STATUS.SPEAKING) {
      VoiceService.stopSpeaking();
    }
    try {
      await VoiceService.startListening(language);
    } catch (e) {
      Alert.alert('Microphone Error', e.message);
    }
  };

  // ─── Status Label ───────────────────────────────────────
  const getStatusLabel = () => {
    switch (status) {
      case STATUS.LISTENING: return '🎙️ Listening...';
      case STATUS.PROCESSING: return '⚡ Processing...';
      case STATUS.SPEAKING: return '🔊 Speaking...';
      default: return 'Tap mic to speak';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case STATUS.LISTENING: return ACCENT;
      case STATUS.PROCESSING: return '#FFC845';
      case STATUS.SPEAKING: return '#A78BFA';
      default: return colors.secondary_text;
    }
  };

  // ─── Render ─────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background_color} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Suraksha AI</Text>
          <Text style={[styles.headerSub, { color: getStatusColor() }]}>
            {getStatusLabel()}
          </Text>
        </View>
        {/* Language Toggle */}
        <TouchableOpacity
          style={styles.langToggle}
          onPress={() => setLanguage(l => (l === 'en-US' ? 'hi-IN' : 'en-US'))}
          accessibilityLabel="Toggle Language"
        >
          <Text style={styles.langText}>{language === 'en-US' ? '🇬🇧 EN' : '🇮🇳 HI'}</Text>
        </TouchableOpacity>
      </View>

      {/* ── Chat Messages ── */}
      <ScrollView
        ref={scrollRef}
        style={styles.chatContainer}
        contentContainerStyle={styles.chatContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map(msg => (
          <MotiView
            key={msg.id}
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 300 }}
            style={[
              styles.bubble,
              msg.sender === 'user' ? styles.userBubble : styles.aiBubble,
            ]}
          >
            {msg.sender === 'ai' && (
              <Text style={styles.bubbleSender}>🛡️ Suraksha AI</Text>
            )}
            <Text style={styles.bubbleText}>{msg.text}</Text>
          </MotiView>
        ))}

        {/* Live Transcription */}
        {liveText !== '' && (
          <View style={[styles.bubble, styles.userBubble, styles.liveBubble]}>
            <Text style={[styles.bubbleText, { color: ACCENT }]}>{liveText}</Text>
            <View style={styles.liveIndicator}>
              {[0, 1, 2].map(i => (
                <MotiView
                  key={i}
                  from={{ opacity: 0.3 }}
                  animate={{ opacity: 1 }}
                  transition={{ type: 'timing', duration: 400, delay: i * 150, loop: true, repeatReverse: true }}
                  style={styles.liveDot}
                />
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* ── Wave + Mic ── */}
      <View style={styles.micSection}>
        {/* Status animation */}
        <View style={styles.waveWrapper}>
          <WaveAnimation
            isListening={status === STATUS.LISTENING}
            isSpeaking={status === STATUS.SPEAKING}
            color={status === STATUS.SPEAKING ? '#A78BFA' : ACCENT}
          />
        </View>

        {/* Mic Button */}
        <Animated.View style={{ transform: [{ scale: micPulse }] }}>
          <TouchableOpacity
            style={[
              styles.micButton,
              status === STATUS.LISTENING && styles.micButtonActive,
              status === STATUS.PROCESSING && styles.micButtonProcessing,
            ]}
            onPress={handleMicPress}
            disabled={status === STATUS.PROCESSING}
            accessibilityLabel="Microphone Button"
          >
            <Text style={styles.micIcon}>
              {status === STATUS.PROCESSING ? '⏳' : status === STATUS.LISTENING ? '⏹' : '🎙️'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {/* SOS Quick Button */}
        <TouchableOpacity
          style={styles.quickSOS}
          onPress={handleSOS}
          accessibilityLabel="Quick SOS Button"
        >
          <Text style={styles.quickSOSText}>🚨 SOS</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// ─── Styles ──────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background_color,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A2E',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.primary_text,
    letterSpacing: 0.5,
  },
  headerSub: {
    fontSize: 13,
    marginTop: 2,
    fontWeight: '500',
  },
  langToggle: {
    backgroundColor: '#1E1E2E',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2A2A3E',
  },
  langText: {
    color: colors.primary_text,
    fontSize: 13,
    fontWeight: '600',
  },
  chatContainer: {
    flex: 1,
  },
  chatContent: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
    paddingBottom: 20,
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    elevation: 2,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: USER_BUBBLE,
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: AI_BUBBLE,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#2A2A3E',
  },
  liveBubble: {
    borderWidth: 1,
    borderColor: ACCENT,
    opacity: 0.85,
  },
  bubbleSender: {
    fontSize: 11,
    color: ACCENT,
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  bubbleText: {
    color: colors.primary_text,
    fontSize: 15,
    lineHeight: 22,
  },
  liveIndicator: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 6,
  },
  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: ACCENT,
  },
  micSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 110,
    paddingTop: 20,
    gap: 18,
    backgroundColor: colors.background_color,
    borderTopWidth: 1,
    borderTopColor: '#1A1A2E',
  },
  waveWrapper: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micButton: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: '#1E1E2E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: ACCENT,
    elevation: 8,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
  micButtonActive: {
    backgroundColor: '#0D2E1F',
    borderColor: ACCENT,
    shadowOpacity: 0.9,
  },
  micButtonProcessing: {
    borderColor: '#FFC845',
    shadowColor: '#FFC845',
  },
  micIcon: {
    fontSize: 30,
  },
  quickSOS: {
    backgroundColor: '#2D0F0F',
    borderWidth: 1.5,
    borderColor: SOS_COLOR,
    paddingHorizontal: 22,
    paddingVertical: 9,
    borderRadius: 24,
  },
  quickSOSText: {
    color: SOS_COLOR,
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.5,
  },
});

export default VoiceAssistantScreen;
