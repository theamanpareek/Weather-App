import React, { useState, useEffect } from 'react';
import './App.css';
import SearchForm from './components/SearchForm';
import WeatherCard from './components/WeatherCard';
import ForecastCard from './components/ForecastCard';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorMessage from './components/ErrorMessage';
import { getCurrentWeather, getWeatherForecast, getWeatherByCoords } from './utils/weatherAPI';
import { getCurrentLocation } from './utils/geolocation';

function App() {
  const [currentWeather, setCurrentWeather] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Try to get user's location on app load
  useEffect(() => {
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

  return (
    <div className="app">
      <header className="app-header">
        <h1>🌤️ Weather App</h1>
        <p>Get current weather and 5-day forecast for any location</p>
      </header>

      <main className="app-main">
        <SearchForm
          onSearch={handleSearch}
          onUseLocation={handleUseLocation}
          loading={loading}
        />

        {loading && (
          <LoadingSpinner message="Fetching weather data..." />
        )}

        {error && (
          <ErrorMessage
            message={error}
            onRetry={handleRetry}
          />
        )}

        {!loading && !error && currentWeather && (
          <>
            <WeatherCard weatherData={currentWeather} />
            {forecast && <ForecastCard forecastData={forecast} />}
          </>
        )}

        {!loading && !error && !currentWeather && hasSearched && (
          <div className="no-data">
            <p>No weather data available. Please try searching for a location.</p>
          </div>
        )}

        {!hasSearched && !loading && (
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
