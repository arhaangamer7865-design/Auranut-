
import React, { useState, useEffect, useMemo } from 'react';
import type { Page, UserGoals, DailyLog, WeightEntry, FoodItem, ExerciseItem, MealType, User } from './types';
import * as Icons from './components/Icons';
import { WeightProgressChart, CalorieHistoryChart } from './components/ProgressChart';
import { searchFoodWithGrounding, getCaloriesBurned, getDeepHealthAnalysis } from './services/geminiService';
import { MealScanner } from './components/MealScanner';
import { OnboardingScreen } from './components/OnboardingScreen';
import { AICoach } from './components/AICoach';
import { LoginScreen } from './components/LoginScreen';

// ----- Modal Component -----

const Modal: React.FC<{ children: React.ReactNode; onClose: () => void; title: string }> = ({ children, onClose, title }) => (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-md m-4 border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">{title}</h2>
                <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-500 transition-colors"><Icons.CloseIcon /></button>
            </div>
            {children}
        </div>
    </div>
);

// ----- Calorie Ring Component -----

const CalorieRing: React.FC<{ consumed: number; burned: number; goal: number; }> = ({ consumed, burned, goal }) => {
    const net = consumed - burned;
    const remaining = goal - net;
    const percentage = goal > 0 ? (net / goal) * 100 : 0;
    const circumference = 2 * Math.PI * 54;
    const offset = circumference - (Math.min(Math.max(percentage, 0), 100) / 100) * circumference;

    const ringColor = percentage > 110 ? 'stroke-rose-500' : percentage > 100 ? 'stroke-orange-500' : 'stroke-emerald-500';

    return (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none mb-6 flex flex-col items-center border border-slate-100 dark:border-slate-800">
            <div className="relative w-48 h-48">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                    <circle className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="10" fill="transparent" r="54" cx="60" cy="60" />
                    <circle className={`transition-all duration-1000 ease-out ${ringColor}`} strokeWidth="10" strokeLinecap="round" fill="transparent" r="54" cx="60" cy="60" strokeDasharray={circumference} strokeDashoffset={offset} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className={`text-4xl font-black ${remaining < 0 ? 'text-rose-500' : 'text-slate-800 dark:text-slate-100'}`}>{Math.abs(Math.round(remaining))}</span>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{remaining < 0 ? 'Over Goal' : 'Remaining'}</span>
                </div>
            </div>
            <div className="w-full grid grid-cols-3 gap-4 mt-6 pt-6 border-t dark:border-slate-800">
                 <div className="text-center">
                    <p className="font-black text-lg text-slate-800 dark:text-slate-200">{goal}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Goal</p>
                </div>
                <div className="text-center">
                    <p className="font-black text-lg text-blue-500">{consumed}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Food</p>
                </div>
                <div className="text-center">
                    <p className="font-black text-lg text-orange-500">{burned}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Exer</p>
                </div>
            </div>
        </div>
    );
};

// ----- Food Add Component -----

