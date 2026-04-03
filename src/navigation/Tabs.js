import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Image } from 'react-native';

import SOSScreen from '../screens/SOSScreen';
import AlertScreen from '../screens/AlertScreen';
import ContactScreen from '../screens/ContactScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { colors } from '../colors';

const Tab = createBottomTabNavigator();

const Tabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,

        tabBarStyle: {
          backgroundColor: colors.background_color,
          height: 60,
          position: 'absolute',
          bottom: 20,
          marginHorizontal: 10,
          borderRadius: 10,
          shadowColor: "#00FFAA",
          borderTopWidth: 0,
          elevation: 10
        },

        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 15,
          fontWeight: 'bold',
        },
        tabBarActiveTintColor: "#00FFAA",
        tabBarInactiveTintColor: colors.secondary_text,

        tabBarIcon: ({ focused }) => {
          let icon;

          if (route.name === 'Home') {
            icon = require('../assets/tabIcons/home.png');
          } else if (route.name === 'Contacts') {
            icon = require('../assets/tabIcons/contact.png');
          } else if (route.name === 'Alert') {
            icon = require('../assets/tabIcons/notifications.png');
          } else if (route.name === 'Profile') {
            icon = require('../assets/tabIcons/profile.png');
          }

          return (
            <Image
              source={icon}
              style={{
                width: 24,
                height: 24,
                tintColor: focused
                  ? colors.primary || '#00FFAA'
                  : colors.secondary_text || '#888',
              }}
              resizeMode="contain"
            />
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={SOSScreen} />
      <Tab.Screen name="Contacts" component={ContactScreen} />
      <Tab.Screen name="Alert" component={AlertScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
};

export default Tabs;