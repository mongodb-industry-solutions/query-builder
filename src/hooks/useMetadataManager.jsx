// src/hooks/useMetadataManager.js
import { useState, useEffect, useCallback } from 'react';

export default function useMetadataManager() {
  const [metadata, setMetadata] = useState({ tags: [], folders: [], environments: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load metadata from API
  const loadMetadata = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [tags, folders, environments] = await Promise.all([
        fetch('/api/internal/aql-metadata?category=tags').then(res => res.ok ? res.json() : []),
        fetch('/api/internal/aql-metadata?category=folders').then(res => res.ok ? res.json() : []),
        fetch('/api/internal/aql-metadata?category=environments').then(res => res.ok ? res.json() : []),
      ]);

      setMetadata({ tags, folders, environments });
    } catch (err) {
      console.error('Error loading metadata:', err);
      setError('Failed to load metadata');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load metadata on mount
  useEffect(() => {
    console.log("MetadataManager mounted, loading metadata...");
    loadMetadata();
  }, [loadMetadata]);

  // CRUD functions that refresh metadata after each operation
  const createTag = async (tagName) => {
    if (!tagName.trim()) return null;
    try {
      const response = await fetch('/api/internal/aql-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: tagName, category: 'tags' }),
      });

      if (response.ok) {
        const newTag = await response.json(); 
        await loadMetadata(); 
        return newTag; 
      }
    } catch (err) {
      console.error('Error creating tag:', err);
    }
    return null;
};

  const updateTag = async (tag) => {
    if (!tag?._id) return;
    try {
      const response = await fetch('/api/internal/aql-metadata', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tag),
      });

      if (response.ok) await loadMetadata();
    } catch (err) {
      console.error('Error updating tag:', err);
    }
  };

  const deleteTag = async (tagId) => {
    try {
      const response = await fetch('/api/internal/aql-metadata', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: tagId, category: 'tags' }),
      });

      if (response.ok) await loadMetadata();
    } catch (err) {
      console.error('Error deleting tag:', err);
    }
  };

  const createFolder = async (folderPath) => {
    if (!folderPath.trim()) return null;
    try {
      const response = await fetch('/api/internal/aql-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: folderPath, category: 'folders' }),
      });

      if (response.ok) await loadMetadata();
    } catch (err) {
      console.error('Error creating folder:', err);
    }
  };

  const updateFolder = async (folder) => {
    if (!folder?._id) return;
    try {
      const response = await fetch('/api/internal/aql-metadata', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(folder),
      });
  
      if (response.ok) await loadMetadata();
    } catch (err) {
      console.error('Error updating folder:', err);
    }
  };

  const deleteFolder = async (folderId) => {
    try {
      const response = await fetch('/api/internal/aql-metadata', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: folderId, category: 'folders' }),
      });

      if (response.ok) await loadMetadata();
    } catch (err) {
      console.error('Error deleting folder:', err);
    }
  };

  const saveEnvironment = async (environment) => {
    try {
      const method = environment._id ? 'PUT' : 'POST';
      const response = await fetch('/api/internal/aql-metadata', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(environment),
      });

      if (response.ok) await loadMetadata();
    } catch (err) {
      console.error('Error saving environment:', err);
    }
  };

  const deleteEnvironment = async (environmentId) => {
    try {
      const response = await fetch('/api/internal/aql-metadata', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: environmentId, category: 'environments' }),
      });

      if (response.ok) await loadMetadata();
    } catch (err) {
      console.error('Error deleting environment:', err);
    }
  };

  const updateEnvironment = async (environment) => {
    if (!environment?._id || !environment?.name) {
      console.error("Error: Missing _id or name for updating environment.");
      return;
    }
  
    try {
      const response = await fetch('/api/internal/aql-metadata', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...environment,
          category: "environments", // 🔥 Ensure category is included
        }),
      });
  
      if (response.ok) {
        await loadMetadata();
      } else {
        const errorData = await response.json();
        console.error("Error updating environment:", errorData);
      }
    } catch (err) {
      console.error('Error updating environment:', err);
    }
  };


  const getQueriesUsingMetadata = async (metadataId, category) => {
    try {
      const response = await fetch(`/api/internal/aql-queries?${category}=${metadataId}`);
      if (!response.ok) return [];
      return await response.json();
    } catch (err) {
      console.error('Error fetching queries using metadata:', err);
      return [];
    }
  };


  // Update metadata references in queries
  const updateMetadataReferences = useCallback(async (oldId, newId, metadataType) => {
    // Check for identity update (no-op)
    if (oldId === newId) return [];
    
    try {
      // Fetch all queries
      const response = await fetch('/api/internal/aql-queries');
      if (!response.ok) return [];
      
      const queries = await response.json();
      const updatedQueries = [];
      
      // Process each query
      for (const query of queries) {
        let needsUpdate = false;
        
        if (metadataType === 'folders' && query.folderId === oldId) {
          query.folderId = newId;
          needsUpdate = true;
        }
        
        if (metadataType === 'tags' && Array.isArray(query.tags)) {
          // Get tag names for old and new IDs
          const oldTag = metadata.tags.find(t => t._id === oldId);
          const newTag = metadata.tags.find(t => t._id === newId);
          
          if (oldTag && newTag) {
            const oldTagName = oldTag.name;
            const newTagName = newTag.name;
            
            // Replace tag references
            if (query.tags.some(t => 
              (typeof t === 'string' && t === oldTagName) ||
              (typeof t === 'object' && t.name === oldTagName)
            )) {
              // Normalize all tags to strings for consistency
              query.tags = query.tags.map(t => {
                const tagName = typeof t === 'string' ? t : t.name;
                return tagName === oldTagName ? newTagName : tagName;
              });
              needsUpdate = true;
            }
          }
        }
        
        if (metadataType === 'environments' && Array.isArray(query.selectedEnvironments)) {
          if (query.selectedEnvironments.includes(oldId)) {
            query.selectedEnvironments = query.selectedEnvironments.map(id =>
              id === oldId ? newId : id
            );
            needsUpdate = true;
          }
        }
        
        // Update query if needed
        if (needsUpdate) {
          try {
            const updateResponse = await fetch('/api/internal/aql-queries', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(query)
            });
            
            if (updateResponse.ok) {
              updatedQueries.push(query);
            }
          } catch (err) {
            console.error('Error updating query:', err);
          }
        }
      }
      
      return updatedQueries;
    } catch (error) {
      console.error('Error updating metadata references:', error);
      return [];
    }
  }, [metadata.tags]);

  return {
    metadata,
    loading,
    error,
    reloadMetadata: loadMetadata,
    actions: {
      createTag,
      updateTag,
      deleteTag,
      createFolder,
      deleteFolder,
      updateFolder, 
      saveEnvironment,
      updateEnvironment,
      deleteEnvironment,
      getQueriesUsingMetadata,
      updateMetadataReferences,
    },
  };
}