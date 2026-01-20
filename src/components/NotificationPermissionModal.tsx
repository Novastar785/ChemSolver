
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Bell, X, Check } from 'lucide-react-native';
import * as Notifications from 'expo-notifications';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

interface NotificationModalProps {
    onPermissionGranted?: () => void;
}

export function NotificationPermissionModal({ onPermissionGranted }: NotificationModalProps) {
    const { t } = useTranslation();
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        checkPermission();
    }, []);

    const checkPermission = async () => {
        try {
            const { status } = await Notifications.getPermissionsAsync();
            // Show modal only if status is undetermined (not asked yet)
            if (status === 'undetermined') {
                setVisible(true);
            }
        } catch (e) {
            console.log('Error checking notification permission', e);
        }
    };

    const handleAllow = async () => {
        try {
            const { status } = await Notifications.requestPermissionsAsync();
            if (status === 'granted') {
                if (onPermissionGranted) onPermissionGranted();
            }
            setVisible(false);
        } catch (e) {
            console.log('Error requesting permission', e);
            setVisible(false);
        }
    };

    const handleSkip = () => {
        setVisible(false);
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
                            colors={['rgba(0, 255, 255, 0.2)', 'rgba(37, 99, 235, 0.2)']}
                            style={styles.iconContainer}
                        >
                            <Bell size={32} color="#00FFFF" />
                        </LinearGradient>

                        <Text style={styles.title}>{t('modals.notifications_title')}</Text>
                        <Text style={styles.subtitle}>
                            {t('modals.notifications_desc')}
                        </Text>

                        {/* Buttons */}
                        <View style={styles.buttonContainer}>
                            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                                <Text style={styles.skipText}>{t('modals.later')}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity activeOpacity={0.8} onPress={handleAllow}>
                                <LinearGradient
                                    colors={['#00FFFF', '#2563EB']}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.allowButton}
                                >
                                    <Text style={styles.allowText}>{t('modals.enable_notifications')}</Text>
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
        backgroundColor: 'rgba(0,0,0,0.6)',
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
        borderColor: 'rgba(0, 255, 255, 0.3)',
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
