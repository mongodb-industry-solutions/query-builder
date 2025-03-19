"use client";

import React from 'react';
import { X, ArrowUpDown } from 'lucide-react';
import PropTypes from 'prop-types';
import TreeView from '../../common/TreeView';
import CollapsibleSection from '../../common/CollapsibleSection';

const OrderByBuilder = ({
  templates,
  activeTemplates,
  orderByItems,
  onAddOrderBy,
  onRemoveOrderBy,
  onUpdateDirection,
  isExpanded,
  onToggleExpand,
  buildNodePath,
  containmentVariables
}) => {
  const isOrderableNode = (node) => {
    if (!node || !node.rmType) return false;
    
    // Types that can be used in ORDER BY
    const orderableTypes = [
      'DV_TEXT', 'DV_CODED_TEXT', 'DV_QUANTITY', 'DV_COUNT',
      'DV_DATE_TIME', 'DV_ORDINAL', 'DV_IDENTIFIER'
    ];
    
    const nodeType = node.rmType.toUpperCase();
    
    // Direct match
    if (orderableTypes.includes(nodeType)) return true;
    
    return false;
  };

  return (
    <CollapsibleSection
      title="ORDER BY"
      isExpanded={isExpanded}
      onToggle={onToggleExpand}
    >
      <div className="space-y-6">
        {/* Template Trees */}
        <div className="space-y-4">
          {activeTemplates.map(templateName => {
            if (!templates || !templates[templateName]) {
              console.warn(`Template data for key "${templateName}" is not loaded.`);
              return null;
            }
            const templateData = templates[templateName];
            return (
              <div key={templateName} className="bg-slate-900 rounded-lg p-4">
                <h3 className="text-lg font-medium text-slate-300 mb-4">{templateName}</h3>
                <TreeView
                  node={templateData.tree}
                  onSelect={(node) => onAddOrderBy(templateName, node)}
                  isSelectable={isOrderableNode}
                  purpose="ORDER BY"
                />
              </div>
            );
          })}
        </div>

        {/* Order By Items */}
        <div className="mt-6">
          <h3 className="text-md font-medium text-slate-300 mb-4">
            <div className="flex items-center gap-2">
              <ArrowUpDown size={16} />
              Ordering
            </div>
          </h3>
          <div className="space-y-3">
            {orderByItems.map((item, index) => (
              <div 
                key={index} 
                className="flex items-center gap-4 bg-slate-700 p-4 rounded-lg"
              >
                <div className="flex-1 text-slate-300">
                  { buildNodePath(item.template, item.node, containmentVariables) }
                </div>
                <select
                  value={item.direction}
                  onChange={(e) => onUpdateDirection(index, e.target.value)}
                  className="px-3 py-2 bg-slate-600 text-slate-300 rounded-md border border-slate-500 focus:border-blue-500 focus:outline-none"
                >
                  <option value="ASC">Ascending</option>
                  <option value="DESC">Descending</option>
                </select>
                <button
                  onClick={() => onRemoveOrderBy(index)}
                  className="text-slate-400 hover:text-red-400 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </CollapsibleSection>
  );
};

OrderByBuilder.propTypes = {
  templates: PropTypes.objectOf(PropTypes.shape({
    tree: PropTypes.object.isRequired
  })).isRequired,
  activeTemplates: PropTypes.arrayOf(PropTypes.string).isRequired,
  orderByItems: PropTypes.arrayOf(PropTypes.shape({
    template: PropTypes.string.isRequired,
    node: PropTypes.shape({
      name: PropTypes.string.isRequired
    }).isRequired,
    direction: PropTypes.oneOf(['ASC', 'DESC']).isRequired
  })).isRequired,
  onAddOrderBy: PropTypes.func.isRequired,
  onRemoveOrderBy: PropTypes.func.isRequired,
  onUpdateDirection: PropTypes.func.isRequired,
  isExpanded: PropTypes.bool.isRequired,
  onToggleExpand: PropTypes.func.isRequired
};

export default OrderByBuilder;