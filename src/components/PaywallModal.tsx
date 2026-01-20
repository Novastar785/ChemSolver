import React, { useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { Paywall, PAYWALL_RESULT } from 'react-native-purchases-ui';
import { CustomerInfo, PurchasesStoreTransaction } from 'react-native-purchases';

interface PaywallModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

/**
 * PaywallModal component that displays the RevenueCat Dashboard Paywall.
 * This requires 'react-native-purchases-ui' package.
 */
export function PaywallModal({ visible, onClose, onSuccess }: PaywallModalProps) {

    if (!visible) return null;

    return (
        <View style={StyleSheet.absoluteFill}>
            <Paywall
                onDismiss={() => {
                    onClose();
                }}
                onPurchaseCompleted={({ customerInfo, storeTransaction }: { customerInfo: CustomerInfo, storeTransaction: PurchasesStoreTransaction }) => {
                    console.log('Purchase completed:', customerInfo);
                    onSuccess();
                    onClose();
                }}
                onRestoreCompleted={({ customerInfo }: { customerInfo: CustomerInfo }) => {
                    console.log('Restore completed:', customerInfo);
                    onSuccess();
                    onClose();
                }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
    }
});

