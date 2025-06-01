import axios from 'axios';

const API_KEY = process.env.OPENWEATHER_API_KEY || '07858f0b309936f39de40923afda731d';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// Helper function to determine location type and build URL
const buildWeatherURL = (location, endpoint) => {
  let url;
  
  // Check if location is coordinates (lat,lon format)
  if (location.includes(',') && !isNaN(location.split(',')[0]) && !isNaN(location.split(',')[1])) {
    const [lat, lon] = location.split(',');
    url = `${BASE_URL}/${endpoint}?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
  }
  // Check if location is a zip code (numbers only or numbers with country code)
  else if (/^\d{5}(-\d{4})?$/.test(location) || /^\d{5},\w{2}$/.test(location)) {
    url = `${BASE_URL}/${endpoint}?zip=${location}&appid=${API_KEY}&units=metric`;
  }
  // Otherwise treat as city name
  else {
    url = `${BASE_URL}/${endpoint}?q=${encodeURIComponent(location)}&appid=${API_KEY}&units=metric`;
  }
  
  return url;
};

// Get current weather by location
export const getCurrentWeather = async (location) => {
  try {
    const url = buildWeatherURL(location, 'weather');
    const response = await axios.get(url, {
      timeout: 10000, // 10 second timeout
      headers: {
        'User-Agent': 'Weather-App/1.0'
      }
    });
    
    return response.data;
  } catch (error) {
    if (error.response) {
      // API responded with error status
      const status = error.response.status;
      const message = error.response.data?.message || 'Unknown API error';
      
      switch (status) {
        case 401:
          throw new Error('Invalid API key. Please check your OpenWeatherMap API key.');
        case 404:
          throw new Error(`Location "${location}" not found. Please check the spelling and try again.`);
        case 429:
          throw new Error('API rate limit exceeded. Please try again later.');
        default:
          throw new Error(`Weather API error: ${message}`);
      }
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout. Please check your internet connection and try again.');
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      throw new Error('Unable to connect to weather service. Please try again later.');
    } else {
      throw new Error(`Failed to fetch current weather: ${error.message}`);
    }
  }
};

// Get 5-day weather forecast
export const getWeatherForecast = async (location) => {
  try {
    const url = buildWeatherURL(location, 'forecast');
    const response = await axios.get(url, {
      timeout: 10000, // 10 second timeout
      headers: {
        'User-Agent': 'Weather-App/1.0'
      }
    });
    
    return response.data;
  } catch (error) {
    if (error.response) {
      // API responded with error status
      const status = error.response.status;
      const message = error.response.data?.message || 'Unknown API error';
      
      switch (status) {
        case 401:
          throw new Error('Invalid API key. Please check your OpenWeatherMap API key.');
        case 404:
          throw new Error(`Location "${location}" not found. Please check the spelling and try again.`);
        case 429:
          throw new Error('API rate limit exceeded. Please try again later.');
        default:
          throw new Error(`Weather API error: ${message}`);
      }
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout. Please check your internet connection and try again.');
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      throw new Error('Unable to connect to weather service. Please try again later.');
    } else {
      throw new Error(`Failed to fetch weather forecast: ${error.message}`);
    }
  }
};

// Get both current weather and forecast data
export const fetchWeatherData = async (location) => {
  try {
    console.log(`Fetching weather data for location: ${location}`);
    
    // Fetch both current weather and forecast in parallel
    const [currentWeather, forecastData] = await Promise.all([
      getCurrentWeather(location),
      getWeatherForecast(location)
    ]);
    
    // Validate that we got valid data
    if (!currentWeather || !currentWeather.coord) {
      throw new Error('Invalid current weather data received from API');
    }
    
    if (!forecastData || !forecastData.list) {
      throw new Error('Invalid forecast data received from API');
    }
    
    console.log(`Successfully fetched weather data for ${currentWeather.name}, ${currentWeather.sys.country}`);
    
    return {
      currentWeather,
      forecastData
    };
  } catch (error) {
    console.error('Error in fetchWeatherData:', error.message);
    throw error;
  }
};

// Get weather by coordinates (for geolocation)
export const getWeatherByCoords = async (lat, lon) => {
  try {
    const location = `${lat},${lon}`;
    return await fetchWeatherData(location);
  } catch (error) {
    throw new Error(`Failed to fetch weather data for coordinates ${lat}, ${lon}: ${error.message}`);
  }
};

// Get weather icon URL
export const getWeatherIconUrl = (iconCode) => {
  return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
};

// Helper function to validate location format
export const validateLocation = (location) => {
  if (!location || typeof location !== 'string') {
    return { isValid: false, error: 'Location must be a non-empty string' };
  }
  
  const trimmedLocation = location.trim();
  
  if (trimmedLocation.length === 0) {
    return { isValid: false, error: 'Location cannot be empty' };
  }
  
  if (trimmedLocation.length > 100) {
    return { isValid: false, error: 'Location name is too long (max 100 characters)' };
  }
  
  // Check for coordinates format
  if (trimmedLocation.includes(',')) {
    const parts = trimmedLocation.split(',');
    if (parts.length === 2) {
      const [lat, lon] = parts;
      const latNum = parseFloat(lat.trim());
      const lonNum = parseFloat(lon.trim());
      
      if (!isNaN(latNum) && !isNaN(lonNum)) {
        if (latNum < -90 || latNum > 90) {
          return { isValid: false, error: 'Latitude must be between -90 and 90' };
        }
        if (lonNum < -180 || lonNum > 180) {
          return { isValid: false, error: 'Longitude must be between -180 and 180' };
        }
        return { isValid: true, type: 'coordinates' };
      }
    }
  }
  
  // Check for zip code format
  if (/^\d{5}(-\d{4})?$/.test(trimmedLocation) || /^\d{5},\w{2}$/.test(trimmedLocation)) {
    return { isValid: true, type: 'zipcode' };
  }
  
  // Check for city name (allow letters, spaces, hyphens, periods, commas)
  if (/^[a-zA-Z\s,.-]+$/.test(trimmedLocation)) {
    return { isValid: true, type: 'city' };
  }
  
  return { isValid: false, error: 'Invalid location format' };
};

// Helper function to format weather data for consistent response
export const formatWeatherResponse = (currentWeather, forecastData) => {
  return {
    location: {
      name: currentWeather.name,
      country: currentWeather.sys.country,
      coordinates: {
        lat: currentWeather.coord.lat,
        lon: currentWeather.coord.lon
      }
    },
    current: {
      temperature: currentWeather.main.temp,
      feelsLike: currentWeather.main.feels_like,
      humidity: currentWeather.main.humidity,
      pressure: currentWeather.main.pressure,
      windSpeed: currentWeather.wind.speed,
      windDirection: currentWeather.wind.deg,
      visibility: currentWeather.visibility,
      weather: {
        main: currentWeather.weather[0].main,
        description: currentWeather.weather[0].description,
        icon: currentWeather.weather[0].icon
      },
      timestamp: currentWeather.dt
    },
    forecast: forecastData.list.map(item => ({
      datetime: item.dt_txt,
      temperature: item.main.temp,
      feelsLike: item.main.feels_like,
      humidity: item.main.humidity,
      pressure: item.main.pressure,
      windSpeed: item.wind.speed,
      weather: {
        main: item.weather[0].main,
        description: item.weather[0].description,
        icon: item.weather[0].icon
      },
      timestamp: item.dt
    }))
  };
};
