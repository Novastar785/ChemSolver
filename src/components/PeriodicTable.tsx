import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ScrollView, GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, useAnimatedRef } from 'react-native-reanimated';
import GlassCard from './GlassCard';
import elementsData from '../../assets/elements.json';

interface ElementData {
  number: number;
  symbol: string;
  name: string;
  atomic_mass: number;
  category: string;
  summary: string;
}

interface PeriodicTableProps {
  onElementPress: (element: ElementData) => void;
}

const CELL_SIZE = 75; // Good touch target size
const GAP = 6;

// Standard Periodic Table Mapping Logic
const getPosition = (number: number): { row: number; col: number } => {
  // Period 1
  if (number === 1) return { row: 1, col: 1 };
  if (number === 2) return { row: 1, col: 18 };

  // Period 2
  if (number >= 3 && number <= 4) return { row: 2, col: number - 2 };
  if (number >= 5 && number <= 10) return { row: 2, col: number + 8 };

  // Period 3
  if (number >= 11 && number <= 12) return { row: 3, col: number - 10 };
  if (number >= 13 && number <= 18) return { row: 3, col: number };

  // Period 4
  if (number >= 19 && number <= 36) return { row: 4, col: number - 18 };

  // Period 5
  if (number >= 37 && number <= 54) return { row: 5, col: number - 36 };

  // Period 6
  if (number >= 55 && number <= 56) return { row: 6, col: number - 54 };
  if (number === 57) return { row: 6, col: 3 }; // La in main table
  if (number >= 58 && number <= 71) return { row: 9, col: number - 58 + 4 }; // Ce-Lu (f-block start index 4)
  if (number >= 72 && number <= 86) return { row: 6, col: number - 72 + 4 };

  // Period 7
  if (number >= 87 && number <= 88) return { row: 7, col: number - 86 };
  if (number === 89) return { row: 7, col: 3 }; // Ac in main table
  if (number >= 90 && number <= 103) return { row: 10, col: number - 90 + 4 }; // Th-Lr (f-block start index 4)
  if (number >= 104 && number <= 118) return { row: 7, col: number - 104 + 4 };

  return { row: 0, col: 0 };
};

const CATEGORY_COLORS: Record<string, string> = {
  'Alkali Metal': '#e63946',
  'Alkaline Earth Metal': '#e9c46a',
  'Lanthanide': '#e76f51',
  'Actinide': '#588157',
  'Transition Metal': '#ff9f1c', // Distinct Orange
  'Post-transition Metal': '#0077b6',
  'Metalloid': '#d62828',
  'Other Nonmetal': '#f4a261', // Generic solid nonmetals
  'Halogen': '#2a9d8f',
  'Noble Gas': '#7209b7',
};

const getCategoryColor = (category: string, symbol: string) => {
  const halogens = ['F', 'Cl', 'Br', 'I', 'At', 'Ts'];
  if (halogens.includes(symbol)) return CATEGORY_COLORS['Halogen'];

  if (category.includes('noble gas')) return CATEGORY_COLORS['Noble Gas'];
  if (category.includes('alkali metal')) return CATEGORY_COLORS['Alkali Metal'];
  if (category.includes('alkaline earth')) return CATEGORY_COLORS['Alkaline Earth Metal'];
  if (category.includes('metalloid')) return CATEGORY_COLORS['Metalloid'];
  if (category.includes('post-transition')) return CATEGORY_COLORS['Post-transition Metal'];
  if (category.includes('transition metal')) return CATEGORY_COLORS['Transition Metal'];
  if (category.includes('lanthanide')) return CATEGORY_COLORS['Lanthanide'];
  if (category.includes('actinide')) return CATEGORY_COLORS['Actinide'];

  return CATEGORY_COLORS['Other Nonmetal'];
};

