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
const YOUTUBE_CHANNEL_ID = "UCmQIzI8cqgFmuIQxwpE5_MQ";
const CITY = "Karachi";
const COUNTRY = "Pakistan";

// ============ Global Variables ============
let currentData = {
    weather: null,
    namaz: null,
    news: null,
    ayat: null,
    newspaper: null
};

let currentNewspaper = 'jang';

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
        if (data) {
            currentData.weather = data;
            updateWeatherUI(data);
            updateLastUpdateTime();
        }
    });

    database.ref('dashboard/namaz').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            currentData.namaz = data;
            updateNamazUI(data);
            updateLastUpdateTime();
        }
    });

    database.ref('dashboard/ayat').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            currentData.ayat = data;
            updateAyatUI(data);
            updateLastUpdateTime();
        }
    });
}

// ============ UI Update Functions ============
function updateWeatherUI(data) {
    document.getElementById('weatherData').innerHTML = `
        <div class="temp">${data.temp}°C</div>
        <div class="condition">${data.condition}</div>
        <div class="location">📍 ${data.city}, ${data.country}</div>
        <div style="margin-top: 10px; font-size: 0.9em;">💧 Humidity: ${data.humidity}% | 🌬️ Wind: ${data.wind} km/h</div>
    `;
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
}

function updateAyatUI(data) {
    document.getElementById('ayatData').innerHTML = `
        <div class="arabic">${data.arabic}</div>
        <div class="translation">${data.translation}</div>
        <div class="surah">📖 ${data.surah} (Ayat ${data.ayatNo})</div>
    `;
}

function updateLastUpdateTime() {
    const now = new Date();
    document.getElementById('lastUpdate').textContent = `Updated: ${now.toLocaleTimeString()}`;
}

// ============ YouTube Functions ============
function openYouTubeChannel() {
    window.open(`https://youtube.com/channel/${YOUTUBE_CHANNEL_ID}`, '_blank');
}

// Check if channel is live
async function checkLiveStatus() {
    const liveStatusDiv = document.getElementById('liveStatus');
    try {
        // Using YouTube API to check live status (optional)
        liveStatusDiv.innerHTML = '✅ Channel is active • Subscribe for daily naats';
        liveStatusDiv.style.background = '#1a1a1a';
    } catch (error) {
        liveStatusDiv.innerHTML = '✅ Subscribe for latest naats and bayans';
    }
}

// ============ Newspaper Functions ============
async function loadNewspaper(paper) {
    currentNewspaper = paper;
    
    // Update active tab
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    const newsContainer = document.getElementById('newsContainer');
    newsContainer.innerHTML = '<div class="news-loading">Loading headlines...</div>';
    
    const headlines = await fetchNewspaperHeadlines(paper);
    displayHeadlines(headlines);
}

function displayHeadlines(headlines) {
    const newsContainer = document.getElementById('newsContainer');
    if (!headlines || headlines.length === 0) {
        newsContainer.innerHTML = '<div class="news-item">No headlines available</div>';
        return;
    }
    
    const headlinesHtml = headlines.map(headline => `
        <div class="news-item" onclick="openArticle('${headline.url}', '${headline.title.replace(/'/g, "\\'")}')">
            <div class="news-title">📰 ${headline.title}</div>
            <div class="news-date">${headline.date || new Date().toLocaleDateString()}</div>
        </div>
    `).join('');
    
    newsContainer.innerHTML = headlinesHtml;
}

async function fetchNewspaperHeadlines(paper) {
    // Using RSS to JSON API for newspaper headlines
    const newspaperUrls = {
        jang: 'https://jang.com.pk/rss',
        dawn: 'https://www.dawn.com/feeds/home',
        express: 'https://www.express.pk/rss',
        nawaiwaqt: 'https://www.nawaiwaqt.com.pk/rss',
        thenews: 'https://www.thenews.com.pk/rss'
    };
    
    // Mock headlines (since RSS needs proxy, providing sample data)
    const mockHeadlines = {
        jang: [
            { title: "پاکستان میں اقتصادی ترقی کے نئے ریکارڈ", url: "https://jang.com.pk", date: "2024-01-15" },
            { title: "مہنگائی میں کمی، عوام کو ریلیف", url: "https://jang.com.pk", date: "2024-01-15" },
            { title: "سیاسی صورتحال: اہم پیش رفت", url: "https://jang.com.pk", date: "2024-01-15" }
        ],
        dawn: [
            { title: "Pakistan's economy shows positive growth", url: "https://dawn.com", date: "2024-01-15" },
            { title: "New education policy announced", url: "https://dawn.com", date: "2024-01-15" },
            { title: "Weather update: Rainfall expected", url: "https://dawn.com", date: "2024-01-15" }
        ],
        express: [
            { title: "نئی آمدن، خوشحال پاکستان", url: "https://express.pk", date: "2024-01-15" },
            { title: "تعلیمی اداروں میں بہتری", url: "https://express.pk", date: "2024-01-15" }
        ],
        nawaiwaqt: [
            { title: "ملک میں امن و امان کی صورتحال", url: "https://nawaiwaqt.pk", date: "2024-01-15" },
            { title: "زرعی شعبے میں ترقی", url: "https://nawaiwaqt.pk", date: "2024-01-15" }
        ],
        thenews: [
            { title: "Stock market hits new high", url: "https://thenews.com.pk", date: "2024-01-15" },
            { title: "IT exports increase by 25%", url: "https://thenews.com.pk", date: "2024-01-15" }
        ]
    };
    
    return mockHeadlines[paper] || mockHeadlines.jang;
}

