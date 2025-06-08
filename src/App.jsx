import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [file, setFile] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [htmlChart, setHtmlChart] = useState("");

  const handleFileUpload = async () => {
    const formData = new FormData();
    formData.append("file", file);
    await axios.post(`${process.env.REACT_APP_BACKEND_URL}/upload`, formData);
    alert("File uploaded");
  };

  const handleChat = async () => {
    const res = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/chat`, { prompt });
    const data = res.data.response;

    // Simple heuristic: check if it contains full HTML
    if (typeof data === 'string' && data.includes('<html')) {
      setHtmlChart(data);
      setResponse("");
    } else {
      setResponse(data);
      setHtmlChart("");
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: 'auto' }}>
      <h1>Manufacturing Co-Pilot</h1>

      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <button onClick={handleFileUpload} style={{ marginLeft: '1rem' }}>Upload</button>

      <div style={{ marginTop: '2rem' }}>
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask your data..."
          style={{ width: '100%', padding: '0.5rem' }}
        />
        <button onClick={handleChat} style={{ marginTop: '1rem' }}>Send</button>

        {response && (
          <pre style={{ marginTop: '1rem', background: '#f0f0f0', padding: '1rem' }}>{response}</pre>
        )}

        {htmlChart && (
          <div
            key={Date.now()}  // Forces re-render on new chart
            dangerouslySetInnerHTML={{ __html: htmlChart }}
            style={{ marginTop: '2rem' }}
          />
        )}
      </div>
    </div>
  );
}

export default App;
