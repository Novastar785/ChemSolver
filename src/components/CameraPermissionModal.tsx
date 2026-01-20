
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Camera, X, Check } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

interface CameraPermissionModalProps {
    visible: boolean;
    onClose: () => void;
    onPermissionGranted: () => void;
}

export function CameraPermissionModal({ visible, onClose, onPermissionGranted }: CameraPermissionModalProps) {
    const { t } = useTranslation();

    const handleAllow = async () => {
        try {
            const { status } = await ImagePicker.requestCameraPermissionsAsync();
            if (status === 'granted') {
                onPermissionGranted();
            }
            onClose(); // Close modal regardless, system prompt handles the rest or result
        } catch (e) {
            console.log('Error requesting camera permission', e);
            onClose();
        }
    };

    if (!visible) return null;

    return (
        <Modal visible={visible} transparent animationType="fade">
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Glass Background */}
                    {Platform.OS === 'ios' ? (
                        <BlurView intensity={80} tint="systemMaterialDark" style={styles.blurBg} />
                    ) : (
                        <View style={[styles.blurBg, styles.androidBg]} />
                    )}

                    <View style={styles.content}>
                        {/* Icon Header */}
                        <LinearGradient
                            colors={['rgba(16, 185, 129, 0.2)', 'rgba(5, 150, 105, 0.2)']}
                            style={styles.iconContainer}
                        >
                            <Camera size={32} color="#10B981" />
                        </LinearGradient>

                        <Text style={styles.title}>{t('modals.camera_title')}</Text>
                        <Text style={styles.subtitle}>
                            {t('modals.camera_desc')}
                        </Text>

                        {/* Buttons */}
                        <View style={styles.buttonContainer}>
                            <TouchableOpacity style={styles.skipButton} onPress={onClose}>
                                <Text style={styles.skipText}>{t('common.cancel')}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity activeOpacity={0.8} onPress={handleAllow}>
                                <LinearGradient
                                    colors={['#10B981', '#059669']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.allowButton}
                                >
                                    <Text style={styles.allowText}>{t('modals.allow_camera')}</Text>
                                    <Check size={18} color="#FFF" style={{ marginLeft: 8 }} />
                                </LinearGradient>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    container: {
        width: width * 0.85,
        borderRadius: 24,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    blurBg: {
        ...StyleSheet.absoluteFillObject,
    },
    androidBg: {
        backgroundColor: '#1E1E28',
    },
    content: {
        padding: 24,
        alignItems: 'center',
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.3)',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 12,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: '#D1D5DB',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 28,
    },
    buttonContainer: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
    },
    skipButton: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
    },
    skipText: {
        color: '#9CA3AF',
        fontWeight: '600',
        fontSize: 15,
    },
    allowButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 14,
    },
    allowText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 15,
    },
});
