import React, { useState } from 'react';
import type { Project, Flow } from '../types';
import { UploadCloudIcon, PlayIcon, FileTextIcon, BracketsIcon } from './icons';

interface ProjectDashboardProps {
  project: Project;
  onGlobalFilesChange: (files: FileList | null) => void;
  onSelectFlow: (flowId: string) => void;
  onCreateFlow: (name: string) => void;
  onBack: () => void; // For returning to the project list
}

const ProjectDashboard: React.FC<ProjectDashboardProps> = ({
  project,
  onGlobalFilesChange,
  onSelectFlow,
  onCreateFlow,
  onBack,
}) => {
  const [newFlowName, setNewFlowName] = useState('');

  const handleCreateFlow = () => {
    if (newFlowName.trim()) {
      onCreateFlow(newFlowName.trim());
      setNewFlowName('');
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateFlow();
    }
  };

  return (
    <div className="h-screen w-screen bg-brand-primary text-brand-text flex items-center justify-center p-8 animate-fade-in">
      <div className="w-full max-w-4xl bg-brand-secondary rounded-lg shadow-2xl p-8 space-y-8 overflow-y-auto max-h-full relative">
        
        <button 
            onClick={onBack}
            className="absolute top-4 left-4 text-sm text-brand-light hover:text-brand-text underline"
        >
            &larr; All Projects
        </button>

        <header className="text-center border-b border-brand-accent pb-4 pt-4">
          <h1 className="text-4xl font-bold text-brand-text">{project.name}</h1>
          <p className="text-brand-light mt-2">Project Management Dashboard</p>
        </header>

        <section>
          <h2 className="text-2xl font-semibold mb-3">Authoring Flows</h2>
          <p className="text-sm text-brand-light mb-4">
            Each project can contain multiple flows for different documents or topics. Create a new flow or open an existing one to begin authoring.
          </p>
          <div className="space-y-3">
              {project.flows.map(flow => (
                <div key={flow.id} className="p-4 bg-brand-primary rounded-lg flex items-center justify-between group">
                    <div className="flex items-center space-x-3">
                        <BracketsIcon className="w-6 h-6 text-brand-light" />
                        <span className="font-semibold text-lg">{flow.name}</span>
                    </div>
                    <button 
                        onClick={() => onSelectFlow(flow.id)}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-200"
                    >
                        <PlayIcon className="w-5 h-5" />
                        <span>Open Editor</span>
                    </button>
                </div>
              ))}
          </div>
           <div className="mt-4 flex space-x-2 p-3 bg-brand-primary rounded-lg">
                <input
                    type="text"
                    value={newFlowName}
                    onChange={(e) => setNewFlowName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter name for new authoring flow..."
                    className="flex-grow bg-brand-secondary border border-brand-accent rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-brand-light"
                />
                <button
                    onClick={handleCreateFlow}
                    disabled={!newFlowName.trim()}
                    className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition-colors duration-200 disabled:bg-gray-500"
                >
                    + Create Flow
                </button>
            </div>
        </section>

        <section className="border-t border-brand-accent pt-6">
          <h2 className="text-2xl font-semibold mb-3">Global Knowledge Base (RAG)</h2>
          <p className="text-sm text-brand-light mb-4">
            Upload documents here to make them available as a knowledge source for all agents across the entire project.
          </p>
          <div className="p-6 border-2 border-dashed border-brand-accent rounded-lg text-center">
            <UploadCloudIcon className="w-12 h-12 mx-auto text-brand-light mb-3" />
            <label htmlFor="global-file-upload" className="cursor-pointer text-blue-400 hover:text-blue-300 font-semibold">
              Upload global documents
              <input id="global-file-upload" name="global-file-upload" type="file" className="sr-only" multiple onChange={(e) => onGlobalFilesChange(e.target.files)} />
            </label>
            <p className="text-xs text-gray-500 mt-1">PDF, TXT, DOCX supported</p>
          </div>
          {project.globalKnowledgeFiles.length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold text-brand-light">Uploaded Global Files:</h3>
              <ul className="space-y-2 text-brand-text text-sm mt-2 bg-brand-primary p-3 rounded-md">
                {project.globalKnowledgeFiles.map((file, i) => (
                  <li key={i} className="flex items-center space-x-2">
                    <FileTextIcon className="w-4 h-4 flex-shrink-0 text-brand-light" />
                    <span>{file.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default ProjectDashboard;