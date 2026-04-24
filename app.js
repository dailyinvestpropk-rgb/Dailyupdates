// ============ Firebase Configuration ============
const firebaseConfig = {
    apiKey: "AIzaSyAyH2GTUxuC0h0B9nsmgNNAzOi8oIKcA4Y",
    authDomain: "daily-updates-5cff0.firebaseapp.com",
    projectId: "daily-updates-5cff0",
    storageBucket: "daily-updates-5cff0.firebasestorage.app",
    messagingSenderId: "382483874062",
    appId: "1:382483874062:web:dfda8f4f100aea091fd75f",
    measurementId: "G-T842GPSTXK"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// ============ API Keys ============
const NEWS_API_KEY = "198d86fd00b6f777623743347d0f33b0";
const WEATHER_API_KEY = "0c08cef8fefc4a8abb5204803262404";

// ============ Global Variables ============
let currentCity = localStorage.getItem('userCity') || 'Karachi';
let currentCountry = 'Pakistan';
let autoUpdateInterval;

// ============ Location Functions ============
function changeLocation() {
    const select = document.getElementById('citySelect');
    currentCity = select.value;
    localStorage.setItem('userCity', currentCity);
    fetchAllData();
    showNotification(`📍 Location changed to ${currentCity}`);
}

function getCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            await fetchCityFromCoordinates(lat, lon);
        }, (error) => {
            console.error("Geolocation error:", error);
            showNotification("⚠️ Please allow location access or select city manually");
        });
    } else {
        showNotification("❌ Geolocation not supported by your browser");
    }
}

async function fetchCityFromCoordinates(lat, lon) {
    try {
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();
        currentCity = data.name;
        currentCountry = data.sys.country;
        
        // Update select dropdown
        const select = document.getElementById('citySelect');
        if (select.querySelector(`option[value="${currentCity}"]`)) {
            select.value = currentCity;
        }
        
        localStorage.setItem('userCity', currentCity);
        fetchAllData();
        showNotification(`📍 Location set to ${currentCity}`);
    } catch (error) {
        console.error("Error fetching city:", error);
        showNotification("❌ Could not detect location, please select manually");
    }
}

// ============ Online/Offline Status ============
function updateOnlineStatus() {
    const statusElement = document.getElementById('onlineStatus');
    if (navigator.onLine) {
        statusElement.textContent = '🟢 Online';
        statusElement.classList.remove('offline');
        fetchAllData();
    } else {
        statusElement.textContent = '🔴 Offline (Showing cached)';
        statusElement.classList.add('offline');
    }
}

window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

// ============ Firebase Real-time Listeners ============
function setupRealtimeListeners() {
    database.ref('dashboard/weather').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data && data.city === currentCity) {
            updateWeatherUI(data);
        }
    });

    database.ref('dashboard/namaz').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data && data.city === currentCity) {
            updateNamazUI(data);
        }
    });

    database.ref('dashboard/ayat').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            updateAyatUI(data);
        }
    });
}

// ============ UI Update Functions ============
function updateWeatherUI(data) {
    document.getElementById('weatherData').innerHTML = `
        <div class="temp">${data.temp}°C</div>
        <div class="condition">${data.condition}</div>
        <div class="location">📍 ${data.city}, ${data.country}</div>
        <div style="margin-top: 10px; font-size: 0.9em;">
            💧 Humidity: ${data.humidity}% | 🌬️ Wind: ${data.wind} km/h
        </div>
    `;
    updateLastUpdateTime();
}

function updateNamazUI(data) {
    document.getElementById('namazData').innerHTML = `
        <div>🌅 Fajr: ${data.Fajr}</div>
        <div>☀️ Dhuhr: ${data.Dhuhr}</div>
        <div>🌇 Asr: ${data.Asr}</div>
        <div>🌙 Maghrib: ${data.Maghrib}</div>
        <div>🌌 Isha: ${data.Isha}</div>
        <div style="grid-column: span 2; background: #667eea; color: white; padding: 8px; border-radius: 8px; margin-top: 5px;">
            📅 ${data.hijriDate}
        </div>
    `;
    updateLastUpdateTime();
}

function updateAyatUI(data) {
    document.getElementById('ayatData').innerHTML = `
        <div class="arabic">${data.arabic}</div>
        <div class="translation">${data.translation}</div>
        <div class="surah">📖 ${data.surah} (Ayat ${data.ayatNo})</div>
    `;
    updateLastUpdateTime();
}

function updateLastUpdateTime() {
    const now = new Date();
    document.getElementById('lastUpdate').textContent = `Updated: ${now.toLocaleTimeString()}`;
}

// ============ Newspaper Functions ============
async function loadNewspaper(paper, btnElement) {
    // Update active tab
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    btnElement.classList.add('active');
    
    const newsContainer = document.getElementById('newsContainer');
    newsContainer.innerHTML = '<div class="news-loading">📰 Loading headlines...</div>';
    
    const headlines = await fetchRealNews(paper);
    displayHeadlines(headlines);
}

