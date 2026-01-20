
import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation } from 'expo-router';
import { BlurView } from 'expo-blur';

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const navigation = useNavigation();
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    if (permission && !permission.granted) {
      requestPermission();
    }
  }, [permission]);

  const onScan = async () => {
      // In a real scenario, this would trigger OCR
      // For this implementation, we simulate the action
      Alert.alert("OCR Scan", "Capturing text using Camera...");
      
      // Simulate processing delay
      setTimeout(() => {
          navigation.goBack();
      }, 1000);
      
      // Example of taking a picture if needed:
      // if (cameraRef.current) {
      //   const photo = await cameraRef.current.takePictureAsync();
      // }
  };

  if (!permission) return <View style={styles.container} />; // Loading permissions
  if (!permission.granted) return (
    <View style={styles.container}>
      <Text style={styles.text}>We need your permission to show the camera</Text>
      <TouchableOpacity onPress={requestPermission} style={styles.permissionButton}>
        <Text style={styles.permissionText}>Grant Permission</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        ref={cameraRef}
      />
      
      <View style={styles.overlay}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
                <Text style={styles.closeText}>Cancel</Text>
            </TouchableOpacity>
        </View>
        
        <View style={styles.scanRegion}>
            <View style={styles.scanBorder} />
            <Text style={styles.scanText}>Align formula within box</Text>
        </View>

        <View style={styles.footer}>
            <TouchableOpacity onPress={onScan} style={styles.captureButton}>
                 <BlurView intensity={50} style={StyleSheet.absoluteFill} />
                 <View style={styles.innerButton} />
            </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
  },
  text: {
      color: 'white',
      textAlign: 'center',
      marginTop: 20,
  },
  permissionButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#007AFF',
    alignSelf: 'center',
    borderRadius: 8,
  },
  permissionText: {
    color: 'white',
    fontWeight: 'bold',
  },
  overlay: {
      flex: 1,
      justifyContent: 'space-between',
  },
  header: {
      padding: 50,
      alignItems: 'flex-end',
      paddingTop: 60, // Adjust for status bar
  },
  closeButton: {
      padding: 10,
      backgroundColor: 'rgba(0,0,0,0.5)',
      borderRadius: 20,
  },
  closeText: {
      color: 'white',
      fontWeight: 'bold',
  },
  scanRegion: {
      alignItems: 'center',
      justifyContent: 'center',
  },
  scanBorder: {
      width: 300,
      height: 150,
      borderWidth: 2,
      borderColor: '#00FFFF',
      borderRadius: 20,
      backgroundColor: 'rgba(0,255,255,0.1)',
  },
  scanText: {
      color: '#00FFFF',
      marginTop: 10,
      fontWeight: '600',
  },
  footer: {
      padding: 50,
      alignItems: 'center',
      paddingBottom: 80,
  },
  captureButton: {
      width: 80,
      height: 80,
      borderRadius: 40,
      overflow: 'hidden',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 4,
      borderColor: 'white',
  },
  innerButton: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: 'white',
  }
});
