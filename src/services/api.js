import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging and auth
api.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase()} request to ${config.url}`);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('Response error:', error);
    
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;
      
      switch (status) {
        case 400:
          throw new Error(data.message || 'Invalid request data');
        case 401:
          throw new Error('Unauthorized access');
        case 403:
          throw new Error('Access forbidden');
        case 404:
          throw new Error(data.message || 'Resource not found');
        case 429:
          throw new Error('Too many requests. Please try again later.');
        case 500:
          throw new Error('Server error. Please try again later.');
        default:
          throw new Error(data.message || `Request failed with status ${status}`);
      }
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout. Please check your connection and try again.');
    } else if (error.code === 'ERR_NETWORK') {
      throw new Error('Network error. Please check your connection and try again.');
    } else {
      throw new Error(error.message || 'An unexpected error occurred');
    }
  }
);

// Weather API functions
export const weatherAPI = {
  // Get all saved weather entries
  getAll: async (params = {}) => {
    const response = await api.get('/weather', { params });
    return response.data;
  },

  // Get specific weather entry by ID
  getById: async (id) => {
    const response = await api.get(`/weather/${id}`);
    return response.data;
  },

  // Create new weather entry
  create: async (weatherData) => {
    const response = await api.post('/weather', weatherData);
    return response.data;
  },

  // Update existing weather entry
  update: async (id, weatherData) => {
    const response = await api.put(`/weather/${id}`, weatherData);
    return response.data;
  },

  // Delete weather entry
  delete: async (id) => {
    const response = await api.delete(`/weather/${id}`);
    return response.data;
  },
};

// Export API functions
export const exportAPI = {
  // Export all weather data
  exportAll: async (format = 'json', location = '') => {
    const params = { format };
    if (location) params.location = location;

    const response = await api.get('/export', {
      params,
      responseType: 'blob' // Always use blob to handle file downloads consistently
    });

    // Create blob and download file for all formats
    const contentType = format === 'json' ? 'application/json' :
                       format === 'csv' ? 'text/csv' : 'text/markdown';

    const blob = new Blob([response.data], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `weather-data-${new Date().toISOString().split('T')[0]}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return { success: true, message: `Data exported successfully as ${format.toUpperCase()}` };
  },

  // Export specific weather entry
  exportById: async (id, format = 'json') => {
    const params = { format };

    const response = await api.get(`/export/${id}`, {
      params,
      responseType: 'blob' // Always use blob to handle file downloads consistently
    });

    // Create blob and download file for all formats
    const contentType = format === 'json' ? 'application/json' :
                       format === 'csv' ? 'text/csv' : 'text/markdown';

    const blob = new Blob([response.data], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `weather-entry-${id}-${new Date().toISOString().split('T')[0]}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return { success: true, message: `Entry exported successfully as ${format.toUpperCase()}` };
  },
};

// Health check function
export const healthCheck = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    throw new Error('Backend server is not responding');
  }
};

// Utility function to format API errors for display
export const formatAPIError = (error) => {
  if (error.response && error.response.data) {
    const { data } = error.response;
    
    if (data.details && Array.isArray(data.details)) {
      // Validation errors
      return data.details.map(detail => `${detail.field}: ${detail.message}`).join(', ');
    } else if (data.message) {
      return data.message;
    } else if (data.error) {
      return data.error;
    }
  }
  
  return error.message || 'An unexpected error occurred';
};

// Utility function to check if backend is available
export const checkBackendStatus = async () => {
  try {
    await healthCheck();
    return { isAvailable: true, message: 'Backend is available' };
  } catch (error) {
    return { 
      isAvailable: false, 
      message: 'Backend is not available. Please make sure the server is running.' 
    };
  }
};

export default api;
