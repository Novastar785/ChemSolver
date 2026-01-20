
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    Easing,
    cancelAnimation
} from 'react-native-reanimated';

interface BohrModelProps {
    electrons?: number;
    shells?: number[];
}

// Madelung rule orbital headers for filling order
const ORBITALS = [
    { n: 1, cap: 2 },   // 1s
    { n: 2, cap: 2 },   // 2s
    { n: 2, cap: 6 },   // 2p
    { n: 3, cap: 2 },   // 3s
    { n: 3, cap: 6 },   // 3p
    { n: 4, cap: 2 },   // 4s
    { n: 3, cap: 10 },  // 3d
    { n: 4, cap: 6 },   // 4p
    { n: 5, cap: 2 },   // 5s
    { n: 4, cap: 10 },  // 4d
    { n: 5, cap: 6 },   // 5p
    { n: 6, cap: 2 },   // 6s
    { n: 4, cap: 14 },  // 4f
    { n: 5, cap: 10 },  // 5d
    { n: 6, cap: 6 },   // 6p
    { n: 7, cap: 2 },   // 7s
    { n: 5, cap: 14 },  // 5f
    { n: 6, cap: 10 },  // 6d
    { n: 7, cap: 6 },   // 7p
];

export const getElectronConfiguration = (atomicNumber: number): number[] => {
    const config = [0, 0, 0, 0, 0, 0, 0]; // K, L, M, N, O, P, Q
    let remaining = atomicNumber;

    for (const orbital of ORBITALS) {
        if (remaining <= 0) break;
        const take = Math.min(remaining, orbital.cap);
        config[orbital.n - 1] += take; // Arrays are 0-indexed (n=1 -> index 0)
        remaining -= take;
    }

    // Remove trailing zeros for clean display? No, keep 7 fixed or trim? 
    // Logic: Return full array, consumer trims.
    return config;
};

const BohrModel: React.FC<BohrModelProps> = ({ electrons, shells: shellsProp }) => {
    let shellsToDisplay: number[];

    if (shellsProp) {
        shellsToDisplay = shellsProp;
    } else if (electrons !== undefined) {
        // Determine distribution using Madelung rule
        shellsToDisplay = getElectronConfiguration(electrons).filter(count => count > 0);
    } else {
        shellsToDisplay = []; // Default to no shells if neither prop is provided
    }

    return (
        <View style={styles.container}>
            {/* Nucleus */}
            <View style={styles.nucleus} />

            {/* Shells */}
            {shellsToDisplay.map((count, index) => (
                <Shell key={index} index={index} electronsCount={count} totalShells={shellsToDisplay.length} />
            ))}
        </View>
    );
};

// Sub-component for a single shell ring + electrons
const Shell = ({ index, electronsCount, totalShells }: { index: number, electronsCount: number, totalShells: number }) => {
    const rotation = useSharedValue(0);
    // Outer shells move slower
    const duration = 2000 + (index * 1500);
    const direction = index % 2 === 0 ? 1 : -1; // Alternate direction

    useEffect(() => {
        rotation.value = withRepeat(
            withTiming(360 * direction, {
                duration: duration,
                easing: Easing.linear
            }),
            -1
        );
        return () => { cancelAnimation(rotation); };
    }, [index]);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ rotate: `${rotation.value}deg` }],
        };
    });

    // Ring size
    const size = 60 + (index * 40);
    // Nucleus is small, shells expand outward.

    return (
        <View style={[styles.shellContainer, { width: size, height: size, zIndex: 100 - index }]}>
            {/* The Ring Line */}
            <View style={[styles.ring, { width: size, height: size }]} />

            {/* Electrons Container (Rotates) */}
            <Animated.View style={[StyleSheet.absoluteFill, styles.rotatingContainer, animatedStyle]}>
                {Array.from({ length: electronsCount }).map((_, i) => {
                    // Distribute electrons evenly on the circle
                    const angle = (2 * Math.PI * i) / electronsCount;
                    // Radius is half diameter
                    const r = size / 2;
                    // Convert polar to cartesian (center is 0,0 relative to container center)
                    // Container is size x size. Center is size/2, size/2.
                    // But we can just use absolute positioning on the ring edge if we set it up right.
                    // Easier: Rotate a view that has the electron at the top, then rotate that view?
                    // No, let's just place them.

                    const left = r + r * Math.cos(angle) - 4; // -4 is half electron size
                    const top = r + r * Math.sin(angle) - 4;

                    return (
                        <View
                            key={i}
                            style={[styles.electron, { left, top }]}
                        />
                    );
                })}
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: 300,
        height: 300,
        justifyContent: 'center',
        alignItems: 'center',
        marginVertical: 20,
    },
    nucleus: {
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#FFFFFF',
        zIndex: 1000,
        // Glowing effect via shadow
        shadowColor: "#FFFFFF",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 10,
        elevation: 10,
    },
    shellContainer: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
    },
    ring: {
        position: 'absolute',
        borderRadius: 999,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    rotatingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    electron: {
        position: 'absolute',
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#00FFFF', // Cyan electrons
        shadowColor: "#00FFFF",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 4,
    }
});

export default BohrModel;
