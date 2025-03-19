// ContainsBlock.jsx
"use client";

import React, { useState, useEffect } from 'react';
import RmTypeSelect from './RmTypeSelect';
import { buildNodePath } from '@/hooks/queryBuilder/utils/pathUtils';
import { Plus, Trash2 } from 'lucide-react';

const ContainsBlock = ({
  template,
  node,
  rmType,
  archetypeId,
  alias,
  aqlPath,
  isRoot,
  addContains,
  removeContains,
  updateContains,
  availableRMTypes,
  containsArray,
  setContainsArray
}) => {
  const [localAlias, setLocalAlias] = useState(alias || '');
  const [localRmType, setLocalRmType] = useState(rmType || '');
  const [localArchetypeId, setLocalArchetypeId] = useState(archetypeId || '');

  const handleAliasChange = (e) => {
    const newAlias = e.target.value;
    setLocalAlias(newAlias);
    updateContains(template, node.nodeId, { alias: newAlias });
  };

  const handleRmTypeChange = (e) => {
    const newRmType = e.target.value;
    setLocalRmType(newRmType);
    updateContains(template, node.nodeId, { rmType: newRmType });
  };

  const handleArchetypeIdChange = (e) => {
    const newArchetypeId = e.target.value;
    setLocalArchetypeId(newArchetypeId);
    updateContains(template, node.nodeId, { archetypeId: newArchetypeId });
  };

  const handleRemove = () => {
    removeContains(template, node.nodeId);
  };

  const handleAddContains = () => {
    // Use the template, node, availableRMTypes, addContains
    // This will need a modal or inline form to get the details
  };

  return (
    <div className="bg-slate-700 p-4 rounded-md space-y-2">
      <h4 className="text-slate-300 font-medium">Contains: {node?.name} ({node?.nodeId})</h4>

      <div className="flex items-center space-x-2">
        <label className="text-slate-400 text-sm">Alias:</label>
        <input
          type="text"
          value={localAlias}
          onChange={handleAliasChange}
          placeholder="Alias"
          className="w-32 p-2 bg-slate-800 text-slate-300 rounded-md"
        />
      </div>

      <div className="flex items-center space-x-2">
        <label className="text-slate-400 text-sm">RM Type:</label>
        <RmTypeSelect
          parentRmType={containsArray.length > 0 ? containsArray[containsArray.length - 1].rmType : null}
          value={localRmType}
          onChange={handleRmTypeChange}
        />
      </div>

      <div className="flex items-center space-x-2">
        <label className="text-slate-400 text-sm">Archetype ID:</label>
        <input
          type="text"
          value={localArchetypeId}
          onChange={handleArchetypeIdChange}
          placeholder="Archetype ID (optional)"
          className="w-64 p-2 bg-slate-800 text-slate-300 rounded-md"
        />
      </div>

      <div className="flex justify-end space-x-2">
        <button
          onClick={handleAddContains}
          className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus size={16} className="inline-block mr-1" /> Add Contains
        </button>
        <button
          onClick={handleRemove}
          className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          <Trash2 size={16} className="inline-block mr-1" /> Remove
        </button>
      </div>
    </div>
  );
};

export default ContainsBlock;
