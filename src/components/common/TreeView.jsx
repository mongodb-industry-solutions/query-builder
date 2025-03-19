"use client";

import React, { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import PropTypes from 'prop-types';

const TreeView = ({
  node,
  onSelect,
  level = 0,
  isSelectable = () => true,
  purpose = '',
  defaultExpanded = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded || level === 0);
  const hasChildren = node?.children && node.children.length > 0;

  // Make sure we have a valid node
  if (!node) return null;

  const handleToggle = (e) => {
    e.stopPropagation();
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleSelect = (e) => {
    e.stopPropagation();
    if (onSelect && isSelectable(node)) {
      onSelect(node);
    }
  };

  // Ensure node has all required properties with fallbacks
  const displayName = node.name || node.localizedName || "Unnamed";
  const nodeType = node.rmType || "UNKNOWN";
  const nodeId = node.nodeId || node.id || "";
  const cardinality = node.cardinality || 
    (node.min !== undefined ? `${node.min}..${node.max || '*'}` : '');
  
  const nodeDescription = node.localizedDescriptions?.en || 
    node.description || 
    "No description available";

  // Check if this node is selectable
  const canBeSelected = isSelectable(node);

  return (
    <div className="ml-4">
      <div className="group flex flex-col border-b border-slate-700 py-1">
        {/* Row for the node */}
        <div className="flex items-center gap-2">
          {/* Expand/Collapse Icon */}
          <div
            className="w-4 h-4 cursor-pointer hover:bg-slate-700 rounded flex-shrink-0"
            onClick={handleToggle}
          >
            {hasChildren && (
              isExpanded ? 
                <ChevronDown className="text-green-500 hover:text-green-400" size={16} /> : 
                <ChevronRight className="text-green-500 hover:text-green-400" size={16} />
            )}
          </div>
          
          {/* Node Label */}
          <div 
            className="flex-1 text-xs font-medium text-slate-200 truncate" 
            title={nodeDescription}
          >
            {displayName}
            {node.id && !node.nodeId && <span className="ml-1 text-slate-400">(id: {node.id})</span>}
          </div>
          
          {/* Node Type */}
          <div className="w-28 text-xs text-slate-400 text-center">
            {nodeType}
          </div>
          
          {/* Cardinality */}
          <div className="w-20 text-xs text-slate-400 text-center">
            {cardinality}
          </div>
          
          {/* Node ID */}
          <div className="w-80 flex items-center gap-2">
            <code className="text-[10px] text-slate-500">{nodeId}</code>
          </div>
          
          {/* Add Button */}
          <div className="w-10 flex flex-col gap-2">
            {onSelect && (
              <button
                onClick={handleSelect}
                className={`px-2 py-1 rounded text-xs transition-colors
                  ${canBeSelected 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-slate-600 text-slate-400 cursor-not-allowed'}`}
                disabled={!canBeSelected}
                title={canBeSelected ? 'Add to query' : 'Not selectable for this purpose'}
              >
                Add
              </button>
            )}
          </div>
        </div>
        
        {/* Children */}
        {isExpanded && hasChildren && (
          <div className="mt-1 pl-4 border-l border-slate-600">
            {node.children.map((child, index) => (
              <TreeView
                key={`${child.nodeId || child.id || index}`}
                node={child}
                onSelect={onSelect}
                level={level + 1}
                isSelectable={isSelectable}
                purpose={purpose}
                defaultExpanded={defaultExpanded}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

TreeView.propTypes = {
  node: PropTypes.shape({
    name: PropTypes.string,
    localizedName: PropTypes.string,
    localizedDescriptions: PropTypes.shape({
      en: PropTypes.string
    }),
    description: PropTypes.string,
    rmType: PropTypes.string,
    cardinality: PropTypes.string,
    min: PropTypes.number,
    max: PropTypes.number,
    nodeId: PropTypes.string,
    id: PropTypes.string,
    children: PropTypes.array
  }).isRequired,
  onSelect: PropTypes.func,
  level: PropTypes.number,
  isSelectable: PropTypes.func,
  purpose: PropTypes.string,
  defaultExpanded: PropTypes.bool,
};

export default TreeView;