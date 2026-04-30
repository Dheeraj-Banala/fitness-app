import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation, useRoute } from '@react-navigation/native';

export default function BarcodeScannerScreen() {
    const navigation = useNavigation();
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);

    const route = useRoute();
    const { mealType, date } = (route.params ?? {}) as { mealType?: string; date?: string };


    if (!permission) {
        return <View />;
    }

    if (!permission.granted) {
        return (
            <View style={styles.center}>
                <Text style={styles.message}>Camera access is needed to scan barcodes</Text>
                <TouchableOpacity style={styles.button} onPress={requestPermission}>
                    <Text style={styles.buttonText}>Grant Permission</Text>
                </TouchableOpacity>
            </View>
        );
    }

    function handleBarcodeScan({ data }: { data: string }) {
        if (scanned) return;
        setScanned(true);
        (navigation as any).navigate('AddFood', { barcode: data, mealType, date });
    }

    return (
        <View style={styles.container}>
            <CameraView
                style={styles.camera}
                facing="back"
                onBarcodeScanned={handleBarcodeScan}
                barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }}
            />
            <View style={styles.overlay}>
                <Text style={styles.hint}>Point at a barcode</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  camera: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  message: { fontSize: 16, textAlign: 'center', marginBottom: 20 },
  button: { backgroundColor: '#007AFF', padding: 14, borderRadius: 8 },
  buttonText: { color: 'white', fontWeight: '600' },
  overlay: { position: 'absolute', bottom: 40, left: 0, right: 0, alignItems: 'center' },
  hint: { color: 'white', fontSize: 16, fontWeight: '500', backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
});