import React, { useEffect, useRef, useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Animated,
    Vibration,
    StatusBar,
    Platform,
} from 'react-native';
import Sound from 'react-native-sound';

// On Android, audio files must live in android/app/src/main/res/raw/
// and be loaded with null as the base path.
const SOUND_BASE = Platform.OS === 'android' ? null : Sound.MAIN_BUNDLE;
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors } from '../colors';

// Enable playback in silence mode (iOS)
Sound.setCategory('Playback');

const FakeCallScreen = ({ navigation }) => {
    const [callState] = useState('ringing');

    const soundRef = useRef(null);
    const timerRef = useRef(null);

    // Pulse animation for the avatar ring
    const pulse1 = useRef(new Animated.Value(1)).current;
    const pulse2 = useRef(new Animated.Value(1)).current;
    const pulse3 = useRef(new Animated.Value(1)).current;
    const pulse1Opacity = useRef(new Animated.Value(0.5)).current;
    const pulse2Opacity = useRef(new Animated.Value(0.35)).current;
    const pulse3Opacity = useRef(new Animated.Value(0.2)).current;

    // Slide-up animation for buttons
    const buttonsSlide = useRef(new Animated.Value(120)).current;
    const contentFade = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Entrance animations
        Animated.parallel([
            Animated.timing(contentFade, { toValue: 1, duration: 600, useNativeDriver: true }),
            Animated.spring(buttonsSlide, { toValue: 0, tension: 60, friction: 10, useNativeDriver: true }),
        ]).start();

        startPulseAnimation();
        Vibration.vibrate([500, 1000, 500, 1000], true);

        // Load and play ringtone
        const sound = new Sound('ringtone.mp3', SOUND_BASE, (error) => {
            if (error) {
                console.warn('Ringtone load error:', error);
                return;
            }
            sound.setNumberOfLoops(-1);
            sound.setVolume(1.0);
            sound.play((success) => {
                if (!success) console.warn('Ringtone playback failed');
            });
        });
        soundRef.current = sound;

        return () => { stopEverything(); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const startPulseAnimation = () => {
        const createFullPulse = (scale, opacity, delay, initOpacity) =>
            Animated.loop(
                Animated.sequence([
                    Animated.delay(delay),
                    Animated.parallel([
                        Animated.timing(scale, { toValue: 2.2, duration: 2000, useNativeDriver: true }),
                        Animated.sequence([
                            Animated.timing(opacity, { toValue: initOpacity, duration: 0, useNativeDriver: true }),
                            Animated.timing(opacity, { toValue: 0, duration: 2000, useNativeDriver: true }),
                        ]),
                    ]),
                    Animated.timing(scale, { toValue: 1, duration: 0, useNativeDriver: true }),
                ])
            );

        createFullPulse(pulse1, pulse1Opacity, 0, 0.5).start();
        createFullPulse(pulse2, pulse2Opacity, 600, 0.35).start();
        createFullPulse(pulse3, pulse3Opacity, 1200, 0.2).start();
    };

    const stopEverything = () => {
        Vibration.cancel();
        if (soundRef.current) {
            const s = soundRef.current;
            soundRef.current = null;
            s.stop(() => s.release());
        }
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    const handleAccept = () => {
        stopEverything();
        navigation.replace('ActiveCall', {
            callerName: 'Dad',
            callerNumber: '+91 98765 43210',
        });
    };

    const handleReject = () => {
        stopEverything();
        navigation.goBack();
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000000" />

            {/* Background layers */}
            <View style={styles.backgroundTop} />
            <View style={styles.backgroundBottom} />

            <Animated.View style={[styles.content, { opacity: contentFade }]}>

                {/* ── Caller Info ─────────────────────────────── */}
                <View style={styles.callerSection}>
                    <Text style={styles.callStatusText}>Incoming Call</Text>

                    {/* Avatar with pulse rings */}
                    <View style={styles.avatarWrapper}>
                        <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulse1 }], opacity: pulse1Opacity }]} />
                        <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulse2 }], opacity: pulse2Opacity }]} />
                        <Animated.View style={[styles.pulseRing, { transform: [{ scale: pulse3 }], opacity: pulse3Opacity }]} />

                        <View style={styles.avatar}>
                            <MaterialIcons name="person" size={56} color="#32D74B" />
                        </View>
                    </View>

                    <Text style={styles.callerName}>Dad</Text>
                    <Text style={styles.callerNumber}>+91 98765 43210</Text>
                    <Text style={styles.ringingSubtext}>Mobile • India</Text>
                </View>

                {/* ── Action Buttons ──────────────────────────── */}
                <Animated.View style={[styles.buttonsSection, { transform: [{ translateY: buttonsSlide }] }]}>
                    <View style={styles.callButtons}>

                        {/* Reject */}
                        <View style={styles.btnCol}>
                            <TouchableOpacity style={[styles.callBtn, styles.rejectBtn]} onPress={handleReject} activeOpacity={0.75}>
                                <MaterialIcons name="call-end" size={34} color="#FFFFFF" />
                            </TouchableOpacity>
                            <Text style={styles.btnLabel}>Decline</Text>
                        </View>

                        {/* Accept */}
                        <View style={styles.btnCol}>
                            <TouchableOpacity style={[styles.callBtn, styles.acceptBtn]} onPress={handleAccept} activeOpacity={0.75}>
                                <MaterialIcons name="call" size={34} color="#FFFFFF" />
                            </TouchableOpacity>
                            <Text style={styles.btnLabel}>Accept</Text>
                        </View>

                    </View>
                </Animated.View>

            </Animated.View>
        </View>
    );
};

