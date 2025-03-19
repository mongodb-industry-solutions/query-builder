//src/app/components/MQLAnalysisPanel/MQLAnalysisPanel.jsx

'use client';

import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/common/tabs";
import { Code, Database, Save, Check, RefreshCw, List, ChevronLeft } from 'lucide-react';
import { parseAql } from "@/lib/aqlToMql/parser/parseAqlAST.js";
import { translateASTToMQL } from "@/lib/aqlToMql/translator";

// Import modular components
import AQLEditor from "../common/AQLEditor";
import QuerySidebar from "./QuerySidebar";
import StrategyConfigTab from "./StrategyConfigTab";
import MQLPreviewTab from "./MQLPreviewTab";
import useMetadataManager from "@/hooks/useMetadataManager";

// Using a custom hook to manage the query state and make it persistent across tabs
const usePersistentQueryState = () => {
  const [selectedQuery, setSelectedQueryInternal] = useState(null);
  const [aqlInput, setAqlInput] = useState('');
  const [mqlOutput, setMqlOutput] = useState('');
  const [selectedStrategy, setSelectedStrategy] = useState('SingleCollection');
  const [strategyConfig, setStrategyConfig] = useState('{}');

  // Modified setter function to ensure data is updated immediately
  const setSelectedQuery = (query) => {
    setSelectedQueryInternal(query);
    
    // Immediately load the AQL content when a query is selected
    if (query && query.aqlText) {
      setAqlInput(query.aqlText);
    }
  };

  return {
    selectedQuery,
    setSelectedQuery,
    aqlInput,
    setAqlInput,
    mqlOutput,
    setMqlOutput,
    selectedStrategy,
    setSelectedStrategy,
    strategyConfig,
    setStrategyConfig
  };
};

