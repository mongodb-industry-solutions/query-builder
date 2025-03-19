"use client";

import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  Copy,
  Check,
  Play,
  Download,
  Code,
  AlertCircle,
  ChevronUp,
  ChevronDown
} from 'lucide-react';

// 1) Single-pass highlighting rules in priority order
const aqlHighlightRules = [
  // --- Multi-word tokens (must come before single-word) ---
  {
    // SELECT DISTINCT
    pattern: /\bSELECT\s+DISTINCT\b/gi,
    replacement: `<span class="text-blue-500 font-bold">SELECT DISTINCT</span>`
  },
  {
    // ORDER BY
    pattern: /\bORDER\s+BY\b/gi,
    replacement: `<span class="text-blue-500 font-bold">ORDER BY</span>`
  },
  {
    // NOT CONTAINS
    pattern: /\bNOT\s+CONTAINS\b/gi,
    replacement: `<span class="text-red-400 font-medium">NOT CONTAINS</span>`
  },

  // --- Single-word keywords ---
  {
    pattern: /\bSELECT\b/gi,
    replacement: `<span class="text-blue-500 font-bold">SELECT</span>`
  },
  {
    pattern: /\bFROM\b/gi,
    replacement: `<span class="text-blue-500 font-bold">FROM</span>`
  },
  {
    pattern: /\bWHERE\b/gi,
    replacement: `<span class="text-blue-500 font-bold">WHERE</span>`
  },
  {
    pattern: /\bCONTAINS\b/gi,
    replacement: `<span class="text-green-400 font-medium">CONTAINS</span>`
  },
  {
    pattern: /\bDISTINCT\b/gi,
    replacement: `<span class="text-blue-500 font-bold">DISTINCT</span>`
  },
  {
    pattern: /\bLIMIT\b/gi,
    replacement: `<span class="text-blue-500 font-bold">LIMIT</span>`
  },
  {
    pattern: /\bOFFSET\b/gi,
    replacement: `<span class="text-blue-500 font-bold">OFFSET</span>`
  },
  {
    // AS
    pattern: /\bAS\b/gi,
    replacement: `<span class="text-blue-400 font-medium">AS</span>`
  },
  // --- Operators / Logical ---
  {
    pattern: /\bAND\b/gi,
    replacement: `<span class="text-yellow-400 font-medium">AND</span>`
  },
  {
    pattern: /\bOR\b/gi,
    replacement: `<span class="text-yellow-400 font-medium">OR</span>`
  },
  {
    // standalone NOT
    pattern: /\bNOT\b/gi,
    replacement: `<span class="text-red-400 font-medium">NOT</span>`
  },
  {
    pattern: /\bLIKE\b/gi,
    replacement: `<span class="text-orange-400 font-medium">LIKE</span>`
  },
  {
    pattern: /\bEXISTS\b/gi,
    replacement: `<span class="text-purple-400 font-medium">EXISTS</span>`
  },
  {
    pattern: /\bASC\b/gi,
    replacement: `<span class="text-green-400 font-medium">ASC</span>`
  },
  {
    pattern: /\bDESC\b/gi,
    replacement: `<span class="text-red-400 font-medium">DESC</span>`
  },

  // --- Functions ---
  {
    // COUNT, MIN, MAX, SUM, AVG, LENGTH, etc.
    pattern: /\b(COUNT|MIN|MAX|SUM|AVG|LENGTH|POSITION|SUBSTRING|CONCAT|CONCAT_WS|ABS|MOD|CEIL|FLOOR|ROUND|CURRENT_DATE|CURRENT_TIME|CURRENT_DATE_TIME|NOW|CURRENT_TIMEZONE|TERMINOLOGY)\b/gi,
    replacement: `<span class="text-pink-400 font-medium">$1</span>`
  },

  // --- Booleans / Null ---
  {
    pattern: /\b(true|false|null)\b/gi,
    replacement: `<span class="text-pink-400 font-medium">$1</span>`
  },

  // --- Parameters ($something) ---
  {
    pattern: /\$[a-zA-Z0-9_]+/g,
    replacement: `<span class="text-yellow-300">$&</span>`
  }
];

// 2) Apply the above rules in one pass for each line
function highlightLine(line) {
  let highlighted = line;
  for (const rule of aqlHighlightRules) {
    highlighted = highlighted.replace(rule.pattern, rule.replacement);
  }
  // Wrap anything unmatched in white
  return `<span class="text-white">${highlighted}</span>`;
}

// 3) Convert the entire query into a series of <div> lines
function highlightSyntax(query, isFormatted) {
  if (!query) return null;
  if (!isFormatted) {
    // If user wants plain text, show as white
    return <span className="text-white">{query}</span>;
  }

  // Split into lines and preserve indentation
  const lines = query.split('\n');
  return lines.map((originalLine, index) => {
    // Capture leading whitespace
    const match = originalLine.match(/^(\s+)/);
    const leadingWhitespace = match ? match[0] : '';
    // Trim only the leading indentation portion
    const trimmed = originalLine.slice(leadingWhitespace.length);

    // Highlight the trimmed portion
    const replaced = highlightLine(trimmed);

    // Re-inject indentation, preserving it visually
    const finalHtml = `<span style="white-space: pre;">${leadingWhitespace}</span>${replaced}`;

    return <div key={index} dangerouslySetInnerHTML={{ __html: finalHtml }} />;
  });
}

