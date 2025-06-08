import React, { useState } from "react";
import axios from "axios";
import Plot from "react-plotly.js";

function App() {
  const [file, setFile] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [plotData, setPlotData] = useState(null);

  const handleFileUpload = async () => {
    if (!file) {
      alert("Please select a file first.");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("file", file);
      await axios.post(`${process.env.REACT_APP_BACKEND_URL}/upload`, formData);
      alert("File uploaded successfully");
    } catch (error) {
      alert("File upload failed");
      console.error(error);
    }
  };

  const handleChat = async () => {
    if (!prompt.trim()) {
      alert("Please enter a prompt");
      return;
    }
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
    } catch (error) {
      alert("Request failed");
      console.error(error);
    }
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "800px", margin: "auto" }}>
      <h1>Manufacturing Co-Pilot</h1>

      <input
        type="file"
        onChange={(e) => setFile(e.target.files[0])}
        accept=".csv, application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      />
      <button onClick={handleFileUpload} style={{ marginLeft: "1rem" }}>
        Upload
      </button>

      <div style={{ marginTop: "2rem" }}>
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask your data..."
          style={{ width: "100%", padding: "0.5rem" }}
        />
        <button onClick={handleChat} style={{ marginTop: "1rem" }}>
          Send
        </button>

        {response && (
          <pre style={{ marginTop: "1rem", background: "#f0f0f0", padding: "1rem" }}>
            {response}
          </pre>
        )}

        {plotData && (
          <Plot
            data={plotData.data}
            layout={plotData.layout}
            config={{ responsive: true }}
            style={{ marginTop: "2rem", width: "100%", height: "600px" }}
          />
        )}
      </div>
    </div>
  );
}

export default App;
