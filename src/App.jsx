import React, { useState, useEffect } from 'react';
import './App.css';
import SearchForm from './components/SearchForm';
import WeatherCard from './components/WeatherCard';
import ForecastCard from './components/ForecastCard';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';
import SavedWeatherList from './components/SavedWeatherList';
import ExportPanel from './components/ExportPanel';
import { getCurrentWeather, getWeatherForecast, getWeatherByCoords } from './utils/weatherAPI';
import { getCurrentLocation } from './utils/geolocation';
import { weatherAPI, checkBackendStatus, formatAPIError } from './services/api';

function App() {
  const [currentWeather, setCurrentWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [activeTab, setActiveTab] = useState('search');
  const [backendStatus, setBackendStatus] = useState({ isAvailable: false, checked: false });
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Check backend status on app load
  useEffect(() => {
    const checkBackend = async () => {
      const status = await checkBackendStatus();
      setBackendStatus({ ...status, checked: true });
    };
    checkBackend();
    handleUseLocation();
  }, []);

  const handleSearch = async (location) => {
    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const [weatherData, forecastData] = await Promise.all([
        getCurrentWeather(location),
        getWeatherForecast(location)
      ]);

      setCurrentWeather(weatherData);
      setForecast(forecastData);
    } catch (err) {
      setError(err.message);
      setCurrentWeather(null);
      setForecast(null);
    } finally {
      setLoading(false);
    }
  };

  const handleUseLocation = async () => {
    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const { latitude, longitude } = await getCurrentLocation();
      const { current, forecast: forecastData } = await getWeatherByCoords(latitude, longitude);

      setCurrentWeather(current);
      setForecast(forecastData);
    } catch (err) {
      setError(err.message);
      setCurrentWeather(null);
      setForecast(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    if (currentWeather) {
      // If we had weather data before, try to refresh it
      const location = `${currentWeather.coord.lat},${currentWeather.coord.lon}`;
      handleSearch(location);
    }
  };

  const handleSaveWeather = async (weatherData) => {
    try {
      setSaveLoading(true);
      setSaveSuccess(null);
      setError(null);

      const response = await weatherAPI.create(weatherData);

      if (response.success) {
        setSaveSuccess(`Weather data for "${weatherData.location}" saved successfully!`);
        setRefreshTrigger(prev => prev + 1); // Trigger refresh of saved list

        // Clear success message after 3 seconds
        setTimeout(() => setSaveSuccess(null), 3000);
      } else {
        throw new Error(response.error || 'Failed to save weather data');
      }
    } catch (err) {
      console.error('Error saving weather data:', err);
      setError(formatAPIError(err));
    } finally {
      setSaveLoading(false);
    }
  };

  const handleEditWeather = (weatherEntry) => {
    // Switch to save tab and populate form with existing data
    setActiveTab('save');
    // You could add logic here to populate the form with existing data
    console.log('Edit weather entry:', weatherEntry);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setError(null);
    setSaveSuccess(null);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🌤️ Weather App</h1>
        <p>Get current weather, save data, and export your weather history</p>

        {backendStatus.checked && !backendStatus.isAvailable && (
          <div className="backend-warning">
            ⚠️ Backend server is not available. Some features may be limited.
          </div>
        )}
      </header>

      <nav className="app-nav">
        <button
          className={`nav-tab ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => handleTabChange('search')}
        >
          Search Weather
        </button>
        <button
          className={`nav-tab ${activeTab === 'save' ? 'active' : ''}`}
          onClick={() => handleTabChange('save')}
          disabled={!backendStatus.isAvailable}
        >
          Save Weather Data
        </button>
        <button
          className={`nav-tab ${activeTab === 'saved' ? 'active' : ''}`}
          onClick={() => handleTabChange('saved')}
          disabled={!backendStatus.isAvailable}
        >
          Saved Entries
        </button>
        <button
          className={`nav-tab ${activeTab === 'export' ? 'active' : ''}`}
          onClick={() => handleTabChange('export')}
          disabled={!backendStatus.isAvailable}
        >
          Export Data
        </button>
      </nav>

      <main className="app-main">
        {activeTab === 'search' && (
          <SearchForm
            mode="search"
            onSearch={handleSearch}
            onUseLocation={handleUseLocation}
            loading={loading}
          />
        )}

        {activeTab === 'save' && (
          <SearchForm
            mode="save"
            onSaveWeather={handleSaveWeather}
            loading={saveLoading}
          />
        )}

        {activeTab === 'saved' && (
          <SavedWeatherList
            onEdit={handleEditWeather}
            refreshTrigger={refreshTrigger}
          />
        )}

        {activeTab === 'export' && <ExportPanel />}

        {(loading || saveLoading) && (
          <LoadingSpinner
            message={saveLoading ? "Saving weather data..." : "Fetching weather data..."}
          />
        )}

        {saveSuccess && (
          <div className="success-message">
            ✅ {saveSuccess}
          </div>
        )}

        {error && (
          <ErrorMessage
            message={error}
            onRetry={handleRetry}
          />
        )}

        {activeTab === 'search' && !loading && !error && currentWeather && (
          <>
            <WeatherCard weatherData={currentWeather} />
            {forecast && <ForecastCard forecastData={forecast} />}
          </>
        )}

        {activeTab === 'search' && !loading && !error && !currentWeather && hasSearched && (
          <div className="no-data">
            <p>No weather data available. Please try searching for a location.</p>
          </div>
        )}

        {activeTab === 'search' && !hasSearched && !loading && (
          <div className="welcome-message">
            <h2>Welcome to Weather App! 🌈</h2>
            <p>Search for a location or use your current location to get started.</p>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>Weather data provided by OpenWeatherMap</p>
        <p>Built with React & Vite</p>
      </footer>
    </div>
  );
}

export default App;
