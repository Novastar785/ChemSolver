import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import learningData from '../data/learning_modules.json';
import i18n from '../i18n';

// Random Fact Generator
const getRandomFact = () => {
    const randomItem = learningData[Math.floor(Math.random() * learningData.length)];
    const title = i18n.t(`learn.topics.${randomItem.id}.title`);
    const funFact = i18n.t(`learn.topics.${randomItem.id}.details.fun_fact`);

    if (!funFact || funFact.includes('learn.topics')) {
        return {
            title: i18n.t('notifications.default_title'),
            body: i18n.t('notifications.default_body')
        };
    }

    return {
        title: `${i18n.t('learn.fun_fact')} - ${title}`,
        body: funFact
    };
};

/**
 * Schedules daily notifications.
 * Uses lazy loading for expo-notifications to prevent crashes in Expo Go (Android) where the module is restricted.
 * In production iOS/Android builds, this works perfectly as the module is present.
 */
export async function scheduleDailyNotifications() {
    try {
        // Lazy load to safely handle environments where notifications aren't supported
        const Notifications = require('expo-notifications');

        // Configure handler
        Notifications.setNotificationHandler({
            handleNotification: async () => ({
                shouldShowAlert: true,
                shouldPlaySound: true,
                shouldSetBadge: false,
                shouldShowBanner: true,
                shouldShowList: true,
            }),
        });

        // Permission Logic
        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        if (Device.isDevice) {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;
            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }
            if (finalStatus !== 'granted') {
                console.log('Notification permissions not granted');
                return;
            }
        }

        // Schedule Logic
        const scheduled = await Notifications.getAllScheduledNotificationsAsync();

        // Limit queued notifications to avoid overflow
        if (scheduled.length > 5) {
            return;
        }

        // Reset and schedule for next week
        await Notifications.cancelAllScheduledNotificationsAsync();

        for (let i = 1; i <= 7; i++) {
            const content = getRandomFact();

            const triggerDate = new Date();
            triggerDate.setDate(triggerDate.getDate() + i);
            triggerDate.setHours(10, 0, 0, 0);

            await Notifications.scheduleNotificationAsync({
                content: {
                    title: content.title,
                    body: content.body,
                    sound: 'default',
                },
                trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.DATE,
                    date: triggerDate,
                },
            });
        }

    } catch (error) {
        // Safe fallback for dev environments
        console.warn("Notification scheduling skipped (environment limitation):", error);
    }
}
