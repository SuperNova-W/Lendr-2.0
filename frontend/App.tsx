import React, { useState } from 'react';
import { View } from 'react-native';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
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
import { TopNav } from './src/components/TopNav';
import { useResponsive } from './src/lib/responsive';

const Stack = createNativeStackNavigator();

// Route list for the root stack. Params are loose here — this type exists mainly
// so the navigation ref below is typed (getCurrentRoute().name, navigate(name)).
type RootStackParamList = {
  Onboarding: undefined;
  CreateAccount: undefined;
  SetupProfile: undefined;
  Home: undefined;
  ItemDetail: object | undefined;
  Requests: undefined;
  Search: undefined;
  AddItem: undefined;
  Messages: undefined;
  MessageThread: object | undefined;
  Notifications: undefined;
  Profile: object | undefined;
  Settings: undefined;
  Legal: undefined;
};

// Shared ref so the web TopNav (rendered outside the navigator) can drive
// navigation.
const navigationRef = createNavigationContainerRef<RootStackParamList>();

// Routes that should never show the desktop top nav (auth / setup flows).
const NO_TOPNAV = ['Onboarding', 'CreateAccount', 'SetupProfile'];

function Navigator() {
  const { session, loading, needsOnboarding } = useAuth();

  if (loading) return null;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
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

// Holds the navigator plus, on the web at desktop widths, a persistent top
// navigation bar above it. On native this is just the navigator, so the mobile
// experience (bottom tab bar, full-width screens) is unchanged.
function AppShell() {
  const { session, needsOnboarding } = useAuth();
  const { isWebDesktop } = useResponsive();
  const [routeName, setRouteName] = useState<string | undefined>(undefined);

  const handleNavigate = (route: string) => {
    if (navigationRef.isReady()) navigationRef.navigate(route as never);
  };

  const showTopNav =
    isWebDesktop &&
    !!session &&
    !needsOnboarding &&
    !!routeName &&
    !NO_TOPNAV.includes(routeName);

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => setRouteName(navigationRef.getCurrentRoute()?.name)}
      onStateChange={() => setRouteName(navigationRef.getCurrentRoute()?.name)}
    >
      <View style={{ flex: 1 }}>
        {showTopNav && <TopNav activeRoute={routeName} onNavigate={handleNavigate} />}
        <Navigator />
      </View>
    </NavigationContainer>
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
          <AppShell />
        </AuthProvider>
      )}
    </SafeAreaProvider>
  );
}
