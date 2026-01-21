import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useRouter } from 'expo-router';
// import ChemistryKeyboard from '../../src/components/ChemistryKeyboard'; // No longer used
import GlassCard from '../../src/components/GlassCard';

import { useTranslation } from 'react-i18next';
import { SUPABASE_CONFIG } from '../../src/config/supabase';

import * as ImagePicker from 'expo-image-picker';
// @ts-ignore
import * as FileSystem from 'expo-file-system/legacy';
import * as Haptics from 'expo-haptics';
import * as Sharing from 'expo-sharing';
import * as StoreReview from 'expo-store-review';
import { captureRef } from 'react-native-view-shot';
import { ScrollView, ViewStyle } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Scan, Image as ImageIcon, CheckCircle, Smartphone, Camera, X, Share as ShareIcon } from 'lucide-react-native';
import { CameraPermissionModal } from '../../src/components/CameraPermissionModal';
import { ErrorModal } from '../../src/components/ErrorModal';
import { SubscriptionService } from '../../src/services/SubscriptionService';
import { PaywallModal } from '../../src/components/PaywallModal';

export default function SolverScreen() {
    const { t, i18n } = useTranslation();
    const router = useRouter();
    const [image, setImage] = useState<string | null>(null);
    const [processing, setProcessing] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [showCameraPermission, setShowCameraPermission] = useState(false);
    const [showPaywall, setShowPaywall] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    // Initialize Subscription Service
    useEffect(() => {
        SubscriptionService.init();
    }, []);

    // Reset state when leaving the screen
    useFocusEffect(
        useCallback(() => {
            return () => {
                setImage(null);
                setResult(null);
                setProcessing(false);
            };
        }, [])
    );

    /**
     * Wrapper to check if user has free scans left or is premium
     */
    const checkScansAndProceed = async (action: () => void) => {
        const canScan = await SubscriptionService.canScan();
        if (canScan) {
            action();
        } else {
            setShowPaywall(true);
        }
    };

    const pickImage = async () => {
        checkScansAndProceed(async () => {
            let result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images, // Corrected Enum access
                allowsEditing: true,
                // aspect: [4, 3], // Removed to allow free cropping
                quality: 1,
            });

            if (!result.canceled) {
                processImage(result.assets[0].uri);
            }
        });
    };

    const takePhoto = async () => {
        checkScansAndProceed(async () => {
            // Check Status FIRST
            const { status } = await ImagePicker.getCameraPermissionsAsync();

            if (status === 'granted') {
                // Already granted, just open camera
                launchCamera();
            } else {
                // Not granted, show OUR nice modal
                setShowCameraPermission(true);
            }
        });
    };

    const launchCamera = async () => {
        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            // aspect: [4, 3], // Removed to allow free cropping
            quality: 0.5,
        });

        if (!result.canceled) {
            processImage(result.assets[0].uri);
        }
    };

    const shareRef = useRef(null);

    const handleShare = async () => {
        try {
            if (shareRef.current) {
                const uri = await captureRef(shareRef.current, {
                    format: 'png',
                    quality: 1,
                });
                await Sharing.shareAsync(uri);
            }
        } catch (error) {
            console.error('Sharing failed', error);
        }
    };

    // Real API Processing
    const processImage = async (uri: string) => {
        setImage(uri);
        setProcessing(true);
        setResult(null);

        try {
            // 1. Convert Image to Base64
            const base64 = await FileSystem.readAsStringAsync(uri, {
                encoding: 'base64',
            });

            // 2. Call Edge Function
            const response = await fetch(SUPABASE_CONFIG.FUNCTION_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${SUPABASE_CONFIG.ANON_KEY}`
                },
                body: JSON.stringify({
                    imageBase64: base64,
                    language: i18n.language || 'en' // Default to English if undefined
                })
            });

            const data = await response.json();

            if (data.error) {
                throw new Error(data.error);
            }

            // 3. Set Result
            setResult(data);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            // 4. Increment usage count if successful
            await SubscriptionService.incrementScanCount();

            // 5. Optionally request review (not every time, logic can be refined)
            if (await StoreReview.hasAction()) {
                StoreReview.requestReview();
            }

        } catch (error: any) {
            console.error("Solver Error:", error);
            setErrorMsg(t('solver.error_msg', { error: error.message || "Failed to analyze image" }));
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#000000', '#1a1a2e']}
                style={StyleSheet.absoluteFill}
            />

            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <Text style={styles.title}>{t('solver.title')}</Text>
                    <Text style={styles.subtitle}>{t('solver.subtitle')}</Text>
                </View>

                {!image ? (
                    <View style={styles.startContainer}>
                        <TouchableOpacity style={styles.scanButton} onPress={takePhoto}>
                            <LinearGradient
                                colors={['#00FFFF', '#2563EB']}
                                style={styles.scanGradient}
                            >
                                <Camera size={40} color="#FFF" />
                                <Text style={styles.scanText}>{t('solver.scan_camera')}</Text>
                            </LinearGradient>
                        </TouchableOpacity>

                        <Text style={styles.orText}>OR</Text>

                        <TouchableOpacity style={styles.galleryButton} onPress={pickImage}>
                            <ImageIcon size={24} color="#A78BFA" />
                            <Text style={styles.galleryText}>{t('solver.scan_gallery')}</Text>
                        </TouchableOpacity>

                        <Text style={styles.hintText}>{t('solver.hint')}</Text>
                    </View>
                ) : (
                    <View style={styles.resultContainer}>
                        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                            <View style={styles.imagePreviewContainer}>
                                <Image source={{ uri: image }} style={styles.imagePreview} />

                                {/* Close Button Overlay */}
                                {!processing && (
                                    <TouchableOpacity style={styles.closeButton} onPress={() => setImage(null)}>
                                        <X size={20} color="#FFF" />
                                    </TouchableOpacity>
                                )}

                                {processing && (
                                    <View style={styles.processingOverlay}>
                                        <ActivityIndicator size="large" color="#00FFFF" />
                                        <Text style={styles.processingText}>{t('solver.analyzing')}</Text>
                                    </View>
                                )}
                            </View>

                            {!processing && result && (
                                <GlassCard style={styles.resultCard} intensity={25}>
                                    <View style={styles.detectedContainer}>
                                        <Text style={styles.detectedLabel}>{t('solver.detected')}</Text>
                                        <Text style={styles.questionText}>"{result.question}"</Text>
                                    </View>

                                    <View style={styles.divider} />

                                    {/* Final Result Highlight */}
                                    <LinearGradient
                                        colors={['rgba(16, 185, 129, 0.2)', 'rgba(5, 150, 105, 0.2)']}
                                        style={styles.answerContainer}
                                    >
                                        <Text style={styles.answerLabel}>FINAL SOLUTION</Text>
                                        <Text style={styles.answerText}>{result.answer}</Text>
                                    </LinearGradient>

                                    <Text style={styles.stepsTitle}>{t('solver.steps')}</Text>
                                    <View style={styles.stepsContainer}>
                                        {result.steps.map((step: string, index: number) => (
                                            <View key={index} style={styles.stepRow}>
                                                <View style={styles.stepNumberBadge}>
                                                    <Text style={styles.stepNumber}>{index + 1}</Text>
                                                </View>
                                                <Text style={styles.stepText}>{step}</Text>
                                            </View>
                                        ))}
                                    </View>

                                    <View style={styles.buttonsRow}>
                                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: 'rgba(255,255,255,0.1)' }]} onPress={handleShare}>
                                            <ShareIcon size={18} color="#FFF" />
                                            <Text style={[styles.actionBtnText, { color: '#FFF' }]}>Share</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#00FFFF', flex: 1 }]} onPress={() => setImage(null)}>
                                            <Scan size={18} color="#000" />
                                            <Text style={[styles.actionBtnText, { color: '#000' }]}>{t('solver.new_scan')}</Text>
                                        </TouchableOpacity>
                                    </View>

                                    <Text style={styles.aiDisclaimer}>
                                        AI-generated content. Review before use.
                                    </Text>
                                </GlassCard>
                            )}

                            {/* Spacer for bottom tab bar */}
                            <View style={{ height: 100 }} />
                        </ScrollView>
                    </View>
                )
                }

                {/* Hidden Shareable View */}
                {result && (
                    <View
                        ref={shareRef}
                        collapsable={false}
                        style={styles.shareHiddenContainer}
                    >
                        {/* Header: PROBLEM TEXT (Explicitly requested NOT to use image) */}
                        <View style={styles.shareHeader}>
                            <Text style={styles.shareLabel}>{t('share.problem')}</Text>
                            <Text style={styles.shareProblemText}>"{result.question}"</Text>
                        </View>

                        {/* Result Pill */}
                        <View style={styles.shareResultPill}>
                            <Text style={styles.shareAnswerLabel}>{t('share.solution')}</Text>
                            <Text style={styles.shareAnswerText}>{result.answer}</Text>
                        </View>

                        {/* Steps */}
                        <Text style={styles.shareStepsTitle}>{t('share.steps_title')}</Text>
                        <View style={styles.shareStepsContainer}>
                            {result.steps.map((step: string, index: number) => (
                                <View key={index} style={styles.shareStepRow}>
                                    <View style={styles.shareStepBadge}>
                                        <Text style={styles.shareStepNum}>{index + 1}</Text>
                                    </View>
                                    <Text style={styles.shareStepText}>{step}</Text>
                                </View>
                            ))}
                        </View>

                        {/* Footer Watermark */}
                        <View style={styles.shareFooter}>
                            <Text style={styles.shareFooterText}>{t('share.generated_with')} Periodictable AI: ChemSolver</Text>
                        </View>
                    </View>
                )}

                <CameraPermissionModal
                    visible={showCameraPermission}
                    onClose={() => setShowCameraPermission(false)}
                    onPermissionGranted={() => {
                        // Permission was just granted in the modal, now open camera
                        launchCamera();
                    }}
                />

                <ErrorModal
                    visible={!!errorMsg}
                    message={errorMsg || ''}
                    onClose={() => setErrorMsg(null)}
                />

                {/* Paywall Modal */}
                <PaywallModal
                    visible={showPaywall}
                    onClose={() => setShowPaywall(false)}
                    onSuccess={() => {
                        // Optionally refresh state or auto-start the last requested action
                        setShowPaywall(false);
                    }}
                />

            </SafeAreaView >
        </View >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        padding: 20,
        zIndex: 10,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 15,
        textAlign: 'center',
        letterSpacing: 1,
    },
    inputCard: {
        padding: 15,
        borderRadius: 15,
    },
    input: {
        fontSize: 24,
        color: '#FFFFFF',
        fontWeight: '500',
    },
    solutionCard: {
        marginTop: 15,
        padding: 15,
        borderRadius: 15,
    },
    solutionTitle: {
        color: '#00FFFF',
        fontWeight: 'bold',
        marginBottom: 5,
    },
    solutionText: {
        color: '#FFFFFF',
        fontSize: 16,
        marginBottom: 4,
    },
    solutionSummary: {
        color: 'rgba(255,255,255,0.7)',
        marginTop: 5,
        fontStyle: 'italic',
    },
    spacer: {
        flex: 1,
    },
    subtitle: {
        fontSize: 16,
        color: '#9CA3AF',
        textAlign: 'center',
        marginTop: -10,
        marginBottom: 30,
    },
    startContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    scanButton: {
        width: 200,
        height: 200,
        borderRadius: 100,
        marginBottom: 30,
        shadowColor: '#00FFFF',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    scanGradient: {
        width: '100%',
        height: '100%',
        borderRadius: 100,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 4,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    scanText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFF',
        marginTop: 15,
        letterSpacing: 1,
    },
    orText: {
        color: '#9CA3AF',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 30,
    },
    galleryButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 30,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    galleryText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 10,
    },
    hintText: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 13,
        textAlign: 'center',
        marginTop: 40,
        maxWidth: 250,
        lineHeight: 20,
    },
    resultContainer: {
        flex: 1,
        padding: 20,
    },
    imagePreviewContainer: {
        height: 200,
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        backgroundColor: '#111',
    },
    imagePreview: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
        opacity: 0.7,
    },
    processingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    processingText: {
        color: '#00FFFF',
        marginTop: 15,
        fontSize: 16,
        fontWeight: '600',
    },
    resultCard: {
        padding: 24,
        borderRadius: 24,
    },
    detectedContainer: {
        marginBottom: 10,
    },
    detectedLabel: {
        color: '#6B7280',
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginBottom: 4,
        letterSpacing: 1,
    },
    questionText: {
        color: '#E5E7EB',
        fontSize: 16,
        fontStyle: 'italic',
        fontWeight: '500',
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginVertical: 15,
    },
    answerContainer: {
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.4)',
        marginBottom: 25,
    },
    answerLabel: {
        color: '#10B981',
        fontSize: 11,
        fontWeight: '900',
        letterSpacing: 1,
        marginBottom: 6,
        textTransform: 'uppercase',
    },
    answerText: {
        color: '#FFF',
        fontSize: 22,
        fontWeight: 'bold',
    },
    stepsTitle: {
        color: '#A855F7', // Changed to purple for distinction
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 15,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    stepsContainer: {
        gap: 12,
    },
    stepRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    stepNumberBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
        marginTop: 2,
    },
    stepNumber: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    stepText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 15,
        flex: 1,
        lineHeight: 22,
    },
    newScanBtn: {
        backgroundColor: '#00FFFF',
        marginTop: 20,
        paddingVertical: 12,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    newScanText: {
        color: '#000',
        fontWeight: 'bold',
        marginLeft: 8,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    closeButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(0,0,0,0.6)',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
        zIndex: 20,
    },
    aiDisclaimer: {
        textAlign: 'center',
        color: 'rgba(255,255,255,0.4)',
        fontSize: 10,
        marginTop: 15,
    },
    buttonsRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 20,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 12,
        gap: 8,
    },
    actionBtnText: {
        fontWeight: 'bold',
        fontSize: 15,
    },
    // Hidden Share View Styles
    shareHiddenContainer: {
        position: 'absolute',
        left: -10000,
        top: 0,
        width: 400, // Fixed width for consistent capture
        backgroundColor: '#111827', // Dark background
        padding: 30,
    },
    shareHeader: {
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
        paddingBottom: 20,
    },
    shareLabel: {
        color: '#6B7280',
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        marginBottom: 8,
        letterSpacing: 1,
    },
    shareProblemText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '500',
        lineHeight: 26,
    },
    shareResultPill: {
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        borderWidth: 1,
        borderColor: 'rgba(16, 185, 129, 0.5)',
        padding: 20,
        borderRadius: 16,
        marginBottom: 25,
    },
    shareAnswerLabel: {
        color: '#10B981',
        fontSize: 11,
        fontWeight: '900',
        letterSpacing: 1,
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    shareAnswerText: {
        color: '#FFF',
        fontSize: 24,
        fontWeight: 'bold',
    },
    shareStepsContainer: {
        marginBottom: 30,
    },
    shareStepsTitle: {
        color: '#A855F7',
        fontSize: 14,
        fontWeight: 'bold',
        marginBottom: 15,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    shareStepRow: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    shareStepBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
        marginTop: 2,
    },
    shareStepNum: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    shareStepText: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 14,
        flex: 1,
        lineHeight: 20,
    },
    shareFooter: {
        marginTop: 20,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
    },
    shareFooterText: {
        color: '#6B7280',
        fontSize: 12,
        fontWeight: '600',
        fontStyle: 'italic',
    }
});
