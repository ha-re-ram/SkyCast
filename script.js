
/* script.js */
const apiKey = '49ae5ed4f97c8b387090ac4c6d13c536';
const apiBaseUrl = 'https://api.openweathermap.org/data/2.5';

// DOM Elements
const body = document.body;
const themeToggle = document.getElementById('theme-toggle');
const weatherForm = document.getElementById('location-form');
const locationInput = document.getElementById('location-input');
const useLocationBtn = document.getElementById('use-location');
const weatherDisplay = document.getElementById('weather-display');
const initialState = document.getElementById('initial-state');
const loadingState = document.getElementById('loading');
const errorState = document.getElementById('error-state');
const recentSearchesBox = document.getElementById('recent-searches');

// About Modal Elements
const aboutLink = document.getElementById('about-link');
const aboutSection = document.getElementById('about-section');
const closeAbout = document.getElementById('close-about');

// Weather Data Elements
const locationName = document.getElementById('location-name');
const currentDate = document.getElementById('current-date');
const weatherIcon = document.getElementById('weather-icon');
const weatherDesc = document.getElementById('description');
const temperature = document.getElementById('temperature');
const feelsLike = document.getElementById('feels-like');
const tempRange = document.getElementById('temp-range');
const humidity = document.getElementById('humidity');
const windSpeed = document.getElementById('wind-speed');
const pressure = document.getElementById('pressure');
const visibility = document.getElementById('visibility');
const forecastContainer = document.getElementById('forecast-container');
const appBg = document.getElementById('app-bg');

// App Initialization
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    loadRecentSearches();
    
    // Check for auto-location at start
    // checkGeolocationPermission();

    // About toggle logic
    if (aboutLink) {
        aboutLink.addEventListener('click', (e) => {
            e.preventDefault();
            aboutSection.classList.remove('hidden');
        });
    }

    if (closeAbout) {
        closeAbout.addEventListener('click', () => {
            aboutSection.classList.add('hidden');
        });
    }

    // Close on outside click
    window.addEventListener('click', (e) => {
        if (e.target === aboutSection) {
            aboutSection.classList.add('hidden');
        }
    });
});

// Theme Management
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
}

themeToggle.addEventListener('click', () => {
    const newTheme = body.classList.contains('light-mode') ? 'dark' : 'light';
    setTheme(newTheme);
});

function setTheme(theme) {
    if (theme === 'dark') {
        body.classList.remove('light-mode');
        body.classList.add('dark-mode');
        themeToggle.querySelector('.theme-icon').textContent = '☀️';
    } else {
        body.classList.remove('dark-mode');
        body.classList.add('light-mode');
        themeToggle.querySelector('.theme-icon').textContent = '🌙';
    }
    localStorage.setItem('theme', theme);
}

// Weather Fetching Logic
weatherForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const city = locationInput.value.trim();
    if (city) {
        fetchWeatherByCity(city);
    }
});

useLocationBtn.addEventListener('click', () => {
    if (navigator.geolocation) {
        showLoading(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude);
            },
            (err) => {
                showError("Unable to retrieve your location. Please type manually.");
                showLoading(false);
            }
        );
    } else {
        showError("Geolocation is not supported by your browser.");
    }
});

async function fetchWeatherByCity(city) {
    showLoading(true);
    try {
        const response = await fetch(`${apiBaseUrl}/weather?q=${city}&appid=${apiKey}&units=metric`);
        if (!response.ok) throw new Error('City not found');
        const data = await response.json();
        const forecastRes = await fetch(`${apiBaseUrl}/forecast?q=${city}&appid=${apiKey}&units=metric`);
        const forecastData = await forecastRes.json();
        
        updateUI(data, forecastData);
        saveRecentSearch(city);
    } catch (err) {
        showError(err.message);
    } finally {
        showLoading(false);
    }
}

async function fetchWeatherByCoords(lat, lon) {
    try {
        const response = await fetch(`${apiBaseUrl}/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`);
        if (!response.ok) throw new Error('Location data failed');
        const data = await response.json();
        const forecastRes = await fetch(`${apiBaseUrl}/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`);
        const forecastData = await forecastRes.json();
        
        updateUI(data, forecastData);
    } catch (err) {
        showError(err.message);
    } finally {
        showLoading(false);
    }
}