export default FakeCallScreen;

const AVATAR_SIZE = 110;
const PULSE_SIZE = AVATAR_SIZE + 20;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0D1117',
    },
    backgroundTop: {
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: '65%',
        backgroundColor: '#0E2A1A',
        opacity: 0.6,
    },
    backgroundBottom: {
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        height: '40%',
        backgroundColor: '#0A0A0C',
    },
    content: {
        flex: 1,
        justifyContent: 'space-between',
        paddingBottom: 60,
        paddingTop: 60,
    },

    // ── Caller Section ───────────────────────────────────
    callerSection: {
        alignItems: 'center',
        paddingTop: 40,
    },
    callStatusText: {
        fontSize: 14,
        color: '#6EE7A0',
        letterSpacing: 2,
        textTransform: 'uppercase',
        marginBottom: 40,
        fontWeight: '600',
    },
    avatarWrapper: {
        width: PULSE_SIZE,
        height: PULSE_SIZE,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 28,
    },
    pulseRing: {
        position: 'absolute',
        width: PULSE_SIZE,
        height: PULSE_SIZE,
        borderRadius: PULSE_SIZE / 2,
        backgroundColor: '#32D74B',
    },
    avatar: {
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
        borderRadius: AVATAR_SIZE / 2,
        backgroundColor: '#1A3A26',
        borderWidth: 3,
        borderColor: '#32D74B',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 12,
        shadowColor: '#32D74B',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 20,
    },
    callerName: {
        fontSize: 36,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 0.5,
        marginBottom: 8,
    },
    callerNumber: {
        fontSize: 16,
        color: '#8E8E93',
        letterSpacing: 1,
        marginBottom: 10,
    },
    ringingSubtext: {
        fontSize: 13,
        color: '#636366',
        marginTop: 4,
    },

    // ── Buttons Section ──────────────────────────────────
    buttonsSection: {
        paddingHorizontal: 40,
    },
    callButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    btnCol: {
        alignItems: 'center',
        gap: 12,
    },
    callBtn: {
        width: 76,
        height: 76,
        borderRadius: 38,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 10,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
    },
    acceptBtn: {
        backgroundColor: '#32D74B',
        shadowColor: '#32D74B',
    },
    rejectBtn: {
        backgroundColor: '#FF3B30',
        shadowColor: '#FF3B30',
    },
    btnLabel: {
        color: '#AAAAAA',
        fontSize: 13,
        fontWeight: '500',
        marginTop: 4,
    },
});