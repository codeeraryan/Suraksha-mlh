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
    container: { flex: 1, backgroundColor: colors.background_color, padding: 20 },
    scanBtn: { backgroundColor: '#007AFF', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 20 },
    scanBtnActive: { backgroundColor: '#5AA8FF' },
    btnText: { color: '#fff', fontWeight: 'bold' },
    hint: { textAlign: 'center', color: '#999', marginTop: 30, fontSize: 14 },
    deviceItem: { backgroundColor: '#fff', padding: 20, borderRadius: 10, marginBottom: 10, elevation: 2 },
    connectedItem: { borderColor: '#4CD964', borderWidth: 2 },
    deviceName: { fontSize: 16, fontWeight: 'bold' },
    deviceId: { fontSize: 10, color: '#aaa', marginTop: 2 },
    deviceStatus: { fontSize: 12, color: '#666', marginTop: 5 },
});

export default ScannerScreen;