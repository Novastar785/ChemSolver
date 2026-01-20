import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import {
    FlaskConical,
    Droplet,
    Box,
    Sun,
    Flame,
    ShieldAlert,
    ArrowLeft,
    Atom,
    Info,
    Zap,
    BookOpen,
    Hexagon
} from 'lucide-react-native';

import learningData from '../../src/data/learning_modules.json';

const ICON_MAP: Record<string, any> = {
    'Droplet': Droplet,
    'Box': Box,
    'Sun': Sun,
    'Flame': Flame,
    'FlaskConical': FlaskConical,
    'ShieldAlert': ShieldAlert,
    'Hexagon': Hexagon
};

export default function TopicDetailScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { t } = useTranslation();

    const item = learningData.find(d => d.id === id);

    if (!item) {
        return (
            <View style={styles.container}>
                <SafeAreaView>
                    <Text style={{ color: 'white', textAlign: 'center' }}>Item not found</Text>
                    <TouchableOpacity onPress={() => router.back()}>
                        <Text style={{ color: 'white', textAlign: 'center', marginTop: 20 }}>Go Back</Text>
                    </TouchableOpacity>
                </SafeAreaView>
            </View>
        );
    }

    const Icon = ICON_MAP[item.icon] || Atom;

    // Fetch translated content
    const title = t(`learn.topics.${item.id}.title`);
    const origin = t(`learn.topics.${item.id}.details.origin`);
    const structure = t(`learn.topics.${item.id}.details.structure`);
    const process = t(`learn.topics.${item.id}.details.process`);
    const funFact = t(`learn.topics.${item.id}.details.fun_fact`);
    const propertiesText = t(`learn.topics.${item.id}.details.properties`);

    // Steps might be an array
    const steps = t(`learn.topics.${item.id}.details.reaction_steps`, { returnObjects: true });
    const hasSteps = Array.isArray(steps);

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            <LinearGradient
                colors={['#000000', '#111827']}
                style={StyleSheet.absoluteFill}
            />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Header Section */}
                <View style={styles.headerContainer}>
                    <LinearGradient
                        colors={[item.color, 'transparent']}
                        style={styles.headerGradient}
                        start={{ x: 0.5, y: 0 }}
                        end={{ x: 0.5, y: 1 }}
                    />

                    <SafeAreaView edges={['top', 'left', 'right']} style={styles.safeHeader}>
                        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                            <ArrowLeft size={24} color="#FFF" />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>{t('learn.title')}</Text>
                        <View style={{ width: 24 }} />
                    </SafeAreaView>

                    <View style={styles.heroContent}>
                        <View style={[styles.iconLarge, { backgroundColor: `${item.color}30`, borderColor: item.color }]}>
                            <Icon size={64} color={item.color} />
                        </View>
                        <Text style={styles.heroTitle}>{title}</Text>
                        <Text style={[styles.heroFormula, { color: item.color }]}>{item.formula}</Text>

                        {/* Tags */}
                        <View style={styles.tagsRow}>
                            <View style={styles.tag}>
                                <Text style={styles.tagText}>{item.category?.toUpperCase() || 'CHEMISTRY'}</Text>
                            </View>
                            {(item.molar_mass || item.melting_point) && ( // Show mass or MP as example
                                <View style={styles.tag}>
                                    <Text style={styles.tagText}>{item.molar_mass || item.melting_point}</Text>
                                </View>
                            )}
                            {item.difficulty && (
                                <View style={[styles.tag, { borderColor: item.difficulty === 'beginner' ? '#10B981' : '#F59E0B' }]}>
                                    <Text style={styles.tagText}>{item.difficulty.toUpperCase()}</Text>
                                </View>
                            )}
                        </View>
                    </View>
                </View>

                {/* Content Sections */}
                <View style={styles.contentContainer}>

                    {/* Origin / History */}
                    {origin && (
                        <View style={styles.section}>
                            <SectionHeader icon={BookOpen} title={t('learn.origin')} color={item.color} />
                            <Text style={styles.sectionText}>{origin}</Text>
                        </View>
                    )}

                    {/* Structure / Process description */}
                    {(structure || process) && (
                        <View style={styles.section}>
                            <SectionHeader icon={Atom} title={structure ? t('learn.structure') : t('learn.process')} color={item.color} />
                            <Text style={styles.sectionText}>{structure || process}</Text>
                        </View>
                    )}

                    {/* Reaction Steps */}
                    {hasSteps && (
                        <View style={styles.section}>
                            <SectionHeader icon={Zap} title={t('learn.steps')} color={item.color} />
                            <View style={styles.stepsContainer}>
                                {steps.map((step: string, index: number) => (
                                    <View key={index} style={styles.stepRow}>
                                        <View style={[styles.stepNumber, { borderColor: item.color }]}>
                                            <Text style={[styles.stepNumberText, { color: item.color }]}>{index + 1}</Text>
                                        </View>
                                        <Text style={styles.stepText}>{step.replace(/^\d+\.\s*/, '')}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Properties */}
                    {propertiesText && (
                        <View style={styles.section}>
                            <SectionHeader icon={Info} title={t('learn.properties')} color={item.color} />
                            <Text style={styles.sectionText}>{propertiesText}</Text>
                        </View>
                    )}

                    {/* Fun Fact */}
                    {funFact && (
                        <View style={styles.funFactCard}>
                            <LinearGradient
                                colors={[`${item.color}20`, `${item.color}10`]}
                                style={StyleSheet.absoluteFill}
                            />
                            <View style={styles.funFactHeader}>
                                <Text style={[styles.funFactTitle, { color: item.color }]}>{t('learn.fun_fact')}</Text>
                            </View>
                            <Text style={styles.funFactText}>{funFact}</Text>
                        </View>
                    )}

                    <View style={{ height: 40 }} />
                </View>
            </ScrollView>
        </View>
    );
}

function SectionHeader({ icon: Icon, title, color }: any) {
    return (
        <View style={styles.sectionHeader}>
            <Icon size={18} color={color} style={{ marginRight: 8 }} />
            <Text style={styles.sectionTitle}>{title}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    scrollContent: {
        paddingBottom: 40,
    },
    headerContainer: {
        position: 'relative',
        paddingBottom: 20,
    },
    headerGradient: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 300,
        opacity: 0.3,
    },
    safeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    backButton: {
        padding: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    headerTitle: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 16,
        fontWeight: '600',
    },
    heroContent: {
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    iconLarge: {
        width: 100,
        height: 100,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
    },
    heroTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFF',
        textAlign: 'center',
        marginBottom: 8,
    },
    heroFormula: {
        fontSize: 20,
        fontWeight: 'bold',
        fontFamily: 'monospace', // Use monospace font for formula
        letterSpacing: 1,
        marginBottom: 16,
    },
    tagsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 8,
    },
    tag: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
    },
    tagText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 12,
        fontWeight: '600',
    },
    contentContainer: {
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    section: {
        marginBottom: 32,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFF',
    },
    sectionText: {
        fontSize: 16,
        color: '#D1D5DB', // Gray-300
        lineHeight: 24,
    },
    stepsContainer: {
        marginTop: 8,
    },
    stepRow: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    stepNumber: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 1.5,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
        marginTop: -2, // Align with text top
    },
    stepNumberText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    stepText: {
        flex: 1,
        fontSize: 15,
        color: '#E5E7EB',
        lineHeight: 22,
    },
    funFactCard: {
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        overflow: 'hidden',
    },
    funFactHeader: {
        marginBottom: 8,
    },
    funFactTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    funFactText: {
        fontSize: 16,
        color: '#FFF',
        fontStyle: 'italic',
        lineHeight: 24,
    }
});
