import React, { useState, useMemo, useCallback, useEffect } from 'react';
import OutlinePane from './components/OutlinePane';
import Workspace from './components/Workspace';
import AgentInteractionPane from './components/AgentInteractionPane';
import Toast from './components/Toast';
import ProjectDashboard from './components/ProjectDashboard';
import ProjectList from './components/ProjectList'; // New component
import { 
    generateContent, 
    generateOutline, 
    researchTopic, 
    createTailoredSystemPrompt, 
    parseOutlineText,
    OUTLINER_SYSTEM_PROMPT
} from './services/geminiService';
import type { OutlineItem, SectionContent, Message, ResearchResult, ContextData, Project } from './types';
import { SectionStatus, AgentStatus } from './types';

const findItem = (items: OutlineItem[], id: string): OutlineItem | null => {
  for (const item of items) {
    if (item.id === id) return item;
    const found = findItem(item.children, id);
    if (found) return found;
  }
  return null;
};

const findParent = (items: OutlineItem[], id: string): OutlineItem | null => {
    for (const item of items) {
      if (item.children.some(child => child.id === id)) return item;
      const found = findParent(item.children, id);
      if (found) return found;
    }
    return null;
};

const updateItemStatus = (items: OutlineItem[], id: string, status: SectionStatus): OutlineItem[] => {
    return items.map(item => {
        if (item.id === id) {
            return { ...item, status };
        }
        if (item.children.length > 0) {
            return { ...item, children: updateItemStatus(item.children, id, status) };
        }
        return item;
    });
};

const DEFAULT_COORDINATOR_PROMPT = `You are the Coordinator Agent for a content authoring project. Your master instruction is to ensure all generated content is clear, coherent, and consistent. The overall goal is to produce a high-quality, professional document.`;

const createNewProject = (name: string): Project => ({
  id: Date.now().toString(),
  name,
  coordinatorPrompt: DEFAULT_COORDINATOR_PROMPT,
  globalKnowledgeFiles: [],
  globalKnowledgeContext: '',
  outline: [],
  contents: {},
  outlineDraft: '',
  outlinerMessages: [
    { sender: 'agent', text: `I am the Outliner Agent for project "${name}". What is the topic of your document?` }
  ],
});


