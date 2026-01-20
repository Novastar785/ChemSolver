import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTranslation } from 'react-i18next';
import {
    FlaskConical,
    Droplet,
    Box,
    Sun,
    Flame,
    ShieldAlert,
    Search,
    Atom,
    BookOpen,
    Hexagon
} from 'lucide-react-native';

// Import data
import learningData from '../../src/data/learning_modules.json';

// Icon mapping
const ICON_MAP: Record<string, any> = {
    'Droplet': Droplet,
    'Box': Box,
    'Sun': Sun,
    'Flame': Flame,
    'FlaskConical': FlaskConical,
    'ShieldAlert': ShieldAlert,
    'Hexagon': Hexagon
};

export default function LearnScreen() {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'all' | 'compound' | 'reaction'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredData = useMemo(() => {
        return learningData.filter(item => {
            const matchesTab = activeTab === 'all' || item.type === activeTab;

            // Search in translated title/desc if possible, or fallback to raw ID/Formula
            // We use keys like `learn.topics.water.title`
            const title = t(`learn.topics.${item.id}.title`).toLowerCase();
            const desc = t(`learn.topics.${item.id}.description`).toLowerCase();
            const query = searchQuery.toLowerCase();

            const matchesSearch = title.includes(query) ||
                desc.includes(query) ||
                item.formula.toLowerCase().includes(query);

            return matchesTab && matchesSearch;
        });
    }, [activeTab, searchQuery, t]);

    return (
        <View style={styles.container}>
            {/* Background */}
            <LinearGradient
                colors={['#000000', '#111827', '#064E3B']} // Slight green tint for "growth/learning"
                style={StyleSheet.absoluteFill}
            />

            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <Text style={styles.title}>{t('learn.title')}</Text>
                    <Text style={styles.subtitle}>{t('learn.subtitle')}</Text>
                </View>

                {/* Filter Tabs & Search */}
                <View style={styles.controlsContainer}>
                    {/* Search Bar */}
                    <View style={styles.searchBar}>
                        <Search size={20} color="rgba(255,255,255,0.5)" />
                        <TextInput
                            style={styles.searchInput}
                            placeholder={t('common.loading').replace('Loading...', 'Search...')} // Quick hack or add search key later
                            placeholderTextColor="rgba(255,255,255,0.3)"
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>

                    {/* Tabs */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
                        <FilterTab
                            label="All"
                            isActive={activeTab === 'all'}
                            onPress={() => setActiveTab('all')}
                        />
                        <FilterTab
                            label={t('learn.compounds')}
                            isActive={activeTab === 'compound'}
                            onPress={() => setActiveTab('compound')}
                        />
                        <FilterTab
                            label={t('learn.reactions')}
                            isActive={activeTab === 'reaction'}
                            onPress={() => setActiveTab('reaction')}
                        />
                    </ScrollView>
                </View>

                {/* Content List */}
                <ScrollView contentContainerStyle={styles.contentList} showsVerticalScrollIndicator={false}>
                    {filteredData.map((item) => (
                        <LearningCard key={item.id} item={item} />
                    ))}
                    <View style={{ height: 100 }} />
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

function FilterTab({ label, isActive, onPress }: { label: string, isActive: boolean, onPress: () => void }) {
    return (
        <TouchableOpacity
            onPress={onPress}
            style={[
                styles.filterTab,
                isActive && styles.filterTabActive
            ]}
        >
            <Text style={[styles.filterTabText, isActive && styles.filterTabTextActive]}>
                {label}
            </Text>
        </TouchableOpacity>
    );
}

function LearningCard({ item }: { item: any }) {
    const { t } = useTranslation();
    const router = useRouter();
    const Icon = ICON_MAP[item.icon] || Atom;

    return (
        <TouchableOpacity
            activeOpacity={0.9}
            style={styles.cardWrapper}
            onPress={() => router.push(`/topic/${item.id}` as any)}
        >
            {Platform.OS === 'ios' ? (
                <BlurView intensity={30} tint="systemThinMaterialDark" style={StyleSheet.absoluteFill} />
            ) : (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(30, 41, 59, 0.7)' }]} />
            )}

            <View style={styles.cardContent}>
                <View style={[styles.iconBox, { backgroundColor: `${item.color}20`, borderColor: item.color }]}>
                    <Icon size={28} color={item.color} />
                </View>

                <View style={styles.textContainer}>
                    <Text style={styles.cardTitle}>{t(`learn.topics.${item.id}.title`)}</Text>
                    <Text style={styles.cardFormula}>{item.formula}</Text>
                    <Text style={styles.cardDesc} numberOfLines={2}>
                        {t(`learn.topics.${item.id}.description`)}
                    </Text>
                </View>
            </View>
        </TouchableOpacity>
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
        paddingHorizontal: 20,
        paddingTop: 10,
        marginBottom: 20,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFF',
    },
    subtitle: {
        fontSize: 16,
        color: 'rgba(255,255,255,0.6)',
        marginTop: 4,
    },
    controlsContainer: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 44,
        marginBottom: 16,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        color: '#FFF',
        fontSize: 16,
    },
    tabsScroll: {
        flexDirection: 'row',
    },
    filterTab: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.05)',
        marginRight: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    filterTabActive: {
        backgroundColor: '#059669', // Emerald/Green theme for learning
        borderColor: '#10B981',
    },
    filterTabText: {
        color: 'rgba(255,255,255,0.6)',
        fontWeight: '600',
    },
    filterTabTextActive: {
        color: '#FFF',
    },
    contentList: {
        paddingHorizontal: 20,
    },
    cardWrapper: {
        borderRadius: 16,
        overflow: 'hidden',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    cardContent: {
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
    },
    iconBox: {
        width: 50,
        height: 50,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        marginRight: 16,
    },
    textContainer: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 2,
    },
    cardFormula: {
        fontSize: 14,
        fontFamily: Platform.select({ ios: 'Courier', android: 'monospace' }), // Monospace for formulas
        fontWeight: '700',
        color: '#10B981',
        marginBottom: 6,
    },
    cardDesc: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.6)',
        lineHeight: 18,
    },
});
