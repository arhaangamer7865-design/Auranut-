
import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage, UserGoals, DailyLog } from '../types';
import { getCoachResponse } from '../services/geminiService';
import { SparklesIcon, RobotIcon, CloseIcon } from './Icons';

interface AICoachProps {
  goals: UserGoals;
  todayLog: DailyLog;
}

export const AICoach: React.FC<AICoachProps> = ({ goals, todayLog }) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('auranut_chat_history');
    return saved ? JSON.parse(saved) : [
      { role: 'model', text: "Hello! I'm your Auranut AI Coach. How can I help you reach your health goals today?", timestamp: Date.now() }
    ];
  });
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('auranut_chat_history', JSON.stringify(messages));
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMsg: ChatMessage = { role: 'user', text: input, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    const response = await getCoachResponse(messages, input, { goals, todayLog });
    const modelMsg: ChatMessage = { role: 'model', text: response, timestamp: Date.now() };
    
    setMessages(prev => [...prev, modelMsg]);
    setIsTyping(false);
  };

  const clearChat = () => {
    if (window.confirm("Are you sure you want to clear our conversation history?")) {
      setMessages([{ role: 'model', text: "Chat cleared! How can I help you now?", timestamp: Date.now() }]);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] bg-slate-50 dark:bg-slate-900 rounded-xl overflow-hidden shadow-inner">
      <header className="p-4 bg-white dark:bg-slate-800 border-b dark:border-slate-700 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
            <RobotIcon />
          </div>
          <div>
            <h2 className="font-bold text-slate-800 dark:text-slate-100">AI Health Coach</h2>
            <p className="text-xs text-green-500 font-medium">Online & Personalized</p>
          </div>
        </div>
        <button onClick={clearChat} className="text-xs text-slate-400 hover:text-red-500 transition-colors">Clear History</button>
      </header>

      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-2xl ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white rounded-tr-none' 
                : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 shadow-sm border dark:border-slate-700 rounded-tl-none'
            }`}>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-tl-none border dark:border-slate-700">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
              </div>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      <div className="p-4 bg-white dark:bg-slate-800 border-t dark:border-slate-700">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Ask me about your diet, workouts, or goals..."
            className="w-full pl-4 pr-12 py-3 bg-slate-100 dark:bg-slate-700 border-none rounded-xl focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isTyping}
            className="absolute right-2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all"
          >
            <SparklesIcon />
          </button>
        </div>
      </div>
    </div>
  );
};