const MainMQLPanel = () => {
  // Use the custom hook to manage state
  const {
    selectedQuery,
    setSelectedQuery,
    aqlInput,
    setAqlInput,
    mqlOutput,
    setMqlOutput,
    selectedStrategy,
    setSelectedStrategy, 
    strategyConfig,
    setStrategyConfig
  } = usePersistentQueryState();

  const [showAstPanel, setShowAstPanel] = useState(false);
  const [validationResult, setValidationResult] = useState(null);
  const [errorHighlight, setErrorHighlight] = useState([]);
  const [saveStatus, setSaveStatus] = useState({ loading: false, success: false, error: null });
  const [transformationStatus, setTransformationStatus] = useState('pending');
  const [sidebarVisible, setSidebarVisible] = useState(true);

  // Metadata manager for environments
  const { metadata } = useMetadataManager();

  // When a query is selected, set its transformation status
  useEffect(() => {
    if (selectedQuery) {
      setTransformationStatus(selectedQuery.mqlTransformationStatus || 'pending');
    }
  }, [selectedQuery]);

  // Sanitize AST for better display
  const sanitizeAST = (node, visited = new WeakSet()) => {
    if (!node || typeof node !== "object") return node;
    if (visited.has(node)) return undefined; // Prevent circular refs

    visited.add(node);

    let cleanNode = {};
    Object.keys(node).forEach(key => {
      if (
        key !== "parentCtx" &&
        key !== "invokingState" &&
        key !== "start" &&
        key !== "stop" &&
        key !== "ruleIndex"
      ) {
        cleanNode[key] = sanitizeAST(node[key], visited);
      }
    });

    return cleanNode;
  };

  // Convert AQL to MQL
  const handleConvertToMQL = () => {
    try {
      if (!aqlInput.trim()) {
        setMqlOutput("Error: AQL input is empty.");
        return;
      }

      console.log("🔹 Attempting AST Parsing...");

      const ast = parseAql(aqlInput);

      if (!ast) {
        console.warn("⚠️ AST Parsing failed, no AST returned");
        setMqlOutput("Error: AST generation failed.");
        return;
      }

      // Choose the model based on selected strategy
      const modelType = selectedStrategy === 'DistributedCollections' ? 'distributed' : 'single';
      const modelKey = modelType === 'distributed' ? '3-distributed' : '2-single-search';
      
      // Pass strategy configuration to translator if available
      let strategySettings = {};
      try {
        strategySettings = JSON.parse(strategyConfig);
      } catch (e) {
        console.warn("Could not parse strategy config, using defaults", e);
      }
      
      const pipeline = translateASTToMQL(ast, modelKey, strategySettings);
      setMqlOutput(JSON.stringify(pipeline, null, 2));
    } catch (error) {
      console.error("❌ Conversion Error:", error);
      setMqlOutput(`Error: ${error.message}`);
    }
  };

  // Update transformation status
  const updateTransformationStatus = (status) => {
    setTransformationStatus(status);
  };

  // Save the current query with updated content
  const handleSaveQuery = async () => {
    if (!selectedQuery) return;
    
    setSaveStatus({ loading: true, success: false, error: null });
    
    try {
      // Prepare updated query data
      const updatedQuery = {
        ...selectedQuery,
        aqlText: aqlInput,
        conversionStrategy: {
          type: selectedStrategy || 'SingleCollection',
          settings: {
            useAtlasSearch: selectedQuery.conversionStrategy?.settings?.useAtlasSearch || false,
            indexDefinition: strategyConfig || '{}'
          }
        },
        // Add generated MQL as a reference if available
        generatedMql: mqlOutput || undefined,
        // Include MQL transformation status
        mqlTransformationStatus: transformationStatus
      };
      
      // Send PUT request to update the query
      const response = await fetch('/api/internal/aql-queries', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedQuery)
      });
      
      if (!response.ok) {
        throw new Error('Failed to save query');
      }
      
      // Update local state with the saved query
      const savedQuery = await response.json();
      setSelectedQuery(savedQuery);
      
      setSaveStatus({ loading: false, success: true, error: null });
      
      // Reset success status after a delay
      setTimeout(() => {
        setSaveStatus(prev => ({ ...prev, success: false }));
      }, 3000);
      
    } catch (error) {
      console.error('Error saving query:', error);
      setSaveStatus({ 
        loading: false, 
        success: false, 
        error: error.message || 'Failed to save query'
      });
    }
  };

  // Toggle sidebar visibility
  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  return (
    <div className="flex h-full">
      {/* Query selection sidebar */}
      {sidebarVisible && (
        <div className="w-1/4 transition-all duration-300 ease-in-out">
          <QuerySidebar 
            selectedQuery={selectedQuery} 
            onSelectQuery={setSelectedQuery}
            onCollapse={toggleSidebar}
          />
        </div>
      )}
      
      {/* Main panel */}
      <div className={`${sidebarVisible ? 'w-3/4' : 'w-full'} transition-all duration-300 ease-in-out`}>
        {/* Sidebar toggle button (only when sidebar is hidden) */}
        {!sidebarVisible && (
          <button
            onClick={toggleSidebar}
            className="p-2 mb-4 bg-slate-700 rounded-md text-slate-300 hover:bg-slate-600 transition-colors"
            title="Show sidebar"
          >
            <List size={20} />
          </button>
        )}
        
        <Tabs defaultValue="aql" className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="aql" className="flex items-center gap-2">
              <Code className="w-4 h-4" />
              AQL Query
            </TabsTrigger>
            <TabsTrigger value="dataModel">
              <Database className="w-4 h-4 mr-2" />
              Data Model Strategy
            </TabsTrigger>
            <TabsTrigger value="mqlPreview" className="flex items-center gap-2">
              <Code className="w-4 h-4" />
              MongoDB MQL
            </TabsTrigger>
          </TabsList>

          {/* AQL Editor Tab */}
          <TabsContent value="aql" className="relative flex w-full h-full">
            <div className="w-full">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-slate-200">
                  {selectedQuery ? selectedQuery.name : 'Select or enter your AQL Query'}
                </h3>
                
                <div className="flex items-center gap-4">
                  {/* Transformation status selector */}
                  {selectedQuery && (
                    <div className="flex items-center">
                      <span className="text-sm text-slate-400 mr-2">Status:</span>
                      <select
                        value={transformationStatus}
                        onChange={(e) => updateTransformationStatus(e.target.value)}
                        className="p-1.5 bg-slate-700 border border-slate-600 rounded text-slate-300 text-sm"
                      >
                        <option value="pending">Pending</option>
                        <option value="needs_improvement">Needs Improvement</option>
                        <option value="done">Done</option>
                      </select>
                    </div>
                  )}
                  
                  {/* Save button */}
                  {selectedQuery && (
                    <button
                      onClick={handleSaveQuery}
                      disabled={saveStatus.loading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saveStatus.loading ? (
                        <>
                          <RefreshCw size={16} className="animate-spin" />
                          Saving...
                        </>
                      ) : saveStatus.success ? (
                        <>
                          <Check size={16} />
                          Saved!
                        </>
                      ) : (
                        <>
                          <Save size={16} />
                          Save Changes
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
              {saveStatus.error && (
                <div className="mb-4 p-3 bg-red-900/30 text-red-300 rounded-md">
                  Error: {saveStatus.error}
                </div>
              )}
              <AQLEditor
                initialValue={aqlInput}
                onAqlChange={setAqlInput}
                onValidation={setValidationResult}
                showAstPanel={showAstPanel}
                onToggleAstPanel={() => setShowAstPanel(!showAstPanel)}
                key={selectedQuery?._id} // Force remounting when query changes
              />
            </div>
          </TabsContent>

          {/* Data Model Strategy Tab */}
          <TabsContent value="dataModel">
            <StrategyConfigTab
              selectedQuery={selectedQuery}
              selectedStrategy={selectedStrategy}
              setSelectedStrategy={setSelectedStrategy}
              strategyConfig={strategyConfig}
              setStrategyConfig={setStrategyConfig}
              metadata={metadata}
            />
          </TabsContent>

          {/* MQL Preview Tab */}
          <TabsContent value="mqlPreview">
            <MQLPreviewTab 
              mqlOutput={mqlOutput} 
              onGenerateMQL={handleConvertToMQL}
              transformationStatus={transformationStatus}
              onUpdateStatus={updateTransformationStatus}
            />
          </TabsContent>
        </Tabs>
        
        {errorHighlight.length > 0 && (
          <div className="p-6 bg-slate-900 border-t border-slate-700">
            <div className="p-4 bg-red-900 bg-opacity-50 text-red-300 rounded-md border border-red-700">
              <h4 className="text-md font-medium mb-2">Errors Detected in the AQL query:</h4>
              <ul className="list-disc list-inside space-y-2">
                {errorHighlight.map((error, index) => (
                  <li key={index} className="text-red-300">
                    <span className="font-medium">Line {error.line}, Column {error.column}:</span> {error.message}
                    {error.expected && (
                      <div className="ml-6 mt-1 text-sm">
                        <span className="text-slate-400">Expected:</span> {error.expected}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MainMQLPanel;