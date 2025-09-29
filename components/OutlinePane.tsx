import React from 'react';
import type { OutlineItem } from '../types';
import { SectionStatus } from '../types';
import { CircleIcon, CheckCircleIcon, Edit3Icon, ChevronRightIcon, DownloadIcon } from './icons';

interface OutlinePaneProps {
  outline: OutlineItem[];
  activeSectionId: string | null;
  onSelectSection: (id: string) => void;
  onDeselect: () => void;
  onExport: () => void;
  isExportDisabled: boolean;
  onBackToDashboard: () => void; // New prop for navigation
}

const statusConfig = {
  [SectionStatus.Outline]: { icon: CircleIcon, color: 'text-brand-light', label: 'Outline' },
  [SectionStatus.Writing]: { icon: Edit3Icon, color: 'text-yellow-400 animate-pulse', label: 'Writing' },
  [SectionStatus.Completed]: { icon: CheckCircleIcon, color: 'text-green-400', label: 'Completed' },
};

const OutlineNode: React.FC<{ item: OutlineItem; activeSectionId: string | null; onSelectSection: (id: string) => void; }> = ({ item, activeSectionId, onSelectSection }) => {
  const { icon: Icon, color, label } = statusConfig[item.status];
  const isActive = item.id === activeSectionId;

  return (
    <div>
      <div
        onClick={() => onSelectSection(item.id)}
        className={`flex items-center space-x-2 p-2 rounded-md cursor-pointer transition-colors duration-200 ${isActive ? 'bg-brand-accent' : 'hover:bg-brand-secondary'}`}
        style={{ paddingLeft: `${item.level * 1.5 + 0.5}rem` }}
      >
        {/* FIX: Use a <title> child element for accessibility instead of a `title` prop to fix the type error. */}
        <Icon className={`w-4 h-4 ${color} flex-shrink-0`}>
          <title>{label}</title>
        </Icon>
        <span className={`flex-grow truncate ${isActive ? 'font-semibold' : ''}`}>
          {item.title}
        </span>
        {isActive && <ChevronRightIcon className="w-5 h-5 text-brand-text flex-shrink-0" />}
      </div>
      {item.children.length > 0 && (
        <div className="mt-1">
          {item.children.map(child => (
            <OutlineNode key={child.id} item={child} activeSectionId={activeSectionId} onSelectSection={onSelectSection} />
          ))}
        </div>
      )}
    </div>
  );
};


const OutlinePane: React.FC<OutlinePaneProps> = ({ outline, activeSectionId, onSelectSection, onDeselect, onExport, isExportDisabled, onBackToDashboard }) => {
  return (
    <aside className="w-full h-full bg-brand-primary p-4 overflow-y-auto border-r border-brand-accent flex flex-col">
      <div className="flex-shrink-0 mb-4 flex justify-between items-center">
        <h2 className="text-xl font-bold text-brand-text">Document Outline</h2>
         <button 
            onClick={onBackToDashboard}
            className="text-sm text-brand-light hover:text-brand-text underline"
            title="Back to Project Dashboard"
        >
            Dashboard
        </button>
      </div>
      <div className="flex-grow">
        {outline.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center p-4">
            <p className="text-brand-light text-sm">
                Your outline is empty.
                <br />
                {activeSectionId ? 'Go back to the outliner to start.' : 'Provide a topic to the Outliner Agent to generate the structure.'}
            </p>
          </div>
        ) : (
          <nav className="space-y-1">
            {outline.map(item => (
              <OutlineNode key={item.id} item={item} activeSectionId={activeSectionId} onSelectSection={onSelectSection} />
            ))}
          </nav>
        )}
      </div>
       <div className="flex-shrink-0 pt-4 border-t border-brand-accent space-y-2">
         {activeSectionId && (
            <button 
                onClick={onDeselect}
                className="w-full text-center text-sm text-brand-light hover:text-brand-text underline"
                title="Return to Outlining Mode"
            >
                Return to Outline Editor
            </button>
        )}
        <button
          onClick={onExport}
          disabled={isExportDisabled}
          className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-200 disabled:bg-gray-500 disabled:cursor-not-allowed"
        >
          <DownloadIcon className="w-5 h-5" />
          <span>Export Document</span>
        </button>
      </div>
    </aside>
  );
};

export default OutlinePane;
