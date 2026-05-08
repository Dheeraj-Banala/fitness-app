import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors } from '../theme';

export default function BarcodeScannerScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const route = useRoute();
  const { mealType, date } = (route.params ?? {}) as { mealType?: string; date?: string };

  if (!permission) {
    return <View style={styles.screen} />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.screen, styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.permissionMessage}>Camera access is needed to scan barcodes</Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>Grant Permission</Text>
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
    <View style={styles.screen}>
      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={handleBarcodeScan}
        barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }}
      />
      <View style={[styles.hintContainer, { bottom: insets.bottom + 32 }]}>
        <Text style={styles.hint}>Point at a barcode</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  camera: { flex: 1 },

  center: { justifyContent: 'center', alignItems: 'center', padding: 32 },
  permissionMessage: { fontSize: 16, color: colors.textPrimary, textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  permissionBtn: { backgroundColor: colors.blue, paddingVertical: 13, paddingHorizontal: 28, borderRadius: 12 },
  permissionBtnText: { color: 'white', fontWeight: '600', fontSize: 15 },

  hintContainer: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  hint: { color: 'white', fontSize: 15, fontWeight: '500', backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 18, paddingVertical: 9, borderRadius: 10, overflow: 'hidden' },
});
