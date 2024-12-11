"use client";

import { useState } from "react";
import styles from "./QueryBuilder.module.css";

const QueryBuilder = () => {
  const [documentStructure, setDocumentStructure] = useState(null);
  const [error, setError] = useState(null);
  const [inputValues, setInputValues] = useState({});

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const document = JSON.parse(e.target.result);
          const response = await fetch("/api/parseDocument", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(document),
          });

          if (response.ok) {
            const data = await response.json();
            setDocumentStructure(data.extractedInfo);
            setError(null);
          } else {
            const errorData = await response.json();
            setError(errorData.error || "Failed to fetch document structure");
          }
        } catch (parseError) {
          setError("Invalid JSON format");
        }
      };
      reader.readAsText(file);
    }
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
      />
      <br />
      <br />
      {error && <p className={styles.error}>{error}</p>}
      {documentStructure && (
        <div>
          {documentStructure.map((node, index) => (
            <div key={index} className={styles.node}>
              <h2>{node.name}</h2>
              {node.inputs &&
                node.inputs.map((input, i) => (
                  <div key={i} className={styles.inputGroup}>
                    <label>{input.type}</label>
                    <input
                      type={input.type.toLowerCase()}
                      value={inputValues[node.nodeId]?.[input.type] || ""}
                      onChange={(e) =>
                        handleInputChange(
                          node.nodeId,
                          input.type,
                          e.target.value
                        )
                      }
                      className={styles.input}
                    />
                  </div>
                ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default QueryBuilder;