const PeriodicTable: React.FC<PeriodicTableProps> = ({ onElementPress }) => {
  const { t } = useTranslation();
  // Calculate total canvas size: 18 columns + gaps
  const totalWidth = 18 * (CELL_SIZE + GAP) + GAP + 20;
  const totalHeight = 10 * (CELL_SIZE + GAP) + GAP + 120;

  const scale = useSharedValue(1);
  const vScrollRef = useAnimatedRef<ScrollView>();
  const hScrollRef = useAnimatedRef<ScrollView>();

  /* Fixed Zoom Logic with Top-Left Anchor */
  const pinchGesture = Gesture.Pinch()
    .simultaneousWithExternalGesture(vScrollRef as any, hScrollRef as any)
    .onChange((e) => {
      // scaleChange allows smoother relative zooming
      scale.value = Math.max(0.4, Math.min(scale.value * e.scaleChange, 2.0)); // Widened range slightly
    });

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    width: totalWidth * scale.value,
    height: totalHeight * scale.value,
  }));

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    width: totalWidth,
    height: totalHeight,
    transform: [
      { scale: scale.value },
    ],
    // 'transformOrigin' handles the pinning without manual math.
    // If this prop is ignored by older RN (unlikely given project version), we might need fallback,
    // but cleaning the math is the best bet for the "clipping" issues described.
    transformOrigin: ['0%', '0%', 0],
  }));

  return (
    <ScrollView
      ref={vScrollRef}
      style={styles.container}
      contentContainerStyle={[
        styles.scrollContent,
        { paddingTop: 20, paddingBottom: 100 } // Reduced padding to standard
      ]}
      showsVerticalScrollIndicator={false}
    >
      <ScrollView
        ref={hScrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20 }}
      >
        <GestureDetector gesture={pinchGesture}>
          <Animated.View style={[containerAnimatedStyle, { overflow: 'visible' }]}>
            {/* Add MarginTop here so the CONTENT starts lower, avoiding header overlap visually */}
            <Animated.View style={[styles.gridContainer, contentAnimatedStyle, { margin: 0, marginTop: 40 }]}>
              {/* LEGEND */}
              <View style={styles.legendContainer}>
                <Text style={styles.legendTitle}>{t('table.legend.title')}</Text>
                <View style={styles.legendGrid}>
                  {Object.entries(CATEGORY_COLORS).map(([name, color]) => (
                    <View key={name} style={styles.legendItem}>
                      <View style={[styles.legendDot, { backgroundColor: color }]} />
                      <Text style={styles.legendText}>{name}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {elementsData.map((element) => {
                const { row, col } = getPosition(element.number);
                if (row === 0) return null;

                const left = (col - 1) * (CELL_SIZE + GAP) + GAP;
                const top = (row - 1) * (CELL_SIZE + GAP) + GAP + (row >= 9 ? 30 : 0);

                const color = getCategoryColor(element.category, element.symbol);

                return (
                  <Pressable
                    key={element.number}
                    onPress={() => onElementPress(element)}
                    style={[styles.cell, { left, top }]}
                  >
                    <GlassCard style={styles.card} intensity={25}>
                      <Text style={styles.number}>{element.number}</Text>
                      <Text style={styles.symbol}>{element.symbol}</Text>
                      <Text style={styles.name} numberOfLines={1}>{element.name}</Text>

                      {/* Bottom Color Underline */}
                      <View style={[styles.underline, { backgroundColor: color }]} />
                    </GlassCard>
                  </Pressable>
                );
              })}
            </Animated.View>
          </Animated.View>
        </GestureDetector>
      </ScrollView>
    </ScrollView>
  );
};
// ... re-implementing safely below logic ...


const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 80,
  },
  gridContainer: {
    flex: 1,
    position: 'relative',
    margin: 10,
  },
  cell: {
    position: 'absolute',
    width: CELL_SIZE,
    height: CELL_SIZE,
  },
  card: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  underline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  number: {
    position: 'absolute',
    top: 4,
    right: 5,
    textAlign: 'right',
    fontSize: 9,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
  },
  symbol: {
    fontSize: 26,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 6,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  name: {
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
    textTransform: 'capitalize',
    maxWidth: '90%',
  },
  legendContainer: {
    position: 'absolute',
    left: (CELL_SIZE + GAP) * 2 + 20, // Start just after Group 2
    top: GAP + 5,
    width: (CELL_SIZE + GAP) * 9, // Reduced width to avoid hitting Boron (Group 13)
    zIndex: 10,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  legendTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  legendGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 10,
    rowGap: 6,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '30%', // More compact items (3 columns)
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  legendText: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  }
});

export default PeriodicTable;
