import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [file, setFile] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");

  const handleFileUpload = async () => {
    const formData = new FormData();
    formData.append("file", file);
    await axios.post(`${process.env.REACT_APP_BACKEND_URL}/upload`, formData);
    alert("File uploaded");
  };

  const handleChat = async () => {
    const res = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/chat`, { prompt });
    setResponse(res.data.response);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: 'auto' }}>
      <h1>Manufacturing Co-Pilot</h1>
      <input type="file" onChange={(e) => setFile(e.target.files[0])} />
      <button onClick={handleFileUpload}>Upload</button>

      <div style={{ marginTop: '1rem' }}>
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask your data..."
          style={{ width: '100%', padding: '0.5rem' }}
        />
        <button onClick={handleChat}>Send</button>
        <pre style={{ marginTop: '1rem', background: '#f0f0f0', padding: '1rem' }}>
          {response}
        </pre>
      </div>
    </div>
  );
}

export default App;
