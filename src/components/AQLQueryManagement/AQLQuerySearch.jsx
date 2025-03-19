// Update AQLQuerySearch.jsx to include import functionality
"use client";

import React from 'react';
import { Search, Plus } from 'lucide-react';
import PropTypes from 'prop-types';

const AQLQuerySearch = ({ onSearch }) => {
  return (
    <div className="flex justify-between items-center">
      <div className="relative flex-1 mr-4">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
        <input
          type="text"
          placeholder="Search queries by name, description, tags or content..."
          onChange={(e) => onSearch(e.target.value)}
          className="w-full pl-9 p-2 bg-slate-800 border border-slate-700 
            text-slate-300 rounded-md focus:outline-none focus:ring-2 
            focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    </div>
  );
};

AQLQuerySearch.propTypes = {
  onSearch: PropTypes.func.isRequired,
};

export default AQLQuerySearch;