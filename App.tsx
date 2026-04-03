import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import AuthStack from './src/navigation/AuthStack'
import { NavigationContainer } from '@react-navigation/native'

const App = () => {
  const loggedIn = true;
  return (
    <NavigationContainer>
      <AuthStack />
    </NavigationContainer>
  )
}

export default App

const styles = StyleSheet.create({})