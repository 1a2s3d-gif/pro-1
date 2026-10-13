"use strict";

/* ===== عناصر الصفحة ===== */
const form = document.getElementById("search-form");
const input = document.getElementById("city-input");
const locateBtn = document.getElementById("locate-btn");
const recentList = document.getElementById("recent");
const picker = document.getElementById("picker");
const statusEl = document.getElementById("status");
const weatherEl = document.getElementById("weather");
const unitBtn = document.getElementById("unit-btn");

/* ===== الحالة ===== */
const state = {
  unit: load("unit", "c"),   // "c" أو "f"
  place: null,               // { name, meta, latitude, longitude }
  data: null,                // استجابة الطقس
};

/* ===== حالات الطقس (رموز WMO) ===== */
const WEATHER = {
  0:  { text: "صافٍ",                    icon: "☀️", theme: "clear" },
  1:  { text: "صافٍ غالباً",              icon: "🌤️", theme: "clear" },
  2:  { text: "غائم جزئياً",              icon: "⛅", theme: "cloudy" },
  3:  { text: "غائم",                    icon: "☁️", theme: "cloudy" },
  45: { text: "ضباب",                    icon: "🌫️", theme: "fog" },
  48: { text: "ضباب كثيف",               icon: "🌫️", theme: "fog" },
  51: { text: "رذاذ خفيف",               icon: "🌦️", theme: "rain" },
  53: { text: "رذاذ",                    icon: "🌦️", theme: "rain" },
  55: { text: "رذاذ كثيف",               icon: "🌧️", theme: "rain" },
  56: { text: "رذاذ متجمد",              icon: "🌧️", theme: "rain" },
  57: { text: "رذاذ متجمد كثيف",         icon: "🌧️", theme: "rain" },
  61: { text: "مطر خفيف",                icon: "🌦️", theme: "rain" },
  63: { text: "مطر",                     icon: "🌧️", theme: "rain" },
  65: { text: "مطر غزير",                icon: "🌧️", theme: "rain" },
  66: { text: "مطر متجمد",               icon: "🌧️", theme: "rain" },
  67: { text: "مطر متجمد غزير",          icon: "🌧️", theme: "rain" },
  71: { text: "ثلج خفيف",                icon: "🌨️", theme: "snow" },
  73: { text: "ثلج",                     icon: "🌨️", theme: "snow" },
  75: { text: "ثلج كثيف",                icon: "❄️", theme: "snow" },
  77: { text: "حبات ثلج",                icon: "❄️", theme: "snow" },
  80: { text: "زخات مطر خفيفة",          icon: "🌦️", theme: "rain" },
  81: { text: "زخات مطر",                icon: "🌧️", theme: "rain" },
  82: { text: "زخات مطر عنيفة",          icon: "🌧️", theme: "rain" },
  85: { text: "زخات ثلج",                icon: "🌨️", theme: "snow" },
  86: { text: "زخات ثلج كثيفة",          icon: "❄️", theme: "snow" },
  95: { text: "عاصفة رعدية",             icon: "⛈️", theme: "storm" },
  96: { text: "عاصفة رعدية مع برد",      icon: "⛈️", theme: "storm" },
  99: { text: "عاصفة رعدية مع برد كثيف", icon: "⛈️", theme: "storm" },
};

function describe(code) {
  return WEATHER[code] || { text: "غير معروف", icon: "🌡️", theme: "cloudy" };
}

/* ===== التخزين المحلي (آمن إذا كان معطلاً) ===== */
function load(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch {
    return fallback;
  }
}

function save(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* تجاهل */
  }
}

/* ===== واجهات Open-Meteo ===== */
async function searchCities(query) {
  const url =
    "https://geocoding-api.open-meteo.com/v1/search?name=" +
    encodeURIComponent(query) +
    "&count=5&language=ar&format=json";
  const res = await fetch(url);
  if (!res.ok) throw new Error("network");
  const json = await res.json();
  return json.results || [];
}

async function fetchWeather(latitude, longitude) {
  const params = new URLSearchParams({
    latitude,
    longitude,
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,is_day",
    daily: "weather_code,temperature_2m_max,temperature_2m_min",
    timezone: "auto",
    forecast_days: 7,
  });
  const res = await fetch("https://api.open-meteo.com/v1/forecast?" + params);
  if (!res.ok) throw new Error("network");
  return res.json();
}

/* ===== أدوات مساعدة ===== */
function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.classList.toggle("error", isError);
}

function toUnit(celsius) {
  const value = state.unit === "f" ? (celsius * 9) / 5 + 32 : celsius;
  return Math.round(value);
}

function placeMeta(result) {
  return [result.admin1, result.country].filter(Boolean).join("، ");
}

function themeFor(code, isDay) {
  const { theme } = describe(code);
  if (theme === "clear") return isDay ? "clear-day" : "clear-night";
  return theme;
}

/* ===== العرض ===== */
let countFrame = 0;

function animateTemp(target) {
  const el = document.getElementById("temp-value");
  cancelAnimationFrame(countFrame);

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) {
    el.textContent = target;
    return;
  }

  const duration = 900;
  const start = performance.now();

  function tick(now) {
    const t = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = Math.round(target * eased);
    if (t < 1) countFrame = requestAnimationFrame(tick);
  }
  countFrame = requestAnimationFrame(tick);
}

