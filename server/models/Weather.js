import mongoose from 'mongoose';

const weatherDataSchema = new mongoose.Schema({
  dt: Number,
  main: {
    temp: Number,
    feels_like: Number,
    temp_min: Number,
    temp_max: Number,
    pressure: Number,
    humidity: Number
  },
  weather: [{
    id: Number,
    main: String,
    description: String,
    icon: String
  }],
  clouds: {
    all: Number
  },
  wind: {
    speed: Number,
    deg: Number,
    gust: Number
  },
  visibility: Number,
  pop: Number,
  rain: {
    '3h': Number
  },
  snow: {
    '3h': Number
  },
  dt_txt: String
});

const weatherSchema = new mongoose.Schema({
  location: {
    type: String,
    required: true,
    trim: true
  },
  coordinates: {
    lat: {
      type: Number,
      required: true
    },
    lon: {
      type: Number,
      required: true
    }
  },
  city: {
    name: String,
    country: String,
    timezone: Number,
    sunrise: Number,
    sunset: Number
  },
  dateRange: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    }
  },
  currentWeather: {
    coord: {
      lon: Number,
      lat: Number
    },
    weather: [{
      id: Number,
      main: String,
      description: String,
      icon: String
    }],
    base: String,
    main: {
      temp: Number,
      feels_like: Number,
      temp_min: Number,
      temp_max: Number,
      pressure: Number,
      humidity: Number,
      sea_level: Number,
      grnd_level: Number
    },
    visibility: Number,
    wind: {
      speed: Number,
      deg: Number,
      gust: Number
    },
    rain: {
      '1h': Number,
      '3h': Number
    },
    snow: {
      '1h': Number,
      '3h': Number
    },
    clouds: {
      all: Number
    },
    dt: Number,
    sys: {
      type: { type: Number },
      id: Number,
      country: String,
      sunrise: Number,
      sunset: Number
    },
    timezone: Number,
    id: Number,
    name: String,
    cod: Number
  },
  forecastData: {
    cod: String,
    message: Number,
    cnt: Number,
    list: [weatherDataSchema],
    city: {
      id: Number,
      name: String,
      coord: {
        lat: Number,
        lon: Number
      },
      country: String,
      population: Number,
      timezone: Number,
      sunrise: Number,
      sunset: Number
    }
  },
  additionalData: {
    youtubeVideos: [{
      title: String,
      videoId: String,
      thumbnail: String,
      channelTitle: String,
      publishedAt: Date,
      description: String,
      url: String,
      duration: String,
      viewCount: Number,
      likeCount: Number
    }],
    mapsData: {
      coordinates: {
        lat: Number,
        lon: Number
      },
      locationName: String,
      embedUrl: String,
      staticMapUrl: String,
      streetViewUrl: String,
      googleMapsUrl: String,
      searchUrl: String,
      directions: {
        driving: String,
        walking: String,
        transit: String
      },
      nearbyPlaces: {
        attractions: [mongoose.Schema.Types.Mixed],
        restaurants: [mongoose.Schema.Types.Mixed],
        hotels: [mongoose.Schema.Types.Mixed]
      }
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for better query performance
weatherSchema.index({ location: 1, 'dateRange.startDate': 1, 'dateRange.endDate': 1 });
weatherSchema.index({ 'coordinates.lat': 1, 'coordinates.lon': 1 });
weatherSchema.index({ createdAt: -1 });

// Pre-save middleware to update the updatedAt field
weatherSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Instance method to check if weather data is recent (within 1 hour)
weatherSchema.methods.isDataRecent = function() {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  return this.updatedAt > oneHourAgo;
};

// Static method to find weather by location and date range
weatherSchema.statics.findByLocationAndDateRange = function(location, startDate, endDate) {
  return this.findOne({
    location: new RegExp(location, 'i'),
    'dateRange.startDate': { $lte: new Date(startDate) },
    'dateRange.endDate': { $gte: new Date(endDate) }
  });
};

const Weather = mongoose.model('Weather', weatherSchema);

export default Weather;
