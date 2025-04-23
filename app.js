'use strict';

const api_key = "7ccaf6d166887ac65768460297e2f71a";

// Track current units setting
let currentUnit = localStorage.getItem('tempUnit') || 'metric';

// Update unit toggle based on stored preference
const updateUnitToggle = () => {
    if (currentUnit === 'metric') {
        document.getElementById('celsius').checked = true;
    } else {
        document.getElementById('fahrenheit').checked = true;
    }
};

// Initialize last location for refresh functionality
let lastLocation = {
    lat: null,
    lon: null
};

const fetchData = async function (url, callback) {
    try {
        const response = await fetch(`${url}&appid=${api_key}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        callback(data);
    } catch (error) {
        console.error('Error fetching data:', error);
        error404();
    }
}

// Add a new URL method for direct city name search
const url = {
    currentWeather(lat, lon) {
        return `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=${currentUnit}`;
    },
    currentWeatherByCity(city) {
        return `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=${currentUnit}`;
    },
    forecast(lat, lon) {
        return `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=${currentUnit}`;
    },
    forecastByCity(city) {
        return `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&units=${currentUnit}`;
    },
    airPollution(lat, lon) {
        return `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}`;
    },
    reverseGeo(lat, lon) {
        return `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=5`;
    },
    geo(query) {
        return `https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=5`;
    }
};

const weekDayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const getDate = function (dateUnix, timezone) {
    const date = new Date((dateUnix + timezone) * 1000);
    const weekDayName = weekDayNames[date.getUTCDay()];
    const monthName = monthNames[date.getUTCMonth()];
    return `${weekDayName} ${date.getUTCDate()} ${monthName}`;
}

const getTime = function (timeUnix, timezone) {
    const date = new Date((timeUnix + timezone) * 1000);
    const hours = date.getUTCHours();
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    const period = hours >= 12 ? 'PM' : 'AM';
    return `${hours % 12 || 12}:${minutes} ${period}`;
}

const getHours = function (timeUnix, timezone) {
    const date = new Date((timeUnix + timezone) * 1000);
    const hours = date.getUTCHours();
    const period = hours >= 12 ? 'PM' : 'AM';
    return `${hours % 12 || 12} ${period}`;
}

// Convert temperature based on unit
const formatTemp = temp => {
    const value = parseInt(temp);
    return `${value}°${currentUnit === 'metric' ? 'C' : 'F'}`;
};

// Enhanced wind speed conversion
const formatWindSpeed = windSpeed => {
    if (currentUnit === 'metric') {
        return `${(windSpeed * 3.6).toFixed(1)} km/h`;
    } else {
        return `${(windSpeed).toFixed(1)} mph`;
    }
};

const aqiText = {
    1: {
        level: "Good",
        message: "Air quality is considered satisfactory, and air pollution poses little or no risk."
    },
    2: {
        level: "Fair",
        message: "Air quality is acceptable; however, there may be a moderate health concern for sensitive people."
    },
    3: {
        level: "Moderate",
        message: "Members of sensitive groups may experience health effects."
    },
    4: {
        level: "Poor",
        message: "Everyone may begin to experience health effects."
    },
    5: {
        level: "Very Poor",
        message: "Health warnings of emergency conditions. The entire population is likely to be affected."
    }
};

const defaultLocation = "#/weather?lat=6.9271&lon=79.8612";

const currentLocation = function () {
    if (!navigator.geolocation) {
        showToast("Geolocation is not supported by this browser", "warning");
        window.location.hash = defaultLocation;
        return;
    }

    loading.style.display = 'flex';
    
    window.navigator.geolocation.getCurrentPosition(
        res => {
            const { latitude, longitude } = res.coords;
            console.log(`Latitude: ${latitude}, Longitude: ${longitude}`);
            updateWeather(`lat=${latitude}`, `lon=${longitude}`);
        },
        err => {
            console.error('Error obtaining location:', err);
            showToast("Could not access your location. Using default location instead.", "warning");
            window.location.hash = defaultLocation;
            loading.style.display = 'none';
        }
    );
}

// Enhance searchedLocation function to handle direct city name searches
const searchedLocation = query => {
    if (query.includes('city=')) {
        const city = query.split('=')[1];
        updateWeatherByCity(decodeURIComponent(city));
    } else {
        updateWeather(...query.split('&'));
    }
    searchResult.innerHTML = '';
};

// Update routes map to include direct city search
const routes = new Map([
    ["/current-location", currentLocation],
    ["/weather", searchedLocation],
    ["/city", query => {
        const city = query.split('=')[1];
        updateWeatherByCity(decodeURIComponent(city));
    }]
]);

const checkHash = function () {
    const requestURL = window.location.hash.slice(1);
    const [route, query] = requestURL.includes('?') ? requestURL.split('?') : [requestURL];
    routes.get(route) ? routes.get(route)(query) : error404();
}

window.addEventListener("hashchange", checkHash);
window.addEventListener("load", () => {
    // Initialize unit toggle based on saved preference
    updateUnitToggle();
    
    // Add event listeners for unit toggle
    document.querySelectorAll('input[name="temp-unit"]').forEach(input => {
        input.addEventListener('change', function() {
            currentUnit = this.value;
            localStorage.setItem('tempUnit', currentUnit);
            
            // Refresh weather with new unit if we have coordinates
            if (lastLocation.lat && lastLocation.lon) {
                updateWeather(`lat=${lastLocation.lat}`, `lon=${lastLocation.lon}`);
            }
        });
    });
    
    // Set up clear search button
    document.getElementById('clear-search')?.addEventListener('click', () => {
        searchField.value = '';
        searchResult.innerHTML = '';
        document.getElementById('search-placeholder').classList.remove('d-none');
    });
    
    // Set up refresh button
    document.getElementById('refresh-btn')?.addEventListener('click', () => {
        if (lastLocation.lat && lastLocation.lon) {
            document.getElementById('refresh-btn').querySelector('i').classList.add('rotating');
            updateWeather(`lat=${lastLocation.lat}`, `lon=${lastLocation.lon}`, true);
        }
    });
    
    // Set up share button
    document.getElementById('share-btn')?.addEventListener('click', shareWeather);
    
    // Check if hash is present, otherwise use default
    if (!window.location.hash) {
        window.location.hash = "#/current-location";
    } else {
        checkHash();
    }
});

const searchField = document.querySelector("[data-search-field]");
const searchResult = document.querySelector("[data-search-result]");

let searchTimeout = null;
const searchTimeoutDuration = 500;

// Modify search field event listener to show initial text
searchField?.addEventListener('input', function () {
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }

    if (!searchField.value) {
        searchResult.innerHTML = '';
        document.getElementById('search-placeholder')?.classList.remove('d-none');
        return;
    }

    searchTimeout = setTimeout(() => {
        // Show loading indicator in search
        searchResult.innerHTML = `
            <div class="text-center py-3">
                <div class="spinner-border spinner-border-sm text-primary" role="status">
                    <span class="visually-hidden">Searching...</span>
                </div>
                <p class="mt-2 mb-0">Searching for "${searchField.value}"...</p>
            </div>
        `;
        
        // For direct city search without coordinates lookup
        if (searchField.value.trim().length > 2) {
            // Try direct city search first
            fetchData(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(searchField.value)}&appid=${api_key}`, function(weatherData) {
                if (weatherData) {
                    const { name, sys: { country }, coord: { lat, lon } } = weatherData;
                    searchResult.innerHTML = `
                        <ul class="list-group shadow-sm" data-search-list>
                            <li class="list-group-item d-flex align-items-center gap-2">
                                <i class="bi bi-geo-alt text-primary"></i>
                                <div class="flex-grow-1">
                                    <p class="mb-0 fw-bold">${name}</p>
                                    <small class="text-muted">${country}</small>
                                </div>
                                <i class="bi bi-chevron-right text-muted"></i>
                                <a href="#/weather?lat=${lat}&lon=${lon}" class="stretched-link"></a>
                            </li>
                        </ul>
                    `;

                    // Add click event to the search result
                    const item = searchResult.querySelector('li');
                    item.addEventListener('click', () => {
                        searchField.value = '';
                        searchResult.innerHTML = '';
                        
                        // Update weather data
                        updateWeather(`lat=${lat}`, `lon=${lon}`);
                        
                        // Close modal after selection
                        closeSearchModal();
                    });
                }
            }, error => {
                // If direct city search fails, fall back to geocoding API
                fetchData(url.geo(searchField.value), function (locations) {
                    handleGeocodingResults(locations);
                });
            });
        } else {
            // For shorter queries or geocoding search
            fetchData(url.geo(searchField.value), function (locations) {
                handleGeocodingResults(locations);
            });
        }
    }, searchTimeoutDuration);
});

