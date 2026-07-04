import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { useAppStore } from '../store/useAppStore';
import { DashboardScreen } from '../screens/DashboardScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { PlaceholderScreen } from '../screens/PlaceholderScreen';
import { SpendingInsightsScreen } from '../screens/SpendingInsightsScreen';
import { RecommendationsScreen } from '../screens/RecommendationsScreen';
import { GoalPlannerScreen } from '../screens/GoalPlannerScreen';
import { WealthScoreScreen } from '../screens/WealthScoreScreen';
import { AvatarHomeScreen } from '../screens/AvatarHomeScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { useTranslation } from '../i18n/useTranslation';
import type { MainTabParamList, RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_ICONS: Record<keyof MainTabParamList, keyof typeof MaterialCommunityIcons.glyphMap> = {
  Dashboard: 'view-dashboard',
  Avatar: 'robot-happy',
  Insights: 'chart-donut',
  Invest: 'trending-up',
  Goals: 'flag-checkered',
};

function MainTabs() {
  const { t } = useTranslation();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primaryGreen,
        tabBarInactiveTintColor: colors.muted,
        tabBarIcon: ({ color, size }) => (
          <MaterialCommunityIcons name={TAB_ICONS[route.name]} color={color} size={size} />
        ),
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarLabel: t('tabDashboard') }} />
      <Tab.Screen name="Avatar" component={AvatarHomeScreen} options={{ tabBarLabel: t('tabArtha') }} />
      <Tab.Screen name="Insights" component={SpendingInsightsScreen} options={{ tabBarLabel: t('tabInsights') }} />
      <Tab.Screen name="Invest" component={RecommendationsScreen} options={{ tabBarLabel: t('tabInvest') }} />
      <Tab.Screen name="Goals" component={GoalPlannerScreen} options={{ tabBarLabel: t('tabGoals') }} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const { t } = useTranslation();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen
            name="Score"
            component={WealthScoreScreen}
            options={{ headerShown: true, title: t('wealthScoreTitle') }}
          />
          <Stack.Screen
            name="Chat"
            component={ChatScreen}
            options={{ headerShown: true, title: t('askArthaTitle') }}
          />
        </>
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  );
}