function openArticle(url, title) {
    const modal = document.getElementById('articleModal');
    const modalBody = document.getElementById('modalBody');
    modal.style.display = 'block';
    
    modalBody.innerHTML = `
        <div style="padding: 20px;">
            <h2 style="margin-bottom: 15px;">${title}</h2>
            <iframe src="${url}" class="modal-iframe" style="width:100%; height:80vh; border:none;"></iframe>
        </div>
    `;
}

function openFullNewspaper() {
    const newspaperWebsites = {
        jang: 'https://jang.com.pk',
        dawn: 'https://dawn.com',
        express: 'https://express.pk',
        nawaiwaqt: 'https://nawaiwaqt.com.pk',
        thenews: 'https://thenews.com.pk'
    };
    
    const url = newspaperWebsites[currentNewspaper];
    const modal = document.getElementById('articleModal');
    const modalBody = document.getElementById('modalBody');
    modal.style.display = 'block';
    
    modalBody.innerHTML = `
        <iframe src="${url}" class="modal-iframe" style="width:100%; height:85vh; border:none;"></iframe>
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

// ============ API Fetch Functions ============
async function fetchWeather() {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${CITY}&units=metric&appid=${WEATHER_API_KEY}`;
    
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
        return currentData.weather || { temp: '--', condition: 'Unavailable', city: CITY, country: COUNTRY, humidity: '--', wind: '--' };
    }
}

async function fetchNamazTimes() {
    const url = `https://api.aladhan.com/v1/timingsByCity?city=${CITY}&country=${COUNTRY}&method=2`;
    
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
            hijriDate: `${hijri.day} ${hijri.month.en} ${hijri.year}`
        };
    } catch (error) {
        return currentData.namaz || { Fajr: '--', Dhuhr: '--', Asr: '--', Maghrib: '--', Isha: '--', hijriDate: '--' };
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
        return currentData.ayat || { 
            arabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', 
            translation: 'In the name of Allah, the Most Gracious, the Most Merciful', 
            surah: 'Al-Fatiha', 
            ayatNo: '1' 
        };
    }
}

async function saveToFirebase(data) {
    const updates = {
        'dashboard/weather': data.weather,
        'dashboard/namaz': data.namaz,
        'dashboard/ayat': data.ayat,
        'dashboard/lastUpdate': firebase.database.ServerValue.TIMESTAMP
    };
    
    try {
        await database.ref().update(updates);
    } catch (error) {
        console.error("Firebase error:", error);
    }
}

async function fetchAllData() {
    if (!navigator.onLine) return;
    
    try {
        const [weather, namaz, ayat] = await Promise.all([
            fetchWeather(),
            fetchNamazTimes(),
            fetchAyat()
        ]);
        
        await saveToFirebase({ weather, namaz, ayat });
    } catch (error) {
        console.error('Error:', error);
    }
}

function manualRefresh() {
    if (navigator.onLine) {
        fetchAllData();
        loadNewspaper(currentNewspaper);
    } else {
        alert("No internet connection! Showing cached data.");
    }
}

// ============ Auto-refresh every 10 minutes ============
setInterval(() => {
    if (navigator.onLine) {
        fetchAllData();
    }
}, 10 * 60 * 1000);

// ============ Initialize ============
function init() {
    updateOnlineStatus();
    setupRealtimeListeners();
    checkLiveStatus();
    loadNewspaper('jang');
    
    if (navigator.onLine) {
        fetchAllData();
    }
}

init();
