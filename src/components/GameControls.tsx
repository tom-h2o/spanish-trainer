import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { LevelFilter, PartFilter } from "@/hooks/useGameState";

interface GameControlsProps {
    filters: {
        levels: LevelFilter[];
        parts: PartFilter[];
    };
    onToggleLevel: (l: LevelFilter) => void;
    onTogglePart: (p: PartFilter) => void;
    stats: {
        lvl0: number;
        lvl1: number;
        lvl2: number;
        lvl3: number;
    };
}

export function GameControls({ filters, onToggleLevel, onTogglePart, stats }: GameControlsProps) {
    return (
        <div className="w-full max-w-[600px] bg-white/50 dark:bg-slate-900/50 backdrop-blur-md p-4 rounded-xl border shadow-sm space-y-4">
            {/* PARTS */}
            <div className="flex flex-wrap items-center gap-4 justify-center">
                <span className="text-sm font-bold text-primary uppercase tracking-wider">Decks:</span>
                {[1, 2].map((p) => (
                    <div key={p} className="flex items-center space-x-2 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border">
                        <Checkbox
                            id={`part-${p}`}
                            checked={filters.parts.includes(p as PartFilter)}
                            onCheckedChange={() => onTogglePart(p as PartFilter)}
                        />
                        <Label htmlFor={`part-${p}`} className="cursor-pointer font-medium">
                            Part {p}
                        </Label>
                    </div>
                ))}
            </div>

            {/* LEVELS */}
            <div className="flex flex-wrap items-center gap-3 justify-center">
                <span className="text-sm font-bold text-primary uppercase tracking-wider">Levels:</span>
                {[0, 1, 2, 3].map((l) => (
                    <div key={l} className="flex items-center space-x-2 bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border">
                        <Checkbox
                            id={`lvl-${l}`}
                            checked={filters.levels.includes(l as LevelFilter)}
                            onCheckedChange={() => onToggleLevel(l as LevelFilter)}
                        />
                        <Label htmlFor={`lvl-${l}`} className="cursor-pointer flex items-center gap-2">
                            <span>{l === 0 ? "New" : `Lvl ${l}`}</span>
                            <Badge variant="secondary" className="text-[10px] h-5 px-1.5 min-w-[20px] justify-center">
                                {(stats as any)[`lvl${l}`]}
                            </Badge>
                        </Label>
                    </div>
                ))}
            </div>
        </div>
    );
}
