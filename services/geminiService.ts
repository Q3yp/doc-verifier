import type { AnalysisIssue } from "../types";

// Mammoth is loaded from a script tag in index.html, so we declare it globally.
declare const mammoth: any;

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

export async function analyzeDocument(file: File): Promise<AnalysisIssue[]> {
  try {
    // --- 1. File Processing ---
    let documentText: string;
    const docxMimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

    if (file.type === docxMimeType || file.name.endsWith('.docx')) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const { value } = await mammoth.extractRawText({ arrayBuffer });
        documentText = value;
      } catch (docxError) {
        console.error("Error parsing DOCX file with Mammoth.js:", docxError);
        throw new Error("无法读取DOCX文件。该文件可能已损坏、受密码保护或包含复杂格式。");
      }
    } else if (file.type.startsWith('text/')) {
      documentText = await file.text();
    } else {
      throw new Error(`Unsupported MIME type: ${file.type}. Please upload a DOCX or TXT file.`);
    }

    // --- 2. Prompt and Tool Definition (OpenAI-compatible format) ---
    const systemInstruction = `你是一位专业的文档分析专家。你的任务是仔细审查所提供的文档，找出任何问题。
    将每个问题分为四种类型之一：
    1. '内容差异': 信息矛盾或文本内部不一致。
    2. '文本错误': 语法错误、拼写错误、错别字或表达不自然的短语。
    3. '逻辑缺陷': 论证中的缺陷、谬误或不合逻辑的陈述。
    4. '优化建议': 虽然没有严格错误但可以为提高清晰度、简洁性或影响力而改进的地方。
    
    对于发现的每个问题，请提供上下文、问题的清晰描述以及实用的改进建议。
    如果文档写得很好，没有发现任何问题，请确保调用 report_document_issues 函数并传入一个空的 issues 数组。`;
    
    const userPrompt = `请根据你的系统指令分析以下文档内容。识别任何问题并以指定的JSON格式报告。\n\n文档内容:\n"""\n${documentText}\n"""`;

    // Here we define the tool and payload using an OpenAI-compatible structure.
    const openAICompatiblePayload = {
      model: 'gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemInstruction },
        { role: 'user', content: userPrompt }
      ],
      tools: [{
        type: 'function',
        function: {
          name: 'report_document_issues',
          description: '报告在文档中发现的问题。',
          parameters: {
            type: 'object',
            properties: {
              issues: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    type: { type: 'string', enum: ['内容差异', '文本错误', '逻辑缺陷', '优化建议'] },
                    description: { type: 'string' },
                    context: { type: 'string' },
                    suggestion: { type: 'string' }
                  },
                  required: ['type', 'description', 'context', 'suggestion']
                }
              }
            },
            required: ['issues']
          }
        }
      }],
      tool_choice: { type: 'function', function: { name: 'report_document_issues' } },
      temperature: 0.2
    };

    // --- 3. Translate to Native Gemini API Format ---
    // Now, we translate the OpenAI-style payload into the format the native Gemini endpoint expects.
    const geminiRequestBody = {
      systemInstruction: {
        parts: [{ text: openAICompatiblePayload.messages.find(m => m.role === 'system')?.content }]
      },
      contents: openAICompatiblePayload.messages
        .filter(m => m.role === 'user')
        .map(m => ({
          role: m.role,
          parts: [{ text: m.content }]
        })),
      tools: [{
        functionDeclarations: [
          {
            name: 'report_document_issues',
            description: '报告在文档中发现的问题。',
            parameters: {
              type: 'OBJECT',
              properties: {
                issues: {
                  type: 'ARRAY',
                  items: {
                    type: 'OBJECT',
                    properties: {
                      type: { type: 'STRING', enum: ['内容差异', '文本错误', '逻辑缺陷', '优化建议'] },
                      description: { type: 'STRING' },
                      context: { type: 'STRING' },
                      suggestion: { type: 'STRING' }
                    },
                    required: ['type', 'description', 'context', 'suggestion']
                  }
                }
              },
              required: ['issues']
            }
          }
        ]
      }],
      toolConfig: {
        functionCallingConfig: {
          mode: 'ANY',
          allowedFunctionNames: ['report_document_issues']
        }
      },
      generationConfig: {
        temperature: openAICompatiblePayload.temperature
      }
    };
    
    // --- 4. API Call to Google Gemini Endpoint ---
    const model = 'gemini-2.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(geminiRequestBody)
    });
    
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        console.error("Gemini API Error:", errorData);
        if (response.status >= 400 && response.status < 500) {
             throw new Error(`400: ${errorData.error?.message || '请求被拒绝。文件可能已损坏或格式不受支持。'}`);
        }
        throw new Error(`API Error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    // --- 5. Response Processing ---
    const data = await response.json();
    const functionCall = data.candidates?.[0]?.content?.parts?.[0]?.functionCall;

    if (functionCall?.name === 'report_document_issues' && functionCall?.args) {
        const result = functionCall.args;
        return (result.issues || []) as AnalysisIssue[];
    }
    
    return [];

  } catch (error) {
    console.error("Error in analyzeDocument:", error);
    if (error instanceof Error) {
        throw error;
    }
    throw new Error("与AI服务通信时发生未知错误。");
  }
}