import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { enableScreens } from 'react-native-screens';
import AuthGate from './src/components/AuthGate';
import { AuthProvider } from './src/context/AuthContext';
import { LimitProvider } from './src/context/LimitContext';
import HomeScreen from './src/screens/HomeScreen';
import KartlarScreen from './src/screens/KartlarScreen';
import DetayScreen from './src/screens/DetayScreen';
import { reklamlariBaslat } from './src/services/mobileAds';

enableScreens();

const Stack = createNativeStackNavigator();

const screenOptions = {
  headerStyle: { backgroundColor: '#060a12' },
  headerTintColor: '#4fd1c5',
  headerTitleStyle: { fontWeight: '600', fontSize: 16 },
  contentStyle: { backgroundColor: '#060a12' },
};

export default function App() {
  useEffect(() => {
    void reklamlariBaslat().catch(() => {});
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AuthGate>
          <LimitProvider>
            <NavigationContainer>
              <StatusBar style="light" />
              <Stack.Navigator screenOptions={screenOptions}>
                <Stack.Screen
                  name="Home"
                  component={HomeScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="Kartlar"
                  component={KartlarScreen}
                  options={({ route }) => ({
                    title: route.params?.konu || 'Kartlar',
                  })}
                />
                <Stack.Screen
                  name="Detay"
                  component={DetayScreen}
                  options={({ route }) => ({
                    title: route.params?.kart?.baslik || 'Detay',
                  })}
                />
              </Stack.Navigator>
            </NavigationContainer>
          </LimitProvider>
        </AuthGate>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
