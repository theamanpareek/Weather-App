import React, { useState } from 'react';
import { FaDownload, FaFileExport, FaFilter } from 'react-icons/fa';
import { exportAPI, formatAPIError } from '../services/api';

const ExportPanel = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [filters, setFilters] = useState({
    location: '',
    format: 'json'
  });

  const handleExport = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const result = await exportAPI.exportAll(filters.format, filters.location);
      
      if (result.success) {
        setSuccess(`Data exported successfully as ${filters.format.toUpperCase()}`);
      }
    } catch (err) {
      console.error('Export error:', err);
      setError(formatAPIError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear messages when filters change
    setError(null);
    setSuccess(null);
  };

  const formatOptions = [
    { value: 'json', label: 'JSON', description: 'Structured data format' },
    { value: 'csv', label: 'CSV', description: 'Spreadsheet compatible' },
    { value: 'markdown', label: 'Markdown', description: 'Human-readable format' }
  ];

  return (
    <div className="export-panel">
      <div className="panel-header">
        <h3>
          <FaFileExport className="icon" />
          Export Weather Data
        </h3>
        <p>Download all your saved weather data in various formats</p>
      </div>

      <div className="export-form">
        <div className="form-group">
          <label htmlFor="location-filter">
            <FaFilter className="icon" />
            Filter by Location (optional)
          </label>
          <input
            id="location-filter"
            type="text"
            value={filters.location}
            onChange={(e) => handleFilterChange('location', e.target.value)}
            placeholder="Enter location to filter (e.g., London, New York)"
            className="location-input"
          />
          <small className="help-text">
            Leave empty to export all entries, or enter a location name to filter results
          </small>
        </div>

        <div className="form-group">
          <label>Export Format</label>
          <div className="format-options">
            {formatOptions.map((option) => (
              <div
                key={option.value}
                className={`format-option ${filters.format === option.value ? 'selected' : ''}`}
                onClick={() => handleFilterChange('format', option.value)}
              >
                <div className="format-header">
                  <input
                    type="radio"
                    name="format"
                    value={option.value}
                    checked={filters.format === option.value}
                    onChange={() => handleFilterChange('format', option.value)}
                  />
                  <span className="format-label">{option.label}</span>
                </div>
                <p className="format-description">{option.description}</p>
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="message error-message">
            <strong>Export Failed:</strong> {error}
          </div>
        )}

        {success && (
          <div className="message success-message">
            <strong>Success:</strong> {success}
          </div>
        )}

        <div className="export-actions">
          <button
            onClick={handleExport}
            disabled={loading}
            className="export-btn"
          >
            {loading ? (
              <>
                <div className="spinner"></div>
                Exporting...
              </>
            ) : (
              <>
                <FaDownload className="icon" />
                Export Data
              </>
            )}
          </button>
        </div>
      </div>

      <div className="export-info">
        <h4>Export Information</h4>
        <ul>
          <li><strong>JSON:</strong> Complete data structure with all fields, ideal for backup or data analysis</li>
          <li><strong>CSV:</strong> Tabular format compatible with Excel and other spreadsheet applications</li>
          <li><strong>Markdown:</strong> Human-readable format perfect for documentation or reports</li>
        </ul>
        <p className="note">
          <strong>Note:</strong> Large datasets may take a moment to process. The file will automatically download when ready.
        </p>
      </div>

      <style jsx>{`
        .export-panel {
          background: white;
          border-radius: 0.5rem;
          padding: 1.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb;
          margin: 2rem 0;
        }

        .panel-header {
          margin-bottom: 1.5rem;
        }

        .panel-header h3 {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #1f2937;
          margin: 0 0 0.5rem 0;
        }

        .panel-header p {
          color: #6b7280;
          margin: 0;
        }

        .export-form {
          margin-bottom: 1.5rem;
        }

        .form-group {
          margin-bottom: 1.5rem;
        }

        .form-group label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 500;
          color: #374151;
          margin-bottom: 0.5rem;
        }

        .location-input {
          width: 100%;
          padding: 0.75rem;
          border: 2px solid #d1d5db;
          border-radius: 0.375rem;
          font-size: 1rem;
          transition: border-color 0.2s;
        }

        .location-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .help-text {
          display: block;
          margin-top: 0.25rem;
          font-size: 0.8rem;
          color: #6b7280;
        }

        .format-options {
          display: grid;
          gap: 0.75rem;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        }

        .format-option {
          border: 2px solid #d1d5db;
          border-radius: 0.375rem;
          padding: 1rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .format-option:hover {
          border-color: #9ca3af;
        }

        .format-option.selected {
          border-color: #3b82f6;
          background-color: #eff6ff;
        }

        .format-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }

        .format-label {
          font-weight: 500;
          color: #1f2937;
        }

        .format-description {
          font-size: 0.9rem;
          color: #6b7280;
          margin: 0;
        }

        .message {
          padding: 0.75rem;
          border-radius: 0.375rem;
          margin-bottom: 1rem;
        }

        .error-message {
          background-color: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
        }

        .success-message {
          background-color: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #16a34a;
        }

        .export-actions {
          display: flex;
          justify-content: center;
        }

        .export-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 2rem;
          background-color: #3b82f6;
          color: white;
          border: none;
          border-radius: 0.375rem;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .export-btn:hover:not(:disabled) {
          background-color: #2563eb;
        }

        .export-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .spinner {
          width: 1rem;
          height: 1rem;
          border: 2px solid transparent;
          border-top: 2px solid currentColor;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .export-info {
          background-color: #f9fafb;
          border-radius: 0.375rem;
          padding: 1rem;
          border: 1px solid #e5e7eb;
        }

        .export-info h4 {
          color: #1f2937;
          margin: 0 0 0.75rem 0;
        }

        .export-info ul {
          margin: 0 0 1rem 0;
          padding-left: 1.5rem;
        }

        .export-info li {
          margin-bottom: 0.5rem;
          color: #4b5563;
        }

        .note {
          font-size: 0.9rem;
          color: #6b7280;
          margin: 0;
          font-style: italic;
        }

        .icon {
          width: 1em;
          height: 1em;
        }

        @media (max-width: 640px) {
          .format-options {
            grid-template-columns: 1fr;
          }
          
          .export-btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default ExportPanel;
