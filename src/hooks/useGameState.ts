import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { calculateSM2, getQuality } from '../lib/sm2';
import type { Session } from '@supabase/supabase-js';

export interface Word {
    id: number;
    p: number;
    es: string;
    en: string;
    ex: string;
    type?: string;
}

export interface GameState {
    currentCard: UserWord | null;
    isReviewing: boolean;
    lastResult: 'success' | 'error' | null;
    feedbackMsg: string;
    feedbackType: 'success' | 'warning' | 'error' | 'neutral';
    stats: {
        lvl0: number;
        lvl1: number;
        lvl2: number;
        lvl3: number;
    };
    isLoading: boolean;
}

export type LevelFilter = 0 | 1 | 2 | 3;
export type PartFilter = 1 | 2;

// Extended word interface to hold DB progress during local state
export interface UserWord extends Word {
    repetition: number;
    interval: number;
    easiness_factor: number;
    next_review_date: string;
    lvl: number; // mapped level 0-3 just for filters
}

export function useGameState(session: Session) {
    const [vocabList, setVocabList] = useState<UserWord[]>([]);
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
        isLoading: true,
    });

    // --- Initialization from Supabase ---
    useEffect(() => {
        const fetchData = async () => {
            if (!session?.user?.id) return;

            setState(prev => ({ ...prev, isLoading: true }));

            // Concurrently fetch the global dictionary and user progress
            const [wordsResponse, progressResponse] = await Promise.all([
                supabase.from('words').select('*').order('id', { ascending: true }),
                supabase.from('user_progress').select('*').eq('user_id', session.user.id)
            ]);

            if (wordsResponse.error) console.error("Error fetching words:", wordsResponse.error);
            if (progressResponse.error) console.error("Error fetching progress:", progressResponse.error);

            const dbWords = wordsResponse.data || [];
            const progressMap = new Map();
            if (progressResponse.data) {
                progressResponse.data.forEach(row => {
                    progressMap.set(row.word_id, row);
                });
            }

            const mergedList: UserWord[] = dbWords.map((dbWord: Word) => {
                const savedWord = progressMap.get(dbWord.id);
                if (savedWord) {
                    return {
                        ...dbWord,
                        repetition: savedWord.repetition,
                        interval: savedWord.interval,
                        easiness_factor: savedWord.easiness_factor,
                        next_review_date: savedWord.next_review_date,
                        lvl: savedWord.level,
                    };
                } else {
                    return {
                        ...dbWord,
                        repetition: 0,
                        interval: 0,
                        easiness_factor: 2.5,
                        next_review_date: new Date().toISOString(),
                        lvl: 0,
                    };
                }
            });

            setVocabList(mergedList);
            setState(prev => ({ ...prev, isLoading: false }));
        };

        fetchData();
    }, [session]);

    // Update Stats & Pick New Card when list or filters change
    useEffect(() => {
        if (vocabList.length === 0 || state.isLoading) return;

        // Calculate Stats based on filter parts
        const counts = { lvl0: 0, lvl1: 0, lvl2: 0, lvl3: 0 };
        const relevantWords = vocabList.filter(w => filters.parts.includes(w.p as PartFilter));

        relevantWords.forEach(w => {
            if (w.lvl === 0) counts.lvl0++;
            else if (w.lvl === 1) counts.lvl1++;
            else if (w.lvl === 2) counts.lvl2++;
            else counts.lvl3++;
        });

        setState(prev => ({ ...prev, stats: counts }));

        // Pick a card if we don't have one or if current one is invalid
        if (!state.currentCard && !state.isReviewing) {
            pickNewCard(vocabList, filters);
        }
    }, [vocabList, filters.parts, filters.levels, state.isLoading]);

    const pickNewCard = (list: UserWord[], currentFilters: typeof filters) => {
        const now = new Date();
        const deck = list.filter(w => {
            const matchesFilters = currentFilters.levels.includes((w.lvl || 0) as LevelFilter) && currentFilters.parts.includes(w.p as PartFilter);
            const isDue = new Date(w.next_review_date) <= now;
            return matchesFilters && isDue;
        });

        if (deck.length === 0) {
            setState(prev => ({
                ...prev,
                currentCard: null,
                feedbackMsg: 'No due cards match current filters! Check back tomorrow or change filters.',
                feedbackType: 'neutral',
                isReviewing: false
            }));
            return;
        }

        // Sort by next_review_date to prioritize oldest due
        deck.sort((a, b) => new Date(a.next_review_date).getTime() - new Date(b.next_review_date).getTime());
        // Pick from top 5 oldest to add some randomness
        const poolSize = Math.min(5, deck.length);
        const idx = Math.floor(Math.random() * poolSize);

        setState(prev => ({
            ...prev,
            currentCard: deck[idx],
            isReviewing: false,
            lastResult: null,
            feedbackMsg: '',
            feedbackType: 'neutral'
        }));
    };

    // --- Database Sync ---
    const syncProgressToDB = async (wordToUpdate: UserWord) => {
        if (!session?.user?.id) return;

        const { error } = await supabase
            .from('user_progress')
            .upsert({
                user_id: session.user.id,
                word_id: wordToUpdate.id,
                repetition: wordToUpdate.repetition,
                interval: wordToUpdate.interval,
                easiness_factor: wordToUpdate.easiness_factor,
                next_review_date: wordToUpdate.next_review_date,
                level: wordToUpdate.lvl
            }, {
                onConflict: 'user_id,word_id'
            });

        if (error) {
            console.error("Failed to sync progress:", error);
        }
    };

    // --- Actions ---
    const handleCheckAction = async (isCorrect: boolean, isFuzzy: boolean, isSkip: boolean, message: string, type: GameState['feedbackType'], resultType: GameState['lastResult']) => {
        if (!state.currentCard || state.isReviewing) return;

        const updatedList = [...vocabList];
        const cardIdx = updatedList.findIndex(w => w.id === state.currentCard!.id);
        const currentWord = updatedList[cardIdx];

        const quality = getQuality(isCorrect, isFuzzy, isSkip);
        const sm2Data = calculateSM2(
            quality,
            currentWord.repetition,
            currentWord.interval,
            currentWord.easiness_factor
        );

        // Map SM-2 interval to simple 0-3 levels for UI grouping
        let uiLvl = 0;
        if (sm2Data.interval > 0) uiLvl = 1;
        if (sm2Data.interval > 6) uiLvl = 2;
        if (sm2Data.interval > 21) uiLvl = 3;

        const updatedWord: UserWord = {
            ...currentWord,
            repetition: sm2Data.repetition,
            interval: sm2Data.interval,
            easiness_factor: sm2Data.easiness_factor,
            next_review_date: sm2Data.next_review_date,
            lvl: uiLvl
        };

        updatedList[cardIdx] = updatedWord;

        setState(prev => ({
            ...prev,
            isReviewing: true,
            feedbackMsg: message,
            feedbackType: type,
            lastResult: resultType
        }));

        setVocabList(updatedList);
        await syncProgressToDB(updatedWord);
    };

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

        if (isCorrect) {
            if (isFuzzy) {
                handleCheckAction(true, true, false, `Close enough! Correct: "${correctTerm}"`, 'warning', 'success');
            } else {
                handleCheckAction(true, false, false, 'Correct!', 'success', 'success');
            }
        } else {
            handleCheckAction(false, false, false, `Incorrect. Solution: "${correctTerm}"`, 'error', 'error');
        }
    };

    const handleGiveUp = () => {
        if (!state.currentCard || state.isReviewing) return;
        handleCheckAction(false, false, false, `Keep practicing! Solution: "${state.currentCard.en}"`, 'warning', 'error');
    };

    const handleSkip = () => {
        if (!state.currentCard || state.isReviewing) return;
        handleCheckAction(false, false, true, `Skipped. Solution: "${state.currentCard.en}"`, 'neutral', null);
    };

    const nextCard = () => {
        pickNewCard(vocabList, filters);
    };

    const toggleLevelFilter = (lvl: LevelFilter) => {
        setFilters(prev => {
            const newLevels = prev.levels.includes(lvl)
                ? prev.levels.filter(l => l !== lvl)
                : [...prev.levels, lvl];
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

    // Placeholder for updateFilter, assuming it will be defined elsewhere or is a typo for setFilters
    const updateFilter = (newFilters: typeof filters) => {
        setFilters(newFilters);
    };

    return {
        vocabList,
        state,
        filters,
        updateFilter,
        checkAnswer,
        handleGiveUp,
        handleSkip,
        nextCard,
        toggleLevelFilter,
        togglePartFilter,
        isLoading: state.isLoading
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
