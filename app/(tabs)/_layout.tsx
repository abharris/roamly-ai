import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Fonts, FontSizes } from '../../src/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopWidth: 0.5,
          borderTopColor: Colors.borderLight,
          height: 76,
          paddingBottom: 12,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: FontSizes.navTab,
          fontFamily: Fonts.mono,
          letterSpacing: 0.4,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="trips"
        options={{
          tabBarLabel: 'Trips',
          tabBarIcon: ({ color }) => (
            <Ionicons name="compass-outline" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="places/index"
        options={{
          tabBarLabel: 'Places',
          tabBarIcon: ({ color }) => (
            <Ionicons name="location-outline" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="friends/index"
        options={{
          tabBarLabel: 'Friends',
          tabBarIcon: ({ color }) => (
            <Ionicons name="people-outline" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => (
            <Ionicons name="person-outline" size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
