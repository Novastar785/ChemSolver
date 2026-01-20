import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
    PROMO_EXPIRY: 'chemsolver_promo_expiry',
    USED_PROMO_CODE: 'chemsolver_used_promo_code',
};

// 50 UNIQUE 6-DIGIT CODES GENERATED FOR BETA TESTING
const VALID_PROMO_CODES = [
    "128492", "394857", "506172", "837462", "192837",
    "736251", "465748", "928374", "574839", "203948",
    "817263", "627384", "495827", "102938", "748592",
    "364758", "901283", "556677", "334455", "112233",
    "998877", "776655", "554433", "332211", "102030",
    "405060", "708090", "152535", "455565", "758595",
    "121212", "343434", "565656", "787878", "909090",
    "135791", "246802", "314159", "271828", "141421",
    "173205", "223606", "316227", "412310", "519615",
    "618033", "714142", "812500", "910111", "999000"
];

export const PromoService = {
    /**
     * Checks if a promo code is valid and hasn't been used on this device.
     */
    async redeemCode(code: string): Promise<{ success: boolean; messageKey?: string }> {
        try {
            // Check if device already used a code
            const alreadyUsed = await AsyncStorage.getItem(STORAGE_KEYS.USED_PROMO_CODE);
            if (alreadyUsed) {
                return { success: false, messageKey: 'profile.promo.already_used_device' };
            }

            // Validate code
            if (!VALID_PROMO_CODES.includes(code)) {
                return { success: false, messageKey: 'profile.promo.invalid_code' };
            }

            // Set expiry date (7 days from now)
            const expiryDate = new Date();
            expiryDate.setDate(expiryDate.getDate() + 7);

            await AsyncStorage.setItem(STORAGE_KEYS.PROMO_EXPIRY, expiryDate.toISOString());
            await AsyncStorage.setItem(STORAGE_KEYS.USED_PROMO_CODE, code);

            return { success: true };
        } catch (e) {
            console.error('Error redeeming code:', e);
            return { success: false, messageKey: 'common.error' };
        }
    },

    /**
     * Checks if the current promo period is active.
     */
    async isPromoActive(): Promise<boolean> {
        try {
            const expiryStr = await AsyncStorage.getItem(STORAGE_KEYS.PROMO_EXPIRY);
            if (!expiryStr) return false;

            const expiryDate = new Date(expiryStr);
            const now = new Date();

            return now < expiryDate;
        } catch (e) {
            return false;
        }
    },

    /**
     * Gets the number of days remaining in the promo.
     */
    async getDaysRemaining(): Promise<number> {
        try {
            const expiryStr = await AsyncStorage.getItem(STORAGE_KEYS.PROMO_EXPIRY);
            if (!expiryStr) return 0;

            const expiryDate = new Date(expiryStr);
            const now = new Date();

            const diffTime = expiryDate.getTime() - now.getTime();
            return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        } catch (e) {
            return 0;
        }
    }
};
