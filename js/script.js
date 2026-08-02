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


// --- GÜVENLİK: URL DOĞRULAMA (CodeQL Sanitize) ---
function getSafeHostname(urlString) {
    try {
        // Kullanıcı "https://" yazmadıysa otomatik ekle
        if (!urlString.startsWith('http://') && !urlString.startsWith('https://')) {
            urlString = 'https://' + urlString;
        }
        const url = new URL(urlString);
        return url.hostname.replace('www.', ''); // www kısmını atarak temiz domaini döndürür
    } catch (e) {
        return ''; // Geçersiz bir URL yapısıysa boş döner
    }
}


// Video bağlantılarını işleme
addChannelForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const videoUrl = document.getElementById('videoUrl').value.trim();

    if (videos.length >= MAX_VIDEOS) {
        alert(`En fazla ${MAX_VIDEOS} ekleyebilirsiniz!`);
        return;
    }

    const hostname = getSafeHostname(videoUrl);
    if (hostname === 'youtube.com' || hostname === 'youtu.be') {
        handleYouTubeVideo(videoUrl);
    } else if (hostname === 'twitch.tv') {
        handleTwitchVideo(videoUrl);
    } else if (hostname === 'kick.com' || hostname === 'player.kick.com') {
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
        const host = getSafeHostname(src);
        if (host === 'kick.com' || host === 'player.kick.com') {
            const channelName = src.split('player.kick.com/')[1];
            return channelName ? `https://kick.com/${channelName}` : null;
        } else if (host === 'youtube.com' || host === 'youtu.be') {
            const videoId = src.match(/embed\/([^?]+)/)?.[1];
            return videoId ? `https://youtube.com/watch?v=${videoId}` : null;
        } else if (host === 'twitch.tv' || host === 'player.twitch.tv') {
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
                const host = getSafeHostname(url);
                        if (host === 'kick.com' || host === 'player.kick.com') handleKickVideo(url, false);
                        else if (host === 'youtube.com' || host === 'youtu.be') handleYouTubeVideo(url, false);
                        else if (host === 'twitch.tv') handleTwitchVideo(url, false);
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
    // Sayfa yüklendiğinde ilk iş oturumu kontrol et
    checkAuthStatus();
    // GitHub'dan sürüm bilgisini çek
    fetchVersionFromGitHub();
    
    // Eğer URL'de liste varsa onu yükle, yoksa localStorage'daki yerel videoları yükle
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('list')) {
        checkSharedListInUrl();
    } else {
        loadVideosFromStorage();
    }
    
    loadSavedBackground();
});


// Google Giriş işlemi tamamlandığında tetiklenen fonksiyon
function handleCredentialResponse(response) {
    const id_token = response.credential;

    fetch('api/api_login.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ credential: id_token })
    })
    .then(res => {
        // Yanıtın JSON olup olmadığını kontrol etmek için önce düz metin (text) olarak alıyoruz
        return res.text().then(text => {
            try {
                // Eğer geçerli bir JSON ise parse et
                return JSON.parse(text);
            } catch (err) {
                // Eğer JSON değilse, PHP tarafında bir hata var demektir! Ekrana PHP hatasını bas.
                console.error("PHP'den gelen hatalı yanıt:", text);
                throw new Error("Sunucudan JSON formatında olmayan bir yanıt geldi. Lütfen konsolu (F12) kontrol edin.");
            }
        });
    })
    .then(data => {
        if (data.status === 'success') {
            console.log('Sisteme giriş başarılı.');
            syncHistoryToCloud();
            document.querySelector('.g_id_signin').style.display = 'none';
            checkAuthStatus(); // Durumu güncelle
        } else {
            alert('Giriş yapılamadı: ' + data.message);
        }
    })
    .catch(err => {
        alert('Sunucu bağlantı hatası: ' + err.message);
        console.error('Detaylı Hata:', err);
    });
}

// Yerel geçmişi (localStorage) buluta eşitleme fonksiyonu
function syncHistoryToCloud() {
    const savedVideos = localStorage.getItem('videos');
    if (!savedVideos) return; // Yerelde geçmiş yoksa işlem yapma

    fetch('api/api_sync_history.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ history: JSON.parse(savedVideos) })
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success') {
            console.log('Yerel geçmişiniz başarıyla buluta aktarıldı.');
        } else {
            console.error('Senkronizasyon hatası:', data.message);
        }
    });
}


// URL'de "list" parametresi olup olmadığını kontrol eden ve listeyi yükleyen fonksiyon
function checkSharedListInUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const listId = urlParams.get('list');

    if (listId) {
        fetch(`api/api_get_list.php?id=${listId}`)
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success') {
                    // Mevcut videoları temizle
                    videos = [];
                    videoGrid.innerHTML = ''; 
                    
                    // Gelen JSON dizisindeki videoları ekrana bas
                    data.data.forEach(url => {
                        const host = getSafeHostname(url);
                        if (host === 'kick.com' || host === 'player.kick.com') handleKickVideo(url, false);
                        else if (host === 'youtube.com' || host === 'youtu.be') handleYouTubeVideo(url, false);
                        else if (host === 'twitch.tv' || host === 'player.twitch.tv') handleTwitchVideo(url, false);
                    });

                    // Görüntülenme sayısını artırmak (Anti-spam kurallarıyla) için sunucuya bildir
                    recordListView(listId);
                } else {
                    alert('Hata: ' + data.message);
                }
            })
            .catch(err => console.error('Liste yüklenirken hata:', err));
    }
}

// Listeye girildiğinde görüntülenmeyi tetikleyen fonksiyon
function recordListView(listId) {
    fetch('api/api_view.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ list_id: listId })
    });
}

