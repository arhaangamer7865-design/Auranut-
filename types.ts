
export type Page = 'dashboard' | 'goals' | 'progress' | 'coach';

export interface User {
  id: string;
  name: string;
  email: string;
  photo?: string;
}

export interface UserGoals {
  currentWeight: number;
  goalWeight: number;
  height: number;
  age: number;
  gender: 'male' | 'female';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  dailyCalorieGoal: number;
  dailyProteinGoal: number;
  dailyCarbsGoal: number;
  dailyFatGoal: number;
  dailyWaterGoal: number; // in glasses
}

export interface FoodItem {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: number;
  servingUnit: string;
  emoji?: string;
  source?: 'database' | 'search';
  groundingUrls?: string[];
}

export interface ExerciseItem {
  id: string;
  name: string;
  duration: number;
  durationUnit: 'minutes' | 'hours';
  caloriesBurned: number;
}

export type MealType = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks';

export interface DailyLog {
  date: string; // YYYY-MM-DD
  meals: Record<MealType, FoodItem[]>;
  exercises: ExerciseItem[];
  waterIntake: number; // in glasses
}

export interface WeightEntry {
  date: string; // YYYY-MM-DD
  weight: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}