const AddFoodExperience: React.FC<{
    onClose: () => void;
    onAddFoods: (mealType: MealType, foods: FoodItem[]) => void;
    dailyLogs: DailyLog[];
    onScan: () => void;
}> = ({ onClose, onAddFoods, dailyLogs, onScan }) => {
    const [selectedItems, setSelectedItems] = useState<FoodItem[]>([]);
    const [isSelectingMeal, setIsSelectingMeal] = useState(false);
    const [foodQuery, setFoodQuery] = useState('');
    const [searchResults, setSearchResults] = useState<FoodItem[] | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSearch = async () => {
        if (!foodQuery.trim()) return;
        setIsLoading(true);
        const results = await searchFoodWithGrounding(foodQuery);
        setSearchResults(results);
        setIsLoading(false);
    };

    const handleToggleSelection = (food: FoodItem) => {
        setSelectedItems(prev => prev.some(i => i.id === food.id) ? prev.filter(i => i.id !== food.id) : [...prev, food]);
    };

    const handleAddClick = () => setIsSelectingMeal(true);

    const handleSelectMealType = (mealType: MealType) => {
        onAddFoods(mealType, selectedItems);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-slate-50 dark:bg-slate-900 z-[60] flex flex-col">
            <header className="p-4 bg-white dark:bg-slate-800 border-b dark:border-slate-700 flex items-center justify-between">
                <button onClick={onClose} className="p-2 text-slate-500"><Icons.CloseIcon /></button>
                <h2 className="font-bold dark:text-white">Add Food</h2>
                <button onClick={onScan} className="p-2 text-blue-500"><Icons.BarcodeIcon /></button>
            </header>
            
            <div className="p-4 bg-white dark:bg-slate-800">
                <div className="relative">
                    <input
                        type="search"
                        value={foodQuery}
                        onChange={e => setFoodQuery(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSearch()}
                        placeholder="Search web for any food..."
                        className="w-full py-3 pl-4 pr-12 rounded-xl bg-slate-100 dark:bg-slate-700 dark:text-white border-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                    />
                    <button onClick={handleSearch} className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 p-2">
                        <Icons.GlobeIcon />
                    </button>
                </div>
            </div>

            <div className="flex-grow overflow-y-auto p-4 space-y-4 pb-32">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-sm text-slate-500 animate-pulse">Consulting the Oracle of Nutrition...</p>
                    </div>
                ) : searchResults ? (
                    searchResults.map(item => (
                        <div key={item.id} onClick={() => handleToggleSelection(item)} className={`p-4 rounded-2xl border-2 transition-all flex flex-col gap-2 cursor-pointer ${selectedItems.some(i => i.id === item.id) ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800'}`}>
                            <div className="flex items-center gap-4">
                                <span className="text-3xl">{item.emoji}</span>
                                <div className="flex-grow">
                                    <h4 className="font-bold dark:text-white">{item.name}</h4>
                                    <p className="text-xs text-slate-500">{item.calories} kcal • {item.servingSize}{item.servingUnit}</p>
                                </div>
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedItems.some(i => i.id === item.id) ? 'bg-blue-500 border-blue-500' : 'border-slate-300 dark:border-slate-600'}`}>
                                    {selectedItems.some(i => i.id === item.id) && <div className="w-2 h-2 bg-white rounded-full" />}
                                </div>
                            </div>
                            {item.groundingUrls && item.groundingUrls.length > 0 && (
                                <div className="pt-2 border-t border-slate-100 dark:border-slate-700 mt-1">
                                    <div className="flex flex-wrap gap-2">
                                        {item.groundingUrls.slice(0, 2).map((url, idx) => (
                                            <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-500 hover:underline truncate max-w-[150px]" onClick={e => e.stopPropagation()}>
                                                Verified by {new URL(url).hostname}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="text-center py-20 text-slate-400">
                        <Icons.SparklesIcon />
                        <p className="mt-2 text-sm italic">Type something above to search with Gemini AI.</p>
                    </div>
                )}
            </div>

            {selectedItems.length > 0 && (
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-white dark:bg-slate-800 border-t dark:border-slate-700 shadow-2xl">
                    {!isSelectingMeal ? (
                        <button onClick={handleAddClick} className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-lg shadow-blue-500/30 active:scale-95 transition-transform">
                            Log {selectedItems.length} items
                        </button>
                    ) : (
                        <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-bottom-4">
                            {(['Breakfast', 'Lunch', 'Dinner', 'Snacks'] as MealType[]).map(m => (
                                <button key={m} onClick={() => handleSelectMealType(m)} className="py-3 bg-slate-100 dark:bg-slate-700 dark:text-white rounded-xl font-bold hover:bg-blue-600 hover:text-white transition-all">{m}</button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// ----- Main App Component -----

const App: React.FC = () => {
    const [page, setPage] = useState<Page>('dashboard');
    const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('auranut_theme') as any) || 'light');
    const [user, setUser] = useState<User | null>(() => {
        const saved = localStorage.getItem('auranut_user');
        return saved ? JSON.parse(saved) : null;
    });

    const [isAddingFood, setIsAddingFood] = useState(false);
    const [isAddingExercise, setIsAddingExercise] = useState(false);
    const [isScanningMeal, setIsScanningMeal] = useState(false);
    const [isLoggingWeight, setIsLoggingWeight] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [deepAnalysis, setDeepAnalysis] = useState<string | null>(null);

    // Form inputs for modals
    const [exerciseQuery, setExerciseQuery] = useState('');
    const [exerciseDuration, setExerciseDuration] = useState(30);
    const [weightInput, setWeightInput] = useState('');

    const [userGoals, setUserGoals] = useState<UserGoals | null>(() => {
        const saved = localStorage.getItem('auranut_userGoals');
        return saved ? JSON.parse(saved) : null;
    });

    const [dailyLogs, setDailyLogs] = useState<DailyLog[]>(() => {
        const saved = localStorage.getItem('auranut_dailyLogs');
        return saved ? JSON.parse(saved) : [];
    });

    const [weightHistory, setWeightHistory] = useState<WeightEntry[]>(() => {
        const saved = localStorage.getItem('auranut_weightHistory');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
        localStorage.setItem('auranut_theme', theme);
    }, [theme]);

    useEffect(() => { localStorage.setItem('auranut_dailyLogs', JSON.stringify(dailyLogs)); }, [dailyLogs]);
    useEffect(() => { localStorage.setItem('auranut_weightHistory', JSON.stringify(weightHistory)); }, [weightHistory]);
    useEffect(() => { localStorage.setItem('auranut_userGoals', JSON.stringify(userGoals)); }, [userGoals]);
    useEffect(() => { localStorage.setItem('auranut_user', JSON.stringify(user)); }, [user]);

    const todayDate = new Date().toISOString().split('T')[0];
    const todayLog = useMemo(() => {
        let log = dailyLogs.find(l => l.date === todayDate);
        if (!log && user) {
            log = { date: todayDate, meals: { Breakfast: [], Lunch: [], Dinner: [], Snacks: [] }, exercises: [], waterIntake: 0 };
            setDailyLogs(prev => [...prev, log!]);
        }
        return log!;
    }, [dailyLogs, todayDate, user]);

    const stats = useMemo(() => {
        if (!todayLog) return { food: 0, burned: 0 };
        const food = (Object.values(todayLog.meals).flat() as FoodItem[]).reduce((s, i) => s + i.calories, 0);
        const burned = todayLog.exercises.reduce((s, i) => s + i.caloriesBurned, 0);
        return { food, burned };
    }, [todayLog]);

    const handleLogin = (u: User) => setUser(u);
    const handleLogout = () => {
        if (window.confirm("Are you sure you want to log out? All local data will be cleared.")) {
            setUser(null);
            setUserGoals(null);
            setDailyLogs([]);
            setWeightHistory([]);
            localStorage.clear();
        }
    };

    const handleAddExercise = async () => {
        if (!exerciseQuery || !userGoals) return;
        setIsAnalyzing(true);
        const calories = await getCaloriesBurned(exerciseQuery, exerciseDuration, 'minutes', userGoals.currentWeight);
        if (calories !== null) {
            const newExercise: ExerciseItem = { id: Date.now().toString(), name: exerciseQuery, duration: exerciseDuration, durationUnit: 'minutes', caloriesBurned: calories };
            setDailyLogs(prev => prev.map(l => l.date === todayDate ? { ...l, exercises: [...l.exercises, newExercise] } : l));
            setIsAddingExercise(false);
            setExerciseQuery('');
        }
        setIsAnalyzing(false);
    };

    const handleAddWeight = () => {
        if (!weightInput) return;
        const newEntry: WeightEntry = { date: todayDate, weight: parseFloat(weightInput) };
        setWeightHistory(prev => {
            const existing = prev.findIndex(e => e.date === todayDate);
            if (existing >= 0) {
                const updated = [...prev];
                updated[existing] = newEntry;
                return updated;
            }
            return [...prev, newEntry].sort((a,b) => a.date.localeCompare(b.date));
        });
        if (userGoals) setUserGoals({ ...userGoals, currentWeight: newEntry.weight });
        setIsLoggingWeight(false);
        setWeightInput('');
    };

    const handleWaterIntake = (increment: number) => {
        setDailyLogs(prev => prev.map(l => l.date === todayDate ? { ...l, waterIntake: Math.max(0, l.waterIntake + increment) } : l));
    };

    const handleDeepAnalysis = async () => {
        if (!userGoals) return;
        setIsAnalyzing(true);
        const analysis = await getDeepHealthAnalysis(dailyLogs, userGoals);
        setDeepAnalysis(analysis);
        setIsAnalyzing(false);
    };

    if (!user) return <LoginScreen onLogin={handleLogin} />;
    if (!userGoals) return <OnboardingScreen onComplete={goals => setUserGoals(goals)} />;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans pb-28 text-slate-900 dark:text-slate-100">
            <header className="p-4 flex justify-between items-center max-w-4xl mx-auto">
                <div className="flex items-center gap-3">
                   {user.photo && <img src={user.photo} alt={user.name} className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-800" />}
                   <h1 className="text-2xl font-black tracking-tighter uppercase">AURANUT<span className="text-blue-500">.</span></h1>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="p-2 bg-white dark:bg-slate-900 rounded-xl shadow-sm border dark:border-slate-800">
                        {theme === 'light' ? <Icons.MoonIcon /> : <Icons.SunIcon />}
                    </button>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4">
                {page === 'dashboard' && (
                    <div className="space-y-6">
                        <CalorieRing consumed={stats.food} burned={stats.burned} goal={userGoals.dailyCalorieGoal} />
                        
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => setIsAddingFood(true)} className="p-6 bg-blue-600 text-white rounded-3xl font-black flex flex-col items-center gap-2 shadow-xl shadow-blue-500/20 active:scale-95 transition-all">
                                <Icons.PlusIcon />
                                <span>Log Food</span>
                            </button>
                            <button onClick={() => setIsAddingExercise(true)} className="p-6 bg-slate-900 dark:bg-slate-800 text-white rounded-3xl font-black flex flex-col items-center gap-2 shadow-xl active:scale-95 transition-all">
                                <Icons.DumbbellIcon />
                                <span>Exercise</span>
                            </button>
                        </div>

                        {/* Hydration Tracker */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-black text-xs uppercase tracking-widest text-slate-400">Daily Hydration</h3>
                                <span className="text-sm font-black text-blue-500">{todayLog?.waterIntake || 0} / {userGoals.dailyWaterGoal} Cups</span>
                            </div>
                            <div className="flex flex-wrap gap-2 justify-center mb-4">
                                {[...Array(Math.max(8, userGoals.dailyWaterGoal))].map((_, i) => (
                                    <button key={i} onClick={() => handleWaterIntake((todayLog?.waterIntake || 0) > i ? -1 : 1)}>
                                        <Icons.WaterGlassIcon filled={(todayLog?.waterIntake || 0) > i} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Exercise Log */}
                        {todayLog && todayLog.exercises.length > 0 && (
                             <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                                <h3 className="font-black text-xs uppercase tracking-widest text-slate-400 mb-4">Exercises</h3>
                                <div className="space-y-3">
                                    {todayLog.exercises.map(ex => (
                                        <div key={ex.id} className="flex justify-between items-center">
                                            <div>
                                                <p className="text-sm font-bold">{ex.name}</p>
                                                <p className="text-[10px] text-slate-400 uppercase font-black">{ex.duration} {ex.durationUnit}</p>
                                            </div>
                                            <p className="text-sm font-black text-orange-500">-{ex.caloriesBurned} KCAL</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {todayLog && (Object.entries(todayLog.meals) as [MealType, FoodItem[]][]).map(([type, items]) => (
                            <div key={type} className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-black text-slate-800 dark:text-slate-100 uppercase text-xs tracking-widest">{type}</h3>
                                    <span className="text-xs font-bold text-slate-400">{items.reduce((s, i) => s + i.calories, 0)} KCAL</span>
                                </div>
                                <div className="space-y-3">
                                    {items.map(item => (
                                        <div key={item.id} className="flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                                                <span className="text-xl">{item.emoji}</span>
                                                <div>
                                                    <p className="text-sm font-bold">{item.name}</p>
                                                    <p className="text-[10px] text-slate-400 font-medium">{item.servingSize}{item.servingUnit}</p>
                                                </div>
                                            </div>
                                            <p className="text-sm font-black text-slate-600 dark:text-slate-400">{item.calories}</p>
                                        </div>
                                    ))}
                                    {items.length === 0 && <p className="text-xs text-slate-300 dark:text-slate-600 italic">Tap + to add items</p>}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {page === 'coach' && <AICoach goals={userGoals} todayLog={todayLog} />}

                {page === 'progress' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-black">Trends</h2>
                            <div className="flex gap-2">
                                <button onClick={() => setIsLoggingWeight(true)} className="px-4 py-2 bg-slate-800 text-white rounded-xl text-sm font-bold shadow-lg">Log Weight</button>
                                <button onClick={handleDeepAnalysis} disabled={isAnalyzing} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-indigo-500/20 disabled:opacity-50 transition-all">
                                    {isAnalyzing ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Icons.SparklesIcon />}
                                    AI Report
                                </button>
                            </div>
                        </div>
                        {deepAnalysis && (
                            <div className="p-6 bg-indigo-50 dark:bg-indigo-950/30 rounded-3xl border border-indigo-100 dark:border-indigo-900/50 text-indigo-900 dark:text-indigo-200 text-sm leading-relaxed whitespace-pre-wrap animate-in fade-in zoom-in-95">
                                <h4 className="font-black mb-2 uppercase tracking-widest text-[10px]">Thinking Analysis</h4>
                                {deepAnalysis}
                            </div>
                        )}
                        <WeightProgressChart data={weightHistory} theme={theme} />
                        <CalorieHistoryChart logs={dailyLogs} calorieGoal={userGoals.dailyCalorieGoal} theme={theme} />
                    </div>
                )}

                {page === 'goals' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                           <h2 className="text-2xl font-black">Profile</h2>
                           <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-xl text-sm font-bold">
                               <Icons.LogoutIcon /> Logout
                           </button>
                        </div>
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-4">
                            <div className="flex items-center gap-4 mb-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                                {user.photo && <img src={user.photo} alt={user.name} className="w-12 h-12 rounded-full ring-2 ring-blue-500" />}
                                <div>
                                    <p className="font-bold">{user.name}</p>
                                    <p className="text-xs text-slate-500 font-medium">{user.email}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Goal Weight (kg)</label>
                                    <input type="number" value={userGoals.goalWeight} onChange={e => setUserGoals({...userGoals, goalWeight: parseFloat(e.target.value)})} className="w-full mt-1 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Calorie Goal</label>
                                    <input type="number" value={userGoals.dailyCalorieGoal} onChange={e => setUserGoals({...userGoals, dailyCalorieGoal: parseInt(e.target.value)})} className="w-full mt-1 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border-none focus:ring-2 focus:ring-blue-500" />
                                </div>
                            </div>
                            <button onClick={() => alert("Settings updated!")} className="w-full py-4 bg-emerald-600 text-white font-black rounded-2xl shadow-xl shadow-emerald-500/20 active:scale-95 transition-transform mt-4">Save Changes</button>
                        </div>
                    </div>
                )}
            </main>

            {/* Modals */}
            {isAddingFood && (
                <AddFoodExperience
                    onClose={() => setIsAddingFood(false)}
                    dailyLogs={dailyLogs}
                    onScan={() => { setIsAddingFood(false); setIsScanningMeal(true); }}
                    onAddFoods={(type, items) => {
                        setDailyLogs(prev => prev.map(l => l.date === todayDate ? { ...l, meals: { ...l.meals, [type]: [...l.meals[type as MealType], ...items] } } : l));
                        setIsAddingFood(false);
                    }}
                />
            )}

            {isAddingExercise && (
                <Modal onClose={() => setIsAddingExercise(false)} title="Log Exercise">
                    <div className="space-y-4">
                        <input type="text" value={exerciseQuery} onChange={e => setExerciseQuery(e.target.value)} placeholder="What did you do? (e.g. 5km run)" className="w-full p-4 bg-slate-100 dark:bg-slate-700 rounded-xl border-none focus:ring-2 focus:ring-orange-500" />
                        <div className="flex items-center justify-between px-2">
                             <span className="text-sm font-bold">Duration (min)</span>
                             <div className="flex items-center gap-3">
                                 <button onClick={() => setExerciseDuration(d => Math.max(5, d-5))} className="p-2 bg-slate-200 dark:bg-slate-700 rounded-lg"><Icons.MinusIcon /></button>
                                 <span className="font-black w-8 text-center">{exerciseDuration}</span>
                                 <button onClick={() => setExerciseDuration(d => d+5)} className="p-2 bg-slate-200 dark:bg-slate-700 rounded-lg"><Icons.PlusIcon /></button>
                             </div>
                        </div>
                        <button onClick={handleAddExercise} disabled={isAnalyzing || !exerciseQuery} className="w-full py-4 bg-orange-500 text-white font-black rounded-2xl shadow-lg shadow-orange-500/20 disabled:opacity-50">
                            {isAnalyzing ? "Calculating Calories..." : "Add to Log"}
                        </button>
                    </div>
                </Modal>
            )}

            {isLoggingWeight && (
                <Modal onClose={() => setIsLoggingWeight(false)} title="Update Weight">
                    <div className="space-y-4">
                        <input type="number" step="0.1" value={weightInput} onChange={e => setWeightInput(e.target.value)} placeholder={`Last: ${userGoals.currentWeight} kg`} className="w-full p-4 bg-slate-100 dark:bg-slate-700 rounded-xl border-none focus:ring-2 focus:ring-blue-500 text-center text-3xl font-black" />
                        <button onClick={handleAddWeight} className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-lg shadow-blue-500/20">Record Progress</button>
                    </div>
                </Modal>
            )}

            {isScanningMeal && (
                <MealScanner 
                    onClose={() => setIsScanningMeal(false)} 
                    onScanSuccess={(item) => {
                        setDailyLogs(prev => prev.map(l => l.date === todayDate ? { ...l, meals: { ...l.meals, Lunch: [...l.meals.Lunch, item] } } : l));
                        setIsScanningMeal(false);
                    }} 
                />
            )}

            <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-full shadow-2xl px-4 py-2 flex items-center gap-1 z-50">
                {[
                    { id: 'dashboard', icon: <Icons.HomeIcon />, label: 'Log' },
                    { id: 'progress', icon: <Icons.ChartBarIcon />, label: 'Trends' },
                    { id: 'coach', icon: <Icons.RobotIcon />, label: 'Coach' },
                    { id: 'goals', icon: <Icons.CogIcon />, label: 'Settings' },
                ].map(item => (
                    <button key={item.id} onClick={() => setPage(item.id as Page)} className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold transition-all ${page === item.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/40' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}>
                        {item.icon}
                        {page === item.id && <span className="text-xs">{item.label}</span>}
                    </button>
                ))}
            </nav>
        </div>
    );
};

export default App;
