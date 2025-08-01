import React, { useState, useEffect } from "react";
import axios from "axios";
import Plot from "react-plotly.js";

const App = () => {
  const [columns, setColumns] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [selectedIntervals, setSelectedIntervals] = useState([]);
  const [selectAllIntervals, setSelectAllIntervals] = useState(false);
  const [selectAllColumns, setSelectAllColumns] = useState(false);
  const [treatmentMethod, setTreatmentMethod] = useState("mean");
  const [plotData, setPlotData] = useState(null);
  const [file, setFile] = useState(null);
  const [intervals, setIntervals] = useState([]);
  const [analysisType, setAnalysisType] = useState(null);
  const [outlierMethod, setOutlierMethod] = useState("zscore");
  const [showOutlierOptions, setShowOutlierOptions] = useState(false);
  const [showAnomalyTreatmentOptions, setShowAnomalyTreatmentOptions] = useState(false);
  const [anomalyTreatmentType, setAnomalyTreatmentType] = useState(null);
  const [valueIntervals, setValueIntervals] = useState([]);
  const [selectedValueIntervals, setSelectedValueIntervals] = useState([]);
  const [selectedMissingValueColumn, setSelectedMissingValueColumn] = useState(null);

  useEffect(() => {
    if (selectAllIntervals) {
      setSelectedIntervals(intervals.map((_, idx) => idx));
    } else {
      setSelectedIntervals([]);
    }
  }, [selectAllIntervals, intervals]);

  useEffect(() => {
    if (selectAllColumns) {
      setSelectedColumns(columns);
    } else {
      setSelectedColumns([]);
    }
  }, [selectAllColumns, columns]);

  const fetchColumns = async () => {
    const formData = new FormData();
    formData.append("file", file);
    await axios.post(`${process.env.REACT_APP_BACKEND_URL}/upload`, formData);
    const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/get_columns`);
    setColumns(response.data.columns);
  };

  const fetchIntervals = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/missing_datetime_intervals`);
      setIntervals(response.data.intervals || []);
    } catch (err) {
      console.error("Error fetching datetime intervals:", err);
      setIntervals([]);
    }
  };

  const fetchValueIntervals = async () => {
    if (!selectedMissingValueColumn || typeof selectedMissingValueColumn !== "string") {
      alert("Please select a valid column.");
      return;
    }

    console.log("Column param sent to backend:", selectedMissingValueColumn);

    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/missing_value_intervals`,
        {
          params: {
            column: selectedMissingValueColumn,
          },
        }
      );
      setValueIntervals(response.data.intervals || []);
    } catch (err) {
      console.error("Error fetching value intervals:", err);
      setValueIntervals([]);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/download`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], { type: 'text/csv' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', 'treated_data.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading treated file:", error);
      alert("No data available for download or an error occurred.");
    }
  };

  const handlePrompt = async (prompt) => {
    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/chat`, { prompt });
      if (response.data.type === "plot") {
        setPlotData(response.data.data);
      } else {
        alert(response.data.data);
      }
    } catch (err) {
      alert("Error generating plot: " + err.message);
    }
  };

  const handleAnalysis = () => {
    if (!selectedColumns.length) return alert("Select a column first.");
    if (analysisType === "variability") {
      handlePrompt(`variability analysis where selected variable is '${selectedColumns[0]}'`);
    } else if (analysisType === "anomaly") {
      handlePrompt(`missing value analysis where selected variable is '${selectedColumns[0]}'`);
    } else if (analysisType === "outlier") {
      handlePrompt(`outlier analysis where selected variable is '${selectedColumns[0]}' using ${outlierMethod}`);
    }
  };

  const applyTreatment = async () => {
    try {
      const payload = {
        columns: selectedColumns,
        intervals: selectedIntervals.map((i) => intervals[i]),
        method: treatmentMethod,
      };

      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/apply_treatment`, payload);
      alert('Treatment applied successfully!');
    } catch (error) {
      console.error('Error applying treatment:', error);
      alert('Failed to apply treatment. Please check console for details.');
    }
  };


  const applyValueTreatment = async () => {
    const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/apply_missing_value_treatment`, {
      columns: [selectedMissingValueColumn], // ✅ fix 'column' → 'columns' and wrap in array
      intervals: selectedValueIntervals.map(idx => valueIntervals[idx]),
      method: treatmentMethod                // ✅ fix 'treatment' → 'method'
  });
  alert(response.data.message);
};

  return (
    <div>
      <h1>Manufacturing Analytics Tool</h1>

      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <button onClick={fetchColumns}>Upload</button>
      <button onClick={handleDownload}>Download Treated Data</button>

      <div>
        <h2>Select Columns</h2>
        <label>
          <input
            type="checkbox"
            checked={selectAllColumns}
            onChange={(e) => setSelectAllColumns(e.target.checked)}
          />
          Select All
        </label>
        {columns.map((col) => (
          <label key={col}>
            <input
              type="checkbox"
              checked={selectedColumns.includes(col)}
              onChange={() =>
                setSelectedColumns((prev) =>
                  prev.includes(col) ? prev.filter((c) => c !== col) : [...prev, col]
                )
              }
            />
            {col}
          </label>
        ))}
      </div>

      <div>
        <button onClick={() => setAnalysisType("variability")}>Variability Analysis</button>
        <button onClick={() => setAnalysisType("anomaly")}>Anomaly Analysis</button>
        <button onClick={() => {
          setAnalysisType("outlier");
          setShowOutlierOptions(true);
        }}>Outlier Analysis</button>

        {analysisType && (
          <div>
            {analysisType === "outlier" && showOutlierOptions && (
              <>
                <select value={outlierMethod} onChange={(e) => setOutlierMethod(e.target.value)}>
                  <option value="zscore">Z-Score</option>
                  <option value="iqr">IQR</option>
                </select>
              </>
            )}
            <button onClick={handleAnalysis}>Run {analysisType} analysis</button>
          </div>
        )}
      </div>

      <div>
        <button onClick={() => setShowAnomalyTreatmentOptions(true)}>Anomaly Treatment</button>
        {showAnomalyTreatmentOptions && (
          <>
            <button onClick={() => {
              setAnomalyTreatmentType("datetime");
              fetchIntervals();
            }}>Missing Date Times</button>

            <button onClick={() => setAnomalyTreatmentType("values")}>Missing Values</button>

            {anomalyTreatmentType === "datetime" && (
              <>
                <h3>Select Intervals</h3>
                <label>
                  <input
                    type="checkbox"
                    checked={selectAllIntervals}
                    onChange={(e) => setSelectAllIntervals(e.target.checked)}
                  />
                  Select All
                </label>
                {intervals.map((interval, idx) => (
                  <label key={idx}>
                    <input
                      type="checkbox"
                      checked={selectedIntervals.includes(idx)}
                      onChange={() =>
                        setSelectedIntervals((prev) =>
                          prev.includes(idx)
                            ? prev.filter((i) => i !== idx)
                            : [...prev, idx]
                        )
                      }
                    />
                    {interval.start} to {interval.end}
                  </label>
                ))}
                <select onChange={(e) => setTreatmentMethod(e.target.value)}>
                  <option value="Mean">Mean</option>
                  <option value="Median">Median</option>
                  <option value="Forward fill">Forward Fill</option>
                  <option value="Backward fill">Backward Fill</option>
                  <option value="Delete rows">Delete Rows</option>
                </select>
                <button onClick={applyTreatment}>Apply Treatment</button>
              </>
            )}

            {anomalyTreatmentType === "values" && (
              <>
                <h3>Select Column</h3>
                <select onChange={(e) => setSelectedMissingValueColumn(e.target.value)}>
                  <option value="">-- Select --</option>
                  {columns.map((col) => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
                <button onClick={fetchValueIntervals}>Load Missing Value Intervals</button>
                {valueIntervals.map((interval, idx) => (
                  <label key={idx}>
                    <input
                      type="checkbox"
                      checked={selectedValueIntervals.includes(idx)}
                      onChange={() =>
                        setSelectedValueIntervals((prev) =>
                          prev.includes(idx)
                            ? prev.filter((i) => i !== idx)
                            : [...prev, idx]
                        )
                      }
                    />
                    {interval.start} to {interval.end}
                  </label>
                ))}
                <select onChange={(e) => setTreatmentMethod(e.target.value)}>
                  <option value="Mean">Mean</option>
                  <option value="Median">Median</option>
                  <option value="Forward fill">Forward Fill</option>
                </select>
                <button onClick={applyValueTreatment}>Apply Missing Value Treatment</button>
              </>
            )}
          </>
        )}
      </div>

      {plotData && (
        <Plot
          data={plotData.data}
          layout={plotData.layout}
          config={{ responsive: true }}
        />
      )}
    </div>
  );
};

export default App;
