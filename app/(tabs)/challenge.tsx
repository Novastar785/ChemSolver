import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Dimensions, FlatList, Platform, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';

import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import * as StoreReview from 'expo-store-review';
import { Trophy, Clock, XCircle, CheckCircle, RefreshCw, ChevronRight, Zap, Target, BookOpen, Brain, Check, X } from 'lucide-react-native';
import elementsData from '../../assets/elements.json';
import learningData from '../../src/data/learning_modules.json';
import { addXP } from '../../src/utils/userStorage';

// Types
type QuestionType = 'symbol' | 'name' | 'number' | 'category' | 'mass' | 'boolean' | 'formula_to_name' | 'name_to_formula';
type GameModeId = 'time_attack' | 'name_master' | 'symbol_hunter' | 'family_truth' | 'lab_master';

interface GameMode {
    id: GameModeId;
    title: string;
    subtitle: string;
    icon: any;
    color: string;
    description: string;
}

interface Question {
    id: string;
    type: QuestionType;
    text: string;
    options: string[];
    correctAnswer: string;
}

interface GameState {
    status: 'menu' | 'playing' | 'end';
    mode: GameModeId | null;
    currentQuestionIndex: number;
    score: number;
    timeRemaining: number;
    selectedOption: string | null;
    questions: Question[];
}

const GAME_MODES: GameMode[] = [
    {
        id: 'time_attack',
        title: 'Time Attack',
        subtitle: 'The Ultimate Mix',
        icon: Zap,
        color: '#FFD700',
        description: 'Mixed questions about symbols, numbers, and mass. Fast-paced random challenge!'
    },
    {
        id: 'name_master',
        title: 'Element Naming',
        subtitle: 'Symbol to Name',
        icon: BookOpen,
        color: '#4ADE80',
        description: 'We show you the chemical symbol, you pick the correct element name.'
    },
    {
        id: 'symbol_hunter',
        title: 'Symbol Hunter',
        subtitle: 'Name to Symbol',
        icon: Target,
        color: '#60A5FA',
        description: 'Identify the correct chemical symbol for the given element name.'
    },
    {
        id: 'family_truth',
        title: 'Chemical Families',
        subtitle: 'True or False',
        icon: Brain,
        color: '#F472B6', // Pink
        description: 'Validate statements about element families. Is "Gold" a "Noble Gas"? True or False.'
    },
    {
        id: 'lab_master',
        title: 'Lab Master',
        subtitle: 'Compounds & Reactions',
        icon: Zap, // Or a Flask icon if available in imports
        color: '#8B5CF6', // Purple
        description: 'Test your knowledge on compounds and reactions. Can you identify Water from H2O?'
    }
];

const GAME_DURATION = 60;
const QUESTIONS_COUNT = 10;

