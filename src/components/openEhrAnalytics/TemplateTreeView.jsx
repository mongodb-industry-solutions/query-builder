"use client";

import React, { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';

const TemplateTreeView = ({
  node,
  onSelect,
  level = 0,
  parentPath = '',
  highlightPath = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(level === 0);
  
  if (!node) return null;

  const hasChildren = node?.children && node.children.length > 0;
  
  // Build the path for this node
  const nodeName = node.name || node.localizedName || 'unnamed';
  const nodeId = node.nodeId || node.id || '';
  const nodeRmType = node.rmType || 'UNKNOWN';
  
  // Create a dot-notation path for this node
  const currentPath = parentPath 
    ? `${parentPath}.${nodeName}` 
    : nodeName;
  
  // Determine if this node is selectable (leaf nodes or nodes with values)
  const isSelectable = nodeRmType && ['DV_TEXT', 'DV_CODED_TEXT', 'DV_QUANTITY', 
    'DV_COUNT', 'DV_DATE_TIME', 'DV_BOOLEAN', 'DV_IDENTIFIER'].includes(nodeRmType);
  
  const isHighlighted = highlightPath === currentPath;
  
  const handleToggle = (e) => {
    e.stopPropagation();
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleSelect = () => {
    if (isSelectable) {
      onSelect(currentPath);
    }
  };

  return (
    <div className="ml-2">
      <div 
        className={`flex items-center gap-2 py-1 cursor-pointer group
                  ${isHighlighted ? 'bg-blue-900/30 -mx-2 px-2 rounded' : ''}`}
        onClick={handleToggle}
      >
        {hasChildren ? (
          isExpanded ? (
            <ChevronDown className="text-blue-400 flex-shrink-0" size={14} />
          ) : (
            <ChevronRight className="text-slate-400 flex-shrink-0" size={14} />
          )
        ) : (
          <div className="w-3.5 h-3.5"></div>
        )}
        
        <div className="flex-1 flex items-center gap-2 overflow-hidden">
          <span 
            className={`text-sm truncate ${
              isHighlighted 
                ? 'text-blue-300 font-medium' 
                : 'text-slate-300'
            }`}
            title={node.description || node.localizedDescriptions?.en || nodeName}
          >
            {nodeName}
          </span>
          
          {nodeRmType && (
            <span className="text-xs text-slate-500">
              {nodeRmType}
            </span>
          )}
          
          {nodeId && (
            <span className="text-xs text-slate-600 hidden group-hover:inline truncate">
              {nodeId}
            </span>
          )}
        </div>
        
        {isSelectable && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleSelect();
            }}
            className={`px-2 py-0.5 text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity
                      ${isHighlighted 
                        ? 'bg-blue-600 text-white opacity-100' 
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
          >
            Select
          </button>
        )}
      </div>
      
      {isExpanded && hasChildren && (
        <div className="pl-4 mt-1 border-l border-slate-700">
          {node.children.map((child, index) => (
            <TemplateTreeView
              key={child.nodeId || child.id || index}
              node={child}
              onSelect={onSelect}
              level={level + 1}
              parentPath={currentPath}
              highlightPath={highlightPath}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TemplateTreeView;