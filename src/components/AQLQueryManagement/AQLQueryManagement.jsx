// src/components/AQLQueryManagement/AQLQueryManagement.jsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Plus, FolderTree, Tag, Settings, RefreshCw, Database, AlertTriangle,
} from "lucide-react";
import AQLQueryEditor from "./AQLQueryEditor";
import useMetadataManager from "@/hooks/useMetadataManager";
import MetadataDashboard from "./MetadataDashboard";
import AQLQueryExplorer from "./AQLQueryExplorer";
import AQLQuerySearch from "./AQLQuerySearch";
import TagFilter from "./MetadataManagement/TagFilter";
import { getTagColors } from "@/lib/utils";

const AQLQueryManagement = () => {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [showMetadataDashboard, setShowMetadataDashboard] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  // Initialize with tags as an array
  const [activeFilters, setActiveFilters] = useState({ folder: null, tags: [] });
  const { metadata, reloadMetadata } = useMetadataManager();
  const [viewMode, setViewMode] = useState("grid");
  const [uniqueTags, setUniqueTags] = useState([]);

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

  // Extract unique tags from queries
  useEffect(() => {
    if (queries.length && metadata.tags) {
      // Build a set of unique tag names
      const tagNames = new Set();

      queries.forEach(query => {
        if (query.tags && Array.isArray(query.tags)) {
          query.tags.forEach(tag => {
            const tagName = typeof tag === 'string' ? tag : tag.name;
            tagNames.add(tagName);
          });
        }
      });

      // Convert to tag objects with metadata info
      const tagsWithMetadata = Array.from(tagNames).map(name => {
        // Find tag metadata if it exists
        const metaTag = metadata.tags.find(t => t.name === name);
        return metaTag || { _id: `temp-${name}`, name };
      });

      setUniqueTags(tagsWithMetadata);
    }
  }, [queries, metadata.tags]);

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

  const handleSaveQuery = async (queryData) => {
    try {
      const method = queryData._id ? "PUT" : "POST";
      const response = await fetch("/api/internal/aql-queries", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(queryData),
      });

      if (!response.ok) throw new Error((await response.json()).error || "Failed to save query");

      const savedQuery = await response.json();

      // Update queries list with the new/updated query
      if (queryData._id) {
        setQueries((prev) => prev.map(q => (q._id === queryData._id ? savedQuery : q)));
      } else {
        setQueries((prev) => [...prev, savedQuery]);
      }

      setSelectedQuery(null);
      setIsCreatingNew(false);
      return true;
    } catch (err) {
      console.error("Error saving query:", err);
      return false;
    }
  };

  const handleDeleteQuery = async (queryId) => {
    if (!window.confirm("Are you sure you want to delete this query?")) return;
    try {
      const response = await fetch("/api/internal/aql-queries", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: queryId }),
      });

      if (!response.ok) throw new Error((await response.json()).error || "Failed to delete query");

      setQueries((prev) => prev.filter(q => q._id !== queryId));
      if (selectedQuery?._id === queryId) setSelectedQuery(null);
    } catch (err) {
      console.error("Error deleting query:", err);
      alert(`Error: ${err.message}`);
    }
  };

  // Reset all filters to their default state
  const handleResetFilters = () => setActiveFilters({ folder: null, tags: [] });

  const handleDuplicateQuery = (query) => {
    const duplicateQuery = {
      ...query,
      _id: null,
      name: `${query.name} (Copy)`,
      createdAt: null,
      updatedAt: null
    };

    setSelectedQuery(duplicateQuery);
    setIsCreatingNew(true);
  };

  // Apply folder filter when clicked in Explorer
  const handleFolderFilter = (folderId) => {
    setActiveFilters(prev => ({
      ...prev,
      folder: prev.folder === folderId ? null : folderId
    }));
  };

  // Handle tag selection for the filter
  const handleTagFilter = (tags) => {
    setActiveFilters(prev => ({
      ...prev,
      tags: Array.isArray(tags) ? tags : [tags] // Ensure it's always an array
    }));
  };

  // Get folder name from id
  const getFolderName = (folderId) => {
    if (!folderId) return '(Root)';
    const folder = metadata.folders.find(f => f._id === folderId);
    return folder ? folder.name : 'Unknown Folder';
  };

  // Render query list or editing interface
  return (
    <div className="space-y-4">
      {selectedQuery || isCreatingNew ? (
        <AQLQueryEditor
          query={selectedQuery}
          onSave={handleSaveQuery}
          onCancel={() => {
            setSelectedQuery(null);
            setIsCreatingNew(false);
          }}
        />
      ) : (
        <div className="space-y-4">
          {/* Header & Actions */}
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div>
              <h2 className="text-xl font-medium text-slate-200">AQL Queries</h2>
              <p className="text-sm text-slate-400">
                Manage and execute your AQL queries
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowMetadataDashboard(true)}
                className="px-3 py-2 bg-slate-700 text-slate-300 rounded-md hover:bg-slate-600 flex items-center gap-2"
              >
                <Settings size={16} />
                Manage Metadata
              </button>
              <button
                onClick={() => setIsCreatingNew(true)}
                className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus size={16} />
                New Query
              </button>
            </div>
          </div>

          {/* View Mode Toggle & Search */}
          <div className="flex flex-wrap gap-4">
            <div className="flex-1">
              <AQLQuerySearch
                onSearch={setSearchTerm}
                onCreateQuery={() => setIsCreatingNew(true)}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 rounded-md flex items-center gap-2 ${viewMode === 'grid'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
              >
                <Database size={16} />
                Grid
              </button>
              <button
                onClick={() => setViewMode('tree')}
                className={`px-3 py-2 rounded-md flex items-center gap-2 ${viewMode === 'tree'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
              >
                <FolderTree size={16} />
                Tree
              </button>
            </div>
          </div>

          {/* Tag Filter */}
          <TagFilter
            availableTags={uniqueTags}
            activeTags={activeFilters.tags}
            onTagSelect={handleTagFilter}
          />

          {/* Active Filters Display */}
          {(activeFilters.folder || activeFilters.tags.length > 0 || searchTerm) && (
            <div className="flex flex-wrap items-center gap-2 py-2">
              <span className="text-sm text-slate-400">Active Filters:</span>

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

              {activeFilters.tags && activeFilters.tags.length > 0 && (
                <div className="bg-slate-700 px-2 py-1 rounded-md text-sm flex items-center gap-1">
                  <Tag size={12} className="text-blue-400" />
                  <span>
                    {activeFilters.tags.length === 1 
                      ? activeFilters.tags[0] 
                      : `${activeFilters.tags.length} tags selected`}
                  </span>
                  <button
                    onClick={() => setActiveFilters(prev => ({ ...prev, tags: [] }))}
                    className="ml-2 text-slate-400 hover:text-red-400"
                  >
                    ×
                  </button>
                </div>
              )}

              {searchTerm && (
                <div className="bg-slate-700 px-2 py-1 rounded-md text-sm flex items-center gap-1">
                  <span>Search: {searchTerm}</span>
                  <button
                    onClick={() => setSearchTerm('')}
                    className="ml-2 text-slate-400 hover:text-red-400"
                  >
                    ×
                  </button>
                </div>
              )}

              <button
                onClick={handleResetFilters}
                className="text-sm text-blue-400 hover:text-blue-300"
              >
                Clear All
              </button>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-900/30 text-red-300 p-4 rounded-md">
              <div className="flex items-center mb-2">
                <AlertTriangle size={16} className="mr-2" />
                <h3 className="font-medium">Error Loading Queries</h3>
              </div>
              <p>{error}</p>
              <button
                onClick={fetchQueries}
                className="mt-4 px-4 py-2 bg-slate-700 text-slate-300 rounded hover:bg-slate-600"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="p-8 flex justify-center">
              <div className="flex flex-col items-center text-slate-400">
                <RefreshCw size={32} className="animate-spin mb-2" />
                <span>Loading queries...</span>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && filteredQueries.length === 0 && (
            <div className="p-8 flex justify-center">
              <div className="text-center text-slate-400 max-w-md">
                <Database size={48} className="mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No queries found</h3>
                <p className="mb-4">
                  {activeFilters.folder || activeFilters.tags.length > 0 || searchTerm
                    ? "No queries match your search filters. Try adjusting your search criteria or clearing filters."
                    : "Get started by creating your first AQL query."}
                </p>
                {activeFilters.folder || activeFilters.tags.length > 0 || searchTerm ? (
                  <button
                    onClick={handleResetFilters}
                    className="px-4 py-2 bg-slate-700 text-slate-300 rounded-md hover:bg-slate-600"
                  >
                    Clear Filters
                  </button>
                ) : (
                  <button
                    onClick={() => setIsCreatingNew(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Create Your First Query
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Query List/Tree */}
          {!loading && !error && filteredQueries.length > 0 && (
            <>
              {viewMode === 'tree' ? (
                <AQLQueryExplorer
                  queries={filteredQueries}
                  onEditQuery={setSelectedQuery}
                  onDeleteQuery={handleDeleteQuery}
                  onDuplicateQuery={handleDuplicateQuery}
                  onCreateFolder={(name) => {
                    setShowMetadataDashboard(true);
                  }}
                  onFolderSelect={handleFolderFilter}
                  activeFolder={activeFilters.folder}
                  activeTag={activeFilters.tags.length === 1 ? activeFilters.tags[0] : null}
                  // Remove the tag selection capability from tree view for now
                  onTagSelect={() => {}}
                />
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredQueries.map(query => (
                    <div
                      key={query._id}
                      className="bg-slate-800 border border-slate-700 rounded-lg p-4 hover:border-blue-500 transition-colors cursor-pointer"
                      onClick={() => setSelectedQuery(query)}
                    >
                      <h3 className="font-medium text-slate-200 mb-1 truncate">{query.name}</h3>
                      {query.description && (
                        <p className="text-sm text-slate-400 mb-2 line-clamp-2">{query.description}</p>
                      )}
                      <div className="flex items-center text-xs text-slate-500 mb-2">
                        <FolderTree
                          size={12}
                          className="mr-1 text-yellow-500 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFolderFilter(query.folderId);
                          }}
                        />
                        <span
                          className="truncate hover:text-yellow-500 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFolderFilter(query.folderId);
                          }}
                        >
                          {getFolderName(query.folderId)}
                        </span>
                      </div>
                      {query.tags && query.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                          {query.tags.map((tag, i) => {
                            const tagName = typeof tag === 'string' ? tag : tag.name;
                            const tagObj = metadata.tags.find(t => t.name === tagName) || { name: tagName };
                            const colors = getTagColors(tagName, tagObj.color);
                            // Remove interactive features from tag display in grid view
                            return (
                              <div
                                key={i}
                                className="flex items-center bg-slate-700 text-slate-300 px-2 py-0.5 rounded-md text-xs"
                              >
                                <Tag size={10} className={`mr-1 ${colors.text}`} />
                                <span>{tagName}</span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                      <div className="flex justify-between text-xs text-slate-500 pt-2 mt-2 border-t border-slate-700">
                        <span>
                          Updated: {new Date(query.updatedAt).toLocaleDateString()}
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDuplicateQuery(query);
                            }}
                            className="text-slate-500 hover:text-green-400"
                            title="Duplicate query"
                          >
                            Duplicate
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteQuery(query._id);
                            }}
                            className="text-slate-500 hover:text-red-400"
                            title="Delete query"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Metadata Dashboard Modal */}
      {showMetadataDashboard && (
        <MetadataDashboard onClose={() => setShowMetadataDashboard(false)} />
      )}
    </div>
  );
};

export default AQLQueryManagement;