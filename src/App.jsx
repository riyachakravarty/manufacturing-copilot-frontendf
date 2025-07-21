import React, { useState, useEffect } from "react";
import axios from "axios";
import Plot from "react-plotly.js";

function App() {
  const [file, setFile] = useState(null);
  const [response, setResponse] = useState("");
  const [plotData, setPlotData] = useState(null);
  const [columns, setColumns] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState([]);
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
        headers: { "Content-Type": "multipart/form-data" }
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
        { headers: { "Content-Type": "application/json" } }
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
    if (selectedColumns.length === 0 || !analysisType) return;
    const prompt = `${analysisType} analysis where selected variable is '${selectedColumns[0]}'`;
    handlePrompt(prompt);
  };

  const handleOutlierAnalysis = () => {
    if (selectedColumns.length === 0) return alert("Please select a column.");
    const prompt = `outlier analysis where selected variable is '${selectedColumns[0]}' using ${outlierMethod}`;
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
    if (selectedColumns.length === 0 || selectedIntervals.length === 0 || !treatmentMethod) {
      return alert("Please select column(s), interval(s), and treatment method.");
    }
    const payload = {
      columns: selectedColumns,
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

  const handleSelectAllColumns = () => {
    setSelectedColumns(columns);
  };

  const handleSelectAllIntervals = () => {
    setSelectedIntervals(intervals);
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
            if (selectedColumns.length === 0) return alert("Please select a column first.");
            const prompt = `missing value analysis where selected variable is '${selectedColumns[0]}'`;
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
          <div>
            <label>Select Column(s):</label>
            <select
              multiple
              onChange={(e) => setSelectedColumns(Array.from(e.target.selectedOptions, opt => opt.value))}
              value={selectedColumns}
              style={{ width: "100%", height: "100px" }}
            >
              {columns.map((col) => (
                <option key={col} value={col}>{col}</option>
              ))}
            </select>
            <button onClick={handleSelectAllColumns}>Select All Columns</button>
          </div>

          {analysisType === "variability" && (
            <button onClick={handleAnalysis}>Run Variability Analysis</button>
          )}

          {treatmentType && (
            <>
              <button onClick={loadMissingIntervals}>Load Missing Intervals</button>
              <div style={{ margin: "1rem 0" }}>
                <label>Select Interval(s):</label>
                <select
                  multiple
                  onChange={(e) => setSelectedIntervals(Array.from(e.target.selectedOptions, opt => JSON.parse(opt.value)))}
                  style={{ width: "100%", height: "100px" }}
                >
                  {intervals.map((intvl, idx) => (
                    <option key={idx} value={JSON.stringify(intvl)}>
                      {intvl.start} to {intvl.end}
                    </option>
                  ))}
                </select>
                <button onClick={handleSelectAllIntervals}>Select All Intervals</button>
              </div>

              <select onChange={(e) => setTreatmentMethod(e.target.value)} value={treatmentMethod}>
                <option value="">Select Treatment Method</option>
                <option value="Delete rows">Delete rows</option>
                <option value="Forward fill">Forward fill</option>
                <option value="Backward fill">Backward fill</option>
                <option value="Mean">Mean</option>
                <option value="Median">Median</option>
              </select>
              <button onClick={applyTreatment}>Apply Treatment</button>
            </>
          )}

          {showOutlierOptions && (
            <>
              <select value={outlierMethod} onChange={(e) => setOutlierMethod(e.target.value)}>
                <option value="zscore">Z-Score</option>
                <option value="iqr">IQR</option>
              </select>
              <button onClick={handleOutlierAnalysis}>Run Outlier Analysis</button>
            </>
          )}
        </div>
      )}

      <div>
        <button onClick={downloadFile}>Download Treated File</button>
      </div>

      <div style={{ marginTop: "2rem" }}>
        {response && <pre>{response}</pre>}
        {plotData && <Plot data={plotData.data} layout={plotData.layout} />}
      </div>
    </div>
  );
}

export default App;
