import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { BlurView } from 'expo-blur';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withSequence, Easing } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import BohrModel, { getElectronConfiguration } from './BohrModel';

interface ElementData {
    number: number;
    symbol: string;
    name: string;
    atomic_mass: number;
    category: string;
    summary: string;
    density?: number;
    melt?: number; // Kelvin
    boil?: number; // Kelvin
    molar_heat?: number;
    electron_affinity?: number;
    electronegativity_pauling?: number;
    atomic_radius?: number;
    covalent_radius?: number;
    van_der_waals_radius?: number;
    ionization_energy?: number;
    standard_state?: string;
    phase?: string;
    valence_electrons?: number;
    electrical_conductivity?: string;
    magnetic_type?: string;
    electrical_type?: string;
}

interface ElementDetailsSheetProps {
    element: ElementData | null;
    bottomSheetModalRef: React.RefObject<BottomSheetModal>;
}

const SHELL_LABELS = ['K', 'L', 'M', 'N', 'O', 'P', 'Q'];

// Helper Data
const GASES = [1, 2, 7, 8, 9, 10, 17, 18, 36, 54, 86, 118];
const LIQUIDS = [35, 80]; // Br, Hg
// Radioactive: Tc(43), Pm(61), Bi(83) and up? No, Bi(83) is theoretically unstable but effectively stable? 
// Standard definition: All elements with Z >= 84 (Polonium) are radioactive. Plus Tc(43) and Pm(61).
const RADIOACTIVE_EXCEPTIONS = [43, 61];

