
import React from 'react';

interface AboutModalProps {
    onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-md animate-in fade-in duration-300">
            <div className="hunt-card p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-8 relative shadow-2xl">
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 text-zinc-500 hover:text-red-400 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="text-center space-y-2">
                    <div className="text-6xl pulse-glow mb-4">📖</div>
                    <h2 className="text-4xl font-black text-zinc-100 tracking-tight font-gothic">Hunter's Guide</h2>
                    <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">How to Prepare for the Hunt</p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <h3 className="text-xl font-black text-zinc-200 flex items-center gap-2 font-gothic">
                            <span>⚔️</span> Hunter's Workshop
                        </h3>
                        <p className="text-zinc-400 text-sm leading-relaxed font-medium">
                            Your active focus zone. Only <strong className="text-zinc-200">5 beasts</strong> can be prepared at once to prevent overwhelm.
                        </p>
                        <ul className="text-zinc-400 text-sm space-y-2 font-bold">
                            <li className="flex items-start gap-2">
                                <span className="text-red-400 mt-1">📜</span>
                                <span>Record beasts in your Hunter's Notes, then promote them to the Workshop.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-red-400 mt-1">⚔️</span>
                                <span>Click a beast to track hunt time. Drag it onto the Timer Quarry to name your session.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-purple-400 mt-1">👁</span>
                                <span>Use <strong>Await Insight</strong> for beasts you can't slay yet — they'll wait in a separate section.</span>
                            </li>
                        </ul>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-xl font-black text-zinc-200 flex items-center gap-2 font-gothic">
                            <span>💀</span> Threat Levels
                        </h3>
                        <p className="text-zinc-400 text-sm leading-relaxed font-medium">
                            Different beasts demand different urgency.
                        </p>
                        <div className="space-y-3">
                            <div className="flex gap-4 items-center bg-red-900/20 p-3 rounded-xl border border-red-800/30">
                                <span className="text-2xl">💀</span>
                                <div>
                                    <p className="font-black text-zinc-200 text-sm">Nightmare</p>
                                    <p className="text-[10px] text-zinc-500 font-bold">Urgent & critical. These rise to the top.</p>
                                </div>
                            </div>
                            <div className="flex gap-4 items-center bg-zinc-800/50 p-3 rounded-xl border border-zinc-700/30">
                                <span className="text-2xl">👹</span>
                                <div>
                                    <p className="font-black text-zinc-200 text-sm">Boss</p>
                                    <p className="text-[10px] text-zinc-500 font-bold">Standard quarry. Your steady hunt targets.</p>
                                </div>
                            </div>
                            <div className="flex gap-4 items-center bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/30 opacity-70">
                                <span className="text-2xl">🐺</span>
                                <div>
                                    <p className="font-black text-zinc-200 text-sm">Beast</p>
                                    <p className="text-[10px] text-zinc-500 font-bold">Lesser prey. For when the night is long.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-red-900/20 p-6 rounded-xl border border-red-800/30 space-y-3 text-center">
                    <h3 className="text-lg font-black text-zinc-200 italic font-gothic">"A hunter is a hunter, even in a dream."</h3>
                    <p className="text-red-400/70 text-sm font-bold uppercase tracking-widest text-[10px]">Begin the hunt tonight.</p>
                </div>

                <button
                    onClick={onClose}
                    className="hunt-button w-full py-4 text-lg font-black uppercase tracking-widest font-gothic"
                >
                    The Hunt Awaits
                </button>
            </div>
        </div>
    );
};
