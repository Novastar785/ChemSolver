import { Tabs } from 'expo-router';
import React from 'react';
import { BlurView } from 'expo-blur';
import { StyleSheet, View, Text, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Grid3X3, FlaskConical, Trophy, User, BookOpen } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import { useTranslation } from 'react-i18next';

export default function TabLayout() {
    const { width } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const { t } = useTranslation();

    return (
        <Tabs
            tabBar={({ state, descriptors, navigation }) => {
                const barWidth = Math.min(width * 0.85, 360);

                return (
                    <View style={[styles.tabBarContainer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                        <BlurView
                            intensity={80}
                            tint="systemChromeMaterialDark"
                            style={[
                                styles.floatingBar,
                                { width: barWidth, overflow: 'hidden', borderRadius: 9999 }
                            ]}
                        >
                            {/* Inner semi-transparent layer for better contrast */}
                            <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.15)' }]} />

                            <View style={styles.tabItemsRawContainer}>
                                {state.routes.map((route, index) => {
                                    const { options } = descriptors[route.key];
                                    const label = options.tabBarLabel !== undefined
                                        ? options.tabBarLabel
                                        : options.title !== undefined
                                            ? options.title
                                            : route.name;

                                    const isFocused = state.index === index;

                                    const onPress = () => {
                                        Haptics.selectionAsync(); // Add haptic feedback
                                        const event = navigation.emit({
                                            type: 'tabPress',
                                            target: route.key,
                                            canPreventDefault: true,
                                        });

                                        if (!isFocused && !event.defaultPrevented) {
                                            navigation.navigate(route.name);
                                        }
                                    };

                                    let IconComponent = Grid3X3;
                                    if (route.name === 'index') IconComponent = Grid3X3;
                                    else if (route.name === 'solver') IconComponent = FlaskConical;
                                    else if (route.name === 'challenge') IconComponent = Trophy;
                                    else if (route.name === 'learn') IconComponent = BookOpen;
                                    else if (route.name === 'profile') IconComponent = User;

                                    return (
                                        <TouchableOpacity
                                            key={index}
                                            activeOpacity={0.7}
                                            onPress={onPress}
                                            style={styles.tabItem}
                                            accessibilityRole="tab"
                                            accessibilityState={{ selected: isFocused }}
                                        >
                                            <View style={[styles.iconContainer, isFocused && styles.iconContainerActive]}>
                                                <IconComponent
                                                    size={24}
                                                    color={isFocused ? '#00FFFF' : '#9CA3AF'}
                                                    strokeWidth={isFocused ? 2.5 : 2}
                                                />
                                            </View>
                                            <Text style={[styles.label, isFocused ? styles.labelActive : styles.labelInactive]}>
                                                {label as string}
                                            </Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        </BlurView>
                    </View>
                );
            }}
            screenOptions={{
                headerShown: false,
                sceneStyle: { backgroundColor: 'transparent' }
            }}>
            <Tabs.Screen name="index" options={{ title: t('tabs.table') }} />
            <Tabs.Screen name="learn" options={{ title: t('tabs.learn') }} />
            <Tabs.Screen name="challenge" options={{ title: t('tabs.challenge') }} />
            <Tabs.Screen name="solver" options={{ title: t('tabs.solver') }} />
            <Tabs.Screen name="profile" options={{ title: t('tabs.profile') }} />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    tabBarContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        alignItems: 'center',
        zIndex: 50,
    },
    floatingBar: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 10,
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    tabItemsRawContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingVertical: 8, // Reduced from 12
        paddingHorizontal: 4,
    },
    tabItem: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 2,
        paddingHorizontal: 8,
        flex: 1,
    },
    iconContainer: {
        marginBottom: 2, // Reduced from 4
        padding: 5, // Reduced from 6
        borderRadius: 14,
    },
    iconContainerActive: {
        backgroundColor: 'rgba(0, 255, 255, 0.1)',
    },
    label: {
        fontSize: 10,
        fontWeight: '500',
    },
    labelActive: {
        color: '#00FFFF',
        fontWeight: 'bold',
    },
    labelInactive: {
        color: '#9CA3AF',
    },
});
