import axios from 'axios';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_API_BASE_URL = 'https://www.googleapis.com/youtube/v3';

// Fetch YouTube videos related to a location
export const fetchYouTubeVideos = async (location, maxResults = 5) => {
  // If no API key is provided, return empty array
  if (!YOUTUBE_API_KEY) {
    console.warn('YouTube API key not provided. Skipping YouTube video fetch.');
    return [];
  }

  try {
    const searchQuery = `${location} travel guide weather tourism`;
    
    const response = await axios.get(`${YOUTUBE_API_BASE_URL}/search`, {
      params: {
        part: 'snippet',
        q: searchQuery,
        type: 'video',
        maxResults: maxResults,
        key: YOUTUBE_API_KEY,
        order: 'relevance',
        safeSearch: 'moderate',
        videoDefinition: 'any',
        videoDuration: 'any'
      },
      timeout: 10000 // 10 second timeout
    });

    if (!response.data || !response.data.items) {
      console.warn('No YouTube videos found for location:', location);
      return [];
    }

    const videos = response.data.items.map(item => ({
      title: item.snippet.title,
      videoId: item.id.videoId,
      thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
      channelTitle: item.snippet.channelTitle,
      publishedAt: new Date(item.snippet.publishedAt),
      description: item.snippet.description.substring(0, 200) + '...',
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`
    }));

    console.log(`Found ${videos.length} YouTube videos for location: ${location}`);
    return videos;

  } catch (error) {
    console.error('Error fetching YouTube videos:', error.message);
    
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.error?.message || 'Unknown YouTube API error';
      
      switch (status) {
        case 400:
          console.error('YouTube API: Bad request -', message);
          break;
        case 401:
          console.error('YouTube API: Invalid API key');
          break;
        case 403:
          console.error('YouTube API: Quota exceeded or access forbidden -', message);
          break;
        case 404:
          console.error('YouTube API: Resource not found');
          break;
        default:
          console.error(`YouTube API error (${status}):`, message);
      }
    }
    
    // Return empty array instead of throwing error to not break the main flow
    return [];
  }
};

// Get video details by video ID
export const getVideoDetails = async (videoId) => {
  if (!YOUTUBE_API_KEY) {
    console.warn('YouTube API key not provided. Cannot fetch video details.');
    return null;
  }

  try {
    const response = await axios.get(`${YOUTUBE_API_BASE_URL}/videos`, {
      params: {
        part: 'snippet,statistics,contentDetails',
        id: videoId,
        key: YOUTUBE_API_KEY
      },
      timeout: 10000
    });

    if (!response.data || !response.data.items || response.data.items.length === 0) {
      console.warn('Video not found:', videoId);
      return null;
    }

    const video = response.data.items[0];
    
    return {
      title: video.snippet.title,
      videoId: video.id,
      thumbnail: video.snippet.thumbnails.medium?.url || video.snippet.thumbnails.default?.url,
      channelTitle: video.snippet.channelTitle,
      publishedAt: new Date(video.snippet.publishedAt),
      description: video.snippet.description,
      duration: video.contentDetails.duration,
      viewCount: parseInt(video.statistics.viewCount) || 0,
      likeCount: parseInt(video.statistics.likeCount) || 0,
      url: `https://www.youtube.com/watch?v=${video.id}`
    };

  } catch (error) {
    console.error('Error fetching video details:', error.message);
    return null;
  }
};

// Search for videos with more specific filters
export const searchVideosAdvanced = async (location, options = {}) => {
  if (!YOUTUBE_API_KEY) {
    console.warn('YouTube API key not provided. Skipping advanced YouTube search.');
    return [];
  }

  const {
    maxResults = 5,
    order = 'relevance',
    publishedAfter = null,
    publishedBefore = null,
    videoDuration = 'any',
    videoDefinition = 'any',
    safeSearch = 'moderate'
  } = options;

  try {
    const searchQuery = `${location} weather travel guide tourism`;
    
    const params = {
      part: 'snippet',
      q: searchQuery,
      type: 'video',
      maxResults: maxResults,
      key: YOUTUBE_API_KEY,
      order: order,
      safeSearch: safeSearch,
      videoDefinition: videoDefinition,
      videoDuration: videoDuration
    };

    // Add date filters if provided
    if (publishedAfter) {
      params.publishedAfter = publishedAfter;
    }
    if (publishedBefore) {
      params.publishedBefore = publishedBefore;
    }

    const response = await axios.get(`${YOUTUBE_API_BASE_URL}/search`, {
      params,
      timeout: 10000
    });

    if (!response.data || !response.data.items) {
      return [];
    }

    const videos = response.data.items.map(item => ({
      title: item.snippet.title,
      videoId: item.id.videoId,
      thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
      channelTitle: item.snippet.channelTitle,
      publishedAt: new Date(item.snippet.publishedAt),
      description: item.snippet.description.substring(0, 200) + '...',
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`
    }));

    return videos;

  } catch (error) {
    console.error('Error in advanced YouTube search:', error.message);
    return [];
  }
};

// Get channel information
export const getChannelInfo = async (channelId) => {
  if (!YOUTUBE_API_KEY) {
    console.warn('YouTube API key not provided. Cannot fetch channel info.');
    return null;
  }

  try {
    const response = await axios.get(`${YOUTUBE_API_BASE_URL}/channels`, {
      params: {
        part: 'snippet,statistics',
        id: channelId,
        key: YOUTUBE_API_KEY
      },
      timeout: 10000
    });

    if (!response.data || !response.data.items || response.data.items.length === 0) {
      return null;
    }

    const channel = response.data.items[0];
    
    return {
      channelId: channel.id,
      title: channel.snippet.title,
      description: channel.snippet.description,
      thumbnail: channel.snippet.thumbnails.medium?.url || channel.snippet.thumbnails.default?.url,
      subscriberCount: parseInt(channel.statistics.subscriberCount) || 0,
      videoCount: parseInt(channel.statistics.videoCount) || 0,
      viewCount: parseInt(channel.statistics.viewCount) || 0,
      publishedAt: new Date(channel.snippet.publishedAt)
    };

  } catch (error) {
    console.error('Error fetching channel info:', error.message);
    return null;
  }
};

// Helper function to validate YouTube API key
export const validateYouTubeAPIKey = async () => {
  if (!YOUTUBE_API_KEY) {
    return { isValid: false, error: 'YouTube API key not provided' };
  }

  try {
    const response = await axios.get(`${YOUTUBE_API_BASE_URL}/search`, {
      params: {
        part: 'snippet',
        q: 'test',
        type: 'video',
        maxResults: 1,
        key: YOUTUBE_API_KEY
      },
      timeout: 5000
    });

    return { isValid: true, message: 'YouTube API key is valid' };

  } catch (error) {
    if (error.response && error.response.status === 401) {
      return { isValid: false, error: 'Invalid YouTube API key' };
    } else if (error.response && error.response.status === 403) {
      return { isValid: false, error: 'YouTube API quota exceeded or access forbidden' };
    } else {
      return { isValid: false, error: 'Unable to validate YouTube API key' };
    }
  }
};

// Helper function to format duration from ISO 8601 format
export const formatDuration = (isoDuration) => {
  if (!isoDuration) return 'Unknown';
  
  const match = isoDuration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return 'Unknown';
  
  const hours = parseInt(match[1]) || 0;
  const minutes = parseInt(match[2]) || 0;
  const seconds = parseInt(match[3]) || 0;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
};
