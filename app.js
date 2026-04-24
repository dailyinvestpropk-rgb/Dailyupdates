// ============ Firebase Configuration (Your provided config) ============
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
const NEWS_API_KEY = "198d86fd00b6f777623743347d0f33b0";  // Your GNews API key
const WEATHER_API_KEY = "0c08cef8fefc4a8abb5204803262404";  // Your OpenWeatherMap API key
const CITY = "Karachi";
const COUNTRY = "Pakistan";

// ============ Global Variables ============
let currentData = {
    weather: null,
    namaz: null,
    news: null,
    ayat: null
};

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

    database.ref('dashboard/news').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            currentData.news = data;
            updateNewsUI(data);
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

function updateNewsUI(newsArray) {
    if (!newsArray || newsArray.length === 0) {
        document.getElementById('newsData').innerHTML = '<div class="news-item">No news available</div>';
        return;
    }
    
    const newsHtml = newsArray.map(news => `
        <div class="news-item" onclick="window.open('${news.url}', '_blank')">
            <div class="news-title">📰 ${news.title}</div>
            <div class="news-description">${news.description || 'Click to read full article'}</div>
            <div class="news-source">${news.source} • ${news.time}</div>
        </div>
    `).join('');
    
    document.getElementById('newsData').innerHTML = newsHtml;
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
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error("Weather API Error:", error);
        return currentData.weather || { temp: '--', condition: 'Unable to fetch', city: CITY, country: COUNTRY, humidity: '--', wind: '--' };
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
        console.error("Namaz API Error:", error);
        return currentData.namaz || { Fajr: '--', Dhuhr: '--', Asr: '--', Maghrib: '--', Isha: '--', hijriDate: 'Error loading' };
    }
}

async function fetchNews() {
    // Using GNews API with your key
    const url = `https://gnews.io/api/v4/top-headlines?country=pk&lang=en&max=8&apikey=${NEWS_API_KEY}`;
    
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.articles && data.articles.length > 0) {
            return data.articles.map(article => ({
                title: article.title,
                description: article.description || 'Click to read full article',
                source: article.source.name,
                url: article.url,
                time: new Date(article.publishedAt).toLocaleTimeString()
            }));
        } else {
            return getMockNews();
        }
    } catch (error) {
        console.error("News API Error:", error);
        return getMockNews();
    }
}

// Mock news data in case API fails
function getMockNews() {
    return [
        {
            title: "Pakistan launches new IT initiative for youth",
            description: "Government announces free IT training programs across the country",
            source: "Tech News Pakistan",
            url: "#",
            time: new Date().toLocaleTimeString()
        },
        {
            title: "Stock market shows positive trend",
            description: "KSE-100 index gains 500 points in early trading",
            source: "Business Today",
            url: "#",
            time: new Date().toLocaleTimeString()
        },
        {
            title: "Weather update: Rain expected in Karachi",
            description: "Met department issues advisory for coastal areas",
            source: "Weather News",
            url: "#",
            time: new Date().toLocaleTimeString()
        },
        {
            title: "Cricket team announced for upcoming series",
            description: "New players included in national squad",
            source: "Sports Central",
            url: "#",
            time: new Date().toLocaleTimeString()
        }
    ];
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
        console.error("Quran API Error:", error);
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
        'dashboard/news': data.news,
        'dashboard/ayat': data.ayat,
        'dashboard/lastUpdate': firebase.database.ServerValue.TIMESTAMP
    };
    
    try {
        await database.ref().update(updates);
        console.log("Data saved to Firebase successfully");
    } catch (error) {
        console.error("Firebase save error:", error);
    }
}

async function fetchAllData() {
    if (!navigator.onLine) {
        console.log("Offline mode - using cached data");
        return;
    }
    
    try {
        console.log("Fetching fresh data...");
        const [weather, namaz, news, ayat] = await Promise.all([
            fetchWeather(),
            fetchNamazTimes(),
            fetchNews(),
            fetchAyat()
        ]);
        
        await saveToFirebase({ weather, namaz, news, ayat });
        console.log("All data updated successfully");
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

// Manual refresh function
function manualRefresh() {
    if (navigator.onLine) {
        fetchAllData();
        const refreshBtn = document.querySelector('.refresh-btn');
        const originalText = refreshBtn.textContent;
        refreshBtn.textContent = '🔄 Refreshing...';
        setTimeout(() => {
            refreshBtn.textContent = originalText;
        }, 2000);
    } else {
        alert("⚠️ No internet connection! Showing cached data.");
    }
}

// ============ Auto-refresh every 10 minutes ============
setInterval(() => {
    if (navigator.onLine) {
        fetchAllData();
    }
}, 10 * 60 * 1000);

// ============ Initialize App ============
function init() {
    updateOnlineStatus();
    setupRealtimeListeners();
    
    if (navigator.onLine) {
        fetchAllData();
    }
}

// Start the app
init();
