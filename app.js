const searchButton = document.getElementById('search-button');
const cityInput = document.getElementById('city');
const rainSound = document.getElementById('rain-sound');
const clearSound = document.getElementById('clear-sound');
const cloudySound = document.getElementById('cloudy-sound');
const defaultSound = document.getElementById('default-sound');
let map;

function initMap(lat, lon) {
    if (!lat || !lon || isNaN(lat) || isNaN(lon)) return;
    const location = { lat, lng: lon };
    if (!map) {
        map = new google.maps.Map(document.getElementById('map'), {
            center: location,
            zoom: 10
        });
    } else {
        map.setCenter(location);
    }
    new google.maps.Marker({ position: location, map });
}

function playSound(condition) {
    rainSound.pause();
    clearSound.pause();
    cloudySound.pause();
    defaultSound.pause();
    const soundMap = {
        rain: rainSound,
        drizzle: rainSound,
        clear: clearSound,
        clouds: cloudySound,
        overcast: cloudySound
    };
    (soundMap[condition.toLowerCase()] || defaultSound).play();
}

async function getWeatherDataByLocation(lat, lon) {
    try {
        const apiKey = '6fe5bb1e207d43ce12572ec5b97ed8a2';
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`);
        if (!response.ok) throw new Error('Weather data not available');

        const data = await response.json();
        const weatherData = {
            city: data.name,
            temperature: data.main.temp.toFixed(1),
            humidity: data.main.humidity,
            windSpeed: (data.wind.speed * 3.6).toFixed(1),
            description: data.weather[0].description
        };

        document.querySelector('.city').textContent = weatherData.city;
        document.querySelector('.temperature').textContent = `${weatherData.temperature}°C`;
        document.querySelector('.description').textContent = weatherData.description;
        document.querySelector('.humidity').textContent = `${weatherData.humidity}%`;
        document.querySelector('.wind-speed').textContent = `${weatherData.windSpeed} km/h`;
        document.querySelector('.icon').src = `http://openweathermap.org/img/wn/${data.weather[0].icon}.png`;

        initMap(lat, lon);

        const day5Api = await fetch(`https://api.weatherapi.com/v1/forecast.json?key=d84dfe92dbbc45e9a75210312243009&q=${data.name}&days=5&aqi=no&alerts=no`);
        const day5Data = await day5Api.json();

        forecastUpdate(day5Data);
    } catch (error) {
        alert('Could not fetch weather data. Please try again.');
    }
}

async function getWeatherData(city) {
    try {
        const apiKey = '6fe5bb1e207d43ce12572ec5b97ed8a2';
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`);
        if (!response.ok) throw new Error('City not found');
        const data = await response.json();
        const weatherData = {
            city: data.name,
            temperature: data.main.temp.toFixed(1),
            humidity: data.main.humidity,
            windSpeed: (data.wind.speed * 3.6).toFixed(1),
            description: data.weather[0].description
        };
        document.querySelector('.city').textContent = weatherData.city;
        document.querySelector('.temperature').textContent = `${weatherData.temperature}°C`;
        document.querySelector('.description').textContent = weatherData.description;
        document.querySelector('.humidity').textContent = `${weatherData.humidity}%`;
        document.querySelector('.wind-speed').textContent = `${weatherData.windSpeed} km/h`;
        initMap(data.coord.lat, data.coord.lon);
        playSound(data.weather[0].main);
    } catch (error) {
        alert('City not found. Please try again.');
    }
}

function getUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                getWeatherDataByLocation(lat, lon);
            },
            () => {
                getWeatherData("Colombo");
            }
        );
    } else {
        getWeatherData("Colombo");
    }
}

function forecastUpdate(forecastData) {
    const forecastCards = document.getElementById('forecast-cards');
    forecastCards.innerHTML = '';

    forecastData.forecast.forecastday.forEach((day) => {
        const { date, day: { maxtemp_c, mintemp_c, condition: { icon, text } } } = day;
        const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });

        forecastCards.innerHTML += `
           <div class="card forecast-card">
                <div class="forecast-item text-center">
                    <p class="day-of-week">${dayOfWeek}</p>
                    <div class="icon-container">
                        <img src="${icon}" alt="Weather Icon" class="weather-icon">
                    </div>
                    <p class="temperature">${Math.round(maxtemp_c)}°C / ${Math.round(mintemp_c)}°C</p>
                    <p class="weather-description">${text}</p>
                </div>
            </div>
        `;
    });
}

searchButton.addEventListener('click', () => {
    const city = cityInput.value.trim();
    if (city) {
        getWeatherData(city);
        cityInput.value = '';
    }
});

cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchButton.click();
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const dateTime = document.getElementById('dateTime');
    setInterval(() => {
        const d = new Date();
        dateTime.innerHTML = d.toLocaleTimeString() + '<br> ' + d.toLocaleDateString();
    }, 1000);

    getUserLocation();

    const modeSwitch = document.getElementById('mode-switch');
    const lightIcon = document.getElementById('light-mode');
    const darkIcon = document.getElementById('dark-mode');
    const weatherDetails = document.getElementById('weather-details');
    const cityInput = document.getElementById('city');
    const weatherCard = document.getElementById('weather-card');

    function setTheme(themeName) {
        if (themeName === 'dark') {
            document.body.classList.add('bg-dark', 'text-light');
            document.body.classList.remove('bg-light', 'text-dark');
            document.querySelectorAll('.icon').forEach(icon => icon.classList.add('text-light'));
            document.querySelectorAll('.icon').forEach(icon => icon.classList.remove('text-dark'));
            lightIcon.style.display = 'block';
            darkIcon.style.display = 'none';
            weatherCard.classList.add('bg-dark', 'text-light');
            weatherCard.classList.remove('bg-light', 'text-dark');
            weatherDetails.classList.add('bg-dark', 'text-light');
            weatherDetails.classList.remove('bg-light', 'text-dark');
            cityInput.classList.add('bg-dark', 'text-light');
            cityInput.classList.remove('bg-light', 'text-dark');
            cityInput.placeholder = 'Enter city name';
            cityInput.style.color = 'lightgray';
        } else {
            document.body.classList.add('bg-light', 'text-dark');
            document.body.classList.remove('bg-dark', 'text-light');
            document.querySelectorAll('.icon').forEach(icon => icon.classList.add('text-dark'));
            document.querySelectorAll('.icon').forEach(icon => icon.classList.remove('text-light'));
            lightIcon.style.display = 'none';
            darkIcon.style.display = 'block';
            weatherCard.classList.add('bg-light', 'text-dark');
            weatherCard.classList.remove('bg-dark', 'text-light');
            weatherDetails.classList.add('bg-light', 'text-dark');
            weatherDetails.classList.remove('bg-dark', 'text-light');
            cityInput.classList.add('bg-light', 'text-dark');
            cityInput.classList.remove('bg-dark', 'text-light');
            cityInput.placeholder = 'Enter city name';
            cityInput.style.color = 'gray';
        }
    }

    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);

    modeSwitch.addEventListener('click', () => {
        const currentTheme = localStorage.getItem('theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    });
});
