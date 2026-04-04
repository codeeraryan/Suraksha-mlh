import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { SecurityContext } from '../context/securityContext';
import { colors } from '../colors/index.js'
import { useContext, useEffect, useRef, useState } from 'react';

const SOSScreen = ({ navigation }) => {
    const {
        connectedDevice,
        isSOSActive,
        setIsSOSActive,
        triggerSOS,
        sendLocation,
        isLocationLoading,
    } = useContext(SecurityContext);

    const [countdown, setCountdown] = useState(5);
    const fakeCallTimerRef = useRef(null);

    useEffect(() => {
        let timer;
        if (isSOSActive && countdown > 0) {
            timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
        } else if (countdown === 0) {
            navigation.navigate('Alert');
            setCountdown(5);
        }
        return () => clearInterval(timer);
    }, [isSOSActive, countdown]);

    // Cleanup fake call timer on unmount
    useEffect(() => {
        return () => {
            if (fakeCallTimerRef.current) clearTimeout(fakeCallTimerRef.current);
        };
    }, []);

    const handleSOSPress = () => {
        // 1. Send SOS alerts
        triggerSOS();

        // 2. Find father contact to pass to fake call, or use first contact
        let guardianContact = null;
        if (contacts && contacts.length > 0) {
            // Try to find father in contacts
            guardianContact = contacts.find(c => c.relation?.toLowerCase() === 'father' || c.name?.toLowerCase().includes('father'));
            // If no father, use first contact
            if (!guardianContact) {
                guardianContact = contacts[0];
            }
        }

        // 3. After 1.5 seconds, launch Fake Call screen with guardian voice
        fakeCallTimerRef.current = setTimeout(() => {
            navigation.navigate('FakeCall', { fromSOS: true, guardianContact });
        }, 1500);
    };

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
                style={[styles.sosButton, isSOSActive && styles.sosActive]}
                onPress={handleSOSPress}
                disabled={isSOSActive}
            >
                <Text style={styles.sosText}>{isSOSActive ? countdown : "SOS"}</Text>
            </TouchableOpacity>

            {isSOSActive ? (
                <TouchableOpacity onPress={() => { setIsSOSActive(false); setCountdown(5); }}>
                    <Text style={styles.cancelText}>CANCEL ALERT</Text>
                </TouchableOpacity>
            ) : (
                <View style={styles.msgContainer}>
                    <Text style={styles.msgText}>
                        Tap to send emergency alert to trusted contacts.
                    </Text>
                </View>
            )}

            {/* Location Share Button */}
            <TouchableOpacity
                onPress={() => sendLocation()}
                style={styles.shareLocationBtn}
                disabled={isLocationLoading}
            >
                {isLocationLoading ? (
                    <ActivityIndicator size="small" color="#00FFAA" />
                ) : (
                    <>
                        <Image source={require('../assets/redLocationIcon.png')} style={{ height: 20, width: 20 }} />
                        <Text style={styles.locationBtnText}>Share Location</Text>
                    </>
                )}
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background_color, alignItems: 'center', justifyContent: 'center' },
    header: { position: 'absolute', top: 50, right: 20 },
    btButton: { backgroundColor: colors.card, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10 },
    btStatus: { fontSize: 16, fontWeight: '600', color: colors.primary_text },
    sosButton: { width: 200, height: 200, borderRadius: 100, backgroundColor: '#ff4444', justifyContent: 'center', alignItems: 'center', elevation: 10 },
    sosActive: { backgroundColor: '#cc0000' },
    sosText: { color: '#fff', fontSize: 40, fontWeight: 'bold' },
    cancelText: { marginTop: 20, color: 'blue', fontWeight: 'bold' },
    msgContainer: { marginTop: 20, width: 250 },
    msgText: { textAlign: 'center', fontSize: 20, fontWeight: 'bold', color: colors.secondary_text },
    shareLocationBtn: { justifyContent: 'center', alignItems: 'center', backgroundColor: colors.card, position: 'absolute', bottom: 130, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, elevation: 10 },
    locationBtnText: { fontSize: 25, fontWeight: 'bold', color: colors.primary_text },
});

export default SOSScreen;