// Function to handle geocoding API results
function handleGeocodingResults(locations) {
    if (locations.length === 0) {
        searchResult.innerHTML = `
            <div class="text-center py-3">
                <i class="bi bi-search text-muted display-4"></i>
                <p class="mb-0">No locations found for "${searchField.value}"</p>
            </div>
        `;
        return;
    }
    
    searchResult.innerHTML = `
        <ul class="list-group shadow-sm" data-search-list></ul>
    `;

    const searchList = searchResult.querySelector("[data-search-list]");
    document.getElementById('search-placeholder')?.classList.add('d-none');
    
    for (const { name, lat, lon, country, state } of locations) {
        const item = document.createElement("li");
        item.classList.add("list-group-item", "d-flex", "align-items-center", "gap-2");
        item.innerHTML = `
            <i class="bi bi-geo-alt text-primary"></i>
            <div class="flex-grow-1">
                <p class="mb-0 fw-bold">${name}</p>
                <small class="text-muted">${state || ""} ${country}</small>
            </div>
            <i class="bi bi-chevron-right text-muted"></i>
            <a href="#/weather?lat=${lat}&lon=${lon}" class="stretched-link"></a>
        `;
        
        item.addEventListener('click', () => {
            searchField.value = '';
            searchResult.innerHTML = '';
            updateWeather(`lat=${lat}`, `lon=${lon}`);
            
            // Close modal after selection
            closeSearchModal();
        });

        searchList.appendChild(item);
    }
}

