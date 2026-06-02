const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const geoBtn = document.getElementById('geoBtn');
const weatherInfo = document.getElementById('weatherInfo');
const errorMessage = document.getElementById('errorMessage');

// DOM Elements to update data
const locationName = document.getElementById('locationName');
const temperature = document.getElementById('temperature');
const conditionText = document.getElementById('conditionText');
const humidity = document.getElementById('humidity');
const windSpeed = document.getElementById('windSpeed');

// Helper to translate WMO codes to clear language strings
function parseWeatherCode(code) {
    const codes = {
        0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
        45: 'Foggy', 48: 'Depositing rime fog', 51: 'Light drizzle',
        61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
        71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow',
        80: 'Slight rain showers', 81: 'Moderate rain showers', 95: 'Thunderstorm'
    };
    return codes[code] || 'Unspecified Conditions';
}

// Core Function: Fetches numeric conditions using raw Coordinates
async function fetchWeather(lat, lon, displayName) {
    try {
        errorMessage.textContent = ""; // Reset errors
        
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`;
        const response = await fetch(weatherUrl);
        
        if (!response.ok) throw new Error("Weather server data retrieval failed.");
        const data = await response.json();
        
        // Map payloads directly into text variables
        locationName.textContent = displayName;
        temperature.textContent = Math.round(data.current.temperature_2m);
        conditionText.textContent = parseWeatherCode(data.current.weather_code);
        humidity.textContent = `${data.current.relative_humidity_2m}%`;
        windSpeed.textContent = `${data.current.wind_speed_10m} km/h`;
        
        weatherInfo.classList.remove('hidden');
    } catch (err) {
        showError("Could not retrieve current weather details. Please try again.");
    }
}

// Method A: User enters a manual search string 
async function handleSearch() {
    const query = cityInput.value.trim();
    
    // --- ALERT MESSAGE AREA FOR EMPTY INPUT ---
    if (!query) {
        return showError("⚠️ Please enter your city!");
    }

    try {
        errorMessage.textContent = "";
        // Geocode the city string into structural coordinates
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`;
        const res = await fetch(geoUrl);
        const data = await res.json();

        if (!data.results || data.results.length === 0) {
            return showError("City not found. Check spelling and retry.");
        }

        const target = data.results[0];
        const label = `${target.name}, ${target.country}`;
        fetchWeather(target.latitude, target.longitude, label);
    } catch (err) {
        showError("Geocoding lookup failed.");
    }
}

// Method B: User requests native GPS coordinates
function handleGeolocation() {
    if (!navigator.geolocation) {
        return showError("Geolocation tools are not supported by your browser software.");
    }

    geoBtn.textContent = "Locating...";
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            geoBtn.textContent = "📍 Detect My Location";
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            // Fetch using coordinate labels
            fetchWeather(lat, lon, `Your Location (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`);
        },
        (error) => {
            geoBtn.textContent = "📍 Detect My Location";
            showError("Location access denied. Please type a city name manually instead.");
        }
    );
}

function showError(msg) {
    weatherInfo.classList.add('hidden');
    errorMessage.textContent = msg;
}

// Event hooks
searchBtn.addEventListener('click', handleSearch);
geoBtn.addEventListener('click', handleGeolocation);
cityInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSearch(); });