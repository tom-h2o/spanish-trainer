import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, HelpCircle, ArrowRight } from "lucide-react";

interface GameInputProps {
    onCheck: (val: string) => void;
    onGiveUp: () => void;
    onSkip: () => void;
    onNext: () => void;
    isReviewing: boolean;
    feedbackMsg: string;
    feedbackType: 'success' | 'warning' | 'error' | 'neutral';
}

export function GameInput({ onCheck, onGiveUp, onSkip, onNext, isReviewing, feedbackMsg, feedbackType }: GameInputProps) {
    const [val, setVal] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!isReviewing) {
            setVal("");
            inputRef.current?.focus();
        } else {
            // Focus "Next" button logic could be handled by auto-focusing the button, 
            // but typically user might want to appreciate the card first.
            const nextBtn = document.getElementById("btn-next");
            if (nextBtn) nextBtn.focus();
        }
    }, [isReviewing]);

    // Global listener for Enter during review mode
    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Enter" && isReviewing) {
                e.preventDefault();
                onNext();
            }
        };

        if (isReviewing) {
            window.addEventListener("keydown", handleGlobalKeyDown);
            return () => window.removeEventListener("keydown", handleGlobalKeyDown);
        }
    }, [isReviewing, onNext]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            e.stopPropagation();
            handleCheck();
        }
    };

    const handleCheck = () => {
        if (!val.trim()) return;
        onCheck(val);
    };

    return (
        <div className="w-full max-w-[600px] flex flex-col gap-4 items-center">
            {/* Feedback Message */}
            <div className={`h-8 font-bold text-lg transition-all duration-300 ${feedbackType === 'success' ? 'text-green-600' :
                feedbackType === 'warning' ? 'text-amber-600' :
                    feedbackType === 'error' ? 'text-red-500' : 'text-transparent'
                }`}>
                {feedbackMsg || "..."}
            </div>

            <div className="w-full flex gap-2">
                {!isReviewing ? (
                    <>
                        <Input
                            ref={inputRef}
                            value={val}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setVal(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type English translation..."
                            className="h-12 text-lg shadow-sm bg-white dark:bg-slate-950"
                            autoComplete="off"
                        />
                        <Button onClick={handleCheck} size="lg" className="h-12 px-6 bg-green-600 hover:bg-green-700 text-white font-bold">
                            <Send className="w-4 h-4 mr-2" /> Check
                        </Button>
                        <Button onClick={onGiveUp} variant="secondary" size="lg" className="h-12 w-12 px-0 bg-amber-100 text-amber-900 border-amber-200">
                            <HelpCircle className="w-5 h-5" />
                        </Button>
                    </>
                ) : (
                    <Button
                        id="btn-next"
                        onClick={onNext}
                        size="lg"
                        className="w-full h-12 text-xl font-bold bg-blue-600 hover:bg-blue-700 shadow-lg animate-in fade-in zoom-in duration-300"
                        autoFocus
                    >
                        Next Card <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                )}
            </div>

            {!isReviewing && (
                <Button onClick={onSkip} variant="ghost" className="text-muted-foreground hover:text-foreground">
                    Skip this card
                </Button>
            )}
        </div>
    );
}
