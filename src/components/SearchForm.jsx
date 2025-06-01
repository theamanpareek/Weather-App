import React, { useState } from 'react';
import { MdSearch, MdLocationOn, MdSave } from 'react-icons/md';
import { subDays } from 'date-fns';
import DateRangePicker from './DateRangePicker';

const SearchForm = ({ onSearch, onUseLocation, onSaveWeather, loading, mode = 'search' }) => {
  const [location, setLocation] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: subDays(new Date(), 1),
    endDate: new Date(),
    isValid: true
  });
  const [includeExtras, setIncludeExtras] = useState({
    youtube: false,
    maps: false
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (location.trim()) {
      if (mode === 'search') {
        onSearch(location.trim());
      } else if (mode === 'save' && dateRange.isValid) {
        onSaveWeather({
          location: location.trim(),
          startDate: dateRange.startDate.toISOString(),
          endDate: dateRange.endDate.toISOString(),
          includeYouTube: includeExtras.youtube,
          includeMaps: includeExtras.maps
        });
      }
    }
  };

  const handleDateChange = (newDateRange) => {
    setDateRange(newDateRange);
  };

  const handleExtraChange = (type, value) => {
    setIncludeExtras(prev => ({
      ...prev,
      [type]: value
    }));
  };

  const isFormValid = location.trim() && (mode === 'search' || dateRange.isValid);

  return (
    <div className="search-form-container">
      <form onSubmit={handleSubmit} className="search-form">
        <div className="search-input-container">
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Enter city name, zip code, or coordinates (lat,lon)"
            className="search-input"
            disabled={loading}
          />
          <button
            type="submit"
            className="search-button"
            disabled={loading || !isFormValid}
          >
            {mode === 'save' ? <MdSave /> : <MdSearch />}
          </button>
        </div>

        {mode === 'save' && (
          <>
            <DateRangePicker
              startDate={dateRange.startDate}
              endDate={dateRange.endDate}
              onDateChange={handleDateChange}
              disabled={loading}
            />

            <div className="extras-section">
              <h4>Additional Features (Optional)</h4>
              <div className="extras-options">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={includeExtras.youtube}
                    onChange={(e) => handleExtraChange('youtube', e.target.checked)}
                    disabled={loading}
                  />
                  <span>Include YouTube videos about this location</span>
                </label>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={includeExtras.maps}
                    onChange={(e) => handleExtraChange('maps', e.target.checked)}
                    disabled={loading}
                  />
                  <span>Include Google Maps data</span>
                </label>
              </div>
            </div>
          </>
        )}
      </form>

      {mode === 'search' && (
        <>
          <div className="location-divider">
            <span>or</span>
          </div>

          <button
            onClick={onUseLocation}
            className="location-button"
            disabled={loading}
          >
            <MdLocationOn />
            Use My Location
          </button>
        </>
      )}

      <div className="search-examples">
        <p>Examples:</p>
        <ul>
          <li>New York, NY</li>
          <li>10001</li>
          <li>40.7128,-74.0060</li>
          <li>London, UK</li>
        </ul>
      </div>

      <style jsx>{`
        .extras-section {
          margin-top: 1rem;
          padding: 1rem;
          background-color: #f9fafb;
          border-radius: 0.375rem;
          border: 1px solid #e5e7eb;
        }

        .extras-section h4 {
          margin: 0 0 0.75rem 0;
          color: #374151;
          font-size: 0.9rem;
        }

        .extras-options {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          font-size: 0.9rem;
          color: #4b5563;
        }

        .checkbox-label input[type="checkbox"] {
          margin: 0;
        }

        .checkbox-label:hover {
          color: #1f2937;
        }

        .checkbox-label input:disabled {
          cursor: not-allowed;
        }

        .checkbox-label input:disabled + span {
          opacity: 0.5;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
};

export default SearchForm;
