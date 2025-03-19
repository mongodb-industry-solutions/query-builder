'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Search, RefreshCw, Tag as TagIcon, FolderTree } from 'lucide-react';
import PropTypes from 'prop-types';
import useMetadataManager from '@/hooks/useMetadataManager';
import { getTagColors } from '@/lib/utils';

const QuerySidebar = ({ selectedQuery, onSelectQuery }) => {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState({ folder: null, tags: [] });
  const { metadata } = useMetadataManager();
  
  // Fetch queries
  const fetchQueries = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = searchTerm ? `?search=${encodeURIComponent(searchTerm)}` : "";
      const response = await fetch(`/api/internal/aql-queries${params}`);

      if (!response.ok) throw new Error("Failed to fetch queries");

      setQueries(await response.json());
    } catch (err) {
      console.error("Error fetching queries:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    fetchQueries();
  }, [fetchQueries]);

  // Filter queries based on active filters
  const filteredQueries = queries.filter(({ folderId, tags }) => {
    // Filter by folder if a folder filter is active
    const folderMatch = !activeFilters.folder || folderId === activeFilters.folder;
    
    // Filter by tags if any tag filters are active
    let tagMatch = true;
    if (activeFilters.tags && activeFilters.tags.length > 0) {
      tagMatch = tags && activeFilters.tags.every(activeTag => 
        tags.some(tag => {
          const tagName = typeof tag === 'string' ? tag : tag.name;
          return tagName === activeTag;
        })
      );
    }
    
    return folderMatch && tagMatch;
  });

  // Handle folder filter
  const handleFolderFilter = (folderId) => {
    setActiveFilters(prev => ({
      ...prev,
      folder: prev.folder === folderId ? null : folderId
    }));
  };

  // Handle tag filter
  const handleTagFilter = (tagName) => {
    setActiveFilters(prev => {
      const tags = [...prev.tags];
      const index = tags.indexOf(tagName);
      
      if (index >= 0) {
        tags.splice(index, 1);
      } else {
        tags.push(tagName);
      }
      
      return {
        ...prev,
        tags
      };
    });
  };

  // Get folder name from id
  const getFolderName = (folderId) => {
    if (!folderId) return '(Root)';
    const folder = metadata.folders.find(f => f._id === folderId);
    return folder ? folder.name : 'Unknown Folder';
  };

  // Reset all filters
  const handleResetFilters = () => {
    setActiveFilters({ folder: null, tags: [] });
    setSearchTerm('');
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-800 p-4 border-r border-slate-700 overflow-hidden">
      <h3 className="text-lg font-medium text-slate-200 mb-4">Saved Queries</h3>
      
      {/* Search box */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
        <input
          type="text"
          placeholder="Search queries..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 p-2 bg-slate-700 border border-slate-600 rounded-md text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      
      {/* Active filters display */}
      {(activeFilters.folder || activeFilters.tags.length > 0) && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-sm text-slate-400">Filters:</span>

          {activeFilters.folder && (
            <div className="bg-slate-700 px-2 py-1 rounded-md text-sm flex items-center gap-1">
              <FolderTree size={12} className="text-yellow-500" />
              <span>{getFolderName(activeFilters.folder)}</span>
              <button
                onClick={() => setActiveFilters(prev => ({ ...prev, folder: null }))}
                className="ml-2 text-slate-400 hover:text-red-400"
              >
                ×
              </button>
            </div>
          )}

          {activeFilters.tags.map(tag => (
            <div key={tag} className="bg-slate-700 px-2 py-1 rounded-md text-sm flex items-center gap-1">
              <TagIcon size={12} className="text-blue-400" />
              <span>{tag}</span>
              <button
                onClick={() => handleTagFilter(tag)}
                className="ml-2 text-slate-400 hover:text-red-400"
              >
                ×
              </button>
            </div>
          ))}

          <button
            onClick={handleResetFilters}
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            Clear All
          </button>
        </div>
      )}
      
      {/* Filter by popular tags */}
      {metadata.tags.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-slate-300 mb-2">Filter by Tag</h4>
          <div className="flex flex-wrap gap-2">
            {metadata.tags.slice(0, 10).map(tag => {
              const colors = getTagColors(tag.name, tag.color);
              const isActive = activeFilters.tags.includes(tag.name);
              
              return (
                <button
                  key={tag._id}
                  onClick={() => handleTagFilter(tag.name)}
                  className={`px-2 py-1 rounded-md text-xs flex items-center gap-1
                    ${isActive 
                      ? 'bg-blue-600 text-white' 
                      : `${colors.bg} ${colors.text}`}`}
                >
                  <TagIcon size={10} />
                  <span>{tag.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Query list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center items-center h-32 text-slate-400">
            <RefreshCw size={20} className="animate-spin mr-2" />
            <span>Loading queries...</span>
          </div>
        ) : error ? (
          <div className="bg-red-900/30 text-red-300 p-4 rounded-md">
            <h4 className="font-medium mb-2">Error loading queries</h4>
            <p>{error}</p>
            <button
              onClick={fetchQueries}
              className="mt-4 px-4 py-2 bg-slate-700 text-slate-300 rounded hover:bg-slate-600"
            >
              Try Again
            </button>
          </div>
        ) : filteredQueries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-slate-400">
            <TagIcon size={32} className="mb-4 opacity-50" />
            <p className="text-center mb-2">No queries found</p>
            <p className="text-sm text-center">
              {activeFilters.folder || activeFilters.tags.length > 0 || searchTerm
                ? "Try adjusting your search filters"
                : "Create your first AQL query to get started"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredQueries.map(query => (
              <div
                key={query._id}
                className={`bg-slate-800 border p-3 rounded-lg cursor-pointer ${
                  selectedQuery?._id === query._id
                    ? 'bg-blue-900/30 border-blue-500'
                    : 'border-slate-700 hover:border-slate-500'
                }`}
                onClick={() => onSelectQuery(query)}
              >
                <h4 className="font-medium text-slate-200 truncate">{query.name}</h4>
                {query.description && (
                  <p className="text-sm text-slate-400 mt-1 line-clamp-2">{query.description}</p>
                )}
                
                <div className="flex items-center mt-2 text-xs text-slate-500">
                  <FolderTree
                    size={12}
                    className="mr-1 text-yellow-500 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFolderFilter(query.folderId);
                    }}
                  />
                  <span
                    className="truncate hover:text-yellow-500 cursor-pointer mr-3"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFolderFilter(query.folderId);
                    }}
                  >
                    {getFolderName(query.folderId)}
                  </span>
                  
                  <span>
                    Updated: {new Date(query.updatedAt).toLocaleDateString()}
                  </span>
                </div>
                
                {query.tags && query.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {query.tags.map((tag, i) => {
                      const tagName = typeof tag === 'string' ? tag : tag.name;
                      const tagObj = metadata.tags.find(t => t.name === tagName);
                      const colors = getTagColors(tagName, tagObj?.color);
                      
                      return (
                        <div
                          key={i}
                          className={`flex items-center ${colors.bg} ${colors.text} px-1.5 py-0.5 rounded-md text-xs cursor-pointer`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTagFilter(tagName);
                          }}
                        >
                          <TagIcon size={9} className="mr-1" />
                          <span>{tagName}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

QuerySidebar.propTypes = {
  selectedQuery: PropTypes.object,
  onSelectQuery: PropTypes.func.isRequired
};

export default QuerySidebar;