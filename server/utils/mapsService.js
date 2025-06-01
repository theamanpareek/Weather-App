const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

// Generate Google Maps embed URL
export const generateMapsEmbedUrl = (lat, lon, locationName) => {
  if (!GOOGLE_MAPS_API_KEY) {
    console.warn('Google Maps API key not provided. Using basic embed URL.');
    // Return basic embed URL without API key (limited functionality)
    return `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3000!2d${lon}!3d${lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zM!5e0!3m2!1sen!2sus!4v1234567890123!5m2!1sen!2sus`;
  }

  // Generate embed URL with API key for full functionality
  const encodedLocationName = encodeURIComponent(locationName || `${lat},${lon}`);
  return `https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_API_KEY}&q=${encodedLocationName}&center=${lat},${lon}&zoom=12`;
};

// Generate static map image URL
export const generateStaticMapUrl = (lat, lon, locationName, options = {}) => {
  if (!GOOGLE_MAPS_API_KEY) {
    console.warn('Google Maps API key not provided. Cannot generate static map URL.');
    return null;
  }

  const {
    zoom = 12,
    size = '600x400',
    maptype = 'roadmap',
    markers = true,
    format = 'png'
  } = options;

  let url = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lon}&zoom=${zoom}&size=${size}&maptype=${maptype}&format=${format}&key=${GOOGLE_MAPS_API_KEY}`;

  if (markers) {
    const markerLabel = locationName ? encodeURIComponent(locationName.charAt(0).toUpperCase()) : 'A';
    url += `&markers=color:red%7Clabel:${markerLabel}%7C${lat},${lon}`;
  }

  return url;
};

// Generate directions URL
export const generateDirectionsUrl = (fromLat, fromLon, toLat, toLon, mode = 'driving') => {
  return `https://www.google.com/maps/dir/${fromLat},${fromLon}/${toLat},${toLon}/@${toLat},${toLon},12z/data=!3m1!4b1!4m2!4m1!3e${getDirectionsModeCode(mode)}`;
};

// Helper function to get directions mode code
const getDirectionsModeCode = (mode) => {
  const modes = {
    driving: '0',
    walking: '2',
    bicycling: '1',
    transit: '3'
  };
  return modes[mode] || '0';
};

// Generate Street View URL
export const generateStreetViewUrl = (lat, lon, options = {}) => {
  if (!GOOGLE_MAPS_API_KEY) {
    console.warn('Google Maps API key not provided. Cannot generate Street View URL.');
    return null;
  }

  const {
    size = '600x400',
    heading = 0,
    pitch = 0,
    fov = 90
  } = options;

  return `https://maps.googleapis.com/maps/api/streetview?size=${size}&location=${lat},${lon}&heading=${heading}&pitch=${pitch}&fov=${fov}&key=${GOOGLE_MAPS_API_KEY}`;
};

// Generate comprehensive maps data object
export const generateMapsData = (lat, lon, locationName, options = {}) => {
  try {
    const mapsData = {
      coordinates: {
        lat: parseFloat(lat),
        lon: parseFloat(lon)
      },
      locationName: locationName || `${lat}, ${lon}`,
      embedUrl: generateMapsEmbedUrl(lat, lon, locationName),
      googleMapsUrl: `https://www.google.com/maps?q=${lat},${lon}`,
      searchUrl: `https://www.google.com/maps/search/${encodeURIComponent(locationName || `${lat},${lon}`)}`
    };

    // Add static map URL if API key is available
    if (GOOGLE_MAPS_API_KEY) {
      mapsData.staticMapUrl = generateStaticMapUrl(lat, lon, locationName, options.staticMap);
      mapsData.streetViewUrl = generateStreetViewUrl(lat, lon, options.streetView);
    }

    // Add directions URLs for common modes
    if (options.userLocation) {
      const { lat: userLat, lon: userLon } = options.userLocation;
      mapsData.directions = {
        driving: generateDirectionsUrl(userLat, userLon, lat, lon, 'driving'),
        walking: generateDirectionsUrl(userLat, userLon, lat, lon, 'walking'),
        transit: generateDirectionsUrl(userLat, userLon, lat, lon, 'transit')
      };
    }

    return mapsData;
  } catch (error) {
    console.error('Error generating maps data:', error.message);
    return {
      coordinates: { lat: parseFloat(lat), lon: parseFloat(lon) },
      locationName: locationName || `${lat}, ${lon}`,
      embedUrl: generateMapsEmbedUrl(lat, lon, locationName),
      googleMapsUrl: `https://www.google.com/maps?q=${lat},${lon}`,
      error: 'Failed to generate complete maps data'
    };
  }
};

