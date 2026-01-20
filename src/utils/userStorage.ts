import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
    XP: 'chemsolver_xp',
    LEVEL: 'chemsolver_level',
    SOLVED_COUNT: 'chemsolver_solved',
};

// Level calculation: Each level requires increasing XP (e.g., Level 1: 0-100, Level 2: 101-250, etc.)
// A simple formula: XP = Level * 100 * Level (Quadratic) or just Linear for simplicity.
// Let's use: Next Level XP = Current Level * 500
// Level 1: 0 XP
// Level 2: 500 XP
// Level 3: 1500 XP ...

// Rank Titles based on Level
export const getRankBox = (level: number) => {
    if (level >= 50) return { title: 'Nobel Prize', color: '#F59E0B' }; // Gold
    if (level >= 30) return { title: 'Professor', color: '#EC4899' }; // Pink
    if (level >= 20) return { title: 'PhD Student', color: '#8B5CF6' }; // Purple
    if (level >= 10) return { title: 'Lab Assistant', color: '#3B82F6' }; // Blue
    if (level >= 5) return { title: 'Student', color: '#10B981' }; // Green
    return { title: 'Novice', color: '#9CA3AF' }; // Grey
};

export const getLevelFromXP = (xp: number) => {
    // Simple iterative check or formula
    let level = 1;
    let requiredXP = 500;

    while (xp >= requiredXP) {
        xp -= requiredXP;
        level++;
        requiredXP = level * 500;
    }

    return {
        level,
        currentLevelXP: xp,
        nextLevelXP: requiredXP,
        progress: xp / requiredXP
    };
};

export const getUserStats = async () => {
    try {
        const xpStr = await AsyncStorage.getItem(STORAGE_KEYS.XP);
        const solvedStr = await AsyncStorage.getItem(STORAGE_KEYS.SOLVED_COUNT);

        const xp = xpStr ? parseInt(xpStr, 10) : 0;
        const solved = solvedStr ? parseInt(solvedStr, 10) : 0;

        const levelInfo = getLevelFromXP(xp);
        const rank = getRankBox(levelInfo.level);

        return {
            xp,
            solved,
            ...levelInfo,
            rank
        };

    } catch (e) {
        return {
            xp: 0,
            solved: 0,
            level: 1,
            currentLevelXP: 0,
            nextLevelXP: 500,
            progress: 0,
            rank: { title: 'Novice', color: '#9CA3AF' }
        };
    }
};

export const addXP = async (amount: number) => {
    try {
        const currentXPStr = await AsyncStorage.getItem(STORAGE_KEYS.XP);
        const currentXP = currentXPStr ? parseInt(currentXPStr, 10) : 0;
        const newXP = currentXP + amount;

        await AsyncStorage.setItem(STORAGE_KEYS.XP, String(newXP));
        return getLevelFromXP(newXP);
    } catch (e) {
        console.error("Failed to add XP", e);
    }
};

export const incrementSolvedCount = async () => {
    try {
        const currentSolvedStr = await AsyncStorage.getItem(STORAGE_KEYS.SOLVED_COUNT);
        const currentSolved = currentSolvedStr ? parseInt(currentSolvedStr, 10) : 0;
        const newSolved = currentSolved + 1;

        await AsyncStorage.setItem(STORAGE_KEYS.SOLVED_COUNT, String(newSolved));
        return newSolved;
    } catch (e) {
        console.error("Failed to increment solved count", e);
    }
};
