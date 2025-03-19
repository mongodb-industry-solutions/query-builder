// src/components/AQLQueryManagement/MetadataManagement/FolderSelector.jsx
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, FolderTree, Plus, Check, X } from 'lucide-react';

const FolderSelector = ({ value, availableFolders, onChange, onCreateFolder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [newFolderMode, setNewFolderMode] = useState(false);
  const [newFolderPath, setNewFolderPath] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setNewFolderMode(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when entering new folder mode
  useEffect(() => {
    if (newFolderMode && inputRef.current) {
      inputRef.current.focus();
    }
  }, [newFolderMode]);

  const handleCreateFolder = async () => {
    if (!newFolderPath.trim()) {
      setErrorMessage('Folder name cannot be empty');
      return;
    }

    // Validate folder path: should only contain alphanumeric characters, spaces, hyphens, underscores, and forward slashes
    const validPattern = /^[a-zA-Z0-9\s\-_\/]+$/;
    if (!validPattern.test(newFolderPath)) {
      setErrorMessage('Folder name contains invalid characters');
      return;
    }

    // Check if folder already exists
    const folderExists = availableFolders.some(
      folder => folder.name.toLowerCase() === newFolderPath.toLowerCase()
    );
    
    if (folderExists) {
      setErrorMessage('Folder already exists');
      return;
    }

    try {
      setErrorMessage('');
      const newFolder = await onCreateFolder(newFolderPath);
      if (newFolder) {
        onChange(newFolder._id);
        setNewFolderMode(false);
        setNewFolderPath('');
        setIsOpen(false);
      }
    } catch (error) {
      console.error("Error creating folder:", error);
      setErrorMessage('Failed to create folder');
    }
  };

  // Helper for identifying nested folder structure
  const buildFolderTree = (folders) => {
    const tree = {};
    
    if (!folders || !Array.isArray(folders)) {
      return tree;
    }
    
    folders.forEach(folder => {
      if (!folder || !folder.name) return;
      
      const parts = folder.name.split('/');
      let current = tree;
      
      parts.forEach((part, index) => {
        if (!current[part]) {
          current[part] = {
            children: {},
            isLeaf: index === parts.length - 1,
            path: parts.slice(0, index + 1).join('/'),
            folder: index === parts.length - 1 ? folder : null
          };
        }
        current = current[part].children;
      });
    });
    
    return tree;
  };

  // Memoize the folder tree for performance
  const folderTree = useMemo(() => {
    return buildFolderTree(availableFolders);
  }, [availableFolders]);

  // Render the folder tree recursively
  const renderFolderTree = (node, level = 0) => {
    if (!node) return null;
    
    return Object.keys(node)
      .sort((a, b) => a.localeCompare(b))
      .map(key => {
        const item = node[key];
        if (!item) return null;
        
        const displayId = item.folder ? item.folder._id : null;
        const isSelected = displayId && value === displayId;
        
        return (
          <div key={item.path || key}>
            <div
              className={`px-3 py-2 text-sm hover:bg-slate-700 cursor-pointer flex items-center ${
                isSelected ? 'bg-blue-900/30 text-blue-300' : 'text-slate-300'
              }`}
              style={{ paddingLeft: `${(level * 12) + 12}px` }}
              onClick={() => {
                if (item.folder) {
                  onChange(item.folder._id);
                  setIsOpen(false);
                }
              }}
            >
              <FolderTree size={14} className="mr-2 text-yellow-500" />
              {key}
            </div>
            {item.children && Object.keys(item.children).length > 0 && 
              renderFolderTree(item.children, level + 1)}
          </div>
        );
      });
  };

  // Find the currently selected folder for display
  const selectedFolder = useMemo(() => {
    return availableFolders?.find(folder => folder._id === value) || null;
  }, [availableFolders, value]);

  return (
    <div className="space-y-2 relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-slate-300">
        Folder
      </label>
      <div
        className="p-2 bg-slate-700 border border-slate-600 rounded-md text-slate-300 flex items-center justify-between cursor-pointer"
        onClick={() => {
          if (!availableFolders || availableFolders.length === 0) return;
          setIsOpen(!isOpen);
          setNewFolderMode(false);
          setErrorMessage('');
        }}
      >
        <div className="flex items-center">
          {selectedFolder ? (
            <>
              <FolderTree size={16} className="mr-2 text-yellow-500" />
              <span>{selectedFolder.name}</span>
            </>
          ) : (
            <span className="text-slate-500">
              {!availableFolders ? "Loading folders..." : 
               availableFolders.length === 0 ? "No folders available" : 
               "Select a folder..."}
            </span>
          )}
        </div>
        <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      
      {isOpen && availableFolders && availableFolders.length >= 0 && (
        <div className="fixed inset-0 z-40 bg-black bg-opacity-20" 
             onClick={(e) => {
               if (e.target === e.currentTarget) {
                 setIsOpen(false);
                 setNewFolderMode(false);
               }
             }}>
          <div className="absolute z-50 bg-slate-800 border border-slate-700 rounded-md shadow-lg max-h-96 overflow-auto"
               style={{
                 top: dropdownRef.current?.getBoundingClientRect().bottom + window.scrollY + 5 || '0',
                 left: dropdownRef.current?.getBoundingClientRect().left + window.scrollX || '0',
                 width: dropdownRef.current?.offsetWidth || 'auto',
                 maxWidth: '100vw',
               }}>
            {newFolderMode ? (
              <div className="p-3 border-b border-slate-700">
                <div className="mb-2 text-sm text-slate-300 font-medium">Create New Folder</div>
                <div className="flex">
                  <input
                    ref={inputRef}
                    type="text"
                    value={newFolderPath}
                    onChange={e => {
                      setNewFolderPath(e.target.value);
                      setErrorMessage('');
                    }}
                    placeholder="Folder/Subfolder"
                    className={`flex-1 p-2 bg-slate-700 border ${
                      errorMessage ? 'border-red-500' : 'border-slate-600'
                    } rounded-l-md text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleCreateFolder();
                      if (e.key === 'Escape') {
                        setNewFolderMode(false);
                        setErrorMessage('');
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleCreateFolder}
                    className="px-3 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700"
                  >
                    <Check size={16} />
                  </button>
                </div>
                {errorMessage && (
                  <div className="mt-1 text-xs text-red-400">{errorMessage}</div>
                )}
                <div className="mt-2 text-xs text-slate-500">
                  Use / to create nested folders (e.g. "Clinical/Vital Signs")
                </div>
                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setNewFolderMode(false);
                      setErrorMessage('');
                    }}
                    className="px-3 py-1 text-xs bg-slate-700 text-slate-300 rounded-md hover:bg-slate-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div
                  className="px-3 py-2 text-sm border-b border-slate-700 hover:bg-slate-700 cursor-pointer flex items-center text-blue-400"
                  onClick={() => {
                    setNewFolderMode(true);
                    setErrorMessage('');
                  }}
                >
                  <Plus size={14} className="mr-2" />
                  Create new folder
                </div>
                <div
                  className={`px-3 py-2 text-sm hover:bg-slate-700 cursor-pointer flex items-center ${!value ? 'bg-blue-900/30 text-blue-300' : 'text-slate-300'}`}
                  onClick={() => {
                    onChange(null);
                    setIsOpen(false);
                  }}
                >
                  <FolderTree size={14} className="mr-2 text-yellow-500" />
                  (Root)
                </div>
                {renderFolderTree(folderTree)}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FolderSelector;