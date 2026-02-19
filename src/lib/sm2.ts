export interface SM2Data {
    repetition: number;
    interval: number;
    easiness_factor: number;
    next_review_date: string;
}

/**
 * Calculates the next Spaced Repetition values using the SM-2 algorithm.
 * @param quality 0-5 (0 = blackout, 5 = perfect response)
 * @param repetition Number of times answered correctly in a row
 * @param interval Days until next review
 * @param easiness_factor Difficulty rating (starts at 2.5)
 */
export function calculateSM2(
    quality: number,
    repetition: number,
    interval: number,
    easiness_factor: number
): SM2Data {
    let nextRepetition = repetition;
    let nextInterval = interval;
    let nextEasinessFactor = easiness_factor;

    if (quality >= 3) {
        if (repetition === 0) {
            nextInterval = 1;
        } else if (repetition === 1) {
            nextInterval = 6;
        } else {
            nextInterval = Math.round(interval * easiness_factor);
        }
        nextRepetition += 1;
    } else {
        nextRepetition = 0;
        nextInterval = 1;
    }

    nextEasinessFactor = easiness_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (nextEasinessFactor < 1.3) {
        nextEasinessFactor = 1.3;
    }

    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + nextInterval);

    return {
        repetition: nextRepetition,
        interval: nextInterval,
        easiness_factor: nextEasinessFactor,
        next_review_date: nextReviewDate.toISOString(),
    };
}

/**
 * Maps game results to SM-2 Quality (0-5)
 */
export function getQuality(isCorrect: boolean, isFuzzy: boolean, isSkip: boolean): number {
    if (isSkip) return 0; // Complete blackout / Skipped
    if (!isCorrect) return 1; // Incorrect
    if (isFuzzy) return 3; // Correct but with hesitation / typos
    return 5; // Perfect recall
}
