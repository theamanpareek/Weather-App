import React from 'react';
import { 
  WiThermometer, 
  WiHumidity, 
  WiStrongWind, 
  WiBarometer,
  WiSunrise,
  WiSunset
} from 'react-icons/wi';
import { getWeatherIconUrl } from '../utils/weatherAPI';

const WeatherCard = ({ weatherData }) => {
  if (!weatherData) return null;

  const {
    name,
    sys: { country, sunrise, sunset },
    main: { temp, feels_like, humidity, pressure },
    weather: [{ main: weatherMain, description, icon }],
    wind: { speed },
    visibility
  } = weatherData;

  const formatTime = (timestamp) => {
    return new Date(timestamp * 1000).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="weather-card">
      <div className="weather-header">
        <div className="location-info">
          <h2>{name}, {country}</h2>
          <p className="weather-description">{description}</p>
        </div>
        <div className="weather-icon">
          <img 
            src={getWeatherIconUrl(icon)} 
            alt={description}
            className="weather-icon-img"
          />
        </div>
      </div>

      <div className="temperature-section">
        <div className="main-temp">
          <span className="temp-value">{Math.round(temp)}</span>
          <span className="temp-unit">°C</span>
        </div>
        <p className="feels-like">
          Feels like {Math.round(feels_like)}°C
        </p>
      </div>

      <div className="weather-details">
        <div className="detail-item">
          <WiHumidity className="detail-icon" />
          <div className="detail-content">
            <span className="detail-label">Humidity</span>
            <span className="detail-value">{humidity}%</span>
          </div>
        </div>

        <div className="detail-item">
          <WiStrongWind className="detail-icon" />
          <div className="detail-content">
            <span className="detail-label">Wind Speed</span>
            <span className="detail-value">{speed} m/s</span>
          </div>
        </div>

        <div className="detail-item">
          <WiBarometer className="detail-icon" />
          <div className="detail-content">
            <span className="detail-label">Pressure</span>
            <span className="detail-value">{pressure} hPa</span>
          </div>
        </div>

        <div className="detail-item">
          <WiThermometer className="detail-icon" />
          <div className="detail-content">
            <span className="detail-label">Visibility</span>
            <span className="detail-value">{visibility / 1000} km</span>
          </div>
        </div>

        <div className="detail-item">
          <WiSunrise className="detail-icon" />
          <div className="detail-content">
            <span className="detail-label">Sunrise</span>
            <span className="detail-value">{formatTime(sunrise)}</span>
          </div>
        </div>

        <div className="detail-item">
          <WiSunset className="detail-icon" />
          <div className="detail-content">
            <span className="detail-label">Sunset</span>
            <span className="detail-value">{formatTime(sunset)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherCard;
