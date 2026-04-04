import React, { useState, useContext, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, Platform, Linking } from 'react-native';
import { SecurityContext } from '../context/securityContext';
import { colors } from '../colors';

const ScannerScreen = ({ navigation }) => {
    const [devices, setDevices] = useState([]);
    const { manager, connectDevice, connectedDevice, disconnectDevice } = useContext(SecurityContext);
    const [isScanning, setIsScanning] = useState(false);
    const [statusMsg, setStatusMsg] = useState('');

    useEffect(() => {
        const checkBluetoothState = async () => {
            const state = await manager.state();
            if (state === 'PoweredOff') {
                if (Platform.OS === 'android') {
                    Alert.alert(
                        'Bluetooth is Off',
                        'Please turn on Bluetooth to connect your device.',
                        [
                            { text: 'Cancel', style: 'cancel' },
                            {
                                text: 'Turn On',
                                onPress: () => {
                                    Linking.sendIntent('android.settings.BLUETOOTH_SETTINGS').catch(() => {
                                        manager.enable().catch(err => console.log('Bluetooth enable error:', err));
                                    });
                                }
                            }
                        ]
                    );
                } else {
                    Alert.alert(
                        'Bluetooth is Off',
                        'Please turn on Bluetooth in your device settings to connect your device.',
                        [{ text: 'OK' }]
                    );
                }
            }
        };

        checkBluetoothState();

        const subscription = manager.onStateChange((state) => {
            if (state === 'PoweredOff') {
                if (Platform.OS !== 'android') {
                    Alert.alert('Bluetooth is Off', 'Please turn on Bluetooth in your device settings.');
                }
            }
        }, true);

        return () => subscription.remove();
    }, [manager]);

    const startScan = () => {
        setDevices([]);
        setStatusMsg('Waiting for Bluetooth...');

        // Wait for BLE to be powered on before scanning
        const subscription = manager.onStateChange((state) => {
            console.log('[BLE] State:', state);
            if (state === 'PoweredOn') {
                subscription.remove();
                setStatusMsg('Scanning...');
                setIsScanning(true);

                manager.startDeviceScan(null, { allowDuplicates: false }, (error, device) => {
                    if (error) {
                        console.error('[BLE] Scan error:', error.message, error.errorCode);
                        setIsScanning(false);
                        setStatusMsg('');
                        Alert.alert(
                            'Scan Error',
                            `Code ${error.errorCode}: ${error.message}\n\nMake sure Bluetooth and Location permissions are granted.`,
                            [{ text: 'OK' }]
                        );
                        return;
                    }
                    if (device && device.name) {
                        setDevices((prev) => {
                            const exists = prev.find((d) => d.id === device.id);
                            return exists ? prev : [...prev, device];
                        });
                    }
                });

                // Stop scanning after 10 seconds
                setTimeout(() => {
                    manager.stopDeviceScan();
                    setIsScanning(false);
                    setStatusMsg('');
                }, 10000);
            } else if (state === 'PoweredOff') {
                subscription.remove();
                setStatusMsg('');
                Alert.alert(
                    'Bluetooth Off',
                    'Please turn on Bluetooth to scan for devices.',
                    [{ text: 'OK' }]
                );
            } else if (state === 'Unauthorized') {
                subscription.remove();
                setStatusMsg('');
                Alert.alert(
                    'Bluetooth Unauthorized',
                    'Bluetooth permission was denied. Please enable it in Settings.',
                    [{ text: 'OK' }]
                );
            }
        }, true); // true = emit current state immediately
    };

    const handleDevicePress = async (device) => {
        if (connectedDevice && connectedDevice.id === device.id) {
            disconnectDevice();
        } else {
            try {
                await connectDevice(device);
                navigation.navigate('MainTabs');
            } catch (e) {
                Alert.alert('Connection Error', e.message);
            }
        }
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={[styles.scanBtn, isScanning && styles.scanBtnActive]}
                onPress={startScan}
                disabled={isScanning}
            >
                <Text style={styles.btnText}>
                    {isScanning ? statusMsg || 'Scanning...' : 'Scan for Devices'}
                </Text>
            </TouchableOpacity>

            {devices.length === 0 && !isScanning && (
                <Text style={styles.hint}>No devices found. Press scan to search nearby Bluetooth devices.</Text>
            )}

            <FlatList
                data={devices}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={[styles.deviceItem, connectedDevice?.id === item.id && styles.connectedItem]}
                        onPress={() => handleDevicePress(item)}
                    >
                        <Text style={styles.deviceName}>{item.name}</Text>
                        <Text style={styles.deviceId}>{item.id}</Text>
                        <Text style={styles.deviceStatus}>
                            {connectedDevice?.id === item.id ? 'Connected (Tap to Disconnect)' : 'Tap to Connect'}
                        </Text>
                    </TouchableOpacity>
                )}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: colors.background_color, 
        paddingHorizontal: 20,
        paddingTop: 30,
    },
    scanBtn: { 
        backgroundColor: colors.accent, 
        padding: 18, 
        borderRadius: 14, 
        alignItems: 'center', 
        marginBottom: 25,
        shadowColor: colors.accent,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    scanBtnActive: { 
        backgroundColor: colors.warning,
        shadowColor: colors.warning,
    },
    btnText: { 
        color: '#000000', 
        fontWeight: '800',
        fontSize: 16,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    hint: { 
        textAlign: 'center', 
        color: colors.secondary_text, 
        marginTop: 60, 
        fontSize: 16,
        fontWeight: '500',
        lineHeight: 24,
    },
    deviceItem: { 
        backgroundColor: colors.card, 
        padding: 20, 
        borderRadius: 16, 
        marginBottom: 14, 
        borderWidth: 1,
        borderColor: colors.card_border,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 3,
    },
    connectedItem: { 
        borderColor: colors.accent, 
        borderWidth: 2,
        backgroundColor: "rgba(50, 215, 75, 0.05)",
    },
    deviceName: { 
        fontSize: 18, 
        fontWeight: '800',
        color: colors.primary_text,
        letterSpacing: 0.5,
    },
    deviceId: { 
        fontSize: 12, 
        color: colors.secondary_text, 
        marginTop: 4,
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    deviceStatus: { 
        fontSize: 14, 
        color: colors.accent, 
        marginTop: 10,
        fontWeight: '700',
    },
});

export default ScannerScreen;