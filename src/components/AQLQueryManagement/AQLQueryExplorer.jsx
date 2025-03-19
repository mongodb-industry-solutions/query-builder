// src/app/components/AQLQueryManagement/AQLQueryExplorer.jsx
"use client";

import React, { useState, useEffect } from 'react';
import { FolderTree, ChevronRight, ChevronDown, Edit, Trash, Copy, Download, ExternalLink, Plus, Tag as TagIcon } from 'lucide-react';
import PropTypes from 'prop-types';
import useMetadataManager from '@/hooks/useMetadataManager';
import { getTagColors } from '@/lib/utils';

// Export functionality moved to separate component for clarity
const ExportQueryButton = ({ query }) => {
  const handleExport = (e) => {
    e.stopPropagation();
    
    // Create a JSON file with the query data
    const queryData = {
      ...query,
      exportedAt: new Date().toISOString(),
      version: "1.0"
    };
    
    const dataStr = JSON.stringify(queryData, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    
    // Create a download link and trigger it
    const exportFileName = `${query.name.replace(/\s+/g, '_')}_query.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileName);
    linkElement.click();
  };
  
  return (
    <button
      onClick={handleExport}
      className="p-1 text-slate-400 hover:text-blue-400"
      title="Export query"
    >
      <Download size={16} />
    </button>
  );
};

// Function to build folder tree structure from flat queries list
const buildFolderTree = (queries, folders) => {
  // Sort folders to ensure parents come before children
  const sortedFolders = [...folders].sort((a, b) => {
    // Root level folders first
    const aDepth = a.name.split('/').length;
    const bDepth = b.name.split('/').length;
    if (aDepth !== bDepth) return aDepth - bDepth;
    // Then alphabetically
    return a.name.localeCompare(b.name);
  });
  
  // Create a map of folder ID to folder object with children array
  const folderMap = {};
  
  // First create the root node
  const tree = {
    _id: 'root',
    name: 'root',
    isFolder: true,
    children: [],
    path: '',
    queries: []
  };
  folderMap['root'] = tree;
  
  // Add all folders to the map
  sortedFolders.forEach(folder => {
    folderMap[folder._id] = {
      ...folder,
      isFolder: true,
      children: [],
      queries: []
    };
  });
  
  // Build folder hierarchy
  sortedFolders.forEach(folder => {
    // Skip if this folder is already processed or doesn't exist in map
    if (!folderMap[folder._id]) return;
    
    const folderPath = folder.name;
    const pathParts = folderPath.split('/');
    
    if (pathParts.length === 1) {
      // Top level folder, add directly to root
      tree.children.push(folderMap[folder._id]);
    } else {
      // This is a subfolder
      const parentPath = pathParts.slice(0, -1).join('/');
      // Find parent folder by path
      const parentFolder = sortedFolders.find(f => f.name === parentPath);
      
      if (parentFolder && folderMap[parentFolder._id]) {
        // Add as child to parent folder
        folderMap[parentFolder._id].children.push(folderMap[folder._id]);
      } else {
        // Parent not found, add to root
        tree.children.push(folderMap[folder._id]);
      }
    }
  });
  
  // Add queries to their respective folders
  queries.forEach(query => {
    if (query.folderId && folderMap[query.folderId]) {
      folderMap[query.folderId].queries.push({
        ...query,
        isFolder: false
      });
    } else {
      // If no folder or folder not found, add to root
      tree.queries.push({
        ...query,
        isFolder: false
      });
    }
  });
  
  return tree;
};

// Query tags component
const QueryTags = ({ tags, metadata, onTagSelect, activeTags = [] }) => {
  if (!tags || !tags.length) return null;
  
  // Only show up to 3 tags in tree view to save space
  const visibleTags = tags.slice(0, 3);
  const hasMoreTags = tags.length > 3;
  
  return (
    <div className="flex flex-wrap gap-1 ml-6 mt-1 mb-1">
      {visibleTags.map((tag, index) => {
        const tagName = typeof tag === 'string' ? tag : tag.name;
        const tagObj = metadata.tags.find(t => t.name === tagName) || { name: tagName };
        const colors = getTagColors(tagName, tagObj.color);
        const isActive = activeTags.includes(tagName);
        
        return (
          <div
            key={index}
            className={`flex items-center ${isActive ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300'} px-1.5 py-0.5 rounded text-xs cursor-pointer hover:bg-slate-600`}
            onClick={(e) => {
              e.stopPropagation();
              onTagSelect(tagName, e);
            }}
            title="Filter by this tag (Ctrl+click to select multiple)"
          >
            <TagIcon size={9} className={`mr-1 ${!isActive ? colors.text : 'text-white'}`} />
            <span>{tagName}</span>
          </div>
        );
      })}
      {hasMoreTags && (
        <div className="text-xs text-slate-500">
          +{tags.length - 3} more
        </div>
      )}
    </div>
  );
};

