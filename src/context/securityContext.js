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
            Alert.alert("No Contacts", "Please add emergency contacts first.");
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
                "Permission Required",
                "Please enable Location and SMS permissions to trigger SOS",
                [
                    { text: "Open Settings", onPress: () => Linking.openSettings() },
                    { text: "Cancel" }
                ]
            );
            return;
        }

        setIsSOSActive(true);

        Geolocation.getCurrentPosition(
            async (position) => { // Make this async to handle Firestore writes
                const { latitude, longitude } = position.coords;
                const locationLink = `https://www.google.com/maps?q=${latitude},${longitude}`;

                const message = `🚨 EMERGENCY: I need help!\nMy Location: ${locationLink}\nCheck SurakshaApp for details.`;

                // 1. Handle SMS and App Alerts for each contact
                for (const contact of contacts) {
                    // --- CHANNEL 1: Direct SMS ---
                    if (contact.mobile) {
                        NativeModules.DirectSms.sendDirectSms(contact.mobile, message)
                            .then(res => console.log(`SMS sent to ${contact.mobile}`))
                            .catch(err => console.error("SMS Error:", err));
                    }

                    // --- CHANNEL 2: In-App Alert (Firebase) ---
                    if (contact.isAppUser && contact.linkedUid) {
                        try {
                            await db.collection('alerts').add({
                                toUserId: contact.linkedUid,
                                fromUserId: firebaseAuth.currentUser.uid,
                                fromUserName: userData?.name || "User",
                                fromUserPhone: userData?.mobile || "",
                                latitude,
                                longitude,
                                locationLink,
                                status: 'active',
                                timestamp: new Date().toISOString(),
                            });
                            console.log(`In-app alert sent to ${contact.name}`);
                        } catch (e) {
                            console.error("Firestore Alert Error:", e);
                        }
                    }
                }

                Alert.alert("SOS Triggered", "SMS and App Alerts have been sent to your guardians.");
            },

            async (error) => {
                console.log("LOCATION ERROR:", error);

                // 🔥 fallback message if location fails
                const message = `🚨 I am in danger. Please help! (Location unavailable), for more details : visit our surakhaApp`;


                for (const contact of contacts) {
                    // --- CHANNEL 1: Direct SMS ---
                    if (contact.mobile) {
                        NativeModules.DirectSms.sendDirectSms(contact.mobile, message)
                            .then(res => console.log(`SMS sent to ${contact.mobile}`))
                            .catch(err => console.error("SMS Error:", err));
                    }

                    // --- CHANNEL 2: In-App Alert (Firebase) ---
                    if (contact.isAppUser && contact.linkedUid) {
                        try {
                            await db.collection('alerts').add({
                                toUserId: contact.linkedUid,
                                fromUserId: firebaseAuth.currentUser.uid,
                                fromUserName: userData?.name || "User",
                                fromUserPhone: userData?.mobile || "",
                                latitude,
                                longitude,
                                locationLink,
                                status: 'active',
                                timestamp: new Date().toISOString(),
                            });
                            console.log(`In-app alert sent to ${contact.name}`);
                        } catch (e) {
                            console.error("Firestore Alert Error:", e);
                        }
                    }
                }

                Alert.alert(
                    "Location Issue",
                    "Location failed, but SOS message still sent."
                );
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
            if (contacts.length === 0) {
                Alert.alert("No Contacts", "Please add emergency contacts first.");
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
                    "Permission Required",
                    "Please enable Location and SMS permissions to trigger SOS",
                    [
                        { text: "Open Settings", onPress: () => Linking.openSettings() },
                        { text: "Cancel" }
                    ]
                );
                return;
            }

            Geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;

                    const locationLink = `https://maps.google.com/?q=${latitude},${longitude}`;



                    const message = `I am sharing my current location with you for safety.
            View on Maps: ${locationLink}. , for more details : visit our surakhaApp`;

                    console.log(message);

                    const numbers = contacts.map(c => c.mobile);
                    console.log(numbers);

                    for (const number of numbers) {
                        NativeModules.DirectSms.sendDirectSms(number, message)
                            .then(res => console.log("Direct SMS:", res))
                            .catch(err => console.error("Direct SMS Error:", err));
                    }

                    Alert.alert("Success", "location sent to the saved contacts")
                },


                (error) => {
                    console.log("LOCATION ERROR:", error);

                    // 🔥 fallback message if location fails
                    const message = `i have sent my current location to you on suraksha app`;
                    const numbers = contacts.map(c => c.mobile);

                    for (const number of numbers) {
                        NativeModules.DirectSms.sendDirectSms(number, message)
                            .then(res => console.log("Direct SMS:", res))
                            .catch(err => console.error("Direct SMS Error:", err));
                    }

                    Alert.alert(
                        "Location Issue",
                        "Location failed, but message sent to visit our app."
                    );
                },

                {
                    enableHighAccuracy: true,
                    timeout: 15000,
                    maximumAge: 10000,
                }
            );
        } catch (error) {
            Alert.alert("Error", error.message);
            console.log(error);

        }
    }

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
                sendLocation
            }}
        >
            {children}
        </SecurityContext.Provider>
    );
};