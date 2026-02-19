import { useState, useEffect, useCallback } from 'react';
import { vocabDatabase, type Word } from '../data/vocab';

const STORAGE_KEY = 'spanish_vocab_progress_v3';

export interface GameState {
    currentCard: Word | null;
    isReviewing: boolean;
    lastResult: 'success' | 'error' | null; // For animation coloring
    feedbackMsg: string; // Detail message
    feedbackType: 'success' | 'warning' | 'error' | 'neutral';
    stats: {
        lvl0: number;
        lvl1: number;
        lvl2: number;
        lvl3: number;
    };
}

export type LevelFilter = 0 | 1 | 2 | 3;
export type PartFilter = 1 | 2;

export function useGameState() {
    const [vocabList, setVocabList] = useState<Word[]>([]);
    const [filters, setFilters] = useState({
        levels: [0, 1, 2, 3] as LevelFilter[],
        parts: [1, 2] as PartFilter[],
    });

    const [state, setState] = useState<GameState>({
        currentCard: null,
        isReviewing: false,
        lastResult: null,
        feedbackMsg: '',
        feedbackType: 'neutral',
        stats: { lvl0: 0, lvl1: 0, lvl2: 0, lvl3: 0 },
    });

    // --- Initialization ---
    useEffect(() => {
        // Load Saved Data
        let savedData: { id: number; lvl: number }[] = [];
        try {
            const savedStr = localStorage.getItem(STORAGE_KEY);
            if (savedStr) savedData = JSON.parse(savedStr);
        } catch (e) {
            console.error("Save error", e);
        }

        // Merge Data
        const mergedList = vocabDatabase.map(dbWord => {
            const savedWord = savedData.find(w => w.id === dbWord.id);
            return { ...dbWord, lvl: savedWord ? savedWord.lvl : 0 };
        });

        setVocabList(mergedList);
    }, []);

    // --- Save & Stats Update ---
    const saveProgress = useCallback((updatedList: Word[]) => {
        const toSave = updatedList.map(w => ({ id: w.id, lvl: w.lvl }));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
        setVocabList(updatedList);
    }, []);

    // Update Stats & Pick New Card when list or filters change
    useEffect(() => {
        if (vocabList.length === 0) return;

        // Calculate Stats
        const counts = { lvl0: 0, lvl1: 0, lvl2: 0, lvl3: 0 };
        const relevantWords = vocabList.filter(w => filters.parts.includes(w.p as PartFilter));

        relevantWords.forEach(w => {
            const lvl = w.lvl || 0;
            if (lvl === 0) counts.lvl0++;
            else if (lvl === 1) counts.lvl1++;
            else if (lvl === 2) counts.lvl2++;
            else counts.lvl3++;
        });

        setState(prev => ({ ...prev, stats: counts }));

        // Pick a card if we don't have one or if current one is invalid
        if (!state.currentCard && !state.isReviewing) {
            pickNewCard(vocabList, filters);
        }
    }, [vocabList, filters.parts, filters.levels]); // Dependency on filters to re-pick if needed

    const pickNewCard = (list: Word[], currentFilters: typeof filters) => {
        const deck = list.filter(w =>
            currentFilters.levels.includes((w.lvl || 0) as LevelFilter) &&
            currentFilters.parts.includes(w.p as PartFilter)
        );

        if (deck.length === 0) {
            setState(prev => ({
                ...prev,
                currentCard: null,
                feedbackMsg: 'No cards match filters!',
                feedbackType: 'neutral',
                isReviewing: false
            }));
            return;
        }

        const idx = Math.floor(Math.random() * deck.length);
        setState(prev => ({
            ...prev,
            currentCard: deck[idx],
            isReviewing: false,
            lastResult: null,
            feedbackMsg: '',
            feedbackType: 'neutral'
        }));
    };

    // --- Actions ---

    const checkAnswer = (input: string) => {
        if (!state.currentCard || state.isReviewing) return;

        const guess = normalize(input);
        const correctAnswers = state.currentCard.en.split('/');
        let isCorrect = false;
        let isFuzzy = false;
        let correctTerm = state.currentCard.en;

        for (let ans of correctAnswers) {
            const normalizedAns = normalize(ans);
            if (guess === normalizedAns) {
                isCorrect = true;
                break;
            }

            const dist = levenshtein(guess, normalizedAns);
            let tolerance = 0;
            if (normalizedAns.length > 6) tolerance = 2;
            else if (normalizedAns.length > 3) tolerance = 1;

            if (dist <= tolerance && dist > 0) {
                isCorrect = true;
                isFuzzy = true;
                break;
            }
        }

        // Update List
        const updatedList = [...vocabList];
        const cardIdx = updatedList.findIndex(w => w.id === state.currentCard!.id);
        const word = updatedList[cardIdx];

        let newState = { ...state, isReviewing: true };

        if (isCorrect) {
            if (isFuzzy) {
                newState.feedbackMsg = `Close enough! Correct: "${correctTerm}"`;
                newState.feedbackType = 'warning';
            } else {
                newState.feedbackMsg = 'Correct!';
                newState.feedbackType = 'success';
            }
            newState.lastResult = 'success';
            if ((word.lvl || 0) < 3) word.lvl = (word.lvl || 0) + 1;
        } else {
            newState.feedbackMsg = `Incorrect. Solution: "${correctTerm}"`;
            newState.feedbackType = 'error';
            newState.lastResult = 'error';
            word.lvl = 0; // Reset
        }

        setState(newState);
        saveProgress(updatedList);
    };

    const handleGiveUp = () => {
        if (!state.currentCard || state.isReviewing) return;

        const updatedList = [...vocabList];
        const cardIdx = updatedList.findIndex(w => w.id === state.currentCard!.id);
        const word = updatedList[cardIdx];
        word.lvl = 0;

        setState(prev => ({
            ...prev,
            isReviewing: true,
            lastResult: 'error',
            feedbackMsg: `Keep practicing! Solution: "${state.currentCard!.en}"`,
            feedbackType: 'warning'
        }));
        saveProgress(updatedList);
    };

    const handleSkip = () => {
        if (!state.currentCard || state.isReviewing) return;

        setState(prev => ({
            ...prev,
            isReviewing: true,
            lastResult: null,
            feedbackMsg: `Skipped. Solution: "${state.currentCard!.en}"`,
            feedbackType: 'neutral'
        }));
    };

    const nextCard = () => {
        pickNewCard(vocabList, filters);
    };

    const toggleLevelFilter = (lvl: LevelFilter) => {
        setFilters(prev => {
            const newLevels = prev.levels.includes(lvl)
                ? prev.levels.filter(l => l !== lvl)
                : [...prev.levels, lvl];
            // Force pick new card if current one becomes invalid? 
            // Effect will handle it if we reset currentCard or if we depend on filters there.
            // For now, let's just update filters, and effect will trigger.
            // But if we are reviewing, we might want to stay on card.
            // Simplest: just update filters. Effect handles stats. 
            // If current card is invalid, maybe we should skip it? 
            // Let's rely on user clicking "Next" to get valid card or effect if deck is empty.
            return { ...prev, levels: newLevels };
        });
    };

    const togglePartFilter = (p: PartFilter) => {
        setFilters(prev => {
            const newParts = prev.parts.includes(p)
                ? prev.parts.filter(x => x !== p)
                : [...prev.parts, p];
            return { ...prev, parts: newParts };
        });
    };

    return {
        state,
        filters,
        checkAnswer,
        handleGiveUp,
        handleSkip,
        nextCard,
        toggleLevelFilter,
        togglePartFilter
    };
}

// --- Utils ---
function normalize(str: string) {
    return str.toLowerCase().trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
}

function levenshtein(a: string, b: string) {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    return matrix[b.length][a.length];
}
