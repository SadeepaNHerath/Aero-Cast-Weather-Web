// Weather Data
const searchButton = document.getElementById('search-button');
const cityInput = document.getElementById('city');
const historyList = document.getElementById('history');
const rainSound = document.getElementById('rain-sound');
const clearSound = document.getElementById('clear-sound');
const cloudySound = document.getElementById('cloudy-sound');
const defaultSound = document.getElementById('default-sound');
let map;
let weatherHistory = [];

function initMap(lat, lon) {
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

function renderWeatherHistory() {
    historyList.innerHTML = '';

    weatherHistory.forEach((weather) => {
        const listItem = document.createElement('li');
        listItem.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-center');
        listItem.innerHTML = `
            <div>
                <strong>${weather.city}</strong> - 
                Temp: ${weather.temperature}°C, 
                Humidity: ${weather.humidity}%, 
                Wind Speed: ${weather.windSpeed} km/h, 
                Description: ${weather.description}
            </div>
            <button class="btn btn-sm btn-danger">Remove</button>
        `;

        listItem.querySelector('button').onclick = () => {
            weatherHistory = weatherHistory.filter(w => w !== weather);
            renderWeatherHistory();
        };

        historyList.prepend(listItem);
    });
}

async function getWeatherData(city) {
    try {
        const apiKey = '6fe5bb1e207d43ce12572ec5b97ed8a2';
        const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`);

        if (!response.ok) {
            throw new Error('City not found');
        }

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

        initMap(data.coord.lat, data.coord.lon);
        playSound(data.weather[0].main);

        weatherHistory.push(weatherData);
        renderWeatherHistory();

    } catch (error) {
        alert('City not found. Please try again.');
        console.error(error);
    }
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

// Date Time
document.addEventListener('DOMContentLoaded', () => {
    const dateTime = document.getElementById('dateTime');
    setInterval(() => {
        const d = new Date();
        dateTime.innerHTML = d.toLocaleTimeString() + '<br> ' + d.toLocaleDateString();
    }, 1000);

    getWeatherData("colombo");


    // Dark mode & Light mode
    const modeSwitch = document.getElementById('mode-switch');
    const lightIcon = document.getElementById('light-mode');
    const darkIcon = document.getElementById('dark-mode');
    const weatherDetails = document.getElementById('weather-details');
    const cityInput = document.getElementById('city');
    const historyList = document.getElementById('history');
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
            historyList.classList.add('bg-dark', 'text-light');
            historyList.classList.remove('bg-light', 'text-dark');

            cityInput.placeholder = 'Enter city name';
            cityInput.style.color = 'lightgray'; // Placeholder color

            document.querySelectorAll('.icon').forEach(icon => {
                icon.src = 'path/to/dark-mode/icon.png'; // Use appropriate icon paths
            });
        } else {
            document.body.classList.add('bg-light', 'text-dark');
            document.body.classList.remove('bg-dark', 'text-light');
            document.querySelectorAll('.icon').forEach(icon => icon.classList.add('text-dark'));
            document.querySelectorAll('.icon').forEach(icon => icon.classList.add('text-light'));
            lightIcon.style.display = 'none';
            darkIcon.style.display = 'block';

            weatherCard.classList.add('bg-light', 'text-dark');
            weatherCard.classList.remove('bg-dark', 'text-light');
            weatherDetails.classList.add('bg-light', 'text-dark');
            weatherDetails.classList.remove('bg-dark', 'text-light');
            cityInput.classList.add('bg-light', 'text-dark');
            cityInput.classList.remove('bg-dark', 'text-light');
            historyList.classList.add('bg-light', 'text-dark');
            historyList.classList.remove('bg-dark', 'text-light');

            cityInput.placeholder = 'Enter city name';
            cityInput.style.color = 'gray'; // Placeholder color

            document.querySelectorAll('.icon').forEach(icon => {
                icon.src = 'path/to/light-mode/icon.png'; // Use appropriate icon paths
            });
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