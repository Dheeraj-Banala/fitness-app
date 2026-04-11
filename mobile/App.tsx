import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider, useAuth } from './app/context/AuthContext';
import TabNavigator from './app/navigation/TabNavigator';
import LoginScreen from './app/screens/LoginScreen';

function RootNavigator() {
  const { token } = useAuth();
  return (
    <NavigationContainer>
      {token ? <TabNavigator /> : <LoginScreen />}
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}