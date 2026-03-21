import React from 'react';
import { SafeAreaView, StatusBar } from 'react-native';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <SafeAreaView>
        <AppNavigator />
      </SafeAreaView>
    </>
  );
}