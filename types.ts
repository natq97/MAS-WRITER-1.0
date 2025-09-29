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

// New Project interface to hold all state for a single project
export interface Project {
  id: string;
  name: string;
  coordinatorPrompt: string;
  globalKnowledgeFiles: File[];
  globalKnowledgeContext: string;
  outline: OutlineItem[];
  contents: Record<string, SectionContent>;
  outlineDraft: string;
  outlinerMessages: Message[];
}
