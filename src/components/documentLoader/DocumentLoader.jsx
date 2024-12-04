"use client";

import { useState } from "react";
import styles from "./DocumentUploader.module.css";

const DocumentUploader = () => {
  const [documentText, setDocumentText] = useState("");
  const [extractedInfo, setExtractedInfo] = useState([]);
  const [error, setError] = useState(null);

  const handleParseDocument = async () => {
    try {
      const document = JSON.parse(documentText);

      const response = await fetch("/api/parseDocument", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(document),
      });

      if (response.ok) {
        const data = await response.json();
        setExtractedInfo(data.extractedInfo);
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to parse document");
      }
    } catch (parseError) {
      setError("Invalid JSON format");
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setDocumentText(e.target.result);
      };
      reader.readAsText(file);
    }
  };

  return (
    <div>
      <div className={styles.container}>
        <h1 className={styles.heading}>Web Template OpenEHR Uploader</h1>
        <textarea
          rows="10"
          value={documentText}
          onChange={(e) => setDocumentText(e.target.value)}
          placeholder="Paste your JSON document here"
          className={styles.textarea}
        />
        <input
          type="file"
          accept=".json"
          onChange={handleFileUpload}
          className={styles.fileInput}
        />
        <button onClick={handleParseDocument} className={styles.button}>
          Parse Document
        </button>
        {error && <p className={styles.error}>{error}</p>}
      </div>
      <br />
      <br />
      {extractedInfo.length > 0 && (
        <div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>No.</th>
                <th className={styles.th}>ID</th>
                <th className={styles.th}>Name</th>
                <th className={styles.th}>Type</th>
                <th className={styles.th}>Node ID</th>
                <th className={styles.th}>Min</th>
                <th className={styles.th}>Max</th>
                <th className={styles.th}>Localized Name</th>
                <th className={styles.th}>Localized Description</th>
                <th className={styles.th}>AQL Path</th>
              </tr>
            </thead>
            <tbody>
              {extractedInfo.map((info, index) => (
                <tr key={index} className={styles.tr}>
                  <td className={styles.td}>{index + 1}</td>
                  <td className={styles.td}>{info.id}</td>
                  <td className={styles.td}>{info.name}</td>
                  <td className={styles.td}>{info.rmType}</td>
                  <td className={styles.td}>{info.nodeId}</td>
                  <td className={styles.td}>{info.min}</td>
                  <td className={styles.td}>{info.max}</td>
                  <td className={styles.td}>{info.localizedNames}</td>
                  <td className={styles.td}>{info.localizedDescriptions}</td>
                  <td className={styles.td}>{info.aqlPath}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DocumentUploader;
