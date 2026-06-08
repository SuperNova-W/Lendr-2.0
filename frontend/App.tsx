import React, { useState } from 'react';
import { Platform } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { COLORS } from './src/theme/colors';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { SplashScreen } from './src/screens/SplashScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { CreateAccountScreen } from './src/screens/CreateAccountScreen';
import { SetupProfileScreen } from './src/screens/SetupProfileScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { ItemDetailScreen } from './src/screens/ItemDetailScreen';
import { RequestsScreen } from './src/screens/RequestsScreen';
import { SearchScreen } from './src/screens/SearchScreen';
import { AddItemScreen } from './src/screens/AddItemScreen';
import { MessagesScreen } from './src/screens/MessagesScreen';
import { MessageThreadScreen } from './src/screens/MessageThreadScreen';
import { NotificationsScreen } from './src/screens/NotificationsScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { LegalScreen } from './src/screens/LegalScreen';
import { AuthProvider, useAuth } from './src/context/AuthContext';

const Stack = createNativeStackNavigator();

// On the web, screens cap + center themselves into a uniform column; this gray
// fills the area around it so the app reads as one contained surface. On native
// the screen always fills the window, so we keep the original white and nothing
// about the iOS/Android appearance changes.
const SCENE_BG = Platform.OS === 'web' ? COLORS.pageBackdrop : COLORS.bg;
const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: SCENE_BG },
};

function Navigator() {
  const { session, loading, needsOnboarding } = useAuth();

  if (loading) return null;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: SCENE_BG } }}>
      {session && needsOnboarding ? (
        // Signed in but profile incomplete — force the students-only setup form
        <Stack.Screen name="SetupProfile" component={SetupProfileScreen} />
      ) : session ? (
        // Signed in & set up — main app
        <>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="ItemDetail" component={ItemDetailScreen} />
          <Stack.Screen name="Requests" component={RequestsScreen} />
          <Stack.Screen name="Search" component={SearchScreen} />
          <Stack.Screen name="AddItem" component={AddItemScreen} />
          <Stack.Screen name="Messages" component={MessagesScreen} />
          <Stack.Screen name="MessageThread" component={MessageThreadScreen} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="Legal" component={LegalScreen} />
        </>
      ) : (
        // Not signed in — show auth flow (splash already shown by the launch gate)
        <>
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="CreateAccount" component={CreateAccountScreen} />
          <Stack.Screen name="Legal" component={LegalScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  let [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // Show the animated splash on every launch, before anything else renders.
  const [splashDone, setSplashDone] = useState(false);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      {!splashDone ? (
        <SplashScreen onDone={() => setSplashDone(true)} />
      ) : (
        <AuthProvider>
          <NavigationContainer theme={navTheme}>
            <Navigator />
          </NavigationContainer>
        </AuthProvider>
      )}
    </SafeAreaProvider>
  );
}
