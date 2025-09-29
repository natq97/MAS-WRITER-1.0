export enum SectionStatus {
  Outline = 'outline',
  Writing = 'writing',
  Completed = 'completed',
}

export interface OutlineItem {
  id: string;
  title: string;
  level: number;
  status: SectionStatus;
  children: OutlineItem[];
}

export interface SectionContent {
  content: string;
  messages: Message[];
  sessionFiles: File[];
  contextIds: string[];
  research_results?: ResearchResult[];
  systemPrompt?: string;
}

export interface Message {
  sender: 'user' | 'agent';
  text: string;
}

export enum AgentStatus {
    Idle = 'idle',
    Thinking = 'thinking',
    Error = 'error',
}

export interface ResearchResult {
  id: string;
  title: string;
  url: string;
  summary: string;
}

export interface ContextData {
  coordinatorPrompt: string;
  globalKnowledge: string[];
  systemPrompt: string;
  documentOutline: string;
  sessionKnowledge: string[];
  selectedReferences: { title: string; content: string }[];
  researchContext?: ResearchResult[];
}

// New Flow interface for a single authoring document
export interface Flow {
  id: string;
  name: string;
  coordinatorPrompt: string;
  outline: OutlineItem[];
  contents: Record<string, SectionContent>;
  outlineDraft: string;
  outlinerMessages: Message[];
}

// Project interface updated to hold multiple flows
export interface Project {
  id: string;
  name: string;
  globalKnowledgeFiles: File[];
  globalKnowledgeContext: string;
  flows: Flow[];
}