function render(animate = true) {
  const { place, data } = state;
  if (!place || !data) return;

  const cur = data.current;
  const now = describe(cur.weather_code);
  const unitLabel = state.unit === "f" ? "°F" : "°C";

  document.body.dataset.theme = themeFor(cur.weather_code, cur.is_day === 1);
  document.title = `${place.name} ${toUnit(cur.temperature_2m)}° — الطقس`;

  document.getElementById("city").textContent = place.name;

  const dateText = new Date(cur.time).toLocaleDateString("ar-AE", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  document.getElementById("place-meta").textContent = place.meta
    ? `${place.meta} — ${dateText}`
    : dateText;

  const temp = toUnit(cur.temperature_2m);
  if (animate) {
    animateTemp(temp);
  } else {
    document.getElementById("temp-value").textContent = temp;
  }

  document.getElementById("condition").textContent = `${now.icon} ${now.text}`;
  document.getElementById("feels").textContent = `${toUnit(cur.apparent_temperature)}°`;
  document.getElementById("humidity").textContent = `${cur.relative_humidity_2m}%`;
  document.getElementById("wind").textContent = `${Math.round(cur.wind_speed_10m)} km/h`;

  renderForecast(data.daily);

  unitBtn.textContent = state.unit === "f" ? "التحويل إلى °C" : "التحويل إلى °F";
  unitBtn.setAttribute("aria-label", `الوحدة الحالية ${unitLabel}. اضغط للتبديل`);
  weatherEl.hidden = false;
}

function renderForecast(daily) {
  const list = document.getElementById("forecast");
  list.innerHTML = "";

  const mins = daily.temperature_2m_min.map(toUnit);
  const maxs = daily.temperature_2m_max.map(toUnit);
  const lowest = Math.min(...mins);
  const highest = Math.max(...maxs);
  const span = Math.max(highest - lowest, 1);

  daily.time.forEach((date, i) => {
    const day = document.createElement("li");
    day.className = "day";

    const name =
      i === 0
        ? "اليوم"
        : new Date(date + "T12:00").toLocaleDateString("ar-AE", { weekday: "long" });

    const start = ((mins[i] - lowest) / span) * 100;
    const width = Math.max(((maxs[i] - mins[i]) / span) * 100, 4);

    day.innerHTML = `
      <span class="day-name">${name}</span>
      <span class="day-icon" role="img" aria-label="${describe(daily.weather_code[i]).text}">${describe(daily.weather_code[i]).icon}</span>
      <span class="day-min" dir="ltr">${mins[i]}°</span>
      <span class="track" aria-hidden="true">
        <span class="range" style="inset-inline-start:${start}%; width:${width}%"></span>
      </span>
      <span class="day-max" dir="ltr">${maxs[i]}°</span>
    `;
    list.appendChild(day);
  });
}

function renderRecent() {
  const recent = load("recent", []);
  recentList.innerHTML = "";
  recent.forEach((place) => {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = place.name;
    btn.addEventListener("click", () => showPlace(place));
    li.appendChild(btn);
    recentList.appendChild(li);
  });
}

function remember(place) {
  const recent = load("recent", []).filter((p) => p.name !== place.name);
  recent.unshift(place);
  save("recent", recent.slice(0, 5));
  renderRecent();
}

function showPicker(results) {
  picker.innerHTML = "";
  results.forEach((r) => {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.innerHTML = `<span></span><small></small>`;
    btn.children[0].textContent = r.name;
    btn.children[1].textContent = placeMeta(r);
    btn.addEventListener("click", () => {
      picker.hidden = true;
      showPlace(toPlace(r));
    });
    li.appendChild(btn);
    picker.appendChild(li);
  });
  picker.hidden = false;
}

function toPlace(r) {
  return {
    name: r.name,
    meta: placeMeta(r),
    latitude: r.latitude,
    longitude: r.longitude,
  };
}

/* ===== الإجراءات ===== */
async function showPlace(place) {
  picker.hidden = true;
  setStatus("جارٍ تحميل الطقس…");
  try {
    state.data = await fetchWeather(place.latitude, place.longitude);
    state.place = place;
    setStatus("");
    render(true);
    remember(place);
    save("last", place);
  } catch {
    setStatus("تعذّر تحميل الطقس. تأكد من اتصالك بالإنترنت وحاول مرة أخرى.", true);
  }
}

async function handleSearch(event) {
  event.preventDefault();
  const query = input.value.trim();
  if (!query) return;

  picker.hidden = true;
  setStatus("جارٍ البحث…");
  try {
    const results = await searchCities(query);
    if (results.length === 0) {
      setStatus(`لم نجد مدينة باسم «${query}». جرّب كتابة الاسم بطريقة مختلفة.`, true);
    } else if (results.length === 1) {
      showPlace(toPlace(results[0]));
    } else {
      setStatus("اختر المدينة المقصودة:");
      showPicker(results);
    }
  } catch {
    setStatus("تعذّر البحث. تأكد من اتصالك بالإنترنت وحاول مرة أخرى.", true);
  }
}

function handleLocate() {
  if (!navigator.geolocation) {
    setStatus("المتصفح لا يدعم تحديد الموقع.", true);
    return;
  }
  setStatus("جارٍ تحديد موقعك…");
  navigator.geolocation.getCurrentPosition(
    (pos) =>
      showPlace({
        name: "موقعي الحالي",
        meta: "",
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      }),
    () => setStatus("لم نتمكن من تحديد موقعك. اسمح للمتصفح بالوصول إلى الموقع أو ابحث باسم المدينة.", true),
    { timeout: 10000 }
  );
}

function toggleUnit() {
  state.unit = state.unit === "c" ? "f" : "c";
  save("unit", state.unit);
  render(false);
}

/* ===== التشغيل ===== */
form.addEventListener("submit", handleSearch);
locateBtn.addEventListener("click", handleLocate);
unitBtn.addEventListener("click", toggleUnit);

renderRecent();

showPlace(
  load("last", {
    name: "دبي",
    meta: "دبي، الإمارات العربية المتحدة",
    latitude: 25.0657,
    longitude: 55.17128,
  })
);