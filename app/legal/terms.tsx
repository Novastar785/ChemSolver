import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';

import { useTranslation } from 'react-i18next';

export default function TermsOfServiceScreen() {
    const router = useRouter();
    const { t } = useTranslation();

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                        <ChevronLeft size={28} color="#FFF" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>{t('legal.terms_title')}</Text>
                    <View style={{ width: 28 }} />
                </View>

                <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                    <Text style={styles.lastUpdated}>{t('legal.last_updated', { date: 'December 21, 2025' })}</Text>

                    <Text style={styles.paragraph}>
                        {t('legal.terms.intro')}
                    </Text>

                    <Section title={t('legal.terms.section_1.title')}>
                        <Text style={styles.paragraph}>
                            {t('legal.terms.section_1.content')}
                        </Text>
                        <Text style={styles.subHeader}>{t('legal.terms.section_1.sub_reps')}</Text>
                        <Text style={styles.paragraph}>
                            {t('legal.terms.section_1.content_reps')}
                        </Text>
                    </Section>

                    <Section title={t('legal.terms.section_2.title')}>
                        <Text style={styles.paragraph}>
                            {t('legal.terms.section_2.content')}
                        </Text>
                        <Text style={[styles.subHeader, { color: '#F59E0B' }]}>{t('legal.terms.section_2.sub_ai')}</Text>
                        <Text style={styles.paragraph}>
                            {t('legal.terms.section_2.content_ai')}
                        </Text>
                    </Section>

                    <Section title={t('legal.terms.section_3.title')}>
                        <Text style={styles.paragraph}>
                            {t('legal.terms.section_3.content')}
                        </Text>
                    </Section>

                    <Section title={t('legal.terms.section_4.title')}>
                        <Text style={styles.paragraph}>
                            {t('legal.terms.section_4.content')}
                        </Text>
                    </Section>

                    <Section title={t('legal.terms.section_5.title')}>
                        <Text style={styles.paragraph}>
                            {t('legal.terms.section_5.content')}
                        </Text>
                    </Section>

                    <Section title={t('legal.terms.section_6.title')}>
                        <Text style={styles.paragraph}>
                            {t('legal.terms.section_6.content')}
                        </Text>
                    </Section>

                    <Section title={t('legal.terms.section_7.title')}>
                        <Text style={styles.paragraph}>
                            {t('legal.terms.section_7.content')}
                        </Text>
                    </Section>

                    <Section title={t('legal.terms.section_8.title')}>
                        <Text style={styles.paragraph}>
                            {t('legal.terms.section_8.content')}
                        </Text>
                    </Section>

                    <Section title={t('legal.terms.section_9.title')}>
                        <Text style={styles.paragraph}>
                            {t('legal.terms.section_9.content')}
                        </Text>
                    </Section>

                    <Section title={t('legal.terms.section_10.title')}>
                        <Text style={styles.paragraph}>
                            {t('legal.terms.section_10.content')}
                        </Text>
                    </Section>

                    <Section title={t('legal.terms.section_11.title')}>
                        <Text style={styles.paragraph}>
                            {t('legal.terms.section_11.content')}
                        </Text>
                    </Section>

                    <Section title={t('legal.terms.section_12.title')}>
                        <Text style={styles.paragraph}>
                            {t('legal.terms.section_12.content')}
                        </Text>
                    </Section>

                    <Section title={t('legal.terms.section_13.title')}>
                        <Text style={styles.paragraph}>
                            {t('legal.terms.section_13.content')}
                        </Text>
                    </Section>

                    <Section title={t('legal.terms.section_14.title')}>
                        <Text style={styles.paragraph}>
                            {t('legal.terms.section_14.content')}
                        </Text>
                    </Section>

                    <Section title={t('legal.terms.section_15.title')}>
                        <Text style={styles.paragraph}>
                            {t('legal.terms.section_15.content')}
                        </Text>
                    </Section>

                    <Section title={t('legal.terms.section_16.title')}>
                        <Text style={styles.paragraph}>
                            {t('legal.terms.section_16.content')}
                        </Text>
                    </Section>

                    <Section title={t('legal.terms.section_17.title')}>
                        <Text style={styles.paragraph}>
                            {t('legal.terms.section_17.content')}
                        </Text>
                    </Section>

                    <Section title={t('legal.terms.section_18.title')}>
                        <Text style={styles.paragraph}>
                            {t('legal.terms.section_18.content')}
                        </Text>
                    </Section>

                    <View style={{ height: 40 }} />
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

function Section({ title, children }: any) {
    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFF',
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    lastUpdated: {
        fontSize: 14,
        color: '#9CA3AF',
        marginBottom: 24,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 12,
    },
    subHeader: {
        fontSize: 16,
        fontWeight: '600',
        color: '#E5E7EB',
        marginBottom: 8,
        marginTop: 4,
    },
    paragraph: {
        fontSize: 15,
        color: '#D1D5DB',
        lineHeight: 24,
        marginBottom: 8,
    },
});
