"use client";

import { useState } from "react";
import styles from "./QueryBuilder.module.css";

const QueryBuilder = () => {
  const [templates, setTemplates] = useState({});
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [error, setError] = useState(null);
  const [inputValues, setInputValues] = useState({});
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleFileUpload = (event) => {
    setFiles(event.target.files);
  };

  const handleFileSubmit = () => {
    setLoading(true);
    const newTemplates = {};

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const document = JSON.parse(e.target.result);
          newTemplates[file.name] = document;
          setTemplates((prevTemplates) => ({
            ...prevTemplates,
            ...newTemplates,
          }));
          setError(null);
        } catch (parseError) {
          setError(`Invalid JSON format in file: ${file.name}`);
        } finally {
          setLoading(false);
        }
      };
      reader.readAsText(file);
    });
  };

  const handleTemplateSelect = async (event) => {
    const templateName = event.target.value;
    if (templateName) {
      const document = templates[templateName];
      await processDocument(document);
    }
  };

  const processDocument = async (document) => {
    try {
      const response = await fetch("/api/parseDocument", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(document),
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedTemplate(data.extractedInfo);
        setSelectedNode(null); // Reset selected node
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to fetch document structure");
      }
    } catch (fetchError) {
      setError("Error processing document");
    }
  };

  const handleNodeSelect = (event) => {
    const aqlPath = event.target.value;
    const node = selectedTemplate.find((n) => n.aqlPath === aqlPath);
    setSelectedNode(node);
  };

  const handleInputChange = (nodeId, inputType, value) => {
    setInputValues((prevValues) => ({
      ...prevValues,
      [nodeId]: {
        ...prevValues[nodeId],
        [inputType]: value,
      },
    }));
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.heading}>Query Builder</h1>
      <input
        type="file"
        accept=".json"
        onChange={handleFileUpload}
        className={styles.fileInput}
        multiple
      />
      <button
        onClick={handleFileSubmit}
        className={styles.button}
        disabled={loading}
      >
        {loading ? "Loading..." : "Submit Files"}
      </button>
      <br />
      <br />
      <select onChange={handleTemplateSelect} className={styles.select}>
        <option value="">Select a template</option>
        {Object.keys(templates).map((templateName) => (
          <option key={templateName} value={templateName}>
            {templateName}
          </option>
        ))}
      </select>
      <br />
      {selectedTemplate && (
        <>
          <select onChange={handleNodeSelect} className={styles.select}>
            <option value="">Select a node</option>
            {selectedTemplate.map((node, index) => (
              <option key={`${node.aqlPath}-${index}`} value={node.aqlPath}>
                {node.name}
              </option>
            ))}
          </select>
          <br />
          <br />
        </>
      )}
      {selectedNode && (
        <div className={styles.node}>
          <h2>{selectedNode.name}</h2>
          <p>Node ID: {selectedNode.nodeId}</p>
          <p>AQL Path: {selectedNode.aqlPath}</p>
          {selectedNode.inputs &&
            selectedNode.inputs.map((input, i) => (
              <div
                key={`${selectedNode.aqlPath}-${i}`}
                className={styles.inputGroup}
              >
                <label>{input.type}</label>
                <input
                  type={input.type.toLowerCase()}
                  value={inputValues[selectedNode.nodeId]?.[input.type] || ""}
                  onChange={(e) =>
                    handleInputChange(
                      selectedNode.nodeId,
                      input.type,
                      e.target.value
                    )
                  }
                  className={styles.input}
                />
              </div>
            ))}
        </div>
      )}
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
};

export default QueryBuilder;
