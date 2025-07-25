import React, { useState, useEffect } from "react";
import axios from "axios";

function App() {
  const [file, setFile] = useState(null);
  const [columns, setColumns] = useState([]);
  const [intervals, setIntervals] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [selectedIntervals, setSelectedIntervals] = useState([]);
  const [selectAllColumns, setSelectAllColumns] = useState(false);
  const [selectAllIntervals, setSelectAllIntervals] = useState(false);
  const [method, setMethod] = useState("");

  const fetchColumns = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/get_columns`);
      setColumns(res.data.columns || []);
      setSelectedColumns([]); // Reset selection
      setSelectAllColumns(false);
    } catch (error) {
      console.error("Error fetching columns:", error);
    }
  };

  const fetchIntervals = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/missing_datetime_intervals`);
      setIntervals(res.data.intervals || []);
      setSelectedIntervals([]);
      setSelectAllIntervals(false);
    } catch (error) {
      console.error("Error fetching intervals:", error);
    }
  };

  useEffect(() => {
    fetchColumns();
    fetchIntervals();
  }, []);

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleFileUpload = async () => {
    if (!file) return alert("Please select a file first.");
    const formData = new FormData();
    formData.append("file", file);
    try {
      await axios.post(`${process.env.REACT_APP_BACKEND_URL}/upload`, formData);
      alert("File uploaded successfully");
      await fetchColumns();     // 🔄 Update columns after file upload
      await fetchIntervals();   // 🔄 Update intervals
    } catch (error) {
      alert("Upload failed");
      console.error("Upload error:", error);
    }
  };

  const handleTreatmentApply = async () => {
    if (selectedColumns.length === 0 || selectedIntervals.length === 0 || !method) {
      return alert("Please select columns, intervals, and a treatment method.");
    }

    const payload = {
      columns: selectedColumns,
      intervals: selectedIntervals,
      method,
    };

    try {
      const res = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/apply_treatment`, payload);
      alert(res.data.message || "Treatment applied successfully");
    } catch (error) {
      alert("Treatment failed");
      console.error("Treatment error:", error);
    }
  };

  const handleDownload = async () => {
    try {
      const res = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/download`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "treated_file.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert("Download failed");
      console.error("Download error:", error);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Manufacturing Co-Pilot</h2>

      <div>
        <input type="file" onChange={handleFileChange} />
        <button onClick={handleFileUpload}>Upload</button>
      </div>

      <hr />

      <div>
        <h3>Select Columns</h3>
        <label>
          <input
            type="checkbox"
            checked={selectAllColumns}
            onChange={(e) => {
              setSelectAllColumns(e.target.checked);
              setSelectedColumns(e.target.checked ? [...columns] : []);
            }}
          />
          Select All
        </label>
        <div style={{ maxHeight: "150px", overflowY: "auto", border: "1px solid #ccc", padding: "5px" }}>
          {columns.map((col) => (
            <label key={col} style={{ display: "block" }}>
              <input
                type="checkbox"
                checked={selectedColumns.includes(col)}
                onChange={() => {
                  const newSelection = selectedColumns.includes(col)
                    ? selectedColumns.filter((c) => c !== col)
                    : [...selectedColumns, col];
                  setSelectedColumns(newSelection);
                  setSelectAllColumns(newSelection.length === columns.length);
                }}
              />
              {col}
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3>Select Intervals</h3>
        <label>
          <input
            type="checkbox"
            checked={selectAllIntervals}
            onChange={(e) => {
              setSelectAllIntervals(e.target.checked);
              setSelectedIntervals(e.target.checked ? [...intervals] : []);
            }}
          />
          Select All
        </label>
        <div style={{ maxHeight: "150px", overflowY: "auto", border: "1px solid #ccc", padding: "5px" }}>
          {intervals.map((interval, index) => (
            <label key={index} style={{ display: "block" }}>
              <input
                type="checkbox"
                checked={selectedIntervals.some(
                  (i) => i.start === interval.start && i.end === interval.end
                )}
                onChange={() => {
                  const exists = selectedIntervals.some(
                    (i) => i.start === interval.start && i.end === interval.end
                  );
                  const updated = exists
                    ? selectedIntervals.filter(
                        (i) => !(i.start === interval.start && i.end === interval.end)
                      )
                    : [...selectedIntervals, interval];
                  setSelectedIntervals(updated);
                  setSelectAllIntervals(updated.length === intervals.length);
                }}
              />
              {interval.start} to {interval.end}
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3>Select Treatment Method</h3>
        <select value={method} onChange={(e) => setMethod(e.target.value)}>
          <option value="">--Select--</option>
          <option value="Forward fill">Forward fill</option>
          <option value="Backward fill">Backward fill</option>
          <option value="Mean">Mean</option>
          <option value="Median">Median</option>
          <option value="Delete rows">Delete rows</option>
        </select>
      </div>

      <button onClick={handleTreatmentApply}>Apply Treatment</button>
      <button onClick={handleDownload}>Download Treated File</button>
    </div>
  );
}

export default App;
