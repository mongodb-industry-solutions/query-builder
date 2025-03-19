"use client";

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import PropTypes from 'prop-types';

// Helper to extract entry archetypes from the tree
function extractEntryArchetypes(node) {
  let result = {
    evaluation: [],
    admin: [],
    instruction: [],
    action: []
  };
  if (!node || !node.children) return result;
  node.children.forEach(child => {
    const rmType = (child.rmType || "").toLowerCase();
    if (rmType.includes("evaluation")) {
      result.evaluation.push(child);
    } else if (rmType.includes("admin")) {
      result.admin.push(child);
    } else if (rmType.includes("instruction")) {
      result.instruction.push(child);
    } else if (rmType.includes("action")) {
      result.action.push(child);
    } else if (rmType.includes("section")) {
      // Traverse sections recursively
      const sub = extractEntryArchetypes(child);
      result.evaluation = result.evaluation.concat(sub.evaluation);
      result.admin = result.admin.concat(sub.admin);
      result.instruction = result.instruction.concat(sub.instruction);
      result.action = result.action.concat(sub.action);
    }
  });
  return result;
}

const TemplateUpload = ({ onUpload, onError }) => {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (event) => {
    const files = event.target.files;
    if (!files?.length) return;
    setIsUploading(true);
    const newTemplates = [];
    const filePromises = Array.from(files).map(file => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const content = JSON.parse(e.target.result);
            if (!content.tree) {
              reject(`File ${file.name} is missing required field "tree".`);
              return;
            }
            // Extract metadata from the tree:
            const name = content.templateId ||
              (content.tree.localizedNames && content.tree.localizedNames.en) ||
              content.tree.name ||
              file.name.replace('.json', '');
            const node = content.tree.nodeId || "";
            const description = content.tree.localizedDescriptions
              ? content.tree.localizedDescriptions.en
              : "";
            const entryArchetypes = extractEntryArchetypes(content.tree);

            // Package the object to send to the API:
            const templateData = {
              user: "test", // will be replaced by authenticated user info later
              creationDate: new Date(),
              name,
              webTemplate: {
                tree: content.tree,
                metadata: {
                  node,
                  description,
                  entryArchetypes
                }
              }
            };

            newTemplates.push(templateData);
            resolve();
          } catch (error) {
            reject(`Invalid JSON in file: ${file.name}`);
          }
        };
        reader.onerror = () => {
          reject(`Error reading file: ${file.name}`);
        };
        reader.readAsText(file);
      });
    });

    try {
      await Promise.all(filePromises);
      // Clear any previous errors on successful upload.
      onError(null);
      console.log("Uploading templates:", newTemplates);
      onUpload(newTemplates);
    } catch (error) {
      console.error(error);
      onError(error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <input
          type="file"
          accept=".json"
          onChange={handleFileUpload}
          multiple
          className="hidden"
          id="template-upload"
        />
        <label
          htmlFor="template-upload"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 
            cursor-pointer flex items-center gap-2"
        >
          <Plus size={16} />
          Add Template
        </label>
      </div>
      {isUploading && (
        <div className="text-slate-400 animate-pulse">
          Uploading templates...
        </div>
      )}
    </div>
  );
};

TemplateUpload.propTypes = {
  onUpload: PropTypes.func.isRequired,
  onError: PropTypes.func.isRequired
};

export default TemplateUpload;