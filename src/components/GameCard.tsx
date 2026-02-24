import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Word, UserWord } from "@/hooks/useGameState";

interface GameCardProps {
    card: UserWord | null;
    isReviewing: boolean;
    lastResult: "success" | "error" | null;
    globalVocab: Word[];
    isReverseMode: boolean;
    onNext?: () => void;
    onGiveUp?: () => void;
}

function getTypeColor(type?: string) {
    if (!type) return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
    if (type.includes('noun')) return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
    if (type === 'verb') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    if (type === 'adjective') return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
    if (type === 'adverb') return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    if (type === 'pronoun') return 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400';
    if (type === 'phrase' || type === 'greeting') return 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400';
    return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
}

function matchesVocabWord(word: Word, segment: string): boolean {
    const s = segment.toLowerCase();

    // Check combined words like "un/una", "el/la"
    const bases = word.es.toLowerCase().split('/').map(w => w.trim());

    for (const base of bases) {
        if (base === s) return true;

        // Simple plural and gender rules for nouns, adjectives, determiners, etc.
        if (word.type && !word.type.includes('verb')) {
            if (base + 's' === s) return true;
            if (base + 'es' === s) return true;
            if (base.endsWith('z') && base.slice(0, -1) + 'ces' === s) return true;

            if (base.endsWith('o')) {
                const stem = base.slice(0, -1);
                if (stem + 'a' === s || stem + 'os' === s || stem + 'as' === s) return true;
            }
        }
    }

    // Check conjugations for verbs
    if (word.type?.includes('verb') && word.conjugations) {
        if (Object.values(word.conjugations).includes(s)) return true;
    }

    return false;
}

