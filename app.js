'use strict';

const api_key = null; //api-key-here;

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

const url = {
    currentWeather(lat, lon) {
        return `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric`;
    },
    forecast(lat, lon) {
        return `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric`;
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

const mps_to_kmh = mps => (mps * 3.6).toFixed(1);

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
        console.error('Geolocation is not supported by this browser.');
        window.location.hash = defaultLocation;
        return;
    }

    window.navigator.geolocation.getCurrentPosition(
        res => {
            const { latitude, longitude } = res.coords;
            console.log(`Latitude: ${latitude}, Longitude: ${longitude}`);
            updateWeather(`lat=${latitude}`, `lon=${longitude}`);
        },
        err => {
            console.error('Error obtaining location:', err);
            window.location.hash = defaultLocation;
        }
    );
}

const searchedLocation = query => {
    updateWeather(...query.split('&'));
    searchResult.innerHTML = '';
};

const routes = new Map([
    ["/current-location", currentLocation],
    ["/weather", searchedLocation]
]);

const checkHash = function () {
    const requestURL = window.location.hash.slice(1);
    const [route, query] = requestURL.includes('?') ? requestURL.split('?') : [requestURL];
    routes.get(route) ? routes.get(route)(query) : error404();
}

window.addEventListener("hashchange", checkHash);
window.addEventListener("load", () => {
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



searchField?.addEventListener('input', function () {
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }

    if (!searchField.value) {
        searchResult.innerHTML = '';
        return;
    }

    searchTimeout = setTimeout(() => {
        fetchData(url.geo(searchField.value), function (locations) {
            searchResult.innerHTML = `
                <ul class="list-group" data-search-list></ul>
            `;

            const searchList = searchResult.querySelector("[data-search-list]");
            
            for (const { name, lat, lon, country, state } of locations) {
                const item = document.createElement("li");
                item.classList.add("list-group-item", "d-flex", "align-items-center", "gap-2");
                item.innerHTML = `
                    <i class="bi bi-geo-alt"></i>
                    <div>
                        <p class="mb-0 fw-bold">${name}</p>
                        <small class="text-muted">${state || ""} ${country}</small>
                    </div>
                    <a href="#/weather?lat=${lat}&lon=${lon}" class="stretched-link"></a>
                `;
                
                item.addEventListener('click', () => {
                    searchField.value = '';
                    searchResult.innerHTML = '';
                    updateWeather(`lat=${lat}`, `lon=${lon}`);
                });

                searchList.appendChild(item);
            }
        });
    }, searchTimeoutDuration);
});

searchResult.addEventListener('click', function (event) {
    if (event.target.closest('.list-group-item')) {
        searchResult.innerHTML = '';
    }
});

const container = document.querySelector("[data-container]");
const loading = document.querySelector("[data-loading]");
const currentLocationBtn = document.querySelector("[data-current-location-btn]");
const errorContent = document.querySelector("[data-error-content]");

const updateWeather = function (lat, lon) {
    const [latQuery, lonQuery] = [lat, lon];
    const latitude = latQuery.split('=')[1];
    const longitude = lonQuery.split('=')[1];

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
            timezone
        } = currentWeather;
        const [{ description, icon }] = weather;

        currentWeatherSection.innerHTML = `
            <div class="card h-100" data-aos="fade-right">
                <div class="card-body">
                    <h2 class="card-title h5">Now</h2>
                    <div class="text-center my-4">
                        <h3 class="display-1">${parseInt(temp)}&deg;C</h3>
                        <img src="assets/images/weather_icons/${icon}.png" alt="${description}" width="64" height="64" class="weather-icon">
                        <p class="lead">${description}</p>
                    </div>
                    <ul class="list-group list-group-flush">
                        <li class="list-group-item d-flex justify-content-between align-items-center">
                            <span><i class="bi bi-calendar"></i> Date</span>
                            <span>${getDate(dateUnix, timezone)}</span>
                        </li>
                        <li class="list-group-item d-flex justify-content-between align-items-center">
                            <span><i class="bi bi-geo-alt"></i> Location</span>
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
                        <h2 class="card-title h5">Today's Highlights</h2>
                        <div class="row g-3 mt-2">
                            <!-- Air Quality -->
                            <div class="col-md-6" data-aos="zoom-in" data-aos-delay="100">
                                <div class="card bg-light">
                                    <div class="card-body">
                                        <h3 class="h6 mb-3">Air Quality Index</h3>
                                        <div class="wrapper">
                                            <span class="bi bi-wind"></span>
                                            <ul class="list-unstyled">
                                                <li class="mb-2">
                                                    <div class="d-flex justify-content-between">
                                                        <span>PM2.5</span>
                                                        <span class="fw-bold">${pm2_5.toFixed(2)}</span>
                                                    </div>
                                                </li>
                                                <li class="mb-2">
                                                    <div class="d-flex justify-content-between">
                                                        <span>SO2</span>
                                                        <span class="fw-bold">${so2.toFixed(2)}</span>
                                                    </div>
                                                </li>
                                                <li class="mb-2">
                                                    <div class="d-flex justify-content-between">
                                                        <span>NO2</span>
                                                        <span class="fw-bold">${no2.toFixed(2)}</span>
                                                    </div>
                                                </li>
                                                <li>
                                                    <div class="d-flex justify-content-between">
                                                        <span>O3</span>
                                                        <span class="fw-bold">${o3.toFixed(2)}</span>
                                                    </div>
                                                </li>
                                            </ul>
                                        </div>
                                        <span class="badge bg-${aqi <= 2 ? 'success' : aqi <= 3 ? 'warning' : 'danger'}" 
                                              title="${aqiData.message}">${aqiData.level}</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Sunrise & Sunset -->
                            <div class="col-md-6" data-aos="zoom-in" data-aos-delay="200">
                                <div class="card bg-light">
                                    <div class="card-body">
                                        <h3 class="h6 mb-3">Sunrise & Sunset</h3>
                                        <div class="d-flex justify-content-between">
                                            <div class="text-center">
                                                <i class="bi bi-sunrise text-warning h4"></i>
                                                <p class="mb-0">${getTime(sunriseUnixUTC, timezone)}</p>
                                                <small class="text-muted">Sunrise</small>
                                            </div>
                                            <div class="text-center">
                                                <i class="bi bi-sunset text-danger h4"></i>
                                                <p class="mb-0">${getTime(sunsetUnixUTC, timezone)}</p>
                                                <small class="text-muted">Sunset</small>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Additional Highlights -->
                            <div class="col-md-6" data-aos="zoom-in" data-aos-delay="300">
                                <div class="card bg-light">
                                    <div class="card-body">
                                        <h3 class="h6 mb-3">Humidity</h3>
                                        <div class="d-flex align-items-center gap-3">
                                            <i class="bi bi-moisture h4 mb-0"></i>
                                            <span class="h4 mb-0">${humidity}%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="col-md-6" data-aos="zoom-in" data-aos-delay="400">
                                <div class="card bg-light">
                                    <div class="card-body">
                                        <h3 class="h6 mb-3">Pressure</h3>
                                        <div class="d-flex align-items-center gap-3">
                                            <i class="bi bi-speedometer2 h4 mb-0"></i>
                                            <span class="h4 mb-0">${pressure} hPa</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="col-md-6" data-aos="zoom-in" data-aos-delay="500">
                                <div class="card bg-light">
                                    <div class="card-body">
                                        <h3 class="h6 mb-3">Visibility</h3>
                                        <div class="d-flex align-items-center gap-3">
                                            <i class="bi bi-eye h4 mb-0"></i>
                                            <span class="h4 mb-0">${(visibility / 1000).toFixed(1)} km</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="col-md-6" data-aos="zoom-in" data-aos-delay="600">
                                <div class="card bg-light">
                                    <div class="card-body">
                                        <h3 class="h6 mb-3">Feels Like</h3>
                                        <div class="d-flex align-items-center gap-3">
                                            <i class="bi bi-thermometer-half h4 mb-0"></i>
                                            <span class="h4 mb-0">${parseInt(feels_like)}&deg;C</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        });

        fetchData(url.forecast(latitude, longitude), function (forecast) {
            const {
                list: forecastList,
                city: { timezone }
            } = forecast;

            hourlySection.innerHTML = `
                <div class="card" data-aos="fade-up">
                    <div class="card-body">
                        <h2 class="card-title h5">Today at</h2>
                        <div class="row g-3 mt-2" data-temp></div>
                        <h3 class="h6 mt-4">Wind Speed</h3>
                        <div class="row g-3" data-wind></div>
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
                    <div class="col-md-2 col-4">
                        <div class="card bg-light text-center">
                            <div class="card-body">
                                <p class="mb-2">${getHours(dataTimeUnix, timezone)}</p>
                                <img src="assets/images/weather_icons/${icon}.png" width="48" height="48"
                                    loading="lazy" alt="${description}" class="weather-icon-sm mb-2">
                                <p class="mb-0">${parseInt(temp)}&deg;C</p>
                            </div>
                        </div>
                    </div>
                `;

                windRow.innerHTML += `
                    <div class="col-md-2 col-4">
                        <div class="card bg-light text-center">
                            <div class="card-body">
                                <p class="mb-2">${getHours(dataTimeUnix, timezone)}</p>
                                <img src="assets/images/weather_icons/direction.png" width="48" height="48"
                                    loading="lazy" alt="wind direction" class="weather-icon-sm mb-2"
                                    style="transform: rotate(${windDirection - 180}deg)">
                                <p class="mb-0">${mps_to_kmh(windSpeed)} km/h</p>
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
                    main: { temp_max },
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
                                    <p class="mb-0">${date.getDate()} ${monthNames[date.getMonth()]}</p>
                                    <small class="text-muted">${weekDayNames[date.getUTCDay()]}</small>
                                </div>
                            </div>
                            <div class="text-end">
                                <span class="h6 mb-0">${parseInt(temp_max)}&deg;C</span>
                            </div>
                        </div>
                    </li>
                `;
            }
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