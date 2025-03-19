// src/components/AQLQueryManagement/MetadataManagement/EnvironmentSelector.jsx
import React, { useState } from 'react';
import { Database, Settings, ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react';
import CollapsibleSection from '../../common/CollapsibleSection';

const EnvironmentSelector = ({ 
  environments = [], 
  selectedEnvironments = [], 
  onEnvironmentSelectionChange
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showConnectionStrings, setShowConnectionStrings] = useState({});

  // Handle environment selection toggle
  const handleEnvironmentToggle = (envId) => {
    const newSelectedEnvironments = selectedEnvironments.includes(envId)
      ? selectedEnvironments.filter(id => id !== envId)
      : [...selectedEnvironments, envId];
    
    onEnvironmentSelectionChange(newSelectedEnvironments);
  };

  // Toggle connection string visibility
  const toggleConnectionString = (envId) => {
    setShowConnectionStrings(prev => ({
      ...prev,
      [envId]: !prev[envId]
    }));
  };

  // Organize environments - active ones first, then sort alphabetically
  const sortedEnvironments = [...environments].sort((a, b) => {
    if (a.isActive && !b.isActive) return -1;
    if (!a.isActive && b.isActive) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
      {/* Header */}
      <div 
        className="flex justify-between items-center cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Database size={16} className="text-blue-400" />
          <h3 className="font-medium text-slate-200">Environment Selection</h3>
          <span 
            className={`text-xs px-2 py-0.5 rounded-full ${
              selectedEnvironments.length > 0 
                ? 'bg-green-900/50 text-green-400' 
                : 'bg-red-900/50 text-red-400'
            }`}
          >
            {selectedEnvironments.length} Selected
          </span>
        </div>
        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="mt-3 space-y-3">
          {sortedEnvironments.length === 0 ? (
            <div className="text-slate-400 text-sm italic p-3 border border-slate-700 rounded">
              No environments configured yet. Use the Metadata Manager to create environments.
              <div className="mt-2">
                <button 
                  onClick={onShowEnvironmentSettings}
                  className="px-3 py-1 bg-slate-700 text-slate-300 rounded-md hover:bg-slate-600 flex items-center gap-1"
                >
                  <Settings size={14} />
                  Configure Environments
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-slate-400">
                Select one or more environments to run this query in:
              </p>
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                {sortedEnvironments.map(env => (
                  <div 
                    key={env._id} 
                    className={`bg-slate-700 border rounded-lg p-3 transition-colors ${
                      selectedEnvironments.includes(env._id)
                        ? 'border-blue-500 bg-slate-700'
                        : 'border-slate-600 hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`env-${env._id}`}
                          checked={selectedEnvironments.includes(env._id)}
                          onChange={() => handleEnvironmentToggle(env._id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-600 rounded"
                        />
                        <label htmlFor={`env-${env._id}`} className="flex-1 cursor-pointer">
                          <div className="flex items-center gap-2">
                            <Database size={16} className="text-blue-400" />
                            <h4 className="font-medium text-slate-200">{env.name}</h4>
                            {env.isActive && (
                              <span className="px-2 py-0.5 bg-green-900/50 text-green-400 text-xs rounded-full">
                                Active
                              </span>
                            )}
                          </div>
                        </label>
                      </div>
                    </div>
                    
                    {/* Environment Details */}
                    {env.description && (
                      <p className="text-sm text-slate-400 mt-2">{env.description}</p>
                    )}
                    
                    <div className="text-xs text-slate-500 mt-2 space-y-1">
                      {env.database && (
                        <div>Database: <span className="text-slate-400">{env.database}</span></div>
                      )}
                      {env.connectionString && (
                        <div className="flex items-center">
                          <span>Connection: </span>
                          <span className="ml-1 text-slate-400">
                            {showConnectionStrings[env._id] 
                              ? env.connectionString 
                              : '••••••••••••••••••••'}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleConnectionString(env._id);
                            }}
                            className="ml-2 text-slate-400 hover:text-blue-400"
                            title={showConnectionStrings[env._id] ? "Hide connection string" : "Show connection string"}
                          >
                            {showConnectionStrings[env._id] ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>          
              <div className="flex justify-between pt-2">
                <button
                  type="button"
                  onClick={() => onEnvironmentSelectionChange([])}
                  className="text-sm text-slate-400 hover:text-slate-300"
                  disabled={selectedEnvironments.length === 0}
                >
                  Clear Selection
                </button>
                <button
                  type="button"
                  onClick={() => onEnvironmentSelectionChange(sortedEnvironments.map(env => env._id))}
                  className="text-sm text-blue-400 hover:text-blue-300"
                  disabled={selectedEnvironments.length === sortedEnvironments.length}
                >
                  Select All
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EnvironmentSelector;