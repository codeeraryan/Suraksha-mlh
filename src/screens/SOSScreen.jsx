import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { SecurityContext } from '../context/securityContext';
import { colors } from '../colors/index.js'
import { useContext, useEffect, useState } from 'react';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const SOSScreen = ({ navigation }) => {
    const {
        connectedDevice,
        isSOSActive,
        setIsSOSActive,
        isSOSSending,
        sosRecordingCountdown,
        triggerSOS,
        cancelSOS,
        sendLocation,
        isLocationLoading
    } = useContext(SecurityContext);

    const [safetyTip, setSafetyTip] = useState('Loading safety tips...');
    const [isTipLoading, setIsTipLoading] = useState(true);

    const fallbackTips = [
        "Share live location with trusted contact",
        "Verify cab number before entering",
        "Avoid dark and isolated areas",
        "Keep emergency numbers on speed dial",
        "Use safety apps with SOS feature",
        "Stay alert in crowded places",
        "Avoid using phone while walking alone at night",
        "Carry a whistle or alarm device",
        "Inform family before traveling",
        "Trust your instincts in unsafe situations",
        "Sit near exit in public transport",
        "Avoid sharing personal details with strangers",
    ];

    const fetchSafetyTip = async () => {
        try {
            setIsTipLoading(true);
            const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=AIzaSyDCRxngdFMAypNO6XZN462ueCAK37ucOlA', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: "Give exactly 12 different women safety tips. Rules: One line each, Separated ONLY by commas, No numbering, No explanation"
                        }]
                    }]
                })
            });

            const data = await response.json();
            let tipsArray = data?.candidates?.[0]?.content?.parts?.[0]?.text
                ?.split(",")
                .map((t) => t.trim()) || [];

            // if Gemini gives less tips → add fallback
            if (tipsArray.length < 12) {
                tipsArray = [...tipsArray, ...fallbackTips].slice(0, 12);
            }

            // Pick a random tip from the 12
            const randomTip = tipsArray[Math.floor(Math.random() * tipsArray.length)];
            setSafetyTip(randomTip);

        } catch (error) {
            console.error("Gemini API Error:", error);
            // full fallback
            setSafetyTip(fallbackTips[Math.floor(Math.random() * fallbackTips.length)]);
        } finally {
            setIsTipLoading(false);
        }
    };

    useEffect(() => {
        fetchSafetyTip();
    }, []);

    useEffect(() => {
        if (isSOSActive) {
            navigation.navigate('Alert');
        }
    }, [isSOSActive, navigation]);

    return (
        <View style={styles.container}>
            {/* Top Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.btButton}
                    onPress={() => navigation.navigate('Bluetooth')}>
                    <Text style={styles.btStatus}>
                        {connectedDevice ? `🟢 ${connectedDevice.name}` : "🔴 Connect BT"}
                    </Text>
                </TouchableOpacity>
            </View>


            {/* SOS Button */}
            <TouchableOpacity
                style={[styles.sosButton, isSOSActive && styles.sosActive, isSOSSending && styles.sosSending]}
                onPress={triggerSOS}
                disabled={isSOSActive || isSOSSending}
            >
                {isSOSSending ? (
                    <View style={styles.recordingContainer}>
                        <ActivityIndicator size="large" color="#ffffff" />
                        <Text style={styles.recordingText}>Recording...</Text>
                        <Text style={styles.recordingCount}>{sosRecordingCountdown}s</Text>
                    </View>
                ) : (
                    <Text style={styles.sosText}>{isSOSActive ? "ACTIVE" : "SOS"}</Text>
                )}
            </TouchableOpacity>

            {isSOSActive || isSOSSending ? (
                <TouchableOpacity onPress={() => cancelSOS()}>
                    <Text style={styles.cancelText}>CANCEL ALERT</Text>
                </TouchableOpacity>
            ) : (
                <View style={styles.msgContainer}>
                    <Text style={styles.msgText}>
                        Tap to send emergency alert to trusted contacts.
                    </Text>
                </View>
            )}

            {/* Safety Tip Card */}
            {!isSOSActive && !isSOSSending && (
                <View style={styles.tipCard}>
                    <View style={styles.tipHeader}>
                        <Text style={styles.tipTitle}>🛡️ Safety Tip</Text>
                        <TouchableOpacity onPress={fetchSafetyTip}>
                            <Icon name="refresh" color="white" size={16} />
                        </TouchableOpacity>
                    </View>
                    {isTipLoading ? (
                        <ActivityIndicator size="small" color={colors.accent} style={{ marginTop: 10 }} />
                    ) : (
                        <Text style={styles.tipText}>"{safetyTip}"</Text>
                    )}
                </View>
            )}

            {/* location share button */}
            <TouchableOpacity
                onPress={() => { sendLocation() }}
                style={styles.shareLocationBtn}
                disabled={isLocationLoading}
            >
                {isLocationLoading ? (
                    <ActivityIndicator size="small" color="#00FFAA" />
                ) : (
                    <>
                        <Image source={require('../assets/redLocationIcon.png')} style={{ height: 20, width: 20, }} />
                        <Text style={styles.locationBtnText}>
                            Share Location
                        </Text>
                    </>
                )}
            </TouchableOpacity>

        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background_color,
        alignItems: 'center',
        justifyContent: 'center'
    },
    header: {
        position: 'absolute',
        top: 60,
        right: 25
    },
    btButton: {
        backgroundColor: colors.card,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.card_border
    },
    btStatus: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.primary_text,
    },
    sosButton: {
        width: 220,
        height: 220,
        borderRadius: 110,
        backgroundColor: colors.danger,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: colors.danger,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.6,
        shadowRadius: 20,
        elevation: 15,
    },
    sosActive: {
        backgroundColor: colors.danger_active,
        shadowColor: colors.danger_active,
    },
    sosSending: {
        backgroundColor: colors.warning,
        shadowColor: colors.warning,
    },
    sosText: {
        color: '#FFFFFF',
        fontSize: 48,
        fontWeight: '900',
        letterSpacing: 2
    },
    recordingContainer: {
        alignItems: 'center'
    },
    recordingText: {
        color: '#FFFFFF',
        fontSize: 16,
        marginTop: 8,
        fontWeight: '700'
    },
    recordingCount: {
        color: '#FFFFFF',
        fontSize: 28,
        marginTop: 5,
        fontWeight: '900'
    },
    cancelText: {
        marginTop: 35,
        color: colors.secondary_text,
        fontWeight: '700',
        fontSize: 16,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    msgContainer: {
        marginTop: 35,
        width: 280
    },
    msgText: {
        textAlign: 'center',
        fontSize: 15,
        fontWeight: '500',
        lineHeight: 22,
        color: colors.secondary_text
    },
    shareLocationBtn: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.card,
        position: 'absolute',
        bottom: 100,
        paddingHorizontal: 25,
        paddingVertical: 15,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 8
    },
    locationBtnText: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.primary_text,
        marginLeft: 10
    },
    tipCard: {
        backgroundColor: colors.card,
        width: '85%',
        padding: 20,
        borderRadius: 20,
        marginTop: 40,
        borderWidth: 1,
        borderColor: colors.card_border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    tipHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    tipTitle: {
        color: colors.accent,
        fontSize: 14,
        fontWeight: '800',
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    refreshIcon: {
        fontSize: 16,
        color: colors.secondary_text,
    },
    tipText: {
        color: colors.primary_text,
        fontSize: 15,
        fontWeight: '500',
        lineHeight: 22,
        fontStyle: 'italic',
    }
});

export default SOSScreen;