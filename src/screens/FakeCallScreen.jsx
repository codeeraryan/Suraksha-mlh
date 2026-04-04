import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  StatusBar,
  Vibration,
  SafeAreaView,
} from 'react-native';
import { MotiView } from 'moti';
import { Easing } from 'react-native-reanimated';
import Tts from 'react-native-tts';
import { colors } from '../colors';

// ─── Guardian caller presets ──────────────────────────────
const CALLERS = [
  { name: 'Mom 💕', number: '+91 98765 43210', relation: 'Mother' },
  { name: 'Priya (Friend) 👯', number: '+91 91234 56789', relation: 'Friend' },
  { name: 'Rahul (Brother) 💪', number: '+91 87654 32109', relation: 'Brother' },
];

// ─── Guardian voice messages (TTS "recorded voice") ───────
// Dynamic messages based on guardian relation
const getGuardianScript = (relation = 'Father') => {
  const relationName = relation || 'Father';
  const scripts = {
    Father: [
      'Beta, I got your emergency alert. Are you safe? Tell me what happened.',
      'Do not worry, I am coming to you right now. Stay where you are and keep calm.',
      'Police and ambulance are also on the way. Just stay safe and keep me updated.',
      'You are not alone. I am almost there. Please keep this phone line open.',
    ],
    Mother: [
      'Beta, I got your SOS. Are you okay? Where are you right now?',
      'Don\'t worry my dear, I am on my way. Stay safe and keep calm.',
      'I have called the authorities. Just stay where you are and keep talking to me.',
      'You are my priority. I\'ll reach you soon. Keep this call active.',
    ],
    Brother: [
      'Hey, I got your alert. What\'s wrong? Are you in danger?',
      'Stay calm! I\'m heading to you right now. Don\'t go anywhere.',
      'I\'ve alerted the authorities too. Just hang in there.',
      'I\'m almost there buddy. Keep the line open and stay safe.',
    ],
    Friend: [
      'Hey! I got your SOS. Where are you? What\'s happening?',
      'I\'m coming to you immediately! Just stay safe and keep calm.',
      'I\'ve called emergency services too. Hold on!',
      'I\'m on my way! Keep this call going.',
    ],
  };
  return scripts[relationName] || scripts['Father'];
};

// TTS parameters based on gender/relation to mimic different voices
const getVoiceParams = (relation = 'Father') => {
  const params = {
    Father: { rate: 0.42, pitch: 0.95 },      // Deeper voice, slightly slower
    Mother: { rate: 0.46, pitch: 1.15 },      // Slightly higher, normal speed
    Brother: { rate: 0.45, pitch: 1.05 },     // Medium voice
    Friend: { rate: 0.48, pitch: 1.10 },      // Lighter, faster
  };
  return params[relation] || params['Father'];
};

