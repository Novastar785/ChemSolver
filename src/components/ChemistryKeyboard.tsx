
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, useWindowDimensions } from 'react-native';
import { BlurView } from 'expo-blur';

interface ChemistryKeyboardProps {
  onKeyPress: (key: string) => void;
  onDelete: () => void;
  onSubmit: () => void;
  onCameraPress: () => void;
}

const keys = [
  ['H', 'He', 'Li', 'Be'],
  ['B', 'C', 'N', 'O'],
  ['F', 'Ne', 'Na', 'Mg'],
  ['Al', 'Si', 'P', 'S'],
  ['Cl', 'Ar', 'K', 'Ca'],
  ['(', ')', '+', '->'],
  ['1', '2', '3', '4'],
  ['5', '6', '7', '8'],
  ['9', '0', 'CAMERA', 'DEL'] // Special row
];

const ChemistryKeyboard: React.FC<ChemistryKeyboardProps> = ({ onKeyPress, onDelete, onSubmit, onCameraPress }) => {
  const { width } = useWindowDimensions();
  const keyWidth = (width - 60) / 4;

  return (
    <View style={styles.container}>
      <BlurView intensity={80} tint="systemThinMaterialDark" style={StyleSheet.absoluteFill} />
      <View style={styles.keyboardGrid}>
        {keys.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((key, colIndex) => (
              <TouchableOpacity
                key={`${rowIndex}-${colIndex}`}
                style={[
                  styles.key,
                  { width: keyWidth },
                  key === 'CAMERA' && styles.actionKey,
                  key === 'DEL' && styles.actionKey
                ]}
                onPress={() => {
                  if (key === 'DEL') onDelete();
                  else if (key === 'CAMERA') onCameraPress();
                  else onKeyPress(key);
                }}
              >
                <Text style={styles.keyText}>
                  {key === 'CAMERA' ? '📷' : key === 'DEL' ? '⌫' : key}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
        <TouchableOpacity style={styles.submitButton} onPress={onSubmit}>
          <Text style={styles.submitText}>SOLVE</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 30,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    // position: 'absolute',
    // bottom: 0,
    width: '100%',
  },
  keyboardGrid: {
    padding: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 8,
  },
  key: {
    height: 45,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  actionKey: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  keyText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '500',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 5,
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  }
});

export default ChemistryKeyboard;
