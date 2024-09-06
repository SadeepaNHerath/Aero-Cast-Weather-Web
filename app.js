const searchButton = document.getElementById('search-button');
        const cityInput = document.getElementById('city-input');
        const historyList = document.getElementById('history');
        const rainSound = document.getElementById('rain-sound');
        const clearSound = document.getElementById('clear-sound');
        const cloudySound = document.getElementById('cloudy-sound');
        const defaultSound = document.getElementById('default-sound');
        let map;

        function initMap(lat, lon) {
            const location = { lat: lat, lng: lon };
            if (!map) {
                map = new google.maps.Map(document.getElementById('map'), {
                    center: location,
                    zoom: 10
                });
            } else {
                map.setCenter(location);
            }
            new google.maps.Marker({
                position: location,
                map: map
            });
        }

        function playSound(condition) {
            rainSound.pause();
            clearSound.pause();
            cloudySound.pause();
            defaultSound.pause();

            switch(condition.toLowerCase()) {
                case 'rain':
                case 'drizzle':
                    rainSound.play();
                    break;
                case 'clear':
                    clearSound.play();
                    break;
                case 'cloudy':
                case 'overcast':
                    cloudySound.play();
                    break;
                default:
                    defaultSound.play();
            }
        }

        function addToHistory(city) {
            const listItem = document.createElement('li');
            listItem.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-center');
            listItem.textContent = city;
            const removeBtn = document.createElement('button');
            removeBtn.classList.add('btn', 'btn-sm', 'btn-danger');
            removeBtn.textContent = 'Remove';
            removeBtn.onclick = () => {
                historyList.removeChild(listItem);
            };
            listItem.appendChild(removeBtn);
            historyList.prepend(listItem);
        }

        async function fetchWeatherData(city) {
            try {
                const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid={API key}
}`);
                const data = await response.json();

                document.querySelector('.city').textContent = data.location.name;
                document.querySelector('.temperature').textContent = `${data.current.temp_c}°C`;
                document.querySelector('.description').textContent = data.current.condition.text;
                document.querySelector('.humidity').textContent = `${data.current.humidity}%`;
                document.querySelector('.wind-speed').textContent = `${data.current.wind_kph} km/h`;
                document.querySelector('.icon').src = `https:${data.current.condition.icon}`;

                const lat = data.location.lat;
                const lon = data.location.lon;
                initMap(lat, lon);

                playSound(data.current.condition.text);

                addToHistory(data.location.name);
            } catch (error) {
                alert('City not found. Please try again.');
                console.error(error);
            }
        }

        searchButton.addEventListener('click', () => {
            const city = cityInput.value.trim();
            if (city) {
                fetchWeatherData(city);
                cityInput.value = '';
            }
        });

        cityInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchButton.click();
            }
        });