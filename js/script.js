// Temel değişkenler ve sabitler
const videoGrid = document.getElementById('videoGrid'); // Izgara alanı
const addChannelForm = document.getElementById('addChannelForm'); // Form elementini alıyoruz
const MAX_VIDEOS = 12; // Maksimum video sayısı
let videos = []; // Video dizisi

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
    } else if (videoUrl.includes('kick.com')) {
        handleKickVideo(videoUrl);
    } else {
        alert('Lütfen geçerli bir YouTube, Twitch veya Kick bağlantısı ekleyin');
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
    const videoUrls = Array.from(document.querySelectorAll('.video-container iframe')).map(iframe => {
        const src = iframe.getAttribute('src');
        if (src.includes('player.kick.com')) {
            const channelName = src.split('player.kick.com/')[1];
            return channelName ? `https://kick.com/${channelName}` : null;
        } else if (src.includes('youtube.com')) {
            const videoId = src.match(/embed\/([^?]+)/)?.[1];
            return videoId ? `https://youtube.com/watch?v=${videoId}` : null;
        } else if (src.includes('twitch.tv')) {
            const channelName = src.match(/channel=([^&]+)/)?.[1];
            return channelName ? `https://twitch.tv/${channelName}` : null;
        }
        return null;
    }).filter(url => url !== null);
    
    localStorage.setItem('videos', JSON.stringify(videoUrls));
}

function loadVideosFromStorage() {
    try {
        const savedVideos = localStorage.getItem('videos');
        if (savedVideos) {
            videos = []; // Geçerli diziyi sıfırla
            videoGrid.innerHTML = ''; // Önceki videoları temizle
            const urls = JSON.parse(savedVideos);
            
            urls.forEach(url => {
                if (!url) return;
                
                if (url.includes('kick.com')) {
                    handleKickVideo(url, false);
                } else if (url.includes('youtube.com') || url.includes('youtu.be')) {
                    handleYouTubeVideo(url, false);
                } else if (url.includes('twitch.tv')) {
                    handleTwitchVideo(url, false);
                }
            });
        }
    } catch (error) {
        console.error('Videolar yüklenirken hata oluştu:', error);
        localStorage.removeItem('videos'); // Bozuk depolama verisini temizler
    }
}

//
// Arka plan resmi yükleme işlemi
//
const DEFAULT_BACKGROUND = 'imaj/background.png'; // Temel arka plan resmi
const bgUploadBtn = document.getElementById('bgUploadBtn'); // Arka plan yükleme tuşu
const resetBgBtn = document.getElementById('resetBgBtn'); // Arka plan sıfırlama tuşu
const bgImageUpload = document.getElementById('bgImageUpload'); // Arka plan resmi yükleme işlemine ait giriş
// Arka plan yükleme tuşuna basıldığında ne işlem yapılacağını tanımlar
bgUploadBtn.addEventListener('click', () => {
    bgImageUpload.click(); // Yapılacak işlemi tetikler
});
// Arka plan resmi yükleme işlemi için pencere açma işlemi gerçekleşir
bgImageUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader(); // Okuma işlemini dosya nesnesi ile yapar
        reader.onload = (e) => {
            const imageData = e.target.result;
            document.body.style.backgroundImage = `url(${imageData})`;
            localStorage.setItem('backgroundImage', imageData);
        };
        reader.readAsDataURL(file);
    }
});
// Arka planı sıfırlama tuşuna basıldığında ne işlem yapılacağını tanımlar
resetBgBtn.addEventListener('click', () => {
    document.body.style.backgroundImage = `url(${DEFAULT_BACKGROUND})`;
    localStorage.removeItem('backgroundImage');
});
// Kayıttan arka plan resmini getirme işlemi
function loadSavedBackground() {
    const savedBg = localStorage.getItem('backgroundImage');
    if (savedBg) { // Kullanıcı arka plan resmi yüklemişse onu kullanır
        document.body.style.backgroundImage = `url(${savedBg})`;
    } else { // Yoksa varsayılan resmi kullanır
        document.body.style.backgroundImage = `url(${DEFAULT_BACKGROUND})`;
    }
}

//
// DOM'un yüklendiği zaman çalışacak fonksiyonlar
//
window.addEventListener('DOMContentLoaded', () => {
    initTheme();
    loadVideosFromStorage();
    loadSavedBackground();
});