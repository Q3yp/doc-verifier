
import React from 'react';
import { AlertTriangleIcon } from './icons';

interface ErrorDisplayProps {
    message: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ message }) => {
    return (
        <div className="flex-grow flex flex-col items-center justify-center text-center p-6 bg-rose-900/20 border border-rose-700/30 rounded-lg">
            <AlertTriangleIcon className="w-16 h-16 text-rose-400 mb-4" />
            <h3 className="text-xl font-semibold text-rose-300">发生错误</h3>
            <p className="text-rose-400 mt-2">{message}</p>
        </div>
    );
};