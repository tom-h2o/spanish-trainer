import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { LevelFilter, PartFilter } from "@/hooks/useGameState";

interface GameControlsProps {
    filters: {
        levels: LevelFilter[];
        parts: PartFilter[];
    };
    onToggleLevel: (l: LevelFilter) => void;
    onTogglePart: (p: PartFilter) => void;
    isReverseMode?: boolean;
    onToggleReverseMode?: () => void;
    stats: {
        lvl0: number;
        lvl1: number;
        lvl2: number;
        lvl3: number;
    };
}

export function GameControls({ filters, onToggleLevel, onTogglePart, stats, isReverseMode = false, onToggleReverseMode }: GameControlsProps) {
    return (
        <div className="w-full max-w-[600px] bg-white/50 dark:bg-slate-900/50 backdrop-blur-md p-6 rounded-xl border shadow-sm space-y-6">

            {/* TOP ROW: Parts and Mode */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-6 border-b pb-6 border-slate-200 dark:border-slate-800">
                {/* PARTS */}
                <div className="flex flex-1 items-center gap-3">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Decks:</span>
                    {[1, 2].map((p) => (
                        <div key={p} className="flex items-center space-x-2 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors">
                            <Checkbox
                                id={`part-${p}`}
                                checked={filters.parts.includes(p as PartFilter)}
                                onCheckedChange={() => onTogglePart(p as PartFilter)}
                            />
                            <Label htmlFor={`part-${p}`} className="cursor-pointer text-sm font-medium">
                                Part {p}
                            </Label>
                        </div>
                    ))}
                </div>

                {/* MODE TOGGLE */}
                {onToggleReverseMode && (
                    <div className="flex items-center space-x-3 bg-indigo-50 dark:bg-indigo-950/30 px-4 py-2 rounded-xl border border-indigo-100 dark:border-indigo-900/50">
                        <Label htmlFor="reverse-mode" className="cursor-pointer text-sm font-bold text-indigo-700 dark:text-indigo-400">
                            English Mode
                        </Label>
                        <Switch
                            id="reverse-mode"
                            checked={isReverseMode}
                            onCheckedChange={onToggleReverseMode}
                        />
                        <Label htmlFor="reverse-mode" className="cursor-pointer text-sm font-bold text-slate-700 dark:text-slate-300">
                            Reverse (ES)
                        </Label>
                    </div>
                )}
            </div>

            {/* BOTTOM ROW: LEVELS */}
            <div className="flex flex-col gap-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest text-center sm:text-left">Mastery Levels Filter:</span>
                <div className="flex flex-wrap items-center gap-3 justify-center sm:justify-start">
                    {[0, 1, 2, 3].map((l) => (
                        <div key={l} className="flex items-center space-x-2 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors">
                            <Checkbox
                                id={`lvl-${l}`}
                                checked={filters.levels.includes(l as LevelFilter)}
                                onCheckedChange={() => onToggleLevel(l as LevelFilter)}
                            />
                            <Label htmlFor={`lvl-${l}`} className="cursor-pointer flex items-center gap-2 text-sm">
                                <span className={l === 0 ? "text-slate-500 font-medium italic" : "font-bold"}>{l === 0 ? "New Words" : `Level ${l}`}</span>
                                <Badge variant={l === 0 ? "outline" : "secondary"} className="text-xs h-5 px-1.5 min-w-[20px] justify-center ml-1">
                                    {(stats as any)[`lvl${l}`]}
                                </Badge>
                            </Label>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
