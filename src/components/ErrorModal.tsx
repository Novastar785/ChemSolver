
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { AlertTriangle, X } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

interface ErrorModalProps {
    visible: boolean;
    message: string;
    onClose: () => void;
}

export function ErrorModal({ visible, message, onClose }: ErrorModalProps) {
    const { t } = useTranslation();

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
                            colors={['rgba(239, 68, 68, 0.2)', 'rgba(185, 28, 28, 0.2)']}
                            style={styles.iconContainer}
                        >
                            <AlertTriangle size={32} color="#EF4444" />
                        </LinearGradient>

                        <Text style={styles.title}>{t('modals.error_title')}</Text>
                        <Text style={styles.subtitle}>
                            {message}
                        </Text>

                        {/* Buttons */}
                        <TouchableOpacity activeOpacity={0.8} onPress={onClose} style={styles.buttonWrapper}>
                            <LinearGradient
                                colors={['#EF4444', '#B91C1C']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.closeButton}
                            >
                                <Text style={styles.closeText}>{t('modals.close')}</Text>
                            </LinearGradient>
                        </TouchableOpacity>
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
        borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 8,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: '#D1D5DB',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    buttonWrapper: {
        width: '100%',
    },
    closeButton: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 14,
    },
    closeText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 15,
    },
});
