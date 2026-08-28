import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, View, Text, StyleSheet } from 'react-native';
import HomeScreen from './src/screens/HomeScreen';
import SeatSelectionScreen from './src/screens/SeatSelectionScreen';
import CheckoutScreen from './src/screens/CheckoutScreen';
import TicketScreen from './src/screens/TicketScreen';
import MyTicketsScreen from './src/screens/MyTicketsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import AuthScreen from './src/screens/AuthScreen';
import AdminScannerScreen from './src/screens/AdminScannerScreen';
import AdminEventsScreen from './src/screens/AdminEventsScreen';
import AdminScheduleScreen from './src/screens/AdminScheduleScreen';
import { AuthProvider, useAuth } from './src/auth/AuthContext';
import { colors, typography } from './src/theme';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Se produjo un error en la app.</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

function HomeTabs() {
  const { user } = useAuth();
  const canUseAdminScanner = user?.role === 'ADMIN' || user?.role === 'SCANNER';
  const canManageEvents = user?.role === 'ADMIN';

  return (
    <Tab.Navigator
      screenOptions={({ route }: any) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 0,
          height: 72,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarIcon: ({ color, size }: { color: string; size: number }) => {
          const iconMap = {
            Cartelera: 'film-outline',
            'Mis Tickets': 'ticket-outline',
            Perfil: 'person-outline',
            'Admin Scanner': 'scan-outline',
            'Admin Eventos': 'settings-outline',
            'Admin Salas': 'calendar-outline',
          } as const;

          return <Ionicons name={iconMap[route.name as keyof typeof iconMap] ?? 'film-outline'} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Cartelera" component={HomeScreen} />
      <Tab.Screen name="Mis Tickets" component={MyTicketsScreen} />
      <Tab.Screen name="Perfil" component={ProfileScreen} />
      {canUseAdminScanner && <Tab.Screen name="Admin Scanner" component={AdminScannerScreen} />}
      {canManageEvents && <Tab.Screen name="Admin Eventos" component={AdminEventsScreen} />}
      {canManageEvents && <Tab.Screen name="Admin Salas" component={AdminScheduleScreen} />}
    </Tab.Navigator>
  );
}

function AppContent() {
  const { user, restoring } = useAuth();

  if (restoring) {
    return (
      <View style={styles.placeholder}>
        <Text style={styles.placeholderText}>Cargando sesión...</Text>
      </View>
    );
  }

  if (!user) return <AuthScreen />;

  return (
    <ErrorBoundary>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="HomeTabs" screenOptions={{ headerShown: false }}>
          <Stack.Screen name="HomeTabs" component={HomeTabs} />
          <Stack.Screen name="SeatSelection" component={SeatSelectionScreen} />
          <Stack.Screen name="Checkout" component={CheckoutScreen} />
          <Stack.Screen name="Ticket" component={TicketScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </ErrorBoundary>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 24,
  },
  errorText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  placeholder: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: colors.text,
    fontSize: typography.cardTitle,
    fontWeight: '700',
  },
});
