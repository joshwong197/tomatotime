
import React from 'react';

interface AboutModalProps {
    onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-stone-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="tomato-card p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-8 relative shadow-2xl border-stone-100">
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 text-stone-300 hover:text-red-500 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="text-center space-y-2">
                    <div className="text-6xl floating mb-4">📖</div>
                    <h2 className="text-4xl font-black text-stone-800 tracking-tight">How to Cultivate Focus</h2>
                    <p className="text-stone-500 font-bold uppercase tracking-widest text-xs">A Guide to Tomato Time Prioritization</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <h3 className="text-xl font-black text-stone-800 flex items-center gap-2">
                            <span>🪴</span> The Potting Bench
                        </h3>
                        <p className="text-stone-600 text-sm leading-relaxed font-medium">
                            Think of this as your **Active Focus Zone**. To prevent overwhelm, you can only have **3 tasks** in the bench at once.
                        </p>
                        <ul className="text-stone-600 text-sm space-y-2 font-bold">
                            <li className="flex items-start gap-2">
                                <span className="text-green-500 mt-1">🌱</span>
                                <span>Drag seeds from your packet to the bench to start nurturing them.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-green-500 mt-1">🍅</span>
                                <span>Once a task is in the bench, drag it onto the **Timer Objective** to focus on it.</span>
                            </li>
                        </ul>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-xl font-black text-stone-800 flex items-center gap-2">
                            <span>☀️</span> Sunlight Levels
                        </h3>
                        <p className="text-stone-600 text-sm leading-relaxed font-medium">
                            Different tasks require different amounts of "light" (priority).
                        </p>
                        <div className="space-y-3">
                            <div className="flex gap-4 items-center bg-yellow-50 p-3 rounded-2xl border border-yellow-100">
                                <span className="text-2xl">☀️</span>
                                <div>
                                    <p className="font-black text-stone-800 text-sm">Full Sun (High)</p>
                                    <p className="text-[10px] text-stone-500 font-bold">Urgent & Important. These float to the top.</p>
                                </div>
                            </div>
                            <div className="flex gap-4 items-center bg-stone-50 p-3 rounded-2xl border border-stone-100">
                                <span className="text-2xl">⛅</span>
                                <div>
                                    <p className="font-black text-stone-800 text-sm">Partial (Medium)</p>
                                    <p className="text-[10px] text-stone-500 font-bold">Standard growth. Your daily steady tasks.</p>
                                </div>
                            </div>
                            <div className="flex gap-4 items-center bg-blue-50 p-3 rounded-2xl border border-blue-100 opacity-60">
                                <span className="text-2xl">☁️</span>
                                <div>
                                    <p className="font-black text-stone-800 text-sm">Shade (Low)</p>
                                    <p className="text-[10px] text-stone-500 font-bold">Backlog tasks. Stuff for "someday".</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-red-50 p-6 rounded-[2rem] border-2 border-red-100 space-y-3 text-center">
                    <h3 className="text-lg font-black text-red-800 italic">"The best time to plant a tree was 20 years ago. The second best time is now."</h3>
                    <p className="text-red-600/70 text-sm font-bold uppercase tracking-widest text-[10px]">Start your harvest today.</p>
                </div>

                <button
                    onClick={onClose}
                    className="tomato-button-secondary w-full py-4 text-lg font-black uppercase tracking-widest"
                >
                    Got it, Let's Grow!
                </button>
            </div>
        </div>
    );
};
