import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import FoodLogStack from './FoodLogStack';
import WorkoutsStack from './WorkoutsStack';
import WeightScreen from '../screens/WeightScreen';
import WaterScreen from '../screens/WaterScreen';
import GoalsScreen from '../screens/GoalsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import { colors } from '../theme';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: colors.card,
                    borderTopColor: 'rgba(0,122,255,0.2)',
                    borderTopWidth: 1,
                },
                tabBarActiveTintColor: colors.blue,
                tabBarInactiveTintColor: colors.textSecondary,
            }}
        >
            <Tab.Screen
                name="Food Log"
                component={FoodLogStack}
                options={{ title: 'Food', tabBarIcon: ({ color, size }) => <Ionicons name="restaurant-outline" size={size} color={color} /> }}
            />
            <Tab.Screen
                name="Workouts"
                component={WorkoutsStack}
                options={{ tabBarIcon: ({ color, size }) => <Ionicons name="barbell-outline" size={size} color={color} /> }}
            />
            <Tab.Screen
                name="Weight"
                component={WeightScreen}
                options={{ tabBarIcon: ({ color, size }) => <Ionicons name="scale-outline" size={size} color={color} /> }}
            />
            <Tab.Screen
                name="Water"
                component={WaterScreen}
                options={{ tabBarIcon: ({ color, size }) => <Ionicons name="water-outline" size={size} color={color} /> }}
            />
            <Tab.Screen
                name="Goals"
                component={GoalsScreen}
                options={{ tabBarIcon: ({ color, size }) => <Ionicons name="flag-outline" size={size} color={color} /> }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{ tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} /> }}
            />
        </Tab.Navigator>
    );
}
