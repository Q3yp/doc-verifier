
import React from 'react';
import type { AnalysisIssue, IssueType } from '../types';
import { CheckCircleIcon, LightbulbIcon, AlertTriangleIcon, BugIcon } from './icons';

const issueTypeConfig: Record<IssueType, { icon: React.FC<React.SVGProps<SVGSVGElement>>; color: string; }> = {
    '内容差异': { icon: AlertTriangleIcon, color: 'text-amber-400' },
    '文本错误': { icon: BugIcon, color: 'text-rose-400' },
    '逻辑缺陷': { icon: AlertTriangleIcon, color: 'text-orange-400' },
    '优化建议': { icon: LightbulbIcon, color: 'text-sky-400' },
};

const ResultCard: React.FC<{ issue: AnalysisIssue }> = ({ issue }) => {
    const config = issueTypeConfig[issue.type];
    const IconComponent = config.icon;

    return (
        <div className="bg-slate-900/70 p-4 rounded-lg border border-slate-700/50 mb-4 transition-transform hover:scale-[1.02] hover:border-slate-600">
            <div className="flex items-center mb-3">
                <IconComponent className={`w-6 h-6 mr-3 ${config.color}`} />
                <h3 className={`text-lg font-semibold ${config.color}`}>{issue.type}</h3>
            </div>
            <p className="text-slate-300 mb-3">{issue.description}</p>
            <div className="mb-3">
                <p className="text-sm font-semibold text-slate-400 mb-1">上下文：</p>
                <blockquote className="border-l-4 border-slate-600 pl-4 py-2 bg-slate-800/50 text-slate-400 rounded-r-md italic">
                    "{issue.context}"
                </blockquote>
            </div>
            <div>
                <p className="text-sm font-semibold text-slate-400 mb-1">修改建议：</p>
                <p className="bg-green-900/20 text-green-300 p-2 rounded-md border border-green-700/30">
                    {issue.suggestion}
                </p>
            </div>
        </div>
    );
};

export const AnalysisResults: React.FC<{ issues: AnalysisIssue[] }> = ({ issues }) => {
    if (issues.length === 0) {
        return (
            <div className="flex-grow flex flex-col items-center justify-center text-center p-6 bg-green-900/20 border border-green-700/30 rounded-lg">
                <CheckCircleIcon className="w-16 h-16 text-green-400 mb-4" />
                <h3 className="text-xl font-semibold text-green-300">非常出色！</h3>
                <p className="text-green-400">文档中未发现任何问题。内容撰写得很好且前后一致。</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 -mr-2">
            {issues.map((issue, index) => (
                <ResultCard key={index} issue={issue} />
            ))}
        </div>
    );
};