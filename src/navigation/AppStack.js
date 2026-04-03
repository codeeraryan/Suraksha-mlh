import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Tabs from './Tabs';
import { colors } from '../colors';
import ScannerScreen from '../screens/ScannerScreen';
import AddContactScreen from '../screens/AddContactScreen'

const AppStack = () => {
    const Stack = createNativeStackNavigator();
    return (
        <Stack.Navigator initialRouteName="MainTabs">

            {/* Tabs */}
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
                name='AddContact'
                component={AddContactScreen}
                options={{
                    title: 'Add Contact',
                    headerStyle: { backgroundColor: colors.background_color },
                    headerTintColor: colors.secondary_text,
                }}
            />


        </Stack.Navigator>
    )

}

export default AppStack

const styles = StyleSheet.create({})