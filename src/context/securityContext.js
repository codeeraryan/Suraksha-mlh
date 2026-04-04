import React, { createContext, useState, useRef, useEffect } from 'react';
import { BleManager } from 'react-native-ble-plx';
import { PermissionsAndroid, Platform, Alert, Linking, NativeModules } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { db, firebaseAuth } from '../../firebase';

export const SecurityContext = createContext();
const manager = new BleManager();

export const SecurityProvider = ({ children }) => {
    const [connectedDevice, setConnectedDevice] = useState(null);
    const [isSOSActive, setIsSOSActive] = useState(false);
    const [contacts, setContacts] = useState([]);
    const [isLocationLoading, setIsLocationLoading] = useState(false);
    const subscriptionRef = useRef(null);
    const unsubscribeContactsRef = useRef(null);

    const BOAT_CHAR = 'fe2c1238-8366-4814-8eb0-01de32100bea';

    // ================= PERMISSIONS =================
    useEffect(() => {
        const requestPermissions = async () => {
            if (Platform.OS === 'android') {
                try {
                    const granted = await PermissionsAndroid.requestMultiple([
                        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
                        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
                        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
                        PermissionsAndroid.PERMISSIONS.SEND_SMS,
                    ]);

                    const allGranted =
                        granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED &&
                        granted[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED &&
                        granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] === PermissionsAndroid.RESULTS.GRANTED &&
                        granted[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] === PermissionsAndroid.RESULTS.GRANTED &&
                        granted[PermissionsAndroid.PERMISSIONS.SEND_SMS] === PermissionsAndroid.RESULTS.GRANTED;

                    if (!allGranted) {
                        Alert.alert(
                            "Permissions Needed",
                            "Please allow Location, Bluetooth, and SMS permissions for SOS to work properly."
                        );
                    }

                } catch (err) {
                    console.warn(err);
                }
            }
        };

        requestPermissions();
    }, []);

    // ================= REAL-TIME CONTACTS =================
    useEffect(() => {
        let unsubscribe = null;

        const setupContactListener = () => {
            if (firebaseAuth.currentUser?.uid) {
                console.log("Setting up real-time contact listener for:", firebaseAuth.currentUser.uid);
                unsubscribe = db.collection('users')
                    .doc(firebaseAuth.currentUser.uid)
                    .collection('emergency_contacts')
                    .onSnapshot(snapshot => {
                        const contactList = snapshot.docs.map(doc => ({
                            id: doc.id,
                            ...doc.data()
                        }));
                        console.log("Real-time Contacts Updated:", contactList.length);
                        setContacts(contactList);
                    }, error => {
                        console.error("Firestore Contact Listener Error:", error);
                    });
            } else {
                setContacts([]);
            }
        };

        // Initial setup
        setupContactListener();

        // Listen for auth changes to reset listener
        const authUnsubscribe = firebaseAuth.onAuthStateChanged((user) => {
            if (unsubscribe) unsubscribe();
            setupContactListener();
        });

        return () => {
            if (unsubscribe) unsubscribe();
            authUnsubscribe();
        };
    }, []);

    // ================= SOS FUNCTION =================
    const triggerSOS = async () => {
        if (contacts.length === 0) {
            Alert.alert("⚠️ No Contacts", "Please add emergency contacts first to enable SOS.");
            return;
        }

        // Don't trigger duplicate SOS if already active
        if (isSOSActive) {
            console.log("⚠️ SOS already active - ignoring duplicate trigger");
            return;
        }

        // Check permission again (safety)
        const hasLocation = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        const hasSms = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.SEND_SMS
        );

        if (!hasLocation || !hasSms) {
            Alert.alert(
                "⚠️ Permission Required",
                "Location and SMS permissions are needed for SOS to work properly.",
                [
                    { text: "Open Settings", onPress: () => Linking.openSettings() },
                    { text: "Cancel" }
                ]
            );
            return;
        }

        console.log('🚨 SOS TRIGGERED - Sending alerts to', contacts.length, 'contacts');
        setIsSOSActive(true);

        // Helper function to send SMS with retry
        const sendSmsWithRetry = async (phoneNumber, message, retries = 2) => {
            for (let i = 0; i < retries; i++) {
                try {
                    const result = await NativeModules.DirectSms.sendDirectSms(phoneNumber, message);
                    console.log(`✅ SMS sent to ${phoneNumber}:`, result);
                    return true;
                } catch (err) {
                    console.error(`❌ SMS attempt ${i + 1} failed for ${phoneNumber}:`, err);
                    if (i < retries - 1) {
                        // Wait 500ms before retry
                        await new Promise(resolve => setTimeout(resolve, 500));
                    }
                }
            }
            return false;
        };

        Geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    const locationLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
                    const message = `🚨 EMERGENCY: I need help!\n📍 My Location: ${locationLink}\n\nPlease check SurakshaApp for more details.`;

                    console.log('📍 Location obtained:', latitude, longitude);
                    let smsSentCount = 0;
                    let alertsSentCount = 0;

                    // Send alerts to each contact
                    for (const contact of contacts) {
                        try {
                            // --- CHANNEL 1: Direct SMS ---
                            if (contact.mobile) {
                                const smsSent = await sendSmsWithRetry(contact.mobile, message);
                                if (smsSent) smsSentCount++;
                            }

                            // --- CHANNEL 2: In-App Alert (Firebase) ---
                            if (contact.isAppUser && contact.linkedUid && firebaseAuth.currentUser?.uid) {
                                try {
                                    await db.collection('alerts').add({
                                        toUserId: contact.linkedUid,
                                        fromUserId: firebaseAuth.currentUser.uid,
                                        fromUserName: firebaseAuth.currentUser?.displayName || "User",
                                        fromUserPhone: firebaseAuth.currentUser?.phoneNumber || "",
                                        latitude,
                                        longitude,
                                        locationLink,
                                        status: 'active',
                                        timestamp: new Date().toISOString(),
                                    });
                                    console.log(`✅ In-app alert sent to ${contact.name}`);
                                    alertsSentCount++;
                                } catch (e) {
                                    console.error(`❌ Firebase alert error for ${contact.name}:`, e.message);
                                }
                            }
                        } catch (e) {
                            console.error(`❌ Error processing contact ${contact.name}:`, e);
                        }
                    }

                    console.log(`📊 SOS Alerts Sent - SMS: ${smsSentCount}, In-App: ${alertsSentCount}`);
                    Alert.alert(
                        "🚨 SOS Activated",
                        `Emergency alerts sent to ${smsSentCount} contacts via SMS and ${alertsSentCount} via app.`
                    );
                } catch (error) {
                    console.error('❌ Error in SOS with location:', error);
                    Alert.alert('Error', 'Failed to process SOS with location');
                }
            },

            async (error) => {
                try {
                    console.warn("📍 Location error:", error.message);
                    const message = `🚨 EMERGENCY: I need help! (Location unavailable)\n\nPlease visit SurakshaApp for more details.`;
                    let smsSentCount = 0;

                    // Still send alerts even if location failed
                    for (const contact of contacts) {
                        try {
                            if (contact.mobile) {
                                const smsSent = await sendSmsWithRetry(contact.mobile, message);
                                if (smsSent) smsSentCount++;
                            }
                        } catch (e) {
                            console.error(`❌ SMS error for ${contact.name}:`, e);
                        }
                    }

                    Alert.alert(
                        "⚠️ Location Issue",
                        `SOS sent to ${smsSentCount} contacts, but location couldn't be obtained.`
                    );
                } catch (error) {
                    console.error('❌ Error in SOS fallback:', error);
                    Alert.alert('Error', 'Failed to send SOS alerts');
                }
            },

            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 10000,
            }
        );
    };

    // ================= CANCEL SOS =================
    const cancelSOS = () => {
        setIsSOSActive(false);
        Alert.alert("Safe", "SOS stopped");
    };

    const sendLocation = async () => {
        try {
            setIsLocationLoading(true);
            
            if (contacts.length === 0) {
                Alert.alert("⚠️ No Contacts", "Please add emergency contacts first.");
                setIsLocationLoading(false);
                return;
            }

            // Check permission again (safety)
            const hasLocation = await PermissionsAndroid.check(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
            );
            const hasSms = await PermissionsAndroid.check(
                PermissionsAndroid.PERMISSIONS.SEND_SMS
            );

            if (!hasLocation || !hasSms) {
                Alert.alert(
                    "⚠️ Permission Required",
                    "Location and SMS permissions are needed to share location.",
                    [
                        { text: "Open Settings", onPress: () => Linking.openSettings() },
                        { text: "Cancel" }
                    ]
                );
                setIsLocationLoading(false);
                return;
            }

            console.log('📍 Sharing location with', contacts.length, 'contacts');

            Geolocation.getCurrentPosition(
                async (position) => {
                    try {
                        const { latitude, longitude } = position.coords;
                        const locationLink = `https://maps.google.com/?q=${latitude},${longitude}`;
                        const message = `📍 I'm sharing my live location for safety.\n\nView on Maps: ${locationLink}\n\nFor more details, check SurakshaApp.`;

                        console.log('📍 Location obtained:', latitude, longitude);
                        let smsSentCount = 0;

                        for (const contact of contacts) {
                            if (contact.mobile) {
                                try {
                                    const result = await NativeModules.DirectSms.sendDirectSms(contact.mobile, message);
                                    console.log(`✅ Location SMS sent to ${contact.name}:`, result);
                                    smsSentCount++;
                                } catch (err) {
                                    console.error(`❌ Failed to send location SMS to ${contact.name}:`, err);
                                }
                            }
                        }

                        setIsLocationLoading(false);
                        Alert.alert(
                            "✅ Location Shared",
                            `Your location has been sent to ${smsSentCount} contacts.`
                        );
                    } catch (error) {
                        console.error('❌ Error processing location:', error);
                        setIsLocationLoading(false);
                        Alert.alert('Error', 'Failed to share location');
                    }
                },

                (error) => {
                    console.warn("📍 Location error:", error.message);
                    setIsLocationLoading(false);
                    Alert.alert(
                        "⚠️ Location Failed",
                        "Unable to get your current location. Please enable location services and try again."
                    );
                },

                {
                    enableHighAccuracy: true,
                    timeout: 15000,
                    maximumAge: 10000,
                }
            );
        } catch (error) {
            console.error('❌ Error in sendLocation:', error);
            setIsLocationLoading(false);
            Alert.alert("Error", error.message || "Failed to share location");
        }
    };

    // ================= BLE MONITOR =================
    const monitorDevice = async (device) => {
        const services = await device.services();

        for (const service of services) {
            const characteristics = await service.characteristics();

            for (const char of characteristics) {
                if (char.isNotifiable || char.uuid.toLowerCase() === BOAT_CHAR) {
                    subscriptionRef.current = char.monitor((error, updatedChar) => {
                        if (updatedChar?.value) {
                            console.log("BLE SOS TRIGGERED");
                            triggerSOS(); // 🔥 hardware button triggers SOS
                        }
                    });
                }
            }
        }
    };

    // ================= CONNECT DEVICE =================
    const connectDevice = async (device) => {
        try {
            const connected = await device.connect();
            await connected.discoverAllServicesAndCharacteristics();

            setConnectedDevice(connected);
            monitorDevice(connected);

            Alert.alert("Connected", `Connected to ${device.name}`);
        } catch (error) {
            Alert.alert("Connection Failed", error.message);
        }
    };

    // ================= DISCONNECT =================
    const disconnectDevice = () => {
        if (subscriptionRef.current) {
            subscriptionRef.current.remove();
        }

        if (connectedDevice) {
            connectedDevice.cancelConnection();
            setConnectedDevice(null);
            Alert.alert("Disconnected");
        }
    };

    return (
        <SecurityContext.Provider
            value={{
                manager,
                connectedDevice,
                connectDevice,
                disconnectDevice,
                isSOSActive,
                setIsSOSActive,
                triggerSOS,
                cancelSOS,
                contacts,
                setContacts,
                sendLocation,
                isLocationLoading,
            }}
        >
            {children}
        </SecurityContext.Provider>
    );
};