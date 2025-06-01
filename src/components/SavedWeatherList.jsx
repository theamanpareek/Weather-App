import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaDownload, FaMapMarkerAlt, FaCalendarAlt, FaThermometerHalf } from 'react-icons/fa';
import { weatherAPI, exportAPI, formatAPIError } from '../services/api';
import { format } from 'date-fns';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

const SavedWeatherList = ({ onEdit, refreshTrigger }) => {
  const [savedEntries, setSavedEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [exportLoading, setExportLoading] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalEntries: 0
  });

  const fetchSavedEntries = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await weatherAPI.getAll({
        page,
        limit: 10,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
      
      if (response.success) {
        setSavedEntries(response.data);
        setPagination(response.pagination);
      } else {
        throw new Error(response.error || 'Failed to fetch saved entries');
      }
    } catch (err) {
      console.error('Error fetching saved entries:', err);
      setError(formatAPIError(err));
      setSavedEntries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSavedEntries();
  }, [refreshTrigger]);

  const handleDelete = async (id, location) => {
    if (!window.confirm(`Are you sure you want to delete the weather entry for "${location}"?`)) {
      return;
    }

    try {
      setDeleteLoading(id);
      const response = await weatherAPI.delete(id);
      
      if (response.success) {
        // Remove the deleted entry from the list
        setSavedEntries(prev => prev.filter(entry => entry._id !== id));
        
        // If this was the last item on the current page and we're not on page 1, go to previous page
        if (savedEntries.length === 1 && pagination.currentPage > 1) {
          fetchSavedEntries(pagination.currentPage - 1);
        } else {
          // Refresh the current page
          fetchSavedEntries(pagination.currentPage);
        }
      } else {
        throw new Error(response.error || 'Failed to delete entry');
      }
    } catch (err) {
      console.error('Error deleting entry:', err);
      setError(formatAPIError(err));
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleExport = async (id, format, location) => {
    try {
      setExportLoading(`${id}-${format}`);
      await exportAPI.exportById(id, format);
      // Success message is handled by the download
    } catch (err) {
      console.error('Error exporting entry:', err);
      setError(formatAPIError(err));
    } finally {
      setExportLoading(null);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchSavedEntries(newPage);
    }
  };

  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return 'Invalid date';
    }
  };

  const getWeatherIcon = (iconCode) => {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  };

  if (loading) {
    return <LoadingSpinner message="Loading saved weather entries..." />;
  }

  if (error) {
    return (
      <ErrorMessage
        message={error}
        onRetry={() => fetchSavedEntries(pagination.currentPage)}
      />
    );
  }

  if (savedEntries.length === 0) {
    return (
      <div className="no-saved-entries">
        <h3>No Saved Weather Entries</h3>
        <p>You haven't saved any weather data yet. Search for a location and save the results to see them here.</p>
      </div>
    );
  }

  return (
    <div className="saved-weather-list">
      <div className="list-header">
        <h3>Saved Weather Entries ({pagination.totalEntries})</h3>
      </div>

      <div className="entries-grid">
        {savedEntries.map((entry) => (
          <div key={entry._id} className="weather-entry-card">
            <div className="entry-header">
              <div className="location-info">
                <h4>
                  <FaMapMarkerAlt className="icon" />
                  {entry.location}
                </h4>
                <p className="coordinates">
                  {entry.coordinates.lat.toFixed(4)}, {entry.coordinates.lon.toFixed(4)}
                </p>
              </div>
              
              {entry.currentWeather?.weather?.[0]?.icon && (
                <img
                  src={getWeatherIcon(entry.currentWeather.weather[0].icon)}
                  alt={entry.currentWeather.weather[0].description}
                  className="weather-icon"
                />
              )}
            </div>

            <div className="entry-content">
              <div className="date-range">
                <FaCalendarAlt className="icon" />
                <span>
                  {formatDate(entry.dateRange.startDate)} - {formatDate(entry.dateRange.endDate)}
                </span>
              </div>

              {entry.currentWeather && (
                <div className="current-weather">
                  <div className="temperature">
                    <FaThermometerHalf className="icon" />
                    <span>{Math.round(entry.currentWeather.main.temp)}°C</span>
                    <small>feels like {Math.round(entry.currentWeather.main.feels_like)}°C</small>
                  </div>
                  <div className="weather-desc">
                    {entry.currentWeather.weather[0].description}
                  </div>
                  <div className="weather-details">
                    <span>Humidity: {entry.currentWeather.main.humidity}%</span>
                    <span>Wind: {entry.currentWeather.wind.speed} m/s</span>
                  </div>
                </div>
              )}

              <div className="entry-meta">
                <small>Created: {formatDate(entry.createdAt)}</small>
                {entry.updatedAt !== entry.createdAt && (
                  <small>Updated: {formatDate(entry.updatedAt)}</small>
                )}
              </div>
            </div>

            <div className="entry-actions">
              <button
                onClick={() => onEdit(entry)}
                className="action-btn edit-btn"
                title="Edit entry"
              >
                <FaEdit />
              </button>

              <div className="export-dropdown">
                <button className="action-btn export-btn" title="Export entry">
                  <FaDownload />
                </button>
                <div className="export-options">
                  <button
                    onClick={() => handleExport(entry._id, 'json', entry.location)}
                    disabled={exportLoading === `${entry._id}-json`}
                    style={{color: '#000'}}
                  >
                    JSON
                  </button>
                  <button
                    onClick={() => handleExport(entry._id, 'csv', entry.location)}
                    disabled={exportLoading === `${entry._id}-csv`}
                    style={{color: '#000'}}
                  >
                    CSV
                  </button>
                  <button
                    onClick={() => handleExport(entry._id, 'markdown', entry.location)}
                    disabled={exportLoading === `${entry._id}-markdown`}
                    style={{color: '#000'}}
                  >
                    Markdown
                  </button>
                </div>
              </div>

              <button
                onClick={() => handleDelete(entry._id, entry.location)}
                className="action-btn delete-btn"
                disabled={deleteLoading === entry._id}
                title="Delete entry"
              >
                {deleteLoading === entry._id ? '...' : <FaTrash />}
              </button>
            </div>
          </div>
        ))}
      </div>

      {pagination.totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 1}
            className="page-btn"
          >
            Previous
          </button>
          
          <span className="page-info">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          
          <button
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={pagination.currentPage === pagination.totalPages}
            className="page-btn"
          >
            Next
          </button>
        </div>
      )}

      <style jsx>{`
        .saved-weather-list {
          margin: 2rem 0;
        }

        .list-header h3 {
          color: #1f2937;
          margin-bottom: 1rem;
        }

        .no-saved-entries {
          text-align: center;
          padding: 2rem;
          background: #f9fafb;
          border-radius: 0.5rem;
          border: 2px dashed #d1d5db;
        }

        .no-saved-entries h3 {
          color: #6b7280;
          margin-bottom: 0.5rem;
        }

        .no-saved-entries p {
          color: #9ca3af;
        }

        .entries-grid {
          display: grid;
          gap: 1rem;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
        }

        .weather-entry-card {
          background: white;
          border-radius: 0.5rem;
          padding: 1rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          border: 1px solid #e5e7eb;
          transition: transform 0.2s, box-shadow 0.2s;
        }

        .weather-entry-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .entry-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .location-info h4 {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin: 0 0 0.25rem 0;
          color: #1f2937;
          font-size: 1.1rem;
        }

        .coordinates {
          font-size: 0.8rem;
          color: #6b7280;
          margin: 0;
        }

        .weather-icon {
          width: 50px;
          height: 50px;
        }

        .entry-content {
          margin-bottom: 1rem;
        }

        .date-range {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.75rem;
          font-size: 0.9rem;
          color: #4b5563;
        }

        .current-weather {
          margin-bottom: 0.75rem;
        }

        .temperature {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.25rem;
        }

        .temperature span {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1f2937;
        }

        .temperature small {
          color: #6b7280;
        }

        .weather-desc {
          font-size: 0.9rem;
          color: #4b5563;
          margin-bottom: 0.5rem;
          text-transform: capitalize;
        }

        .weather-details {
          display: flex;
          gap: 1rem;
          font-size: 0.8rem;
          color: #6b7280;
        }

        .entry-meta {
          font-size: 0.75rem;
          color: #9ca3af;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .entry-actions {
          display: flex;
          gap: 0.5rem;
          justify-content: flex-end;
          align-items: center;
        }

        .action-btn {
          padding: 0.5rem;
          border: none;
          border-radius: 0.25rem;
          cursor: pointer;
          transition: background-color 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .edit-btn {
          background-color: #3b82f6;
          color: white;
        }

        .edit-btn:hover {
          background-color: #2563eb;
        }

        .export-dropdown {
          position: relative;
        }

        .export-btn {
          background-color: #10b981;
          color: white;
        }

        .export-btn:hover {
          background-color: #059669;
        }

        .export-dropdown:hover .export-options {
          display: block;
        }

        .export-options {
          display: none;
          position: absolute;
          top: 100%;
          right: 0;
          background: white;
          border: 1px solid #d1d5db;
          border-radius: 0.25rem;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          z-index: 10;
          min-width: 100px;
        }

        .export-options button {
          display: block;
          width: 100%;
          padding: 0.5rem;
          border: none;
          background: none;
          text-align: left;
          cursor: pointer;
          font-size: 0.8rem;
        }

        .export-options button:hover {
          background-color: #f3f4f6;
        }

        .export-options button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .delete-btn {
          background-color: #ef4444;
          color: white;
        }

        .delete-btn:hover:not(:disabled) {
          background-color: #dc2626;
        }

        .delete-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 1rem;
          margin-top: 2rem;
        }

        .page-btn {
          padding: 0.5rem 1rem;
          border: 1px solid #d1d5db;
          background: white;
          border-radius: 0.25rem;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .page-btn:hover:not(:disabled) {
          background-color: #f3f4f6;
        }

        .page-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .page-info {
          font-size: 0.9rem;
          color: #6b7280;
        }

        .icon {
          width: 1em;
          height: 1em;
        }

        @media (max-width: 768px) {
          .entries-grid {
            grid-template-columns: 1fr;
          }
          
          .weather-details {
            flex-direction: column;
            gap: 0.25rem;
          }
        }
      `}</style>
    </div>
  );
};

export default SavedWeatherList;
