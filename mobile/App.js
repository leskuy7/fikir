import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import mobileAds from 'react-native-google-mobile-ads';
import { LimitProvider } from './src/context/LimitContext';
import HomeScreen from './src/screens/HomeScreen';
import KartlarScreen from './src/screens/KartlarScreen';
import DetayScreen from './src/screens/DetayScreen';

const Stack = createNativeStackNavigator();

const screenOptions = {
  headerStyle: { backgroundColor: '#060a12' },
  headerTintColor: '#4fd1c5',
  headerTitleStyle: { fontWeight: '600', fontSize: 16 },
  contentStyle: { backgroundColor: '#060a12' },
};

export default function App() {
  useEffect(() => {
    mobileAds().initialize();
  }, []);

  return (
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
  );
}
