"use client";

import React, { useState, useEffect, useCallback } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { cn } from '@/lib/utils';
import { Loader2, AlertCircle } from 'lucide-react';

// Import components
import JSONLDMappingPanel from './JSONLDMappingPanel';
import JSONLDQueryExplorer from './JSONLDQueryExplorer';
import MappingTemplateSelector from './MappingTemplateSelector';

const OpenEHRAnalyticsPanel = () => {
  const [activeTab, setActiveTab] = useState('mapping');
  const [templates, setTemplates] = useState({});
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [mappingConfig, setMappingConfig] = useState({
    context: "https://schema.org/",
    type: "",
    idPath: "",
    properties: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [jsonLdPreview, setJsonLdPreview] = useState(null);
  const [mqlPipeline, setMqlPipeline] = useState(null);
  const [savedMappings, setSavedMappings] = useState([]);

  // Fetch templates
  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/internal/templates');
      if (!response.ok) {
        throw new Error('Failed to fetch templates');
      }
      const data = await response.json();
      const templateMap = {};
      data.forEach(t => {
        templateMap[t.name] = {
          ...t,
          tree: t.tree || (t.webTemplate && t.webTemplate.tree)
        };
      });
      setTemplates(templateMap);
    } catch (err) {
      console.error("Error in fetchTemplates:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch saved mappings
  const fetchSavedMappings = useCallback(async () => {
    try {
      setLoading(true);
      // Replace with your actual API endpoint for mappings
      const response = await fetch('/api/internal/jsonld-mappings');
      if (!response.ok) {
        throw new Error('Failed to fetch saved mappings');
      }
      const data = await response.json();
      setSavedMappings(data);
    } catch (err) {
      console.error("Error in fetchSavedMappings:", err);
      // Don't set error - this isn't critical
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
    fetchSavedMappings();
  }, [fetchTemplates, fetchSavedMappings]);

  const handleTemplateSelect = (templateName) => {
    setSelectedTemplate(templates[templateName]);
    // Reset mapping config when selecting a new template
    setMappingConfig({
      context: "https://schema.org/",
      type: "",
      idPath: "",
      properties: []
    });
  };

  const handleSaveMapping = async () => {
    if (!selectedTemplate || !mappingConfig.type) {
      setError("Please select a template and set a type for your mapping");
      return;
    }

    try {
      setLoading(true);
      const mappingToSave = {
        templateName: selectedTemplate.name,
        templateId: selectedTemplate._id,
        config: mappingConfig,
        name: `${selectedTemplate.name} - ${mappingConfig.type} Mapping`,
        createdAt: new Date().toISOString()
      };

      // Replace with your actual API endpoint for saving mappings
      const response = await fetch('/api/internal/jsonld-mappings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mappingToSave)
      });

      if (!response.ok) {
        throw new Error('Failed to save mapping');
      }

      // Refresh saved mappings
      await fetchSavedMappings();
      
      // Show success message
      setError(null);
    } catch (err) {
      console.error("Error saving mapping:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMappingChange = (newConfig) => {
    setMappingConfig(newConfig);
    
    // Generate preview and MQL pipeline
    generateJsonLdPreview(newConfig);
    generateMqlPipeline(newConfig);
  };

  const generateJsonLdPreview = (config) => {
    if (!config.type) return;

    const preview = {
      "@context": config.context,
      "@type": config.type,
    };

    if (config.idPath) {
      preview["@id"] = `$${config.idPath}`;
    }

    config.properties.forEach(prop => {
      if (prop.name && prop.path) {
        preview[prop.name] = `$${prop.path}`;
      }
    });

    setJsonLdPreview(preview);
  };

  const generateMqlPipeline = (config) => {
    if (!config.type) return;

    const pipeline = [
      {
        "$project": {
          "_id": 1,
          "ehr_id": 1,
          "composition_id": 1,
          "json_ld": {
            "@context": config.context,
            "@type": config.type,
          }
        }
      }
    ];

    if (config.idPath) {
      pipeline[0].$project.json_ld["@id"] = `$${config.idPath}`;
    }

    config.properties.forEach(prop => {
      if (prop.name && prop.path) {
        pipeline[0].$project.json_ld[prop.name] = `$${prop.path}`;
      }
    });

    setMqlPipeline(pipeline);
  };

  const handleLoadMapping = (mapping) => {
    setSelectedTemplate(templates[mapping.templateName]);
    setMappingConfig(mapping.config);
    
    // Update previews
    generateJsonLdPreview(mapping.config);
    generateMqlPipeline(mapping.config);
  };

  const handleDeleteMapping = async (mappingId) => {
    try {
      setLoading(true);
      // Replace with your actual API endpoint for deleting mappings
      const response = await fetch(`/api/internal/jsonld-mappings/${mappingId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete mapping');
      }

      // Refresh saved mappings
      await fetchSavedMappings();
    } catch (err) {
      console.error("Error deleting mapping:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-6 text-white text-center">
          OpenEHR Analytics with JSON-LD
        </h1>

        <Tabs.Root 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="w-full"
        >
          <Tabs.List className="flex border-b border-slate-700 mb-4">
            <Tabs.Trigger
              value="mapping"
              className={cn(
                "px-4 py-2 -mb-px text-sm font-medium text-slate-400",
                "hover:text-slate-300 focus:outline-none",
                "data-[state=active]:text-blue-400 data-[state=active]:border-b-2",
                "data-[state=active]:border-blue-400"
              )}
            >
              JSON-LD Mapping
            </Tabs.Trigger>
            <Tabs.Trigger
              value="explorer"
              className={cn(
                "px-4 py-2 -mb-px text-sm font-medium text-slate-400",
                "hover:text-slate-300 focus:outline-none",
                "data-[state=active]:text-blue-400 data-[state=active]:border-b-2",
                "data-[state=active]:border-blue-400"
              )}
            >
              Query Explorer
            </Tabs.Trigger>
          </Tabs.List>

          {error && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-700 rounded-md flex items-start gap-2">
              <AlertCircle className="text-red-400 mt-0.5" size={16} />
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}

          <Tabs.Content value="mapping" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Left Panel - Template Selection */}
              <div className="lg:col-span-1 space-y-4">
                <div className="bg-slate-800 rounded-lg p-4">
                  <h2 className="text-lg font-medium text-slate-200 mb-4">Templates</h2>
                  {loading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="animate-spin text-blue-400" size={24} />
                    </div>
                  ) : (
                    <MappingTemplateSelector
                      templates={Object.values(templates)}
                      savedMappings={savedMappings}
                      onSelectTemplate={handleTemplateSelect}
                      onLoadMapping={handleLoadMapping}
                      onDeleteMapping={handleDeleteMapping}
                    />
                  )}
                </div>
              </div>
              
              {/* Right Panel - Mapping Interface */}
              <div className="lg:col-span-3 space-y-4">
                {selectedTemplate ? (
                  <JSONLDMappingPanel 
                    template={selectedTemplate}
                    mappingConfig={mappingConfig}
                    onMappingChange={handleMappingChange}
                    jsonLdPreview={jsonLdPreview}
                    mqlPipeline={mqlPipeline}
                    onSaveMapping={handleSaveMapping}
                    loading={loading}
                  />
                ) : (
                  <div className="bg-slate-800 rounded-lg p-8 text-center">
                    <h3 className="text-lg font-medium text-slate-300 mb-2">No Template Selected</h3>
                    <p className="text-slate-400">
                      Please select a template from the left panel to start creating your JSON-LD mapping.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Tabs.Content>

          <Tabs.Content value="explorer" className="space-y-6">
            <JSONLDQueryExplorer 
              savedMappings={savedMappings}
              loading={loading}
            />
          </Tabs.Content>
        </Tabs.Root>
      </div>
    </div>
  );
};

export default OpenEHRAnalyticsPanel;