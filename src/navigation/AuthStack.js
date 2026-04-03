import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen'
import SignupScreen from '../screens/SignupScreen'
import { colors } from '../colors';

const AuthStack = () => {
    const Stack = createNativeStackNavigator();
    return (
        <Stack.Navigator >
            <Stack.Screen
                name='Login'
                component={LoginScreen}
                options={{
                    title: 'Login',
                    headerStyle: { backgroundColor: colors.background_color },
                    headerTintColor: colors.secondary_text,
                }}
            />
            <Stack.Screen
                name='Signup'
                component={SignupScreen}
                options={{
                    title: 'Signup',
                    headerStyle: { backgroundColor: colors.background_color },
                    headerTintColor: colors.secondary_text,
                }}
            />
        </Stack.Navigator>
    )

}

export default AuthStack

const styles = StyleSheet.create({})