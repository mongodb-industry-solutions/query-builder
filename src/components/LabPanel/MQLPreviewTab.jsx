'use client';

import React from 'react';
import Editor from "@monaco-editor/react";
import PropTypes from 'prop-types';
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';

const MQLPreviewTab = ({ mqlOutput, onGenerateMQL, transformationStatus, onUpdateStatus }) => {
  // Helper function to check if mqlOutput is a valid pipeline array
  const isParsedPipeline = () => {
    try {
      const parsed = JSON.parse(mqlOutput);
      return Array.isArray(parsed);
    } catch (error) {
      return false;
    }
  };

  // Render transformation status indicator
  const renderStatusIndicator = () => {
    let icon, color, text;
    
    switch(transformationStatus) {
      case 'done':
        icon = <CheckCircle size={16} />;
        color = 'text-green-400';
        text = 'Transformation Complete';
        break;
      case 'needs_improvement':
        icon = <AlertTriangle size={16} />;
        color = 'text-yellow-400';
        text = 'Needs Improvement';
        break;
      case 'pending':
      default:
        icon = <Clock size={16} />;
        color = 'text-slate-400';
        text = 'Pending';
        break;
    }
    
    return (
      <div className={`flex items-center gap-2 ${color}`}>
        {icon}
        <span>{text}</span>
      </div>
    );
  };

  return (
    <div className="bg-slate-800 p-6 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-slate-200">Preview Generated MQL</h3>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          onClick={onGenerateMQL}
        >
          Generate MQL
        </button>
      </div>

      {/* Transformation status controls */}
      <div className="mb-4 p-4 bg-slate-700 rounded-lg flex flex-wrap gap-4 justify-between items-center">
        <div className="flex items-center gap-4">
          <span className="text-slate-300">Transformation Status:</span>
          {renderStatusIndicator()}
        </div>
        
        {/* Status selection options */}
        <div className="flex gap-2">
          <button 
            className={`px-3 py-1.5 rounded-md text-sm ${
              transformationStatus === 'pending'
                ? 'bg-slate-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
            onClick={() => onUpdateStatus('pending')}
          >
            Pending
          </button>
          <button 
            className={`px-3 py-1.5 rounded-md text-sm ${
              transformationStatus === 'needs_improvement'
                ? 'bg-yellow-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
            onClick={() => onUpdateStatus('needs_improvement')}
          >
            Needs Improvement
          </button>
          <button 
            className={`px-3 py-1.5 rounded-md text-sm ${
              transformationStatus === 'done'
                ? 'bg-green-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
            onClick={() => onUpdateStatus('done')}
          >
            Done
          </button>
        </div>
      </div>

      {isParsedPipeline() ? (
        <div className="space-y-4">
          {JSON.parse(mqlOutput).map((stage, index) => (
            <div key={index} className="bg-slate-700 p-4 rounded-lg border border-slate-600">
              <h4 className="text-md font-semibold text-slate-300 mb-2">Stage {index + 1}</h4>
              <Editor
                height="200px"
                theme="vs-dark"
                defaultLanguage="json"
                value={JSON.stringify(stage, null, 2)}
                options={{
                  minimap: { enabled: false },
                  wordWrap: "on",
                  fontSize: 12,
                  readOnly: true,
                  padding: { top: 10 },
                }}
              />
            </div>
          ))}
        </div>
      ) : (
        <Editor
          height="500px"
          theme="vs-dark"
          defaultLanguage="json"
          value={mqlOutput || 'No MQL generated yet. Click "Generate MQL" to create MongoDB query language from your AQL.'}
          options={{
            minimap: { enabled: false },
            wordWrap: "on",
            fontSize: 12,
            readOnly: true,
            padding: { top: 10 },
          }}
        />
      )}
    </div>
  );
};

MQLPreviewTab.propTypes = {
  mqlOutput: PropTypes.string,
  onGenerateMQL: PropTypes.func.isRequired,
  transformationStatus: PropTypes.string,
  onUpdateStatus: PropTypes.func
};

export default MQLPreviewTab;