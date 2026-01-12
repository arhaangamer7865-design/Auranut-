import React, { useRef, useEffect, useState } from 'react';
import { getNutritionalInfoByImage } from '../services/geminiService';
import type { FoodItem } from '../types';
import { CloseIcon } from './Icons';

interface MealScannerProps {
    onClose: () => void;
    onScanSuccess: (foodItem: FoodItem) => void;
}

export const MealScanner: React.FC<MealScannerProps> = ({ onClose, onScanSuccess }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [scannedFood, setScannedFood] = useState<FoodItem | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);

    // Effect to start and stop camera stream
    useEffect(() => {
        const startCamera = async () => {
            document.body.style.overflow = 'hidden';
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    streamRef.current = stream;
                }
            } catch (err) {
                console.error("Error accessing camera:", err);
                setError("Could not access camera. Please enable camera permissions.");
            }
        };

        if (!capturedImage) {
            startCamera();
        }

        return () => {
            document.body.style.overflow = '';
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
        };
    }, [capturedImage]);

    const handleCapture = async () => {
        if (!videoRef.current || !canvasRef.current || isLoading) return;
        
        setIsLoading(true);
        setError(null);

        const video = videoRef.current;
        const canvas = canvasRef.current;
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const context = canvas.getContext('2d');
        if (!context) {
            setError("Failed to get canvas context.");
            setIsLoading(false);
            return;
        }
        
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(imageDataUrl);

        const match = imageDataUrl.match(/^data:(.+);base64,(.+)$/);
        
        if (!match) {
            setError("Failed to process the captured image.");
            setIsLoading(false);
            setCapturedImage(null);
            return;
        }

        const mimeType = match[1];
        const data = match[2];

        try {
            const foodInfo = await getNutritionalInfoByImage(data, mimeType);
            if (foodInfo) {
                setScannedFood(foodInfo);
            } else {
                setError("Could not identify the meal. Please try again.");
                setTimeout(() => {
                    setError(null);
                    setCapturedImage(null); // Go back to live view
                }, 3000);
            }
        } catch (err: any) {
            setError(err.message || "An error occurred during analysis.");
             setTimeout(() => {
                setError(null);
                setCapturedImage(null); // Go back to live view
            }, 3000);
        } finally {
            setIsLoading(false);
        }
    };

    const handleScanAgain = () => {
        setScannedFood(null);
        setCapturedImage(null);
        setError(null);
    };

    return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col justify-center items-center text-white font-sans" role="dialog" aria-modal="true" aria-labelledby="scanner-title">
            <header className="absolute top-0 left-0 right-0 flex justify-between items-center p-4 bg-gradient-to-b from-black/60 to-transparent z-20">
                <h2 id="scanner-title" className="text-xl font-bold">{scannedFood ? 'Confirm Your Meal' : 'Scan Your Meal'}</h2>
                <button onClick={onClose} aria-label="Close scanner" className="p-2 rounded-full hover:bg-white/20 transition-colors">
                    <CloseIcon />
                </button>
            </header>

            <div className="relative w-full h-full flex items-center justify-center">
                {capturedImage ? (
                    <img src={capturedImage} alt="Captured meal" className="w-full h-full object-cover" />
                ) : (
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                        aria-label="Live camera feed"
                    />
                )}

                {!scannedFood && !isLoading && !capturedImage && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-8 pointer-events-none">
                        <p className="text-lg font-semibold bg-black/50 px-4 py-2 rounded-lg mb-4">
                            Center the meal in the frame
                        </p>
                        <div className="w-full max-w-md aspect-square border-4 border-dashed border-white/80 rounded-2xl shadow-lg" />
                    </div>
                )}
                
                {scannedFood && (
                    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center p-4 text-center z-10">
                         <h3 className="text-3xl font-bold mb-2 capitalize">{scannedFood.name}</h3>
                         <p className="text-xl font-semibold">{scannedFood.calories} kcal</p>
                         <p className="text-slate-300 text-sm mb-6">({scannedFood.servingSize}{scannedFood.servingUnit} serving)</p>
                         <div className="grid grid-cols-3 gap-4 bg-white/10 p-4 rounded-lg w-full max-w-xs">
                            <div>
                                <p className="text-xs text-slate-200 uppercase tracking-wider">Protein</p>
                                <p className="font-semibold text-lg">{scannedFood.protein}g</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-200 uppercase tracking-wider">Carbs</p>
                                <p className="font-semibold text-lg">{scannedFood.carbs}g</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-200 uppercase tracking-wider">Fat</p>
                                <p className="font-semibold text-lg">{scannedFood.fat}g</p>
                            </div>
                         </div>
                    </div>
                )}
            </div>

            {error && (
                <div className="absolute bottom-28 left-4 right-4 bg-red-600/90 p-3 rounded-lg text-center z-30 shadow-md">
                    <p>{error}</p>
                </div>
            )}
            
            {isLoading && (
                 <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-30 space-y-4">
                    <div className="w-16 h-16 border-4 border-t-blue-500 border-white/50 rounded-full animate-spin"></div>
                    <p className="text-xl">Analyzing your meal...</p>
                    <p className="text-sm text-slate-300">This might take a moment.</p>
                 </div>
            )}
            
            <footer className="absolute bottom-0 left-0 right-0 p-6 flex justify-center items-center bg-gradient-to-t from-black/60 to-transparent z-20">
                {scannedFood ? (
                    <div className="flex w-full max-w-sm space-x-4">
                        <button onClick={handleScanAgain} className="w-full bg-slate-600 text-white p-3 rounded-lg hover:bg-slate-700 font-semibold transition-colors text-lg">Scan Again</button>
                        <button onClick={() => onScanSuccess(scannedFood)} className="w-full bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 font-semibold transition-colors text-lg">Log Food</button>
                    </div>
                ) : (
                    <button 
                        onClick={handleCapture} 
                        disabled={isLoading} 
                        className="w-20 h-20 rounded-full bg-white/30 border-4 border-white flex items-center justify-center transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
                        aria-label="Capture meal photo"
                    >
                         <div className="w-16 h-16 bg-white rounded-full"></div>
                    </button>
                )}
            </footer>
            
             <canvas ref={canvasRef} className="hidden" aria-hidden="true"></canvas>
        </div>
    );
};
