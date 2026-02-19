import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { UserWord } from '@/hooks/useGameState';

interface ProgressDashboardProps {
    vocabList: UserWord[];
}

export function ProgressDashboard({ vocabList }: ProgressDashboardProps) {
    // 1. Calculate mastery distribution
    const masteryCounts = {
        lvl0: 0,
        lvl1: 0,
        lvl2: 0,
        lvl3: 0,
    };

    vocabList.forEach(word => {
        masteryCounts[`lvl${word.lvl}` as keyof typeof masteryCounts]++;
    });

    const totalWords = vocabList.length;
    const masteredWords = masteryCounts.lvl3;
    const learningWords = masteryCounts.lvl1 + masteryCounts.lvl2;

    // 2. Format data for Recharts
    const chartData = [
        { name: 'New (Lvl 0)', value: masteryCounts.lvl0, color: '#f1f5f9' },
        { name: 'Learning (Lvl 1)', value: masteryCounts.lvl1, color: '#fef08a' },
        { name: 'Familiar (Lvl 2)', value: masteryCounts.lvl2, color: '#bbf7d0' },
        { name: 'Mastered (Lvl 3)', value: masteryCounts.lvl3, color: '#4ade80' },
    ];

    // Calculate overall progress percentage (weighted by level)
    const totalPossibleScore = totalWords * 3;
    const currentScore = (masteryCounts.lvl1 * 1) + (masteryCounts.lvl2 * 2) + (masteryCounts.lvl3 * 3);
    const progressPercentage = totalPossibleScore > 0 ? Math.round((currentScore / totalPossibleScore) * 100) : 0;

    return (
        <div className="w-full max-w-4xl space-y-6">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 px-2">
                Your Progress
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Stats Summary Cards */}
                <Card className="bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950/20 dark:to-slate-900 border-indigo-100 dark:border-indigo-900/50">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-indigo-600 dark:text-indigo-400 font-semibold uppercase tracking-wider text-xs">Overall Fluency</CardDescription>
                        <CardTitle className="text-4xl font-black text-indigo-900 dark:text-indigo-100">{progressPercentage}%</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="w-full bg-indigo-100/50 dark:bg-indigo-900/30 rounded-full h-2.5 mt-2">
                            <div className="bg-indigo-500 h-2.5 rounded-full" style={{ width: `${progressPercentage}%` }}></div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-slate-900 border-green-100 dark:border-green-900/50">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-green-600 dark:text-green-400 font-semibold uppercase tracking-wider text-xs">Mastered</CardDescription>
                        <CardTitle className="text-4xl font-black text-green-900 dark:text-green-100">{masteredWords}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-green-700/80 dark:text-green-400/80">
                            Words confidently memorized
                        </p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/20 dark:to-slate-900 border-amber-100 dark:border-amber-900/50">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-amber-600 dark:text-amber-400 font-semibold uppercase tracking-wider text-xs">Learning</CardDescription>
                        <CardTitle className="text-4xl font-black text-amber-900 dark:text-amber-100">{learningWords}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-amber-700/80 dark:text-amber-400/80">
                            Currently in spaced repetition
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Mastery Graph */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
                <CardHeader>
                    <CardTitle className="text-lg">Vocabulary Distribution</CardTitle>
                    <CardDescription>
                        Breakdown of your flashcards by Spaced Repetition mastery level.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={chartData}
                                margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#64748b', fontSize: 12 }}
                                    allowDecimals={false}
                                />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar
                                    dataKey="value"
                                    radius={[4, 4, 0, 0]}
                                    animationDuration={1500}
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </div >
    );
}
