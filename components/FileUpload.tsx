import React, { useState, useCallback, useRef } from 'react';
import { UploadIcon } from './icons';

interface FileUploadProps {
    onFileSelect: (file: File) => void;
    disabled: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, disabled }) => {
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setIsDragging(true);
        } else if (e.type === 'dragleave') {
            setIsDragging(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            onFileSelect(e.dataTransfer.files[0]);
        }
    }, [onFileSelect]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            onFileSelect(e.target.files[0]);
        }
    };
    
    const onButtonClick = () => {
        fileInputRef.current?.click();
    };

    const dropzoneClasses = `flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-300
    ${disabled ? 'bg-slate-700/50 border-slate-600 cursor-not-allowed' :
    isDragging ? 'bg-slate-700 border-cyan-400' : 'bg-slate-800 border-slate-600 hover:bg-slate-700/50 hover:border-slate-500'}`;

    return (
        <div 
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={onButtonClick}
            className={dropzoneClasses}
        >
            <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".docx,.txt,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                onChange={handleChange}
                disabled={disabled}
            />
            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-slate-400">
                <UploadIcon className="w-10 h-10 mb-3" />
                <p className="mb-2 text-sm">
                    <span className="font-semibold text-cyan-400">点击上传</span> 或拖放文件
                </p>
                <p className="text-xs text-slate-500">支持 DOCX 和 TXT 格式</p>
            </div>
        </div>
    );
};
