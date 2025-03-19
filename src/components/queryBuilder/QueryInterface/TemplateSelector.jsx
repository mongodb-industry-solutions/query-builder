"use client";

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Plus, X, ChevronUp, ChevronDown } from 'lucide-react';

const TemplateSelector = ({ activeTemplates, onAddTemplate, onRemoveTemplate }) => {
  const [availableTemplates, setAvailableTemplates] = useState([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [fetchTried, setFetchTried] = useState(false); // Track if we've tried fetching

  const fetchAvailableTemplates = async () => {
    try {
      const response = await fetch('/api/internal/templates');
      if (response.ok) {
        const data = await response.json();
        setAvailableTemplates(data);
      }
    } catch (error) {
      console.error("Error fetching available templates:", error);
    } finally {
      setFetchTried(true); // Mark that we've tried fetching, regardless of outcome
    }
  };

  useEffect(() => {
    // Only fetch if we haven't attempted it yet
    if (!fetchTried) {
      fetchAvailableTemplates();
    }
  }, [fetchTried]);

  // Filter out any templates already in activeTemplates, and then apply the search filter
  const filteredTemplates = availableTemplates.filter(
    (template) =>
      !activeTemplates.includes(template.name) &&
      template.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddTemplate = (templateName) => {
    if (templateName && !activeTemplates.includes(templateName)) {
      onAddTemplate(templateName);
    }
  };

  return (
    <div className="bg-slate-800 rounded-lg overflow-hidden">
      {/* Header with integrated collapse button */}
      <div
        className="flex items-center justify-between p-3 bg-slate-700 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h2 className="text-slate-200 text-sm font-medium">
          Select Templates for building your Query
        </h2>
        <button className="text-slate-400 hover:text-slate-200">
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Collapsible content */}
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => {
          setSearchQuery(e.target.value);
        }}
        placeholder="Search templates..."
        className="w-full px-3 py-2 rounded-md bg-slate-800"
      />
      <div
        className={`transition-all duration-300 ${
          isExpanded ? 'max-h-[500px] p-4' : 'max-h-0 overflow-hidden'
        }`}
      >
        {/* Available templates with inline actions */}
        <div className="space-y-2">
          {filteredTemplates.length > 0 ? (
            filteredTemplates.map((template) => (
              <div
                key={template._id || template.id}
                className="flex items-center justify-between bg-slate-700/50 p-2 rounded hover:bg-slate-700"
              >
                <span className="text-slate-300 text-sm">{template.name}</span>
                <button
                  onClick={() => handleAddTemplate(template.name)}
                  className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 flex items-center gap-1"
                >
                  <Plus size={12} /> Add
                </button>
              </div>
            ))
          ) : (
            <div className="text-slate-400 text-sm italic">
              {fetchTried ? 
                (availableTemplates.length === 0
                  ? "No templates available. Add templates in the Templates tab."
                  : "No matching templates or all have been added") 
                : "Loading templates..."}
            </div>
          )}
        </div>

        {/* Active templates */}
        {activeTemplates.length > 0 && (
          <div className="mt-4 border-t border-slate-700 pt-4">
            <h3 className="text-slate-300 text-sm font-medium mb-2">
              Active Templates
            </h3>
            <div className="flex flex-wrap gap-2">
              {activeTemplates.map((templateName) => (
                <div
                  key={templateName}
                  className="flex items-center bg-blue-600/20 border border-blue-600/30 p-2 rounded-md"
                >
                  <span className="text-blue-300 text-sm">{templateName}</span>
                  <button
                    onClick={() => onRemoveTemplate(templateName)}
                    className="ml-2 text-slate-400 hover:text-red-400"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

TemplateSelector.propTypes = {
  activeTemplates: PropTypes.arrayOf(PropTypes.string).isRequired,
  onAddTemplate: PropTypes.func.isRequired,
  onRemoveTemplate: PropTypes.func.isRequired,
};

export default TemplateSelector;