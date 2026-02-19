import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Word } from "@/data/vocab";

interface GameCardProps {
    card: Word | null;
    isReviewing: boolean;
    lastResult: "success" | "error" | null;
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
                animate={{ rotateX: isReviewing ? 180 : 0 }}
                style={{ transformStyle: "preserve-3d" }}
            >
                {/* FRONT */}
                <Card className="absolute w-full h-full backface-hidden flex flex-col items-center justify-center border-t-4 border-t-primary shadow-lg p-6">
                    <div className="absolute top-4 left-4 text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
                        Part {card.p} • Level {card.lvl}
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
                        "absolute w-full h-full backface-hidden flex flex-col items-center justify-center shadow-lg p-6 rotate-x-180",
                        lastResult === "success"
                            ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
                            : "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
                    )}
                    style={{ transform: "rotateX(180deg)" }}
                >
                    <div className="absolute top-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                        Translation
                    </div>
                    <CardContent className="text-center space-y-6">
                        <h2 className="text-4xl font-bold text-slate-900 dark:text-slate-50">
                            {card.en.toUpperCase()}
                        </h2>
                        <div className="space-y-2">
                            <div className="w-16 h-1 bg-black/10 mx-auto rounded-full" />
                            <p className="text-sm text-muted-foreground italic px-8">
                                "{card.ex}"
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>
    );
}
