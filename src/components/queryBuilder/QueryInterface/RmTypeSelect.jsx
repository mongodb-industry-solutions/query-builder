"use client";

import React from 'react';
import { VALID_CONTAINMENT } from '@/hooks/queryBuilder/utils/constants';

const RmTypeSelect = ({ parentRmType, value, onChange }) => {
  // Filter available RM types based on what the parent RM type can contain
  const availableRmTypes = parentRmType ? VALID_CONTAINMENT[parentRmType] : ['COMPOSITION'];

  return (
    <select value={value} onChange={onChange} className="w-full p-2 bg-slate-700 text-slate-300 rounded-md">
      <option value="">Select RM Type</option>
      {availableRmTypes && availableRmTypes.map(type => (
        <option key={type} value={type}>{type}</option>
      ))}
    </select>
  );
};

export default RmTypeSelect;