async function fetchRealNews(paper) {
    // Using GNews API for real news
    const newsUrls = {
        jang: `https://gnews.io/api/v4/search?q=pakistan&lang=ur&max=8&apikey=${NEWS_API_KEY}`,
        dawn: `https://gnews.io/api/v4/top-headlines?country=pk&lang=en&max=8&apikey=${NEWS_API_KEY}`,
        express: `https://gnews.io/api/v4/search?q=pakistan+news&lang=ur&max=8&apikey=${NEWS_API_KEY}`,
        nawaiwaqt: `https://gnews.io/api/v4/search?q=pakistan&lang=ur&max=8&apikey=${NEWS_API_KEY}`,
        thenews: `https://gnews.io/api/v4/top-headlines?country=pk&lang=en&max=8&apikey=${NEWS_API_KEY}`
    };
    
    try {
        const url = newsUrls[paper];
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.articles && data.articles.length > 0) {
            return data.articles.map(article => ({
                title: article.title,
                description: article.description || 'Click to read full article',
                url: article.url,
                source: article.source.name,
                time: new Date(article.publishedAt).toLocaleString()
            }));
        } else {
            return getFallbackNews(paper);
        }
    } catch (error) {
        console.error("News fetch error:", error);
        return getFallbackNews(paper);
    }
}

function getFallbackNews(paper) {
    const fallbackNews = {
        jang: [
            { title: "پاکستان میں معاشی ترقی کے نئے مواقع", description: "حکومت نے نئے منصوبوں کا اعلان کر دیا", url: "https://jang.com.pk", source: "Jang News", time: new Date().toLocaleString() },
            { title: "موسم کی تازہ ترین صورتحال", description: "ملک کے مختلف حصوں میں بارش کا امکان", url: "https://jang.com.pk", source: "Jang News", time: new Date().toLocaleString() }
        ],
        dawn: [
            { title: "Pakistan's Economy Shows Positive Growth", description: "New IT initiatives announced", url: "https://dawn.com", source: "Dawn", time: new Date().toLocaleString() },
            { title: "Weather Update: Rain Expected", description: "Met department issues alert", url: "https://dawn.com", source: "Dawn", time: new Date().toLocaleString() }
        ],
        express: [
            { title: "نئی تعلیمی پالیسی کا اعلان", description: "طلبہ کیلئے خوشخبری", url: "https://express.pk", source: "Express", time: new Date().toLocaleString() },
            { title: "کھیلوں میں پاکستان کی کامیابیاں", description: "بین الاقوامی مقابلوں میں کارکردگی", url: "https://express.pk", source: "Express", time: new Date().toLocaleString() }
        ],
        nawaiwaqt: [
            { title: "امن و امان کی صورتحال بہتر", description: "جرائم کی شرح میں کمی", url: "https://nawaiwaqt.pk", source: "Nawaiwaqt", time: new Date().toLocaleString() },
            { title: "زرعی ترقی کے نئے ریکارڈ", description: "فصلوں کی پیداوار میں اضافہ", url: "https://nawaiwaqt.pk", source: "Nawaiwaqt", time: new Date().toLocaleString() }
        ],
        thenews: [
            { title: "Stock Market Hits Record High", description: "KSE-100 index crosses new milestone", url: "https://thenews.com.pk", source: "The News", time: new Date().toLocaleString() },
            { title: "IT Exports Increase by 30%", description: "Pakistan's digital economy grows", url: "https://thenews.com.pk", source: "The News", time: new Date().toLocaleString() }
        ]
    };
    
    return fallbackNews[paper] || fallbackNews.dawn;
}

function displayHeadlines(headlines) {
    const newsContainer = document.getElementById('newsContainer');
    if (!headlines || headlines.length === 0) {
        newsContainer.innerHTML = '<div class="news-item">No headlines available</div>';
        return;
    }
    
    const headlinesHtml = headlines.map(headline => `
        <div class="news-item" onclick="openArticle('${headline.url}', '${escapeHtml(headline.title)}')">
            <div class="news-title">📰 ${escapeHtml(headline.title)}</div>
            <div class="news-description">${escapeHtml(headline.description || 'Click to read full article')}</div>
            <div class="news-date">
                <span>📌 ${escapeHtml(headline.source)}</span>
                <span class="read-more">Click to read →</span>
            </div>
        </div>
    `).join('');
    
    newsContainer.innerHTML = headlinesHtml;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function openArticle(url, title) {
    const modal = document.getElementById('articleModal');
    const modalBody = document.getElementById('modalBody');
    modal.style.display = 'block';
    
    modalBody.innerHTML = `
        <div style="height: 100%; display: flex; flex-direction: column;">
            <h3 style="margin-bottom: 15px; padding-right: 30px;">${title}</h3>
            <iframe src="${url}" class="modal-iframe" sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-top-navigation"></iframe>
        </div>
    `;
}

function closeModal() {
    document.getElementById('articleModal').style.display = 'none';
}

// Close modal on escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeModal();
    }
});

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('articleModal');
    if (event.target === modal) {
        closeModal();
    }
}

