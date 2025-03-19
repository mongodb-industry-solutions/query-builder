// src/app/components/queryBuilder/TemplateManagment/TemplateManagement.jsx
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import TemplateUpload from './TemplateUpload';
import TemplateSearch from './TemplateSearch';
import TemplateList from './TemplateList';
import { Loader2 } from 'lucide-react';

/**
 * Recursively traverses a template tree node and populates the registry.
 * @param {Object} node - A node in the template tree.
 * @param {string} currentPath - The absolute path accumulated so far.
 * @param {Object} registry - The registry mapping archetype IDs to an array of paths.
 */
function traverseTemplate(node, currentPath, registry) {
  if (!node) return;
  if (node.archetype_id) {
    if (!registry[node.archetype_id]) {
      registry[node.archetype_id] = [];
    }
    registry[node.archetype_id].push(currentPath);
  }
  // Assuming children are stored in node.children
  if (node.children && Array.isArray(node.children)) {
    node.children.forEach((child, index) => {
      // Use child.name if available; otherwise fallback to an index-based identifier.
      const childIdentifier = child.name || child.nodeId || `child${index}`;
      const childPath = `${currentPath}/${childIdentifier}`;
      traverseTemplate(child, childPath, registry);
    });
  }
}

/**
 * Builds the registry for all templates.
 * Assumes that each template has a webTemplate.tree.
 * @param {Array} templates - The list of templates.
 * @returns {Object} The registry mapping archetype IDs to arrays of absolute paths.
 */
function buildRegistry(templates) {
  const registry = {};
  templates.forEach(template => {
    const tree = template.webTemplate?.tree;
    if (tree) {
      // Use the template name as the root path, or fallback to "templateRoot"
      const rootPath = template.name || "templateRoot";
      traverseTemplate(tree, rootPath, registry);
    }
  });
  return registry;
}

/**
 * Given an archetype ID and an optional partial path, returns all matching absolute paths.
 * @param {Object} registry - The registry built from the templates.
 * @param {string} archetypeId - The archetype ID to search for.
 * @param {string} [partial] - Optional partial path to filter on.
 * @returns {Array<string>} Array of absolute paths.
 */
export function expandPartialPath(registry, archetypeId, partial = "") {
  if (!registry[archetypeId]) return [];
  if (partial) {
    return registry[archetypeId].filter(path => path.includes(partial));
  }
  return registry[archetypeId];
}

const TemplateManagement = ({ templates, reloadTemplates }) => {
  const [filteredTemplates, setFilteredTemplates] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Build the registry once every time the templates change.
  const templateRegistry = useMemo(() => buildRegistry(templates), [templates]);

  useEffect(() => {
    setFilteredTemplates(templates);
    setLoading(false);
  }, [templates]);

  // (Optional) Log the registry for debugging.
  useEffect(() => {
    console.log("Built Template Registry:", templateRegistry);
  }, [templateRegistry]);

  const handleUpload = async (newTemplates) => {
    try {
      setError(null);
      
      // Check for duplicates before uploading
      for (const newTemplate of newTemplates) {
        const existingTemplate = templates.find(t => t.name === newTemplate.name);
        if (existingTemplate) {
          setError(`Template "${newTemplate.name}" already exists. Please use a different name.`);
          return; // Stop the upload process
        }
      }
      
      // Proceed with upload if no duplicates
      await Promise.all(
        newTemplates.map(template =>
          fetch('/api/internal/templates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(template)
          })
        )
      );
      
      setError(null);
      await reloadTemplates();
    } catch (error) {
      console.error(error);
      setError(error.message || 'Failed to upload templates');
    }
  };

  const handleSearch = (query) => {
    const filtered = templates.filter(template =>
      template.name.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredTemplates(filtered);
  };

  const handleDelete = async (id) => {
    try {
      setError(null);
      const response = await fetch('/api/internal/templates', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (!response.ok) {
        throw new Error("Failed to delete template from API");
      }
      setError(null);
      await reloadTemplates();
    } catch (error) {
      console.error(error);
      setError(error.message || 'Failed to delete template');
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-900/50 text-red-300 rounded-md border border-red-700">
          <h3 className="text-lg font-medium mb-2">Error</h3>
          <p>{error}</p>
        </div>
      )}

      {/* Info message with embedded OpenEHR Designer link */}
      <div className="mb-4 p-4 bg-slate-800 rounded-md">
        <p className="text-slate-300">
          Upload your "OpenEHR Web Templates" to create AQL queries. You can build and download these web templates from&nbsp;
          <a
            href="https://tools.openehr.org/designer/#/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 underline"
          >
            OpenEHR Designer
          </a>.
        </p>
      </div>

      <TemplateUpload
        onUpload={handleUpload}
        onError={(err) => setError(err)}
      />

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin text-slate-300" size={32} />
          <span className="ml-2 text-slate-300">Loading templates...</span>
        </div>
      ) : (
        <>
          <TemplateSearch onSearch={handleSearch} />
          <TemplateList
            templates={filteredTemplates}
            onDelete={handleDelete}
          />
        </>
      )}
    </div>
  );
};

export default TemplateManagement;