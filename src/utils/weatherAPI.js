import axios from 'axios';

// You'll need to get a free API key from https://openweathermap.org/api
const API_KEY = '07858f0b309936f39de40923afda731d'; // Replace with your actual API key
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// Get current weather by city name, zip code, or coordinates
export const getCurrentWeather = async (location) => {
  try {
    let url;
    
    // Check if location is coordinates (lat,lon format)
    if (location.includes(',') && !isNaN(location.split(',')[0]) && !isNaN(location.split(',')[1])) {
      const [lat, lon] = location.split(',');
      url = `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
    }
    // Check if location is a zip code (numbers only or numbers with country code)
    else if (/^\d{5}(-\d{4})?$/.test(location) || /^\d{5},\w{2}$/.test(location)) {
      url = `${BASE_URL}/weather?zip=${location}&appid=${API_KEY}&units=metric`;
    }
    // Otherwise treat as city name
    else {
      url = `${BASE_URL}/weather?q=${location}&appid=${API_KEY}&units=metric`;
    }

    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch weather data');
  }
};

// Get 5-day weather forecast
export const getWeatherForecast = async (location) => {
  try {
    let url;
    
    // Check if location is coordinates (lat,lon format)
    if (location.includes(',') && !isNaN(location.split(',')[0]) && !isNaN(location.split(',')[1])) {
      const [lat, lon] = location.split(',');
      url = `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`;
    }
    // Check if location is a zip code
    else if (/^\d{5}(-\d{4})?$/.test(location) || /^\d{5},\w{2}$/.test(location)) {
      url = `${BASE_URL}/forecast?zip=${location}&appid=${API_KEY}&units=metric`;
    }
    // Otherwise treat as city name
    else {
      url = `${BASE_URL}/forecast?q=${location}&appid=${API_KEY}&units=metric`;
    }

    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch forecast data');
  }
};

// Get weather by coordinates (for geolocation)
export const getWeatherByCoords = async (lat, lon) => {
  try {
    const [currentWeather, forecast] = await Promise.all([
      axios.get(`${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`),
      axios.get(`${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`)
    ]);

    return {
      current: currentWeather.data,
      forecast: forecast.data
    };
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch weather data');
  }
};

// Get weather icon URL
export const getWeatherIconUrl = (iconCode) => {
  return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
};