const SwipeHint = () => {
    const translateY = useSharedValue(0);

    React.useEffect(() => {
        translateY.value = withRepeat(
            withSequence(
                withTiming(-6, { duration: 600, easing: Easing.inOut(Easing.ease) }),
                withTiming(0, { duration: 600, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));

    return (
        <View style={styles.swipeHintContainer}>
            <Animated.View style={animatedStyle}>
                <Ionicons name="chevron-up" size={20} color="rgba(0,255,255,0.8)" />
            </Animated.View>
            <Text style={styles.swipeHintText}>Swipe up for details</Text>
        </View>
    );
};

const ElementDetailsSheet: React.FC<ElementDetailsSheetProps> = ({ element, bottomSheetModalRef }) => {
    const snapPoints = useMemo(() => ['50%', '92%'], []);

    const renderBackdrop = useCallback(
        (props: any) => (
            <BottomSheetBackdrop
                {...props}
                disappearsOnIndex={-1}
                appearsOnIndex={0}
                opacity={0.5}
            />
        ),
        []
    );

    const getCategoryColor = (category: string) => {
        if (category.includes('metal')) return '#FFD700';
        if (category.includes('gas')) return '#00FFFF';
        return '#FFFFFF';
    };

    const formatTemp = (kelvin?: number) => {
        if (!kelvin) return 'N/A';
        const c = kelvin - 273.15;
        const f = (c * 9 / 5) + 32;
        return `${Math.round(c)}°C  ${Math.round(f)}°F  ${kelvin} K`;
    };

    const getPhase = (number: number) => {
        if (GASES.includes(number)) return 'Gas';
        if (LIQUIDS.includes(number)) return 'Liquid';
        return 'Solid';
    };

    const getRadioactive = (number: number) => {
        if (number >= 84 || RADIOACTIVE_EXCEPTIONS.includes(number)) return 'Yes';
        return 'No';
    };

    const getPeriodGroup = (number: number) => {
        // Re-use logic or rough approx? 
        // Let's just return nothing if we don't have exact group data easily accessible without re-implementing the full logic.
        // But we can infer valence electrons from standard group logic roughly.

        // Simplified Valence Logic (Main groups)
        // 1, 2, 13-18 -> 1, 2, 3..8
        // d-block (3-12) -> usually 2
        // f-block -> usually 2?
        return 'N/A';
    };

    const getValence = (number: number) => {
        // Rough mapping based on known ranges
        if (number === 1) return 1;
        if (number === 2) return 2;
        // ... complex logic ...
        // Better to return 'N/A' if not in JSON than guess wrongly.
        return 'N/A';
    };

    if (!element) return null;

    // Calculate particles
    const protons = element.number;
    const electrons = element.number;
    const neutrons = Math.round(element.atomic_mass) - protons;

    const electronConfig = getElectronConfiguration(electrons);
    const shellString = electronConfig
        .map((count, i) => (count > 0 ? `${SHELL_LABELS[i]}${count} ` : null))
        .filter(Boolean)
        .join(' ');

    const PropertyRow = ({ label, value }: { label: string, value: string | number }) => (
        <View style={styles.propertyRow}>
            <Text style={styles.propertyLabel}>{label}</Text>
            <Text style={styles.propertyValue}>{value}</Text>
        </View>
    );

    return (
        <BottomSheetModal
            ref={bottomSheetModalRef}
            index={0}
            snapPoints={snapPoints}
            backdropComponent={renderBackdrop}
            enablePanDownToClose={true}
            backgroundComponent={({ style }) => (
                <View style={[style, styles.sheetBackgroundContainer]}>
                    <BlurView intensity={80} tint="systemMaterialDark" style={StyleSheet.absoluteFill} />
                </View>
            )}
            handleIndicatorStyle={{ backgroundColor: '#FFFFFF', opacity: 0.5 }}
        >
            <BottomSheetScrollView style={styles.contentContainer}>

                {/* Header Section */}
                <View style={styles.headerRow}>
                    <View>
                        <Text style={styles.name}>{element.name}</Text>
                        <Text style={styles.category}>{element.category.toUpperCase()}</Text>
                    </View>
                    <View style={styles.symbolBadge}>
                        <Text style={styles.symbol}>{element.symbol}</Text>
                        <Text style={styles.number}>{element.number}</Text>
                    </View>
                </View>

                <View style={styles.separator} />

                {/* Animated Swipe Hint */}
                <SwipeHint />

                {/* 3D/Bohr Model Animation Area */}
                <View style={styles.modelContainer}>
                    <BohrModel electrons={electrons} />
                </View>

                {/* Electron Shell Config String */}
                <View style={styles.shellConfigContainer}>
                    <Text style={styles.electronShellTitle}>Electron configuration:</Text>
                    <Text style={styles.electronShellValue}>{shellString}</Text>
                </View>

                {/* Particle Counts */}
                <View style={styles.statsContainer}>
                    <View style={[styles.statBox, { backgroundColor: '#e63946' }]}>
                        <Text style={styles.statLabel}>ELECTRONS</Text>
                        <Text style={styles.statValue}>{electrons}</Text>
                    </View>
                    <View style={[styles.statBox, { backgroundColor: '#fb8500' }]}>
                        <Text style={styles.statLabel}>PROTONS</Text>
                        <Text style={styles.statValue}>{protons}</Text>
                    </View>
                    <View style={[styles.statBox, { backgroundColor: '#4361ee' }]}>
                        <Text style={styles.statLabel}>NEUTRONS</Text>
                        <Text style={styles.statValue}>{neutrons}</Text>
                    </View>
                </View>

                <View style={styles.separator} />

                <Text style={styles.summaryTitle}>About</Text>
                <Text style={styles.summary}>{element.summary}</Text>

                <View style={styles.separator} />

                {/* PROPERTIES SECTION */}
                <Text style={styles.sectionTitle}>Properties</Text>

                <View style={styles.propertiesGrid}>
                    <PropertyRow label="Atomic Number" value={element.number} />
                    <PropertyRow label="Atomic Weight" value={`${element.atomic_mass} g / mol`} />
                    <PropertyRow label="Density" value={element.density ? `${element.density} g / cm³` : 'N/A'} />

                    <PropertyRow label="Melting Point" value={formatTemp(element.melt)} />
                    <PropertyRow label="Boiling Point" value={formatTemp(element.boil)} />

                    <PropertyRow label="Valence Electrons" value={element.valence_electrons ?? getValence(element.number)} />
                    <PropertyRow label="Phase" value={element.phase || element.standard_state || getPhase(element.number)} />

                    <PropertyRow label="Atomic Radius" value={element.atomic_radius ? `${element.atomic_radius} pm` : 'N/A'} />
                    <PropertyRow label="Covalent Radius" value={element.covalent_radius ? `${element.covalent_radius} pm` : 'N/A'} />
                    <PropertyRow label="Van der Waals Radius" value={element.van_der_waals_radius ? `${element.van_der_waals_radius} pm` : 'N/A'} />

                    <PropertyRow label="Electrical Conductivity" value={element.electrical_conductivity || 'N/A'} />
                    <PropertyRow label="Electrical Type" value={element.electrical_type || 'N/A'} />
                    <PropertyRow label="Magnetic Type" value={element.magnetic_type || 'N/A'} />

                    <PropertyRow label="Electronegativity" value={element.electronegativity_pauling || 'N/A'} />
                    <PropertyRow label="Electron Affinity" value={element.electron_affinity ? `${element.electron_affinity} kJ / mol` : 'N/A'} />
                    <PropertyRow label="Radioactive" value={getRadioactive(element.number)} />
                </View>

                <View style={{ height: 40 }} />

            </BottomSheetScrollView>
        </BottomSheetModal>
    );
};

const styles = StyleSheet.create({
    sheetBackgroundContainer: {
        borderRadius: 24,
        overflow: 'hidden',
        backgroundColor: 'rgba(20,20,20,0.5)',
    },
    contentContainer: {
        flex: 1,
        padding: 24,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    name: {
        fontSize: 32,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    category: {
        fontSize: 12,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.6)',
        marginTop: 4,
        letterSpacing: 1,
    },
    symbolBadge: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 12,
    },
    symbol: {
        fontSize: 32,
        fontWeight: '800',
        color: '#FFFFFF',
    },
    number: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.5)',
    },
    modelContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 20,
        height: 300,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
    },
    statBox: {
        flex: 1,
        padding: 12,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    statLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: 'rgba(255,255,255,0.9)',
        marginBottom: 4,
    },
    statValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    separator: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        marginVertical: 20,
    },
    summaryTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.5)',
        marginBottom: 8,
    },
    detailValue: {
        fontSize: 20,
        color: '#FFFFFF',
        fontWeight: '500',
    },
    summary: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 16,
        lineHeight: 24,
    },
    shellConfigContainer: {
        marginBottom: 20,
        paddingHorizontal: 10,
    },
    electronShellTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    electronShellValue: {
        fontSize: 18,
        color: 'rgba(255,255,255,0.8)',
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#00FFFF',
        paddingLeft: 10,
    },
    propertiesGrid: {
        gap: 12,
    },
    propertyRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    propertyLabel: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.6)',
    },
    propertyValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
        textAlign: 'right',
    },
    swipeHintContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
        marginBottom: 5,
        opacity: 0.8,
    },
    swipeHintText: {
        fontSize: 12,
        color: 'rgba(0,255,255,0.8)',
        marginTop: 4,
        fontWeight: '600',
        letterSpacing: 0.5,
    },
});

export default ElementDetailsSheet;
