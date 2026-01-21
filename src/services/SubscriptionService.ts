import AsyncStorage from '@react-native-async-storage/async-storage';
import Purchases, { PurchasesPackage, CustomerInfo, LOG_LEVEL } from 'react-native-purchases';
import { Platform } from 'react-native';
import { PromoService } from './PromoService';
import { SUPABASE_CONFIG } from '../config/supabase';

const STORAGE_KEYS = {
    DAILY_COUNT: 'chemsolver_daily_scans',
    LAST_DATE: 'chemsolver_last_scan_date',
};

const MAX_FREE_SCANS = 2;

// ENTITLEMENT ID DEFINITION
const ENTITLEMENT_ID = 'ChemSolver Premium'; // Ensure this matches your RevenueCat Entitlement

export const SubscriptionService = {

    async init(): Promise<void> {
        try {
            if (Platform.OS === 'ios') {
                Purchases.configure({ apiKey: SUPABASE_CONFIG.REVENUECAT_API_KEYS.ios });
            } else if (Platform.OS === 'android') {
                Purchases.configure({ apiKey: SUPABASE_CONFIG.REVENUECAT_API_KEYS.android });
            }
            // Purchases.setLogLevel(LOG_LEVEL.DEBUG); // Enable for debugging
        } catch (e) {
            console.log('Error initializing RevenueCat', e);
        }
    },

    /**
     * Resets the counter if the day has changed.
     */
    async checkAndResetDailyLimit(): Promise<void> {
        try {
            const lastDate = await AsyncStorage.getItem(STORAGE_KEYS.LAST_DATE);
            const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

            if (lastDate !== today) {
                // New day (or first time), reset count
                await AsyncStorage.setItem(STORAGE_KEYS.DAILY_COUNT, '0');
                await AsyncStorage.setItem(STORAGE_KEYS.LAST_DATE, today);
                console.log('Daily scan limit reset for:', today);
            }
        } catch (e) {
            console.error('Error checking daily limit:', e);
        }
    },

    /**
     * Checks if the user can perform a scan.
     * Returns true if allowed, false if limit reached (and user is not premium).
     */
    async canScan(): Promise<boolean> {
        try {
            const isPremium = await this.isPremium();
            if (isPremium) return true;

            await this.checkAndResetDailyLimit();

            const countStr = await AsyncStorage.getItem(STORAGE_KEYS.DAILY_COUNT);
            const count = parseInt(countStr || '0', 10);

            return count < MAX_FREE_SCANS;
        } catch (e) {
            console.error('Error checking scan capability:', e);
            return false; // Fail safe
        }
    },

    /**
     * Increments the scan count. Call this after a successful scan.
     */
    async incrementScanCount(): Promise<void> {
        try {
            const isPremium = await this.isPremium();
            if (isPremium) return; // Don't count for premium

            await this.checkAndResetDailyLimit();

            const countStr = await AsyncStorage.getItem(STORAGE_KEYS.DAILY_COUNT);
            const count = parseInt(countStr || '0', 10);

            await AsyncStorage.setItem(STORAGE_KEYS.DAILY_COUNT, (count + 1).toString());
            console.log('Scan count incremented to:', count + 1);
        } catch (e) {
            console.error('Error incrementing scan count:', e);
        }
    },

    /**
     * Gets the remaining free scans for today.
     */
    async getRemainingFreeScans(): Promise<number> {
        try {
            const isPremium = await this.isPremium();
            if (isPremium) return 999;

            await this.checkAndResetDailyLimit();

            const countStr = await AsyncStorage.getItem(STORAGE_KEYS.DAILY_COUNT);
            const count = parseInt(countStr || '0', 10);

            return Math.max(0, MAX_FREE_SCANS - count);
        } catch (e) {
            return 0;
        }
    },

    /**
     * Checks premium status via RevenueCat OR active Promo trial
     */
    async isPremium(): Promise<boolean> {
        try {
            // 1. Check Promo Status first (fastest, local)
            const isPromoActive = await PromoService.isPromoActive();
            if (isPromoActive) return true;

            // 2. Check RevenueCat
            const customerInfo = await Purchases.getCustomerInfo();
            return typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== "undefined";
        } catch (e) {
            return false;
        }
    },

    /**
     * Fetch available offerings (products)
     */
    async getOfferings(): Promise<PurchasesPackage[] | null> {
        try {
            const offerings = await Purchases.getOfferings();
            if (offerings.current !== null && offerings.current.availablePackages.length !== 0) {
                return offerings.current.availablePackages;
            }
            return null;
        } catch (e) {
            console.log('Error fetching offerings', e);
            return null;
        }
    },

    async purchasePackage(pack: PurchasesPackage): Promise<boolean> {
        try {
            const { customerInfo } = await Purchases.purchasePackage(pack);
            return typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== "undefined";
        } catch (e: any) {
            if (!e.userCancelled) {
                console.log('Error purchasing package', e);
            }
            return false;
        }
    },

    async restorePurchases(): Promise<boolean> {
        try {
            const customerInfo = await Purchases.restorePurchases();
            return typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== "undefined";
        } catch (e) {
            console.log('Error restoring purchases', e);
            return false;
        }
    }
};
