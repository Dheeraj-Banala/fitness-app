import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider, useAuth } from './app/context/AuthContext';
import TabNavigator from './app/navigation/TabNavigator';
import AuthStack from './app/navigation/AuthStack';

function RootNavigator() {
  const { token, isLoading } = useAuth();
  if (isLoading) return null;
  return (
    <NavigationContainer>
      {token ? <TabNavigator /> : <AuthStack />}
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