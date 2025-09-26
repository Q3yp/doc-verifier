
import React from 'react';
import { BrainCircuitIcon } from './icons';

export const Header: React.FC = () => {
    return (
        <header className="w-full max-w-6xl mx-auto text-center">
            <div className="flex items-center justify-center gap-4 mb-2">
                <BrainCircuitIcon className="w-10 h-10 text-cyan-400" />
                <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 to-blue-500 text-transparent bg-clip-text">
                    文档智能校对
                </h1>
            </div>
            <p className="text-slate-400">
                您的人工智能助手，确保文档质量与逻辑连贯性。
            </p>
        </header>
    );
};