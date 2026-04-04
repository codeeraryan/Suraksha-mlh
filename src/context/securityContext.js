import React, { createContext, useState, useRef, useEffect } from 'react';
import { BleManager } from 'react-native-ble-plx';
import { PermissionsAndroid, Platform, Alert, Linking, NativeModules, AppState } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import SendSMS from 'react-native-sms';
import { db, firebaseAuth } from '../../firebase';
import AudioRecord from 'react-native-audio-record';
import RNFS from 'react-native-fs';

export const SecurityContext = createContext();
const manager = new BleManager();

export const SecurityProvider = ({ children }) => {
    const [connectedDevice, setConnectedDevice] = useState(null);
    const [isSOSActive, setIsSOSActive] = useState(false);
    const [isSOSSending, setIsSOSSending] = useState(false); // loader while recording + sending
    const [sosRecordingCountdown, setSosRecordingCountdown] = useState(10);
    const [isLocationLoading, setIsLocationLoading] = useState(false);
    const [contacts, setContacts] = useState([]);
    const [guardianAlert, setGuardianAlert] = useState(null);
    const subscriptionRef = useRef(null);
    const unsubscribeContactsRef = useRef(null);
    const activeAlertDocs = useRef([]);
    const audioChunks = useRef([]);
    const recordingTimer = useRef(null);
    const isRecording = useRef(false);
    const lastNotifiedAlertId = useRef(null);

    const BOAT_CHAR = 'fe2c1238-8366-4814-8eb0-01de32100bea';

    // ================= PERMISSIONS =================
    // ================= PERMISSIONS & LOCATION CHECK =================
    const checkAndRequestLocation = async () => {
        if (Platform.OS === 'android') {
            try {
                const granted = await PermissionsAndroid.requestMultiple([
                    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                    PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
                    PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
                    PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
                    PermissionsAndroid.PERMISSIONS.SEND_SMS,
                    PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
                ]);

                const locationGranted =
                    granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED ||
                    granted[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED;

                if (!locationGranted) {
                    // Automatically open settings if permissions are missing
                    Linking.openSettings();
                    return;
                }

                // Check if GPS is actually ON
                Geolocation.getCurrentPosition(
                    () => { console.log("GPS is enabled and working"); },
                    (error) => {
                        console.log("GPS Check Error:", error);
                        if (error.code === 2 || error.message?.includes("Location services are disabled")) {
                            // Automatically open device location settings
                            if (Platform.OS === 'android') {
                                Linking.sendIntent('android.settings.LOCATION_SOURCE_SETTINGS');
                            } else {
                                Linking.openSettings();
                            }
                        }
                    },
                    { enableHighAccuracy: true, timeout: 3000 }
                );

            } catch (err) {
                console.warn("Permission Error:", err);
            }
        }
    };

    useEffect(() => {
        // Initial check on mount
        checkAndRequestLocation();

        // Check whenever app returns to foreground
        const subscription = AppState.addEventListener('change', nextAppState => {
            if (nextAppState === 'active') {
                checkAndRequestLocation();
            }
        });

        return () => {
            subscription.remove();
        };
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

    // ================= REAL-TIME GUARDIAN ALERTS =================
    useEffect(() => {
        let unsubscribe = null;

        const setupAlertListener = () => {
            const user = firebaseAuth.currentUser;
            if (user?.uid) {
                console.log("Setting up real-time alert listener for:", user.uid);
                unsubscribe = db.collection('alerts')
                    .where('toUserId', '==', user.uid)
                    .where('status', '==', 'active')
                    .orderBy('timestamp', 'desc')
                    .limit(1)
                    .onSnapshot(snapshot => {
                        if (!snapshot.empty) {
                            const alertData = {
                                id: snapshot.docs[0].id,
                                ...snapshot.docs[0].data()
                            };
                            console.log("New Guardian Alert received:", alertData.fromUserName);
                            setGuardianAlert(alertData);

                            // Trigger a system alert so they know exactly what happened,
                            // even if they are on Home or Profile screen.
                            if (lastNotifiedAlertId.current !== alertData.id) {
                                lastNotifiedAlertId.current = alertData.id;
                                Alert.alert(
                                    "🚨 EMERGENCY ALERT!",
                                    `${alertData.fromUserName} has requested emergency help.\n\nPlease navigate to the ALERT tab below to view their live location and listen to their voice recording.`
                                );
                            }
                        } else {
                            setGuardianAlert(null);
                            lastNotifiedAlertId.current = null;
                        }
                    }, error => {
                        console.error("Firestore Alert Listener Error:", error);
                    });
            } else {
                setGuardianAlert(null);
            }
        };

        setupAlertListener();

        // Listen for auth changes to reset listener
        const authUnsubscribe = firebaseAuth.onAuthStateChanged((user) => {
            if (unsubscribe) unsubscribe();
            setupAlertListener();
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

        const hasLocation = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
        const hasSms = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.SEND_SMS);

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

        // ---- STEP 1: Show loading state & request mic permission ----
        setIsSOSSending(true);
        setSosRecordingCountdown(10);

        let micGranted = false;
        if (Platform.OS === 'android') {
            const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
            micGranted = result === PermissionsAndroid.RESULTS.GRANTED;
        } else {
            micGranted = true;
        }

        // ---- STEP 2: Record 10s audio (Promise-based) ----
        let base64Audio = null;
        if (micGranted) {
            base64Audio = await new Promise((resolve) => {
                try {
                    const chunks = [];
                    AudioRecord.init({
                        sampleRate: 16000,
                        channels: 1,
                        bitsPerSample: 16,
                        audioSource: 6,
                        wavFile: 'sos_audio.wav',
                    });
                    AudioRecord.on('data', (data) => chunks.push(data));
                    AudioRecord.start();
                    console.log('🎙 Recording started...');

                    // Countdown timer
                    let count = 9;
                    const countInterval = setInterval(() => {
                        setSosRecordingCountdown(count);
                        count--;
                    }, 1000);

                    setTimeout(async () => {
                        clearInterval(countInterval);
                        try {
                            const audioFilePath = await AudioRecord.stop();
                            console.log('🎙 Recording stopped. Saved at:', audioFilePath);
                            
                            if (audioFilePath) {
                                // Read the full saved .wav file as a valid base64 string
                                const fileBase64 = await RNFS.readFile(audioFilePath, 'base64');
                                resolve(fileBase64);
                            } else {
                                resolve(null);
                            }
                        } catch (e) {
                            console.error('Recording stop error:', e);
                            resolve(null);
                        }
                    }, 10000);

                } catch (e) {
                    console.error('Recording start error:', e);
                    resolve(null);
                }
            });
        }

        // ---- STEP 3: Get location (parallel-ready, await after recording) ----
        const getLocation = () => new Promise((resolve) => {
            Geolocation.getCurrentPosition(
                (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
                () => Geolocation.getCurrentPosition(
                    (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
                    () => resolve(null),
                    { enableHighAccuracy: false, timeout: 15000 }
                ),
                { enableHighAccuracy: true, timeout: 30000, maximumAge: 10000 }
            );
        });

        const location = await getLocation();
        const locationLink = location
            ? `https://www.google.com/maps?q=${location.lat},${location.lon}`
            : null;

        // ---- STEP 4: Send SMS + Firestore alert WITH audio already embedded ----
        let senderName = firebaseAuth.currentUser?.displayName;
        if (!senderName && firebaseAuth.currentUser?.uid) {
            try {
                const userDoc = await db.collection('users').doc(firebaseAuth.currentUser.uid).get();
                senderName = userDoc.data()?.name || 'SOS User';
            } catch (error) {
                console.error("Error fetching sender name:", error);
                senderName = 'SOS User';
            }
        }

        const message = locationLink
            ? `🚨 EMERGENCY: I need help!\nMy Location: ${locationLink}\nCheck SurakshaApp for details.`
            : `🚨 EMERGENCY: I need help!\n(Location Unavailable)\nCheck SurakshaApp or call me!`;

        for (const contact of contacts) {
            if (contact.mobile) {
                NativeModules.DirectSms.sendDirectSms(contact.mobile, message)
                    .catch(err => console.error('SMS Error:', err));
            }
            if (contact.isAppUser && contact.linkedUid) {
                db.collection('alerts').add({
                    toUserId: contact.linkedUid,
                    fromUserId: firebaseAuth.currentUser?.uid,
                    fromUserName: senderName,
                    latitude: location?.lat || 0,
                    longitude: location?.lon || 0,
                    locationLink: locationLink || 'unavailable',
                    audioData: base64Audio || null, // embedded from the start
                    status: 'active',
                    timestamp: new Date().toISOString(),
                }).catch(e => console.error('Firestore Alert Error:', e));
            }
        }

        // ---- STEP 5: All done — show SOS active screen ----
        setIsSOSSending(false);
        setIsSOSActive(true);
        Alert.alert('SOS Sent', 'Emergency alerts have been sent to your guardians.');
    };

    // ================= CANCEL SOS =================
    const cancelSOS = () => {
        setIsSOSActive(false);
        setIsSOSSending(false);
        Alert.alert("Safe", "SOS stopped");
    };

    const sendLocation = async () => {
        try {
            setIsLocationLoading(true);
            if (contacts.length === 0) {
                Alert.alert("No Contacts", "Please add emergency contacts first.");
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
                    "Permission Required",
                    "Please enable Location and SMS permissions to trigger SOS",
                    [
                        { text: "Open Settings", onPress: () => { Linking.openSettings(); setIsLocationLoading(false); } },
                        { text: "Cancel", onPress: () => setIsLocationLoading(false) }
                    ]
                );
                return;
            }

            const getAndSendSms = (lat, lon, link) => {
                const message = link
                    ? `I am sharing my current location with you for safety.\nView on Maps: ${link}\n(Sent via SurakshaApp)`
                    : `I am sharing my status with you for safety.\n(Exact location unavailable, please check SurakshaApp for updates)`;

                console.log(message);

                for (const contact of contacts) {
                    if (contact.mobile) {
                        NativeModules.DirectSms.sendDirectSms(contact.mobile, message)
                            .then(res => console.log("Direct SMS:", res))
                            .catch(err => console.error("Direct SMS Error:", err));
                    }
                }
            };

            Geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    const locationLink = `https://maps.google.com/?q=${latitude},${longitude}`;
                    getAndSendSms(latitude, longitude, locationLink);
                    setIsLocationLoading(false);
                    Alert.alert("Success", "Location sent to the saved contacts");
                },
                (error) => {
                    console.log("HIGH ACCURACY ERROR:", error);
                    // Fallback to low accuracy
                    Geolocation.getCurrentPosition(
                        (pos) => {
                            const { latitude, longitude } = pos.coords;
                            const link = `https://maps.google.com/?q=${latitude},${longitude}`;
                            getAndSendSms(latitude, longitude, link);
                            setIsLocationLoading(false);
                            Alert.alert("Success", "Location sent (approximate).");
                        },
                        (err) => {
                            console.log("LOW ACCURACY ERROR:", err);
                            getAndSendSms(null, null, null);
                            setIsLocationLoading(false);
                            Alert.alert(
                                "Location Issue",
                                "Location failed, but status message sent to contacts."
                            );
                        },
                        { enableHighAccuracy: false, timeout: 15000 }
                    );
                },
                {
                    enableHighAccuracy: true,
                    timeout: 30000,
                    maximumAge: 10000,
                }
            );
        } catch (error) {
            setIsLocationLoading(false);
            Alert.alert("Error", error.message);
            console.log(error);
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
                isSOSSending,
                sosRecordingCountdown,
                isLocationLoading,
                triggerSOS,
                cancelSOS,
                contacts,
                setContacts,
                sendLocation,
                guardianAlert,
                setGuardianAlert
            }}
        >
            {children}
        </SecurityContext.Provider>
    );
};