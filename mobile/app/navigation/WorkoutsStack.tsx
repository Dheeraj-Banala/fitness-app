import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import WorkoutsScreen from '../screens/WorkoutsScreen';
import CreateWorkoutScreen from '../screens/CreateWorkoutScreen';
import WorkoutDetailScreen from '../screens/WorkoutDetailScreen';
import ExerciseHistoryScreen from '../screens/ExerciseHistoryScreen';

const Stack = createNativeStackNavigator();

export default function WorkoutsStack() {
    return (
        <Stack.Navigator screenOptions={{
            headerStyle: { backgroundColor: '#1A1A2E' },
            headerTintColor: '#F0F0F5',
            headerTitleStyle: { fontWeight: '600' },
        }}>
            <Stack.Screen name="WorkoutList" component={WorkoutsScreen} options={{ headerShown: false }} />
            <Stack.Screen name="CreateWorkout" component={CreateWorkoutScreen} options={{ title: 'New Workout' }} />
            <Stack.Screen name="WorkoutDetail" component={WorkoutDetailScreen} options={{ title: 'Workout' }} />
            <Stack.Screen name="ExerciseHistory" component={ExerciseHistoryScreen} options={({ route }) => ({ title: (route.params as any)?.exerciseName ?? 'History' })} />
        </Stack.Navigator>
    );
}