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

  useEffect(() => {
    const fetchColumns = async () => {
      const res = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/get_columns`);
      setColumns(res.data.columns || []);
    };
    fetchColumns();
  }, []);

  const handleFileUpload = async () => {
    if (!file) return alert("Please select a file first.");
    const formData = new FormData();
    formData.append("file", file);
    await axios.post(`${process.env.REACT_APP_BACKEND_URL}/upload`, formData);
    alert("File uploaded successfully");
  };

  const handlePrompt = async (prompt) => {
    try {
      const res = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/chat`, { prompt });
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
    handlePrompt(`${analysisType} analysis where selected variable is '${selectedColumn}'`);
  };

  const loadMissingIntervals = async () => {
    const res = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/missing_datetime_intervals`);
    setIntervals(res.data.intervals);
  };

  const applyTreatment = async () => {
    const payload = {
      column: selectedColumn,
      intervals: selectedIntervals,
      method: treatmentMethod,
    };
    await axios.post(`${process.env.REACT_APP_BACKEND_URL}/apply_treatment`, payload);
    alert("Treatment applied successfully");
  };

  const downloadFile = () => {
    window.open(`${process.env.REACT_APP_BACKEND_URL}/download`, "_blank");
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
        <button onClick={() => setAnalysisType("missing value")}>Anomaly Analysis</button>
        <button onClick={() => setTreatmentType("missing value")}>Anomaly Treatment</button>
      </div>

      {(analysisType || treatmentType) && (
        <div style={{ marginTop: "1rem" }}>
          <select onChange={(e) => setSelectedColumn(e.target.value)} value={selectedColumn}>
            <option value="">Select Column</option>
            {columns.map((col) => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>

          {analysisType && (
            <button onClick={handleAnalysis}>Run Analysis</button>
          )}

          {treatmentType && (
            <>
              <button onClick={loadMissingIntervals}>Load Missing Intervals</button>
              <div>
                {intervals.map((intvl, idx) => (
                  <div key={idx}>
                    <input
                      type="checkbox"
                      value={JSON.stringify(intvl)}
                      onChange={(e) => {
                        const value = JSON.parse(e.target.value);
                        setSelectedIntervals((prev) =>
                          e.target.checked ? [...prev, value] : prev.filter(i => i.start !== value.start)
                        );
                      }}
                    />
                    {intvl.start} to {intvl.end}
                  </div>
                ))}
              </div>
              <select onChange={(e) => setTreatmentMethod(e.target.value)} value={treatmentMethod}>
                <option value="">Select Treatment</option>
                <option value="delete">Delete rows</option>
                <option value="forward_fill">Forward fill</option>
                <option value="backward_fill">Backward fill</option>
                <option value="mean">Mean</option>
                <option value="median">Median</option>
              </select>
              <button onClick={applyTreatment}>Apply Treatment</button>
              <button onClick={downloadFile}>Download Treated File</button>
            </>
          )}
        </div>
      )}

      {response && <pre>{response}</pre>}

      {plotData && (
        <Plot
          data={plotData.data}
          layout={plotData.layout}
          config={{ responsive: true }}
          style={{ marginTop: "2rem", width: "100%", height: "600px" }}
        />
      )}
    </div>
  );
}

export default App;
