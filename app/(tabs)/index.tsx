
import React, { useRef, useCallback, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BottomSheetModal } from '@gorhom/bottom-sheet';

import PeriodicTable from '../../src/components/PeriodicTable';
import ElementDetailsSheet from '../../src/components/ElementDetailsSheet';

import { useTranslation } from 'react-i18next';

export default function PeriodicTableScreen() {
    const { t } = useTranslation();
    const [selectedElement, setSelectedElement] = useState<any>(null);
    const bottomSheetModalRef = useRef<BottomSheetModal>(null!);

    const handleElementPress = useCallback((element: any) => {
        setSelectedElement(element);
        bottomSheetModalRef.current?.present();
    }, []);

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#000000', '#1a1a2e']}
                style={StyleSheet.absoluteFill}
            />

            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <Text style={styles.title}>{t('table.title')}</Text>
                </View>

                <View style={styles.tableContainer}>
                    <PeriodicTable onElementPress={handleElementPress} />
                </View>
            </SafeAreaView>

            <ElementDetailsSheet
                element={selectedElement}
                bottomSheetModalRef={bottomSheetModalRef}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        padding: 20,
        zIndex: 10,
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFFFFF',
        letterSpacing: 1,
    },
    tableContainer: {
        flex: 1,
    }
});
