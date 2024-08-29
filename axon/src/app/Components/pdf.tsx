'use client'
import React, { useState } from 'react';
import axios from 'axios';

const PdfUploader = () => {
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');

  const handleFileChange = (event:any) => {
    setFile(event.target.files[0]);
  };

  const handleFileUpload = async () => {
    if (!file) {
      setMessage('Please select a file first.');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://127.0.0.1:5000/uploadFile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setMessage('File uploaded successfully');
      console.log(response.data);
    } catch (error) {
      setMessage('Failed to upload file');
      console.error(error);
    }
  };

  return (
    <div>
      <h2>Upload PDF File</h2>
      <input type="file" accept=".pdf" onChange={handleFileChange} />
      <button onClick={handleFileUpload}>Upload</button>
      {message && <p>{message}</p>}
    </div>
  );
};

export default PdfUploader;