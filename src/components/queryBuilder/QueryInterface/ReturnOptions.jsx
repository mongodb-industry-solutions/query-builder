"use client";

import React from 'react';
import PropTypes from 'prop-types';
import { ArrowDownUp, Filter, Info } from 'lucide-react';
import CollapsibleSection from '../../common/CollapsibleSection';

const ReturnOptions = ({
  limit,
  offset,
  onUpdateLimit,
  onUpdateOffset,
  isExpanded,
  onToggleExpand
}) => {
  return (
    <CollapsibleSection
      title="Return Options"
      isExpanded={isExpanded}
      onToggle={onToggleExpand}
    >
      <div className="space-y-6">
        <div className="bg-blue-900/20 border border-blue-800 rounded-md p-3 text-sm text-blue-300 flex items-start gap-2">
          <Info size={18} className="text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p>Return options allow you to control how many results are returned and how they are ordered.</p>
            <p className="mt-1">Use <span className="font-mono">LIMIT</span> to restrict the number of results and <span className="font-mono">OFFSET</span> for pagination.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {/* LIMIT */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300 flex items-center gap-1.5">
              <Filter size={14} className="text-slate-400" />
              <span>LIMIT</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                value={limit}
                onChange={(e) => onUpdateLimit(e.target.value)}
                placeholder="Number of results"
                className="w-full px-3 py-2 bg-slate-700 text-slate-300 rounded-md 
                  border border-slate-600 focus:border-blue-500 focus:outline-none"
              />
              <div className="absolute right-3 top-2 text-sm text-slate-400">
                results
              </div>
            </div>
            <p className="text-xs text-slate-400">
              Maximum number of results to return
            </p>
          </div>

          {/* OFFSET */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300 flex items-center gap-1.5">
              <ArrowDownUp size={14} className="text-slate-400" />
              <span>OFFSET</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                value={offset}
                onChange={(e) => onUpdateOffset(e.target.value)}
                placeholder="Skip results"
                className="w-full px-3 py-2 bg-slate-700 text-slate-300 rounded-md 
                  border border-slate-600 focus:border-blue-500 focus:outline-none"
              />
              <div className="absolute right-3 top-2 text-sm text-slate-400">
                rows
              </div>
            </div>
            <p className="text-xs text-slate-400">
              Number of initial results to skip (for pagination)
            </p>
          </div>
        </div>

        {/* Example explanation */}
        <div className="text-sm text-slate-400 mt-4 space-y-2">
          <h4 className="font-medium text-slate-300">Usage Examples:</h4>
          <p>
            <span className="font-mono text-xs bg-slate-700 px-1.5 py-0.5 rounded">LIMIT 10</span> - Return only the first 10 results
          </p>
          <p>
            <span className="font-mono text-xs bg-slate-700 px-1.5 py-0.5 rounded">LIMIT 10 OFFSET 10</span> - Return results 11-20 (second page)
          </p>
          <p>
            <span className="font-mono text-xs bg-slate-700 px-1.5 py-0.5 rounded">LIMIT 10 OFFSET 20</span> - Return results 21-30 (third page)
          </p>
        </div>

        <div className="bg-slate-800 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-slate-300 mb-2">AQL Return Options Guide</h4>
          <div className="text-xs text-slate-400 space-y-2">
            <p>LIMIT and OFFSET are used to restrict and paginate the result set.</p>
            <p><span className="text-blue-400">LIMIT row_count</span> - Limits the number of returned rows</p>
            <p><span className="text-blue-400">OFFSET offset</span> - Skips the specified number of initial rows</p>
            <p className="text-yellow-400">Note: Using LIMIT/OFFSET requires ORDER BY for consistent results</p>
          </div>
        </div>
      </div>
    </CollapsibleSection>
  );
};

ReturnOptions.propTypes = {
  limit: PropTypes.string.isRequired,
  offset: PropTypes.string.isRequired,
  onUpdateLimit: PropTypes.func.isRequired,
  onUpdateOffset: PropTypes.func.isRequired,
  isExpanded: PropTypes.bool.isRequired,
  onToggleExpand: PropTypes.func.isRequired
};

export default ReturnOptions;