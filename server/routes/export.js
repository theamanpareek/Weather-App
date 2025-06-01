import express from 'express';
import Weather from '../models/Weather.js';

const router = express.Router();

// Helper function to convert JSON to CSV
const jsonToCSV = (data) => {
  if (!data || data.length === 0) return '';
  
  const headers = [
    'ID',
    'Location',
    'Latitude',
    'Longitude',
    'Start Date',
    'End Date',
    'Current Temperature (°C)',
    'Feels Like (°C)',
    'Humidity (%)',
    'Pressure (hPa)',
    'Wind Speed (m/s)',
    'Weather Description',
    'Created At',
    'Updated At'
  ];
  
  const csvRows = [headers.join(',')];
  
  data.forEach(entry => {
    const row = [
      entry._id,
      `"${entry.location}"`,
      entry.coordinates.lat,
      entry.coordinates.lon,
      entry.dateRange.startDate.toISOString().split('T')[0],
      entry.dateRange.endDate.toISOString().split('T')[0],
      entry.currentWeather.main.temp,
      entry.currentWeather.main.feels_like,
      entry.currentWeather.main.humidity,
      entry.currentWeather.main.pressure,
      entry.currentWeather.wind.speed,
      `"${entry.currentWeather.weather[0].description}"`,
      entry.createdAt.toISOString(),
      entry.updatedAt.toISOString()
    ];
    csvRows.push(row.join(','));
  });
  
  return csvRows.join('\n');
};

// Helper function to convert JSON to Markdown
const jsonToMarkdown = (data) => {
  if (!data || data.length === 0) return '# Weather Data Export\n\nNo data available.';
  
  let markdown = '# Weather Data Export\n\n';
  markdown += `Generated on: ${new Date().toISOString()}\n\n`;
  markdown += `Total entries: ${data.length}\n\n`;
  
  data.forEach((entry, index) => {
    markdown += `## ${index + 1}. ${entry.location}\n\n`;
    markdown += `- **Coordinates:** ${entry.coordinates.lat}, ${entry.coordinates.lon}\n`;
    markdown += `- **Date Range:** ${entry.dateRange.startDate.toISOString().split('T')[0]} to ${entry.dateRange.endDate.toISOString().split('T')[0]}\n`;
    markdown += `- **Current Temperature:** ${entry.currentWeather.main.temp}°C (feels like ${entry.currentWeather.main.feels_like}°C)\n`;
    markdown += `- **Weather:** ${entry.currentWeather.weather[0].description}\n`;
    markdown += `- **Humidity:** ${entry.currentWeather.main.humidity}%\n`;
    markdown += `- **Pressure:** ${entry.currentWeather.main.pressure} hPa\n`;
    markdown += `- **Wind Speed:** ${entry.currentWeather.wind.speed} m/s\n`;
    markdown += `- **Created:** ${entry.createdAt.toISOString()}\n`;
    markdown += `- **Updated:** ${entry.updatedAt.toISOString()}\n\n`;
    
    if (entry.forecastData && entry.forecastData.list && entry.forecastData.list.length > 0) {
      markdown += `### 5-Day Forecast\n\n`;
      entry.forecastData.list.slice(0, 5).forEach((forecast, i) => {
        const date = new Date(forecast.dt * 1000);
        markdown += `- **${date.toLocaleDateString()}:** ${forecast.main.temp}°C, ${forecast.weather[0].description}\n`;
      });
      markdown += '\n';
    }
    
    if (entry.additionalData && entry.additionalData.youtubeVideos && entry.additionalData.youtubeVideos.length > 0) {
      markdown += `### Related Videos\n\n`;
      entry.additionalData.youtubeVideos.forEach(video => {
        markdown += `- [${video.title}](https://www.youtube.com/watch?v=${video.videoId})\n`;
      });
      markdown += '\n';
    }
    
    markdown += '---\n\n';
  });
  
  return markdown;
};

// GET /api/export?format=json|csv|markdown
router.get('/', async (req, res) => {
  try {
    const { format = 'json', location } = req.query;
    
    // Build query
    const query = {};
    if (location) {
      query.location = new RegExp(location, 'i');
    }
    
    // Fetch all weather entries
    const weatherEntries = await Weather.find(query).sort({ createdAt: -1 });
    
    if (weatherEntries.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No weather data found to export'
      });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    switch (format.toLowerCase()) {
      case 'csv':
        const csvData = jsonToCSV(weatherEntries);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="weather-data-${timestamp}.csv"`);
        return res.send(csvData);
        
      case 'markdown':
      case 'md':
        const markdownData = jsonToMarkdown(weatherEntries);
        res.setHeader('Content-Type', 'text/markdown');
        res.setHeader('Content-Disposition', `attachment; filename="weather-data-${timestamp}.md"`);
        return res.send(markdownData);
        
      case 'json':
      default:
        const jsonData = JSON.stringify({
          success: true,
          exportedAt: new Date().toISOString(),
          totalEntries: weatherEntries.length,
          data: weatherEntries
        }, null, 2);

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="weather-data-${timestamp}.json"`);
        return res.send(jsonData);
    }
  } catch (error) {
    console.error('Error exporting weather data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export weather data',
      message: error.message
    });
  }
});

// GET /api/export/:id?format=json|csv|markdown - Export specific entry
router.get('/:id', async (req, res) => {
  try {
    const { format = 'json' } = req.query;
    
    const weatherEntry = await Weather.findById(req.params.id);
    
    if (!weatherEntry) {
      return res.status(404).json({
        success: false,
        error: 'Weather entry not found'
      });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const entries = [weatherEntry];
    
    switch (format.toLowerCase()) {
      case 'csv':
        const csvData = jsonToCSV(entries);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="weather-entry-${req.params.id}-${timestamp}.csv"`);
        return res.send(csvData);
        
      case 'markdown':
      case 'md':
        const markdownData = jsonToMarkdown(entries);
        res.setHeader('Content-Type', 'text/markdown');
        res.setHeader('Content-Disposition', `attachment; filename="weather-entry-${req.params.id}-${timestamp}.md"`);
        return res.send(markdownData);
        
      case 'json':
      default:
        const jsonData = JSON.stringify({
          success: true,
          exportedAt: new Date().toISOString(),
          data: weatherEntry
        }, null, 2);

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="weather-entry-${req.params.id}-${timestamp}.json"`);
        return res.send(jsonData);
    }
  } catch (error) {
    console.error('Error exporting weather entry:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export weather entry',
      message: error.message
    });
  }
});

export default router;
