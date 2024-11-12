const searchButton = document.getElementById('search-button');
const cityInput = document.getElementById('city');
const rainSound = document.getElementById('rain-sound');
const clearSound = document.getElementById('clear-sound');
const cloudySound = document.getElementById('cloudy-sound');
const defaultSound = document.getElementById('default-sound');
const dateTimeElement = document.getElementById('dateTime');
const modeSwitch = document.getElementById('mode-switch');
const lightIcon = document.getElementById('light-mode');
const darkIcon = document.getElementById('dark-mode');

let map;

AOS.init({
    duration: 1000,
    once: true
});

function initMap(lat, lon) {
    if (!lat || !lon || isNaN(lat) || isNaN(lon)) return;
    const location = { lat, lng: lon };
    if (!map) {
        map = new google.maps.Map(document.getElementById('map'), {
            center: location,
            zoom: 10,
            styles: document.body.classList.contains('dark-mode') ? darkMapStyle : []
        });
    } else {
        map.setCenter(location);
    }
    new google.maps.Marker({ position: location, map });
}

function playSound(condition) {
    [rainSound, clearSound, cloudySound, defaultSound].forEach(sound => {
        sound.pause();
        sound.currentTime = 0;
    });

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
        updateWeatherUI(data);
        initMap(lat, lon);
        playSound(data.weather[0].main);

        const day5Api = await fetch(`https://api.weatherapi.com/v1/forecast.json?key=d84dfe92dbbc45e9a75210312243009&q=${data.name}&days=5&aqi=no&alerts=no`);
        const day5Data = await day5Api.json();
        forecastUpdate(day5Data);
    } catch (error) {
        showError('Could not fetch weather data. Please try again.');
    }
}

async function getWeatherData(city) {
    try {
        const apiKey = '6fe5bb1e207d43ce12572ec5b97ed8a2';
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`);
        if (!response.ok) throw new Error('City not found');
        
        const data = await response.json();
        updateWeatherUI(data);
        initMap(data.coord.lat, data.coord.lon);
        playSound(data.weather[0].main);

        const day5Api = await fetch(`https://api.weatherapi.com/v1/forecast.json?key=d84dfe92dbbc45e9a75210312243009&q=${city}&days=5&aqi=no&alerts=no`);
        const day5Data = await day5Api.json();
        forecastUpdate(day5Data);
    } catch (error) {
        showError('City not found. Please try again.');
    }
}

function updateWeatherUI(data) {
    document.querySelector('.city').textContent = data.name;
    document.querySelector('.temperature').textContent = `${data.main.temp.toFixed(1)}°C`;
    document.querySelector('.description').textContent = data.weather[0].description;
    document.querySelector('.humidity').textContent = `${data.main.humidity}%`;
    document.querySelector('.wind-speed').textContent = `${(data.wind.speed * 3.6).toFixed(1)} km/h`;
    document.querySelector('.icon').src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
}

function forecastUpdate(forecastData) {
    const forecastCards = document.getElementById('forecast-cards');
    forecastCards.innerHTML = '';

    forecastData.forecast.forecastday.forEach((day, index) => {
        const { date, day: { maxtemp_c, mintemp_c, condition: { icon, text } } } = day;
        const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });

        const card = document.createElement('div');
        card.className = 'col forecast-card';
        card.setAttribute('data-aos', 'fade-up');
        card.setAttribute('data-aos-delay', `${index * 100}`);
        
        card.innerHTML = `
            <div class="forecast-item text-center">
                <p class="day-of-week">${dayOfWeek}</p>
                <div class="icon-container">
                    <img src="${icon}" alt="Weather Icon" class="weather-icon">
                </div>
                <p class="temperature">${Math.round(maxtemp_c)}°C / ${Math.round(mintemp_c)}°C</p>
                <p class="weather-description">${text}</p>
            </div>
        `;
        
        forecastCards.appendChild(card);
    });
}

function showError(message) {
    alert(message);
}

function setTheme(themeName) {
    document.body.setAttribute('data-theme', themeName);
    localStorage.setItem('theme', themeName);
    
    if (themeName === 'dark') {
        lightIcon.style.display = 'block';
        darkIcon.style.display = 'none';
        if (map) {
            map.setOptions({ styles: darkMapStyle });
        }
    } else {
        lightIcon.style.display = 'none';
        darkIcon.style.display = 'block';
        if (map) {
            map.setOptions({ styles: [] });
        }
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

const darkMapStyle = [
    { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
    {
        featureType: "administrative.locality",
        elementType: "labels.text.fill",
        stylers: [{ color: "#d59563" }],
    }
];

document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);

    setInterval(() => {
        const d = new Date();
        dateTimeElement.innerHTML = d.toLocaleTimeString() + '<br> ' + d.toLocaleDateString();
    }, 1000);

    getUserLocation();
});

modeSwitch.addEventListener('click', () => {
    const currentTheme = localStorage.getItem('theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
});

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