"use client";

import React from 'react';
import PropTypes from 'prop-types';
import { ChevronDown, ChevronRight, Info } from 'lucide-react';

/**
 * A collapsible section component with toggle functionality
 * Uses a controlled approach for expansion state
 */
const CollapsibleSection = ({
  title,
  children,
  helpText,
  isExpanded = false,
  onToggle,
  className = ""
}) => {
  return (
    <div className={`bg-slate-800 rounded-lg overflow-hidden ${className}`}>
      {/* Header with toggle button */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer bg-slate-700 hover:bg-slate-600"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2">
          {/* Expansion indicator */}
          <div className="text-slate-300">
            {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </div>
          
          {/* Section title */}
          <h3 className="font-medium text-slate-200">{title}</h3>
          
          {/* Help text tooltip */}
          {helpText && (
            <div className="group relative">
              <Info size={14} className="text-slate-400" />
              <div className="absolute left-0 bottom-6 w-64 bg-slate-700 p-2 text-xs text-slate-300 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                {helpText}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Collapsible content */}
      {isExpanded && (
        <div className="p-4">
          {children}
        </div>
      )}
    </div>
  );
};

CollapsibleSection.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node,
  helpText: PropTypes.string,
  isExpanded: PropTypes.bool,
  onToggle: PropTypes.func.isRequired,
  className: PropTypes.string
};

export default CollapsibleSection;