// Kullanıcıyı çıkış yaptıran fonksiyon
function logoutUser() {
    fetch('api/api_logout.php')
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                console.log('Başarıyla çıkış yapıldı.');
                // Giriş butonunu tekrar görünür yap
                const signinBtn = document.querySelector('.g_id_signin');
                if (signinBtn) signinBtn.style.display = 'block';
                
                // İsteğe bağlı: Çıkış yapınca sayfayı yenile
                window.location.reload();
            }
        });
}



// --- LİSTE PAYLAŞMA FONKSİYONU ---
function shareCurrentList() {
    // Ekranda video yoksa uyarı ver
    const iframes = document.querySelectorAll('.video-container iframe');
    if (iframes.length === 0) {
        alert('Paylaşılacak bir video bulunamadı. Lütfen önce video ekleyin.');
        return;
    }

    // İframe'lerden URL'leri topla
    const currentVideos = Array.from(iframes).map(iframe => {
        const src = iframe.getAttribute('src');
        const host = getSafeHostname(src);
        if (host === 'kick.com' || host === 'player.kick.com') return `https://kick.com/${src.split('player.kick.com/')[1]}`;
        if (host === 'youtube.com' || host === 'youtu.be') return `https://youtube.com/watch?v=${src.match(/embed\/([^?]+)/)?.[1]}`;
        if (host === 'twitch.tv' || host === 'player.twitch.tv') return `https://twitch.tv/${src.match(/channel=([^&]+)/)?.[1]}`;
        return null;
    }).filter(url => url !== null);

    // API'ye gönder
    fetch('api/api_share.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videos: currentVideos })
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success') {
            const shareUrl = `${window.location.origin}${window.location.pathname}?list=${data.list_id}`;
            
            // Panoya otomatik kopyalama (Modern Tarayıcılar İçin)
            navigator.clipboard.writeText(shareUrl).then(() => {
                alert('Liste bağlantısı başarıyla kopyalandı:\n' + shareUrl);
            }).catch(err => {
                // Eğer pano kopyalaması başarısız olursa manuel kopya için ekranda göster
                prompt('Bağlantıyı kopyalamak için Ctrl+C / Cmd+C yapın:', shareUrl);
            });
        } else {
            alert('Paylaşım hatası: ' + data.message);
        }
    })
    .catch(err => console.error('Paylaşım işleminde hata:', err));
}

// --- LİDER TABLOSU FONKSİYONLARI ---
function showLeaderboard() {
    const modal = document.getElementById('leaderboardModal');
    const listElement = document.getElementById('leaderboardList');
    
    // Yükleniyor uyarısı
    listElement.innerHTML = '<li>Veriler yükleniyor...</li>';
    modal.style.display = 'block';

    fetch('api/api_leaderboard.php')
        .then(res => res.json())
        .then(data => {
            listElement.innerHTML = ''; // Temizle
            
            if (data.status === 'success' && data.data.length > 0) {
                data.data.forEach((item, index) => {
                    const li = document.createElement('li');
                    const link = `${window.location.origin}${window.location.pathname}?list=${item.List_ID}`;
                    li.innerHTML = `
                        <span><strong>#${index + 1}</strong> <a href="${link}">Liste: ${item.List_ID.substring(0,8)}...</a></span>
                        <span>👁️ ${item.Total_Views} İzlenme</span>
                    `;
                    listElement.appendChild(li);
                });
            } else {
                listElement.innerHTML = '<li>Henüz yeterli veri yok.</li>';
            }
        })
        .catch(err => {
            listElement.innerHTML = '<li>Tablo yüklenirken bir hata oluştu.</li>';
            console.error('Lider tablosu hatası:', err);
        });
}

function closeLeaderboard() {
    document.getElementById('leaderboardModal').style.display = 'none';
}

// Modal dışına tıklandığında pencereyi kapatma özelliği
window.onclick = function(event) {
    const modal = document.getElementById('leaderboardModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}


// Oturum durumunu kontrol edip butonları düzenleyen fonksiyon
function checkAuthStatus() {
    fetch('api/api_check_auth.php')
        .then(res => res.json())
        .then(data => {
            const signinBtn = document.querySelector('.g_id_signin');
            const logoutBtn = document.getElementById('logoutBtn');
            
            if (data.logged_in) {
                // Giriş yapılmışsa Google butonunu gizle, Çıkış butonunu göster
                if (signinBtn) signinBtn.style.display = 'none';
                if (logoutBtn) logoutBtn.style.display = 'flex';
            } else {
                // Giriş yapılmamışsa tam tersi
                if (signinBtn) signinBtn.style.display = 'block';
                if (logoutBtn) logoutBtn.style.display = 'none';
            }
        })
        .catch(err => console.error('Oturum kontrol hatası:', err));
}



// --- DİNAMİK VERSİYON ÇEKME FONKSİYONU ---
function fetchVersionFromGitHub() {
    const repoOwner = 'BanaBirSebepVer'; 
    const repoName = 'Kanallar';
    const branch = 'main'; 

    fetch(`https://api.github.com/repos/${repoOwner}/${repoName}/commits/${branch}`)
        .then(res => {
            if (!res.ok) throw new Error('Commit bilgisi bulunamadı');
            return res.json();
        })
        .then(data => {
            if (data.sha && data.html_url) {
                const versionElement = document.getElementById('appVersion');
                if (versionElement) {
                    const shortSha = data.sha.substring(0, 7);
                    // Metni <a> etiketiyle sararak tıklanabilir hale getiriyoruz
                    versionElement.innerHTML = `<a href="${data.html_url}" target="_blank" style="color: inherit; text-decoration: none; border-bottom: 1px dashed currentColor;">Versiyon ${shortSha}</a>`; 
                }
            }
        })
        .catch(err => {
            console.error('GitHub API Hatası:', err);
        });
}