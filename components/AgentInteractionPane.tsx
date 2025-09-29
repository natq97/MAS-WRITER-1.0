import React, { useState, useRef, useCallback } from 'react';
import type { Message, OutlineItem, ResearchResult, ContextData } from '../types';
import { AgentStatus } from '../types';
import { SendIcon, UploadCloudIcon, CheckSquareIcon, LoaderIcon, SearchIcon, FileTextIcon, PlayIcon, BracketsIcon } from './icons';

interface AgentInteractionPaneProps {
  activeSection: OutlineItem | null;
  // Writer Agent props
  messages: Message[];
  onGenerate: (prompt: string | undefined, contextIds: string[]) => void;
  // Outliner Agent props
  outlinerMessages: Message[];
  onOutlineCommand: (prompt:string) => void;
  // Shared props
  agentStatus: AgentStatus;
  outline: OutlineItem[];
  // Knowledge/Context props
  contextIds: string[];
  onContextChange: (id: string, isChecked: boolean) => void;
  sessionFiles: File[];
  onFilesChange: (files: FileList | null) => void;
  // Research Agent props
  researchAgentStatus: AgentStatus;
  onResearch: (query: string) => void;
  researchResults: ResearchResult[];
  // Context Previews
  fullAgentContext: ContextData | null;
  outlinerAgentContext: ContextData;
  // Flow Coordinator Prompt
  flowCoordinatorPrompt: string;
  onFlowCoordinatorPromptChange: (newPrompt: string) => void;
}

