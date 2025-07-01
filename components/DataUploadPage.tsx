
import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProcessEvent, AlertNotification, NavigationPath } from '../types';
import { ArrowUpTrayIcon, DocumentTextIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
// Note: For CSV parsing, a library like PapaParse would typically be used for full robustness.
// This example uses a simplified parser.

interface DataUploadPageProps {
  setProcessData: (data: ProcessEvent[] | null) => void;
  addAlert: (type: AlertNotification['type'], message: string) => void;
}

const DataUploadPage: React.FC<DataUploadPageProps> = ({ setProcessData, addAlert }) => {
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
      setError(null);
      setProcessData(null); // Clear previous data
    }
  };

  const parseCSV = (csvText: string): ProcessEvent[] => {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) throw new Error("CSV file must have a header and at least one data row.");
    
    let headerLine = lines[0];
    // Remove BOM if present (UTF-8 BOM is \uFEFF)
    if (headerLine.startsWith('\ufeff')) {
      headerLine = headerLine.substring(1);
    }
    
    const processedHeaders = headerLine.split(',').map(h =>
      h.trim()
       .replace(/^["']|["']$/g, '')
       .trim()
       .toLowerCase()
    );

    // Updated findHeaderIndex to accept an array of possible target names (all lowercase)
    const findHeaderIndex = (targetNames: string[]): number => {
        for (const targetName of targetNames) {
            const index = processedHeaders.indexOf(targetName);
            if (index !== -1) {
                return index;
            }
        }
        return -1;
    };

    // Define primary and alias names (all lowercase)
    const caseIdAliases = ['caseid', 'case_id', 'casenumber', 'case number', 'traceid', 'trace_id'];
    const activityAliases = ['activity', 'event', 'task', 'activityname', 'activity_name', 'event_name', 'task_name'];
    const timestampAliases = ['timestamp', 'time_stamp', 'time', 'date', 'datetime', 'start_time', 'starttime', 'end_time', 'endtime', 'event_time'];
    
    const resourceAliases = ['resource', 'user', 'agent', 'staff', 'resource_name', 'resourcename', 'performer'];
    const costAliases = ['cost', 'amount', 'value', 'costs'];

    const caseIdIndex = findHeaderIndex(caseIdAliases); 
    const activityIndex = findHeaderIndex(activityAliases);
    const timestampIndex = findHeaderIndex(timestampAliases);

    if (caseIdIndex === -1 || activityIndex === -1 || timestampIndex === -1) {
      const missingHeaders = [];
      if (caseIdIndex === -1) missingHeaders.push('caseId (e.g., case_id, casenumber)');
      if (activityIndex === -1) missingHeaders.push('activity (e.g., event_name, task)');
      if (timestampIndex === -1) missingHeaders.push('timestamp (e.g., time_stamp, event_time)');
      
      console.error('Processed headers:', processedHeaders);
      console.error('Expected aliases for caseId:', caseIdAliases);
      console.error('Expected aliases for activity:', activityAliases);
      console.error('Expected aliases for timestamp:', timestampAliases);
      throw new Error(`CSV must contain compatible 'caseId', 'activity', and 'timestamp' columns (case-insensitive). Missing or unrecognized: ${missingHeaders.join(', ')}.`);
    }
    
    const resourceIndex = findHeaderIndex(resourceAliases);
    const costIndex = findHeaderIndex(costAliases);

    return lines.slice(1).map((line, index) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return null; // Skip empty lines

      // Basic parser: assumes commas are not within quoted fields.
      const values = trimmedLine.split(','); 
      
      const caseId = values[caseIdIndex]?.trim();
      const activity = values[activityIndex]?.trim();
      const timestamp = values[timestampIndex]?.trim();

      if (!caseId || !activity || !timestamp) {
        addAlert('warning', `Skipping row ${index + 2} due to missing required fields (caseId, activity, or timestamp). Ensure these columns have values.`);
        return null;
      }

      return {
        caseId,
        activity,
        timestamp,
        resource: resourceIndex !== -1 && values[resourceIndex] ? values[resourceIndex].trim() : undefined,
        cost: costIndex !== -1 && values[costIndex] ? parseFloat(values[costIndex].trim()) : undefined,
      };
    }).filter(event => event !== null) as ProcessEvent[];
  };

  const handleFileUpload = useCallback(async () => {
    if (!file) {
      setError('Please select a file first.');
      addAlert('warning', 'No file selected for upload.');
      return;
    }

    setIsParsing(true);
    setError(null);

    try {
      const fileText = await file.text();
      let parsedData: ProcessEvent[];

      if (file.type === 'application/json' || file.name.endsWith('.json')) {
        parsedData = JSON.parse(fileText);
        if (!Array.isArray(parsedData) || !parsedData.every(item => item.caseId && item.activity && item.timestamp)) {
            throw new Error('Invalid JSON format. Expected an array of events with caseId, activity, and timestamp.');
        }
      } else if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        parsedData = parseCSV(fileText);
      } else {
        throw new Error('Unsupported file type. Please upload CSV or JSON.');
      }
      
      setProcessData(parsedData);
      if (parsedData.length > 0) {
        addAlert('success', `Successfully parsed ${parsedData.length} events from ${file.name}.`);
        navigate(NavigationPath.Analyzer); // Navigate to Analyzer page on success
      } else {
        addAlert('warning', `Parsed ${file.name}, but no valid events were found. Please check file content and format, including required column headers and data.`);
      }
      setFile(null); 
      setFileName('');

    } catch (e: any) {
      console.error("Error parsing file:", e);
      setError(`Error parsing file: ${e.message}`);
      addAlert('error', `Failed to parse ${file.name}: ${e.message}`);
      setProcessData(null);
    } finally {
      setIsParsing(false);
    }
  }, [file, addAlert, setProcessData, navigate]);

  return (
    <div className="max-w-2xl mx-auto p-6 sm:p-8 glassmorphism animate-fadeIn">
      <h2 className="text-3xl font-bold text-white mb-8 text-center">Upload Process Data</h2>
      
      <div className="mb-6">
        <label
          htmlFor="file-upload"
          className="relative cursor-pointer bg-slate-700 hover:bg-slate-600 rounded-lg border-2 border-dashed border-slate-500 p-8 flex flex-col items-center justify-center transition-colors duration-200"
        >
          <ArrowUpTrayIcon className="w-16 h-16 text-brand-teal mb-4" />
          <span className="text-xl font-semibold text-gray-200">
            {fileName || 'Click to upload or drag and drop'}
          </span>
          <p className="text-sm text-gray-400 mt-1">CSV or JSON files accepted</p>
          <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".csv, .json, application/json, text/csv" />
        </label>
      </div>

      {file && (
        <div className="mb-6 p-4 bg-slate-700/50 rounded-lg flex items-center justify-between">
            <div className="flex items-center">
                <DocumentTextIcon className="h-6 w-6 text-brand-teal mr-3" />
                <span className="text-gray-300">{file.name} ({(file.size / 1024).toFixed(2)} KB)</span>
            </div>
            <button onClick={() => {setFile(null); setFileName(''); setProcessData(null); setError(null);}} className="text-red-400 hover:text-red-300">
                <XCircleIcon className="h-6 w-6"/>
            </button>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-500/20 text-red-300 rounded-lg flex items-center">
          <XCircleIcon className="h-5 w-5 mr-2"/>
          {error}
        </div>
      )}

      <button
        onClick={handleFileUpload}
        disabled={!file || isParsing}
        className="w-full flex items-center justify-center bg-brand-teal hover:bg-brand-teal/80 text-white font-semibold py-3 px-6 rounded-lg shadow-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
      >
        {isParsing ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Parsing...
          </>
        ) : (
          <>
            <CheckCircleIcon className="h-6 w-6 mr-2" />
            Parse and Load Data
          </>
        )}
      </button>

      <div className="mt-8 text-sm text-gray-400">
        <h4 className="font-semibold text-gray-300 mb-2">Required CSV Columns (case-insensitive, common aliases supported):</h4>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>Case Identifier:</strong> e.g., `caseId`, `case_id`, `casenumber`</li>
          <li><strong>Activity Name:</strong> e.g., `activity`, `event_name`, `task`</li>
          <li><strong>Timestamp:</strong> e.g., `timestamp`, `time_stamp`, `event_time` (parsable date string)</li>
        </ul>
        <h4 className="font-semibold text-gray-300 mt-3 mb-2">Optional CSV Columns:</h4>
        <ul className="list-disc list-inside space-y-1">
            <li><strong>Resource:</strong> e.g., `resource`, `user`, `agent`</li>
            <li><strong>Cost:</strong> e.g., `cost`, `amount`</li>
        </ul>
         <p className="mt-2">For JSON, provide an array of event objects. Each object must have `caseId`, `activity`, `timestamp` keys.</p>
      </div>
    </div>
  );
};

export default DataUploadPage;
