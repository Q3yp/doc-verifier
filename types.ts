
export type IssueType = '内容差异' | '文本错误' | '逻辑缺陷' | '优化建议';

export interface AnalysisIssue {
  type: IssueType;
  description: string;
  context: string;
  suggestion: string;
}