"use client";

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { AlignLeft, ChevronRight, ChevronDown, Database, Info, X } from 'lucide-react';
import TreeView from '../../common/TreeView';
import CollapsibleSection from '../../common/CollapsibleSection';

// OpenEHR hierarchy levels - ordered from top to bottom
const HIERARCHY_LEVELS = [
  "EHR",
  "COMPOSITION",
  "SECTION",
  // all "ENTRY" types grouped at one level
  ["OBSERVATION", "EVALUATION", "INSTRUCTION", "ACTION", "ADMIN_ENTRY"],
  "CLUSTER"
];

// Check if node is at the same hierarchy level as another node
const areSameLevel = (type1, type2) => {
  if (!type1 || !type2) return false;

  const t1 = type1.toUpperCase();
  const t2 = type2.toUpperCase();

  // Check if they're exactly the same
  if (t1 === t2) return true;

  // Check if they're both in a group (like ENTRY types)
  for (const level of HIERARCHY_LEVELS) {
    if (Array.isArray(level)) {
      if (level.includes(t1) && level.includes(t2)) return true;
    }
  }

  return false;
};

const FromBuilder = ({
  templates,
  activeTemplates,
  contains,
  onAddContainsNode,
  onRemoveContainsNode,
  onUpdateContainsAlias,
  updateLogicalOperator,
  addEhrRoot,
  removeEhrRoot,
  updateEhrId,
  isExpanded,
  onToggleExpand,
  buildNodePath,
  isVariableValid
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [ehrFilterType, setEhrFilterType] = useState("specific"); // "specific" or "population"
  const [ehrIdValue, setEhrIdValue] = useState("$ehrUid");        // Default parameter
  const [showContainmentRules, setShowContainmentRules] = useState(false);
  const [sectionExpanded, setSectionExpanded] = useState(true);

  useEffect(() => {
    // Sync local state with prop
    setSectionExpanded(isExpanded);

    // Initialize EHR root if needed
    const hasEhrRoot = contains.some(item => item.isEhrRoot);
    if (!hasEhrRoot) {
      addEhrRoot(ehrFilterType, ehrIdValue);
    }

    // Check for existing EHR and set the filter type accordingly
    const ehrNode = contains.find(item => item.isEhrRoot);
    if (ehrNode) {
      const isPopulation = !ehrNode.ehrIdValue || ehrNode.ehrIdValue.trim() === "";
      setEhrFilterType(isPopulation ? "population" : "specific");
      if (!isPopulation) {
        setEhrIdValue(ehrNode.ehrIdValue || "$ehrUid");
      }
    }
  }, []);

  // 1) Filter logic for searching the template tree
  const filterTree = (node, term) => {
    if (!term) return node;
    const nodeName = node.name?.toLowerCase() || "";
    const localizedName = node.localizedName?.toLowerCase() || "";
    const nodeId = node.nodeId?.toLowerCase() || "";
    const rmType = node.rmType?.toLowerCase() || "";
    const search = term.toLowerCase();

    const isMatch =
      nodeName.includes(search) ||
      localizedName.includes(search) ||
      nodeId.includes(search) ||
      rmType.includes(search);

    if (!node.children || node.children.length === 0) {
      return isMatch ? node : null;
    }
    const filteredChildren = node.children
      .map((child) => filterTree(child, term))
      .filter(Boolean);
    if (isMatch || filteredChildren.length > 0) {
      return { ...node, children: filteredChildren };
    }
    return null;
  };

  // 2) Build a memo of filtered templates
  const filteredTrees = useMemo(() => {
    const result = {};
    activeTemplates.forEach((templateName) => {
      const templateData = templates[templateName];
      if (templateData && templateData.tree) {
        const filtered = filterTree(templateData.tree, searchTerm);
        if (filtered) result[templateName] = filtered;
      }
    });
    return result;
  }, [activeTemplates, templates, searchTerm]);

  // 3) Determine if a node can be used in CONTAINS
  const isContainableNode = (node) => {
    if (!node || !node.rmType) return false;
    const containableTypes = [
      'COMPOSITION', 'SECTION', 'OBSERVATION',
      'EVALUATION', 'INSTRUCTION', 'ACTION', 'ADMIN_ENTRY',
      'CLUSTER'
    ];
    const nodeType = node.rmType.toUpperCase();

    // Direct or partial match
    if (containableTypes.includes(nodeType)) return true;
    if (containableTypes.some(t => nodeType.includes(t))) return true;

    return false;
  };

  // 5) Suggest a short alias name based on the rmType
  const suggestVariableName = (rmType, existingVars) => {
    const abbrMap = {
      EHR: 'e',
      COMPOSITION: 'c',
      SECTION: 's',
      OBSERVATION: 'o',
      EVALUATION: 'ev',
      INSTRUCTION: 'i',
      ACTION: 'a',
      ADMIN_ENTRY: 'ad',
      CLUSTER: 'clu'
    };
    const base = abbrMap[rmType] || rmType.substring(0, 3).toLowerCase();

    if (!existingVars.includes(base)) {
      return base;
    }
    // If base is taken, add a number
    let counter = 1;
    let suggestion;
    do {
      suggestion = `${base}${counter}`;
      counter++;
    } while (existingVars.includes(suggestion));
    return suggestion;
  };

  // 6) Collect existing aliases for duplication checks
  const existingVariables = useMemo(
    () => contains.map(item => item.alias).filter(Boolean),
    [contains]
  );

  // 7) Build a hierarchical tree from `contains` (so we can display a nested UI)
  const containmentHierarchy = useMemo(() => {
    // root nodes = items with isRoot or no parentIndex, except EHR root which we handle separately
    console.log('Contains:', contains);
    const rootNodes = contains.filter(
      item => (item.isRoot || item.parentIndex === null || item.parentIndex === undefined) && !item.isEhrRoot
    );

    console.log('Root Nodes:', rootNodes);

    const processedIndices = new Set();

    const buildTree = (item, index) => {
      processedIndices.add(index);
      const children = contains.filter(
        c => c.parentIndex === index && !processedIndices.has(contains.indexOf(c))
      );
      const childNodes = children.map(child => {
        const childIndex = contains.indexOf(child);
        return buildTree(child, childIndex);
      });
      return { ...item, index, children: childNodes };
    };

    // Add EHR root node as the topmost parent if it exists
    const ehrRoot = contains.find(item => item.isEhrRoot);
    if (ehrRoot) {
      const ehrIndex = contains.indexOf(ehrRoot);
      const ehrNode = buildTree(ehrRoot, ehrIndex);
      return [ehrNode];
    }

    // Otherwise just return the regular root nodes
    return rootNodes.map(node => {
      const idx = contains.indexOf(node);
      return buildTree(node, idx);
    });
  }, [contains]);

  const handleToggleExpand = useCallback(() => {
    const newExpandedState = !sectionExpanded;
    setSectionExpanded(newExpandedState);
    if (onToggleExpand) {
      onToggleExpand();
    }
  }, [sectionExpanded, onToggleExpand]);


  // 8) A small component that displays each containment node + children
  const ContainmentNode = ({ node, level = 0, siblingIndex = 0, totalSiblings = 1 }) => {
    const [expanded, setExpanded] = useState(true);
    const hasChildren = node.children && node.children.length > 0;

    // For handling alias input focus
    const inputRef = useRef(null);
    const [cursorPosition, setCursorPosition] = useState(null);

    // If this node is preceded by siblings, we need to determine if it needs a logical operator
    const needsLogicalOperator = siblingIndex > 0 && level > 0;

    // Get sibling nodes at same level
    const siblings = node.parentIndex !== null && node.parentIndex !== undefined ?
      contains.filter(item => item.parentIndex === node.parentIndex) :
      contains.filter(item => item.isRoot || item.parentIndex === null || item.parentIndex === undefined);

    // Determine if this node and its previous sibling are at the same hierarchy level
    const hasSameLevelSibling = siblings.length > 1 && siblingIndex > 0 && siblings[siblingIndex - 1] &&
      areSameLevel(node.node.rmType, siblings[siblingIndex - 1]?.node.rmType);

    // Basic validation for variable name
    const isValidAlias =
      node.alias && isVariableValid ? isVariableValid(node.alias) :
        node.alias && /^[a-zA-Z][a-zA-Z0-9_]*$/.test(node.alias);

    const isDuplicateAlias =
      node.alias && existingVariables.filter(v => v === node.alias).length > 1;

    // If user types in the alias, preserve cursor
    useEffect(() => {
      if (inputRef.current && cursorPosition !== null) {
        inputRef.current.focus();
        inputRef.current.setSelectionRange(cursorPosition, cursorPosition);
        setCursorPosition(null);
      }
    }, [node.alias, cursorPosition]);

    const handleAliasChange = (e) => {
      setCursorPosition(e.target.selectionStart);
      onUpdateContainsAlias(node.index, e.target.value);
    };

    // Determine border color based on node type
    const getBorderColorClass = () => {
      const rmType = node.node.rmType?.toUpperCase();
      if (rmType === 'EHR') return 'border-blue-500';
      if (rmType === 'COMPOSITION') return 'border-green-500';
      if (rmType === 'SECTION') return 'border-yellow-500';
      if (['OBSERVATION', 'EVALUATION', 'INSTRUCTION', 'ACTION', 'ADMIN_ENTRY'].includes(rmType))
        return 'border-purple-500';
      if (rmType === 'CLUSTER') return 'border-red-500';
      return 'border-slate-500';
    };

    // Get a more user-friendly name for the hierarchy level
    const getHierarchyLevelName = () => {
      const rmType = node.node.rmType?.toUpperCase();
      if (rmType === 'EHR') return 'EHR';
      if (rmType === 'COMPOSITION') return 'Composition';
      if (rmType === 'SECTION') return 'Section';
      if (['OBSERVATION', 'EVALUATION', 'INSTRUCTION', 'ACTION', 'ADMIN_ENTRY'].includes(rmType))
        return 'Entry';
      if (rmType === 'CLUSTER') return 'Cluster';
      if (rmType === 'ELEMENT') return 'Element';
      return rmType;
    };

    // Handle operator change
    const handleOperatorChange = (e) => {
      updateLogicalOperator && updateLogicalOperator(node.index, e.target.value);
    };

    // Don't show the EHR node in the hierarchy display, but render its children
    if (node.isEhrRoot) {
      return (
        <div className="mb-2">
          <div className="flex items-center gap-2 bg-blue-900/30 p-3 rounded-lg border-l-2 border-blue-500">
            <div className="text-slate-300 p-1 rounded">
              {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </div>
            <div className="flex-1">
              <div className="flex items-center">
                <span className="text-xs bg-blue-800 text-blue-200 px-2 py-1 rounded mr-2">EHR</span>
                <span className="text-sm text-blue-300">{node.alias || 'e'}</span>
                {node.ehrIdValue && (
                  <span className="ml-2 text-xs text-slate-400">[ehr_id/value={node.ehrIdValue}]</span>
                )}
              </div>
            </div>
          </div>

          {expanded && node.children && node.children.length > 0 && (
            <div className="ml-6 mt-2 space-y-2">
              {node.children.map((child, idx) => (
                <ContainmentNode
                  key={child.index}
                  node={child}
                  level={1}
                  siblingIndex={idx}
                  totalSiblings={node.children.length}
                />
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className={`mb-2 ${level > 0 ? 'ml-6' : ''}`}>
        {/* Logical operator between siblings at same level */}
        {needsLogicalOperator && hasSameLevelSibling && (
          <div className="flex items-center justify-center py-1 -mb-2">
            <select
              value={node.logicalOperator || 'AND'}
              onChange={handleOperatorChange}
              className="bg-slate-700 text-xs text-slate-300 rounded-md border border-slate-500 focus:border-blue-500 px-2 py-1"
            >
              <option value="AND">AND</option>
              <option value="OR">OR</option>
            </select>
          </div>
        )}

        <div
          className={`flex items-center gap-2 bg-slate-700 p-3 rounded-lg ${level > 0 ? `border-l-2 ${getBorderColorClass()}` : ''} hover:bg-slate-600 cursor-pointer`}
          onClick={() => setExpanded(!expanded)}
        >
          {/* Expand/collapse if has children */}
          {hasChildren && (
            <div className="text-slate-300 p-1 rounded">
              {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </div>
          )}

          {/* Show CONTAINS for child nodes */}
          {level > 0 && !hasSameLevelSibling && (
            <div className="text-xs text-slate-400 px-2 py-1 bg-slate-600 rounded-md">
              CONTAINS
            </div>
          )}

          {/* Node info */}
          <div className="flex-1 text-slate-300">
            <div className="flex flex-col">
              <div className="flex items-center">
                <span className="text-xs bg-slate-600 text-slate-300 px-1 rounded mr-1">
                  {getHierarchyLevelName()}
                </span>
                <span className="text-sm">{node.node.name || node.template}</span>
              </div>
              <div className="text-xs text-slate-400 mt-1 truncate" title={node.node.nodeId || ''}>
                {node.node.nodeId || '(No ID)'}
              </div>
            </div>
          </div>

          {/* Alias input */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <input
              ref={inputRef}
              type="text"
              placeholder="(Optional alias)"
              value={node.alias || ''}
              onChange={handleAliasChange}
              className={[
                "w-32 px-3 py-1 rounded-md border focus:outline-none bg-slate-600 text-slate-300",
                !node.alias
                  ? "border-slate-500 focus:border-blue-500"
                  : !isValidAlias
                    ? "bg-red-900/50 text-red-300 border-red-700 focus:border-red-500"
                    : isDuplicateAlias
                      ? "bg-yellow-900/50 text-yellow-300 border-yellow-700 focus:border-yellow-500"
                      : "border-slate-500 focus:border-blue-500"
              ].join(" ")}
              title={
                !node.alias
                  ? "Optional: Enter a variable name if needed for referencing"
                  : !isValidAlias
                    ? "Variable must start with a letter and contain only letters, numbers, and underscores"
                    : isDuplicateAlias
                      ? "Variable name must be unique"
                      : "Variable is valid"
              }
            />
            {/* Inline error messages */}
            {!isValidAlias && node.alias && (
              <div className="absolute text-xs text-red-300 mt-1">
                Invalid variable
              </div>
            )}
            {isDuplicateAlias && isValidAlias && (
              <div className="absolute text-xs text-yellow-300 mt-1">
                Duplicate variable
              </div>
            )}
          </div>

          {/* Remove button only */}
          <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => onRemoveContainsNode(node.index)}
              className="p-1 text-slate-400 hover:text-red-400 hover:bg-slate-600 rounded"
              title="Remove node"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Suggest a variable name if empty */}
        {!node.alias && (
          <div className="ml-7 mt-1">
            <button
              className="text-xs text-blue-400 hover:text-blue-300"
              onClick={(e) => {
                e.stopPropagation();
                const suggestion = suggestVariableName(node.node.rmType, existingVariables);
                onUpdateContainsAlias(node.index, suggestion);
              }}
            >
              Suggest variable name
            </button>
          </div>
        )}

        {/* Child nodes if expanded */}
        {expanded && hasChildren && (
          <div className="mt-2">
            {node.children.map((child, idx) => (
              <ContainmentNode
                key={child.index}
                node={child}
                level={level + 1}
                siblingIndex={idx}
                totalSiblings={node.children.length}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  // 9) Check if we have an EHR root item
  const hasEhrRoot = contains.some(item => item.isEhrRoot);

  // Handle adding a new node directly
  const handleAddNode = (templateName, node) => {
    const ehrNodeIndex = contains.findIndex(item => item.isEhrRoot);
    if (ehrNodeIndex === -1) {
      console.warn("No EHR root found");
      return;
    }
    onAddContainsNode(templateName, node, ehrNodeIndex, 'simple');
  };

  return (
    <CollapsibleSection
      title="FROM / CONTAINS Builder"
      isExpanded={sectionExpanded}
      onToggle={handleToggleExpand}
    >
      {sectionExpanded && (
        <div className="space-y-6">
          {/* EHR Configuration */}
          <div className="bg-slate-800 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Database size={16} className="text-blue-400" />
                <span className="text-sm font-medium text-slate-300">EHR Configuration</span>
              </div>
            </div>

            {/* EHR Type (specific vs. population) */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <span className="text-slate-400 w-32">Query Type:</span>
                <div className="flex gap-2">
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="ehrType"
                      checked={ehrFilterType === "specific"}
                      onChange={() => {
                        setEhrFilterType("specific");
                        addEhrRoot("specific", ehrIdValue);
                      }}
                      className="accent-blue-500"
                    />
                    <span className="text-slate-300">Specific EHR</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer">
                    <input
                      type="radio"
                      name="ehrType"
                      checked={ehrFilterType === "population"}
                      onChange={() => {
                        setEhrFilterType("population");
                        addEhrRoot("population", "");
                      }}
                      className="accent-blue-500"
                    />
                    <span className="text-slate-300">Population Query</span>
                  </label>
                </div>
              </div>

              {/* EHR ID field if "specific" */}
              {ehrFilterType === "specific" && (
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-slate-400 w-32">EHR ID:</span>
                  <input
                    type="text"
                    value={ehrIdValue}
                    onChange={(e) => {
                      setEhrIdValue(e.target.value);
                      updateEhrId(e.target.value);
                    }}
                    placeholder="Enter EHR ID or parameter (e.g. $ehrUid)"
                    className="w-full px-3 py-1 rounded-md bg-slate-700 text-slate-300 border border-slate-600 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Hierarchy Rules */}
          <div className="bg-slate-800 p-4 rounded-lg">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 justify-between">
                <div className="flex items-center gap-2">
                  <AlignLeft size={16} className="text-blue-400" />
                  <span className="text-sm font-medium text-slate-300">Hierarchy Explorer</span>
                </div>
                <button
                  onClick={() => setShowContainmentRules(!showContainmentRules)}
                  className="text-xs px-2 py-1 rounded bg-blue-600/30 text-blue-300 hover:bg-blue-600/50 flex items-center gap-1"
                >
                  <Info size={12} />
                  {showContainmentRules ? "Hide Hierarchy Rules" : "Show Hierarchy Rules"}
                </button>
              </div>

              {showContainmentRules && (
                <div className="bg-slate-700/50 p-3 rounded-md text-xs text-slate-300 mt-1">
                  <h5 className="font-medium mb-1">OpenEHR Hierarchy:</h5>
                  <div className="space-y-1 text-slate-400">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span>EHR</span>
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span>COMPOSITION</span>
                    </div>
                    <div className="flex items-center gap-2 ml-6">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span>SECTION (optional)</span>
                    </div>
                    <div className="flex items-center gap-2 ml-9">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      <span>ENTRY (OBSERVATION, EVALUATION, INSTRUCTION, ACTION, ADMIN_ENTRY)</span>
                    </div>
                    <div className="flex items-center gap-2 ml-12">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span>CLUSTER / ELEMENT</span>
                    </div>
                  </div>
                  <div className="mt-2 text-slate-400">
                    <span className="text-blue-300">Note:</span> The system automatically determines correct relationships:
                    <ul className="mt-1 ml-3">
                      <li>• Different levels: CONTAINS relationship (parent/child)</li>
                      <li>• Same level: AND/OR relationship (logical combination)</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search archetypes by name, id, or type..."
              className="w-full px-3 py-2 rounded-md bg-slate-800 text-slate-200 border border-slate-600 focus:border-blue-500 focus:outline-none pl-10"
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg
                className="w-4 h-4 text-slate-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Quick Access Buttons */}
          <div className="flex flex-wrap gap-2">
            {['COMPOSITION', 'OBSERVATION', 'EVALUATION', 'INSTRUCTION', 'ACTION', 'ADMIN_ENTRY', 'CLUSTER'].map(type => (
              <button
                key={type}
                onClick={() => setSearchTerm(type)}
                className="px-2 py-1 bg-slate-700 text-xs text-slate-300 rounded-md hover:bg-slate-600"
              >
                {type}
              </button>
            ))}
          </div>

          {/* Template Trees */}
          <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
            {activeTemplates.map((templateName) => {
              const filteredRoot = filteredTrees[templateName];
              if (!templates[templateName] || !filteredRoot) return null;

              return (
                <div
                  key={templateName}
                  className="bg-slate-900 rounded-lg p-4 max-h-80 overflow-y-auto"
                >
                  <h3 className="text-lg font-medium text-slate-300 mb-4 sticky top-0 bg-slate-900 py-2">
                    {templateName}
                  </h3>
                  <TreeView
                    node={filteredRoot}
                    onSelect={(node) => {
                      // Simply add the node - let the hook figure out the proper parent 
                      handleAddNode(templateName, node);
                    }}
                    isSelectable={isContainableNode}
                    purpose="CONTAINS"
                    defaultExpanded={!!searchTerm}
                    disabledTooltip="This node cannot be used in CONTAINS clause"
                  />
                </div>
              );
            })}
          </div>

          {/* Containment Hierarchy */}
          <div className="mt-6">
            <h3 className="text-md font-medium text-slate-300 mb-4 flex items-center gap-2">
              <div className="flex items-center gap-2">
                <AlignLeft size={16} className="text-green-400" />
                <span>Containment Hierarchy</span>
              </div>
              <span className="text-xs text-slate-400 font-normal">
                (Variables are only required if referenced elsewhere)
              </span>
            </h3>

            {containmentHierarchy.length > 0 ? (
              <div className="space-y-3">
                {containmentHierarchy.map((rootNode, index) => (
                  <ContainmentNode
                    key={rootNode.index}
                    node={rootNode}
                    siblingIndex={index}
                    totalSiblings={containmentHierarchy.length}
                  />
                ))}
              </div>
            ) : (
              <div className="text-sm text-slate-400 p-3 bg-slate-800 rounded-lg">
                <div className="mb-2">Start by adding archetype nodes from the template tree above:</div>
                <ol className="list-decimal ml-5 space-y-1">
                  <li>Add a Composition first from the template tree</li>
                  <li>Click any node in the template tree to add it to the hierarchy</li>
                  <li>The system automatically organizes the nodes in proper hierarchy</li>
                  <li>Use the AND/OR drop-downs to control logical relationships at the same level</li>
                </ol>
              </div>
            )}
          </div>
        </div>
      )}
    </CollapsibleSection>
  );
};

FromBuilder.propTypes = {
  templates: PropTypes.objectOf(PropTypes.shape({
    tree: PropTypes.shape({
      name: PropTypes.string,
      rmType: PropTypes.string,
      children: PropTypes.array
    })
  })).isRequired,
  activeTemplates: PropTypes.arrayOf(PropTypes.string).isRequired,
  contains: PropTypes.arrayOf(PropTypes.shape({
    template: PropTypes.string.isRequired,
    node: PropTypes.shape({
      name: PropTypes.string,
      rmType: PropTypes.string,
      nodeId: PropTypes.string,
      aqlPath: PropTypes.string
    }).isRequired,
    alias: PropTypes.string,
    parentIndex: PropTypes.number,
    isRoot: PropTypes.bool,
    containmentOperator: PropTypes.string,
    logicalOperator: PropTypes.string
  })).isRequired,
  onAddContainsNode: PropTypes.func.isRequired,
  onRemoveContainsNode: PropTypes.func.isRequired,
  onUpdateContainsAlias: PropTypes.func.isRequired,
  updateLogicalOperator: PropTypes.func,
  addEhrRoot: PropTypes.func.isRequired,
  removeEhrRoot: PropTypes.func.isRequired,
  updateEhrId: PropTypes.func.isRequired,
  isExpanded: PropTypes.bool.isRequired,
  onToggleExpand: PropTypes.func.isRequired,
  buildNodePath: PropTypes.func,
  isVariableValid: PropTypes.func
};

export default FromBuilder;