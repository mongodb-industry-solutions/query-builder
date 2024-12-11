"use client";

import { useState } from "react";
import styles from "./QueryBuilder.module.css";

const QueryBuilder = () => {
  const [templates, setTemplates] = useState({});
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [compositionNode, setCompositionNode] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [error, setError] = useState(null);
  const [inputValues, setInputValues] = useState({});
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [conditions, setConditions] = useState([]);
  const [activeTab, setActiveTab] = useState("AQL");
  const [copyMessage, setCopyMessage] = useState("");

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
        const composition = data.extractedInfo.find(
          (node) => node.rmType === "COMPOSITION"
        );
        const otherNodes = data.extractedInfo.filter(
          (node) => node.rmType !== "COMPOSITION"
        );
        setCompositionNode(composition);
        setSelectedTemplate(otherNodes);
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

  const addCondition = () => {
    if (selectedNode && inputValues[selectedNode.nodeId]) {
      const inputType = selectedNode.inputs[0].type; // Assuming one input type per node
      const value = inputValues[selectedNode.nodeId][inputType];
      if (value) {
        const condition = `${selectedNode.aqlPath} >= '${value}'`;
        setConditions((prevConditions) => [...prevConditions, condition]);
        // Clear the input value after adding the condition
        setInputValues((prevValues) => ({
          ...prevValues,
          [selectedNode.nodeId]: {
            ...prevValues[selectedNode.nodeId],
            [inputType]: "",
          },
        }));
      }
    }
  };

  const copyToClipboard = () => {
    const textToCopy = conditions.length > 0 ? conditions.join(" AND ") : "";
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopyMessage("Copied to clipboard!");
      setTimeout(() => setCopyMessage(""), 2000); // Clear message after 2 seconds
    });
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
      {compositionNode && (
        <div className={styles.composition}>
          <h2>Composition Details</h2>
          <p>Name: {compositionNode.name}</p>
          <p>Node ID: {compositionNode.nodeId}</p>
          <p>Type: {compositionNode.rmType}</p>
        </div>
      )}
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
          {selectedNode.inputs && selectedNode.inputs.length > 0 && (
            <button onClick={addCondition} className={styles.button}>
              Add Condition
            </button>
          )}
        </div>
      )}
      <div className={styles.conditions}>
        <h3>Conditions</h3>
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${
              activeTab === "AQL" ? styles.activeTab : ""
            }`}
            onClick={() => setActiveTab("AQL")}
          >
            AQL
          </button>
          <button
            className={`${styles.tab} ${
              activeTab === "MQL" ? styles.activeTab : ""
            }`}
            onClick={() => setActiveTab("MQL")}
          >
            MQL
          </button>
        </div>
        <div className={styles.queryBox}>
          {activeTab === "AQL" && (
            <div>{conditions.length > 0 ? conditions.join(" AND ") : ""}</div>
          )}
          {activeTab === "MQL" && <div>{"AQL TO MQL"}</div>}
        </div>
        <button onClick={copyToClipboard} className={styles.button}>
          Copy to Clipboard
        </button>
        {copyMessage && <p className={styles.copyMessage}>{copyMessage}</p>}
      </div>
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
};

export default QueryBuilder;
