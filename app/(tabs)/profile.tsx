import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Switch, Platform, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
    Shield,
    ChevronRight,
    Crown,
    Zap,
    Award,
    FlaskConical,
    FileText,
    Mail,
    RefreshCw,
    ExternalLink
} from 'lucide-react-native';

import { useRouter, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { getUserStats } from '../../src/utils/userStorage';
import { PaywallModal } from '../../src/components/PaywallModal';
import { SubscriptionService } from '../../src/services/SubscriptionService';
import { PromoService } from '../../src/services/PromoService';
import { TextInput, Modal } from 'react-native';

export default function ProfileScreen() {
    const router = useRouter();
    const { t } = useTranslation();
    const [stats, setStats] = React.useState({
        level: 1,
        xp: 0,
        solved: 0,
        progress: 0,
        rank: { title: 'Novice', color: '#9CA3AF' } // Default rank
    });
    const [showPaywall, setShowPaywall] = useState(false);
    const [isRestoring, setIsRestoring] = useState(false);
    const [isPremium, setIsPremium] = useState(false);

    // Hidden Promo Logic
    const [avatarTaps, setAvatarTaps] = useState(0);
    const [lastTapTime, setLastTapTime] = useState(0);
    const [showPromoModal, setShowPromoModal] = useState(false);
    const [promoCodeInput, setPromoCodeInput] = useState('');
    const [isRedeeming, setIsRedeeming] = useState(false);

    useFocusEffect(
        React.useCallback(() => {
            const loadStats = async () => {
                const data = await getUserStats();
                setStats(data as any);

                // Also check premium status
                const premium = await SubscriptionService.isPremium();
                setIsPremium(premium);
            };
            loadStats();
        }, [])
    );

    const handleRestore = async () => {
        setIsRestoring(true);
        const success = await SubscriptionService.restorePurchases();
        setIsRestoring(false);
        if (success) {
            setIsPremium(true);
            Alert.alert(t('common.success'), t('profile.restore_success'));
        } else {
            Alert.alert(t('common.error'), t('profile.restore_fail'));
        }
    };

    const handleManageSubscription = () => {
        if (Platform.OS === 'ios') {
            Linking.openURL('https://apps.apple.com/account/subscriptions');
        } else {
            Linking.openURL('https://play.google.com/store/account/subscriptions');
        }
    };

    const handleAvatarPress = () => {
        const now = Date.now();
        if (now - lastTapTime < 1000) {
            const newTaps = avatarTaps + 1;
            setAvatarTaps(newTaps);
            if (newTaps >= 5) { // 5 total taps
                setShowPromoModal(true);
                setAvatarTaps(0);
            }
        } else {
            setAvatarTaps(1);
        }
        setLastTapTime(now);
    };

    const handleRedeemPromo = async () => {
        if (promoCodeInput.length !== 6) return;
        setIsRedeeming(true);
        const result = await PromoService.redeemCode(promoCodeInput);
        setIsRedeeming(false);

        if (result.success) {
            setShowPromoModal(false);
            setIsPremium(true);
            Alert.alert(t('common.success'), t('profile.promo.success'));
        } else {
            Alert.alert(t('common.error'), t(result.messageKey || 'profile.promo.invalid_code'));
        }
    };

    const MENU_ITEMS = [
        { icon: Shield, labelKey: 'profile.menu.privacy', badge: null, route: '/legal/privacy' },
        { icon: FileText, labelKey: 'profile.menu.terms', badge: null, route: '/legal/terms' },
        { icon: Mail, labelKey: 'profile.menu.support', badge: null, route: 'mailto:info@rizzflows.com' },
    ];

    const SUBSCRIPTION_ITEMS = [
        { icon: RefreshCw, labelKey: 'profile.menu.restore', action: handleRestore, id: 'restore' },
        { icon: ExternalLink, labelKey: 'profile.menu.manage', action: handleManageSubscription, id: 'manage' },
    ];

    return (
        <View style={styles.container}>
            {/* Background */}
            <LinearGradient
                colors={['#000000', '#111827', '#1F2937']}
                style={StyleSheet.absoluteFill}
            />

            {/* Decorative Background Elements */}
            <View style={styles.bgGlowTop} />
            <View style={styles.bgGlowBottom} />

            <SafeAreaView style={styles.safeArea}>
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    {/* Header: Profile Card */}
                    <View style={styles.headerContainer}>
                        {Platform.OS === 'ios' ? (
                            <BlurView intensity={60} tint="systemChromeMaterialDark" style={styles.profileCard}>
                                <ProfileContent
                                    level={stats.level}
                                    progress={stats.progress}
                                    isPremium={isPremium}
                                    onAvatarPress={handleAvatarPress}
                                />
                            </BlurView>
                        ) : (
                            <View style={[styles.profileCard, styles.androidCardFallback]}>
                                <ProfileContent
                                    level={stats.level}
                                    progress={stats.progress}
                                    isPremium={isPremium}
                                    onAvatarPress={handleAvatarPress}
                                />
                            </View>
                        )}
                    </View>

                    {/* Stats Row */}
                    <View style={styles.statsRow}>
                        <StatItem label={t('profile.rank_label')} value={stats.rank.title} icon={Award} color={stats.rank.color} />
                        <StatItem label={t('profile.score_label')} value={`${stats.xp}`} icon={Zap} color="#00FFFF" />
                        <StatItem label={t('profile.solved_label')} value={`${stats.solved}`} icon={FlaskConical} color="#10B981" />
                    </View>

                    {/* Premium Banner */}
                    {!isPremium && (
                        <TouchableOpacity
                            activeOpacity={0.9}
                            style={styles.premiumBannerWrapper}
                            onPress={() => setShowPaywall(true)}
                        >
                            <LinearGradient
                                colors={['#7E22CE', '#A855F7']}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.premiumBanner}
                            >
                                <View style={styles.premiumContent}>
                                    <View style={styles.premiumIconBox}>
                                        <Crown size={24} color="#FFF" />
                                    </View>
                                    <View style={styles.premiumTextBox}>
                                        <Text style={styles.premiumTitle}>{t('profile.pro_title')}</Text>
                                        <Text style={styles.premiumSubtitle}>{t('profile.pro_subtitle')}</Text>
                                    </View>
                                </View>
                                <ChevronRight size={20} color="rgba(255,255,255,0.8)" />
                            </LinearGradient>
                        </TouchableOpacity>
                    )}

                    {/* Subscription Section */}
                    <View style={styles.menuContainer}>
                        <Text style={styles.sectionTitle}>{t('profile.pro_title')}</Text>
                        {SUBSCRIPTION_ITEMS.map((item, index) => (
                            <TouchableOpacity
                                key={item.id}
                                activeOpacity={0.7}
                                style={styles.menuItemWrapper}
                                onPress={item.action}
                            >
                                {Platform.OS === 'ios' ? (
                                    <BlurView intensity={40} tint="systemThinMaterialDark" style={styles.menuItem}>
                                        <MenuItemContent item={item} />
                                    </BlurView>
                                ) : (
                                    <View style={[styles.menuItem, styles.androidMenuFallback]}>
                                        <MenuItemContent item={item} />
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Menu Section */}
                    <View style={styles.menuContainer}>
                        <Text style={styles.sectionTitle}>{t('profile.section_general')}</Text>
                        {MENU_ITEMS.map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                activeOpacity={0.7}
                                style={styles.menuItemWrapper}
                                onPress={() => {
                                    if (item.route) {
                                        if (item.route.startsWith('mailto:')) {
                                            Linking.openURL(item.route);
                                        } else {
                                            router.push(item.route as any);
                                        }
                                    }
                                }}
                            >
                                {Platform.OS === 'ios' ? (
                                    <BlurView intensity={40} tint="systemThinMaterialDark" style={styles.menuItem}>
                                        <MenuItemContent item={item} />
                                    </BlurView>
                                ) : (
                                    <View style={[styles.menuItem, styles.androidMenuFallback]}>
                                        <MenuItemContent item={item} />
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Bottom Spacer for TabBar */}
                    <View style={{ height: 100 }} />

                </ScrollView>
            </SafeAreaView>

            <PaywallModal
                visible={showPaywall}
                onClose={() => setShowPaywall(false)}
                onSuccess={() => {
                    setShowPaywall(false);
                    setIsPremium(true);
                    Alert.alert(t('common.success'), t('profile.purchase_success'));
                }}
            />

            {/* Promo Code Modal */}
            <Modal
                visible={showPromoModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowPromoModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <BlurView intensity={90} style={styles.promoModalContainer}>
                        <Text style={styles.promoTitleModal}>{t('profile.promo.title')}</Text>
                        <Text style={styles.promoSubtitleModal}>{t('profile.promo.enter_code')}</Text>

                        <TextInput
                            style={styles.promoInput}
                            placeholder="000000"
                            placeholderTextColor="rgba(255,255,255,0.3)"
                            keyboardType="number-pad"
                            maxLength={6}
                            value={promoCodeInput}
                            onChangeText={setPromoCodeInput}
                            autoFocus
                        />

                        <View style={styles.promoButtonRow}>
                            <TouchableOpacity
                                style={styles.promoCancelBtn}
                                onPress={() => setShowPromoModal(false)}
                            >
                                <Text style={styles.promoCancelText}>{t('modals.close')}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.promoRedeemBtn, promoCodeInput.length !== 6 && styles.promoBtnDisabled]}
                                onPress={handleRedeemPromo}
                                disabled={promoCodeInput.length !== 6 || isRedeeming}
                            >
                                <Text style={styles.promoRedeemText}>
                                    {isRedeeming ? '...' : t('profile.promo.redeem')}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </BlurView>
                </View>
            </Modal>
        </View>
    );
}

// Sub-components for cleaner code
function ProfileContent({ level, progress, isPremium = false, onAvatarPress }: { level: number, progress: number, isPremium?: boolean, onAvatarPress: () => void }) {
    const { t } = useTranslation();
    return (
        <View style={styles.profileInner}>
            <TouchableOpacity
                activeOpacity={1}
                onPress={onAvatarPress}
                style={styles.avatarContainer}
            >
                <LinearGradient
                    colors={['#00FFFF', '#2563EB']}
                    style={styles.avatarGradient}
                >
                    <Text style={styles.avatarText}>CS</Text>
                </LinearGradient>
                <View style={styles.onlineBadge} />
            </TouchableOpacity>
            <View style={styles.profileInfo}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={styles.userName}>{t('profile.user_name')}</Text>
                    {isPremium && (
                        <View style={styles.premiumBadge}>
                            <Crown size={12} color="#FFF" style={{ marginRight: 4 }} />
                            <Text style={styles.premiumBadgeText}>PREMIUM</Text>
                        </View>
                    )}
                </View>
                <Text style={styles.userHandle}>{t('profile.user_handle')}</Text>
                <View style={styles.levelRow}>
                    <View style={styles.levelBadge}>
                        <Text style={styles.levelText}>{t('profile.level', { level: level })}</Text>
                    </View>
                    <View style={styles.miniProgressBarBg}>
                        <View style={[styles.miniProgressBarFill, { width: `${progress * 100}%` }]} />
                    </View>
                </View>
            </View>
        </View>
    );
}

function MenuItemContent({ item }: { item: any }) {
    const { t } = useTranslation();
    return (
        <>
            <View style={styles.menuRow}>
                <View style={[styles.menuIconBox, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                    <item.icon size={20} color="#E5E7EB" />
                </View>
                <Text style={styles.menuLabel}>{t(item.labelKey)}</Text>
            </View>
            <View style={styles.menuRight}>
                {item.badge && (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{item.badge}</Text>
                    </View>
                )}
                <ChevronRight size={18} color="#6B7280" />
            </View>
        </>
    );
}

function StatItem({ label, value, icon: Icon, color }: any) {
    return (
        <View style={styles.statItem}>
            <Icon size={18} color={color} style={{ marginBottom: 6 }} />
            <Text style={styles.statValue}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
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
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    bgGlowTop: {
        position: 'absolute',
        top: -100,
        left: -100,
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: 'rgba(0, 255, 255, 0.1)',
        // blurRadius removed as it is not a valid View style in RN
    },
    bgGlowBottom: {
        position: 'absolute',
        bottom: -50,
        right: -50,
        width: 400,
        height: 400,
        borderRadius: 200,
        backgroundColor: 'rgba(126, 34, 206, 0.1)',
    },

    // Header
    headerContainer: {
        marginBottom: 24,
        borderRadius: 24,
        overflow: 'hidden',
        // Shadow for Profile Card
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 8,
    },
    profileCard: {
        padding: 24,
        borderRadius: 24,
    },
    androidCardFallback: {
        backgroundColor: '#1E1E28',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    profileInner: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        position: 'relative',
    },
    avatarGradient: {
        width: 70,
        height: 70,
        borderRadius: 35,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    avatarText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFF',
    },
    onlineBadge: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#10B981',
        borderWidth: 2,
        borderColor: '#1F2937',
    },
    profileInfo: {
        flex: 1,
        marginLeft: 16,
    },
    userName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 4,
    },
    userHandle: {
        fontSize: 14,
        color: '#9CA3AF',
        marginBottom: 8,
    },
    levelBadge: {
        backgroundColor: 'rgba(0, 255, 255, 0.15)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: 'rgba(0, 255, 255, 0.3)',
    },
    levelText: {
        color: '#00FFFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    editIcon: {
        padding: 8,
    },

    // Stats
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#9CA3AF',
    },

    // Premium Banner
    premiumBannerWrapper: {
        marginBottom: 32,
        borderRadius: 20,
        shadowColor: '#A855F7',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    premiumBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        borderRadius: 20,
    },
    premiumContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    premiumIconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    premiumTextBox: {},
    premiumTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFF',
    },
    premiumSubtitle: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.9)',
    },

    // Menu
    menuContainer: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
        marginBottom: 12,
        marginLeft: 4,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    menuItemWrapper: {
        marginBottom: 12,
        borderRadius: 16,
        overflow: 'hidden',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 16,
    },
    androidMenuFallback: {
        backgroundColor: '#1E1E28',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    menuRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuIconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    menuLabel: {
        fontSize: 15,
        fontWeight: '500',
        color: '#E5E7EB',
    },
    menuRight: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    badge: {
        backgroundColor: '#EF4444',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 10,
        marginRight: 8,
    },
    badgeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: 'bold',
    },

    // Logout
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.3)',
        backgroundColor: 'rgba(239, 68, 68, 0.05)',
    },
    logoutText: {
        color: '#EF4444',
        fontSize: 15,
        fontWeight: '600',
        marginLeft: 8,
    },
    levelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    miniProgressBarBg: {
        height: 6,
        width: 60,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 3,
        overflow: 'hidden',
    },
    miniProgressBarFill: {
        height: '100%',
        backgroundColor: '#00FFFF',
        borderRadius: 3,
    },
    premiumBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#A855F7',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
        marginLeft: 8,
    },
    premiumBadgeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: '900',
    },
    // Promo Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    promoModalContainer: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    promoTitleModal: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 8,
    },
    promoSubtitleModal: {
        fontSize: 14,
        color: '#9CA3AF',
        textAlign: 'center',
        marginBottom: 24,
    },
    promoInput: {
        width: '100%',
        height: 60,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        color: '#FFF',
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        letterSpacing: 8,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        marginBottom: 24,
    },
    promoButtonRow: {
        flexDirection: 'row',
        gap: 12,
    },
    promoCancelBtn: {
        flex: 1,
        height: 50,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    promoCancelText: {
        color: '#FFF',
        fontSize: 15,
        fontWeight: '600',
    },
    promoRedeemBtn: {
        flex: 2,
        height: 50,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#00FFFF',
    },
    promoRedeemText: {
        color: '#000',
        fontSize: 15,
        fontWeight: 'bold',
    },
    promoBtnDisabled: {
        opacity: 0.5,
        backgroundColor: '#4B5563',
    },
});
