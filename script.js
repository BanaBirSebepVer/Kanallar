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

// Etkileşim Özellikleri Kontrolü
function toggleTabsFeature(state) {
    localStorage.setItem('tabsFeature', state);
    
    if (state === 'on') {
        // Video Grid'i pozisyona hazırla
        videoGrid.style.position = 'relative';
        videoGrid.style.minHeight = '600px';
        videoGrid.style.height = '100vh';
        
        // Etkileşimleri etkinleştir
        if (window.VideoInteractions) {
            // VideoInteractions zaten yüklüyse
            const videoContainers = document.querySelectorAll('.video-container');
            
            // Her video için stili güncelle ve etkileşim ekle
            videoContainers.forEach(container => {
                container.style.paddingBottom = '0';
                container.style.width = container.style.width || '400px';
                container.style.height = container.style.height || '260px';
                window.VideoInteractions.enableInteractions(container);
            });
        } else {
            // Script'i yükle
            loadVideoInteractionsScript();
        }
    } else {
        // Video Grid'i eski haline döndür
        videoGrid.style.position = '';
        videoGrid.style.minHeight = '';
        videoGrid.style.height = '';
        
        // Etkileşimleri devre dışı bırak
        if (window.VideoInteractions) {
            const videoContainers = document.querySelectorAll('.video-container');
            
            // Tüm videoları orijinal haline döndür
            videoContainers.forEach(container => {
                window.VideoInteractions.disableInteractions(container);
                container.style.paddingBottom = '56.25%';
                container.style.width = '';
                container.style.height = '';
            });
            
            // Grid yapısını eski haline döndür
            videoGrid.style.display = 'grid';
        }
    }
}

// Video Etkileşimleri Script Yükleme
function loadVideoInteractionsScript() {
    const script = document.createElement('script');
    script.src = 'video-interactions.js';
    script.onload = () => {
        // Script yüklendikten sonra etkileşimleri başlat
        if (window.VideoInteractions && videos.length > 0) {
            // Video Grid'i pozisyona hazırla
            videoGrid.style.position = 'relative';
            videoGrid.style.minHeight = '600px';
            videoGrid.style.height = '100vh';
            
            // Grid normal görünümü kaldır
            videoGrid.style.display = 'block';
            
            window.VideoInteractions.init(videos, videoGrid, saveVideosToStorage);
            
            // Etkileşim durumunu ayarla
            const tabsFeatureState = localStorage.getItem('tabsFeature') || 'off';
            if (tabsFeatureState === 'on') {
                // Pozisyon ayarlamaları yap - videolar birbirinin üstüne gelmeyecek şekilde dizilsin
                let offsetX = 20;
                let offsetY = 20;
                let row = 0;
                let col = 0;
                const maxCols = 3;
                
                videos.forEach((container, index) => {
                    // Grid hücre boyutları gibi konumla
                    const gridCellWidth = (videoGrid.offsetWidth / maxCols) - 40;
                    const posX = col * gridCellWidth + offsetX;
                    const posY = row * 280 + offsetY;
                    
                    // Container'ı konumla ve etkileşim ekle
                    container.style.paddingBottom = '0';
                    container.style.width = `${Math.min(400, gridCellWidth)}px`;
                    container.style.height = '260px';
                    container.style.position = 'absolute';
                    container.style.left = `${posX}px`;
                    container.style.top = `${posY}px`;
                    
                    // Sonraki pozisyon için kolonları ilerlet
                    col++;
                    if (col >= maxCols) {
                        col = 0;
                        row++;
                    }
                    
                    window.VideoInteractions.enableInteractions(container);
                });
            }
        }
    };
    document.head.appendChild(script);
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

function initTabsFeature() {
    const savedState = localStorage.getItem('tabsFeature') || 'off';
    document.getElementById('tabsFeatureToggle').value = savedState;
    
    if (savedState === 'on') {
        loadVideoInteractionsScript();
    }
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
        
        // TabsFeature özelliği aktifse, farklı davran
        const tabsFeatureActive = localStorage.getItem('tabsFeature') === 'on';
        
        // Eğer TabsFeature aktifse, padding-bottom'u kaldır
        if (tabsFeatureActive) {
            videoContainer.style.paddingBottom = '0';
            videoContainer.style.width = '400px';
            videoContainer.style.height = '260px';
        }
        
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
        
        // Eğer etkileşimler aktifse ve VideoInteractions mevcutsa
        if (tabsFeatureActive && window.VideoInteractions) {
            window.VideoInteractions.enableInteractions(videoContainer);
        }
        
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

// removeVideo fonksiyonunu global olarak erişilebilir yap
window.removeVideo = removeVideo;

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
    initTabsFeature();
    loadVideosFromStorage();
});