// Recursive folder node component
const FolderNode = ({ 
  node, 
  level = 0, 
  onEditQuery, 
  onDeleteQuery, 
  onDuplicateQuery, 
  onCreateFolder,
  onFolderSelect,
  activeFolder,
  onTagSelect,
  metadata,
  onLoadInBuilder
}) => {
  const [isExpanded, setIsExpanded] = useState(level === 0 || node._id === activeFolder);
  
  // Auto-expand if this folder or any child is active
  useEffect(() => {
    const checkIfActive = (folder) => {
      if (folder._id === activeFolder) return true;
      if (folder.children) {
        return folder.children.some(child => child.isFolder && checkIfActive(child));
      }
      return false;
    };
    
    if (activeFolder && checkIfActive(node)) {
      setIsExpanded(true);
    }
  }, [activeFolder, node]);

  const handleToggle = (e) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };
  
  const handleFolderClick = (e) => {
    e.stopPropagation();
    onFolderSelect(node._id === 'root' ? null : node._id);
  };

  // If this is a folder
  return (
    <div>
      {/* Folder header (only show if not root or if root has direct queries) */}
      {(node.name !== 'root' || node.queries.length > 0) && (
        <div
          className={`flex items-center py-1 px-2 hover:bg-slate-700 cursor-pointer rounded ${
            activeFolder === node._id ? 'bg-blue-900/30 text-blue-300' : ''
          }`}
          onClick={handleFolderClick}
        >
          <div className="w-4 mr-1">
            {node.children.length > 0 || node.queries.length > 0 ? (
              isExpanded ?
                <ChevronDown 
                  className="text-slate-400" 
                  size={16} 
                  onClick={handleToggle} 
                /> :
                <ChevronRight 
                  className="text-slate-400" 
                  size={16} 
                  onClick={handleToggle} 
                />
            ) : <span className="w-4" />}
          </div>
          <FolderTree size={16} className="text-yellow-500 mr-2" />
          <div className="text-slate-200 font-medium">
            {node.name === 'root' ? '(Root)' : node.name.split('/').pop()}
          </div>
          <div className="ml-2 text-xs text-slate-500">
            ({node.queries.length})
          </div>
        </div>
      )}

      {/* Folder children & queries */}
      {isExpanded && (
        <div className={node.name !== 'root' ? "ml-6" : ""}>
          {/* Nested folders first */}
          {node.children
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((child) => (
              <FolderNode
                key={`folder-${child._id}`}
                node={child}
                level={level + 1}
                onEditQuery={onEditQuery}
                onDeleteQuery={onDeleteQuery}
                onDuplicateQuery={onDuplicateQuery}
                onCreateFolder={onCreateFolder}
                onFolderSelect={onFolderSelect}
                activeFolder={activeFolder}
                onTagSelect={onTagSelect}
                metadata={metadata}
                onLoadInBuilder={onLoadInBuilder}
              />
            ))}
          
          {/* Queries in this folder */}
          {node.queries.length > 0 && (
            <div className="space-y-1 mt-1">
              {node.queries
                .sort((a, b) => a.name.localeCompare(b.name))
                .map(query => (
                  <div key={`query-${query._id}`}>
                    <div 
                      className="pl-6 py-2 hover:bg-slate-700 rounded flex items-center group"
                      onClick={() => onEditQuery(query)}
                    >
                      <div className="flex-1 text-slate-300 truncate" title={query.description || query.name}>
                        {query.name}
                      </div>
                      <div className="hidden group-hover:flex gap-1">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditQuery(query);
                          }}
                          className="p-1 text-slate-400 hover:text-blue-400"
                          title="Edit query"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onDuplicateQuery(query);
                          }}
                          className="p-1 text-slate-400 hover:text-green-400"
                          title="Duplicate query"
                        >
                          <Copy size={16} />
                        </button>
                        <ExportQueryButton query={query} />
                        {onLoadInBuilder && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onLoadInBuilder(query);
                            }}
                            className="p-1 text-slate-400 hover:text-green-400"
                            title="Load in AQL Builder"
                          >
                            <ExternalLink size={16} />
                          </button>
                        )}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Are you sure you want to delete "${query.name}"?`)) {
                              onDeleteQuery(query._id);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-red-400"
                          title="Delete query"
                        >
                          <Trash size={16} />
                        </button>
                      </div>
                    </div>
                    
                    {/* Display tags underneath the query */}
                    {query.tags && query.tags.length > 0 && (
                      <QueryTags 
                        tags={query.tags} 
                        metadata={metadata}
                        onTagSelect={onTagSelect}
                      />
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Main component - THIS WAS MISSING IN THE ORIGINAL CODE
const AQLQueryExplorer = ({ 
  queries, 
  onEditQuery, 
  onDeleteQuery, 
  onDuplicateQuery, 
  onCreateFolder, 
  onFolderSelect, 
  activeFolder, 
  activeTag,
  onTagSelect,
  onLoadInBuilder 
}) => {
  const { metadata } = useMetadataManager();
  const [folderTree, setFolderTree] = useState(null);
  
  // Build folder tree whenever queries or folders change
  useEffect(() => {
    if (queries.length) {
      // Build folder tree structure
      const tree = buildFolderTree(queries, metadata.folders);
      setFolderTree(tree);
    }
  }, [queries, metadata.folders]);
  
  if (!folderTree) {
    return (
      <div className="p-4 bg-slate-800 rounded-lg text-slate-400">
        Loading folder structure...
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-lg p-4 min-h-[400px]">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-medium text-slate-200">Query Library</h3>
        <button
          onClick={() => onCreateFolder('New Folder')}
          className="p-1 px-2 text-sm bg-slate-700 text-slate-300 rounded hover:bg-slate-600 flex items-center gap-1"
          title="Create new folder"
        >
          <Plus size={14} />
          New Folder
        </button>
      </div>
      
      <div className="border border-slate-700 rounded-lg p-2 bg-slate-800">
        <FolderNode
          node={folderTree}
          onEditQuery={onEditQuery}
          onDeleteQuery={onDeleteQuery}
          onDuplicateQuery={onDuplicateQuery}
          onCreateFolder={onCreateFolder}
          onFolderSelect={onFolderSelect}
          activeFolder={activeFolder}
          onTagSelect={onTagSelect}
          metadata={metadata}
          onLoadInBuilder={onLoadInBuilder}
        />
      </div>
    </div>
  );
};

// PropTypes definitions
AQLQueryExplorer.propTypes = {
  queries: PropTypes.array.isRequired,
  onEditQuery: PropTypes.func.isRequired,
  onDeleteQuery: PropTypes.func.isRequired,
  onDuplicateQuery: PropTypes.func.isRequired,
  onCreateFolder: PropTypes.func.isRequired,
  onFolderSelect: PropTypes.func,
  activeFolder: PropTypes.string,
  activeTags: PropTypes.array,
  onTagSelect: PropTypes.func,
  onLoadInBuilder: PropTypes.func
};

QueryTags.propTypes = {
  tags: PropTypes.array.isRequired,
  metadata: PropTypes.object.isRequired,
  onTagSelect: PropTypes.func.isRequired,
  activeTags: PropTypes.array
};

FolderNode.propTypes = {
  node: PropTypes.object.isRequired,
  level: PropTypes.number,
  onEditQuery: PropTypes.func.isRequired,
  onDeleteQuery: PropTypes.func.isRequired,
  onDuplicateQuery: PropTypes.func.isRequired,
  onCreateFolder: PropTypes.func.isRequired,
  onFolderSelect: PropTypes.func.isRequired,
  activeFolder: PropTypes.string,
  onTagSelect: PropTypes.func,
  metadata: PropTypes.object.isRequired,
  onLoadInBuilder: PropTypes.func
};

ExportQueryButton.propTypes = {
  query: PropTypes.object.isRequired
};

export default AQLQueryExplorer;