"use client";

import React, { useState } from 'react';
import { Save, Copy, RefreshCcw } from 'lucide-react';
import CollapsibleSection from '../common/CollapsibleSection';
import TemplateTreeView from './TemplateTreeView';
import { Loader2 } from 'lucide-react';

const JSONLDMappingPanel = ({
  template,
  mappingConfig,
  onMappingChange,
  jsonLdPreview,
  mqlPipeline,
  onSaveMapping,
  loading
}) => {
  const [activePropertyIndex, setActivePropertyIndex] = useState(null);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);

  const handleContextChange = (e) => {
    onMappingChange({
      ...mappingConfig,
      context: e.target.value
    });
  };

  const handleTypeChange = (e) => {
    onMappingChange({
      ...mappingConfig,
      type: e.target.value
    });
  };

  const handleIdPathChange = (e) => {
    onMappingChange({
      ...mappingConfig,
      idPath: e.target.value
    });
  };

  const handleNodeSelect = (nodePath) => {
    if (activePropertyIndex !== null) {
      // Update the path for the active property
      const updatedProperties = [...mappingConfig.properties];
      updatedProperties[activePropertyIndex] = {
        ...updatedProperties[activePropertyIndex],
        path: nodePath
      };

      onMappingChange({
        ...mappingConfig,
        properties: updatedProperties
      });

      // Clear the active property index after selection
      setActivePropertyIndex(null);
    } else {
      // If no property is active, use this for the @id
      onMappingChange({
        ...mappingConfig,
        idPath: nodePath
      });
    }
  };

  const handleIdNodeSelect = () => {
    // This is a placeholder - the actual selection happens in handleNodeSelect
    // This just signals that we're selecting for the @id
    setActivePropertyIndex(null);
  };

  const handleAddProperty = () => {
    onMappingChange({
      ...mappingConfig,
      properties: [...mappingConfig.properties, { name: '', path: '' }]
    });
    // Set the newly added property as active
    setActivePropertyIndex(mappingConfig.properties.length);
  };

  const handleRemoveProperty = (index) => {
    const updatedProperties = mappingConfig.properties.filter((_, i) => i !== index);
    onMappingChange({
      ...mappingConfig,
      properties: updatedProperties
    });
    
    // Reset active property if the removed one was active
    if (activePropertyIndex === index) {
      setActivePropertyIndex(null);
    } else if (activePropertyIndex > index) {
      // Adjust index if we removed a property before the active one
      setActivePropertyIndex(activePropertyIndex - 1);
    }
  };

  const handlePropertyNameChange = (index, value) => {
    const updatedProperties = [...mappingConfig.properties];
    updatedProperties[index] = {
      ...updatedProperties[index],
      name: value
    };

    onMappingChange({
      ...mappingConfig,
      properties: updatedProperties
    });
  };

  const handlePropertyPathChange = (index, value) => {
    const updatedProperties = [...mappingConfig.properties];
    updatedProperties[index] = {
      ...updatedProperties[index],
      path: value
    };

    onMappingChange({
      ...mappingConfig,
      properties: updatedProperties
    });
  };

  const handleSetActiveProperty = (index) => {
    setActivePropertyIndex(index);
  };

  const copyMqlToClipboard = () => {
    if (mqlPipeline) {
      navigator.clipboard.writeText(JSON.stringify(mqlPipeline, null, 2));
      setCopiedToClipboard(true);
      setTimeout(() => setCopiedToClipboard(false), 2000);
    }
  };


  const generateMqlPipeline = (config) => {
    if (!config.type) return;
  
    // Create a pipeline that preserves the original document
    // and adds a json_ld field with the mapped properties
    const pipeline = [
      {
        "$match": {
          // Match documents that use this template
          "archetype_node_id": { "$regex": config.templateName, "$options": "i" }
        }
      },
      {
        "$addFields": {
          "json_ld": {
            "@context": config.context,
            "@type": config.type,
          }
        }
      }
    ];
  
    // Add the ID mapping if specified
    if (config.idPath) {
      pipeline[1].$addFields.json_ld["@id"] = `$${config.idPath}`;
    }
  
    // Add all the property mappings
    config.properties.forEach(prop => {
      if (prop.name && prop.path) {
        pipeline[1].$addFields.json_ld[prop.name] = `$${prop.path}`;
      }
    });
  
    // Optional: Add a final stage that formats the output for clarity
    pipeline.push({
      "$project": {
        "_id": 1,
        "ehr_id": 1,
        "composition_date": 1,
        "composition_version": 1,
        "archetype_node_id": 1,
        "canonicalJSON": 1,
        "json_ld": 1
      }
    });
  
    setMqlPipeline(pipeline);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      {/* Left Panel - Tree View */}
      <div className="lg:col-span-2 space-y-4">
        <CollapsibleSection 
          title={`Template Structure: ${template.name}`}
          isExpanded={true}
          onToggle={() => {}}
        >
          <div className="bg-slate-900 rounded-lg p-2 max-h-[calc(100vh-300px)] overflow-y-auto">
            <TemplateTreeView 
              node={template.tree}
              onSelect={handleNodeSelect}
              highlightPath={
                activePropertyIndex !== null 
                  ? mappingConfig.properties[activePropertyIndex]?.path 
                  : mappingConfig.idPath
              }
            />
          </div>
        </CollapsibleSection>
      </div>

      {/* Right Panel - Mapping Configuration */}
      <div className="lg:col-span-3 space-y-4">
        {/* Basic Configuration */}
        <CollapsibleSection
          title="JSON-LD Configuration"
          isExpanded={true}
          onToggle={() => {}}
        >
          <div className="space-y-4">
            {/* @context */}
            <div>
              <label className="block mb-2 text-sm font-medium text-slate-300">
                @context <span className="text-slate-500">(URI for vocabulary)</span>
              </label>
              <input
                type="text"
                value={mappingConfig.context}
                onChange={handleContextChange}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md 
                         text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="https://schema.org/"
              />
            </div>

            {/* @type */}
            <div>
              <label className="block mb-2 text-sm font-medium text-slate-300">
                @type <span className="text-slate-500">(Type of entity)</span>
              </label>
              <input
                type="text"
                value={mappingConfig.type}
                onChange={handleTypeChange}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md 
                         text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="MedicalImmunization"
              />
            </div>

            {/* @id */}
            <div>
              <label className="block mb-2 text-sm font-medium text-slate-300">
                @id Path 
                <span className="text-slate-500 ml-2">(OpenEHR path to use as identifier)</span>
                <button
                  onClick={handleIdNodeSelect}
                  className={`ml-2 px-2 py-1 text-xs rounded-md ${
                    activePropertyIndex === null
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {activePropertyIndex === null ? 'Selecting...' : 'Select from tree'}
                </button>
              </label>
              <input
                type="text"
                value={mappingConfig.idPath}
                onChange={handleIdPathChange}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md 
                         text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="canonicalJSON.uid.value"
              />
            </div>
          </div>
        </CollapsibleSection>

        {/* Properties */}
        <CollapsibleSection
          title="Properties"
          isExpanded={true}
          onToggle={() => {}}
        >
          <div className="space-y-4">
            {mappingConfig.properties.map((property, index) => (
              <div 
                key={index} 
                className={`grid grid-cols-6 gap-3 p-3 rounded-md ${
                  activePropertyIndex === index 
                    ? 'bg-blue-900/30 border border-blue-700' 
                    : 'bg-slate-800 border border-slate-700'
                }`}
              >
                <div className="col-span-2">
                  <label className="block mb-1 text-xs font-medium text-slate-400">
                    Property Name
                  </label>
                  <input
                    type="text"
                    value={property.name}
                    onChange={(e) => handlePropertyNameChange(index, e.target.value)}
                    className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded-md 
                             text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="name"
                  />
                </div>
                <div className="col-span-3">
                  <label className="block mb-1 text-xs font-medium text-slate-400">
                    Property Path
                  </label>
                  <input
                    type="text"
                    value={property.path}
                    onChange={(e) => handlePropertyPathChange(index, e.target.value)}
                    className="w-full px-2 py-1 bg-slate-700 border border-slate-600 rounded-md 
                             text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="canonicalJSON.property.path"
                  />
                </div>
                <div className="col-span-1 flex flex-col justify-end">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSetActiveProperty(index)}
                      className={`px-2 py-1 text-xs rounded-md ${
                        activePropertyIndex === index
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {activePropertyIndex === index ? 'Selecting...' : 'Select'}
                    </button>
                    <button
                      onClick={() => handleRemoveProperty(index)}
                      className="px-2 py-1 text-xs bg-red-900/50 text-red-300 rounded-md 
                               hover:bg-red-800/50"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <button
              onClick={handleAddProperty}
              className="w-full py-2 bg-slate-800 border border-dashed border-slate-600 
                       text-slate-400 rounded-md hover:bg-slate-700 hover:text-slate-300"
            >
              + Add Property
            </button>
          </div>
        </CollapsibleSection>

        {/* Preview */}
        <CollapsibleSection
          title="JSON-LD Preview"
          isExpanded={true}
          onToggle={() => {}}
        >
          <div className="bg-slate-800 p-4 rounded-md">
            {jsonLdPreview ? (
              <pre className="text-sm text-green-400 whitespace-pre-wrap">
                {JSON.stringify(jsonLdPreview, null, 2)}
              </pre>
            ) : (
              <p className="text-slate-400 italic">
                Configure your mapping to see the JSON-LD preview.
              </p>
            )}
          </div>
        </CollapsibleSection>

        {/* MongoDB Query */}
        <CollapsibleSection
          title="MongoDB Aggregation Pipeline"
          isExpanded={true}
          onToggle={() => {}}
          helpText="Copy this pipeline to use in your MongoDB Atlas to transform your data."
        >
          <div className="space-y-4">
            <div className="bg-slate-800 p-4 rounded-md relative">
              {mqlPipeline ? (
                <>
                  <button
                    onClick={copyMqlToClipboard}
                    className="absolute top-2 right-2 p-2 bg-slate-700 rounded-md 
                             text-slate-300 hover:bg-slate-600"
                    title="Copy to clipboard"
                  >
                    {copiedToClipboard ? <RefreshCcw size={16} /> : <Copy size={16} />}
                  </button>
                  <pre className="text-sm text-blue-400 whitespace-pre-wrap pr-8">
                    {JSON.stringify(mqlPipeline, null, 2)}
                  </pre>
                </>
              ) : (
                <p className="text-slate-400 italic">
                  Configure your mapping to see the MongoDB aggregation pipeline.
                </p>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={onSaveMapping}
                disabled={loading || !mappingConfig.type}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-white
                          ${loading || !mappingConfig.type 
                            ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
                            : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                Save Mapping
              </button>
            </div>
          </div>
        </CollapsibleSection>
      </div>
    </div>
  );
};

export default JSONLDMappingPanel;