import React from 'react';
import { StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Tabs from './Tabs';
import { colors } from '../colors';
import ScannerScreen from '../screens/ScannerScreen';
import AddContactScreen from '../screens/AddContactScreen';
import VoiceAssistantScreen from '../screens/VoiceAssistantScreen';
import FakeCallScreen from '../screens/FakeCallScreen';

const Stack = createNativeStackNavigator();

const AppStack = () => {
    return (
        <Stack.Navigator initialRouteName="MainTabs">

            {/* Bottom Tabs */}
            <Stack.Screen
                name="MainTabs"
                component={Tabs}
                options={{ headerShown: false }}
            />

            {/* Stack Screens */}
            <Stack.Screen
                name="Bluetooth"
                component={ScannerScreen}
                options={{
                    title: 'Pair Device',
                    headerStyle: { backgroundColor: colors.background_color },
                    headerTintColor: colors.secondary_text,
                }}
            />
            <Stack.Screen
                name="AddContact"
                component={AddContactScreen}
                options={{
                    title: 'Add Contact',
                    headerStyle: { backgroundColor: colors.background_color },
                    headerTintColor: colors.secondary_text,
                }}
            />

            {/* AI Voice Assistant */}
            <Stack.Screen
                name="VoiceAssistant"
                component={VoiceAssistantScreen}
                options={{
                    title: 'Suraksha AI',
                    headerStyle: { backgroundColor: colors.background_color },
                    headerTintColor: '#00FFAA',
                    headerTitleStyle: { fontWeight: '700', fontSize: 18 },
                }}
            />

            {/* Fake Call Screen — full screen, no header */}
            <Stack.Screen
                name="FakeCall"
                component={FakeCallScreen}
                options={{
                    headerShown: false,
                    animation: 'slide_from_bottom',
                }}
            />

        </Stack.Navigator>
    );
};

export default AppStack;

const styles = StyleSheet.create({});