function HighlightedSentence({ text, globalVocab }: { text: string; globalVocab: Word[] }) {
    // split by keeping punctuation intact but separated to parse individual words
    const wordsAndPunctuation = text.split(/([.,!¿?¡:;"'()\s]+)/);

    return (
        <p className="text-sm text-muted-foreground italic px-8 leading-relaxed">
            {wordsAndPunctuation.map((segment, i) => {
                if (!segment.trim() || /^[.,!¿?¡:;"'()\s]+$/.test(segment)) {
                    return <span key={i}>{segment}</span>;
                }

                // Check if it's a known vocab word
                const knownWord = globalVocab.find(w => matchesVocabWord(w, segment));

                if (knownWord) {
                    return (
                        <span key={i} className="group relative inline-block cursor-help border-b border-dashed border-primary/50 text-primary dark:text-primary-400 hover:bg-primary/10 rounded px-0.5 transition-colors">
                            {segment}
                            {/* Tooltip */}
                            <span className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-slate-900 px-2 py-1 text-xs font-medium text-white opacity-0 shadow transition-opacity group-hover:opacity-100 dark:bg-slate-100 dark:text-slate-900 z-10">
                                {knownWord.en}
                            </span>
                        </span>
                    );
                }

                return <span key={i}>{segment}</span>;
            })}
        </p>
    );
}

function ConjugationTable({ conjugations }: { conjugations: Word['conjugations'] }) {
    if (!conjugations) return null;
    return (
        <div className="w-full mt-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 border border-slate-100 dark:border-slate-800">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Present Tense</h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-left">
                <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-1">
                    <span className="text-muted-foreground mr-2">yo</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{conjugations.yo}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-1">
                    <span className="text-muted-foreground mr-2">nosotros</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{conjugations.nosotros}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-1">
                    <span className="text-muted-foreground mr-2">tú</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{conjugations.tu}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-1">
                    <span className="text-muted-foreground mr-2">vosotros</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{conjugations.vosotros}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-1">
                    <span className="text-muted-foreground mr-2">él/ella</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{conjugations.el}</span>
                </div>
                <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-1">
                    <span className="text-muted-foreground mr-2">ellos/ellas</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{conjugations.ellos}</span>
                </div>
                {conjugations.gerundio && (
                    <div className="col-span-2 flex justify-between border-t border-slate-300 dark:border-slate-600 pt-2 mt-2">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">gerundio</span>
                        <span className="font-semibold text-primary dark:text-primary-400 italic">{conjugations.gerundio}</span>
                    </div>
                )}
            </div>
        </div>
    );
}

export function GameCard({ card, isReviewing, lastResult, globalVocab, isReverseMode, onNext, onGiveUp }: GameCardProps) {
    // Keep a local copy of the card data so we can delay updating the back
    // during the flip animation.
    // Keep track of the *previous* card that was shown, so we can keep its details
    // on the back face of the card while the flip-back animation is playing.
    const [displayCardFront, setDisplayCardFront] = useState<UserWord | null>(card);
    const [displayCardBack, setDisplayCardBack] = useState<UserWord | null>(card);
    const [displayResult, setDisplayResult] = useState(lastResult);
    const [showConjugations, setShowConjugations] = useState(false);

    // For swipe drag physics
    const [exitX, setExitX] = useState(0);

    useEffect(() => {
        setShowConjugations(false); // Reset overlay on state change
        if (isReviewing) {
            // Flipping to BACK (Reviewing)
            // The front is already the current card. We update the back to show the answer for the current card.
            setDisplayCardBack(card);
            setDisplayResult(lastResult);
        } else {
            // Flipping to FRONT (Next Card)
            // Immediately update the FRONT to show the new card so the user can see it right away once the flip is done.
            setDisplayCardFront(card);
            setExitX(0); // reset swipe status

            // DELAY updating the BACK of the card.
            // If we update the back immediately, the answer for the new card will be visible
            // on the back face while the card is rotating back to 0 degrees.
            const timeout = setTimeout(() => {
                setDisplayCardBack(card);
                setDisplayResult(null);
            }, 500); // 500ms matches the framer-motion transition duration

            return () => clearTimeout(timeout);
        }
    }, [card, isReviewing, lastResult]);

    if (!card) {
        return (
            <Card className="w-full max-w-[500px] h-[220px] sm:h-[300px] flex items-center justify-center bg-muted/20 border-dashed">
                <div className="text-center text-muted-foreground p-6">
                    <p className="text-xl font-bold">No cards found</p>
                    <p className="text-sm">Adjust your filters to continue.</p>
                </div>
            </Card>
        );
    }

    const handleDragEnd = (_event: any, info: any) => {
        const threshold = 100;
        if (info.offset.x > threshold || info.offset.x < -threshold) {
            // Swiped far enough
            if (!isReviewing) {
                // If on front face, swipe means "give up / reveal"
                if (onGiveUp) onGiveUp();
            } else {
                // If on back face, swipe means "next card"
                // Animate the card flying off screen
                setExitX(info.offset.x > 0 ? 500 : -500);
                if (onNext) setTimeout(onNext, 200); // Wait for the exit animation a bit
            }
        }
    };

    // Always use our display state for the UI (except for the empty state check above, which needs 'card' so it disappears immediately)
    const activeFrontCard = displayCardFront || card;
    const activeBackCard = displayCardBack || card;

    const frontTerm = isReverseMode ? activeFrontCard.en : activeFrontCard.es;
    const backTerm = isReverseMode ? activeBackCard.es : activeBackCard.en;
    const frontInstruction = isReverseMode ? "Translate to Spanish" : "Translate to English";

    return (
        <div className="perspective-1000 w-full max-w-[500px] h-[220px] sm:h-[300px] relative">
            <motion.div
                className="w-full h-full relative preserve-3d cursor-grab active:cursor-grabbing"
                animate={{
                    rotateY: isReviewing ? 180 : 0,
                    x: exitX,
                    opacity: exitX !== 0 ? 0 : 1
                }}
                initial={{ rotateY: 0, x: 0, opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                style={{ transformStyle: "preserve-3d" }}
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={handleDragEnd}
                whileDrag={{ scale: 1.05 }}
            >
                {/* FRONT */}
                <Card className="absolute w-full h-full backface-hidden flex flex-col items-center justify-center border-t-4 border-t-primary shadow-lg p-6 bg-white dark:bg-slate-900">
                    <div className="absolute top-4 left-4 flex gap-2">
                        <div className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
                            Part {activeFrontCard.p} • Level {activeFrontCard.lvl}
                        </div>
                        {activeFrontCard.type && (
                            <div className={cn("text-xs font-bold uppercase tracking-wider px-2 py-1 rounded", getTypeColor(activeFrontCard.type))}>
                                {activeFrontCard.type}
                            </div>
                        )}
                    </div>
                    <CardContent className="text-center space-y-4 pointer-events-none">
                        <h2 className="text-5xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                            {frontTerm}
                        </h2>
                        <p className="text-muted-foreground italic">{frontInstruction}</p>

                        {isReverseMode && activeFrontCard.conjugations && (
                            <div className="pointer-events-auto mt-4">
                                <button
                                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowConjugations(true); }}
                                    onPointerDownCapture={(e) => e.stopPropagation()}
                                    className="text-sm font-bold text-primary hover:text-primary/80 hover:underline px-4 py-2"
                                >
                                    View Conjugations
                                </button>
                            </div>
                        )}

                        <p className="text-xs text-muted-foreground opacity-50 block md:hidden mt-8">Swipe to reveal answer</p>
                    </CardContent>
                </Card>

                {/* BACK */}
                <Card
                    className={cn(
                        "absolute w-full h-full backface-hidden flex flex-col items-center justify-center shadow-lg p-6 transition-colors duration-300",
                        displayResult === "success"
                            ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
                            : displayResult === "error"
                                ? "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
                                : "bg-white dark:bg-slate-900"
                    )}
                    style={{ transform: "rotateY(180deg)" }}
                >
                    <div className="absolute top-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        Translation
                    </div>
                    <CardContent className="text-center space-y-6 pointer-events-none">
                        <h2 className="text-4xl font-bold text-slate-900 dark:text-slate-50">
                            {backTerm.toUpperCase()}
                        </h2>
                        <div className="space-y-2 w-full">
                            <div className="w-16 h-1 bg-black/10 mx-auto rounded-full mb-4" />
                            <HighlightedSentence text={activeBackCard.ex} globalVocab={globalVocab} />

                            {!isReverseMode && activeBackCard.conjugations && (
                                <div className="pointer-events-auto mt-4">
                                    <button
                                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowConjugations(true); }}
                                        onPointerDownCapture={(e) => e.stopPropagation()}
                                        className="text-sm font-bold text-primary hover:text-primary/80 hover:underline px-4 py-2"
                                    >
                                        View Conjugations
                                    </button>
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground opacity-50 block md:hidden absolute bottom-4 left-0 right-0 text-center">Swipe for next card</p>
                    </CardContent>
                </Card>

                {/* CONJUGATION OVERLAY */}
                {showConjugations && (
                    <div
                        className="absolute inset-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-xl p-6 flex flex-col justify-center items-center pointer-events-auto border-2 border-primary/20 shadow-xl"
                        onPointerDownCapture={(e) => e.stopPropagation()}
                        style={{ transform: isReviewing ? "rotateY(180deg)" : "rotateY(0deg)", backfaceVisibility: "hidden" }}
                    >
                        <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowConjugations(false); }}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 p-2 font-bold text-xl"
                        >
                            ✕
                        </button>
                        <div className="w-full">
                            <ConjugationTable conjugations={!isReverseMode ? activeFrontCard.conjugations : activeBackCard.conjugations} />
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
