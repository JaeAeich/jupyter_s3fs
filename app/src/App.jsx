import React, { useState, useEffect } from 'react';
import axios from 'axios';

const App = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('');
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [workflowId, setWorkflowId] = useState('');
  const [taskId, setTaskId] = useState('');
  const [fetchError, setFetchError] = useState(null);
  const [isFetching, setIsFetching] = useState(false);

  const serverUrl = '/api';
  const jupyterHubUrl = '/jupyter';

  if (!serverUrl || !jupyterHubUrl) {
    console.error('Missing required environment variables!');
    process.exit(1);
  }

  useEffect(() => {
    fetchFiles(); // Initial fetch
    
    const intervalId = setInterval(() => {
      fetchFiles();
    }, 10000); // Refresh every 10 seconds
    
    return () => clearInterval(intervalId); // Cleanup on unmount
  }, []);

  const fetchFiles = async () => {
    setIsFetching(true);
    setFetchError(null);
    
    try {
      const response = await axios.get(`${serverUrl}/files`);
      console.log('Files response:', response.data); // Debug log
      
      if (Array.isArray(response.data)) {
        setFiles(response.data);
      } else {
        console.error('Unexpected response format:', response.data);
        setFetchError('Received invalid data format from server');
      }
    } catch (error) {
      console.error('Error fetching files:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Error fetching files';
      setFetchError(errorMessage);
      setFiles([]); // Clear files on error
    } finally {
      setIsFetching(false);
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

    if (!workflowId.trim()) {
      setUploadStatus('Workflow ID is required');
      return;
    }

    if (!taskId.trim()) {
      setUploadStatus('Task ID is required');
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('workflowId', workflowId);
    formData.append('taskId', taskId);

    try {
      const response = await axios.post(`${serverUrl}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setUploadStatus(`File uploaded successfully to ${response.data.path}`);
      setSelectedFile(null);
      setWorkflowId('');
      setTaskId('');
      fetchFiles();
    } catch (error) {
      console.error('Error uploading file:', error);
      if (error.response?.status === 409) {
        setUploadStatus(`Error: File already exists at ${error.response.data.path}`);
      } else {
        setUploadStatus('Error uploading file');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleExploreInJupyter = (filePath) => {
    window.location.href = `${jupyterHubUrl}?path=${encodeURIComponent(filePath)}`;
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Run <i>your</i> Workflow</h1>
      
      <div className="mb-8 p-6 bg-white rounded-lg shadow-md">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Workflow ID *
          </label>
          <input
            type="text"
            value={workflowId}
            onChange={(e) => setWorkflowId(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter workflow ID"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Task ID *
          </label>
          <input
            type="text"
            value={taskId}
            onChange={(e) => setTaskId(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter task ID"
          />
        </div>

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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">File Path</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Workflow ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Task ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Size</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Modified</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {files.map((file, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {file.fullPath}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {file.workflowId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {file.taskId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {Math.round(file.size / 1024)} KB
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(file.lastModified).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => handleExploreInJupyter(file.fullPath)}
                      className="bg-green-500 text-white px-3 py-1 rounded-md hover:bg-green-600"
                    >
                      Explore in Jupyter
                    </button>
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
