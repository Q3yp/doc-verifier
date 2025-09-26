
import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { FileUpload } from './components/FileUpload';
import { AnalysisResults } from './components/AnalysisResults';
import { Spinner } from './components/Spinner';
import { analyzeDocument } from './services/geminiService';
import type { AnalysisIssue } from './types';
import { ErrorDisplay } from './components/ErrorDisplay';

const App: React.FC = () => {
    const [analysisResult, setAnalysisResult] = useState<AnalysisIssue[] | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);

    const handleFileAnalysis = useCallback(async (file: File) => {
        setIsLoading(true);
        setError(null);
        setAnalysisResult(null);
        setFileName(file.name);

        try {
            const results = await analyzeDocument(file);
            setAnalysisResult(results);
        } catch (e) {
            console.error("Error analyzing document:", e);
            let errorMessage = "分析文档时发生未知错误。";
            if (e instanceof Error) {
                 if (e.message.includes("Unsupported MIME type")) {
                    errorMessage = "上传的文件格式不受支持。请尝试使用DOCX、PDF或TXT等常见文档类型。";
                } else if (e.message.includes("400")) {
                    errorMessage = "请求被拒绝。文件可能已损坏或格式不受支持。";
                }
                 else {
                    errorMessage = e.message;
                }
            }
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, []);

    return (
        <div className="min-h-screen bg-slate-900 font-sans text-slate-300 flex flex-col items-center p-4 sm:p-6 lg:p-8">
            <Header />
            <main className="w-full max-w-6xl mx-auto mt-8 flex-grow">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
                        <h2 className="text-xl font-semibold text-cyan-400 mb-4">上传文档</h2>
                        <p className="text-slate-400 mb-6">
                            选择一个文档文件（.docx, .pdf, .txt等）进行分析。AI将扫描内容差异、语法错误和逻辑不一致之处。
                        </p>
                        <FileUpload onFileSelect={handleFileAnalysis} disabled={isLoading} />
                    </div>
                    <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700 min-h-[300px] flex flex-col">
                        <h2 className="text-xl font-semibold text-cyan-400 mb-4">分析报告</h2>
                        {isLoading ? (
                            <div className="flex-grow flex flex-col items-center justify-center">
                                <Spinner />
                                <p className="mt-4 text-slate-400 animate-pulse">正在分析 "{fileName}"...</p>
                            </div>
                        ) : error ? (
                            <ErrorDisplay message={error} />
                        ) : analysisResult ? (
                            <AnalysisResults issues={analysisResult} />
                        ) : (
                            <div className="flex-grow flex items-center justify-center">
                                <p className="text-slate-500">等待文档上传...</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
            <footer className="text-center py-4 mt-8 text-slate-500 text-sm">
                <p>由 Gemini AI 驱动。 &copy; 2024 DocuMind Verifier.</p>
            </footer>
        </div>
    );
};

export default App;