import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import FoodLogScreen from "../screens/FoodLogScreen";
import AddFoodScreen from '../screens/AddFoodScreen';
import MicronutrientsScreen from '../screens/MicronutrientsScreen';
import BarcodeScannerScreen from "../screens/BarcodeScannerScreen";
import LogFoodScreen from "../screens/LogFoodScreen";
import CreateFoodScreen from "../screens/CreateFoodScreen";
import EditFoodScreen from "../screens/EditFoodScreen";
import EditRecipeScreen from "../screens/EditRecipeScreen";
import CreateRecipeScreen from "../screens/CreateRecipeScreen";

const Stack = createNativeStackNavigator();

export default function FoodLogStack() {
    return (
        <Stack.Navigator>
            <Stack.Screen name="FoodLog" component={FoodLogScreen} />
            <Stack.Screen name="AddFood" component={AddFoodScreen} />
            <Stack.Screen name="Micronutrients" component={MicronutrientsScreen} options={{ title: 'Micronutrients' }} />
            <Stack.Screen name="Barcode" component={BarcodeScannerScreen} />
            <Stack.Screen name="LogFood" component={LogFoodScreen} options={{ title: 'Log Food' }} />
            <Stack.Screen name="CreateFood" component={CreateFoodScreen} options={{ title: 'Create Food' }} />
            <Stack.Screen name="EditFood" component={EditFoodScreen} options={{ title: 'Edit Food' }} />
            <Stack.Screen name="EditRecipe" component={EditRecipeScreen} options={{ title: 'Edit Recipe' }} />
            <Stack.Screen name="CreateRecipe" component={CreateRecipeScreen} options={{ title: 'Create Recipe' }} />
        </Stack.Navigator>
    );
}