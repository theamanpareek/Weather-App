# 🌤️ Weather App

A modern, responsive React weather application that provides current weather information and 5-day forecasts for any location worldwide.

## ✨ Features

- **Multiple Location Input Methods**: Search by city name, zip code, landmarks, or GPS coordinates
- **Geolocation Support**: Automatically detect and display weather for user's current location
- **Current Weather Display**: Temperature, weather conditions, humidity, wind speed, pressure, visibility, sunrise/sunset times
- **5-Day Forecast**: Detailed weather predictions with icons and key metrics
- **Responsive Design**: Mobile-first design that works perfectly on all devices
- **Loading Animations**: Smooth loading indicators while fetching data
- **Error Handling**: User-friendly error messages with retry functionality
- **Modern UI**: Clean, glassmorphism-inspired design with smooth animations

## 🚀 Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd tech-weather
```

2. Install dependencies:
```bash
npm install
```

3. Get a free API key from [OpenWeatherMap](https://openweathermap.org/api):
   - Sign up for a free account
   - Navigate to the API keys section
   - Generate a new API key

4. Configure the API key:
   - Open `src/utils/weatherAPI.js`
   - Replace `YOUR_API_KEY_HERE` with your actual OpenWeatherMap API key:
   ```javascript
   const API_KEY = 'your_actual_api_key_here';
   ```

5. Start the development server:
```bash
npm run dev
```

6. Open your browser and navigate to `http://localhost:5173`

## 🎯 Usage

### Search Options

- **City Name**: Enter any city name (e.g., "New York", "London, UK")
- **Zip Code**: Use postal codes (e.g., "10001", "10001,US")
- **Coordinates**: Enter latitude,longitude (e.g., "40.7128,-74.0060")
- **Current Location**: Click "Use My Location" to automatically detect your position

### Features Overview

- **Current Weather Card**: Displays comprehensive current weather information
- **5-Day Forecast**: Shows weather predictions for the next 5 days
- **Responsive Layout**: Adapts to different screen sizes automatically
- **Error Handling**: Clear error messages for invalid locations or network issues

## 🛠️ Built With

- **React 18** - Frontend framework
- **Vite** - Build tool and development server
- **Axios** - HTTP client for API requests
- **React Icons** - Icon library for weather and UI icons
- **OpenWeatherMap API** - Weather data provider
- **CSS3** - Modern styling with Grid, Flexbox, and animations

## 📱 Responsive Design

The application is fully responsive and optimized for:
- Desktop computers (1200px+)
- Tablets (768px - 1199px)
- Mobile phones (320px - 767px)

## 🌐 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📞 Support

If you have any questions or run into issues, please open an issue on GitHub.
