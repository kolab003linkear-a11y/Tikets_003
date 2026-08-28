import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from './HomeScreen';
import SeatSelectionScreen from './SeatSelectionScreen';
import CheckoutScreen from './CheckoutScreen';
import TicketScreen from './TicketScreen';

type RootStackParamList = {
  HomeTabs: undefined;
  SeatSelection: { showtimeId: string; movieTitle: string; price: number };
  Checkout: {
    reservationId: string;
    ticketCount: number;
    selectedSeats: string[];
    total: number;
    showtimeId: string;
    movieTitle: string;
  };
  Ticket: {
    ticketId: string;
    signature: string;
    movieTitle: string;
    selectedSeats: string[];
  };
};

type TabParamList = {
  Cartelera: undefined;
  'Mis Tickets': undefined;
  Perfil: undefined;
  'Admin Scanner': undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Se produjo un error en la app. Inténtalo de nuevo más tarde.
          </Text>
        </View>
      );
    }

    return this.props.children;
  }
}

function TicketsScreen() {
  return (
    <View style={styles.placeholderScreen}>
      <Text style={styles.placeholderTitle}>Mis Tickets</Text>
      <Text style={styles.placeholderText}>Aquí verás tus reservas y entradas activas.</Text>
    </View>
  );
}

function ProfileScreen() {
  return (
    <View style={styles.placeholderScreen}>
      <Text style={styles.placeholderTitle}>Perfil</Text>
      <Text style={styles.placeholderText}>Información personal, membresías y métodos de pago.</Text>
    </View>
  );
}

function AdminScannerScreen() {
  return (
    <View style={styles.placeholderScreen}>
      <Text style={styles.placeholderTitle}>Admin Scanner</Text>
      <Text style={styles.placeholderText}>Escanea tickets en la entrada del evento.</Text>
    </View>
  );
}

function HomeTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: '#e11d48',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          backgroundColor: '#0f172a',
          borderTopWidth: 0,
          paddingBottom: 8,
          paddingTop: 8,
          height: 72,
        },
        tabBarIcon: ({ color, size }) => {
          const iconName =
            route.name === 'Cartelera'
              ? 'film-outline'
              : route.name === 'Mis Tickets'
                ? 'ticket-outline'
                : route.name === 'Perfil'
                  ? 'person-outline'
                  : 'scan-outline';

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Cartelera" component={HomeScreen} />
      <Tab.Screen name="Mis Tickets" component={TicketsScreen} />
      <Tab.Screen name="Perfil" component={ProfileScreen} />
      <Tab.Screen name="Admin Scanner" component={AdminScannerScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="HomeTabs"
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="HomeTabs" component={HomeTabs} />
          <Stack.Screen name="SeatSelection" component={SeatSelectionScreen} />
          <Stack.Screen name="Checkout" component={CheckoutScreen} />
          <Stack.Screen name="Ticket" component={TicketScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    padding: 24,
  },
  errorText: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  placeholderScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    padding: 24,
  },
  placeholderTitle: {
    color: '#f8fafc',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
  },
  placeholderText: {
    color: '#cbd5e1',
    fontSize: 16,
    textAlign: 'center',
  },
});
