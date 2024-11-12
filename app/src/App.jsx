import React, { useState, useEffect } from 'react';
import axios from 'axios';

const App = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const serverUrl = '/api'
  const jupyterHubUrl = '/jupyter'

  if (!serverUrl || !jupyterHubUrl) {
      console.error('Missing required environment variables!');
      process.exit(1);
  }

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    try {
      const response = await axios.get(`${serverUrl}/files`);
      setFiles(response.data);
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  };

  const handleFileSelect = (event) => {
    setSelectedFile(event.target.files[0]);
    setUploadStatus('');
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadStatus('Please select a file first');
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      await axios.post(`${serverUrl}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setUploadStatus('File uploaded successfully!');
      setSelectedFile(null);
      fetchFiles(); // Refresh the file list
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadStatus('Error uploading file');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
        <h1 className="text-3xl font-bold mb-4 sm:mb-0">Run <i>your</i> Workflow</h1>
        <button
          onClick={() => window.location.href = jupyterHubUrl}
          className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
        >
          Jupyter Notebook
        </button>
      </div>
      <div className="mb-8 p-6 bg-white rounded-lg shadow-md">
        <input
          type="file"
          onChange={handleFileSelect}
          className="mb-4 block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-md file:border-0
            file:text-sm file:font-semibold
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100"
        />
        <button
          onClick={handleUpload}
          disabled={!selectedFile || isLoading}
          className="bg-blue-500 text-white px-4 py-2 rounded-md
            hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
        {isLoading ? 'Running...' : 'Run workflow'}
        </button>
        {uploadStatus && (
          <p className={`mt-2 ${
            uploadStatus.includes('Error') ? 'text-red-500' : 'text-green-500'
          }`}>
            {uploadStatus}
          </p>
        )}
      </div>



      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <h2 className="text-xl font-semibold p-4 bg-gray-50">Uploaded Files</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Modified</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {files.map((file, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{file.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {Math.round(file.size / 1024)} KB
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(file.lastModified).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default App;
