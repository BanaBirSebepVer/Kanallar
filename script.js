

// Temel değişkenler ve sabitler
const videoGrid = document.getElementById('videoGrid');
const addChannelForm = document.getElementById('addChannelForm');
const MAX_VIDEOS = 12;
let videos = [];

// Temalar için elementleri alıyoruz
function toggleTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    if (theme === 'auto') {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    }
}

// Tema başlatıcı
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'auto';
    document.getElementById('themeSelect').value = savedTheme;
    toggleTheme(savedTheme);
}


// Video bağlantılarını işleme
addChannelForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const videoUrl = document.getElementById('videoUrl').value.trim();

    if (videos.length >= MAX_VIDEOS) {
        alert(`En fazla ${MAX_VIDEOS} ekleyebilirsiniz!`);
        return;
    }

    if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
        handleYouTubeVideo(videoUrl);
    } else if (videoUrl.includes('twitch.tv')) {
        handleTwitchVideo(videoUrl);
    } else {
        alert('Lütfen geçerli bir YouTube veya Twitch bağlantısı ekleyin');
    }

    document.getElementById('videoUrl').value = '';
});

// Ortak video işleme fonksiyonları
function removeVideo(container) {
    const index = videos.indexOf(container);
    if (index > -1) {
        videos.splice(index, 1);
        container.remove();
        saveVideosToStorage();
    }
}

// Yerel depolama seçenekleri
function saveVideosToStorage() {
    const videoData = videos.map(container => {
        const iframe = container.querySelector('iframe');
        return {
            url: iframe.src,
            type: iframe.src.includes('youtube') ? 'youtube' : 'twitch'
        };
    });
    localStorage.setItem('savedVideos', JSON.stringify(videoData));
}

// Kayıtlı videoların başlangıçta tekrar açılması için fonksiyon
window.addEventListener('load', () => {
    initTheme();
    const savedVideos = JSON.parse(localStorage.getItem('savedVideos') || '[]');
    savedVideos.forEach(video => {
        if (video.type === 'youtube') {
            const videoId = video.url.split('/').pop().split('?')[0];
            handleYouTubeVideo(`https://youtube.com/watch?v=${videoId}`, false);
        } else if (video.type === 'twitch') {
            const channelName = video.url.split('channel=')[1].split('&')[0];
            handleTwitchVideo(`https://twitch.tv/${channelName}`, false);
        }
    });
});