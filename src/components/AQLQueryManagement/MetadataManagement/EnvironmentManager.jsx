// src/components/AQLQueryManagement/MetadataManagement/EnvironmentManager.jsx
import React, { useState } from 'react';
import { Database, Edit2, Trash2, Check, X, Search, Plus, AlertCircle, Eye, EyeOff, Settings } from 'lucide-react';
import JSONEditor from '../../common/JSONEditor'; // Import the new JSONEditor component

const EnvironmentManager = ({ environments, actions, loading, error }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState(null);
  const [statusMessage, setStatusMessage] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedEnv, setSelectedEnv] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    isActive: true,
    connectionString: '',
    database: '',
    description: '',
    metaDescription: '{}'
  });
  const [showConnectionString, setShowConnectionString] = useState({});

  // Filter items based on search term
  const filteredItems = environments.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => a.name.localeCompare(b.name));

  // Start editing an environment or create a new one
  const handleStartEdit = (env = null) => {
    if (env) {
      setSelectedEnv(env);
      setEditForm({
        name: env.name || '',
        isActive: env.isActive !== false,
        connectionString: env.connectionString || '',
        database: env.database || '',
        description: env.description || '',
        metaDescription: env.metaDescription || '{}'
      });
    } else {
      setSelectedEnv(null);
      setEditForm({
        name: '',
        isActive: true,
        connectionString: '',
        database: '',
        description: '',
        metaDescription: '{}'
      });
    }
    setIsEditing(true);
  };

  // Save environment (create or update)
  const handleSave = async () => {
    if (!editForm.name.trim()) return; // Prevent saving empty names
  
    try {
      if (selectedEnv) {
        // Update existing environment
        await actions.updateEnvironment({
          ...selectedEnv, 
          ...editForm,
          category: "environments", 
          updatedAt: new Date().toISOString(),
        });
      } else {
        // Create new environment
        await actions.createEnvironment({
          ...editForm,
          category: "environments",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
  
      setStatusMessage({
        type: "success",
        text: selectedEnv ? "Environment updated successfully" : "Environment created successfully",
      });
  
      setTimeout(() => setStatusMessage(null), 3000);
      setIsEditing(false);
  
      // ✅ Reset the form correctly
      setEditForm({
        name: '',
        isActive: true,
        connectionString: '',
        database: '',
        description: '',
        metaDescription: '{}',
      }); 
    } catch (error) {
      console.error("Error saving environment:", error);
      setStatusMessage({
        type: "error",
        text: "Error saving environment. Please try again.",
      });
    }
  };

  // Delete environment
  const handleDeleteItem = async (item) => {
    try {
      setStatusMessage({ 
        type: 'info', 
        text: `Checking if environment is in use...` 
      });
      
      // Check if any queries are using this item
      const queriesUsingItem = await actions.getQueriesUsingMetadata(item._id, 'environments');
      if (queriesUsingItem.length > 0) {
        setStatusMessage({ 
          type: 'warning', 
          text: `Cannot delete: ${queriesUsingItem.length} queries are using this environment.` 
        });
        setTimeout(() => setStatusMessage(null), 5000);
        setShowConfirmDelete(null);
        return;
      }
      
      // If no queries are using it, delete it
      await actions.deleteEnvironment(item._id);
      
      setStatusMessage({ 
        type: 'success', 
        text: `Environment deleted successfully` 
      });
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err) {
      setStatusMessage({ 
        type: 'error', 
        text: `Error deleting environment: ${err.message}` 
      });
    }
    
    setShowConfirmDelete(null);
  };

  // Toggle show/hide for connection string
  const toggleConnectionStringVisibility = (envId) => {
    setShowConnectionString(prev => ({
      ...prev,
      [envId]: !prev[envId]
    }));
  };

  // Handle meta description changes
  const handleMetaDescriptionChange = (value) => {
    setEditForm(prev => ({
      ...prev,
      metaDescription: value
    }));
  };

  // Render form for editing
  if (isEditing) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
        <h3 className="text-lg font-medium text-slate-200 mb-4">
          {selectedEnv ? 'Edit Environment' : 'New Environment'}
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Environment Name
            </label>
            <input
              type="text"
              value={editForm.name}
              onChange={e => setEditForm({...editForm, name: e.target.value})}
              className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-slate-300 
                      focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="PRO, DEV, etc."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Description
            </label>
            <input
              type="text"
              value={editForm.description}
              onChange={e => setEditForm({...editForm, description: e.target.value})}
              className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-slate-300 
                      focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Production environment, Testing, etc."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Connection String
            </label>
            <input
              type="text"
              value={editForm.connectionString}
              onChange={e => setEditForm({...editForm, connectionString: e.target.value})}
              className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-slate-300 
                      focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="mongodb://username:password@host:port"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Database Name
            </label>
            <input
              type="text"
              value={editForm.database}
              onChange={e => setEditForm({...editForm, database: e.target.value})}
              className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md text-slate-300 
                      focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="database-name"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={editForm.isActive}
              onChange={e => setEditForm({...editForm, isActive: e.target.checked})}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-600 rounded"
            />
            <label htmlFor="isActive" className="text-sm text-slate-300">
              Active Environment
            </label>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Database Metadata Description
            </label>
            {/* Replace CodeEditor with our new JSONEditor */}
            <JSONEditor
              initialValue={editForm.metaDescription}
              onChange={handleMetaDescriptionChange}
              height="200px"
            />
            <div className="mt-1 text-xs text-slate-500">
              Describe the database structure in JSON format
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 bg-slate-700 text-slate-300 rounded-md hover:bg-slate-600"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
            >
              <Check size={16} />
              {selectedEnv ? 'Update Environment' : 'Save Environment'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Status Messages */}
      {statusMessage && (
        <div className={`mb-4 p-3 rounded-md flex items-center ${
          statusMessage.type === 'error' ? 'bg-red-900/30 text-red-300' :
          statusMessage.type === 'warning' ? 'bg-yellow-900/30 text-yellow-300' :
          statusMessage.type === 'success' ? 'bg-green-900/30 text-green-300' :
          'bg-blue-900/30 text-blue-300'
        }`}>
          {statusMessage.type === 'error' && <AlertCircle size={16} className="mr-2 flex-shrink-0" />}
          {statusMessage.type === 'warning' && <AlertCircle size={16} className="mr-2 flex-shrink-0" />}
          {statusMessage.type === 'success' && <Check size={16} className="mr-2 flex-shrink-0" />}
          <span className="text-sm">{statusMessage.text}</span>
        </div>
      )}

      {/* Create New Environment Button */}
      <div className="mb-4">
        <button
          onClick={() => handleStartEdit()}
          className="w-full p-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center gap-2"
        >
          <Plus size={16} />
          Add New Environment
        </button>
      </div>

      {/* Search */}
      <div className="mb-4 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={16} className="text-slate-500" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Search environments..."
          className="w-full p-2 pl-10 bg-slate-700 border border-slate-600 rounded-md text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="text-slate-400 text-center p-6">Loading environments...</div>
      ) : error ? (
        <div className="bg-red-900/30 text-red-300 p-4 rounded-md">
          <h3 className="font-medium mb-2">Error loading environments</h3>
          <p>{error}</p>
        </div>
      ) : (
        /* Environments List */
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredItems.length === 0 ? (
            <div className="text-slate-500 text-center p-4">
              {searchTerm 
                ? `No environments found matching "${searchTerm}"` 
                : 'No environments found. Add one above.'}
            </div>
          ) : (
            filteredItems.map(env => (
              <div
                key={env._id}
                className="bg-slate-700 border border-slate-600 rounded-lg p-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database size={16} className="text-blue-400" />
                    <h4 className="font-medium text-slate-200">{env.name}</h4>
                    {env.isActive && (
                      <span className="px-2 py-0.5 bg-green-900/50 text-green-400 text-xs rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStartEdit(env)}
                      className="p-1 text-slate-400 hover:text-blue-400 rounded"
                      title="Edit environment"
                    >
                      <Settings size={16} />
                    </button>
                    <button
                      onClick={() => setShowConfirmDelete(env._id)}
                      className="p-1 text-slate-400 hover:text-red-400 rounded"
                      title="Delete environment"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                {env.description && (
                  <p className="text-sm text-slate-400 mt-1">{env.description}</p>
                )}
                <div className="text-xs text-slate-500 mt-2 space-y-1">
                  {env.database && (
                    <div>Database: {env.database}</div>
                  )}
                  {env.connectionString && (
                    <div className="flex items-center">
                      <span>Connection: </span>
                      <span className="ml-1">
                        {showConnectionString[env._id] 
                          ? env.connectionString 
                          : '••••••••••••••••••••'}
                      </span>
                      <button
                        onClick={() => toggleConnectionStringVisibility(env._id)}
                        className="ml-2 text-slate-400 hover:text-blue-400"
                        title={showConnectionString[env._id] ? "Hide connection string" : "Show connection string"}
                      >
                        {showConnectionString[env._id] ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  )}
                  {env.metaDescription && (
                    <div className="mt-2">
                      <div className="text-xs mb-1 text-slate-400">Database Metadata:</div>
                      <div className="bg-slate-800 p-2 rounded-md overflow-x-auto text-slate-300">
                        {/* Display formatted JSON in read-only mode */}
                        <JSONEditor
                          initialValue={
                            JSON.stringify(
                              JSON.parse(
                                env.metaDescription.startsWith('{') 
                                  ? env.metaDescription 
                                  : '{}'
                              ), 
                              null, 2
                            )
                          }
                          readOnly={true}
                          height="150px"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Confirm Delete Modal */}
      {showConfirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-6 rounded-lg max-w-md w-full">
            <h3 className="text-lg font-medium text-red-400 mb-4">Confirm Delete</h3>
            <p className="text-slate-300 mb-6">
              Are you sure you want to delete this environment? 
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowConfirmDelete(null)}
                className="px-4 py-2 bg-slate-700 text-slate-300 rounded hover:bg-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteItem(filteredItems.find(item => item._id === showConfirmDelete))}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnvironmentManager;