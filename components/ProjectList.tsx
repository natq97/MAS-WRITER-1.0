import React, { useState } from 'react';
import type { Project } from '../types';
import { FileTextIcon } from './icons';

interface ProjectListProps {
  projects: Project[];
  onCreateProject: (name: string) => void;
  onSelectProject: (id: string) => void;
}

const ProjectList: React.FC<ProjectListProps> = ({ projects, onCreateProject, onSelectProject }) => {
  const [newProjectName, setNewProjectName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = () => {
    if (newProjectName.trim()) {
      onCreateProject(newProjectName.trim());
      setNewProjectName('');
      setIsCreating(false);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreate();
    }
    if (e.key === 'Escape') {
      setIsCreating(false);
      setNewProjectName('');
    }
  };

  return (
    <div className="h-screen w-screen bg-brand-primary text-brand-text flex items-center justify-center p-8 animate-fade-in">
      <div className="w-full max-w-2xl bg-brand-secondary rounded-lg shadow-2xl p-8">
        <header className="text-center border-b border-brand-accent pb-4">
          <h1 className="text-4xl font-bold text-brand-text">MAS-Writer Projects</h1>
          <p className="text-brand-light mt-2">Select a project or create a new one to begin.</p>
        </header>

        <div className="mt-8 space-y-4">
          {projects.length === 0 && !isCreating && (
            <div className="text-center py-10">
              <p className="text-brand-light">You have no projects yet.</p>
            </div>
          )}

          {projects.map((project) => (
            <div
              key={project.id}
              onClick={() => onSelectProject(project.id)}
              className="p-4 bg-brand-primary rounded-lg flex items-center justify-between cursor-pointer hover:bg-brand-accent transition-colors duration-200 group"
            >
              <div className="flex items-center space-x-3">
                <FileTextIcon className="w-6 h-6 text-brand-light group-hover:text-brand-text" />
                <span className="font-semibold text-lg">{project.name}</span>
              </div>
              <span className="text-sm text-brand-light group-hover:text-brand-text">&rarr;</span>
            </div>
          ))}
          
          {isCreating && (
            <div className="p-4 bg-brand-primary rounded-lg flex items-center space-x-3">
              <FileTextIcon className="w-6 h-6 text-brand-light" />
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter new project name..."
                className="flex-grow bg-transparent focus:outline-none text-lg"
                autoFocus
              />
               <button onClick={handleCreate} className="text-sm px-3 py-1 bg-blue-600 rounded hover:bg-blue-700">Create</button>
               <button onClick={() => setIsCreating(false)} className="text-sm">Cancel</button>
            </div>
          )}

        </div>

        <footer className="text-center border-t border-brand-accent pt-6 mt-8">
          <button
            onClick={() => setIsCreating(true)}
            disabled={isCreating}
            className="px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-200 disabled:bg-gray-500"
          >
            + Create New Project
          </button>
        </footer>
      </div>
    </div>
  );
};

export default ProjectList;
