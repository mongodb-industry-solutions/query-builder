"use client";

import React, { useState } from 'react';
import { Loader2, Search, Clock, Trash2, Database } from 'lucide-react';

const MappingTemplateSelector = ({
  templates,
  savedMappings,
  onSelectTemplate,
  onLoadMapping,
  onDeleteMapping
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('templates');

  // Filter templates based on search query
  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter saved mappings based on search query
  const filteredMappings = savedMappings.filter(mapping =>
    mapping.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    mapping.templateName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
        <input
          type="text"
          placeholder={activeTab === 'templates' ? "Search templates..." : "Search mappings..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 p-2 bg-slate-700 border border-slate-600 
            text-slate-300 rounded-md focus:outline-none focus:ring-2 
            focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700 -mx-4 px-4">
        <button
          onClick={() => setActiveTab('templates')}
          className={`px-3 py-2 text-sm font-medium ${
            activeTab === 'templates'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Database size={14} />
            Templates
          </span>
        </button>
        <button
          onClick={() => setActiveTab('saved')}
          className={`px-3 py-2 text-sm font-medium ${
            activeTab === 'saved'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-slate-400 hover:text-slate-300'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Clock size={14} />
            Saved Mappings
          </span>
        </button>
      </div>

      {/* Template or Mapping List */}
      <div className="max-h-[calc(100vh-350px)] overflow-y-auto pr-2 -mr-2">
        {activeTab === 'templates' ? (
          <div className="space-y-2">
            {filteredTemplates.length > 0 ? (
              filteredTemplates.map((template) => (
                <div
                  key={template._id || template.id}
                  className="flex items-center justify-between p-3 bg-slate-700 hover:bg-slate-600 
                           rounded-md cursor-pointer transition-colors group"
                  onClick={() => onSelectTemplate(template.name)}
                >
                  <div className="overflow-hidden">
                    <div className="text-sm font-medium text-slate-200 truncate">
                      {template.name}
                    </div>
                    <div className="text-xs text-slate-400 truncate">
                      {template.webTemplate?.metadata?.description || 
                       template.tree?.localizedDescriptions?.en || 
                       'No description available'}
                    </div>
                  </div>
                  <div className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    Select →
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-slate-500">
                No templates found
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredMappings.length > 0 ? (
              filteredMappings.map((mapping) => (
                <div
                  key={mapping._id || mapping.id}
                  className="p-3 bg-slate-700 hover:bg-slate-600 
                           rounded-md cursor-pointer transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div 
                      className="text-sm font-medium text-slate-200 flex-1 truncate"
                      onClick={() => onLoadMapping(mapping)}
                    >
                      {mapping.name}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteMapping(mapping._id || mapping.id);
                      }}
                      className="text-slate-400 hover:text-red-400 p-1 rounded-md 
                               hover:bg-slate-700 transition-colors"
                      title="Delete mapping"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div 
                    className="text-xs text-slate-400 mb-2 truncate"
                    onClick={() => onLoadMapping(mapping)}
                  >
                    Template: {mapping.templateName}
                  </div>
                  <div 
                    className="text-xs text-slate-400 truncate"
                    onClick={() => onLoadMapping(mapping)}
                  >
                    Type: {mapping.config.type}
                  </div>
                  <div 
                    className="text-xs text-blue-400 mt-2 hover:underline"
                    onClick={() => onLoadMapping(mapping)}
                  >
                    Load this mapping
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-slate-500">
                No saved mappings found
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MappingTemplateSelector;