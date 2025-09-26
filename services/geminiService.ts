
import { GoogleGenAI, Type } from "@google/genai";
import type { AnalysisIssue } from "../types";

// Mammoth is loaded from a script tag in index.html, so we declare it globally.
declare const mammoth: any;

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const analysisSchema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        type: {
          type: Type.STRING,
          enum: ['内容差异', '文本错误', '逻辑缺陷', '优化建议'],
          description: "发现问题的类别。"
        },
        description: {
          type: Type.STRING,
          description: "对问题的详细解释。"
        },
        context: {
          type: Type.STRING,
          description: "在文档中发现问题的确切文本片段。"
        },
        suggestion: {
          type: Type.STRING,
          description: "关于如何解决这个问题的具体建议。"
        }
      },
      required: ['type', 'description', 'context', 'suggestion']
    }
};

async function fileToGenerativePart(file: File) {
    const base64EncodedData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
    return {
        inlineData: {
            data: base64EncodedData,
            mimeType: file.type,
        },
    };
}


export async function analyzeDocument(file: File): Promise<AnalysisIssue[]> {
  try {
    const systemInstruction = `你是一位专业的文档分析专家。你的任务是仔细审查所提供的文档，找出任何问题。
    将每个问题分为四种类型之一：
    1. '内容差异': 信息矛盾或文本内部不一致。
    2. '文本错误': 语法错误、拼写错误、错别字或表达不自然的短语。
    3. '逻辑缺陷': 论证中的缺陷、谬误或不合逻辑的陈述。
    4. '优化建议': 虽然没有严格错误但可以为提高清晰度、简洁性或影响力而改进的地方。
    
    对于发现的每个问题，请提供上下文、问题的清晰描述以及实用的改进建议。
    如果文档写得很好，没有发现任何问题，请返回一个空数组。`;

    let contents;
    const docxMimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    // Handle DOCX files by extracting text content first
    if (file.type === docxMimeType || file.name.endsWith('.docx')) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const { value: text } = await mammoth.extractRawText({ arrayBuffer });
            const prompt = `请根据你的系统指令分析以下文档内容。识别任何问题并以指定的JSON格式报告。\n\n文档内容:\n"""\n${text}\n"""`;
            contents = { parts: [{ text: prompt }] };
        } catch (docxError) {
            console.error("Error parsing DOCX file with Mammoth.js:", docxError);
            throw new Error("无法读取DOCX文件。该文件可能已损坏、受密码保护或包含复杂格式。请尝试将其另存为PDF或TXT文件后重新上传。");
        }
    } 
    // Handle plain text files
    else if (file.type.startsWith('text/')) {
        const text = await file.text();
        const prompt = `请根据你的系统指令分析以下文档内容。识别任何问题并以指定的JSON格式报告。\n\n文档内容:\n"""\n${text}\n"""`;
        contents = { parts: [{ text: prompt }] };
    }
    // For other types (PDF, images, etc.), send the file directly
    else {
        const filePart = await fileToGenerativePart(file);
        const textPart = {
            text: "请根据你的系统指令分析附加的文档。识别任何问题并以指定的JSON格式报告。"
        };
        contents = { parts: [textPart, filePart] };
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        temperature: 0.2,
      },
    });

    const jsonText = response.text.trim();
    if (!jsonText) {
        return [];
    }
    const result = JSON.parse(jsonText);
    return result as AnalysisIssue[];

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    if (error instanceof Error) {
        throw new Error(`${error.message}`);
    }
    throw new Error("与Gemini API通信时发生未知错误。");
  }
}