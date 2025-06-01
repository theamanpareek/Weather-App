import React, { useState } from 'react';
import { MdSearch, MdLocationOn } from 'react-icons/md';

const SearchForm = ({ onSearch, onUseLocation, loading }) => {
  const [location, setLocation] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (location.trim()) {
      onSearch(location.trim());
    }
  };

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
            disabled={loading || !location.trim()}
          >
            <MdSearch />
          </button>
        </div>
      </form>
      
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
      
      <div className="search-examples">
        <p>Examples:</p>
        <ul>
          <li>New York, NY</li>
          <li>10001</li>
          <li>40.7128,-74.0060</li>
          <li>London, UK</li>
        </ul>
      </div>
    </div>
  );
};

export default SearchForm;
