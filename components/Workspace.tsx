

import React from 'react';
import type { OutlineItem } from '../types';
import { CheckSquareIcon } from './icons';

interface WorkspaceProps {
  activeSection: OutlineItem | null;
  content: string;
  onContentChange: (newContent: string) => void;
  onCommit: () => void;
  // New props for outlining mode
  outlineDraft: string;
  onOutlineDraftChange: (newDraft: string) => void;
  onFinalizeOutline: () => void;
}

const Workspace: React.FC<WorkspaceProps> = ({ 
    activeSection, 
    content, 
    onContentChange, 
    onCommit,
    outlineDraft,
    onOutlineDraftChange,
    onFinalizeOutline
}) => {
  const isOutlining = !activeSection;

  return (
    <main className="w-full h-full bg-brand-secondary flex flex-col p-6 overflow-hidden">
      <div className="flex-shrink-0 mb-4 pb-4 border-b border-brand-accent flex justify-between items-center">
        <h1 className="text-3xl font-bold text-brand-text truncate pr-4">
            {isOutlining ? 'Outline Editor' : activeSection.title}
        </h1>
        {isOutlining ? (
            <button
                onClick={onFinalizeOutline}
                className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition-colors duration-200 flex items-center space-x-2 disabled:bg-gray-500 disabled:cursor-not-allowed"
                disabled={!outlineDraft.trim()}
            >
                <CheckSquareIcon className="w-5 h-5" />
                <span>Finalize Outline</span>
            </button>
        ) : (
            <button
                onClick={onCommit}
                className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50 transition-colors duration-200 flex items-center space-x-2 disabled:bg-gray-500 disabled:cursor-not-allowed"
                disabled={!content}
            >
                <CheckSquareIcon className="w-5 h-5" />
                <span>Commit to Document</span>
            </button>
        )}
      </div>
      <div className="flex-grow overflow-y-auto">
        <textarea
          value={isOutlining ? outlineDraft : content}
          onChange={(e) => isOutlining ? onOutlineDraftChange(e.target.value) : onContentChange(e.target.value)}
          placeholder={isOutlining 
            ? "The AI-generated outline will appear here. Edit as needed, using hyphens and indentation for structure." 
            : "AI-generated content will appear here. You can edit it directly."
          }
          className="w-full h-full p-4 bg-brand-primary border border-brand-accent rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-brand-light text-brand-text leading-relaxed"
        />
      </div>
    </main>
  );
};

export default Workspace;