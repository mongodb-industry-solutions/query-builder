// src/components/AQLQueryManagement/MetadataManagement/MetadataManager.jsx
import React, { useState } from 'react';
import { Tag, FolderTree, Database } from 'lucide-react';
import useMetadataManager from '@/hooks/useMetadataManager';
import FolderManager from './FolderManager';
import TagManager from './TagManager';
import EnvironmentManager from './EnvironmentManager';

const MetadataManager = () => {
  const { metadata, loading, error, actions } = useMetadataManager();
  const [activeTab, setActiveTab] = useState('folders');

  return (
    <div className="bg-slate-800 rounded-lg p-4">
      {/* Tabs */}
      <div className="mb-4 flex border-b border-slate-700">
        <button 
          className={`px-4 py-2 ${activeTab === 'folders' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-slate-400'}`}
          onClick={() => setActiveTab('folders')}
        >
          <div className="flex items-center gap-2">
            <FolderTree size={16} />
            <span>Folders</span>
          </div>
        </button>
        <button 
          className={`px-4 py-2 ${activeTab === 'tags' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-slate-400'}`}
          onClick={() => setActiveTab('tags')}
        >
          <div className="flex items-center gap-2">
            <Tag size={16} />
            <span>Tags</span>
          </div>
        </button>
        <button 
          className={`px-4 py-2 ${activeTab === 'environments' ? 'border-b-2 border-blue-500 text-blue-400' : 'text-slate-400'}`}
          onClick={() => setActiveTab('environments')}
        >
          <div className="flex items-center gap-2">
            <Database size={16} />
            <span>Environments</span>
          </div>
        </button>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'folders' && (
        <FolderManager
          folders={metadata.folders}
          actions={actions}
          loading={loading}
          error={error}
        />
      )}
      
      {activeTab === 'tags' && (
        <TagManager
          tags={metadata.tags}
          actions={actions}
          loading={loading}
          error={error}
        />
      )}
      
      {activeTab === 'environments' && (
        <EnvironmentManager
          environments={metadata.environments}
          actions={actions}
          loading={loading}
          error={error}
        />
      )}
    </div>
  );
};

export default MetadataManager;