// UI Updating Functions
function updateUI(current, forecast) {
    initialState.classList.add('hidden');
    errorState.classList.add('hidden');
    weatherDisplay.classList.remove('hidden');

    // Basic Info
    locationName.textContent = `${current.name}, ${current.sys.country}`;
    currentDate.textContent = new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });
    
    // Weather Status
    const iconCode = current.weather[0].icon;
    weatherIcon.src = `https://openweathermap.org/img/wn/${iconCode}@4x.png`;
    weatherDesc.textContent = current.weather[0].description;
    
    // Temps
    temperature.textContent = Math.round(current.main.temp);
    feelsLike.textContent = `${Math.round(current.main.feels_like)}°C`;
    tempRange.textContent = `${Math.round(current.main.temp_min)}°C / ${Math.round(current.main.temp_max)}°C`;
    
    // Details
    humidity.textContent = `${current.main.humidity}%`;
    windSpeed.textContent = `${(current.wind.speed * 3.6).toFixed(1)} km/h`;
    pressure.textContent = `${current.main.pressure} hPa`;
    visibility.textContent = `${(current.visibility / 1000).toFixed(1)} km`;

    // Forecast
    updateForecastUI(forecast.list);
    
    // Background Update
    updateBackground(current.weather[0].id);

    // Clear input
    locationInput.value = '';
}

function updateForecastUI(forecastList) {
    forecastContainer.innerHTML = '';
    
    // OpenWeather 5-day forecast gives data every 3 hours. 
    // We want to pick one data point per day (e.g., at 12:00)
    const dailyData = forecastList.filter(item => item.dt_txt.includes("12:00:00"));

    dailyData.forEach(day => {
        const date = new Date(day.dt * 1000);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        
        const card = document.createElement('div');
        card.className = 'forecast-card glass-inner';
        card.innerHTML = `
            <span class="forecast-day">${dayName}</span>
            <img class="forecast-icon" src="https://openweathermap.org/img/wn/${day.weather[0].icon}.png" alt="Weather">
            <span class="forecast-temp">${Math.round(day.main.temp)}°C</span>
            <span class="forecast-desc">${day.weather[0].main}</span>
        `;
        forecastContainer.appendChild(card);
    });
}

function updateBackground(weatherId) {
    // Weather condition codes: https://openweathermap.org/weather-conditions
    let gradient = '';
    if (weatherId >= 200 && weatherId < 300) { // Thunderstorm
        gradient = 'linear-gradient(135deg, #1f2937, #111827)';
    } else if (weatherId >= 300 && weatherId < 600) { // Rain/Drizzle
        gradient = 'linear-gradient(135deg, #374151, #1e3a8a)';
    } else if (weatherId >= 600 && weatherId < 700) { // Snow
        gradient = 'linear-gradient(135deg, #e5e7eb, #93c5fd)';
    } else if (weatherId >= 700 && weatherId < 800) { // Atmosphere (Mist/Fog)
        gradient = 'linear-gradient(135deg, #9ca3af, #4b5563)';
    } else if (weatherId === 800) { // Clear
        gradient = body.classList.contains('dark-mode') ? 
            'linear-gradient(135deg, #1e3a8a, #1e40af)' : 
            'linear-gradient(135deg, #38bdf8, #0ea5e9)';
    } else { // Clouds
        gradient = body.classList.contains('dark-mode') ? 
            'linear-gradient(135deg, #334155, #1e293b)' : 
            'linear-gradient(135deg, #94a3b8, #64748b)';
    }
    appBg.style.background = gradient;
}

// Utility States
function showLoading(show) {
    if (show) {
        loadingState.classList.remove('hidden');
        initialState.classList.add('hidden');
        weatherDisplay.classList.add('hidden');
        errorState.classList.add('hidden');
    } else {
        loadingState.classList.add('hidden');
    }
}

function showError(msg) {
    errorState.classList.remove('hidden');
    document.getElementById('error-message').textContent = msg;
    weatherDisplay.classList.add('hidden');
    initialState.classList.add('hidden');
    showLoading(false);
}

// Recent Searches
function saveRecentSearch(city) {
    let searches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    if (!searches.includes(city)) {
        searches.unshift(city);
        searches = searches.slice(0, 5); // Keep last 5
        localStorage.setItem('recentSearches', JSON.stringify(searches));
        loadRecentSearches();
    }
}

function loadRecentSearches() {
    const searches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    recentSearchesBox.innerHTML = '';
    
    if (searches.length > 0) {
        const title = document.createElement('span');
        title.textContent = 'Recent: ';
        title.style.fontSize = '0.8rem';
        title.style.color = 'var(--text-color-muted)';
        recentSearchesBox.appendChild(title);

        searches.forEach(city => {
            const tag = document.createElement('button');
            tag.className = 'recent-tag';
            tag.textContent = city;
            tag.onclick = () => fetchWeatherByCity(city);
            recentSearchesBox.appendChild(tag);
        });
    }
}
