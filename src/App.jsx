import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [file, setFile] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [imageBase64, setImageBase64] = useState(null);

  const handleFileUpload = async () => {
    const formData = new FormData();
    formData.append("file", file);
    await axios.post(`${process.env.REACT_APP_BACKEND_URL}/upload`, formData);
    alert("File uploaded");
  };

  const handleChat = async () => {
    const res = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/chat`, { prompt });
    const data = res.data.response;

    // Check if response includes a base64 image
    if (typeof data === 'string' && data.startsWith('[Image] data:image/png;base64,')) {
      setImageBase64(data.replace('[Image] ', ''));
      setResponse("");
    } else {
      setResponse(data);
      setImageBase64(null);
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

        {imageBase64 && (
          <img
            src={imageBase64}
            alt="Analysis Result"
            style={{ marginTop: '2rem', maxWidth: '100%', border: '1px solid #ccc' }}
          />
        )}
      </div>
    </div>
  );
}

export default App;