export default function ChallengeScreen() {
    const { t } = useTranslation();
    const [gameState, setGameState] = useState<GameState>({
        status: 'menu',
        mode: null,
        currentQuestionIndex: 0,
        score: 0,
        timeRemaining: GAME_DURATION,
        selectedOption: null,
        questions: [],
    });

    const pulseAnim = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.05,
                    duration: 1000,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 1000,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    // Background Particles Component
    const FloatingParticles = useMemo(() => {
        // Create a few static animated values for particles
        // In a real app we might want independent animations, but for performance/simplicity
        // we can reuse the pulse or separate loops. Let's make a simple one.
        return (
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
                {/* Particle 1: Top Left */}
                <View style={{ position: 'absolute', top: '10%', left: '5%', opacity: 0.1 }}>
                    <Brain size={120} color="#fff" />
                </View>
                {/* Particle 2: Bottom Right */}
                <View style={{ position: 'absolute', bottom: '20%', right: '-5%', opacity: 0.05, transform: [{ rotate: '45deg' }] }}>
                    <BookOpen size={200} color="#fff" />
                </View>
                {/* Particle 3: Mid Left */}
                <View style={{ position: 'absolute', top: '40%', left: '-10%', opacity: 0.08, transform: [{ rotate: '-15deg' }] }}>
                    <Zap size={150} color="#fff" />
                </View>
            </View>
        )
    }, []);

    const scrollX = useRef(new Animated.Value(0)).current;

    // --- LOGIC: Generators ---

    const getRandomElement = () => elementsData[Math.floor(Math.random() * elementsData.length)];

    const generateOptions = (correctAnswer: string, type: QuestionType, excludeElement?: any): string[] => {
        if (type === 'boolean') return [t('challenge.true'), t('challenge.false')];

        const options = new Set<string>();
        options.add(correctAnswer);

        // --- Handle Lab Master Options ---
        if (type === 'formula_to_name' || type === 'name_to_formula') {
            while (options.size < 4) {
                const randomItem = learningData[Math.floor(Math.random() * learningData.length)];
                let option = '';

                if (type === 'formula_to_name') {
                    // Correct Answer is a Name (Title). Options should be other Names.
                    // We need to fetch the translated title for the random item
                    // IMPORTANT: We need access to 't' here, or pass raw ID and translate later. 
                    // Simple approach: Use t() here.
                    option = t(`learn.topics.${randomItem.id}.title`);
                } else {
                    // Correct Answer is a Formula. Options should be other Formulas.
                    option = randomItem.formula;
                }

                if (option && option !== correctAnswer) {
                    options.add(option);
                }
            }
            return Array.from(options).sort(() => Math.random() - 0.5);
        }

        // --- Handle Element Options ---
        while (options.size < 4) {
            const randomEl = getRandomElement();
            let option = '';

            switch (type) {
                case 'symbol': option = randomEl.symbol; break;
                case 'name': option = randomEl.name; break;
                // For general usage (Time Attack), we might need others, but logic below handles specific modes
                case 'number': option = String(randomEl.number); break;
                case 'category': option = randomEl.category; break;
                case 'mass': option = String(Math.round(randomEl.atomic_mass)); break;
            }

            if (option && option !== correctAnswer) {
                options.add(option);
            }
        }
        return Array.from(options).sort(() => Math.random() - 0.5);
    };

    const generateQuestions = useCallback((mode: GameModeId) => {
        const newQuestions: Question[] = [];

        for (let i = 0; i < QUESTIONS_COUNT; i++) {
            const element = getRandomElement();
            let type: QuestionType = 'name'; // default
            let text = '';
            let correctAnswer = '';
            let options: string[] = [];

            if (mode === 'time_attack') {
                const types: QuestionType[] = ['symbol', 'name', 'number', 'category', 'mass'];
                type = types[Math.floor(Math.random() * types.length)];
            } else if (mode === 'name_master') {
                type = 'name';
            } else if (mode === 'symbol_hunter') {
                type = 'symbol';
            } else if (mode === 'family_truth') {
                type = 'boolean';
            } else if (mode === 'lab_master') {
                // 50/50 chance of Formula->Name or Name->Formula
                type = Math.random() > 0.5 ? 'formula_to_name' : 'name_to_formula';
            }

            // -- Question Builder --
            // -- Question Builder --

            // Special handling for Lab Master which uses learningData instead of elements
            if (mode === 'lab_master') {
                const learningItem = learningData[Math.floor(Math.random() * learningData.length)];
                const translatedTitle = t(`learn.topics.${learningItem.id}.title`);

                if (type === 'formula_to_name') {
                    text = t('challenge.questions.formula_to_name', { formula: learningItem.formula });
                    correctAnswer = translatedTitle;
                    options = generateOptions(correctAnswer, 'formula_to_name');
                } else {
                    text = t('challenge.questions.name_to_formula', { name: translatedTitle });
                    correctAnswer = learningItem.formula;
                    options = generateOptions(correctAnswer, 'name_to_formula');
                }
            } else {
                // Elements Logic
                switch (type) {
                    case 'symbol':
                        text = t('challenge.questions.symbol', { element: element.name });
                        correctAnswer = element.symbol;
                        options = generateOptions(correctAnswer, 'symbol');
                        break;
                    case 'name':
                        text = t('challenge.questions.name', { symbol: element.symbol });
                        correctAnswer = element.name;
                        options = generateOptions(correctAnswer, 'name');
                        break;
                    case 'number':
                        text = t('challenge.questions.number', { element: element.name });
                        correctAnswer = String(element.number);
                        options = generateOptions(correctAnswer, 'number');
                        break;
                    case 'category':
                        text = t('challenge.questions.category', { element: element.name });
                        correctAnswer = element.category;
                        options = generateOptions(correctAnswer, 'category');
                        break;
                    case 'mass':
                        text = t('challenge.questions.mass', { element: element.name });
                        correctAnswer = String(Math.round(element.atomic_mass));
                        options = generateOptions(correctAnswer, 'mass');
                        break;
                    case 'boolean':
                        // Decide if we want to generate a True or False statement (50/50)
                        const isTrueStatement = Math.random() > 0.5;
                        let statedCategory = element.category;

                        if (!isTrueStatement) {
                            // Find a wrong category
                            while (true) {
                                const randomEl = getRandomElement();
                                if (randomEl.category !== element.category) {
                                    statedCategory = randomEl.category;
                                    break;
                                }
                            }
                        }

                        text = t('challenge.questions.boolean', { element: element.name, category: statedCategory });
                        correctAnswer = isTrueStatement ? t('challenge.true') : t('challenge.false');
                        options = [t('challenge.true'), t('challenge.false')];
                        break;
                }
            }

            newQuestions.push({
                id: String(i),
                type,
                text,
                options,
                correctAnswer,
            });
        }
        return newQuestions;
    }, []);


    // --- GAMEPLAY ACTIONS ---

    const startGame = (mode: GameModeId) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const questions = generateQuestions(mode);
        setGameState({
            status: 'playing',
            mode,
            currentQuestionIndex: 0,
            score: 0,
            timeRemaining: GAME_DURATION,
            selectedOption: null,
            questions,
        });
    };

    const menu = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setGameState(prev => ({ ...prev, status: 'menu', mode: null }));
    }

    const handleOptionSelect = (option: string) => {
        if (gameState.selectedOption) return;

        const isCorrect = option === gameState.questions[gameState.currentQuestionIndex].correctAnswer;

        if (isCorrect) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }

        setGameState(prev => ({ ...prev, selectedOption: option }));



        setTimeout(() => {
            if (isCorrect) {
                setGameState(prev => ({
                    ...prev,
                    score: prev.score + 10,
                    currentQuestionIndex: prev.currentQuestionIndex + 1,
                    selectedOption: null,
                    timeRemaining: prev.timeRemaining + 2,
                }));
            } else {
                setGameState(prev => ({
                    ...prev,
                    currentQuestionIndex: prev.currentQuestionIndex + 1,
                    selectedOption: null,
                    timeRemaining: Math.max(0, prev.timeRemaining - 5),
                }));
            }

            if (gameState.currentQuestionIndex >= QUESTIONS_COUNT - 1) {
                endGame();
            }
        }, 800);
    };

    const endGame = async () => {
        setGameState(prev => ({ ...prev, status: 'end' }));
        // Award XP equal to the score
        if (gameState.score > 0) {
            await addXP(gameState.score);

            // Request review if they did well (e.g. > 50% score)
            const percentage = (gameState.score / (QUESTIONS_COUNT * 10)) * 100;
            if (percentage >= 50 && await StoreReview.hasAction()) {
                StoreReview.requestReview();
            }
        }
    };

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (gameState.status === 'playing' && gameState.timeRemaining > 0) {
            interval = setInterval(() => {
                setGameState(prev => {
                    if (prev.timeRemaining <= 1) {
                        clearInterval(interval);
                        return { ...prev, status: 'end', timeRemaining: 0 };
                    }
                    return { ...prev, timeRemaining: prev.timeRemaining - 1 };
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [gameState.status, gameState.timeRemaining]);


    // --- RENDERERS ---

    if (gameState.status === 'menu') {
        // Calculations for perfect centering
        const { width } = Dimensions.get('window');
        const CARD_WIDTH = width * 0.74; // 74% of screen width
        const CARD_MARGIN = 12; // Spacing between cards
        const FULL_CARD_WIDTH = CARD_WIDTH + (CARD_MARGIN * 2);
        const SPACER_WIDTH = (width - FULL_CARD_WIDTH) / 2; // Exact space needed to center

        return (
            <View style={styles.container}>
                <LinearGradient colors={['#000000', '#111827']} style={StyleSheet.absoluteFill} />
                {FloatingParticles}

                <SafeAreaView style={styles.safeArea}>
                    <View style={styles.menuHeader}>
                        <Trophy size={40} color="#FFD700" />
                        <Text style={styles.menuTitle}>{t('challenge.title')}</Text>
                        <Text style={styles.menuSubtitle}>{t('challenge.subtitle')}</Text>
                    </View>

                    <View style={{ height: 440 }}>
                        <Animated.FlatList
                            data={GAME_MODES}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            snapToInterval={FULL_CARD_WIDTH}
                            snapToAlignment="start"
                            decelerationRate="fast"
                            contentContainerStyle={{
                                paddingBottom: 20,
                                paddingTop: 10
                            }}
                            // We use Spacer views to push the first/last card to the center.
                            ListHeaderComponent={<View style={{ width: SPACER_WIDTH }} />}
                            ListFooterComponent={<View style={{ width: SPACER_WIDTH }} />}
                            keyExtractor={item => item.id}
                            onScroll={Animated.event(
                                [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                                { useNativeDriver: true }
                            )}
                            renderItem={({ item, index }) => {
                                const inputRange = [
                                    (index - 1) * FULL_CARD_WIDTH,
                                    index * FULL_CARD_WIDTH,
                                    (index + 1) * FULL_CARD_WIDTH,
                                ];

                                const scale = scrollX.interpolate({
                                    inputRange,
                                    outputRange: [0.92, 1, 0.92], // Subtle scale down for side items
                                    extrapolate: 'clamp',
                                });

                                const opacity = scrollX.interpolate({
                                    inputRange,
                                    outputRange: [0.5, 1, 0.5],
                                    extrapolate: 'clamp',
                                });

                                return (
                                    <Animated.View style={{
                                        width: CARD_WIDTH,
                                        marginHorizontal: CARD_MARGIN,
                                        transform: [{ scale }],
                                        opacity,
                                    }}>
                                        <TouchableOpacity
                                            activeOpacity={0.95}
                                            onPress={() => startGame(item.id)}
                                            style={{
                                                flex: 1,
                                                borderRadius: 36,
                                                overflow: 'hidden',
                                                backgroundColor: 'transparent'
                                            }}
                                        >
                                            {Platform.OS === 'ios' ? (
                                                <BlurView
                                                    intensity={80}
                                                    tint="systemChromeMaterialDark"
                                                    style={StyleSheet.absoluteFill}
                                                />
                                            ) : (
                                                <View
                                                    style={[
                                                        StyleSheet.absoluteFill,
                                                        {
                                                            backgroundColor: '#1E1E28', // Condensed dark background
                                                        }
                                                    ]}
                                                />
                                            )}

                                            {/* Specular Shine */}
                                            <LinearGradient
                                                colors={[
                                                    'rgba(255,255,255,0.15)',
                                                    'rgba(255,255,255,0.02)',
                                                    'transparent'
                                                ]}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 0.7, y: 0.7 }}
                                                style={StyleSheet.absoluteFill}
                                            />

                                            {/* Content Gradient */}
                                            <LinearGradient
                                                colors={[`${item.color}40`, 'transparent']}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 1 }}
                                                style={[
                                                    styles.modeCard,
                                                    {
                                                        height: '100%',
                                                        borderColor: 'transparent',
                                                        backgroundColor: 'transparent'
                                                    }
                                                ]}
                                            >
                                                <View style={[styles.iconCircle, { backgroundColor: `${item.color}30`, borderColor: item.color }]}>
                                                    <item.icon size={48} color={item.color} />
                                                </View>

                                                <View style={{ width: '100%' }}>
                                                    <Text style={[styles.cardTitle, { color: item.color }]}>{t(`challenge.modes.${item.id}.title`)}</Text>
                                                    <Text style={styles.cardSubtitle}>{t(`challenge.modes.${item.id}.subtitle`)}</Text>
                                                </View>

                                                <Text style={styles.cardDesc}>{t(`challenge.modes.${item.id}.description`)}</Text>

                                                <Animated.View style={[styles.playButton, { backgroundColor: item.color, transform: [{ scale: pulseAnim }] }]}>
                                                    <Text style={styles.playButtonText}>{t('challenge.play_now')}</Text>
                                                    <ChevronRight size={20} color="#000" />
                                                </Animated.View>
                                            </LinearGradient>

                                            {/* BORDER OVERLAY */}
                                            <View
                                                pointerEvents="none"
                                                style={[
                                                    StyleSheet.absoluteFill,
                                                    {
                                                        borderRadius: 36,
                                                        borderWidth: 1.5,
                                                        borderColor: 'rgba(255,255,255,0.2)',
                                                    }
                                                ]}
                                            />
                                        </TouchableOpacity>
                                    </Animated.View>
                                );
                            }}
                        />
                    </View>

                    {/* Pagination Dots */}
                    <View style={styles.pagination}>
                        {GAME_MODES.map((_, i) => {
                            const inputRange = [(i - 1) * FULL_CARD_WIDTH, i * FULL_CARD_WIDTH, (i + 1) * FULL_CARD_WIDTH];

                            // Use scaleX instead of width for native driver support
                            const dotScale = scrollX.interpolate({
                                inputRange,
                                outputRange: [1, 2.5, 1], // Scale up to 2.5x base width
                                extrapolate: 'clamp',
                            });

                            const dotOpacity = scrollX.interpolate({
                                inputRange,
                                outputRange: [0.3, 1, 0.3],
                                extrapolate: 'clamp',
                            });

                            const dotColor = scrollX.interpolate({
                                inputRange,
                                outputRange: ['#fff', GAME_MODES[i].color, '#fff'],
                                extrapolate: 'clamp',
                            });

                            return (
                                <Animated.View
                                    key={i}
                                    style={[
                                        styles.dot,
                                        {
                                            transform: [{ scaleX: dotScale }],
                                            opacity: dotOpacity,
                                            backgroundColor: dotColor
                                        }
                                    ]}
                                />
                            );
                        })}
                    </View>

                </SafeAreaView>
            </View>
        );
    }

    if (gameState.status === 'end') {
        const percentage = (gameState.score / (QUESTIONS_COUNT * 10)) * 100;
        let message = '';
        if (percentage >= 80) message = "You're a Genius! 🧪";
        else if (percentage >= 50) message = "Great Job! Keep Learning 📚";
        else message = "Don't give up! Try again 💪";

        return (
            <View style={styles.container}>
                <LinearGradient colors={['#000000', '#1a1a2e']} style={StyleSheet.absoluteFill} />
                <SafeAreaView style={styles.safeArea}>
                    <View style={styles.resultCard}>
                        <Text style={styles.scoreTitle}>{GAME_MODES.find(m => m.id === gameState.mode)?.title} Results</Text>
                        <Text style={styles.scoreValue}>{gameState.score}</Text>
                        <Text style={styles.scoreMessage}>{message}</Text>

                        <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>Questions</Text>
                                <Text style={styles.statValue}>{Math.min(gameState.currentQuestionIndex, QUESTIONS_COUNT)}/10</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statLabel}>Time Left</Text>
                                <Text style={styles.statValue}>{gameState.timeRemaining}s</Text>
                            </View>
                        </View>

                        <TouchableOpacity onPress={menu} style={styles.primaryButton}>
                            <RefreshCw size={20} color="#000" style={{ marginRight: 8 }} />
                            <Text style={styles.buttonText}>BACK TO MENU</Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </View>
        );
    }

    // --- PLAYING STATE ---
    const currentQ = gameState.questions[gameState.currentQuestionIndex];
    const activeModeColor = GAME_MODES.find(m => m.id === gameState.mode)?.color || '#00FFFF';

    return (
        <View style={styles.container}>
            <LinearGradient colors={['#000000', '#1a1a2e']} style={StyleSheet.absoluteFill} />
            <SafeAreaView style={styles.safeArea}>
                {/* Header Stats */}
                <View style={styles.gameHeader}>
                    <View style={styles.timerBadge}>
                        <Clock size={16} color={gameState.timeRemaining < 10 ? '#EF4444' : '#fff'} />
                        <Text style={[styles.timerText, { color: gameState.timeRemaining < 10 ? '#EF4444' : '#fff' }]}>
                            {gameState.timeRemaining}s
                        </Text>
                    </View>
                    <View style={[styles.scoreBadge, { borderColor: `${activeModeColor}50`, backgroundColor: `${activeModeColor}20` }]}>
                        <Text style={[styles.scoreText, { color: activeModeColor }]}>Score: {gameState.score}</Text>
                    </View>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressBarBg}>
                    <Animated.View style={[styles.progressBarFill, { width: `${((gameState.currentQuestionIndex) / QUESTIONS_COUNT) * 100}%`, backgroundColor: activeModeColor }]} />
                </View>

                {/* Question Card */}
                <View style={styles.questionContainer}>
                    <Text style={styles.questionIndex}>Question {gameState.currentQuestionIndex + 1}/{QUESTIONS_COUNT}</Text>
                    <Text style={styles.questionText}>{currentQ?.text}</Text>

                    <View style={[styles.optionsList, currentQ?.type === 'boolean' && styles.optionsListBoolean]}>
                        {currentQ?.options.map((option, idx) => {
                            const isSelected = gameState.selectedOption === option;
                            const isCorrect = option === currentQ.correctAnswer;
                            const showResult = gameState.selectedOption !== null;

                            let bgStyle: any = [styles.optionButton];
                            if (currentQ.type === 'boolean') bgStyle.push(styles.optionButtonBoolean);

                            if (showResult) {
                                if (isSelected && isCorrect) bgStyle.push(styles.optionCorrect);
                                else if (isSelected && !isCorrect) bgStyle.push(styles.optionWrong);
                                else if (isCorrect) bgStyle.push(styles.optionCorrect);
                                else bgStyle.push(styles.optionDimmed);
                            }

                            return (
                                <TouchableOpacity
                                    key={idx}
                                    onPress={() => handleOptionSelect(option)}
                                    activeOpacity={0.9}
                                    style={bgStyle}
                                    disabled={gameState.selectedOption !== null}
                                >
                                    <Text style={[styles.optionText, currentQ.type === 'boolean' && styles.optionTextBoolean]}>
                                        {option}
                                    </Text>

                                    {/* Icons for normal list, hidden for big boolean buttons usually unless space permits */}
                                    <View style={{ position: 'absolute', right: 16 }}>
                                        {showResult && isCorrect && <CheckCircle size={24} color="#4ADE80" />}
                                        {showResult && isSelected && !isCorrect && <XCircle size={24} color="#EF4444" />}
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
    },
    menuHeader: {
        alignItems: 'center',
        marginBottom: 10, // Reduced from 30
        marginTop: 10, // Reduced from 20
    },
    menuTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#fff',
        marginTop: 10,
    },
    menuSubtitle: {
        color: '#9CA3AF',
        fontSize: 14,
    },
    modeCard: {
        width: '100%',
        height: 400,
        // backgroundColor removed
        borderRadius: 32,
        padding: 24,
        alignItems: 'center',
        justifyContent: 'space-between',
        // borderWidth removed
    },
    iconCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        borderWidth: 1,
    },
    cardTitle: {
        fontSize: 26,
        fontWeight: '800',
        marginBottom: 4,
        textAlign: 'center',
    },
    cardSubtitle: {
        fontSize: 14,
        color: '#aaa',
        marginBottom: 16,
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
    cardDesc: {
        color: '#ccc',
        textAlign: 'center',
        lineHeight: 22,
        fontSize: 15,
        marginBottom: 20,
    },
    playButton: {
        width: '100%',
        padding: 16,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    playButtonText: {
        fontWeight: 'bold',
        fontSize: 16,
        color: '#000',
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 40, // Increased spacing from bottom
        gap: 8,
    },
    dot: {
        width: 8, // Base width for scaling
        height: 8,
        borderRadius: 4,
        marginHorizontal: 3, // Add small margin to prevent clipping during scale
    },

    // Game UI
    gameHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    timerBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(0,0,0,0.3)',
        padding: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    timerText: {
        fontSize: 16,
        fontWeight: 'bold',
        fontVariant: ['tabular-nums'],
    },
    scoreBadge: {
        padding: 8,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
    },
    scoreText: {
        fontWeight: 'bold',
    },
    progressBarBg: {
        height: 6,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: 3,
        marginBottom: 40,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    questionContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    questionIndex: {
        color: '#666',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 10,
        textTransform: 'uppercase',
    },
    questionText: {
        fontSize: 24,
        color: '#fff',
        fontWeight: 'bold',
        marginBottom: 30,
        lineHeight: 32,
    },
    optionsList: {
        gap: 12,
    },
    optionsListBoolean: {
        flexDirection: 'row',
        gap: 16,
        justifyContent: 'space-between',
    },
    optionButton: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 18,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        flexDirection: 'row',
        justifyContent: 'center',  // Centered text for cleaner look
        alignItems: 'center',
        minHeight: 60,
    },
    optionButtonBoolean: {
        flex: 1,
        height: 120, // Tall buttons for T/F
        justifyContent: 'center',
        alignItems: 'center',
    },
    optionCorrect: {
        backgroundColor: 'rgba(74, 222, 128, 0.2)',
        borderColor: '#4ADE80',
    },
    optionWrong: {
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        borderColor: '#EF4444',
    },
    optionDimmed: {
        opacity: 0.3,
    },
    optionText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    optionTextBoolean: {
        fontSize: 24,
        fontWeight: 'bold',
    },

    // Results
    resultCard: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        padding: 40,
        borderRadius: 32,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    scoreTitle: {
        color: '#aaa',
        fontSize: 16,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 2,
        marginBottom: 10,
        textAlign: 'center',
    },
    scoreValue: {
        fontSize: 72,
        fontWeight: '900',
        color: '#00FFFF',
        marginBottom: 10,
    },
    scoreMessage: {
        color: '#fff',
        fontSize: 18,
        marginBottom: 40,
        fontStyle: 'italic',
        textAlign: 'center',
    },
    statsRow: {
        flexDirection: 'row',
        gap: 40,
        marginBottom: 40,
    },
    statItem: {
        alignItems: 'center',
    },
    statLabel: {
        color: '#666',
        fontSize: 12,
        marginBottom: 4,
    },
    statValue: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    primaryButton: {
        backgroundColor: '#00FFFF',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 99,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        shadowColor: '#00FFFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 5,
    },
    buttonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000',
    },
});
