import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { type Word, vocabDatabase } from "@/data/vocab";

interface GameCardProps {
    card: Word | null;
    isReviewing: boolean;
    lastResult: "success" | "error" | null;
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

function HighlightedSentence({ text }: { text: string }) {
    // split by keeping punctuation intact but separated to parse individual words
    const wordsAndPunctuation = text.split(/([.,!¿?¡:;"'()\s]+)/);

    return (
        <p className="text-sm text-muted-foreground italic px-8 leading-relaxed">
            {wordsAndPunctuation.map((segment, i) => {
                if (!segment.trim() || /^[.,!¿?¡:;"'()\s]+$/.test(segment)) {
                    return <span key={i}>{segment}</span>;
                }

                // Check if it's a known vocab word (case-insensitive)
                const lowerSegment = segment.toLowerCase();
                const knownWord = vocabDatabase.find(w => w.es.toLowerCase() === lowerSegment);

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

export function GameCard({ card, isReviewing, lastResult }: GameCardProps) {
    if (!card) {
        return (
            <Card className="w-full max-w-[500px] h-[300px] flex items-center justify-center bg-muted/20 border-dashed">
                <div className="text-center text-muted-foreground p-6">
                    <p className="text-xl font-bold">No cards found</p>
                    <p className="text-sm">Adjust your filters to continue.</p>
                </div>
            </Card>
        );
    }

    return (
        <div className="perspective-1000 w-full max-w-[500px] h-[300px] relative">
            <motion.div
                className="w-full h-full relative preserve-3d transition-transform duration-500"
                animate={{ rotateY: isReviewing ? 180 : 0 }}
                initial={{ rotateY: 0 }}
                style={{ transformStyle: "preserve-3d" }}
            >
                {/* FRONT */}
                <Card className="absolute w-full h-full backface-hidden flex flex-col items-center justify-center border-t-4 border-t-primary shadow-lg p-6">
                    <div className="absolute top-4 left-4 flex gap-2">
                        <div className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
                            Part {card.p} • Level {card.lvl}
                        </div>
                        {card.type && (
                            <div className={cn("text-xs font-bold uppercase tracking-wider px-2 py-1 rounded", getTypeColor(card.type))}>
                                {card.type}
                            </div>
                        )}
                    </div>
                    <CardContent className="text-center space-y-4">
                        <h2 className="text-5xl font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                            {card.es}
                        </h2>
                        <p className="text-muted-foreground italic">Translate to English</p>
                    </CardContent>
                </Card>

                {/* BACK */}
                <Card
                    className={cn(
                        "absolute w-full h-full backface-hidden flex flex-col items-center justify-center shadow-lg p-6 transition-opacity duration-300 delay-150",
                        lastResult === "success"
                            ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
                            : "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800",
                        !isReviewing ? "opacity-0" : "opacity-100"
                    )}
                    style={{ transform: "rotateY(180deg)" }}
                >
                    <div className="absolute top-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        Translation
                    </div>
                    <CardContent className="text-center space-y-6">
                        <h2 className="text-4xl font-bold text-slate-900 dark:text-slate-50">
                            {card.en.toUpperCase()}
                        </h2>
                        <div className="space-y-2 w-full">
                            <div className="w-16 h-1 bg-black/10 mx-auto rounded-full mb-4" />
                            <HighlightedSentence text={card.ex} />
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
