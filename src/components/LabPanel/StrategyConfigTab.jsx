'use client';

import React, { useState, useEffect } from 'react';
import { Eye, Database, RefreshCw } from 'lucide-react';
import ReactFlow, { Background, Controls } from 'reactflow';
import JSONEditor from '../common/JSONEditor';
import CollapsibleSection from '../common/CollapsibleSection';
import 'reactflow/dist/style.css';

// Custom node component for data model visualization
const DataModelNode = ({ data }) => {
  if (!data) return null;

  return (
    <div className="px-4 py-2 shadow-md rounded-md bg-slate-800 border border-slate-700 hover:border-blue-500">
      <div className="flex items-center">
        <div className="rounded-full w-3 h-3 bg-blue-500 flex-shrink-0" />
        <p className="ml-2 text-lg font-bold text-slate-200">{data.label || 'Unnamed Node'}</p>
      </div>
      <p className="text-slate-400 text-sm mt-2">{data.description || ''}</p>
      {data.fields && (
        <ul className="text-xs text-slate-400 mt-2">
          {data.fields.map((field, index) => (
            <li key={index} className="ml-4 list-disc">{field.name}: {field.type}</li>
          ))}
        </ul>
      )}
    </div>
  );
};

const StrategyConfigTab = ({ 
  selectedQuery, 
  selectedStrategy, 
  setSelectedStrategy, 
  strategyConfig, 
  setStrategyConfig,
  metadata
}) => {
  const [showFlowChart, setShowFlowChart] = useState(false);
  const [selectedEnvironment, setSelectedEnvironment] = useState(null);
  const [loadingStrategyFile, setLoadingStrategyFile] = useState(false);
  
  const strategies = [
    {
      id: 'SingleCollection',
      title: 'Single Collection',
      description: 'Use when: Not large repositories or queries based on an ehr_id.',
    },
    {
      id: 'DistributedCollections',
      title: 'Distributed Collections',
      description: 'Use when: Handling large repositories with complex queries.'
    }
  ];

  // Data models for visualization
  const dataModels = {
    single: {
      nodes: [{
        id: 'compositions',
        type: 'dataModel',
        position: { x: 250, y: 100 },
        data: {
          label: 'Compositions', description: 'A full composition collection', fields: [
            { name: "_id", type: "ObjectId()" },
            { name: "ehr_id", type: "string" },
            { name: "composition_date", type: "ISODate" },
            { name: "composition_version", type: "string" },
            { name: "archetype_node_id", type: "string" },
            { name: "CanonicalJSON", type: "object" },
          ]
        }
      }],
      edges: []
    },
    distributed: {
      nodes: [
        {
          id: 'compositions',
          type: 'dataModel',
          position: { x: 150, y: 50 },
          data: {
            label: 'Compositions', description: 'A full composition collection', fields: [
              { name: "_id", type: "ObjectId()" },
              { name: "ehr_id", type: "string" },
              { name: "composition_date", type: "ISODate" },
              { name: "composition_version", type: "string" },
              { name: "archetype_node_id", type: "string" },
              { name: "CanonicalJSON", type: "object" },
            ]
          }
        },
        {
          id: 'immunizations',
          type: 'dataModel',
          position: { x: 350, y: 200 },
          data: {
            label: 'Immunizations', description: 'A collection for immunizations', fields: [
              { name: "vaccine", type: "string" },
              { name: "dose", type: "integer" }
            ]
          }
        }
      ],
      edges: [{
        id: 'immunization-composition',
        source: 'immunizations',
        target: 'compositions',
        label: 'compositionId',
        type: 'smoothstep'
      }]
    }
  };  // Added the missing closing brace here

  const nodeTypes = { dataModel: DataModelNode };

  // Load environment strategy configuration
  const loadEnvironmentStrategy = (environment) => {
    if (!environment) return;
    
    setSelectedEnvironment(environment);
    setLoadingStrategyFile(true);
    
    try {
      let strategyData = {};
      
      // If metaDescription exists and is valid JSON, use it
      if (environment.metaDescription) {
        try {
          strategyData = JSON.parse(environment.metaDescription);
        } catch (e) {
          console.error("Error parsing environment metaDescription:", e);
        }
      }
      
      setStrategyConfig(JSON.stringify(strategyData, null, 2));
    } catch (error) {
      console.error("Error loading environment strategy:", error);
    } finally {
      setLoadingStrategyFile(false);
    }
  };

  // Get the current graph data based on selected strategy
  const getCurrentGraph = () => {
    return dataModels[selectedStrategy === 'DistributedCollections' ? 'distributed' : 'single'] || { nodes: [], edges: [] };
  };

  return (
    <div className="grid grid-cols-2 gap-6">
      <div className="bg-slate-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-slate-200 mb-4">Select Strategy</h3>
        {strategies.map(strategy => (
          <div 
            key={strategy.id} 
            className={`p-4 mb-4 flex justify-between items-center cursor-pointer rounded-lg ${
              selectedStrategy === strategy.id 
                ? 'bg-blue-900/30 border border-blue-500' 
                : 'bg-slate-700 hover:bg-slate-600'
            }`}
            onClick={() => {
              setSelectedStrategy(strategy.id);
              setShowFlowChart(false);
            }}
          >
            <div>
              <h4 className="text-md font-medium text-slate-200">{strategy.title}</h4>
              <p className="text-sm text-slate-400">{strategy.description}</p>
            </div>
            <button 
              className="p-2 bg-slate-600 rounded-full hover:bg-slate-500"
              onClick={(e) => {
                e.stopPropagation();
                setShowFlowChart(true);
                setSelectedStrategy(strategy.id);
              }}
            >
              <Eye className="w-5 h-5 text-slate-300" />
            </button>
          </div>
        ))}

        <CollapsibleSection
          title="Environment Selection"
          isExpanded={false}
          onToggle={() => {}}
        >
          <div className="space-y-3">
            <p className="text-sm text-slate-400">
              Choose an environment to load its strategy configuration:
            </p>
            <div className="grid grid-cols-1 gap-2 max-h-[200px] overflow-y-auto">
              {metadata.environments.map(env => (
                <div 
                  key={env._id} 
                  className={`p-3 rounded-md cursor-pointer flex items-center ${
                    selectedEnvironment?._id === env._id
                      ? 'bg-blue-900/30 border border-blue-500'
                      : 'bg-slate-700 border border-slate-600 hover:border-slate-500'
                  }`}
                  onClick={() => loadEnvironmentStrategy(env)}
                >
                  <Database size={16} className="text-blue-400 mr-2" />
                  <div>
                    <h4 className="font-medium text-slate-200">{env.name}</h4>
                    {env.description && (
                      <p className="text-xs text-slate-400">{env.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CollapsibleSection>
      </div>

      <div className="bg-slate-800 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-slate-200 mb-4">
          {showFlowChart ? 'Data Model Visualization' : 'Strategy Configuration'}
        </h3>
        
        {showFlowChart ? (
          <div className="h-96 bg-slate-800 rounded-lg overflow-hidden">
            {selectedStrategy && (
              <ReactFlow
                nodes={getCurrentGraph().nodes}
                edges={getCurrentGraph().edges}
                nodeTypes={nodeTypes}
                fitView
              >
                <Background />
                <Controls />
              </ReactFlow>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="atlas-search"
                className="mr-2"
                checked={selectedQuery?.conversionStrategy?.settings?.useAtlasSearch || false}
                onChange={() => {
                  if (selectedQuery) {
                    // This is just updating the UI state, actual changes to the query object
                    // would be handled by the parent component via a callback
                    const useAtlasSearch = !selectedQuery.conversionStrategy?.settings?.useAtlasSearch;
                    console.log("Atlas Search toggled:", useAtlasSearch);
                  }
                }}
              />
              <label htmlFor="atlas-search" className="text-slate-300">Use Atlas Search</label>
            </div>

            <div>
              <h4 className="text-md font-medium text-slate-200 mb-2">Database Strategy Configuration</h4>
              {loadingStrategyFile ? (
                <div className="flex items-center justify-center py-8 text-slate-400">
                  <RefreshCw size={20} className="animate-spin mr-2" />
                  Loading configuration...
                </div>
              ) : (
                <JSONEditor
                  initialValue={strategyConfig}
                  onChange={(value) => setStrategyConfig(value)}
                  height="300px"
                />
              )}
              <div className="mt-2 text-xs text-slate-400">
                This configuration defines how openEHR data is mapped to MongoDB collections and how indexes are applied.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StrategyConfigTab;