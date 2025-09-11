document.addEventListener('DOMContentLoaded', () => {
    const weatherIcon = document.querySelector('.weather-icon');
    const temperature = document.querySelector('.temperature');
    const description = document.querySelector('.description');
    const location = document.querySelector('.location');

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            const weather = await getWeatherData(latitude, longitude);
            updateUI(weather);
        }, (error) => {
            console.error('Error getting location:', error);
            alert('Could not get your location. Please allow location access.');
        });
    } else {
        alert('Geolocation is not supported by your browser.');
    }

    async function getWeatherData(lat, lon) {
        const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
        try {
            const response = await fetch(apiUrl);
            const data = await response.json();
            return {
                temp: data.current_weather.temperature,
                desc: getWeatherDescription(data.current_weather.weathercode),
                loc: 'Your Location'
            };
        } catch (error) {
            console.error('Error fetching weather data:', error);
            alert('Could not fetch weather data.');
        }
    }

    function getWeatherDescription(code) {
        // Basic weather code descriptions
        const descriptions = {
            0: 'Clear sky',
            1: 'Mainly clear',
            2: 'Partly cloudy',
            3: 'Overcast',
            45: 'Fog',
            48: 'Depositing rime fog',
            51: 'Light drizzle',
            53: 'Moderate drizzle',
            55: 'Dense drizzle',
            56: 'Light freezing drizzle',
            57: 'Dense freezing drizzle',
            61: 'Slight rain',
            63: 'Moderate rain',
            65: 'Heavy rain',
            80: 'Slight rain showers',
            81: 'Moderate rain showers',
            82: 'Violent rain showers',
            95: 'Slight or moderate thunderstorm',
        };
        return descriptions[code] || 'Unknown';
    }

    function updateUI(weather) {
        temperature.textContent = `${weather.temp}°C`;
        description.textContent = weather.desc;
        location.textContent = weather.loc;
        weatherIcon.innerHTML = getWeatherIcon(weather.desc);
    }

    function getWeatherIcon(desc) {
        const lowerDesc = desc.toLowerCase();
        if (lowerDesc.includes('clear')) return '<i class="fas fa-sun"></i>';
        if (lowerDesc.includes('cloud')) return '<i class="fas fa-cloud"></i>';
        if (lowerDesc.includes('rain')) return '<i class="fas fa-cloud-showers-heavy"></i>';
        if (lowerDesc.includes('drizzle')) return '<i class="fas fa-cloud-rain"></i>';
        if (lowerDesc.includes('fog')) return '<i class="fas fa-smog"></i>';
        if (lowerDesc.includes('thunderstorm')) return '<i class="fas fa-bolt"></i>';
        return '<i class="fas fa-question"></i>';
    }
});