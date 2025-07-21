import React, { useState, useEffect } from "react";
import axios from "axios";
import Plot from "react-plotly.js";
function App() {
  const [file, setFile] = useState(null);
  const [response, setResponse] = useState("");
  const [plotData, setPlotData] = useState(null);
  const [columns, setColumns] = useState([]);
  const [selectedColumn, setSelectedColumn] = useState("");
  const [analysisType, setAnalysisType] = useState("");
  const [treatmentType, setTreatmentType] = useState("");
  const [intervals, setIntervals] = useState([]);
  const [selectedIntervals, setSelectedIntervals] = useState([]);
  const [treatmentMethod, setTreatmentMethod] = useState("");
  const [showOutlierOptions, setShowOutlierOptions] = useState(false);
  const [outlierMethod, setOutlierMethod] = useState("zscore");
  useEffect(() => {
    const fetchColumns = async () => {
      try {
        const res = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/get_columns`);
        setColumns(res.data.columns || []);
      } catch (error) {
        console.error("Error fetching columns:", error);
      }
    };
    fetchColumns();
  }, []);
  const handleFileUpload = async () => {
    if (!file) return alert("Please select a file first.");
    const formData = new FormData();
    formData.append("file", file);
    try {
      await axios.post(`${process.env.REACT_APP_BACKEND_URL}/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        },
        withCredentials: false
      });
      alert("File uploaded successfully");
    } catch (error) {
      alert("Upload failed");
      console.error("Upload error:", error);
    }
  };
  const handlePrompt = async (prompt) => {
    try {
      const res = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/chat`,
        { prompt },
        {
          headers: {
            "Content-Type": "application/json"
          },
          withCredentials: false
        }
      );
      const { type, data } = res.data;
      if (type === "plot") {
        setPlotData(data);
        setResponse("");
      } else if (type === "text") {
        setResponse(data);
        setPlotData(null);
      } else {
        setResponse("Unexpected response format");
        setPlotData(null);
      }
    } catch (err) {
      alert("Request failed");
      console.error(err);
    }
  };
  const handleAnalysis = () => {
    if (!selectedColumn || !analysisType) return;
    const prompt = `${analysisType} analysis where selected variable is '${selectedColumn}'`;
    handlePrompt(prompt);
  };
  const handleOutlierAnalysis = () => {
    if (!selectedColumn) return alert("Please select a column.");
    const prompt = `outlier analysis where selected variable is '${selectedColumn}' using ${outlierMethod}`;
    handlePrompt(prompt);
  };
  const loadMissingIntervals = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/missing_datetime_intervals`);
      setIntervals(res.data.intervals);
    } catch (error) {
      alert("Failed to load intervals");
      console.error(error);
    }
  };
  const applyTreatment = async () => {
    if (!selectedColumn || selectedIntervals.length === 0 || !treatmentMethod) {
      return alert("Please select a column, interval(s), and treatment method.");
    }
    const payload = {
      column: selectedColumn,
      intervals: selectedIntervals,
      method: treatmentMethod
    };
    try {
      await axios.post(`${process.env.REACT_APP_BACKEND_URL}/apply_treatment`, payload);
      alert("Treatment applied successfully");
    } catch (error) {
      alert("Treatment failed");
      console.error(error);
    }
  };
  const downloadFile = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/download`, {
        responseType: "blob"
      });
      const blob = new Blob([res.data], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "treated_file.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert("Failed to download file");
      console.error("Download error:", error);
    }
  };
  return (
    <div style={{ padding: "2rem", maxWidth: "1000px", margin: "auto" }}>
      <h1>Manufacturing Co-Pilot</h1>
      <div>
        <input type="file" onChange={(e) => setFile(e.target.files[0])} />
        <button onClick={handleFileUpload}>Upload</button>
      </div>
      <hr />
      <div>
        <button onClick={() => handlePrompt("summarize the data")}>Summarize Data</button>
        <button onClick={() => setAnalysisType("variability")}>Variability Analysis</button>
        <button
          onClick={() => {
            if (!selectedColumn) return alert("Please select a column first.");
            const prompt = `missing value analysis where selected variable is '${selectedColumn}'`;
            handlePrompt(prompt);
          }}
        >
          Anomaly Analysis
        </button>
        <button onClick={() => setTreatmentType("missing value")}>Anomaly Treatment</button>
        <button onClick={() => setShowOutlierOptions(true)}>Outlier Analysis</button>
      </div>
      {(analysisType || treatmentType || showOutlierOptions) && (
        <div style={{ marginTop: "1rem" }}>
          <select onChange={(e) => setSelectedColumn(e.target.value)} value={selectedColumn}>
            <option value="">Select Column</option>
            {columns.map((col) => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>
          {analysisType === "variability" && (
            <button onClick={handleAnalysis}>Run Variability Analysis</button>
          )}
          {treatmentType && (
            <>
              <button onClick={loadMissingIntervals}>Load Missing Intervals</button>
              <div style={{ margin: "1rem 0" }}>
                {intervals.length === 0 && <p>No missing intervals found.</p>}
                {intervals.map((intvl, idx) => (
                  <div key={idx}>
                    <label>