const AgentInteractionPane: React.FC<AgentInteractionPaneProps> = (props) => {
  const { 
      activeSection, messages, onGenerate, 
      outlinerMessages, onOutlineCommand,
      agentStatus, outline, contextIds, onContextChange, 
      sessionFiles, onFilesChange,
      researchAgentStatus, onResearch, researchResults,
      fullAgentContext, outlinerAgentContext,
      flowCoordinatorPrompt, onFlowCoordinatorPromptChange
  } = props;
  
  const [activeTab, setActiveTab] = useState<'chat' | 'knowledge' | 'context'>('chat');
  const [prompt, setPrompt] = useState('');
  const [researchQuery, setResearchQuery] = useState('');

  const isOutlining = !activeSection;
  const currentMessages = isOutlining ? outlinerMessages : messages;
  const agentContextToShow = isOutlining ? outlinerAgentContext : fullAgentContext;


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && agentStatus === AgentStatus.Idle) {
      if(isOutlining){
        onOutlineCommand(prompt);
      } else {
        onGenerate(prompt, contextIds);
      }
      setPrompt('');
    }
  };
  
  const handleResearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (researchQuery.trim() && researchAgentStatus === AgentStatus.Idle) {
        onResearch(researchQuery);
    }
  };

  const allSections = useCallback(() => {
    const sections: OutlineItem[] = [];
    const collect = (items: OutlineItem[]) => {
      for (const item of items) {
        sections.push(item);
        if(item.children.length > 0){
          collect(item.children)
        }
      }
    };
    collect(outline);
    return sections;
  }, [outline]);


  return (
    <aside className="w-full h-full bg-brand-primary border-l border-brand-accent flex flex-col">
      <div className="flex-shrink-0 border-b border-brand-accent p-2">
        <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg px-2">
                {isOutlining ? "Outliner Agent" : `Writer: ${activeSection?.title}`}
            </h3>
            <nav className="flex space-x-1">
            {(['chat', 'knowledge', 'context'] as const).map((tab) => (
                <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === tab ? 'bg-brand-accent text-brand-text' : 'text-brand-light hover:bg-brand-secondary'} disabled:opacity-50 disabled:cursor-not-allowed`}
                disabled={isOutlining && tab === 'knowledge'}
                >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
            ))}
            </nav>
        </div>
      </div>

      <div className="flex-grow p-4 overflow-y-auto">
        {activeTab === 'chat' && (
           <div className="h-full flex flex-col">
            {!isOutlining && currentMessages.length === 0 ? (
                 <div className="flex-grow flex flex-col items-center justify-center text-center p-4">
                    <h4 className="font-semibold text-lg mb-2">Ready to Write</h4>
                    <p className="text-sm text-brand-light mb-6 max-w-sm">
                        Click the button below to have the Writer Agent generate an initial draft for this section.
                    </p>
                    <button
                        onClick={() => onGenerate(undefined, contextIds)}
                        disabled={agentStatus !== AgentStatus.Idle}
                        className="flex items-center justify-center space-x-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-200 disabled:bg-gray-500 disabled:cursor-not-allowed"
                    >
                      <PlayIcon className="w-5 h-5" />
                      <span>Generate Initial Draft</span>
                    </button>
                </div>
            ) : (
                <>
                  <div className="flex-grow space-y-4 mb-4 overflow-y-auto pr-2">
                    {currentMessages.map((msg, index) => (
                      <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs lg:max-w-sm px-4 py-2 rounded-lg ${msg.sender === 'user' ? 'bg-blue-600 text-white' : 'bg-brand-accent text-brand-text'}`}>
                          <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                        </div>
                      </div>
                    ))}
                    {agentStatus === AgentStatus.Thinking && (
                        <div className="flex justify-start">
                          <div className="max-w-xs lg:max-w-sm px-4 py-2 rounded-lg bg-brand-accent text-brand-text flex items-center space-x-2">
                              <LoaderIcon className="w-4 h-4" />
                              <span className="text-sm italic">Agent is thinking...</span>
                          </div>
                      </div>
                    )}
                  </div>
                  <form onSubmit={handleSubmit} className="flex-shrink-0 flex items-center space-x-2">
                    <input
                      type="text"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder={isOutlining ? "Instruct the Outliner Agent..." : "Instruct the Writer Agent..."}
                      className="flex-grow bg-brand-secondary border border-brand-accent rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-brand-light"
                      disabled={agentStatus !== AgentStatus.Idle}
                    />
                    <button type="submit" className="bg-blue-600 p-2 rounded-lg text-white hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed" disabled={agentStatus !== AgentStatus.Idle || !prompt.trim()}>
                      <SendIcon className="w-5 h-5" />
                    </button>
                  </form>
                </>
            )}
         </div>
        )}
        {activeTab === 'knowledge' && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Session Knowledge</h3>
            <p className="text-sm text-brand-light mb-4">Upload local files or research topics from the web for this specific writing session.</p>
            
            <div className="p-4 border-2 border-dashed border-brand-accent rounded-lg text-center mb-6">
              <UploadCloudIcon className="w-10 h-10 mx-auto text-brand-light mb-2" />
              <label htmlFor="file-upload" className="cursor-pointer text-blue-400 hover:text-blue-300 font-semibold">
                Upload files
                <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple onChange={(e) => onFilesChange(e.target.files)} />
              </label>
              <p className="text-xs text-gray-500 mt-1">PDF, TXT, DOCX up to 10MB</p>
            </div>
             {sessionFiles.length > 0 && (
                <div className="mb-6">
                    <h4 className="font-semibold text-sm">Uploaded files:</h4>
                    <ul className="space-y-1 text-brand-light text-sm mt-2">
                        {sessionFiles.map((file, i) => (
                          <li key={i} className="flex items-center space-x-2">
                            <FileTextIcon className="w-4 h-4 flex-shrink-0" />
                            <span>{file.name}</span>
                          </li>
                        ))}
                    </ul>
                </div>
             )}
            
            <div className="border-t border-brand-accent pt-4 mt-4">
                 <h3 className="text-lg font-semibold mb-2">Research Agent</h3>
                 <form onSubmit={handleResearchSubmit} className="flex items-center space-x-2 mb-4">
                    <input 
                        type="text"
                        value={researchQuery}
                        onChange={(e) => setResearchQuery(e.target.value)}
                        placeholder="Topic to research..."
                        className="flex-grow bg-brand-secondary border border-brand-accent rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-brand-light"
                        disabled={researchAgentStatus !== AgentStatus.Idle}
                    />
                    <button type="submit" className="bg-blue-600 p-2 rounded-lg text-white hover:bg-blue-700 disabled:bg-gray-500" disabled={researchAgentStatus !== AgentStatus.Idle || !researchQuery.trim()}>
                        {researchAgentStatus === AgentStatus.Thinking ? <LoaderIcon className="w-5 h-5" /> : <SearchIcon className="w-5 h-5" />}
                    </button>
                 </form>

                {researchResults.length > 0 && (
                     <div className="space-y-3">
                        <h4 className="font-semibold text-sm">Research Results:</h4>
                        {researchResults.map(result => (
                            <div key={result.id} className="p-3 bg-brand-secondary rounded-lg">
                                <a href={result.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline font-semibold text-sm">{result.title}</a>
                                <p className="text-xs text-brand-light mt-1">{result.summary}</p>
                            </div>
                        ))}
                     </div>
                )}
            </div>

          </div>
        )}
        {activeTab === 'context' && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Flow Coordinator Prompt</h3>
            <p className="text-sm text-brand-light mb-4">
                This master prompt guides all AI agents for this specific flow.
            </p>
            <textarea
                value={flowCoordinatorPrompt}
                onChange={(e) => onFlowCoordinatorPromptChange(e.target.value)}
                rows={5}
                className="w-full p-2 mb-6 bg-brand-secondary border border-brand-accent rounded-md resize-y focus:outline-none focus:ring-2 focus:ring-brand-light text-brand-text text-sm leading-relaxed"
            />
            
            {agentContextToShow && (
              <div className="border-t border-brand-accent pt-4">
                <h3 className="text-lg font-semibold mb-2">{isOutlining ? 'Outliner Agent Context' : 'Writer Agent Context'}</h3>
                <p className="text-sm text-brand-light mb-4">
                  {isOutlining 
                    ? "This is the context the Outliner Agent uses to process your requests."
                    : "Select completed sections to provide as context for the agent's next task."
                  }
                </p>
                
                {!isOutlining && (
                     <div className="space-y-2 mb-6">
                        {allSections()
                            .filter(sec => !activeSection || sec.id !== activeSection.id)
                            .map(section => (
                            <label key={section.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-brand-secondary cursor-pointer">
                              <input
                                type="checkbox"
                                checked={contextIds.includes(section.id)}
                                onChange={(e) => onContextChange(section.id, e.target.checked)}
                                className="h-4 w-4 rounded bg-brand-accent border-brand-light text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-brand-text">{section.title}</span>
                            </label>
                          ))}
                    </div>
                )}
                
                <div className={!isOutlining ? 'border-t border-brand-accent pt-4' : ''}>
                    <h3 className="text-lg font-semibold mb-4">Full Agent Context Preview</h3>
                    <div className="space-y-2 text-sm">
                        {agentContextToShow.coordinatorPrompt && (
                            <details className="bg-brand-secondary rounded-lg overflow-hidden" open>
                                <summary className="p-2 font-semibold cursor-pointer flex items-center space-x-2">
                                    <BracketsIcon className="w-4 h-4" />
                                    <span>Coordinator Prompt (Flow Level)</span>
                                </summary>
                                <pre className="p-3 bg-brand-primary text-xs text-brand-light whitespace-pre-wrap font-mono">{agentContextToShow.coordinatorPrompt}</pre>
                            </details>
                        )}
                        
                        <details className="bg-brand-secondary rounded-lg overflow-hidden" open>
                            <summary className="p-2 font-semibold cursor-pointer flex items-center space-x-2">
                                <BracketsIcon className="w-4 h-4" />
                                <span>Global Knowledge Base</span>
                            </summary>
                            <div className="p-3 bg-brand-primary text-xs text-brand-light">
                                {agentContextToShow.globalKnowledge.length > 0 ? (
                                    <ul className="list-disc list-inside font-mono">
                                        {agentContextToShow.globalKnowledge.map(name => <li key={name}>{name}</li>)}
                                    </ul>
                                ) : (
                                    <p className="italic">No global knowledge files uploaded.</p>
                                )}
                            </div>
                        </details>

                        <details className="bg-brand-secondary rounded-lg overflow-hidden" open>
                            <summary className="p-2 font-semibold cursor-pointer flex items-center space-x-2">
                                <BracketsIcon className="w-4 h-4" />
                                <span>System Prompt (Task Specific)</span>
                            </summary>
                            <pre className="p-3 bg-brand-primary text-xs text-brand-light whitespace-pre-wrap font-mono">{agentContextToShow.systemPrompt}</pre>
                        </details>

                        <details className="bg-brand-secondary rounded-lg overflow-hidden" open>
                            <summary className="p-2 font-semibold cursor-pointer flex items-center space-x-2">
                                <BracketsIcon className="w-4 h-4" />
                                <span>{isOutlining ? 'Current Outline Draft' : 'Document Outline'}</span>
                            </summary>
                            <pre className="p-3 bg-brand-primary text-xs text-brand-light whitespace-pre-wrap font-mono">{agentContextToShow.documentOutline}</pre>
                        </details>

                        {!isOutlining && (
                            <>
                                <details className="bg-brand-secondary rounded-lg overflow-hidden">
                                    <summary className="p-2 font-semibold cursor-pointer flex items-center space-x-2">
                                        <BracketsIcon className="w-4 h-4" />
                                        <span>Session Knowledge</span>
                                    </summary>
                                    <div className="p-3 bg-brand-primary text-xs text-brand-light">
                                        {agentContextToShow.sessionKnowledge.length > 0 ? (
                                            <ul className="list-disc list-inside">
                                                {agentContextToShow.sessionKnowledge.map(name => <li key={name}>{name}</li>)}
                                            </ul>
                                        ) : (
                                            <p className="italic">No session files uploaded.</p>
                                        )}
                                    </div>
                                </details>
                                
                                <details className="bg-brand-secondary rounded-lg overflow-hidden">
                                    <summary className="p-2 font-semibold cursor-pointer flex items-center space-x-2">
                                        <BracketsIcon className="w-4 h-4" />
                                        <span>Research Results</span>
                                    </summary>
                                    <div className="p-3 bg-brand-primary text-xs text-brand-light space-y-2">
                                        {agentContextToShow.researchContext && agentContextToShow.researchContext.length > 0 ? (
                                            agentContextToShow.researchContext.map(result => (
                                                <div key={result.id}>
                                                    <p className="font-bold font-mono">--- RESULT: {result.title} ---</p>
                                                    <a href={result.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline font-mono text-xs block truncate">{result.url}</a>
                                                    <pre className="whitespace-pre-wrap font-mono text-gray-400 mt-1">{result.summary}</pre>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="italic">No research performed for this session.</p>
                                        )}
                                    </div>
                                </details>

                                <details className="bg-brand-secondary rounded-lg overflow-hidden">
                                    <summary className="p-2 font-semibold cursor-pointer flex items-center space-x-2">
                                        <BracketsIcon className="w-4 h-4" />
                                        <span>Selected References</span>
                                    </summary>
                                    <div className="p-3 bg-brand-primary text-xs text-brand-light space-y-2">
                                        {agentContextToShow.selectedReferences.length > 0 ? (
                                            agentContextToShow.selectedReferences.map(ref => (
                                                <div key={ref.title}>
                                                    <p className="font-bold font-mono">--- REF: {ref.title} ---</p>
                                                    <pre className="whitespace-pre-wrap font-mono text-gray-400 mt-1">{ref.content.substring(0, 200)}...</pre>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="italic">No references selected.</p>
                                        )}
                                    </div>
                                </details>
                            </>
                        )}
                    </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};

export default AgentInteractionPane;