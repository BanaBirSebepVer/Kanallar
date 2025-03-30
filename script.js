// KanallarYoutube - YouTube Video Embedder
// Kodları ve içerikleri özgün olarak oluşturulmuştur. Kodlar İngilizce olarak yazılmıştır. Açıklamalar Türkçe olarak verilmiştir.
// Bu script, kullanıcıların YouTube videolarını gömme ve yönetme işlevselliği sağlar.


// Tema Kontrolü
function toggleTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    
    if (theme === 'auto') {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    }
}

function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'auto';
    document.getElementById('themeSelect').value = savedTheme;
    toggleTheme(savedTheme);
    
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (localStorage.getItem('theme') === 'auto') {
            document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
        }
    });
}

const videoGrid = document.getElementById('videoGrid');
const addChannelForm = document.getElementById('addChannelForm');
const videos = [];
const MAX_VIDEOS = 12; // Video ekleme limiti


// Videoların çerez olarak yerelde saklanması için kullanılan fonksiyon
function saveVideosToStorage(videos) {
    try {
        const videoIds = Array.from(videos).map(container => {
            const iframe = container.querySelector('iframe');
            const src = iframe.getAttribute('src');
            return src.split('/').pop();
        });
        localStorage.setItem('savedVideos', JSON.stringify(videoIds));
    } catch (error) {
        console.error('Videolar kayıt edilirken sorun oluştu:', error);
    }
}
// Videoların yerel depolamadan yüklenmesi için kullanılan fonksiyon
function loadVideosFromStorage() {
    try {
        const savedVideos = localStorage.getItem('savedVideos');
        if (savedVideos) {
            const videoIds = JSON.parse(savedVideos);
            videoIds.forEach(videoId => {
                if (videos.length < MAX_VIDEOS) {
                    addVideo(videoId, false);
                }
            });
        }
    } catch (error) {
        console.error('Videolar yüklenirken hata oluştu:', error);
        localStorage.removeItem('savedVideos'); // Bozuk veriler siliniyor
    }
}
// YouTube video ID'sini URL'den çıkartmak için kullanılan fonksiyon. Bu fonksiyon, YouTube URL'sinden video ID'sini alır.
function extractVideoId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}
// Video ekleme fonksiyonu. Bu fonksiyon, video ID'sini alır ve videoyu ekler.
function addVideo(videoId, shouldSave = true) {
    if (videos.length >= MAX_VIDEOS) {
        alert(`Üst limit olan ${MAX_VIDEOS} videoya ulaşıldı!`);
        return;
    }

    try {
        const videoContainer = document.createElement('div');
        videoContainer.className = 'video-container';
        
        const embedType = videoId.toLowerCase().includes('live') ? 'live_stream' : 'embed';
        
        videoContainer.innerHTML = `
            <button class="remove-btn" onclick="removeVideo(this.parentElement)">×</button>
            <iframe
                src="https://www.youtube.com/${embedType}/${videoId}?autoplay=1&mute=1"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen>
            </iframe>
        `;
        videos.push(videoContainer);
        videoGrid.appendChild(videoContainer);
        
        if (shouldSave) {
            saveVideosToStorage(videos);
        }
    } catch (error) {
        console.error('Video eklerken hata oluştu:', error);
    }
}
// Video kaldırma fonksiyonu. Bu fonksiyon, video konteynerini alır ve videoyu kaldırır. Ayrıca, kaldırılan videoyu yerel depolamadan siler.
function removeVideo(container) {
    try {
        const index = videos.indexOf(container);
        if (index > -1) {
            videos.splice(index, 1);
            container.remove();
            saveVideosToStorage(videos);
        }
    } catch (error) {
        console.error('Error removing video:', error);
    }
}
// Video bağlantılarını kontrol etme fonksiyonu. Bu fonksiyon, video bağlantılarının geçerli olup olmadığını kontrol eder.
addChannelForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const videoUrl = document.getElementById('videoUrl').value.trim();
    const videoId = extractVideoId(videoUrl);
    
    if (videoId) {
        addVideo(videoId);
        document.getElementById('videoUrl').value = '';
    } else {
        alert("Lütfen geçerli bir YouTube URL'si girin.");
    }
});

// Kayıt edilen videoları yerel depolamadan yükler ve sayfa yüklendiğinde temayı başlatır
window.addEventListener('load', () => {
    initTheme();
    loadVideosFromStorage();
});
