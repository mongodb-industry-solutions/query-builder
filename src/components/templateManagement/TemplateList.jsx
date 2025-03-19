// src/app/components/queryBuilder/TemplateManagment/TemplateList.jsx

"use client";

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  ChevronDown,
  ChevronRight,
  File,
  Layout,
  ClipboardList,
  AlertCircle,
  Activity,
  PlayCircle,
  ShieldAlert,
  Trash2,
  Square,
  ChevronUp,
} from 'lucide-react';
import ConfirmationModal from '../common/confirmationModal'; 

// A simple component to render an entry node in a styled box.
const EntryBox = ({ icon: Icon, name, label, nodeId, colorClasses }) => {
  return (
    <div className={`border rounded px-1 py-0.5 inline-flex items-center gap-1 m-1 ${colorClasses}`}>
      <Icon size={14} />
      <span className="text-xs">{label}</span>
      <span className="text-xs text-gray-300">
        {nodeId ? `${name}` : ""}
      </span>
    </div>
  );
};

EntryBox.propTypes = {
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  nodeId: PropTypes.string,
  colorClasses: PropTypes.string, // e.g. "text-blue-500 border-blue-500"
};

const SectionCard = ({ section }) => {
  const [collapsed, setCollapsed] = useState(false);

  const toggleCollapse = () => setCollapsed(!collapsed);

  // Render the children of a section as entry boxes based on rmType.
  const renderEntryBox = (child) => {
    const rmType = (child.rmType || "").toLowerCase();
    let IconComponent = Square;
    let label = "ELEMENT";
    let colorClasses = "text-gray-500 border-gray-500";

    if (rmType.includes("evaluation")) {
      IconComponent = ClipboardList;
      label = "EVALUATION";
      colorClasses = "text-blue-500 border-blue-500";
    } else if (rmType.includes("instruction")) {
      IconComponent = AlertCircle;
      label = "INSTRUCTION";
      colorClasses = "text-orange-500 border-orange-500";
    } else if (rmType.includes("observation")) {
      IconComponent = Activity;
      label = "OBSERVATION";
      colorClasses = "text-purple-500 border-purple-500";
    } else if (rmType.includes("action")) {
      IconComponent = PlayCircle;
      label = "ACTION";
      colorClasses = "text-green-500 border-green-500";
    } else if (rmType.includes("admin")) {
      IconComponent = ShieldAlert;
      label = "ADMIN_ENTRY";
      colorClasses = "text-red-500 border-red-500";
    }
    return (
      <EntryBox
        key={child.nodeId || child.id}
        icon={IconComponent}
        name={child.name || child.localizedName}
        label={label}
        nodeId={child.nodeId || ""}
        colorClasses={colorClasses}
      />
    );
  };

  return (
    <div className="mb-2 pl-2 border-l border-slate-600">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">Section:</span>
          <span className="text-slate-300 font-medium">
            {section.name || section.localizedName || "Unnamed Section"}
          </span>
          <span className="text-xs text-slate-500">
            ({section.nodeId || "N/A"})
          </span>
        </div>
        <button onClick={toggleCollapse} className="text-slate-400 hover:text-slate-200">
          {collapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>
      {!collapsed && (
        <div className="mt-2 flex flex-wrap">
          {(section.children || []).map(child => renderEntryBox(child))}
        </div>
      )}
    </div>
  );
};

SectionCard.propTypes = {
  section: PropTypes.object.isRequired,
};

const TemplateSchemaCard = ({ template, onDelete }) => {
  const [showModal, setShowModal] = useState(false);
  const [collapsedRoot, setCollapsedRoot] = useState(true);

  const metadata = template.webTemplate?.metadata || {};
  const tree = template.webTemplate?.tree || {};
  // Assume sections are those children with rmType including "section".
  const sections = (tree.children || []).filter(child =>
    child.rmType && child.rmType.toLowerCase().includes("section")
  );

  const handleDelete = () => {
    setShowModal(true);
  };

  const confirmDelete = () => {
    setShowModal(false);
    onDelete(template._id || template.id);
  };

  const cancelDelete = () => {
    setShowModal(false);
  };

  const toggleRootCollapse = () => {
    setCollapsedRoot(!collapsedRoot);
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 relative">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <File className="text-blue-400" size={20} />
          <h3 className="text-2xl font-bold text-slate-200">{template.name}</h3>
          <span className="text-xs text-slate-500">({metadata.node || "N/A"})</span>
        </div>
        <button onClick={handleDelete} className="text-slate-400 hover:text-red-400 transition-colors">
          <Trash2 size={20} />
        </button>
      </div>
      <div className="mb-4">
        <p className="text-slate-300">
          <strong>Description:</strong> {metadata.description || "No description provided."}
        </p>
      </div>
      <div className="border-t border-slate-700 pt-4">
        <div className="flex items-center justify-between mb-2">
          <button onClick={toggleRootCollapse} className="text-slate-200 font-medium hover:text-slate-300 focus:outline-none">
            Template Schema
          </button>
          <button onClick={toggleRootCollapse} className="text-slate-400 hover:text-slate-200 focus:outline-none">
            {collapsedRoot ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
        {!collapsedRoot && (
          sections.length > 0 ? (
            <div className="space-y-4">
              {sections.map(section => (
                <div key={section.nodeId || section.id} className="w-full block">
                  <SectionCard section={section} />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400">No sections found.</p>
          )
        )}
      </div>
      {showModal && (
        <ConfirmationModal
          message="Are you sure you want to delete this template?"
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
      )}
    </div>
  );
};

TemplateSchemaCard.propTypes = {
  template: PropTypes.shape({
    id: PropTypes.string,
    _id: PropTypes.string,
    name: PropTypes.string.isRequired,
    webTemplate: PropTypes.object,
  }).isRequired,
  onDelete: PropTypes.func.isRequired,
};

const TemplateList = ({ templates, onDelete }) => {
  return (
    <div className="grid grid-cols-1 gap-4">
      {templates.map(template => (
        <TemplateSchemaCard key={template._id || template.id} template={template} onDelete={onDelete} />
      ))}
    </div>
  );
};

TemplateList.propTypes = {
  templates: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      _id: PropTypes.string,
      name: PropTypes.string.isRequired,
      webTemplate: PropTypes.object,
    })
  ).isRequired,
  onDelete: PropTypes.func.isRequired,
};

export default TemplateList;