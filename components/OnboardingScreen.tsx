import React, { useState } from 'react';
import type { UserGoals } from '../types';
import { calculateInitialGoals } from '../services/geminiService';

interface OnboardingScreenProps {
    onComplete: (goals: UserGoals) => void;
}

type FormData = {
    gender: 'male' | 'female';
    age: number | '';
    height: number | '';
    currentWeight: number | '';
    goalWeight: number | '';
    activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
};

const activityLevels = {
    sedentary: 'Sedentary (little or no exercise)',
    light: 'Lightly active (light exercise/sports 1-3 days/week)',
    moderate: 'Moderately active (moderate exercise/sports 3-5 days/week)',
    active: 'Very active (hard exercise/sports 6-7 days a week)',
    very_active: 'Extra active (very hard exercise/sports & physical job)',
};

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState<FormData>({
        gender: 'male',
        age: 30,
        height: 175,
        currentWeight: 70,
        goalWeight: 65,
        activityLevel: 'moderate'
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const TOTAL_STEPS = 5;

    const handleNext = () => {
        // Simple validation before next step
        switch(step) {
            case 2: if (formData.age === '' || formData.age < 13) {setError('Please enter a valid age (13+).'); return;} break;
            case 3: if (formData.height === '' || formData.currentWeight === '') {setError('Please enter your height and weight.'); return;} break;
            case 4: if (formData.goalWeight === '') {setError('Please enter your goal weight.'); return;} break;
        }
        setError(null);
        if (step === TOTAL_STEPS) {
             handleSubmit();
        } else {
            setStep(s => s + 1);
        }
    };
    const handleBack = () => setStep(s => Math.max(s - 1, 1));
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: e.target.type === 'number' ? (value === '' ? '' : Number(value)) : value
        }));
    };

    const handleRadioChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value as any }));
    };
    
    const handleSubmit = async () => {
         for (const key in formData) {
            if (formData[key as keyof FormData] === '') {
                setError(`Please fill out all fields. ${key} is missing.`);
                return;
            }
        }
        setIsLoading(true);
        setError(null);

        const goalsToCalc = {
            ...formData,
            age: Number(formData.age),
            height: Number(formData.height),
            currentWeight: Number(formData.currentWeight),
            goalWeight: Number(formData.goalWeight),
        };

        try {
            const calculatedGoals = await calculateInitialGoals(goalsToCalc);
            if (calculatedGoals) {
                onComplete({ ...goalsToCalc, ...calculatedGoals } as UserGoals);
            } else {
                throw new Error("Could not calculate goals.");
            }
        } catch (e) {
             // Fallback if Gemini fails
             console.error("Onboarding goal calculation failed, using defaults.", e);
             setError("Could not generate a personalized plan. Using default goals.");
             setTimeout(() => {
                onComplete({
                    ...goalsToCalc,
                    dailyCalorieGoal: 2000,
                    dailyProteinGoal: 150,
                    dailyCarbsGoal: 200,
                    dailyFatGoal: 60,
                    dailyWaterGoal: 8,
                });
             }, 2000);
        } finally {
            // Keep loading state until the timeout completes on error
            // setIsLoading(false);
        }
    };
    
    if (isLoading) {
         return (
            <div className="fixed inset-0 bg-slate-100 dark:bg-slate-900 flex flex-col justify-center items-center text-center p-4">
                <div className="w-16 h-16 border-4 border-t-blue-500 border-slate-200 dark:border-slate-700 rounded-full animate-spin mb-6"></div>
                <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-200 mb-2">Crafting Your Plan...</h2>
                <p className="text-slate-500 dark:text-slate-400 max-w-sm">We're personalizing your daily goals based on your profile. This might take a moment.</p>
                {error && <p className="text-red-500 mt-4">{error}</p>}
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex items-center justify-center p-4 font-sans">
            <div className="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 space-y-6">
                <div>
                    <div className="flex justify-between items-center mb-2">
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                           {step === 1 && "Welcome to Auranut!"}
                           {step === 2 && "About You"}
                           {step === 3 && "Your Metrics"}
                           {step === 4 && "Your Goal"}
                           {step === 5 && "Your Lifestyle"}
                        </h2>
                        <span className="text-sm font-semibold text-slate-400 dark:text-slate-500">Step {step}/{TOTAL_STEPS}</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5">
                        <div className="bg-blue-600 h-1.5 rounded-full transition-all duration-500" style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}></div>
                    </div>
                </div>

                {error && <p className="text-red-500 text-sm text-center bg-red-50 p-2 rounded-md">{error}</p>}

                <div className="min-h-[200px] flex flex-col justify-center">
                    {step === 1 && (
                        <div className="text-center">
                            <p className="text-slate-600 dark:text-slate-300 text-lg">Let's set up your profile to create a personalized health plan just for you.</p>
                        </div>
                    )}
                     {step === 2 && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Gender</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button 
                                        onClick={() => handleRadioChange('gender', 'male')} 
                                        className={`p-4 rounded-lg border-2 text-center font-semibold transition-colors ${formData.gender === 'male' ? 'bg-blue-50 dark:bg-blue-900/50 border-blue-500 text-blue-700 dark:text-blue-300' : 'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200'}`}>
                                            Male
                                    </button>
                                    <button 
                                        onClick={() => handleRadioChange('gender', 'female')} 
                                        className={`p-4 rounded-lg border-2 text-center font-semibold transition-colors ${formData.gender === 'female' ? 'bg-blue-50 dark:bg-blue-900/50 border-blue-500 text-blue-700 dark:text-blue-300' : 'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200'}`}>
                                            Female
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label htmlFor="age" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Age</label>
                                <input type="number" id="age" name="age" value={formData.age} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3"/>
                            </div>
                        </div>
                    )}
                     {step === 3 && (
                        <div className="space-y-4">
                           <div>
                                <label htmlFor="height" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Height (cm)</label>
                                <input type="number" id="height" name="height" value={formData.height} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3"/>
                            </div>
                             <div>
                                <label htmlFor="currentWeight" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Current Weight (kg)</label>
                                <input type="number" id="currentWeight" name="currentWeight" value={formData.currentWeight} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3"/>
                            </div>
                        </div>
                    )}
                     {step === 4 && (
                        <div className="space-y-4">
                           <div>
                                <label htmlFor="goalWeight" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Goal Weight (kg)</label>
                                <input type="number" id="goalWeight" name="goalWeight" value={formData.goalWeight} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3"/>
                            </div>
                        </div>
                    )}
                    {step === 5 && (
                        <div className="space-y-4">
                           <div>
                                <label htmlFor="activityLevel" className="block text-sm font-medium text-slate-700 dark:text-slate-300">Daily Activity Level</label>
                                 <select id="activityLevel" name="activityLevel" value={formData.activityLevel} onChange={handleChange} className="mt-1 block w-full rounded-md border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-3">
                                    {Object.entries(activityLevels).map(([key, value]) => (
                                        <option key={key} value={key}>{value}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-between items-center pt-4 border-t dark:border-slate-700">
                    <button onClick={handleBack} disabled={step === 1} className="text-slate-500 dark:text-slate-400 font-semibold px-4 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50">Back</button>
                    {step < TOTAL_STEPS && <button onClick={handleNext} className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors">Next</button>}
                    {step === TOTAL_STEPS && <button onClick={handleNext} className="bg-green-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-green-600 transition-colors">Finish Setup</button>}
                </div>
            </div>
        </div>
    );
};