const App: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [view, setView] = useState<'projectList' | 'projectDashboard' | 'editor'>('projectList');
  
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [agentStatus, setAgentStatus] = useState<AgentStatus>(AgentStatus.Idle);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [researchAgentStatus, setResearchAgentStatus] = useState<AgentStatus>(AgentStatus.Idle);

  const activeProject = useMemo(() => projects.find(p => p.id === activeProjectId), [projects, activeProjectId]);

  // Effect to process global files for the active project
  useEffect(() => {
    if (!activeProject) return;

    const generateContext = async () => {
        const { globalKnowledgeFiles, id } = activeProject;
        if (globalKnowledgeFiles.length === 0) {
             updateProject(id, { globalKnowledgeContext: '' });
            return;
        }
        const fileContents = await Promise.all(
            globalKnowledgeFiles.map(file => 
                file.text().catch(e => `[Could not read file: ${file.name}]`)
            )
        );
        const contextString = globalKnowledgeFiles.map((file, i) => 
            `--- GLOBAL KNOWLEDGE SOURCE: ${file.name} ---\n${fileContents[i]}`
        ).join('\n\n');
        updateProject(id, { globalKnowledgeContext: contextString });
    };
    generateContext();
  }, [activeProject?.globalKnowledgeFiles]);


  const updateProject = (projectId: string, updates: Partial<Project>) => {
    setProjects(prevProjects =>
      prevProjects.map(p => (p.id === projectId ? { ...p, ...updates } : p))
    );
  };

  const handleCreateProject = (name: string) => {
    const newProject = createNewProject(name);
    setProjects(prev => [...prev, newProject]);
    setActiveProjectId(newProject.id);
    setView('projectDashboard');
    setToast({ message: `Project "${name}" created!`, type: 'success' });
  };

  const handleSelectProject = (projectId: string) => {
    setActiveProjectId(projectId);
    setActiveSectionId(null);
    setView('projectDashboard');
  };

  const handleBackToProjectList = () => {
    setActiveProjectId(null);
    setView('projectList');
  };

  const handleCoordinatorPromptChange = (value: string) => {
    if (activeProjectId) updateProject(activeProjectId, { coordinatorPrompt: value });
  };

  const handleGlobalFilesChange = (files: FileList | null) => {
    if (activeProjectId && files) {
      const currentFiles = activeProject?.globalKnowledgeFiles || [];
      updateProject(activeProjectId, { globalKnowledgeFiles: [...currentFiles, ...Array.from(files)] });
      setToast({ message: `${files.length} global file(s) added!`, type: 'success' });
    }
  };

  const handleEnterEditor = () => setView('editor');
  const handleBackToDashboard = () => setView('projectDashboard');

  const activeSection = useMemo(() => {
    if (!activeSectionId || !activeProject) return null;
    return findItem(activeProject.outline, activeSectionId);
  }, [activeSectionId, activeProject]);

  const activeContent = activeProject?.contents[activeSectionId || ''] || { content: '', messages: [], sessionFiles: [], contextIds: [], research_results: [] };
  
  const formatOutlineForPrompt = useCallback((items: OutlineItem[], level = 0): string => {
    return items.map(item => {
        const prefix = ' '.repeat(level * 2) + '- ';
        const childrenText = item.children.length > 0 ? `\n${formatOutlineForPrompt(item.children, level + 1)}` : '';
        return `${prefix}${item.title}${childrenText}`;
    }).join('\n');
  }, []);

  const handleSelectSection = useCallback(async (id: string) => {
    if (!activeProject) return;

    const section = findItem(activeProject.outline, id);
    if (!section) return;

    setActiveSectionId(id);

    if (!activeProject.contents[id]?.systemPrompt) {
        setAgentStatus(AgentStatus.Thinking);
        setToast({ message: 'Crafting a tailored prompt for the agent...', type: 'success' });
        try {
            const documentTitle = activeProject.outline[0]?.title || 'Untitled Document';
            const outlineStructure = formatOutlineForPrompt(activeProject.outline);
            const newSystemPrompt = await createTailoredSystemPrompt(
                documentTitle,
                outlineStructure,
                section.title,
                activeProject.coordinatorPrompt
            );

            const newContents = {
                ...activeProject.contents,
                [id]: {
                    ...(activeProject.contents[id] || { content: '', messages: [], sessionFiles: [], contextIds: [], research_results: [] }),
                    systemPrompt: newSystemPrompt
                },
            };
            updateProject(activeProject.id, { contents: newContents });
            setToast({ message: 'Agent is ready!', type: 'success' });
        } catch (error) {
            console.error("Failed to generate system prompt", error);
            setToast({ message: 'Could not prepare the agent. Using default prompt.', type: 'error' });
            const defaultPrompt = `${activeProject.coordinatorPrompt}\n\nYou are an expert academic writer. Your task is to write the content for the section "${section.title}".`;
            const newContents = {
                ...activeProject.contents,
                [id]: {
                    ...(activeProject.contents[id] || { content: '', messages: [], sessionFiles: [], contextIds: [], research_results: [] }),
                    systemPrompt: defaultPrompt
                },
            };
            updateProject(activeProject.id, { contents: newContents });
        } finally {
            setAgentStatus(AgentStatus.Idle);
        }
    }
  }, [activeProject, formatOutlineForPrompt]);


  const handleDeselect = useCallback(() => setActiveSectionId(null), []);

  const handleContentChange = useCallback((newContent: string) => {
    if (activeProjectId && activeProject && activeSectionId) {
      const newContents = {
          ...activeProject.contents,
          [activeSectionId]: { ...activeContent, content: newContent },
      };
      updateProject(activeProjectId, { contents: newContents });
    }
  }, [activeProjectId, activeProject, activeSectionId, activeContent]);
  
  const handleContextChange = useCallback((id: string, isChecked: boolean) => {
      if (activeProjectId && activeProject && activeSectionId) {
          const currentContexts = activeContent.contextIds || [];
          const newContexts = isChecked
              ? [...currentContexts, id]
              : currentContexts.filter(cid => cid !== id);
          const newContents = {
              ...activeProject.contents,
              [activeSectionId]: { ...activeContent, contextIds: newContexts }
          };
          updateProject(activeProjectId, { contents: newContents });
      }
  }, [activeProjectId, activeProject, activeSectionId, activeContent]);

  const handleFilesChange = useCallback((files: FileList | null) => {
      if (activeProjectId && activeProject && activeSectionId && files) {
          const newContents = {
              ...activeProject.contents,
              [activeSectionId]: { ...activeContent, sessionFiles: Array.from(files) },
          };
          updateProject(activeProjectId, { contents: newContents });
      }
  }, [activeProjectId, activeProject, activeSectionId, activeContent]);

  const handleOutlineCommand = useCallback(async (prompt: string) => {
    if (!activeProject) return;
    setAgentStatus(AgentStatus.Thinking);
    const userMessage: Message = { sender: 'user', text: prompt };
    updateProject(activeProject.id, { outlinerMessages: [...activeProject.outlinerMessages, userMessage] });

    try {
        const newOutlineDraft = await generateOutline(activeProject.outlineDraft, prompt, activeProject.coordinatorPrompt);
        const agentMessage: Message = { 
            sender: 'agent', 
            text: 'I have updated the draft outline in the workspace. Edit it or give more instructions. Click "Finalize Outline" when satisfied.' 
        };
        updateProject(activeProject.id, {
            outlineDraft: newOutlineDraft,
            outlinerMessages: [...activeProject.outlinerMessages, userMessage, agentMessage]
        });
        setToast({ message: 'Outline draft updated!', type: 'success' });
    } catch (error) {
        console.error("Error updating outline draft:", error);
        const agentMessage: Message = { sender: 'agent', text: 'Sorry, I encountered an error.' };
        updateProject(activeProject.id, { outlinerMessages: [...activeProject.outlinerMessages, userMessage, agentMessage] });
        setToast({ message: 'Failed to update outline draft.', type: 'error' });
    } finally {
        setAgentStatus(AgentStatus.Idle);
    }
  }, [activeProject]);

  const handleOutlineDraftChange = useCallback((newDraft: string) => {
      if (activeProjectId) updateProject(activeProjectId, { outlineDraft: newDraft });
  }, [activeProjectId]);

  const handleFinalizeOutline = useCallback(async () => {
    if (!activeProject || !activeProject.outlineDraft.trim()) return;
    setAgentStatus(AgentStatus.Thinking);
    setToast({ message: 'Finalizing outline...', type: 'success' });

    try {
        const newOutline = await parseOutlineText(activeProject.outlineDraft);
        updateProject(activeProject.id, {
            outline: newOutline,
            outlineDraft: '',
            outlinerMessages: [{ sender: 'agent', text: "Outline finalized! Select a section to start writing." }]
        });
        setToast({ message: 'Outline finalized and loaded!', type: 'success' });
    } catch (error) {
        console.error("Error finalizing outline:", error);
        setToast({ message: `Failed to finalize outline: ${error.message}`, type: 'error' });
    } finally {
        setAgentStatus(AgentStatus.Idle);
    }
  }, [activeProject]);

  const handleResearch = useCallback(async (query: string) => {
    if (!activeSectionId || !activeProject) return;
    setResearchAgentStatus(AgentStatus.Thinking);
    
    try {
        const results = await researchTopic(query);
        const newContents = {
            ...activeProject.contents,
            [activeSectionId]: { ...activeContent, research_results: results },
        };
        updateProject(activeProject.id, { contents: newContents });
        setToast({ message: `Research complete for: ${query}`, type: 'success' });
    } catch (error) {
        console.error("Error researching topic:", error);
        setToast({ message: 'Research failed.', type: 'error' });
    } finally {
        setResearchAgentStatus(AgentStatus.Idle);
    }
  }, [activeSectionId, activeProject, activeContent]);

  const handleGenerate = useCallback(async (prompt: string | undefined, contextIds: string[]) => {
    if (!activeSectionId || !activeSection || !activeProject) return;
    setAgentStatus(AgentStatus.Thinking);
    
    const updatedOutline = updateItemStatus(activeProject.outline, activeSectionId, SectionStatus.Writing);
    updateProject(activeProject.id, { outline: updatedOutline });
    
    let finalPrompt = prompt || `Write the content for the section titled "${activeSection.title}".`;
    
    const userMessage: Message = { sender: 'user', text: finalPrompt };
    const newMessages = [...(activeContent.messages || []), userMessage];
    let newContents = { ...activeProject.contents, [activeSectionId]: { ...activeContent, messages: newMessages } };
    updateProject(activeProject.id, { contents: newContents });

    try {
      const contextSections = contextIds.map(id => {
          const item = findItem(activeProject.outline, id);
          const content = activeProject.contents[id]?.content;
          return item && content ? `--- REF: ${item.title} ---\n${content}` : null;
      }).filter(Boolean).join('\n\n');

      const researchContext = (activeContent.research_results || [])
        .map(r => `--- RESEARCH RESULT: ${r.title} ---\nURL: ${r.url}\nSummary: ${r.summary}`)
        .join('\n\n');

      const systemPromptForAgent = activeProject.contents[activeSectionId]?.systemPrompt;
      
      const responseText = await generateContent(newMessages, contextSections, researchContext, activeProject.globalKnowledgeContext, systemPromptForAgent);
      
      const agentMessage: Message = { sender: 'agent', text: responseText };
       newContents = {
         ...activeProject.contents,
         [activeSectionId]: {
           ...(activeProject.contents[activeSectionId] || activeContent),
           content: responseText,
           messages: [...newMessages, agentMessage],
         },
      };
      updateProject(activeProject.id, { contents: newContents });

    } catch (error) {
      console.error("Error generating content:", error);
      setToast({ message: 'Failed to generate content.', type: 'error' });
      const agentErrorMessage: Message = { sender: 'agent', text: `I'm sorry, I encountered an error: ${error.message}`};
      newContents = { ...activeProject.contents, [activeSectionId]: { ...(activeProject.contents[activeSectionId] || activeContent), messages: [...newMessages, agentErrorMessage] } };
      updateProject(activeProject.id, { contents: newContents });
    } finally {
      setAgentStatus(AgentStatus.Idle);
    }
  }, [activeSectionId, activeSection, activeProject, activeContent]);

  const handleCommit = useCallback(() => {
    if (activeSectionId && activeProject) {
      const newOutline = updateItemStatus(activeProject.outline, activeSectionId, SectionStatus.Completed);
      updateProject(activeProject.id, { outline: newOutline });
      setToast({ message: 'Content committed successfully!', type: 'success' });
    }
  }, [activeSectionId, activeProject]);

  const handleExportDocument = useCallback(() => {
    if (!activeProject) return;

    const buildMarkdown = (items: OutlineItem[]): string => {
      let markdown = '';
      for (const item of items) {
        if (item.status === SectionStatus.Completed && activeProject.contents[item.id]?.content) {
          markdown += `${'#'.repeat(item.level + 1)} ${item.title}\n\n`;
          markdown += `${activeProject.contents[item.id].content}\n\n`;
        }
        if (item.children.length > 0) {
          markdown += buildMarkdown(item.children);
        }
      }
      return markdown;
    };

    const markdownContent = buildMarkdown(activeProject.outline);
    if (!markdownContent.trim()) {
        setToast({ message: 'No completed content to export.', type: 'error' });
        return;
    }
    const blob = new Blob([markdownContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeProject.name.replace(/\s+/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
    setToast({ message: 'Document exported!', type: 'success' });
  }, [activeProject]);

  const isExportDisabled = useMemo(() => {
    if (!activeProject) return true;
    const hasCompleted = (items: OutlineItem[]): boolean => {
        return items.some(item => item.status === SectionStatus.Completed || hasCompleted(item.children));
    }
    return !hasCompleted(activeProject.outline);
  }, [activeProject]);

  const outlinerAgentContext = useMemo((): ContextData | null => {
    if (!activeProject) return null;
    return {
      coordinatorPrompt: activeProject.coordinatorPrompt,
      globalKnowledge: activeProject.globalKnowledgeFiles.map(f => f.name),
      systemPrompt: OUTLINER_SYSTEM_PROMPT,
      documentOutline: activeProject.outlineDraft || "(The outline draft is empty. Provide a topic to begin.)",
      sessionKnowledge: [], 
      selectedReferences: [],
      researchContext: [],
    };
  }, [activeProject]);

  const fullAgentContext = useMemo((): ContextData | null => {
    if (!activeSectionId || !activeSection || !activeProject) return null;

    const formatOutlineForDisplay = (items: OutlineItem[], level = 0): string => {
        return items.map(item => {
            const prefix = ' '.repeat(level * 2) + '- ';
            const statusMarker = item.id === activeSectionId ? ' <-- YOU ARE HERE' : '';
            return `${prefix}${item.title}${statusMarker}\n${item.children.length > 0 ? formatOutlineForDisplay(item.children, level + 1) : ''}`;
        }).join('');
    };

    const selectedReferences = activeContent.contextIds
      .map(id => {
        const item = findItem(activeProject.outline, id);
        const content = activeProject.contents[id]?.content;
        return (item && content) ? { title: item.title, content } : null;
      })
      .filter((ref): ref is { title: string; content: string } => ref !== null);

    return {
      coordinatorPrompt: activeProject.coordinatorPrompt,
      globalKnowledge: activeProject.globalKnowledgeFiles.map(f => f.name),
      systemPrompt: activeContent.systemPrompt || "Generating tailored prompt...",
      documentOutline: formatOutlineForDisplay(activeProject.outline),
      sessionKnowledge: activeContent.sessionFiles.map(file => file.name),
      selectedReferences,
      researchContext: activeContent.research_results,
    };
  }, [activeSectionId, activeSection, activeProject, activeContent]);

  if (view === 'projectList' || !activeProject) {
    return <ProjectList projects={projects} onCreateProject={handleCreateProject} onSelectProject={handleSelectProject} />;
  }
  
  if (view === 'projectDashboard') {
    return (
      <ProjectDashboard
        project={activeProject}
        onCoordinatorPromptChange={handleCoordinatorPromptChange}
        onGlobalFilesChange={handleGlobalFilesChange}
        onEnterEditor={handleEnterEditor}
        onBack={handleBackToProjectList}
      />
    );
  }

  return (
    <div className="h-screen w-screen bg-brand-primary text-brand-text flex font-sans animate-fade-in">
      <div className="w-1/4 max-w-sm flex-shrink-0 h-full">
        <OutlinePane 
            outline={activeProject.outline} 
            activeSectionId={activeSectionId} 
            onSelectSection={handleSelectSection} 
            onDeselect={handleDeselect}
            onExport={handleExportDocument}
            isExportDisabled={isExportDisabled}
            onBackToDashboard={handleBackToDashboard}
        />
      </div>
      <div className="flex-grow h-full">
        <Workspace 
          activeSection={activeSection} 
          content={activeContent.content} 
          onContentChange={handleContentChange} 
          onCommit={handleCommit} 
          outlineDraft={activeProject.outlineDraft}
          onOutlineDraftChange={handleOutlineDraftChange}
          onFinalizeOutline={handleFinalizeOutline}
        />
      </div>
      <div className="w-1/3 max-w-md flex-shrink-0 h-full">
        <AgentInteractionPane 
          activeSection={activeSection} 
          messages={activeContent.messages} 
          agentStatus={agentStatus}
          onGenerate={handleGenerate}
          outline={activeProject.outline}
          contextIds={activeContent.contextIds}
          onContextChange={handleContextChange}
          sessionFiles={activeContent.sessionFiles}
          onFilesChange={handleFilesChange}
          outlinerMessages={activeProject.outlinerMessages}
          onOutlineCommand={handleOutlineCommand}
          researchAgentStatus={researchAgentStatus}
          onResearch={handleResearch}
          researchResults={activeContent.research_results || []}
          fullAgentContext={fullAgentContext}
          outlinerAgentContext={outlinerAgentContext}
        />
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default App;
