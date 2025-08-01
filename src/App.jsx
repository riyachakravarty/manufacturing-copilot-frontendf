import React, { useState } from "react";
import axios from "axios";
import Plot from "react-plotly.js";
import "./App.css";

function App() {
  const [file, setFile] = useState(null);
  const [columns, setColumns] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [plotData, setPlotData] = useState(null);
  const [chatResponse, setChatResponse] = useState("");
  const [prompt, setPrompt] = useState("");
  const [intervals, setIntervals] = useState([]);
  const [valueIntervals, setValueIntervals] = useState([]);
  const [selectedIntervals, setSelectedIntervals] = useState([]);
  const [treatmentMethod, setTreatmentMethod] = useState("forward_fill");
  const [anomalyOption, setAnomalyOption] = useState("missing_datetimes");
  const [selectedMissingValueColumn, setSelectedMissingValueColumn] = useState("");

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    const formData = new FormData();
    formData.append("file", file);
    try {
      await axios.post(`${process.env.REACT_APP_BACKEND_URL}/upload`, formData);
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/get_columns`);
      setColumns(response.data.columns);
    } catch (error) {
      alert("Error uploading file or fetching columns");
    }
  };

  const handleChat = async () => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/chat`, {
        prompt,
        selected_columns: selectedColumns,
      });
      if (response.data.plot) {
        setPlotData(response.data.plot);
        setChatResponse("");
      } else {
        setChatResponse(response.data.response);
        setPlotData(null);
      }
    } catch (error) {
      alert("Error generating plot");
    }
  };

  const fetchIntervals = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/missing_datetime_intervals`);
      setIntervals(response.data.intervals);
    } catch (error) {
      alert("Error fetching intervals");
    }
  };

  const fetchValueIntervals = async () => {
    if (!selectedMissingValueColumn) {
      alert("Please select a column first.");
      return;
    }
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/get_missing_value_intervals`,
        {
          params: { column: selectedMissingValueColumn },
        }
      );
      setValueIntervals(response.data.intervals || []);
    } catch (err) {
      console.error("Error fetching value intervals:", err);
      setValueIntervals([]);
    }
  };

  const applyTreatment = async () => {
    try {
      const payload = {
        columns: selectedColumns,
        intervals: selectedIntervals.map((i) =>
          anomalyOption === "missing_datetimes" ? intervals[i] : valueIntervals[i]
        ),
        method: treatmentMethod,
      };

      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/apply_treatment`,
        payload
      );
      alert(response.data.message || "Treatment applied successfully.");
    } catch (error) {
      console.error("Error applying treatment:", error);
      alert("Failed to apply treatment. Please check console for details.");
    }
  };

  return (
    <div className="App">
      <h2>Manufacturing Co-Pilot</h2>

      <input type="file" onChange={handleFileChange} />
      <button onClick={handleUpload}>Upload</button>

      <div>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your prompt"
        />
        <button onClick={handleChat}>Run Analysis</button>
      </div>

      {columns.length > 0 && (
        <div>
          <h4>Select Columns</h4>
          <div>
            <input
              type="checkbox"
              checked={selectedColumns.length === columns.length}
              onChange={(e) =>
                setSelectedColumns(
                  e.target.checked ? columns.map((_, i) => columns[i]) : []
                )
              }
            />
            Select All
          </div>
          {columns.map((col, idx) => (
            <div key={idx}>
              <input
                type="checkbox"
                checked={selectedColumns.includes(col)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedColumns([...selectedColumns, col]);
                  } else {
                    setSelectedColumns(selectedColumns.filter((c) => c !== col));
                  }
                }}
              />
              {col}
            </div>
          ))}
        </div>
      )}

      <div>
        <h4>Anomaly Treatment</h4>
        <select value={anomalyOption} onChange={(e) => setAnomalyOption(e.target.value)}>
          <option value="missing_datetimes">Missing Date Times</option>
          <option value="missing_values">Missing Values</option>
        </select>

        {anomalyOption === "missing_datetimes" && (
          <>
            <button onClick={fetchIntervals}>Load Missing DateTime Intervals</button>
            <div>
              <h5>Select Intervals</h5>
              <div>
                <input
                  type="checkbox"
                  checked={selectedIntervals.length === intervals.length}
                  onChange={(e) =>
                    setSelectedIntervals(
                      e.target.checked ? intervals.map((_, i) => i) : []
                    )
                  }
                />
                Select All
              </div>
              {intervals.map((intv, idx) => (
                <div key={idx}>
                  <input
                    type="checkbox"
                    checked={selectedIntervals.includes(idx)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIntervals([...selectedIntervals, idx]);
                      } else {
                        setSelectedIntervals(selectedIntervals.filter((i) => i !== idx));
                      }
                    }}
                  />
                  {`${intv.start} to ${intv.end}`}
                </div>
              ))}
            </div>
          </>
        )}

        {anomalyOption === "missing_values" && (
          <>
            <select
              value={selectedMissingValueColumn}
              onChange={(e) => setSelectedMissingValueColumn(e.target.value)}
            >
              <option value="">Select a column</option>
              {columns.map((col, idx) => (
                <option key={idx} value={col}>
                  {col}
                </option>
              ))}
            </select>
            <button onClick={fetchValueIntervals}>Load Missing Value Intervals</button>
            <div>
              <h5>Select Intervals</h5>
              <div>
                <input
                  type="checkbox"
                  checked={selectedIntervals.length === valueIntervals.length}
                  onChange={(e) =>
                    setSelectedIntervals(
                      e.target.checked ? valueIntervals.map((_, i) => i) : []
                    )
                  }
                />
                Select All
              </div>
              {valueIntervals.map((intv, idx) => (
                <div key={idx}>
                  <input
                    type="checkbox"
                    checked={selectedIntervals.includes(idx)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIntervals([...selectedIntervals, idx]);
                      } else {
                        setSelectedIntervals(selectedIntervals.filter((i) => i !== idx));
                      }
                    }}
                  />
                  {`${intv.start} to ${intv.end}`}
                </div>
              ))}
            </div>
          </>
        )}

        <select
          value={treatmentMethod}
          onChange={(e) => setTreatmentMethod(e.target.value)}
        >
          <option value="forward_fill">Forward Fill</option>
          <option value="mean">Mean</option>
          <option value="median">Median</option>
        </select>
        <button onClick={applyTreatment}>Apply Treatment</button>
      </div>

      {plotData && (
        <Plot data={plotData.data} layout={plotData.layout} />
      )}

      {chatResponse && <div>{chatResponse}</div>}
    </div>
  );
}

export default App;
