// FromContainsBlock.jsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Database, ChevronDown, ChevronUp } from 'lucide-react';

const FromContainsBlock = ({
  activeTemplates,
  addFromTemplate,
  removeFromTemplate,
  addContains,
  removeContains,
  updateContains,
  availableRMTypes,
  queryState,
  setQueryState
}) => {
  const [selectedTemplateAlias, setSelectedTemplateAlias] = useState({});
  const [availableNodes, setAvailableNodes] = useState({});
  const [expanded, setExpanded] = useState(true);
  const [ehrType, setEhrType] = useState("specific"); // "specific" or "population"
  const [ehrId, setEhrId] = useState("$ehrUid");

  // Function to fetch the template tree nodes and setAvailableNodes
  const fetchTemplateNodes = useCallback(async (templateName) => {
    try {
      const response = await fetch('/api/internal/templates');
      if (response.ok) {
        const data = await response.json();
        const template = data.find(t => t.name === templateName);
        if (template && template.webTemplate && template.webTemplate.tree) {
          setAvailableNodes(prev => ({ ...prev, [templateName]: template.webTemplate.tree }));
        } else {
          console.error(`Template tree not found for ${templateName}`);
        }
      }
    } catch (error) {
      console.error("Error fetching template nodes:", error);
    }
  }, []);

  useEffect(() => {
    activeTemplates.forEach(templateName => {
      if (!availableNodes[templateName]) {
        fetchTemplateNodes(templateName);
      }
    });
  }, [activeTemplates, fetchTemplateNodes, availableNodes]);

  // Check if we have an EHR node in the query state
  const hasEhrRoot = queryState.contains.some(item => item.isEhrRoot);

  // Function to add EHR root to the query
  const handleEhrSetup = () => {
    // Check if there's already an EHR root
    if (hasEhrRoot) {
      // Update existing EHR root
      const ehrRoot = queryState.contains.find(item => item.isEhrRoot);
      const ehrIndex = queryState.contains.indexOf(ehrRoot);
      
      setQueryState(prev => ({
        ...prev,
        ehrFilterType: ehrType,
        contains: prev.contains.map((item, index) => 
          index === ehrIndex ? { ...item, ehrIdValue: ehrType === "specific" ? ehrId : "" } : item
        )
      }));
    } else {
      // Add new EHR root
      setQueryState(prev => ({
        ...prev,
        ehrFilterType: ehrType,
        contains: [
          ...prev.contains,
          {
            template: "EHR",
            node: {
              name: "EHR",
              rmType: "EHR",
              nodeId: "",
              aqlPath: ""
            },
            alias: "e",
            isRoot: true,
            isEhrRoot: true,
            ehrIdValue: ehrType === "specific" ? ehrId : ""
          }
        ]
      }));
    }
  };

  // When component mounts, ensure we have an EHR root
  useEffect(() => {
    if (!hasEhrRoot && activeTemplates.length > 0) {
      handleEhrSetup();
    }
  }, [activeTemplates.length]);

  const handleAddRoot = (templateName) => {
    // Get the template node
    const node = availableNodes[templateName];
    if (!node) return;

    // Find the EHR root index to use as parent
    const ehrRootIndex = queryState.contains.findIndex(item => item.isEhrRoot);
    if (ehrRootIndex === -1) {
      console.error("No EHR root found");
      return;
    }

    // Add a COMPOSITION node as a child of the EHR root
    setQueryState(prev => {
      // Create a composition node
      const compositionNode = {
        template: templateName,
        node: {
          ...node,
          name: templateName,
          rmType: "COMPOSITION",
          nodeId: node.nodeId || templateName,
          aqlPath: ""
        },
        alias: "c",
        parentIndex: ehrRootIndex,
        isRoot: false,
        containmentOperator: "CONTAINS"
      };

      return {
        ...prev,
        contains: [...prev.contains, compositionNode]
      };
    });
  };

  const handleAliasChange = (templateName, alias) => {
    setSelectedTemplateAlias(prev => ({ ...prev, [templateName]: alias }));
  };

  return (
    <div className="space-y-4 bg-slate-800 p-4 rounded-lg">
      <div className="flex justify-between items-center">
        <h3 className="text-slate-300 font-medium flex items-center gap-2">
          <Database size={16} className="text-blue-400" />
          <span>EHR Configuration</span>
        </h3>
        <button 
          onClick={() => setExpanded(!expanded)}
          className="text-slate-400 hover:text-slate-200"
        >
          {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>
      </div>

      {expanded && (
        <div className="space-y-4">
          {/* EHR Configuration */}
          <div className="bg-slate-700 p-4 rounded-md">
            <div className="flex flex-col space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <span className="text-slate-400 w-32">Query Type:</span>
                <div className="flex gap-3">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="ehrType"
                      checked={ehrType === "specific"}
                      onChange={() => setEhrType("specific")}
                      className="accent-blue-500"
                    />
                    <span className="text-slate-300">Specific EHR</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="ehrType"
                      checked={ehrType === "population"}
                      onChange={() => setEhrType("population")}
                      className="accent-blue-500"
                    />
                    <span className="text-slate-300">Population Query</span>
                  </label>
                </div>
              </div>

              {ehrType === "specific" && (
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-slate-400 w-32">EHR ID:</span>
                  <input
                    type="text"
                    value={ehrId}
                    onChange={(e) => setEhrId(e.target.value)}
                    placeholder="Enter EHR ID or parameter (e.g. $ehrUid)"
                    className="w-full px-3 py-2 rounded-md bg-slate-600 text-slate-300 border border-slate-500"
                  />
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={handleEhrSetup}
                  className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Apply EHR Configuration
                </button>
              </div>
            </div>
          </div>

          {/* Active Templates */}
          <div className="space-y-4">
            {activeTemplates.map(templateName => (
              <div key={templateName} className="bg-slate-700 p-4 rounded-md">
                <h3 className="text-slate-300 font-medium mb-2">Template: {templateName}</h3>

                <button
                  onClick={() => handleAddRoot(templateName)}
                  className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-1"
                  disabled={!availableNodes[templateName]}
                >
                  <Plus size={16} /> Add as Root Composition
                </button>
              </div>
            ))}
          </div>

          {/* Containment Hierarchy Display */}
          <div className="bg-slate-700 p-4 rounded-md">
            <h3 className="text-slate-300 font-medium mb-2">Containment Hierarchy</h3>
            
            {queryState.contains.length > 0 ? (
              <div className="space-y-2">
                {queryState.contains.map((item, index) => (
                  <div key={index} className={`p-2 rounded ${item.isEhrRoot ? 'bg-blue-900/30' : 'bg-slate-600'} ${item.parentIndex !== undefined && item.parentIndex !== null ? 'ml-4' : ''}`}>
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="text-xs bg-slate-500 px-1 rounded mr-1">
                          {item.node.rmType}
                        </span>
                        <span className="text-slate-300">{item.template}</span>
                        {item.alias && (
                          <span className="text-blue-400 ml-2">as {item.alias}</span>
                        )}
                      </div>
                      <div>
                        {!item.isEhrRoot && (
                          <button
                            onClick={() => removeContains(item.template, item.node.nodeId)}
                            className="text-red-400 hover:text-red-300 text-xs"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-slate-400 text-sm">
                No containment hierarchy defined yet. Add a root composition to start.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FromContainsBlock;