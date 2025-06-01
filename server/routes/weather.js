import express from 'express';
import Weather from '../models/Weather.js';
import { validateWeatherInput, validateUpdateInput } from '../middleware/validation.js';
import { fetchWeatherData } from '../utils/weatherService.js';
import { fetchYouTubeVideos } from '../utils/youtubeService.js';
import { generateMapsData } from '../utils/mapsService.js';

const router = express.Router();

// GET /api/weather - Get all saved weather entries
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, location, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    const query = {};
    if (location) {
      query.location = new RegExp(location, 'i');
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 }
    };

    const weatherEntries = await Weather.find(query)
      .sort(options.sort)
      .limit(options.limit * 1)
      .skip((options.page - 1) * options.limit)
      .exec();

    const total = await Weather.countDocuments(query);

    res.json({
      success: true,
      data: weatherEntries,
      pagination: {
        currentPage: options.page,
        totalPages: Math.ceil(total / options.limit),
        totalEntries: total,
        hasNext: options.page < Math.ceil(total / options.limit),
        hasPrev: options.page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching weather entries:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch weather entries',
      message: error.message
    });
  }
});

// GET /api/weather/:id - Get specific weather entry
router.get('/:id', async (req, res) => {
  try {
    const weatherEntry = await Weather.findById(req.params.id);
    
    if (!weatherEntry) {
      return res.status(404).json({
        success: false,
        error: 'Weather entry not found'
      });
    }

    res.json({
      success: true,
      data: weatherEntry
    });
  } catch (error) {
    console.error('Error fetching weather entry:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch weather entry',
      message: error.message
    });
  }
});

// POST /api/weather - Create new weather entry
router.post('/', validateWeatherInput, async (req, res) => {
  try {
    const { location, startDate, endDate, includeYouTube = false, includeMaps = false } = req.body;

    // Check if similar entry exists and is recent
    const existingEntry = await Weather.findByLocationAndDateRange(location, startDate, endDate);
    if (existingEntry && existingEntry.isDataRecent()) {
      return res.json({
        success: true,
        data: existingEntry,
        message: 'Returning cached weather data'
      });
    }

    // Fetch weather data from OpenWeatherMap
    const weatherData = await fetchWeatherData(location);
    
    // Prepare additional data
    const additionalData = {};
    
    if (includeYouTube) {
      try {
        additionalData.youtubeVideos = await fetchYouTubeVideos(weatherData.currentWeather.name);
      } catch (error) {
        console.warn('Failed to fetch YouTube videos:', error.message);
        additionalData.youtubeVideos = [];
      }
    }

    if (includeMaps) {
      try {
        additionalData.mapsData = generateMapsData(
          weatherData.currentWeather.coord.lat,
          weatherData.currentWeather.coord.lon,
          weatherData.currentWeather.name
        );
      } catch (error) {
        console.warn('Failed to generate maps data:', error.message);
        additionalData.mapsData = {};
      }
    }

    // Create new weather entry
    const newWeatherEntry = new Weather({
      location,
      coordinates: {
        lat: weatherData.currentWeather.coord.lat,
        lon: weatherData.currentWeather.coord.lon
      },
      city: {
        name: weatherData.currentWeather.name,
        country: weatherData.currentWeather.sys.country,
        timezone: weatherData.currentWeather.timezone,
        sunrise: weatherData.currentWeather.sys.sunrise,
        sunset: weatherData.currentWeather.sys.sunset
      },
      dateRange: {
        startDate: new Date(startDate),
        endDate: new Date(endDate)
      },
      currentWeather: weatherData.currentWeather,
      forecastData: weatherData.forecastData,
      additionalData
    });

    const savedEntry = await newWeatherEntry.save();

    res.status(201).json({
      success: true,
      data: savedEntry,
      message: 'Weather entry created successfully'
    });
  } catch (error) {
    console.error('Error creating weather entry:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create weather entry',
      message: error.message
    });
  }
});

// PUT /api/weather/:id - Update weather entry
router.put('/:id', validateUpdateInput, async (req, res) => {
  try {
    const { location, startDate, endDate, includeYouTube = false, includeMaps = false } = req.body;
    
    const existingEntry = await Weather.findById(req.params.id);
    if (!existingEntry) {
      return res.status(404).json({
        success: false,
        error: 'Weather entry not found'
      });
    }

    // Fetch updated weather data
    const weatherData = await fetchWeatherData(location);
    
    // Prepare additional data
    const additionalData = {};
    
    if (includeYouTube) {
      try {
        additionalData.youtubeVideos = await fetchYouTubeVideos(weatherData.currentWeather.name);
      } catch (error) {
        console.warn('Failed to fetch YouTube videos:', error.message);
        additionalData.youtubeVideos = existingEntry.additionalData?.youtubeVideos || [];
      }
    }

    if (includeMaps) {
      try {
        additionalData.mapsData = generateMapsData(
          weatherData.currentWeather.coord.lat,
          weatherData.currentWeather.coord.lon,
          weatherData.currentWeather.name
        );
      } catch (error) {
        console.warn('Failed to generate maps data:', error.message);
        additionalData.mapsData = existingEntry.additionalData?.mapsData || {};
      }
    }

    // Update the entry
    const updatedEntry = await Weather.findByIdAndUpdate(
      req.params.id,
      {
        location,
        coordinates: {
          lat: weatherData.currentWeather.coord.lat,
          lon: weatherData.currentWeather.coord.lon
        },
        city: {
          name: weatherData.currentWeather.name,
          country: weatherData.currentWeather.sys.country,
          timezone: weatherData.currentWeather.timezone,
          sunrise: weatherData.currentWeather.sys.sunrise,
          sunset: weatherData.currentWeather.sys.sunset
        },
        dateRange: {
          startDate: new Date(startDate),
          endDate: new Date(endDate)
        },
        currentWeather: weatherData.currentWeather,
        forecastData: weatherData.forecastData,
        additionalData,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: updatedEntry,
      message: 'Weather entry updated successfully'
    });
  } catch (error) {
    console.error('Error updating weather entry:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update weather entry',
      message: error.message
    });
  }
});

// DELETE /api/weather/:id - Delete weather entry
router.delete('/:id', async (req, res) => {
  try {
    const deletedEntry = await Weather.findByIdAndDelete(req.params.id);
    
    if (!deletedEntry) {
      return res.status(404).json({
        success: false,
        error: 'Weather entry not found'
      });
    }

    res.json({
      success: true,
      message: 'Weather entry deleted successfully',
      data: { id: req.params.id }
    });
  } catch (error) {
    console.error('Error deleting weather entry:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete weather entry',
      message: error.message
    });
  }
});

export default router;
