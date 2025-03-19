// src/app/components/AQLQueryManagement/AQLQueryEditor.jsx
"use client";

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Save, X } from 'lucide-react';
import AQLEditor from "@/components/common/AQLEditor";
import PropTypes from 'prop-types';
import CollapsibleSection from '../common/CollapsibleSection';
import validateAQL from "@/lib/aqlToMql/parser/validateAql";
import useMetadataManager from '@/hooks/useMetadataManager';
import TagSelector from './MetadataManagement/TagSelector';
import FolderSelector from './MetadataManagement/FolderSelector';
import EnvironmentSelector from './MetadataManagement/EnvironmentSelector';

const AQLQueryEditor = ({ query, onSave, onCancel }) => {
  const [showValidationWarning, setShowValidationWarning] = useState(false);
  const { metadata, loading: metadataLoading, error: metadataError, actions } = useMetadataManager();
  const [validationResult, setValidationResult] = useState(null);
  const [showAstPanel, setShowAstPanel] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [saveStatus, setSaveStatus] = useState({ loading: false, error: null, success: false });

  // Initialize state with query data or defaults.
  const [queryData, setQueryData] = useState({
    _id: query?._id || null,
    name: query?.name || '',
    description: query?.description || '',
    uuid: query?.uuid || '',
    folderId: query?.folderId || null,
    tags: query?.tags || [], // This can be an array of strings or tag objects
    aqlText: query?.aqlText || '',
    conversionStrategy: query?.conversionStrategy || {
      type: 'SingleCollection',
      settings: {
        useAtlasSearch: false,
        indexDefinition: '{}'
      }
    },
    selectedEnvironments: query?.selectedEnvironments || [],
  });


  useEffect(() => {
    if (metadata.tags.length > 0 && queryData.tags.length > 0) {
      if (queryData.tags.some(tag => typeof tag === 'string')) {
        const normalizedTags = queryData.tags.map(tagName => {
          const matchingTag = metadata.tags.find(t => t.name.toLowerCase() === tagName.toLowerCase());
          return matchingTag || { _id: `temp-${tagName}`, name: tagName };
        });

        setQueryData(prev => ({ ...prev, tags: normalizedTags }));
      }
    }
  }, [metadata.tags]);

  const [expandedSections, setExpandedSections] = useState({
    basicInfo: true,
    tags: false,
    conversionStrategy: false,
    environments: false
  });

  useEffect(() => {
    if (queryData.aqlText) {
      const result = validateAQL(queryData.aqlText);
      setValidationResult(result);
    } else {
      setValidationResult(null);
    }
  }, [queryData.aqlText]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setQueryData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAqlChange = (aqlText) => {
    setQueryData(prev => ({
      ...prev,
      aqlText
    }));
  };

  const handleStrategyChange = (e) => {
    const { value } = e.target;
    setQueryData(prev => ({
      ...prev,
      conversionStrategy: {
        ...prev.conversionStrategy,
        type: value
      }
    }));
  };

  const handleAtlasSearchToggle = (e) => {
    const { checked } = e.target;
    setQueryData(prev => ({
      ...prev,
      conversionStrategy: {
        ...prev.conversionStrategy,
        settings: {
          ...prev.conversionStrategy.settings,
          useAtlasSearch: checked
        }
      }
    }));
  };

  const handleIndexDefinitionChange = (e) => {
    const { value } = e.target;
    setQueryData(prev => ({
      ...prev,
      conversionStrategy: {
        ...prev.conversionStrategy,
        settings: {
          ...prev.conversionStrategy.settings,
          indexDefinition: value
        }
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errors = {};

    // Validate required fields
    if (!queryData.name.trim()) {
      errors.name = 'Name is required';
    }
    if (!queryData.aqlText.trim()) {
      errors.aqlText = 'AQL query is required';
    }
    if (queryData.selectedEnvironments.length === 0) {
      errors.environments = 'At least one environment must be selected';
    }

    // If validation errors, show them and stop
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    // If AQL validation failed, show warning
    if (validationResult && !validationResult.success) {
      setShowValidationWarning(true);
      return;
    }

    // Otherwise proceed with save
    proceedWithSave();
  };

  const proceedWithSave = async () => {
    setFormErrors({});
    setShowValidationWarning(false);
    setSaveStatus({ loading: true, error: null, success: false });

    try {
      // 1. Transform tags to string format for API
      const tagsAsStrings = queryData.tags.map(tag =>
        typeof tag === 'string' ? tag : tag.name
      );

      // 2. Prepare final query data
      const finalQueryData = {
        ...queryData,
        tags: tagsAsStrings
      };

      // 3. Call onSave with the transformed data
      const success = await onSave(finalQueryData);

      if (success) {
        setSaveStatus({ loading: false, error: null, success: true });
        // Auto-close on success after a short delay
        setTimeout(() => {
          if (onCancel) onCancel();
        }, 1000);
      } else {
        setSaveStatus({ loading: false, error: 'Failed to save query', success: false });
      }
    } catch (error) {
      console.error('Error saving query:', error);
      setSaveStatus({
        loading: false,
        error: error.message || 'An error occurred while saving',
        success: false
      });
    }
  };

  const handleShowEnvironmentSettings = () => {
    alert("Environments must be created in the Metadata Management dashboard.");
  };

  return (
    <div className="bg-slate-800 rounded-lg p-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-slate-200">
            {queryData._id ? 'Edit Query' : 'New Query'}
          </h3>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={saveStatus.loading}
              className="px-4 py-2 bg-slate-700 text-white rounded-md hover:bg-slate-600 
                disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <X size={16} />
              Cancel
            </button>
            <button
              type="submit"
              disabled={saveStatus.loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 
                disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Save size={16} />
              {saveStatus.loading ? 'Saving...' : 'Save Query'}
            </button>
          </div>
        </div>

        {/* Status messages */}
        {saveStatus.error && (
          <div className="p-2 bg-red-900/30 text-red-300 rounded text-sm">
            {saveStatus.error}
          </div>
        )}

        {saveStatus.success && (
          <div className="p-2 bg-green-900/30 text-green-300 rounded text-sm">
            Query saved successfully!
          </div>
        )}

        {metadataError && (
          <div className="p-2 bg-yellow-900/30 text-yellow-300 rounded text-sm">
            Warning: Metadata could not be loaded from server. Using local data.
          </div>
        )}

        <CollapsibleSection
          title="Basic Information"
          isExpanded={expandedSections.basicInfo}
          onToggle={() => toggleSection('basicInfo')}
        >
          <div className="space-y-4">
            {/* UUID, Name, Description inputs */}
            <div>
              <label htmlFor="uuid" className="block text-sm font-medium text-slate-300 mb-1">
                Query UUID <span className="text-slate-500">(unique identifier in the system)</span>
              </label>
              <input
                type="text"
                id="uuid"
                name="uuid"
                value={queryData.uuid}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md 
                  text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="domain::queryname"
              />
              <p className="mt-1 text-xs text-slate-400">
                A unique identifier for this query (e.g., "air::heightbyehrid")
              </p>
            </div>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-1">
                Query Name*
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={queryData.name}
                onChange={handleInputChange}
                className={`w-full p-2 bg-slate-700 border ${formErrors.name ? 'border-red-500' : 'border-slate-600'
                  } rounded-md text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
              {formErrors.name && (
                <p className="mt-1 text-sm text-red-500">{formErrors.name}</p>
              )}
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-slate-300 mb-1">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={queryData.description}
                onChange={handleInputChange}
                rows="2"
                className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <FolderSelector
              value={queryData.folderId}
              availableFolders={metadata.folders}
              onChange={(folderId) => {
                setQueryData(prev => ({
                  ...prev,
                  folderId
                }));
              }}
              onCreateFolder={actions.createFolder}
            />
          </div>
        </CollapsibleSection>

        {/* Tags */}
        <CollapsibleSection
          title="Tags"
          isExpanded={expandedSections.tags}
          onToggle={() => toggleSection('tags')}
        >
          <TagSelector
            selectedTags={queryData.tags}
            availableTags={metadata.tags}
            onAddTag={(tag) => {
              // Ensure the tag is not added twice (checking both _id and name)
              if (!queryData.tags.some(t =>
                (typeof t === 'object' && t._id === tag._id) ||
                (typeof t === 'string' && t === tag.name) ||
                (typeof t === 'object' && typeof tag === 'object' && t.name?.toLowerCase() === tag.name?.toLowerCase())
              )) {
                setQueryData(prev => ({
                  ...prev,
                  tags: [...prev.tags, tag]
                }));
              }
            }}
            onRemoveTag={(tag) => {
              setQueryData(prev => ({
                ...prev,
                tags: prev.tags.filter(t =>
                  (typeof t === 'object' && t._id !== tag._id) ||
                  (typeof t === 'string' && t !== tag.name)
                )
              }));
            }}
            onCreateTag={async (tagName) => {
              try {
                const newTag = await actions.createTag(tagName);

                if (newTag) {
                  return newTag;
                }
              } catch (error) {
                console.error("Error creating tag:", error);
                return { _id: `temp-${Date.now()}`, name: tagName };
              }
            }}
            onUpdateTag={async (tagId, colorName) => {
              try {
                // Find the tag in metadata or selected tags
                const tagToUpdate = metadata.tags.find(t => t._id === tagId) ||
                  queryData.tags.find(t => t._id === tagId);

                if (!tagToUpdate) return;

                // Create updated tag object with new color
                const updatedTag = {
                  ...tagToUpdate,
                  color: colorName === 'default' ? null : colorName
                };

                // Update the tag in the backend
                if (actions.updateTag) {
                  await actions.updateTag(updatedTag);

                  // Update local state to reflect the color change
                  setQueryData(prev => ({
                    ...prev,
                    tags: prev.tags.map(t =>
                      (typeof t === 'object' && t._id === tagId) ?
                        { ...t, color: updatedTag.color } : t
                    )
                  }));
                }
              } catch (error) {
                console.error("Error updating tag color:", error);
              }
            }}
          />
        </CollapsibleSection>

        {/* AQL Editor */}
        <div className="bg-slate-800 rounded-lg overflow-hidden">
          <div className="bg-slate-700 p-3 flex justify-between items-center">
            <h3 className="font-medium text-slate-200">AQL Query*</h3>
            {validationResult && (
              <div className={`text-sm ${validationResult.success ? 'text-green-400' : 'text-red-400'}`}>
                {validationResult.success ? 'Valid AQL' : 'Invalid AQL'}
              </div>
            )}
          </div>
          <AQLEditor
            initialValue={queryData.aqlText}
            onAqlChange={handleAqlChange}
            onValidation={setValidationResult}
            showAstPanel={showAstPanel}
            onToggleAstPanel={() => setShowAstPanel(!showAstPanel)}
          />
          {formErrors.aqlText && (
            <p className="p-2 text-sm text-red-500">{formErrors.aqlText}</p>
          )}
        </div>

        {/* Conversion Strategy */}
        <CollapsibleSection
          title="Conversion Strategy"
          isExpanded={expandedSections.conversionStrategy}
          onToggle={() => toggleSection('conversionStrategy')}
        >
          <div className="space-y-4">
            <div>
              <label htmlFor="strategyType" className="block text-sm font-medium text-slate-300 mb-1">
                Strategy Type
              </label>
              <select
                id="strategyType"
                value={queryData.conversionStrategy.type}
                onChange={handleStrategyChange}
                className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="SingleCollection">Single Collection</option>
                <option value="DistributedCollections">Distributed Collections</option>
              </select>
              <p className="mt-1 text-xs text-slate-400">
                {queryData.conversionStrategy.type === 'SingleCollection'
                  ? 'Use when: Not large repositories or queries based on an ehr_id.'
                  : 'Use when: Handling large repositories with complex queries.'}
              </p>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="useAtlasSearch"
                checked={queryData.conversionStrategy.settings.useAtlasSearch}
                onChange={handleAtlasSearchToggle}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-600 rounded"
              />
              <label htmlFor="useAtlasSearch" className="ml-2 block text-sm text-slate-300">
                Use Atlas Search
              </label>
            </div>

            <div>
              <label htmlFor="indexDefinition" className="block text-sm font-medium text-slate-300 mb-1">
                Index Definition
              </label>
              <textarea
                id="indexDefinition"
                value={queryData.conversionStrategy.settings.indexDefinition}
                onChange={handleIndexDefinitionChange}
                rows="4"
                className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                placeholder="{ index configuration }"
              />
            </div>
          </div>
        </CollapsibleSection>

        {/* Environments */}
        <EnvironmentSelector
          environments={metadata.environments}
          selectedEnvironments={queryData.selectedEnvironments}
          onEnvironmentSelectionChange={(selectedEnvs) => {
            setQueryData(prev => ({
              ...prev,
              selectedEnvironments: selectedEnvs
            }));
          }}
          onShowEnvironmentSettings={handleShowEnvironmentSettings}
        />

        {formErrors.environments && (
          <div className="p-2 bg-red-900/30 text-red-300 rounded text-sm">
            {formErrors.environments}
          </div>
        )}
      </form>
      {/* Validation Warning Modal */}
      {
        showValidationWarning && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-slate-800 p-6 rounded-lg max-w-md w-full">
              <h3 className="text-lg font-medium text-yellow-400 mb-4 flex items-center">
                <AlertTriangle size={20} className="mr-2" />
                Validation Warning
              </h3>
              <p className="text-slate-300 mb-6">
                This query has syntax errors that might cause issues when executed. Do you want to save it anyway?
              </p>
              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setShowValidationWarning(false)}
                  className="px-4 py-2 bg-slate-700 text-slate-300 rounded hover:bg-slate-600"
                >
                  Cancel
                </button>
                <button
                  onClick={proceedWithSave}
                  className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                >
                  Save Anyway
                </button>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
};

AQLQueryEditor.propTypes = {
  query: PropTypes.object,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
};

export default AQLQueryEditor;