const QueryDisplay = ({ query, onExecuteQuery }) => {
  const [copyMessage, setCopyMessage] = useState('');
  const [height, setHeight] = useState(180); // Default height
  const [isDragging, setIsDragging] = useState(false);
  const [validationErrors, setValidationErrors] = useState([]);
  const [isFormatted, setIsFormatted] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);

  const dragStartY = useRef(0);
  const startHeight = useRef(height);
  const containerRef = useRef(null);

  // Copy to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(query);
      setCopyMessage('Copied!');
      setTimeout(() => setCopyMessage(''), 2000);
    } catch (error) {
      setCopyMessage('Failed to copy');
      setTimeout(() => setCopyMessage(''), 2000);
    }
  };

  // Download as file
  const handleDownload = () => {
    const blob = new Blob([query], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'query.aql';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Start dragging
  const handleDragStart = (e) => {
    e.preventDefault();
    dragStartY.current = e.clientY;
    startHeight.current = height;
    setIsDragging(true);
  };

  // Mousemove / mouseup listeners for dragging
  useEffect(() => {
    const handleDrag = (e) => {
      if (isDragging) {
        const deltaY = dragStartY.current - e.clientY;
        const newHeight = Math.max(80, Math.min(600, startHeight.current + deltaY));
        setHeight(newHeight);
      }
    };

    const handleDragEnd = () => {
      if (isDragging) {
        setIsDragging(false);
      }
    };

    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', handleDragEnd);

    return () => {
      document.removeEventListener('mousemove', handleDrag);
      document.removeEventListener('mouseup', handleDragEnd);
    };
  }, [isDragging]);

  // Very basic validation checks
  useEffect(() => {
    const errors = [];

    if (query && query.trim() !== '' && query.length > 100) {
      // Check FROM clause
      if (!/\bFROM\b/i.test(query)) {
        errors.push('Missing FROM clause');
      }
      // Check SELECT clause
      if (!/\bSELECT\b/i.test(query)) {
        errors.push('Missing SELECT clause');
      }
      // Check for mismatched parentheses
      const leftParens = (query.match(/\(/g) || []).length;
      const rightParens = (query.match(/\)/g) || []).length;
      if (leftParens !== rightParens) {
        errors.push('Mismatched parentheses');
      }
      // Check for unclosed quotes
      const singleQuotes = (query.match(/'/g) || []).length;
      const doubleQuotes = (query.match(/"/g) || []).length;
      if (singleQuotes % 2 !== 0) {
        errors.push('Unclosed single quotes');
      }
      if (doubleQuotes % 2 !== 0) {
        errors.push('Unclosed double quotes');
      }
    }

    setValidationErrors(errors);
  }, [query]);

  return (
    <div
      ref={containerRef}
      className={`fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700 p-0 z-10 transition-all duration-300 ${
        isExpanded ? '' : 'h-12 overflow-hidden'
      }`}
      style={{ height: isExpanded ? `${height}px` : '48px' }}
    >
      {/* Header bar with expand/collapse button */}
      <div
        className="absolute top-0 left-0 right-0 h-12 px-4 bg-slate-800 border-b border-slate-700 flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Code size={18} className="text-blue-400" />
          <h3 className="text-sm font-medium text-slate-300">Generated AQL Query</h3>
          {validationErrors.length > 0 && (
            <div className="flex items-center gap-1 text-red-400 text-xs">
              <AlertCircle size={14} />
              <span>{validationErrors.length} issue(s)</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isExpanded && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFormatted(!isFormatted);
                }}
                className="p-1 text-slate-400 hover:text-blue-400 transition-colors rounded-md hover:bg-slate-700 focus:outline-none text-xs"
                title="Toggle syntax highlighting"
              >
                {isFormatted ? 'Plain Text' : 'Highlight Syntax'}
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopy();
                }}
                className="p-1 text-slate-400 hover:text-blue-400 transition-colors rounded-md hover:bg-slate-700 focus:outline-none"
                title={copyMessage || 'Copy to clipboard'}
              >
                {copyMessage ? <Check size={16} /> : <Copy size={16} />}
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload();
                }}
                className="p-1 text-slate-400 hover:text-blue-400 transition-colors rounded-md hover:bg-slate-700 focus:outline-none"
                title="Download AQL query"
              >
                <Download size={16} />
              </button>

              {onExecuteQuery && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onExecuteQuery(query);
                  }}
                  className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-1 text-xs"
                  disabled={validationErrors.length > 0}
                >
                  <Play size={14} />
                  <span>Execute</span>
                </button>
              )}
            </>
          )}

          {isExpanded ? (
            <ChevronDown size={20} className="text-slate-400" />
          ) : (
            <ChevronUp size={20} className="text-slate-400" />
          )}
        </div>
      </div>

      {/* Drag handle at top */}
      {isExpanded && (
        <div
          className="absolute top-12 left-0 right-0 h-1 cursor-ns-resize flex justify-center items-center"
          onMouseDown={handleDragStart}
        >
          <div className="h-1 w-16 bg-slate-700 hover:bg-blue-500 rounded-b"></div>
        </div>
      )}

      {/* Query content */}
      <div className="mt-12 h-full p-3 flex flex-col overflow-hidden">
        {/* Show validation errors */}
        {isExpanded && validationErrors.length > 0 && (
          <div className="mb-2 p-2 bg-red-900/30 border border-red-700 rounded-md">
            <div className="text-xs text-red-400">
              <div className="font-medium mb-1">Query Validation Issues:</div>
              <ul className="list-disc pl-4">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Query text */}
        <div className="flex-1 overflow-hidden bg-slate-800 rounded-md border border-slate-700">
          <pre className="p-3 font-mono text-sm whitespace-pre-wrap h-full overflow-y-auto scrollbar-thin scrollbar-dark">
            {query ? highlightSyntax(query, isFormatted) : 'No query parts added yet'}
          </pre>
        </div>
      </div>
    </div>
  );
};

QueryDisplay.propTypes = {
  query: PropTypes.string.isRequired,
  onExecuteQuery: PropTypes.func
};

export default QueryDisplay;