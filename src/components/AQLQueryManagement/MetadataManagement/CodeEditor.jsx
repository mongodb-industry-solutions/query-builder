// src/components/AQLQueryManagement/MetadataManagement/CodeEditor.jsx
import React, { useState, useEffect } from 'react';
import { Check, X, AlertCircle } from 'lucide-react';

const CodeEditor = ({ value, onChange, language = 'json', minHeight = '150px' }) => {
  const [internalValue, setInternalValue] = useState(value || '');
  const [error, setError] = useState(null);

  useEffect(() => {
    setInternalValue(value || '');
  }, [value]);

  // Format JSON if language is JSON
  const formatCode = () => {
    if (language !== 'json') return;

    try {
      const parsedValue = JSON.parse(internalValue);
      const formattedValue = JSON.stringify(parsedValue, null, 2);
      setInternalValue(formattedValue);
      onChange(formattedValue);
      setError(null);
    } catch (err) {
      setError('Invalid JSON: ' + err.message);
    }
  };

  // Validate JSON when leaving the editor
  const validateCode = () => {
    if (language !== 'json') return;
    
    try {
      JSON.parse(internalValue);
      setError(null);
    } catch (err) {
      setError('Invalid JSON: ' + err.message);
    }
  };

  // Handle changes
  const handleChange = (e) => {
    setInternalValue(e.target.value);
    onChange(e.target.value);
  };

  return (
    <div className="code-editor">
      <div className="relative">
        <textarea
          value={internalValue}
          onChange={handleChange}
          onBlur={validateCode}
          className={`w-full p-3 font-mono text-sm bg-slate-900 border ${
            error ? 'border-red-500' : 'border-slate-700'
          } rounded-md text-slate-300 focus:outline-none focus:border-blue-500`}
          style={{ minHeight, resize: 'vertical' }}
          spellCheck="false"
        />
        
        {language === 'json' && (
          <button
            onClick={formatCode}
            className="absolute top-2 right-2 p-1 bg-slate-800 text-slate-400 hover:text-blue-400 rounded"
            title="Format JSON"
          >
            <Check size={14} />
          </button>
        )}
      </div>
      
      {error && (
        <div className="mt-1 text-xs text-red-400 flex items-center">
          <AlertCircle size={12} className="mr-1" />
          {error}
        </div>
      )}
    </div>
  );
};

export default CodeEditor;