// ============ API Fetch Functions ============
async function fetchWeather() {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${currentCity}&units=metric&appid=${WEATHER_API_KEY}`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (data.cod === 200) {
            return {
                temp: Math.round(data.main.temp),
                condition: data.weather[0].description,
                city: data.name,
                country: data.sys.country,
                humidity: data.main.humidity,
                wind: Math.round(data.wind.speed)
            };
        }
    } catch (error) {
        console.error("Weather Error:", error);
    }
    return null;
}

async function fetchNamazTimes() {
    const url = `https://api.aladhan.com/v1/timingsByCity?city=${currentCity}&country=${currentCountry}&method=2`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        const timings = data.data.timings;
        const hijri = data.data.date.hijri;
        
        return {
            Fajr: timings.Fajr,
            Dhuhr: timings.Dhuhr,
            Asr: timings.Asr,
            Maghrib: timings.Maghrib,
            Isha: timings.Isha,
            hijriDate: `${hijri.day} ${hijri.month.en} ${hijri.year}`,
            city: currentCity
        };
    } catch (error) {
        console.error("Namaz Error:", error);
        return null;
    }
}

async function fetchAyat() {
    const url = 'https://api.alquran.cloud/v1/ayah/random/editions/quran-uthmani,en.sahih';
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        return {
            arabic: data.data[0].text,
            translation: data.data[1].text,
            surah: data.data[0].surah.englishName,
            ayatNo: data.data[0].numberInSurah
        };
    } catch (error) {
        console.error("Quran Error:", error);
        return null;
    }
}

async function saveToFirebase(weather, namaz, ayat) {
    const updates = {};
    
    if (weather) {
        updates['dashboard/weather'] = weather;
    }
    if (namaz) {
        updates['dashboard/namaz'] = namaz;
    }
    if (ayat) {
        updates['dashboard/ayat'] = ayat;
    }
    updates['dashboard/lastUpdate'] = firebase.database.ServerValue.TIMESTAMP;
    
    try {
        await database.ref().update(updates);
        console.log("Data saved to Firebase");
    } catch (error) {
        console.error("Firebase error:", error);
    }
}

async function fetchAllData() {
    if (!navigator.onLine) {
        console.log("Offline mode");
        return;
    }
    
    try {
        console.log(`Fetching data for ${currentCity}...`);
        const [weather, namaz, ayat] = await Promise.all([
            fetchWeather(),
            fetchNamazTimes(),
            fetchAyat()
        ]);
        
        if (weather) updateWeatherUI(weather);
        if (namaz) updateNamazUI(namaz);
        if (ayat) updateAyatUI(ayat);
        
        await saveToFirebase(weather, namaz, ayat);
        updateLastUpdateTime();
        
        // Add auto-update indicator
        showAutoUpdateNotification();
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

function showAutoUpdateNotification() {
    let badge = document.querySelector('.auto-update-badge');
    if (!badge) {
        badge = document.createElement('div');
        badge.className = 'auto-update-badge';
        document.body.appendChild(badge);
    }
    badge.textContent = '🔄 Auto-updating every 10 min';
    setTimeout(() => {
        if (badge) badge.style.opacity = '0.3';
    }, 3000);
}

function showNotification(message) {
    const badge = document.querySelector('.auto-update-badge') || document.createElement('div');
    if (!document.querySelector('.auto-update-badge')) {
        badge.className = 'auto-update-badge';
        document.body.appendChild(badge);
    }
    badge.textContent = message;
    badge.style.opacity = '1';
    setTimeout(() => {
        badge.style.opacity = '0.3';
    }, 3000);
}

function manualRefresh() {
    if (navigator.onLine) {
        fetchAllData();
        // Also refresh current newspaper
        const activeTab = document.querySelector('.tab-btn.active');
        if (activeTab) {
            const paper = activeTab.textContent.toLowerCase().includes('jang') ? 'jang' :
                        activeTab.textContent.toLowerCase().includes('dawn') ? 'dawn' :
                        activeTab.textContent.toLowerCase().includes('express') ? 'express' :
                        activeTab.textContent.toLowerCase().includes('nawaiwaqt') ? 'nawaiwaqt' : 'thenews';
            loadNewspaper(paper, activeTab);
        }
        showNotification("🔄 Manual refresh completed");
    } else {
        alert("⚠️ No internet connection! Showing cached data.");
    }
}

// ============ Auto-refresh every 10 minutes ============
function startAutoUpdate() {
    if (autoUpdateInterval) clearInterval(autoUpdateInterval);
    autoUpdateInterval = setInterval(() => {
        if (navigator.onLine) {
            fetchAllData();
            console.log("Auto-update triggered at:", new Date().toLocaleTimeString());
        }
    }, 10 * 60 * 1000); // 10 minutes
}

// ============ Initialize ============
function init() {
    // Set initial city in dropdown
    document.getElementById('citySelect').value = currentCity;
    
    updateOnlineStatus();
    setupRealtimeListeners();
    startAutoUpdate();
    
    // Load default newspaper
    const defaultBtn = document.querySelector('.tab-btn.active');
    if (defaultBtn) {
        loadNewspaper('jang', defaultBtn);
    }
    
    if (navigator.onLine) {
        fetchAllData();
    }
    
    console.log("Dashboard initialized! Auto-updates every 10 minutes.");
}

// Start the app
init();
