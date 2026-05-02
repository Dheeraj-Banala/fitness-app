import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider, useAuth } from './app/context/AuthContext';
import { PreferencesProvider } from './app/context/PreferencesContext';
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
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <PreferencesProvider>
          <RootNavigator />
        </PreferencesProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}