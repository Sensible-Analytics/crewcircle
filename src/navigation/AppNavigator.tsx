import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import ScannerScreen from '../screens/ScannerScreen';
import ContactsScreen from '../screens/ContactsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import EditContactScreen from '../screens/EditContactScreen';

const ScanStack = createNativeStackNavigator();
const ScanStackScreen = () => {
  return (
    <ScanStack.Navigator screenOptions={{ headerShown: false }}>
      <ScanStack.Screen name="Scanner" component={ScannerScreen} />
    </ScanStack.Navigator>
  );
};

const ContactsStack = createNativeStackNavigator();
const ContactsStackScreen = () => {
  return (
    <ContactsStack.Navigator screenOptions={{ headerShown: false }}>
      <ContactsStack.Screen name="Contacts" component={ContactsScreen} />
      <ContactsStack.Screen name="EditContact" component={EditContactScreen} />
    </ContactsStack.Navigator>
  );
};

const SettingsStack = createNativeStackNavigator();
const SettingsStackScreen = () => {
  return (
    <SettingsStack.Navigator screenOptions={{ headerShown: false }}>
      <SettingsStack.Screen name="Settings" component={SettingsScreen} />
    </SettingsStack.Navigator>
  );
};

const Tab = createBottomTabNavigator();

export const AppNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: '#0066cc',
        tabBarInactiveTintColor: '#666666',
      })}
    >
      <Tab.Screen
        name="Scan"
        component={() => <ScannerScreen />}
        options={{
          tabBarLabel: 'Scan',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="scan-helper" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Contacts"
        component={() => <ContactsScreen />}
        options={{
          tabBarLabel: 'Contacts',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-multiple" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={() => <SettingsScreen />}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cog" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};