// Helper function to close search modal
function closeSearchModal() {
    const searchModal = bootstrap.Modal.getInstance(document.getElementById('searchModal'));
    if (searchModal) {
        searchModal.hide();
    }
}

// Add a new function to update weather by city name directly
function updateWeatherByCity(cityName) {
    loading.style.display = 'flex';
    container.style.overflowY = 'hidden';
    container.classList.remove("fade-in");
    errorContent.classList.add('d-none');

    const currentWeatherSection = document.querySelector("[data-current-weather]");
    const highlightsSection = document.querySelector("[data-highlights]");
    const hourlySection = document.querySelector("[data-hour-forecast]");
    const forecastSection = document.querySelector("[data-5day-forecast]");

    currentWeatherSection.innerHTML = '';
    highlightsSection.innerHTML = '';
    hourlySection.innerHTML = '';
    forecastSection.innerHTML = '';

    // Reset current location button state
    if (currentLocationBtn) {
        currentLocationBtn.removeAttribute("disabled");
    }

    // Fetch weather data using city name
    fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cityName)}&units=${currentUnit}&appid=${api_key}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`City not found or API error: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            const { coord: { lat, lon } } = data;
            
            // Save coordinates for refresh functionality
            lastLocation.lat = lat;
            lastLocation.lon = lon;
            
            // Update URL without triggering another data fetch
            window.history.replaceState(null, '', `#/weather?lat=${lat}&lon=${lon}`);
            
            // Now use standard updateWeather with the obtained coordinates
            updateWeather(`lat=${lat}`, `lon=${lon}`);
        })
        .catch(error => {
            console.error('Error fetching city weather data:', error);
            showToast(`Unable to find weather data for "${cityName}"`, "warning");
            error404();
        });
}

searchResult.addEventListener('click', function (event) {
    if (event.target.closest('.list-group-item')) {
        searchResult.innerHTML = '';
    }
});

const container = document.querySelector("[data-container]");
const loading = document.querySelector("[data-loading]");
const currentLocationBtn = document.querySelector("[data-current-location-btn]");
const errorContent = document.querySelector("[data-error-content]");

// Update last updated time
const updateLastUpdatedTime = () => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    document.getElementById('update-time').textContent = timeStr;
    document.getElementById('last-updated').classList.remove('d-none');
    
    // Stop rotation animation on refresh button
    const refreshBtn = document.getElementById('refresh-btn').querySelector('i');
    refreshBtn.classList.remove('rotating');
};

