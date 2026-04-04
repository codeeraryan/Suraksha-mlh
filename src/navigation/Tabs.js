import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import SOSScreen from '../screens/SOSScreen';
import AlertScreen from '../screens/AlertScreen';
import ContactScreen from '../screens/ContactScreen';
import ProfileScreen from '../screens/ProfileScreen';
import VoiceAssistantScreen from '../screens/VoiceAssistantScreen';
import { colors } from '../colors';

const Tab = createBottomTabNavigator();
const ACCENT = '#00FFAA';

const Tabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.background_color,
          height: 64,
          position: 'absolute',
          bottom: 20,
          marginHorizontal: 10,
          borderRadius: 16,
          shadowColor: ACCENT,
          borderTopWidth: 0,
          elevation: 14,
          paddingBottom: 4,
        },
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
        tabBarActiveTintColor: ACCENT,
        tabBarInactiveTintColor: colors.secondary_text,

        tabBarIcon: ({ focused, color }) => {
          // Image-based icons
          const imageIcons = {
            Home: require('../assets/tabIcons/home.png'),
            Contacts: require('../assets/tabIcons/contact.png'),
            Alert: require('../assets/tabIcons/notifications.png'),
            Profile: require('../assets/tabIcons/profile.png'),
          };

          if (route.name === 'AI') {
            // Emoji-based icon for AI tab (no image asset needed)
            return (
              <View style={[styles.aiIconWrapper, focused && styles.aiIconWrapperActive]}>
                <Text style={[styles.aiIconText, { transform: [{ scale: focused ? 1.1 : 1 }] }]}>
                  🛡️
                </Text>
              </View>
            );
          }

          return (
            <Image
              source={imageIcons[route.name]}
              style={{ width: 22, height: 22, tintColor: color }}
              resizeMode="contain"
            />
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={SOSScreen} />
      <Tab.Screen name="Contacts" component={ContactScreen} />

      {/* AI Voice Assistant — center tab */}
      <Tab.Screen
        name="AI"
        component={VoiceAssistantScreen}
        options={{
          tabBarLabel: 'Suraksha AI',
          tabBarLabelStyle: { fontSize: 10, fontWeight: '700', color: ACCENT },
        }}
      />

      <Tab.Screen name="Alert" component={AlertScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  aiIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0D2E1F',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -10,
    borderWidth: 2,
    borderColor: '#1C4A30',
    elevation: 6,
  },
  aiIconWrapperActive: {
    backgroundColor: '#0D3A22',
    borderColor: ACCENT,
    shadowColor: ACCENT,
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 10,
  },
  aiIconText: {
    fontSize: 22,
  },
});

export default Tabs;