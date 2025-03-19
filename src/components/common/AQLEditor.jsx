//src/components/common/AQLEditor.jsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import Editor from "@monaco-editor/react";
import { 
  Copy, 
  Brush, 
  Check, 
  Code, 
  TreePine, 
  ChevronRight 
} from 'lucide-react';
import { formatAQLQuery } from "@/lib/aqlToMql/formatter/formatter";
import validateAQL from "@/lib/aqlToMql/parser/validateAql";
import { parseAql } from "@/lib/aqlToMql/parser/parseAqlAST.js";

const sanitizeAST = (node, visited = new WeakSet()) => {
  if (!node || typeof node !== "object") return node;
  if (visited.has(node)) return undefined; // Prevent circular refs

  visited.add(node);

  let cleanNode = {};
  Object.keys(node).forEach(key => {
    if (
      key !== "parentCtx" &&
      key !== "invokingState" &&
      key !== "start" &&
      key !== "stop" &&
      key !== "ruleIndex"
    ) {
      cleanNode[key] = sanitizeAST(node[key], visited);
    }
  });

  return cleanNode;
};

const AQLEditor = ({ 
  initialValue = '', 
  onAqlChange, 
  onValidation, 
  showAstPanel = false,
  onToggleAstPanel 
}) => {
  const [aqlInput, setAqlInput] = useState(initialValue);
  const [validationResult, setValidationResult] = useState(null);
  const [errorHighlight, setErrorHighlight] = useState([]);
  const [copyMessage, setCopyMessage] = useState('');
  const [formatMessage, setFormatMessage] = useState('');
  const [astOutput, setAstOutput] = useState(null);
  const [astPanelWidth, setAstPanelWidth] = useState(400);
  const editorRef = useRef(null);

  // Effect to parse AST and validate AQL
  useEffect(() => {
    if (!aqlInput.trim()) {
      console.warn("Empty input, skipping AST parsing.");
      setAstOutput(null);
      setValidationResult(null);
      setErrorHighlight([]);
      return;
    }

    try {
      const ast = parseAql(aqlInput);
      
      if (!ast) {
        console.warn("⚠️ AST Parsing failed.");
        setAstOutput(null);
      } else {
        const sanitizedAst = sanitizeAST(ast);
        setAstOutput(sanitizedAst);
      }

      const result = validateAQL(aqlInput);
      setValidationResult(result);
      setErrorHighlight(result.errors || []);

      // Call external validation if provided
      if (onValidation) {
        onValidation(result);
      }
    } catch (error) {
      console.error("❌ AST Parsing Error:", error);
      setAstOutput(null);
    }
  }, [aqlInput, onValidation]);

  // Handle copy to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(aqlInput);
      setCopyMessage('Copied!');
      setTimeout(() => setCopyMessage(''), 2000);
    } catch (error) {
      console.error('Copy failed', error);
    }
  };

  // Handle AQL formatting
  const handleFormat = () => {
    if (!editorRef.current) return;

    const editor = editorRef.current;
    const model = editor.getModel();

    if (!model) return;

    const formattedQuery = formatAQLQuery(aqlInput);

    // Push undo stop before formatting (ensures user can undo in one step)
    if (model.pushUndoStop) {
      model.pushUndoStop();
    }

    editor.executeEdits("formatAQL", [
      {
        range: model.getFullModelRange(),
        text: formattedQuery,
        forceMoveMarkers: true
      }
    ]);

    // Push another undo stop after formatting so it's one step
    if (model.pushUndoStop) {
      model.pushUndoStop();
    }
    editor.setScrollPosition({ scrollTop: 0, scrollLeft: 0 });
    
    setAqlInput(formattedQuery);
    setFormatMessage('Formatted!');
    setTimeout(() => setFormatMessage(''), 2000);
  };

  // Handle AQL input change
  const handleAqlChange = (value) => {
    setAqlInput(value);
    
    // Call external change handler if provided
    if (onAqlChange) {
      onAqlChange(value);
    }
  };

  // Handle AST panel drag
  const handleDrag = (e) => {
    const newWidth = window.innerWidth - e.clientX;
    if (newWidth > 250 && newWidth < 800) setAstPanelWidth(newWidth);
  };

  return (
    <div className="relative flex w-full h-full">
      <div className="flex-1 w-full p-6 relative bg-slate-800 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center text-slate-300">
            <Code size={20} className="mr-2 text-blue-400" />
            <h3 className="text-lg font-medium">Enter your AQL Query</h3>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleFormat}
              className="p-2 text-slate-400 rounded-md hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-opacity-50"
              title={formatMessage || 'Format Code'}
            >
              {formatMessage ? <Check size={20} /> : <Brush size={20} />}
            </button>

            <button
              onClick={handleCopy}
              className="p-2 text-slate-400 rounded-md hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-opacity-50"
              title={copyMessage || 'Copy to clipboard'}
            >
              {copyMessage ? <Check size={20} /> : <Copy size={20} />}
            </button>
            <button
              className="p-2 text-slate-400 rounded-md hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-opacity-50"
              onClick={onToggleAstPanel}
            >
              <TreePine size={20} />
            </button>
          </div>
        </div>
        <Editor
          height="450px"
          theme="vs-dark"
          defaultLanguage="sql"
          value={aqlInput}
          onChange={handleAqlChange}
          onMount={(editor) => {
            editorRef.current = editor;
          }}
          className="rounded-lg p-4"
          options={{
            minimap: { enabled: false },
            wordWrap: "off",
            fontSize: 12,
            lineNumbersMinChars: 3,
            padding: { top: 10 },
            stickyScroll: { enabled: false }
          }}
        />
        <div className="absolute bottom-2 right-2 text-xs text-slate-400">
          Grammar uses{" "}
          <a
            href="https://github.com/openEHR/openEHR-antlr4"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 underline"
          >
            openEHR-ANTLR4
          </a>
        </div>
      </div>
      {showAstPanel && (
        <div className="absolute top-4 right-0 h-full bg-slate-800 border-l border-slate-700 flex">
          <div
            className="h-full cursor-ew-resize w-2"
            onMouseDown={(e) => {
              document.addEventListener("mousemove", handleDrag);
              document.addEventListener("mouseup", () => {
                document.removeEventListener("mousemove", handleDrag);
              });
            }}
          />
          <div
            className="h-full flex flex-col"
            style={{ width: `${astPanelWidth}px` }}
          >
            <div className="p-4 flex text-slate-300 items-center justify-between">
              <h3 className="text-lg font-medium">AST Tree</h3>
              <button className="text-white hover:text-red-400" onClick={onToggleAstPanel}>
                <ChevronRight size={20} />
              </button>
            </div>
            <Editor
              height="450px"
              theme="vs-dark"
              defaultLanguage="json"
              value={astOutput ? JSON.stringify(astOutput, null, 2) : "No AST available"}
              className="rounded-lg p-4"
              options={{
                minimap: { enabled: false },
                readOnly: true,
                wordWrap: "on",
                fontSize: 12,
                lineNumbersMinChars: 3,
                padding: { top: 10 }
              }}
            />
          </div>
        </div>
      )}
      {errorHighlight.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-slate-900 border-t border-slate-700">
          <div className="p-4 bg-red-900 bg-opacity-50 text-red-300 rounded-md border border-red-700">
            <h4 className="text-md font-medium mb-2">Errors Detected in the AQL query:</h4>
            <ul className="list-disc list-inside space-y-2">
              {errorHighlight.map((error, index) => (
                <li key={index} className="text-red-300">
                  <span className="font-medium">Line {error.line}, Column {error.column}:</span> {error.message}
                  {error.expected && (
                    <div className="ml-6 mt-1 text-sm">
                      <span className="text-slate-400">Expected:</span> {error.expected}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default AQLEditor;