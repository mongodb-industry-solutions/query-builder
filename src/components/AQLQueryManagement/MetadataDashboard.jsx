// src/components/AQLQueryManagement/MetadataDashboard.jsx
import React, { useState } from 'react';
import { Tag, Settings, X, RefreshCw, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import useMetadataManager from '@/hooks/useMetadataManager';
import MetadataManager from './MetadataManagement/MetadataManager';

const MetadataDashboard = ({ onClose }) => {
  const { metadata, loading, error } = useMetadataManager();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Handle metadata refresh
  const handleRefreshMetadata = async () => {
    try {
      setIsRefreshing(true);
      setStatusMessage({ type: 'info', text: 'Refreshing metadata from server...' });

      // Clear local storage to force a refresh
      ['aql-metadata-lastFetch', 'aql-metadata-tags', 'aql-metadata-folders', 'aql-metadata-environments']
        .forEach((key) => localStorage.removeItem(key));

      // Reload the page to ensure fresh data
      window.location.reload();
    } catch (err) {
      console.error('Error refreshing metadata:', err);
      setStatusMessage({ type: 'error', text: 'Failed to refresh metadata from server' });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-slate-900 rounded-lg max-w-3xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Settings className="text-blue-400" size={20} />
            <h2 className="text-lg font-medium text-slate-200">Metadata Management</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefreshMetadata}
              disabled={isRefreshing}
              className="p-2 text-slate-400 hover:text-blue-400 hover:bg-slate-800 rounded-md disabled:opacity-50"
              title="Refresh metadata from server"
            >
              <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-md"
              title="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Status Messages */}
        {statusMessage && (
          <div className={`m-4 p-3 rounded-md flex items-center ${
            statusMessage.type === 'error' ? 'bg-red-900/30 text-red-300' :
            statusMessage.type === 'success' ? 'bg-green-900/30 text-green-300' :
            'bg-blue-900/30 text-blue-300'
          }`}>
            {statusMessage.type === 'error' && <AlertTriangle size={16} className="mr-2 flex-shrink-0" />}
            {statusMessage.type === 'success' && <CheckCircle size={16} className="mr-2 flex-shrink-0" />}
            {statusMessage.type === 'info' && <Info size={16} className="mr-2 flex-shrink-0" />}
            <span className="text-sm">{statusMessage.text}</span>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-slate-400 flex flex-col items-center">
              <RefreshCw size={32} className="animate-spin mb-2" />
              <span>Loading metadata...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="flex-1 p-8">
            <div className="bg-red-900/30 text-red-300 p-4 rounded-md">
              <h3 className="font-medium mb-2 flex items-center">
                <AlertTriangle size={16} className="mr-2" />
                Error Loading Metadata
              </h3>
              <p>{error}</p>
              <button
                onClick={handleRefreshMetadata}
                className="mt-4 px-4 py-2 bg-slate-700 text-slate-300 rounded hover:bg-slate-600"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        {!loading && !error && (
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="p-4 overflow-y-auto">
              <div className="mb-6">
                <h3 className="text-md font-medium text-slate-300 mb-2 flex items-center">
                  <Tag size={16} className="mr-2 text-blue-400" />
                  Metadata Statistics
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-800 p-3 rounded-md">
                    <div className="text-xs text-slate-500">Tags</div>
                    <div className="text-2xl font-medium text-slate-200">{metadata.tags.length}</div>
                  </div>
                  <div className="bg-slate-800 p-3 rounded-md">
                    <div className="text-xs text-slate-500">Folders</div>
                    <div className="text-2xl font-medium text-slate-200">{metadata.folders.length}</div>
                  </div>
                  <div className="bg-slate-800 p-3 rounded-md">
                    <div className="text-xs text-slate-500">Environments</div>
                    <div className="text-2xl font-medium text-slate-200">{metadata.environments.length}</div>
                  </div>
                </div>
              </div>
              
              <MetadataManager />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MetadataDashboard;