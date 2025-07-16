<script>
window.onload = function () {
  const form = document.querySelector("form");
  const input = document.querySelector("input[name='city']");

  // Auto-detect current location and submit
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(async (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      const res = await fetch(`/location?lat=${lat}&lon=${lon}`);
      const data = await res.json();
      if (data.city) {
        input.value = data.city;
        form.submit();
      }
    });
  }

  // Leaflet Weather Maps
  const lat = document.body.getAttribute("data-lat");
  const lon = document.body.getAttribute("data-lon");
  const apiKey = document.body.getAttribute("data-api");
  if (lat && lon && apiKey) {
    function createWeatherMap(id, layer) {
      const map = L.map(id).setView([lat, lon], 5);
      L.tileLayer(
        `https://tile.openweathermap.org/map/${layer}/{z}/{x}/{y}.png?appid=${apiKey}`,
        { attribution: "OpenWeatherMap" }
      ).addTo(map);
    }

    createWeatherMap("humidity-map", "humidity_new");
    createWeatherMap("wind-map", "wind_new");
    createWeatherMap("pressure-map", "pressure_new");
  }

  // 🌡️ Hourly Temperature Chart
  const hourlyData = {{ hourly | tojson }};
  const tempCtx = document.getElementById('hourlyTempChart').getContext('2d');
  new Chart(tempCtx, {
    type: 'line',
    data: {
      labels: hourlyData.map(h => h.time),
      datasets: [
        {
          label: 'Temp',
          data: hourlyData.map(h => h.temp),
          borderColor: 'orange',
          tension: 0.4,
          fill: true
        },
        {
          label: 'Feels Like',
          data: hourlyData.map(h => h.feels_like),
          borderColor: 'lightblue',
          borderDash: [4, 4],
          tension: 0.4
        }
      ]
    },
    options: {
      scales: {
        y: { beginAtZero: false }
      }
    }
  });

  // 🔆 UV Index Chart
  const uv = {{ weather.uv_index }};
  const uvCtx = document.getElementById('uvIndexChart').getContext('2d');
  new Chart(uvCtx, {
    type: 'doughnut',
    data: {
      labels: ['UV Index'],
      datasets: [{
        data: [uv, 11 - uv],
        backgroundColor: ['#ffcc00', '#2c2c2c'],
        borderWidth: 0
      }]
    },
    options: {
      cutout: '70%',
      plugins: {
        tooltip: { enabled: false },
        legend: { display: false },
        title: {
          display: true,
          text: `UV ${uv}`,
          color: "#fff",
          font: { size: 18 }
        }
      }
    }
  });

  // 🌫 AQI Chart
  const aqiCtx = document.getElementById('aqiChart').getContext('2d');
  new Chart(aqiCtx, {
    type: 'bar',
    data: {
      labels: ['PM2.5', 'PM10', 'O3'],
      datasets: [{
        label: 'AQI Components',
        data: [{{ aqi.pm2_5 }}, {{ aqi.pm10 }}, {{ aqi.o3 }}],
        backgroundColor: ['#f44336', '#ff9800', '#4caf50']
      }]
    },
    options: {
      responsive: true,
      scales: {
        x: { ticks: { color: "#ccc" }},
        y: { beginAtZero: true, ticks: { color: "#ccc" }}
      },
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text: 'AQI Particulates',
          color: '#fff'
        }
      }
    }
  });

  // ⭐ Favorite Cities (localStorage)
  document.getElementById('add-favorite').onclick = () => {
    const city = document.querySelector("input[name='city']").value;
    let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    if (!favorites.includes(city)) {
      favorites.push(city);
      localStorage.setItem("favorites", JSON.stringify(favorites));
      renderFavorites();
    }
  };

  function renderFavorites() {
    const list = document.getElementById("favorites-list");
    list.innerHTML = "";
    let favorites = JSON.parse(localStorage.getItem("favorites")) || [];
    favorites.forEach(city => {
      const li = document.createElement("li");
      li.textContent = city;
      li.onclick = () => {
        document.querySelector("input[name='city']").value = city;
        document.querySelector("form").submit();
      };
      list.appendChild(li);
    });
  }

  renderFavorites();
};

// Modal Popup Handling
function openModal(id) {
  document.getElementById(id).style.display = "block";
}
function closeModal(id) {
  document.getElementById(id).style.display = "none";
}
</script>
