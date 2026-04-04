import React, { useEffect, useRef, useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    Animated,
    StatusBar,
    Platform,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Sound from 'react-native-sound';

// On Android, audio files must live in android/app/src/main/res/raw/
// and be loaded with null as the base path.
const SOUND_BASE = Platform.OS === 'android' ? null : Sound.MAIN_BUNDLE;

// ── Icon helpers (vector-based) ──────────────────────────
const ACTIONS = [
    { id: 'mute', icon: 'mic', label: 'Mute', activeIcon: 'mic-off', activeLabel: 'Unmute' },
    { id: 'keypad', icon: 'dialpad', label: 'Keypad', activeIcon: 'dialpad', activeLabel: 'Keypad' },
    { id: 'speaker', icon: 'volume-up', label: 'Speaker', activeIcon: 'volume-up', activeLabel: 'Speaker' },
    { id: 'add', icon: 'person-add', label: 'Add Call', activeIcon: 'person-add', activeLabel: 'Add Call' },
    { id: 'hold', icon: 'pause', label: 'Hold', activeIcon: 'play-arrow', activeLabel: 'Resume' },
    { id: 'record', icon: 'fiber-manual-record', label: 'Record', activeIcon: 'stop', activeLabel: 'Stop Rec' },
];

const ActiveCallScreen = ({ navigation, route }) => {
    const { callerName = 'Dad', callerNumber = '+91 98765 43210' } = route?.params ?? {};

    const [elapsed, setElapsed] = useState(0);
    const [active, setActive] = useState({});      // tracks toggle state
    const soundRef = useRef(null);

    // Entrance animations
    const headerFade = useRef(new Animated.Value(0)).current;
    const gridSlide = useRef(new Animated.Value(80)).current;
    const endBtnScale = useRef(new Animated.Value(0.6)).current;

    // Subtle breathing glow on end button
    const glow = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Entrance
        Animated.parallel([
            Animated.timing(headerFade, { toValue: 1, duration: 500, useNativeDriver: true }),
            Animated.spring(gridSlide, { toValue: 0, tension: 55, friction: 9, useNativeDriver: true }),
            Animated.spring(endBtnScale, { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
        ]).start();

        // Breathing glow loop
        Animated.loop(
            Animated.sequence([
                Animated.timing(glow, { toValue: 1.15, duration: 900, useNativeDriver: true }),
                Animated.timing(glow, { toValue: 1.0, duration: 900, useNativeDriver: true }),
            ])
        ).start();

        // Call timer
        const timer = setInterval(() => setElapsed(s => s + 1), 1000);

        // Play fake call audio
        const sound = new Sound('fakecall2.mp3', SOUND_BASE, (error) => {
            if (error) {
                console.warn('Fakecall audio load error:', error);
                return;
            }
            sound.setVolume(1.0);
            sound.play((success) => {
                if (!success) console.warn('Fakecall audio playback failed');
            });
        });
        soundRef.current = sound;

        return () => {
            clearInterval(timer);
            if (soundRef.current) {
                const s = soundRef.current;
                soundRef.current = null;
                s.stop(() => s.release());
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const formatTime = (secs) => {
        const h = Math.floor(secs / 3600);
        const m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0');
        const s = (secs % 60).toString().padStart(2, '0');
        return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
    };

    const toggleAction = (id) => {
        setActive(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleEndCall = () => {
        if (soundRef.current) {
            const s = soundRef.current;
            soundRef.current = null;
            s.stop(() => s.release());
        }
        navigation.popToTop();
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#060B14" />

            {/* ── Background layers ─────────────────────────────── */}
            <View style={styles.bgGradientTop} />
            <View style={styles.bgGradientBottom} />

            {/* ── Header / Caller Info ──────────────────────────── */}
            <Animated.View style={[styles.header, { opacity: headerFade }]}>
                <Text style={styles.callStatusLabel}>Active Call</Text>

                {/* Avatar */}
                <View style={styles.avatarRing}>
                    <View style={styles.avatar}>
                        <MaterialIcons name="person" size={48} color="#32D74B" />
                    </View>
                </View>

                <Text style={styles.callerName}>{callerName}</Text>
                <Text style={styles.callerNumber}>{callerNumber}</Text>
                <Text style={styles.timerText}>{formatTime(elapsed)}</Text>
            </Animated.View>

            {/* ── Action Grid ───────────────────────────────────── */}
            <Animated.View style={[styles.grid, { transform: [{ translateY: gridSlide }] }]}>
                {ACTIONS.map((action) => {
                    const isOn = !!active[action.id];
                    return (
                        <TouchableOpacity
                            key={action.id}
                            style={[styles.actionBtn, isOn && styles.actionBtnActive]}
                            onPress={() => toggleAction(action.id)}
                            activeOpacity={0.7}
                        >
                            <MaterialIcons
                                name={isOn ? action.activeIcon : action.icon}
                                size={28}
                                color={isOn ? "#32D74B" : "#FFFFFF"}
                            />
                            <Text style={[styles.actionLabel, isOn && styles.actionLabelActive]}>
                                {isOn ? action.activeLabel : action.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </Animated.View>

            {/* ── End Call Button ───────────────────────────────── */}
            <View style={styles.endRow}>
                <Animated.View style={{ transform: [{ scale: Animated.multiply(endBtnScale, glow) }] }}>
                    <TouchableOpacity
                        style={styles.endCallBtn}
                        onPress={handleEndCall}
                        activeOpacity={0.8}
                    >
                        <MaterialIcons name="call-end" size={38} color="#FFFFFF" />
                    </TouchableOpacity>
                </Animated.View>
                <Text style={styles.endCallLabel}>End Call</Text>
            </View>
        </View>
    );
};

export default ActiveCallScreen;

// ── Styles ────────────────────────────────────────────────────────────────────
const AVATAR_SIZE = 90;
const ACTION_SIZE = 72;
const END_BTN_SIZE = 80;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#060B14',
        alignItems: 'center',
    },

    // Background
    bgGradientTop: {
        position: 'absolute',
        top: 0, left: 0, right: 0,
        height: '55%',
        backgroundColor: '#071724',
        opacity: 0.9,
    },
    bgGradientBottom: {
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        height: '50%',
        backgroundColor: '#060B14',
    },

    // ── Header ──────────────────────────────────────────
    header: {
        alignItems: 'center',
        paddingTop: 56,
        paddingBottom: 28,
        width: '100%',
    },
    callStatusLabel: {
        fontSize: 12,
        color: '#32D74B',
        letterSpacing: 3,
        textTransform: 'uppercase',
        fontWeight: '700',
        marginBottom: 24,
    },
    avatarRing: {
        width: AVATAR_SIZE + 14,
        height: AVATAR_SIZE + 14,
        borderRadius: (AVATAR_SIZE + 14) / 2,
        borderWidth: 2,
        borderColor: '#1C4D2D',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        backgroundColor: '#0C1E14',
    },
    avatar: {
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
        borderRadius: AVATAR_SIZE / 2,
        backgroundColor: '#142B1C',
        alignItems: 'center',
        justifyContent: 'center',
    },
    callerName: {
        fontSize: 30,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 0.4,
        marginBottom: 6,
    },
    callerNumber: {
        fontSize: 14,
        color: '#636366',
        letterSpacing: 1,
        marginBottom: 12,
    },
    timerText: {
        fontSize: 20,
        color: '#32D74B',
        fontWeight: '600',
        letterSpacing: 3,
    },

    // ── Action Grid ──────────────────────────────────────
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        paddingHorizontal: 16,
        gap: 16,
        marginTop: 8,
        flex: 1,
        alignContent: 'flex-start',
    },
    actionBtn: {
        width: ACTION_SIZE,
        height: ACTION_SIZE,
        borderRadius: 20,
        backgroundColor: '#141C28',
        borderWidth: 1,
        borderColor: '#1E2D42',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 6,
    },
    actionBtnActive: {
        backgroundColor: '#0E2A1A',
        borderColor: '#32D74B',
    },
    actionLabel: {
        fontSize: 10,
        color: '#8E8E93',
        fontWeight: '500',
        textAlign: 'center',
    },
    actionLabelActive: {
        color: '#32D74B',
    },

    // ── End Call ─────────────────────────────────────────
    endRow: {
        alignItems: 'center',
        paddingBottom: 52,
        gap: 10,
    },
    endCallBtn: {
        width: END_BTN_SIZE,
        height: END_BTN_SIZE,
        borderRadius: END_BTN_SIZE / 2,
        backgroundColor: '#FF3B30',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 14,
        shadowColor: '#FF3B30',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.7,
        shadowRadius: 18,
    },
    endCallLabel: {
        color: '#FF3B30',
        fontSize: 13,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
});