import React from 'react';
import type { Project } from '../types';
import { UploadCloudIcon, PlayIcon, FileTextIcon } from './icons';

interface ProjectDashboardProps {
  project: Project;
  onCoordinatorPromptChange: (value: string) => void;
  onGlobalFilesChange: (files: FileList | null) => void;
  onEnterEditor: () => void;
  onBack: () => void; // For returning to the project list
}

const ProjectDashboard: React.FC<ProjectDashboardProps> = ({
  project,
  onCoordinatorPromptChange,
  onGlobalFilesChange,
  onEnterEditor,
  onBack,
}) => {
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
          <h2 className="text-2xl font-semibold mb-3">Coordinator Agent Prompt</h2>
          <p className="text-sm text-brand-light mb-4">
            This master prompt guides all AI agents in this project. Customize it to define the overall tone, style, and core objectives of your document.
          </p>
          <textarea
            value={project.coordinatorPrompt}
            onChange={(e) => onCoordinatorPromptChange(e.target.value)}
            rows={6}
            className="w-full p-4 bg-brand-primary border border-brand-accent rounded-md resize-y focus:outline-none focus:ring-2 focus:ring-brand-light text-brand-text leading-relaxed"
            placeholder="e.g., You are a helpful assistant writing a technical whitepaper for an expert audience. The tone should be formal, objective, and data-driven..."
          />
        </section>

        <section>
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

        <footer className="text-center border-t border-brand-accent pt-6">
          <button
            onClick={onEnterEditor}
            className="flex items-center justify-center space-x-3 px-8 py-4 bg-blue-600 text-white font-bold text-lg rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-200 transform hover:scale-105"
          >
            <PlayIcon className="w-6 h-6" />
            <span>Enter Authoring Environment</span>
          </button>
        </footer>

      </div>
    </div>
  );
};

export default ProjectDashboard;