const FakeCallScreen = ({ navigation, route }) => {
  const fromSOS = route?.params?.fromSOS ?? false;
  const guardianContact = route?.params?.guardianContact ?? null;
  
  // If no guardian contact passed, use Father as default
  const caller = guardianContact || { 
    name: 'Father 💪', 
    number: '+91 XXXXXXXXXX', 
    relation: 'Father' 
  };
  
  // Get the appropriate guardian script and voice parameters
  const GUARDIAN_SCRIPT = getGuardianScript(caller.relation || 'Father');
  const voiceParams = getVoiceParams(caller.relation || 'Father');

  const [phase, setPhase] = useState(fromSOS ? 'ringing' : 'ringing'); // ringing | active | ended
  const [callDuration, setCallDuration] = useState(0);
  const [scriptIndex, setScriptIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const ringAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef(null);
  const scriptTimerRef = useRef(null);
  const ringLoopRef = useRef(null);

  // ─── On mount: always start ringing ─────────────────────
  useEffect(() => {
    console.log(`📞 FakeCallScreen mounted - fromSOS: ${fromSOS}, guardian: ${caller.relation}`);
    startRinging();
    let autoTimer = null;

    if (fromSOS) {
      // Auto-answer after 3 seconds when triggered by SOS for faster guardian connection
      autoTimer = setTimeout(() => {
        console.log('⏱️ Auto-answering FakeCall after SOS...');
        stopEverything(); // stop ring/vibrate
        setPhase('active');
      }, 3000);
    }

    // Always cleanup on unmount
    return () => {
      if (autoTimer) clearTimeout(autoTimer);
      stopEverything();
      console.log('🧹 FakeCallScreen unmounted');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Call duration counter ───────────────────────────────
  useEffect(() => {
    if (phase === 'active') {
      timerRef.current = setInterval(() => {
        setCallDuration(d => d + 1);
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  // ─── Guardian voice: play script lines sequentially ─────
  useEffect(() => {
    if (phase !== 'active' || !fromSOS) return;

    // Setup TTS listeners
    Tts.addEventListener('tts-finish', onTtsFinish);

    // Small delay before first line
    const startDelay = setTimeout(() => {
      playNextLine(0);
    }, 1200);

    return () => {
      clearTimeout(startDelay);
      if (scriptTimerRef.current) clearTimeout(scriptTimerRef.current);
      Tts.removeEventListener('tts-finish', onTtsFinish);
      Tts.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const onTtsFinish = () => {
    setIsSpeaking(false);
    // Pause 2.5s between lines then play next
    scriptTimerRef.current = setTimeout(() => {
      setScriptIndex(prev => {
        const next = prev + 1;
        if (next < GUARDIAN_SCRIPT.length) {
          playNextLine(next);
        }
        return next;
      });
    }, 2500);
  };

  const playNextLine = (index) => {
    if (index >= GUARDIAN_SCRIPT.length) return;
    setIsSpeaking(true);
    Tts.stop();
    Tts.setDefaultLanguage('en-US');
    // Use guardian-specific voice parameters
    Tts.setDefaultRate(voiceParams.rate);
    Tts.setDefaultPitch(voiceParams.pitch);
    console.log(`🔊 Playing guardian message (${caller.relation}):`, GUARDIAN_SCRIPT[index]);
    Tts.speak(GUARDIAN_SCRIPT[index]);
  };

  // ─── Ringing animation ───────────────────────────────────
  const startRinging = () => {
    // Device vibration pattern (simulate phone ring)
    Vibration.vibrate([0, 700, 500, 700, 500, 700], true);

    // Pulsing ring animation
    ringLoopRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(ringAnim, { toValue: 1, duration: 450, useNativeDriver: true }),
        Animated.timing(ringAnim, { toValue: 0.6, duration: 450, useNativeDriver: true }),
      ])
    );
    ringLoopRef.current.start();
  };

  const stopEverything = () => {
    try {
      Vibration.cancel();
      console.log('✓ Vibration stopped');
    } catch (e) {
      console.warn('Error stopping vibration:', e);
    }

    try {
      if (ringLoopRef.current) {
        ringLoopRef.current.stop();
        console.log('✓ Ring animation stopped');
      }
    } catch (e) {
      console.warn('Error stopping animation:', e);
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
      console.log('✓ Call duration timer cleared');
    }

    if (scriptTimerRef.current) {
      clearTimeout(scriptTimerRef.current);
      console.log('✓ Script timer cleared');
    }

    try {
      Tts.stop();
      console.log('✓ TTS stopped');
    } catch (e) {
      console.warn('Error stopping TTS:', e);
    }
  };

  // ─── Answer call (manual tap) ──────────────────────────
  const answerCall = () => {
    stopEverything();
    setPhase('active');
  };

  // ─── Decline / End call ──────────────────────────────────
  const endCall = () => {
    stopEverything();
    setPhase('ended');
    setTimeout(() => navigation.goBack(), 800);
  };

  const formatDuration = secs => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // ─── Render ──────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#060612" />

      {/* Background overlay */}
      <View style={styles.bg} />

      {/* SOS badge */}
      {fromSOS && (
        <View style={styles.sosBadge}>
          <Text style={styles.sosBadgeText}>🚨 SOS Triggered — Guardian Calling</Text>
        </View>
      )}

      {/* ── Avatar + Pulse Rings ── */}
      <View style={styles.avatarSection}>
        {phase === 'ringing' && [0, 1, 2].map(i => (
          <MotiView
            key={i}
            from={{ opacity: 0.6, scale: 1 }}
            animate={{ opacity: 0, scale: 2.4 }}
            transition={{
              type: 'timing',
              duration: 1800,
              easing: Easing.out(Easing.ease),
              delay: i * 550,
              loop: true,
              repeatReverse: false,
            }}
            style={[StyleSheet.absoluteFillObject, styles.pulseRing]}
          />
        ))}

        <Animated.View
          style={[
            styles.avatarCircle,
            phase === 'active' && styles.avatarCircleActive,
            { transform: [{ scale: phase === 'ringing' ? ringAnim.interpolate({ inputRange: [0.6, 1], outputRange: [1, 1.06] }) : 1 }] },
          ]}
        >
          <Text style={styles.avatarEmoji}>
            {phase === 'active' ? '📞' : '📵'}
          </Text>
        </Animated.View>
      </View>

      {/* ── Caller Info ── */}
      <View style={styles.callerInfo}>
        <Text style={styles.callerName}>{caller.name}</Text>
        <Text style={styles.callerNumber}>{caller.number}</Text>

        {phase === 'ringing' && (
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: 'timing', duration: 600, loop: true, repeatReverse: true }}
          >
            <Text style={styles.statusRinging}>📳  Incoming Call...</Text>
          </MotiView>
        )}

        {phase === 'active' && (
          <Text style={styles.statusActive}>🟢  {formatDuration(callDuration)}</Text>
        )}
      </View>

      {/* ── Active Call: Guardian Speaking UI ── */}
      {phase === 'active' && (
        <View style={styles.speakingSection}>
          <Text style={styles.speakingLabel}>
            {isSpeaking ? '🔊 Guardian is speaking...' : '🤫 Listening...'}
          </Text>

          {/* Wave bars animation when guardian speaks */}
          <View style={styles.waveBars}>
            {[5, 12, 20, 14, 8, 18, 10, 20, 6, 14, 8].map((h, i) => (
              <MotiView
                key={i}
                from={{ height: 4 }}
                animate={{ height: isSpeaking ? h + 8 : 4 }}
                transition={{
                  type: 'timing',
                  duration: isSpeaking ? 380 + i * 40 : 200,
                  easing: Easing.inOut(Easing.ease),
                  delay: isSpeaking ? i * 55 : 0,
                  loop: isSpeaking,
                  repeatReverse: isSpeaking,
                }}
                style={[styles.waveBar, { backgroundColor: isSpeaking ? '#34c759' : '#2A2A3A' }]}
              />
            ))}
          </View>

          {/* Current script line */}
          {fromSOS && scriptIndex < GUARDIAN_SCRIPT.length && (
            <View style={styles.scriptBubble}>
              <Text style={styles.scriptText}>
                "{GUARDIAN_SCRIPT[Math.min(scriptIndex, GUARDIAN_SCRIPT.length - 1)]}"
              </Text>
            </View>
          )}
        </View>
      )}

      {/* ── Action Buttons ── */}
      <View style={styles.actions}>
        {phase === 'ringing' && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.answerBtn]}
            onPress={answerCall}
            accessibilityLabel="Answer fake call"
          >
            <Text style={styles.actionIcon}>📞</Text>
            <Text style={styles.actionLabel}>Answer</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.actionBtn, styles.declineBtn]}
          onPress={endCall}
          accessibilityLabel="End or decline call"
        >
          <Text style={styles.actionIcon}>📵</Text>
          <Text style={styles.actionLabel}>{phase === 'active' ? 'End' : 'Decline'}</Text>
        </TouchableOpacity>
      </View>

      {/* ── In-Call Controls (visual) ── */}
      {phase === 'active' && (
        <View style={styles.controls}>
          {[
            { icon: '🔇', label: 'Mute' },
            { icon: '🔊', label: 'Speaker' },
            { icon: '⌨️', label: 'Keypad' },
          ].map(c => (
            <View key={c.label} style={styles.controlBtn}>
              <View style={styles.controlCircle}>
                <Text style={styles.controlIcon}>{c.icon}</Text>
              </View>
              <Text style={styles.controlLabel}>{c.label}</Text>
            </View>
          ))}
        </View>
      )}
    </SafeAreaView>
  );
};

// ─── Styles ──────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#060612',
    alignItems: 'center',
  },
  bg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#060612',
  },
  sosBadge: {
    marginTop: 16,
    backgroundColor: '#2D0F0F',
    borderWidth: 1,
    borderColor: '#FF4B4B',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
  },
  sosBadgeText: {
    color: '#FF4B4B',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  avatarSection: {
    marginTop: 64,
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1.5,
    borderColor: '#34c759',
    backgroundColor: 'transparent',
  },
  avatarCircle: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: '#0D1F0D',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#34c759',
    zIndex: 10,
    elevation: 8,
  },
  avatarCircleActive: {
    borderColor: '#00FFAA',
    backgroundColor: '#0D2E1A',
  },
  avatarEmoji: { fontSize: 52 },
  callerInfo: {
    marginTop: 26,
    alignItems: 'center',
    gap: 7,
  },
  callerName: {
    fontSize: 30,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  callerNumber: {
    fontSize: 15,
    color: '#8080A0',
    letterSpacing: 1.2,
  },
  statusRinging: {
    fontSize: 14,
    color: '#FFC845',
    fontWeight: '600',
    marginTop: 4,
  },
  statusActive: {
    fontSize: 15,
    color: '#34c759',
    fontWeight: '700',
    marginTop: 4,
  },
  speakingSection: {
    alignItems: 'center',
    marginTop: 36,
    paddingHorizontal: 24,
    gap: 16,
    width: '100%',
  },
  speakingLabel: {
    color: '#A0A0C0',
    fontSize: 13,
    fontWeight: '600',
  },
  waveBars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 44,
  },
  waveBar: {
    width: 4,
    borderRadius: 3,
  },
  scriptBubble: {
    backgroundColor: '#0D1A0D',
    borderWidth: 1,
    borderColor: '#1A3A1A',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 20,
  },
  scriptText: {
    color: '#90E0A0',
    fontSize: 13,
    lineHeight: 20,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  actions: {
    position: 'absolute',
    bottom: 110,
    flexDirection: 'row',
    gap: 55,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtn: {
    width: 74,
    height: 74,
    borderRadius: 37,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
  },
  answerBtn: {
    backgroundColor: '#0D3A18',
    borderWidth: 2.5,
    borderColor: '#34c759',
  },
  declineBtn: {
    backgroundColor: '#3A0D0D',
    borderWidth: 2.5,
    borderColor: '#FF4B4B',
  },
  actionIcon: { fontSize: 30 },
  actionLabel: {
    color: '#FFFFFF',
    fontSize: 11,
    marginTop: 4,
    fontWeight: '700',
  },
  controls: {
    position: 'absolute',
    bottom: 42,
    flexDirection: 'row',
    gap: 36,
  },
  controlBtn: { alignItems: 'center', gap: 6 },
  controlCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#12121E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A2A3E',
  },
  controlIcon: { fontSize: 22 },
  controlLabel: { color: '#606070', fontSize: 11, fontWeight: '600' },
});

export default FakeCallScreen;
