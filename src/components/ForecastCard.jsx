import React from 'react';
import { getWeatherIconUrl } from '../utils/weatherAPI';

const ForecastCard = ({ forecastData }) => {
  if (!forecastData || !forecastData.list) return null;

  // Group forecast data by day (take one forecast per day at noon)
  const dailyForecasts = forecastData.list.filter((item, index) => {
    const date = new Date(item.dt * 1000);
    const hour = date.getHours();
    // Take the forecast closest to noon (12:00) for each day
    return hour >= 11 && hour <= 13;
  }).slice(0, 5); // Take only 5 days

  const formatDate = (timestamp) => {
    const date = new Date(timestamp * 1000);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="forecast-container">
      <h3 className="forecast-title">5-Day Forecast</h3>
      <div className="forecast-grid">
        {dailyForecasts.map((forecast, index) => (
          <div key={index} className="forecast-item">
            <div className="forecast-date">
              {formatDate(forecast.dt)}
            </div>
            
            <div className="forecast-icon">
              <img 
                src={getWeatherIconUrl(forecast.weather[0].icon)} 
                alt={forecast.weather[0].description}
                className="forecast-icon-img"
              />
            </div>
            
            <div className="forecast-temps">
              <span className="forecast-high">
                {Math.round(forecast.main.temp_max)}°
              </span>
              <span className="forecast-low">
                {Math.round(forecast.main.temp_min)}°
              </span>
            </div>
            
            <div className="forecast-description">
              {forecast.weather[0].main}
            </div>
            
            <div className="forecast-details">
              <div className="forecast-detail">
                <span>💧 {forecast.main.humidity}%</span>
              </div>
              <div className="forecast-detail">
                <span>💨 {forecast.wind.speed} m/s</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ForecastCard;
