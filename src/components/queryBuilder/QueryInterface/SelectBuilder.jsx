"use client";

import React, { useState, useMemo } from 'react';
import { X, Plus, Filter, FunctionSquare, AlignLeft } from 'lucide-react';
import PropTypes from 'prop-types';
import TreeView from '../../common/TreeView';
import CollapsibleSection from '../../common/CollapsibleSection';

const SelectBuilder = ({
  templates,
  activeTemplates,
  queryParts,
  onAddNode,
  onRemoveNode,
  onUpdateAlias,
  isExpanded,
  onToggleExpand,
  buildNodePath,
  containmentVariables,
  useDistinct,
  setUseDistinct,
  onAddFunction,
  onAddLiteral,
  functions
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState("paths"); // "paths", "functions", "literals"
  const [functionType, setFunctionType] = useState(""); // Empty or one of the function types
  const [functionArgument, setFunctionArgument] = useState("");
  const [literalType, setLiteralType] = useState("string"); // "string", "number", "boolean", "datetime"
  const [literalValue, setLiteralValue] = useState("");

  const filterTree = (node, term) => {
    if (!term) {
      // If no search term, show the entire tree
      return node;
    }

    // Check if this node's name or localizedName contains the search term
    const nodeName = node.name?.toLowerCase() || "";
    const localizedName = node.localizedName?.toLowerCase() || "";
    const nodeId = node.nodeId?.toLowerCase() || "";
    const rmType = node.rmType?.toLowerCase() || "";
    const search = term.toLowerCase();

    // Check multiple properties for matches
    const isMatch =
      nodeName.includes(search) ||
      localizedName.includes(search) ||
      nodeId.includes(search) ||
      rmType.includes(search);

    // If no children, return this node only if it matches
    if (!node.children || node.children.length === 0) {
      return isMatch ? node : null;
    }

    // Otherwise, filter the children
    const filteredChildren = node.children
      .map((child) => filterTree(child, term))
      .filter(Boolean); // remove nulls

    // If this node is a match or if any children matched, keep this node
    if (isMatch || filteredChildren.length > 0) {
      return {
        ...node,
        children: filteredChildren,
      };
    }

    // Otherwise, no match
    return null;
  };

  const isSelectableNode = (node) => {
    if (!node || !node.rmType) return false;

    // All possible data types that can be selected
    const dataTypes = [
      'DV_TEXT', 'DV_CODED_TEXT', 'DV_QUANTITY', 'DV_COUNT',
      'DV_DATE_TIME', 'DV_BOOLEAN', 'DV_IDENTIFIER', 'DV_ORDINAL',
      'DV_URI', 'DV_MULTIMEDIA', 'DV_PARSABLE', 'DV_DURATION',
      'DV_PROPORTION', 'DV_INTERVAL', 'DV_STATE'
    ];

    // Container types that might be selected in some contexts
    const containerTypes = [
      'COMPOSITION', 'EVALUATION', 'SECTION',
      'OBSERVATION', 'INSTRUCTION', 'ACTION', 'ADMIN_ENTRY',
      'CLUSTER'
    ];

    // Check if node type is in our lists (case insensitive)
    const nodeType = node.rmType.toUpperCase();

    // Direct match for data types
    if (dataTypes.includes(nodeType)) return true;

    // Direct match for container types
    if (containerTypes.includes(nodeType)) return true;

    // Partial match for container types (e.g., OBSERVATION_set)
    if (containerTypes.some(type => nodeType.includes(type))) return true;

    // Special cases:
    // 1. Node has no children (likely a leaf node)
    if (!node.children || node.children.length === 0) return true;

    // 2. Node has at0001-style nodeId (typically elements)
    if (node.nodeId && node.nodeId.match(/^at\d+/)) return true;

    // Otherwise, not selectable
    return false;
  };

  // For each active template, build the filtered tree once (useMemo to avoid unnecessary re-renders)
  const filteredTrees = useMemo(() => {
    const result = {};
    activeTemplates.forEach((templateName) => {
      const templateData = templates[templateName];
      if (templateData && templateData.tree) {
        const filtered = filterTree(templateData.tree, searchTerm);
        // If the root was filtered out completely, `filtered` can be null
        if (filtered) {
          result[templateName] = filtered;
        }
      }
    });
    return result;
  }, [activeTemplates, templates, searchTerm]);

  // Group query parts by type for organized display
  const groupedQueryParts = useMemo(() => {
    const groups = {
      paths: [],
      functions: [],
      variables: [],
      literals: []
    };

    queryParts.forEach((item, index) => {
      if (item.type === 'function') {
        groups.functions.push({ ...item, index });
      } else if (item.type === 'variable') {
        groups.variables.push({ ...item, index });
      } else if (item.type === 'literal') {
        groups.literals.push({ ...item, index });
      } else {
        // Default to path
        groups.paths.push({ ...item, index });
      }
    });

    return groups;
  }, [queryParts]);

  // Handle adding a function
  const handleAddFunction = () => {
    if (!functionType) return;

    const functionConfig = {
      type: 'function',
      functionType,
      argument: functionArgument,
      alias: ""
    };

    onAddFunction(functionConfig);

    // Reset inputs
    setFunctionType("");
    setFunctionArgument("");
  };

  // Handle adding a literal
  const handleAddLiteral = () => {
    if (!literalValue) return;

    let formattedValue = literalValue;

    // Format the value based on type
    if (literalType === 'string') {
      formattedValue = `'${literalValue}'`;
    } else if (literalType === 'datetime') {
      formattedValue = `'${literalValue}'`;
    } else if (literalType === 'boolean') {
      formattedValue = literalValue.toLowerCase();
    }

    const literalConfig = {
      type: 'literal',
      literalType,
      value: formattedValue,
      alias: ""
    };

    onAddLiteral(literalConfig);

    // Reset input
    setLiteralValue("");
  };

  // Generate display text for the selected items
  const getItemDisplayText = (item) => {
    if (item.type === 'function') {
      return `${item.functionType}(${item.argument || '*'})`;
    } else if (item.type === 'variable') {
      return item.variable;
    } else if (item.type === 'literal') {
      return item.value;
    } else {
      return buildNodePath(item.template, item.node, containmentVariables);
    }
  };

  return (
    <CollapsibleSection
      title="SELECT Builder"
      isExpanded={isExpanded}
      onToggle={onToggleExpand}
    >
      <div className="space-y-6">
        {/* DISTINCT option */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={useDistinct}
            onChange={(e) => setUseDistinct(e.target.checked)}
          />
          <label htmlFor="useDistinct" className="text-slate-300 text-sm">
            Use DISTINCT (remove duplicate results)
          </label>
        </div>

        {/* SELECT Builder Tabs */}
        <div className="border-b border-slate-700">
          <div className="flex space-x-1">
            <button
              className={`px-4 py-2 border-b-2 text-sm font-medium ${selectedTab === "paths"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-slate-400 hover:text-slate-300"
                }`}
              onClick={() => setSelectedTab("paths")}
            >
              <div className="flex items-center gap-1.5">
                <AlignLeft size={16} />
                <span>Paths</span>
              </div>
            </button>
            <button
              className={`px-4 py-2 border-b-2 text-sm font-medium ${selectedTab === "functions"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-slate-400 hover:text-slate-300"
                }`}
              onClick={() => setSelectedTab("functions")}
            >
              <div className="flex items-center gap-1.5">
                <FunctionSquare size={16} />
                <span>Functions</span>
              </div>
            </button>
            <button
              className={`px-4 py-2 border-b-2 text-sm font-medium ${selectedTab === "literals"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-slate-400 hover:text-slate-300"
                }`}
              onClick={() => setSelectedTab("literals")}
            >
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-lg">"</span>
                <span>Literals</span>
              </div>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="mt-4">
          {/* Paths Tab */}
          {selectedTab === "paths" && (
            <div className="space-y-4">
              {/* Search bar */}
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search in trees (name, ID, type)..."
                  className="w-full px-3 pl-10 py-2 rounded-md bg-slate-800 text-slate-200 border border-slate-600 focus:border-blue-500 focus:outline-none"
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                </div>
              </div>

              {/* Template Trees */}
              <div className="space-y-4 max-h-80 overflow-y-auto pr-2">
                {activeTemplates.map((templateName) => {
                  const filteredRoot = filteredTrees[templateName];
                  if (!templates[templateName]) {
                    return (
                      <div key={templateName} className="bg-slate-800 p-2 rounded-md">
                        <p className="text-red-400">
                          Template "{templateName}" not loaded or not found.
                        </p>
                      </div>
                    );
                  }
                  if (!filteredRoot) {
                    return (
                      <div key={templateName} className="bg-slate-800 p-2 rounded-md">
                        <h3 className="text-lg font-medium text-slate-300 mb-2">
                          {templateName}
                        </h3>
                        <p className="text-sm text-slate-400">
                          No matches found for "{searchTerm}".
                        </p>
                      </div>
                    );
                  }
                  return (
                    <div
                      key={templateName}
                      className="bg-slate-900 rounded-lg p-4 overflow-y-auto"
                    >
                      <h3 className="text-lg font-medium text-slate-300 mb-4 sticky top-0 bg-slate-900 py-2">
                        {templateName}
                      </h3>
                      <TreeView
                        node={filteredRoot}
                        onSelect={(node) => onAddNode(templateName, node)}
                        isSelectable={isSelectableNode}
                        purpose="SELECT"
                        defaultExpanded={!!searchTerm} // Auto-expand when searching
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Functions Tab */}
          {selectedTab === "functions" && (
            <div className="bg-slate-800 p-4 rounded-lg">
              <h3 className="text-slate-300 text-sm font-medium mb-4">
                Add functions to SELECT clause
              </h3>

              <div className="space-y-4">
                {/* Function Type Selection */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Function Type
                  </label>
                  <select
                    value={functionType}
                    onChange={(e) => setFunctionType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 text-slate-300 rounded-md border border-slate-600 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">Select a function...</option>
                    <optgroup label="Aggregate Functions">
                      <option value="COUNT">COUNT()</option>
                      <option value="MIN">MIN()</option>
                      <option value="MAX">MAX()</option>
                      <option value="SUM">SUM()</option>
                      <option value="AVG">AVG()</option>
                    </optgroup>
                    <optgroup label="String Functions">
                      <option value="LENGTH">LENGTH()</option>
                      <option value="CONCAT">CONCAT()</option>
                    </optgroup>
                    <optgroup label="Other Functions">
                      <option value="CURRENT_DATE">CURRENT_DATE()</option>
                      <option value="CURRENT_TIME">CURRENT_TIME()</option>
                      <option value="CURRENT_DATE_TIME">CURRENT_DATE_TIME()</option>
                    </optgroup>
                  </select>
                </div>

                {/* Function Arguments (if needed) */}
                {functionType && functionType !== 'CURRENT_DATE' &&
                  functionType !== 'CURRENT_TIME' && functionType !== 'CURRENT_DATE_TIME' && (
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">
                        Argument
                      </label>
                      <input
                        type="text"
                        value={functionArgument}
                        onChange={(e) => setFunctionArgument(e.target.value)}
                        placeholder={functionType === 'COUNT' ? "* for all rows or path" : "Path or expression"}
                        className="w-full px-3 py-2 bg-slate-700 text-slate-300 rounded-md border border-slate-600 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  )}

                {/* Add Function Button */}
                <button
                  onClick={handleAddFunction}
                  disabled={!functionType}
                  className={`px-3 py-2 rounded-md ${functionType
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    }`}
                >
                  Add Function
                </button>

                {/* Function documentation */}
                <div className="text-xs text-slate-400 mt-3 border-t border-slate-700 pt-3">
                  <h4 className="font-medium mb-1">Function Help</h4>
                  {functionType === 'COUNT' && (
                    <div>
                      <p className="font-medium">COUNT(expression)</p>
                      <p>Returns count of rows or specified values. Use * for all rows.</p>
                      <p className="mt-1">Example: <code>COUNT(*)</code> or <code>COUNT(o/data[at0001]/events)</code></p>
                    </div>
                  )}
                  {functionType === 'MIN' && (
                    <div>
                      <p className="font-medium">MIN(expression)</p>
                      <p>Returns minimum value from the specified path.</p>
                      <p className="mt-1">Example: <code>MIN(o/data[at0001]/events[at0006]/data[at0003]/items[at0004]/value/magnitude)</code></p>
                    </div>
                  )}
                  {functionType === 'MAX' && (
                    <p>Returns maximum value from the specified path.</p>
                  )}
                  {functionType === 'SUM' && (
                    <p>Returns sum of all values from the specified path.</p>
                  )}
                  {functionType === 'AVG' && (
                    <p>Returns average (mean) of all values from the specified path.</p>
                  )}
                  {functionType === 'LENGTH' && (
                    <p>Returns the length of a string value.</p>
                  )}
                  {functionType === 'CONCAT' && (
                    <p>Concatenates multiple strings. Separate arguments with commas.</p>
                  )}
                  {(functionType === 'CURRENT_DATE' || functionType === 'CURRENT_TIME' || functionType === 'CURRENT_DATE_TIME') && (
                    <p>Returns the current date/time. No arguments needed.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Literals Tab */}
          {selectedTab === "literals" && (
            <div className="bg-slate-800 p-4 rounded-lg">
              <h3 className="text-slate-300 text-sm font-medium mb-4">
                Add literal values to SELECT clause
              </h3>

              <div className="space-y-4">
                {/* Literal Type Selection */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Literal Type
                  </label>
                  <select
                    value={literalType}
                    onChange={(e) => setLiteralType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-700 text-slate-300 rounded-md border border-slate-600 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="string">String</option>
                    <option value="number">Number</option>
                    <option value="boolean">Boolean</option>
                    <option value="datetime">Date/Time</option>
                  </select>
                </div>

                {/* Literal Value Input */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">
                    Value
                  </label>
                  {literalType === 'boolean' ? (
                    <select
                      value={literalValue}
                      onChange={(e) => setLiteralValue(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-700 text-slate-300 rounded-md border border-slate-600 focus:border-blue-500 focus:outline-none"
                    >
                      <option value="">Select a value</option>
                      <option value="true">true</option>
                      <option value="false">false</option>
                    </select>
                  ) : literalType === 'datetime' ? (
                    <input
                      type="datetime-local"
                      value={literalValue}
                      onChange={(e) => setLiteralValue(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-700 text-slate-300 rounded-md border border-slate-600 focus:border-blue-500 focus:outline-none"
                    />
                  ) : (
                    <input
                      type={literalType === 'number' ? 'number' : 'text'}
                      value={literalValue}
                      onChange={(e) => setLiteralValue(e.target.value)}
                      placeholder={`Enter a ${literalType} value...`}
                      className="w-full px-3 py-2 bg-slate-700 text-slate-300 rounded-md border border-slate-600 focus:border-blue-500 focus:outline-none"
                    />
                  )}
                </div>

                {/* Add Literal Button */}
                <button
                  onClick={handleAddLiteral}
                  disabled={!literalValue}
                  className={`px-3 py-2 rounded-md ${literalValue
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    }`}
                >
                  Add Literal
                </button>

                {/* Literal format help */}
                <div className="text-xs text-slate-400 mt-2">
                  {literalType === 'string' && (
                    <p>String literals will be enclosed in single quotes: 'example'</p>
                  )}
                  {literalType === 'datetime' && (
                    <p>Date/time values will be enclosed in single quotes and formatted according to ISO 8601.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Selected Items */}
        <div className="mt-6">
          <h3 className="text-md font-medium text-slate-300 mb-4">
            Selected Items ({queryParts.length})
          </h3>

          {Object.entries(groupedQueryParts).map(([groupType, items]) => (
            items.length > 0 && (
              <div key={groupType} className="mb-5">
                <h4 className="text-sm font-medium text-slate-400 mb-2 capitalize flex items-center gap-1.5">
                  {groupType === 'paths' && <AlignLeft size={14} />}
                  {groupType === 'functions' && <FunctionSquare size={14} />}
                  {groupType === 'literals' && <span className="font-mono">""</span>}
                  {groupType}
                </h4>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {items.map((item) => (
                    <div
                      key={item.index}
                      className="flex items-center gap-4 bg-slate-700 p-3 rounded-lg"
                    >
                      <div className="flex-1 text-slate-300 truncate font-mono text-sm" title={getItemDisplayText(item)}>
                        {getItemDisplayText(item)}
                      </div>
                      <input
                        type="text"
                        placeholder="AS alias"
                        value={item.alias || ''}
                        onChange={(e) => onUpdateAlias(item.index, e.target.value)}
                        className="px-3 py-1 bg-slate-600 text-slate-300 rounded-md border border-slate-500 focus:border-blue-500 focus:outline-none w-32"
                      />
                      <button
                        onClick={() => onRemoveNode(item.index)}
                        className="text-slate-400 hover:text-red-400 transition-colors"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )
          ))}
        </div>

        {/* AQL Guide and Example */}
        <div className="bg-slate-800 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-slate-300 mb-2">AQL SELECT Guide</h4>
          <div className="text-xs text-slate-400 space-y-2">
            <p>The SELECT clause defines what data should be returned in the result set.</p>
            <p><span className="text-blue-400">SELECT c/name/value</span> - Path to specific data element</p>
            <p><span className="text-blue-400">SELECT DISTINCT e/ehr_id/value</span> - Remove duplicate results</p>
            <p><span className="text-blue-400">SELECT c</span> - Return the whole Composition object</p>
            <p><span className="text-blue-400">SELECT COUNT(*)</span> - Count all matching results</p>
            <p><span className="text-blue-400">SELECT c/name/value AS CompositionName</span> - Rename result column</p>
            <p><span className="text-blue-400">SELECT 'Critical' AS status</span> - Add a literal value to results</p>
          </div>
        </div>
      </div>
    </CollapsibleSection>
  );
};

SelectBuilder.propTypes = {
  templates: PropTypes.objectOf(PropTypes.shape({
    tree: PropTypes.shape({
      name: PropTypes.string,
      rmType: PropTypes.string,
      children: PropTypes.array
    })
  })).isRequired,
  activeTemplates: PropTypes.arrayOf(PropTypes.string).isRequired,
  queryParts: PropTypes.arrayOf(PropTypes.shape({
    type: PropTypes.string,
    template: PropTypes.string,
    node: PropTypes.shape({
      name: PropTypes.string
    }),
    alias: PropTypes.string,
    // Function specific
    functionType: PropTypes.string,
    argument: PropTypes.string,
    // Literal specific
    literalType: PropTypes.string,
    value: PropTypes.string,
    // Variable specific
    variable: PropTypes.string
  })).isRequired,
  onAddNode: PropTypes.func.isRequired,
  onRemoveNode: PropTypes.func.isRequired,
  onUpdateAlias: PropTypes.func.isRequired,
  onAddFunction: PropTypes.func.isRequired,
  onAddLiteral: PropTypes.func.isRequired,
  isExpanded: PropTypes.bool.isRequired,
  onToggleExpand: PropTypes.func.isRequired,
  buildNodePath: PropTypes.func.isRequired,
  containmentVariables: PropTypes.arrayOf(PropTypes.shape({
    alias: PropTypes.string.isRequired,
    rmType: PropTypes.string.isRequired,
    template: PropTypes.string
  })).isRequired,
  useDistinct: PropTypes.bool.isRequired,
  setUseDistinct: PropTypes.func.isRequired,
  functions: PropTypes.object
};

SelectBuilder.defaultProps = {
  containmentVariables: [],
  useDistinct: false,
  functions: {}
};

export default SelectBuilder;