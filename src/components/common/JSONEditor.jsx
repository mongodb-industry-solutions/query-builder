// src/components/common/JSONEditor.jsx
'use client';

import React, { useState, useRef } from 'react';
import Editor from "@monaco-editor/react";
import { Copy, Brush, Check } from 'lucide-react';

const JSONEditor = ({ 
  initialValue = '{}', 
  onChange, 
  height = "200px",
  readOnly = false
}) => {
  const [jsonInput, setJsonInput] = useState(initialValue);
  const [copyMessage, setCopyMessage] = useState('');
  const [formatMessage, setFormatMessage] = useState('');
  const [isValidJson, setIsValidJson] = useState(true);
  const editorRef = useRef(null);

  // Handle copy to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonInput);
      setCopyMessage('Copied!');
      setTimeout(() => setCopyMessage(''), 2000);
    } catch (error) {
      console.error('Copy failed', error);
    }
  };

  // Handle JSON formatting
  const handleFormat = () => {
    if (!editorRef.current) return;

    try {
      const parsed = JSON.parse(jsonInput);
      const formatted = JSON.stringify(parsed, null, 2);
      
      const editor = editorRef.current;
      const model = editor.getModel();

      if (!model) return;

      // Push undo stop before formatting (ensures user can undo in one step)
      if (model.pushUndoStop) {
        model.pushUndoStop();
      }

      editor.executeEdits("formatJSON", [
        {
          range: model.getFullModelRange(),
          text: formatted,
          forceMoveMarkers: true
        }
      ]);

      // Push another undo stop after formatting so it's one step
      if (model.pushUndoStop) {
        model.pushUndoStop();
      }
      editor.setScrollPosition({ scrollTop: 0, scrollLeft: 0 });
      
      setJsonInput(formatted);
      setIsValidJson(true);
      setFormatMessage('Formatted!');
      setTimeout(() => setFormatMessage(''), 2000);
    } catch (e) {
      setIsValidJson(false);
      console.error('JSON formatting error:', e);
    }
  };

  // Handle JSON input change
  const handleJsonChange = (value) => {
    setJsonInput(value);
    
    try {
      // Check if valid JSON
      JSON.parse(value);
      setIsValidJson(true);
    } catch (e) {
      setIsValidJson(false);
    }
    
    // Call external change handler if provided
    if (onChange) {
      onChange(value);
    }
  };

  return (
    <div className="relative w-full">
      <div className="w-full relative bg-slate-800 rounded-lg">
        <div className="flex items-center justify-end gap-3 mb-2">
          {!readOnly && (
            <button
              onClick={handleFormat}
              className="p-2 text-slate-400 rounded-md hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-opacity-50"
              title={formatMessage || 'Format JSON'}
              disabled={!isValidJson}
            >
              {formatMessage ? <Check size={16} /> : <Brush size={16} />}
            </button>
          )}

          <button
            onClick={handleCopy}
            className="p-2 text-slate-400 rounded-md hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-opacity-50"
            title={copyMessage || 'Copy to clipboard'}
          >
            {copyMessage ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </div>
        <Editor
          height={height}
          theme="vs-dark"
          defaultLanguage="json"
          value={jsonInput}
          onChange={handleJsonChange}
          onMount={(editor) => {
            editorRef.current = editor;
          }}
          className="rounded-lg"
          options={{
            minimap: { enabled: false },
            wordWrap: "on",
            fontSize: 12,
            lineNumbersMinChars: 3,
            padding: { top: 10 },
            readOnly: readOnly,
            stickyScroll: { enabled: false }
          }}
        />
      </div>
      {!isValidJson && !readOnly && (
        <div className="mt-2 p-2 bg-red-900 bg-opacity-50 text-red-300 rounded-md text-xs">
          Invalid JSON. Please check your syntax.
        </div>
      )}
    </div>
  );
};

export default JSONEditor;