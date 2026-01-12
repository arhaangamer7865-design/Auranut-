
import React from 'react';
import type { WeightEntry, DailyLog, FoodItem } from '../types';

// Recharts is loaded from a script tag in index.html, so we need to declare it globally
declare const Recharts: any;

const ChartError = () => (
    <div className="flex items-center justify-center h-full">
        <p className="text-red-500 font-semibold">Chart library could not be loaded.</p>
    </div>
);

interface ChartProps {
    theme: 'light' | 'dark';
}

interface WeightChartProps extends ChartProps {
    data: WeightEntry[];
}

export const WeightProgressChart: React.FC<WeightChartProps> = ({ data, theme }) => {
    const RechartsLib = typeof Recharts !== 'undefined' ? Recharts : null;
    const { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } = RechartsLib || {};

    const colors = {
        light: { text: '#475569', grid: '#e2e8f0', line: '#3b82f6', tooltipBg: '#ffffff', tooltipText: '#334155' },
        dark: { text: '#94a3b8', grid: '#334155', line: '#60a5fa', tooltipBg: '#1e293b', tooltipText: '#f1f5f9' }
    };
    const currentColors = colors[theme];


    return (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-lg shadow-md h-80 flex flex-col">
            <h3 className="font-bold text-lg mb-4 text-slate-700 dark:text-slate-200">Weight Progress (kg)</h3>
            <div className="flex-grow">
                {RechartsLib ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={currentColors.grid} />
                            <XAxis dataKey="date" stroke={currentColors.text} />
                            <YAxis domain={['dataMin - 2', 'dataMax + 2']} stroke={currentColors.text}/>
                            <Tooltip 
                                contentStyle={{ backgroundColor: currentColors.tooltipBg, border: '1px solid #334155', borderRadius: '0.5rem' }} 
                                itemStyle={{ color: currentColors.tooltipText }} 
                                labelStyle={{ color: currentColors.tooltipText, fontWeight: 'bold' }} 
                            />
                            <Legend wrapperStyle={{ color: currentColors.text }} />
                            <Line type="monotone" dataKey="weight" stroke={currentColors.line} strokeWidth={2} activeDot={{ r: 8 }} />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <ChartError />
                )}
            </div>
        </div>
    );
};


interface CalorieChartProps extends ChartProps {
    logs: DailyLog[];
    calorieGoal: number;
}

export const CalorieHistoryChart: React.FC<CalorieChartProps> = ({ logs, calorieGoal, theme }) => {
    const RechartsLib = typeof Recharts !== 'undefined' ? Recharts : null;
    const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } = RechartsLib || {};

    const chartData = logs.map(log => {
        // FIX: Cast the result of flat() to FoodItem[] to fix type inference issues within reduce.
        const totalCalories = (Object.values(log.meals).flat() as FoodItem[]).reduce((sum, item) => sum + item.calories, 0);
        return {
            date: log.date.slice(5), // Show MM-DD
            consumed: totalCalories,
            goal: calorieGoal,
        };
    });
    
    const colors = {
        light: { text: '#475569', grid: '#e2e8f0', bar1: '#8884d8', bar2: '#82ca9d', tooltipBg: '#ffffff', tooltipText: '#334155' },
        dark: { text: '#94a3b8', grid: '#334155', bar1: '#a7a2f6', bar2: '#86efac', tooltipBg: '#1e293b', tooltipText: '#f1f5f9' }
    };
    const currentColors = colors[theme];

    return (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-lg shadow-md h-80 mt-6 flex flex-col">
            <h3 className="font-bold text-lg mb-4 text-slate-700 dark:text-slate-200">Calorie Intake History</h3>
             <div className="flex-grow">
                {RechartsLib ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={currentColors.grid} />
                            <XAxis dataKey="date" stroke={currentColors.text} />
                            <YAxis stroke={currentColors.text} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: currentColors.tooltipBg, border: '1px solid #334155', borderRadius: '0.5rem' }} 
                                itemStyle={{ color: currentColors.tooltipText }} 
                                labelStyle={{ color: currentColors.tooltipText, fontWeight: 'bold' }} 
                            />
                            <Legend wrapperStyle={{ color: currentColors.text }} />
                            <Bar dataKey="consumed" fill={currentColors.bar1} name="Calories Consumed" />
                            <Bar dataKey="goal" fill={currentColors.bar2} name="Daily Goal" />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <ChartError />
                )}
            </div>
        </div>
    );
};