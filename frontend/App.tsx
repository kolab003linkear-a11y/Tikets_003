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
import AuthScreen from './src/screens/AuthScreen';
import { AuthProvider, useAuth } from './src/auth/AuthContext';

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

function TicketsScreen() {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderText}>Mis Tickets</Text>
    </View>
  );
}

function ProfileScreen() {
  const { user, signOut } = useAuth();

  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderText}>Perfil</Text>
      <Text style={styles.profileEmail}>{user?.email}</Text>
      <Pressable style={styles.logoutButton} onPress={() => void signOut()}>
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </Pressable>
    </View>
  );
}

function ScannerScreen() {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderText}>Admin Scanner</Text>
    </View>
  );
}

function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }: any) => ({
        headerShown: false,
        tabBarActiveTintColor: '#e11d48',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          backgroundColor: '#0f172a',
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
          } as const;

          return <Ionicons name={iconMap[route.name as keyof typeof iconMap] ?? 'film-outline'} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Cartelera" component={HomeScreen} />
      <Tab.Screen name="Mis Tickets" component={TicketsScreen} />
      <Tab.Screen name="Perfil" component={ProfileScreen} />
      <Tab.Screen name="Admin Scanner" component={ScannerScreen} />
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
    backgroundColor: '#020817',
    padding: 24,
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  placeholder: {
    flex: 1,
    backgroundColor: '#020817',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  profileEmail: {
    color: '#94a3b8',
    fontSize: 15,
    marginTop: 10,
  },
  logoutButton: {
    backgroundColor: '#e11d48',
    borderRadius: 12,
    marginTop: 22,
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  logoutText: {
    color: '#fff',
    fontWeight: '800',
  },
});