// Show toast notifications
const showToast = (message, type = 'info') => {
    const alertTime = document.getElementById('alert-time');
    const alertMessage = document.getElementById('alert-message');
    const weatherAlert = document.getElementById('weatherAlert');
    
    alertTime.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    alertMessage.textContent = message;
    
    // Set icon based on type
    const toastHeader = weatherAlert.querySelector('.toast-header i');
    toastHeader.className = `bi ${type === 'warning' ? 'bi-exclamation-triangle-fill text-warning' : 'bi-info-circle-fill text-info'} me-2`;
    
    const toast = new bootstrap.Toast(weatherAlert);
    toast.show();
};

// Share current weather
const shareWeather = async () => {
    if (!navigator.share) {
        showToast("Sharing is not supported on this browser", "warning");
        return;
    }
    
    try {
        const locationName = document.querySelector('[data-location]')?.textContent || "weather forecast";
        const currentTemp = document.querySelector('.display-1')?.textContent || "";
        
        await navigator.share({
            title: `Aero Cast - Weather for ${locationName}`,
            text: `Check out the weather in ${locationName}: ${currentTemp}. Powered by Aero Cast.`,
            url: window.location.href
        });
    } catch (err) {
        console.error('Error sharing:', err);
    }
};

const updateWeather = function (lat, lon, isRefresh = false) {
    const [latQuery, lonQuery] = [lat, lon];
    const latitude = latQuery.split('=')[1];
    const longitude = lonQuery.split('=')[1];
    
    // Save for refresh functionality
    lastLocation.lat = latitude;
    lastLocation.lon = longitude;

    loading.style.display = 'flex';
    container.style.overflowY = 'hidden';
    container.classList.remove("fade-in");
    errorContent.classList.add('d-none');

    const currentWeatherSection = document.querySelector("[data-current-weather]");
    const highlightsSection = document.querySelector("[data-highlights]");
    const hourlySection = document.querySelector("[data-hour-forecast]");
    const forecastSection = document.querySelector("[data-5day-forecast]");

    currentWeatherSection.innerHTML = '';
    highlightsSection.innerHTML = '';
    hourlySection.innerHTML = '';
    forecastSection.innerHTML = '';

    if (window.location.hash === "#/current-location") {
        currentLocationBtn?.setAttribute("disabled", "");
    } else {
        currentLocationBtn?.removeAttribute("disabled");
    }

    fetchData(url.currentWeather(latitude, longitude), function (currentWeather) {
        const {
            weather,
            dt: dateUnix,
            sys: { sunrise: sunriseUnixUTC, sunset: sunsetUnixUTC },
            main: { temp, feels_like, pressure, humidity },
            visibility,
            timezone,
            wind: { speed: windSpeed }
        } = currentWeather;
        const [{ description, icon }] = weather;

        currentWeatherSection.innerHTML = `
            <div class="card h-100" data-aos="fade-right">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-center mb-3">
                        <h2 class="card-title h5 mb-0">Current Weather</h2>
                        <span class="badge rounded-pill bg-primary">${getDate(dateUnix, timezone)}</span>
                    </div>
                    <div class="text-center my-4">
                        <h3 class="display-1 stat-number">${formatTemp(temp)}</h3>
                        <div class="weather-icon-container">
                            <img src="assets/images/weather_icons/${icon}.png" alt="${description}" width="64" height="64" class="weather-icon">
                        </div>
                        <p class="lead text-capitalize">${description}</p>
                        <div class="d-flex justify-content-center align-items-center gap-3 mt-3">
                            <span class="d-flex align-items-center">
                                <i class="bi bi-wind me-1"></i> ${formatWindSpeed(windSpeed)}
                            </span>
                            <span class="d-flex align-items-center">
                                <i class="bi bi-droplet me-1"></i> ${humidity}%
                            </span>
                        </div>
                    </div>
                    <ul class="list-group list-group-flush">
                        <li class="list-group-item d-flex justify-content-between align-items-center">
                            <span><i class="bi bi-calendar-event text-primary me-2"></i> Date</span>
                            <span>${getDate(dateUnix, timezone)}</span>
                        </li>
                        <li class="list-group-item d-flex justify-content-between align-items-center">
                            <span><i class="bi bi-geo-alt text-danger me-2"></i> Location</span>
                            <span data-location>Loading...</span>
                        </li>
                    </ul>
                </div>
            </div>
        `;

        fetchData(url.reverseGeo(latitude, longitude), function (locations) {
            if (locations?.[0]) {
                const { name, country } = locations[0];
                document.querySelector('[data-location]').textContent = `${name}, ${country}`;
                
                // Update page title with location
                document.title = `Aero Cast | ${name}, ${country}`;
            }
        });

        fetchData(url.airPollution(latitude, longitude), function (airPollution) {
            const [{
                main: { aqi },
                components: { no2, o3, so2, pm2_5 }
            }] = airPollution.list;

            const aqiData = aqiText[aqi];
            
            highlightsSection.innerHTML = `
                <div class="card" data-aos="fade-left">
                    <div class="card-body">
                        <div class="d-flex justify-content-between align-items-center mb-3">
                            <h2 class="card-title h5 mb-0">Today's Highlights</h2>
                            <span class="badge rounded-pill bg-${aqi <= 2 ? 'success' : aqi <= 3 ? 'warning' : 'danger'}">${aqiData.level}</span>
                        </div>
                        <div class="row g-3 mt-2">
                            <!-- Air Quality -->
                            <div class="col-md-6" data-aos="zoom-in" data-aos-delay="100">
                                <div class="card bg-light h-100">
                                    <div class="card-body">
                                        <h3 class="h6 mb-3 d-flex align-items-center">
                                            <i class="bi bi-wind text-primary me-2"></i>
                                            Air Quality Index
                                            <i class="bi bi-info-circle ms-2" data-bs-toggle="tooltip" title="${aqiData.message}"></i>
                                        </h3>
                                        <div class="wrapper">
                                            <ul class="list-unstyled">
                                                <li class="mb-2">
                                                    <div class="d-flex justify-content-between">
                                                        <span>PM2.5</span>
                                                        <span class="fw-bold stat-number">${pm2_5.toFixed(2)}</span>
                                                    </div>
                                                    <div class="progress" style="height: 6px;">
                                                        <div class="progress-bar bg-${getAqiColor(pm2_5, 25)}" style="width: ${Math.min(pm2_5/25*100, 100)}%"></div>
                                                    </div>
                                                </li>
                                                <li class="mb-2">
                                                    <div class="d-flex justify-content-between">
                                                        <span>SO2</span>
                                                        <span class="fw-bold stat-number">${so2.toFixed(2)}</span>
                                                    </div>
                                                    <div class="progress" style="height: 6px;">
                                                        <div class="progress-bar bg-${getAqiColor(so2, 40)}" style="width: ${Math.min(so2/40*100, 100)}%"></div>
                                                    </div>
                                                </li>
                                                <li class="mb-2">
                                                    <div class="d-flex justify-content-between">
                                                        <span>NO2</span>
                                                        <span class="fw-bold stat-number">${no2.toFixed(2)}</span>
                                                    </div>
                                                    <div class="progress" style="height: 6px;">
                                                        <div class="progress-bar bg-${getAqiColor(no2, 40)}" style="width: ${Math.min(no2/40*100, 100)}%"></div>
                                                    </div>
                                                </li>
                                                <li>
                                                    <div class="d-flex justify-content-between">
                                                        <span>O3</span>
                                                        <span class="fw-bold stat-number">${o3.toFixed(2)}</span>
                                                    </div>
                                                    <div class="progress" style="height: 6px;">
                                                        <div class="progress-bar bg-${getAqiColor(o3, 60)}" style="width: ${Math.min(o3/60*100, 100)}%"></div>
                                                    </div>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Sunrise & Sunset -->
                            <div class="col-md-6" data-aos="zoom-in" data-aos-delay="200">
                                <div class="card bg-light h-100">
                                    <div class="card-body">
                                        <h3 class="h6 mb-3 d-flex align-items-center">
                                            <i class="bi bi-sun text-warning me-2"></i>
                                            Sunrise & Sunset
                                        </h3>
                                        <div class="d-flex justify-content-between">
                                            <div class="text-center p-3 rounded" style="background-color: rgba(255,193,7,0.1);">
                                                <i class="bi bi-sunrise text-warning h4"></i>
                                                <p class="mb-0 fw-bold">${getTime(sunriseUnixUTC, timezone)}</p>
                                                <small class="text-muted">Sunrise</small>
                                            </div>
                                            <div class="text-center p-3 rounded" style="background-color: rgba(220,53,69,0.1);">
                                                <i class="bi bi-sunset text-danger h4"></i>
                                                <p class="mb-0 fw-bold">${getTime(sunsetUnixUTC, timezone)}</p>
                                                <small class="text-muted">Sunset</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Additional Highlights -->
                            <div class="col-md-6 col-lg-3" data-aos="zoom-in" data-aos-delay="300">
                                <div class="card bg-light h-100">
                                    <div class="card-body">
                                        <h3 class="h6 mb-3 d-flex align-items-center">
                                            <i class="bi bi-moisture text-info me-2"></i>
                                            Humidity
                                        </h3>
                                        <div class="d-flex align-items-center gap-3">
                                            <div class="progress-circle" data-value="${humidity}">
                                                <div class="progress-circle-inner display-5 stat-number">${humidity}%</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="col-md-6 col-lg-3" data-aos="zoom-in" data-aos-delay="400">
                                <div class="card bg-light h-100">
                                    <div class="card-body">
                                        <h3 class="h6 mb-3 d-flex align-items-center">
                                            <i class="bi bi-speedometer2 text-success me-2"></i>
                                            Pressure
                                        </h3>
                                        <div class="d-flex align-items-center gap-3">
                                            <span class="h4 mb-0 stat-number">${pressure}</span>
                                            <small class="text-muted">hPa</small>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="col-md-6 col-lg-3" data-aos="zoom-in" data-aos-delay="500">
                                <div class="card bg-light h-100">
                                    <div class="card-body">
                                        <h3 class="h6 mb-3 d-flex align-items-center">
                                            <i class="bi bi-eye text-primary me-2"></i>
                                            Visibility
                                        </h3>
                                        <div class="d-flex align-items-center gap-3">
                                            <span class="h4 mb-0 stat-number">${(visibility / 1000).toFixed(1)}</span>
                                            <small class="text-muted">km</small>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="col-md-6 col-lg-3" data-aos="zoom-in" data-aos-delay="600">
                                <div class="card bg-light h-100">
                                    <div class="card-body">
                                        <h3 class="h6 mb-3 d-flex align-items-center">
                                            <i class="bi bi-thermometer-half text-danger me-2"></i>
                                            Feels Like
                                        </h3>
                                        <div class="d-flex align-items-center gap-3">
                                            <span class="h4 mb-0 stat-number">${formatTemp(feels_like)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Initialize tooltips after content is loaded
            initTooltips();
        });

        fetchData(url.forecast(latitude, longitude), function (forecast) {
            const {
                list: forecastList,
                city: { timezone }
            } = forecast;

            hourlySection.innerHTML = `
                <div class="card" data-aos="fade-up">
                    <div class="card-body">
                        <h2 class="card-title h5">Hourly Forecast</h2>
                        <div class="hourly-container mt-3">
                            <div class="row g-3" data-temp></div>
                        </div>
                        
                        <h3 class="h6 mt-4">Wind Speed</h3>
                        <div class="hourly-container">
                            <div class="row g-3" data-wind></div>
                        </div>
                    </div>
                </div>
            `;

            for (const [index, data] of forecastList.entries()) {
                if (index > 7) break;

                const {
                    dt: dataTimeUnix,
                    main: { temp },
                    weather,
                    wind: { deg: windDirection, speed: windSpeed }
                } = data;
                const [{ icon, description }] = weather;

                const tempRow = hourlySection.querySelector('[data-temp]');
                const windRow = hourlySection.querySelector('[data-wind]');

                tempRow.innerHTML += `
                    <div class="col-4 col-md-3 col-lg-2">
                        <div class="card bg-light text-center h-100">
                            <div class="card-body p-2">
                                <p class="mb-2 fw-bold">${getHours(dataTimeUnix, timezone)}</p>
                                <img src="assets/images/weather_icons/${icon}.png" width="48" height="48"
                                    loading="lazy" alt="${description}" class="weather-icon-sm mb-2">
                                <p class="mb-0">${formatTemp(temp)}</p>
                            </div>
                        </div>
                    </div>
                `;

                windRow.innerHTML += `
                    <div class="col-4 col-md-3 col-lg-2">
                        <div class="card bg-light text-center h-100">
                            <div class="card-body p-2">
                                <p class="mb-2 fw-bold">${getHours(dataTimeUnix, timezone)}</p>
                                <img src="assets/images/weather_icons/direction.png" width="48" height="48"
                                    loading="lazy" alt="wind direction" class="weather-icon-sm mb-2"
                                    style="transform: rotate(${windDirection - 180}deg)">
                                <p class="mb-0">${formatWindSpeed(windSpeed)}</p>
                            </div>
                        </div>
                    </div>
                `;
            }

            forecastSection.innerHTML = `
                <div class="card" data-aos="fade-left">
                    <div class="card-body">
                        <h2 class="card-title h5">5 Days Forecast</h2>
                        <ul class="list-group list-group-flush" data-forecast-list></ul>
                    </div>
                </div>
            `;

            for (let i = 7; i < forecastList.length; i += 8) {
                const {
                    main: { temp_max, temp_min },
                    weather,
                    dt_txt
                } = forecastList[i];
                const [{ icon, description }] = weather;
                const date = new Date(dt_txt);

                const forecastLi = forecastSection.querySelector('[data-forecast-list]');
                forecastLi.innerHTML += `
                    <li class="list-group-item">
                        <div class="d-flex justify-content-between align-items-center">
                            <div class="d-flex align-items-center gap-3">
                                <img src="assets/images/weather_icons/${icon}.png" width="36" height="36"
                                    alt="${description}" class="weather-icon-sm" title="${description}">
                                <div>
                                    <p class="mb-0 fw-bold">${date.getDate()} ${monthNames[date.getMonth()]}</p>
                                    <small class="text-muted">${weekDayNames[date.getUTCDay()]}</small>
                                </div>
                            </div>
                            <div class="text-end">
                                <span class="h6 mb-0">${formatTemp(temp_max)}</span>
                                <br>
                                <small class="text-muted">${formatTemp(temp_min)}</small>
                            </div>
                        </div>
                    </li>
                `;
            }
            
            // If this was from a refresh action, add pulse animation
            if (isRefresh) {
                const cards = document.querySelectorAll('.card');
                cards.forEach(card => {
                    card.classList.add('pulse-animation');
                    setTimeout(() => card.classList.remove('pulse-animation'), 2000);
                });
                
                // Show toast
                showToast("Weather information updated successfully");
            }
            
            // Update the last updated time
            updateLastUpdatedTime();
            
            // Initialize AOS
            AOS.refresh();
            
            // Initialize tooltips
            initTooltips();
        });

        loading.style.display = 'none';
        container.style.overflowY = 'auto';
        container.classList.add("fade-in");
    });
}

const error404 = () => {
    errorContent.classList.remove('d-none');
    loading.style.display = 'none';
}

AOS.init({
    duration: 800,
    once: true
});

const darkModeToggle = document.getElementById('darkModeToggle');
const html = document.documentElement;
const darkModeIcon = darkModeToggle.querySelector('i');

const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
    html.setAttribute('data-bs-theme', savedTheme);
    updateDarkModeIcon(savedTheme === 'dark');
}

darkModeToggle.addEventListener('click', () => {
    const currentTheme = html.getAttribute('data-bs-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    html.setAttribute('data-bs-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateDarkModeIcon(newTheme === 'dark');
});

function updateDarkModeIcon(isDark) {
    darkModeIcon.className = isDark
        ? 'bi bi-sun-fill'
        : 'bi bi-moon-stars-fill';
}

const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));

// Helper to determine AQI color based on value and threshold
function getAqiColor(value, threshold) {
    const percent = (value / threshold) * 100;
    if (percent <= 50) return 'success';
    if (percent <= 75) return 'warning';
    return 'danger';
}

// Initialize tooltips
function initTooltips() {
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
}

// Add animation class for refresh button
document.addEventListener('DOMContentLoaded', () => {
    const style = document.createElement('style');
    style.textContent = `
        .rotating {
            animation: rotating 2s linear infinite;
        }
        @keyframes rotating {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
});

// Event listener for form submission in search modal
window.addEventListener('load', () => {
    // ...existing code...
    
    // Add form submission handler for search
    const searchForm = document.getElementById('search-form');
    if (searchForm) {
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            if (searchField.value.trim()) {
                updateWeatherByCity(searchField.value.trim());
                closeSearchModal();
                searchField.value = '';
                searchResult.innerHTML = '';
            }
        });
    }
});