// Validate coordinates
export const validateCoordinates = (lat, lon) => {
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lon);

  if (isNaN(latitude) || isNaN(longitude)) {
    return { isValid: false, error: 'Coordinates must be valid numbers' };
  }

  if (latitude < -90 || latitude > 90) {
    return { isValid: false, error: 'Latitude must be between -90 and 90' };
  }

  if (longitude < -180 || longitude > 180) {
    return { isValid: false, error: 'Longitude must be between -180 and 180' };
  }

  return { isValid: true, lat: latitude, lon: longitude };
};

// Get place details using Google Places API (if available)
export const getPlaceDetails = async (placeId) => {
  if (!GOOGLE_MAPS_API_KEY) {
    console.warn('Google Maps API key not provided. Cannot fetch place details.');
    return null;
  }

  try {
    const axios = (await import('axios')).default;
    
    const response = await axios.get('https://maps.googleapis.com/maps/api/place/details/json', {
      params: {
        place_id: placeId,
        fields: 'name,formatted_address,geometry,photos,rating,reviews,types,website,formatted_phone_number',
        key: GOOGLE_MAPS_API_KEY
      },
      timeout: 10000
    });

    if (response.data.status === 'OK') {
      return response.data.result;
    } else {
      console.error('Google Places API error:', response.data.status);
      return null;
    }
  } catch (error) {
    console.error('Error fetching place details:', error.message);
    return null;
  }
};

// Search for places near coordinates
export const searchNearbyPlaces = async (lat, lon, type = 'tourist_attraction', radius = 5000) => {
  if (!GOOGLE_MAPS_API_KEY) {
    console.warn('Google Maps API key not provided. Cannot search nearby places.');
    return [];
  }

  try {
    const axios = (await import('axios')).default;
    
    const response = await axios.get('https://maps.googleapis.com/maps/api/place/nearbysearch/json', {
      params: {
        location: `${lat},${lon}`,
        radius: radius,
        type: type,
        key: GOOGLE_MAPS_API_KEY
      },
      timeout: 10000
    });

    if (response.data.status === 'OK') {
      return response.data.results.map(place => ({
        placeId: place.place_id,
        name: place.name,
        address: place.vicinity,
        rating: place.rating,
        types: place.types,
        location: place.geometry.location,
        photos: place.photos ? place.photos.map(photo => 
          `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${GOOGLE_MAPS_API_KEY}`
        ) : []
      }));
    } else {
      console.error('Google Places API error:', response.data.status);
      return [];
    }
  } catch (error) {
    console.error('Error searching nearby places:', error.message);
    return [];
  }
};

// Generate a comprehensive location info object
export const generateLocationInfo = async (lat, lon, locationName, options = {}) => {
  const mapsData = generateMapsData(lat, lon, locationName, options);
  
  // Add nearby places if requested and API key is available
  if (options.includeNearbyPlaces && GOOGLE_MAPS_API_KEY) {
    try {
      mapsData.nearbyPlaces = {
        attractions: await searchNearbyPlaces(lat, lon, 'tourist_attraction'),
        restaurants: await searchNearbyPlaces(lat, lon, 'restaurant'),
        hotels: await searchNearbyPlaces(lat, lon, 'lodging')
      };
    } catch (error) {
      console.warn('Failed to fetch nearby places:', error.message);
      mapsData.nearbyPlaces = { error: 'Failed to fetch nearby places' };
    }
  }

  return mapsData;
};

// Helper function to validate Google Maps API key
export const validateGoogleMapsAPIKey = async () => {
  if (!GOOGLE_MAPS_API_KEY) {
    return { isValid: false, error: 'Google Maps API key not provided' };
  }

  try {
    const axios = (await import('axios')).default;
    
    // Test with a simple geocoding request
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address: 'New York',
        key: GOOGLE_MAPS_API_KEY
      },
      timeout: 5000
    });

    if (response.data.status === 'OK') {
      return { isValid: true, message: 'Google Maps API key is valid' };
    } else if (response.data.status === 'REQUEST_DENIED') {
      return { isValid: false, error: 'Google Maps API key is invalid or restricted' };
    } else {
      return { isValid: false, error: `Google Maps API error: ${response.data.status}` };
    }
  } catch (error) {
    return { isValid: false, error: 'Unable to validate Google Maps API key' };
  }
};
