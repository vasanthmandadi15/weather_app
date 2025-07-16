from flask import Flask, render_template, request, jsonify
import requests
from datetime import datetime

app = Flask(__name__)

API_KEY = "e6d49363c3f6c956c62ce099ed2624c3"

def get_weather(city, units="metric"):
    url = f"https://api.openweathermap.org/data/2.5/forecast?q={city}&appid={API_KEY}&units={units}"
    data = requests.get(url).json()

    if data["cod"] != "200":
        return None

    current = data["list"][0]
    weather_main = current["weather"][0]["main"].lower()

    background_image = {
        "clear": "clear.jpg",
        "clouds": "cloudy.jpg",
        "rain": "rain.jpg",
        "thunderstorm": "thunder.jpg",
        "snow": "snow.jpg"
    }.get(weather_main, "clear.jpg")

    weather = {
        "city": data["city"]["name"],
        "country": data["city"]["country"],
        "temperature": round(current["main"]["temp"]),
        "description": current["weather"][0]["description"].title(),
        "humidity": current["main"]["humidity"],
        "wind": current["wind"]["speed"],
        "pressure": current["main"]["pressure"],
        "visibility": current.get("visibility", 10000) / 1000,
        "datetime": datetime.utcfromtimestamp(current["dt"]).strftime("%A, %d %B | %I:%M %p"),
        "sunrise": datetime.utcfromtimestamp(data["city"]["sunrise"]).strftime("%H:%M"),
        "sunset": datetime.utcfromtimestamp(data["city"]["sunset"]).strftime("%H:%M"),
        "unit": "°C" if units == "metric" else "°F",
        "uv_index": get_uv_index(data["city"]["coord"]["lat"], data["city"]["coord"]["lon"]),
        "lat": data["city"]["coord"]["lat"],
        "lon": data["city"]["coord"]["lon"],
        "bg_image": background_image
    }

    hourly = []
    for entry in data["list"][:8]:
        hourly.append({
            "time": datetime.utcfromtimestamp(entry["dt"]).strftime("%I %p"),
            "temp": round(entry["main"]["temp"]),
            "feels_like": round(entry["main"]["feels_like"]),
            "precip": int(entry.get("pop", 0) * 100)
        })

    daily = []
    for i in range(0, len(data["list"]), 8):
        item = data["list"][i]
        daily.append({
            "day": datetime.utcfromtimestamp(item["dt"]).strftime("%a"),
            "temp_min": round(item["main"]["temp_min"]),
            "temp_max": round(item["main"]["temp_max"]),
            "icon": item["weather"][0]["icon"]
        })

    aqi_url = f"http://api.openweathermap.org/data/2.5/air_pollution?lat={weather['lat']}&lon={weather['lon']}&appid={API_KEY}"
    aqi_data = requests.get(aqi_url).json()

    aqi = aqi_data["list"][0]["main"]["aqi"]
    components = aqi_data["list"][0]["components"]

    return {
        "weather": weather,
        "hourly": hourly,
        "daily": daily,
        "aqi": {
            "index": aqi,
            "pm2_5": round(components["pm2_5"], 2),
            "pm10": round(components["pm10"], 2),
            "o3": round(components["o3"], 2)
        }
    }

def get_uv_index(lat, lon):
    uv_url = f"https://api.openweathermap.org/data/2.5/uvi?appid={API_KEY}&lat={lat}&lon={lon}"
    try:
        uv_data = requests.get(uv_url).json()
        return round(uv_data.get("value", 0), 1)
    except:
        return 0

@app.route("/", methods=["GET", "POST"])
def index():
    city = "New York"
    units = request.form.get("units", "metric")

    if request.method == "POST":
        city = request.form.get("city", "New York")

    data = get_weather(city, units)
    if not data:
        return render_template("index.html", error="City not found", weather={}, hourly=[], daily=[], aqi={}, selected_unit=units)

    return render_template("index.html", **data, selected_unit=units)

if __name__ == "__main__":
    app.run(debug=True)
