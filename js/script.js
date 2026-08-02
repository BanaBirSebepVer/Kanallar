// Temel değişkenler ve sabitler
const videoGrid = document.getElementById('videoGrid');
const addChannelForm = document.getElementById('addChannelForm');
const MAX_VIDEOS = 12;
let videos = [];
let isAuthenticated = false;

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
}

function getSafeHostname(urlString) {
    try {
        if (!urlString.startsWith('http://') && !urlString.startsWith('https://')) {
            urlString = 'https://' + urlString;
        }
        const url = new URL(urlString);
        return url.hostname.replace('www.', ''); 
    } catch (e) {
        return ''; 
    }
}

addChannelForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const videoUrl = document.getElementById('videoUrl').value.trim();

    if (videos.length >= MAX_VIDEOS) {
        alert(`En fazla ${MAX_VIDEOS} ekleyebilirsiniz!`);
        return;
    }

    const hostname = getSafeHostname(videoUrl);
    let isAdded = false;

    if (hostname === 'youtube.com' || hostname === 'youtu.be') {
        handleYouTubeVideo(videoUrl);
        isAdded = true;
    } else if (hostname === 'twitch.tv') {
        handleTwitchVideo(videoUrl);
        isAdded = true;
    } else if (hostname === 'kick.com' || hostname === 'player.kick.com') {
        handleKickVideo(videoUrl);
        isAdded = true;
    } else {
        alert('Lütfen geçerli bir YouTube, Twitch veya Kick bağlantısı ekleyin');
    }

    // Video başarılı bir şekilde eklendiyse ve kullanıcı giriş yaptıysa geçmişe kaydet
    if (isAdded) {
        addVideoToCloudHistory(videoUrl);
    }

    document.getElementById('videoUrl').value = '';
});

// Yalnızca eklenen videoyu db'ye yazar
function addVideoToCloudHistory(videoUrl) {
    if (!isAuthenticated) return;
    
    fetch('api/api_sync_history.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history: [videoUrl] })
    }).catch(err => console.error('Geçmişe eklenirken hata oluştu:', err));
}

function removeVideo(container) {
    const index = videos.indexOf(container);
    if (index > -1) {
        videos.splice(index, 1);
        container.remove();
        saveVideosToStorage();
    }
}

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
            videos = []; 
            videoGrid.innerHTML = ''; 
            const items = JSON.parse(savedVideos);
            
            items.forEach(item => {
                const url = typeof item === 'string' ? item : item.url;
                if (!url) return;
                
                const host = getSafeHostname(url);
                if (host === 'kick.com' || host === 'player.kick.com') handleKickVideo(url, false);
                else if (host === 'youtube.com' || host === 'youtu.be') handleYouTubeVideo(url, false);
                else if (host === 'twitch.tv') handleTwitchVideo(url, false);
            });
        }
    } catch (error) {
        console.error('Videolar yüklenirken hata oluştu:', error);
        localStorage.removeItem('videos'); 
    }
}

const DEFAULT_BACKGROUND = 'imaj/background.png'; 
const bgUploadBtn = document.getElementById('bgUploadBtn'); 
const resetBgBtn = document.getElementById('resetBgBtn'); 
const bgImageUpload = document.getElementById('bgImageUpload'); 

bgUploadBtn.addEventListener('click', () => {
    bgImageUpload.click(); 
});

bgImageUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader(); 
        reader.onload = (e) => {
            const imageData = e.target.result;
            document.body.style.backgroundImage = `url(${imageData})`;
            localStorage.setItem('backgroundImage', imageData);
        };
        reader.readAsDataURL(file);
    }
});

resetBgBtn.addEventListener('click', () => {
    document.body.style.backgroundImage = `url(${DEFAULT_BACKGROUND})`;
    localStorage.removeItem('backgroundImage');
});

function loadSavedBackground() {
    const savedBg = localStorage.getItem('backgroundImage');
    if (savedBg) { 
        document.body.style.backgroundImage = `url(${savedBg})`;
    } else { 
        document.body.style.backgroundImage = `url(${DEFAULT_BACKGROUND})`;
    }
}

window.addEventListener('DOMContentLoaded', () => {
    initTheme();
    checkAuthStatus();
    fetchVersionFromGitHub();
    
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('list')) {
        checkSharedListInUrl();
    } else {
        loadVideosFromStorage();
    }
    
    loadSavedBackground();
});

function handleCredentialResponse(response) {
    const id_token = response.credential;

    fetch('api/api_login.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: id_token })
    })
    .then(res => res.text().then(text => {
        try {
            return JSON.parse(text);
        } catch (err) {
            console.error("PHP'den gelen hatalı yanıt:", text);
            throw new Error("Sunucudan JSON formatında olmayan bir yanıt geldi.");
        }
    }))
    .then(data => {
        if (data.status === 'success') {
            console.log('Sisteme giriş başarılı.');
            document.querySelector('.g_id_signin').style.display = 'none';
            checkAuthStatus(); 
        } else {
            alert('Giriş yapılamadı: ' + data.message);
        }
    })
    .catch(err => {
        alert('Sunucu bağlantı hatası: ' + err.message);
        console.error('Detaylı Hata:', err);
    });
}

function checkSharedListInUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    const listId = urlParams.get('list');

    if (listId) {
        fetch(`api/api_get_list.php?id=${listId}`)
            .then(res => res.json())
            .then(data => {
                if (data.status === 'success') {
                    videos = [];
                    videoGrid.innerHTML = ''; 
                    
                    data.data.forEach(url => {
                        const host = getSafeHostname(url);
                        if (host === 'kick.com' || host === 'player.kick.com') handleKickVideo(url, false);
                        else if (host === 'youtube.com' || host === 'youtu.be') handleYouTubeVideo(url, false);
                        else if (host === 'twitch.tv' || host === 'player.twitch.tv') handleTwitchVideo(url, false);
                    });

                    recordListView(listId);
                } else {
                    alert('Hata: ' + data.message);
                }
            })
            .catch(err => console.error('Liste yüklenirken hata:', err));
    }
}

function recordListView(listId) {
    fetch('api/api_view.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ list_id: listId })
    });
}

function logoutUser() {
    fetch('api/api_logout.php')
        .then(res => res.json())
        .then(data => {
            if (data.status === 'success') {
                console.log('Başarıyla çıkış yapıldı.');
                const signinBtn = document.querySelector('.g_id_signin');
                if (signinBtn) signinBtn.style.display = 'block';
                window.location.reload();
            }
        });
}

function shareCurrentList() {
    const iframes = document.querySelectorAll('.video-container iframe');
    if (iframes.length === 0) {
        alert('Paylaşılacak bir video bulunamadı. Lütfen önce video ekleyin.');
        return;
    }

    const currentVideos = Array.from(iframes).map(iframe => {
        const src = iframe.getAttribute('src');
        const host = getSafeHostname(src);
        if (host === 'kick.com' || host === 'player.kick.com') return `https://kick.com/${src.split('player.kick.com/')[1]}`;
        if (host === 'youtube.com' || host === 'youtu.be') return `https://youtube.com/watch?v=${src.match(/embed\/([^?]+)/)?.[1]}`;
        if (host === 'twitch.tv' || host === 'player.twitch.tv') return `https://twitch.tv/${src.match(/channel=([^&]+)/)?.[1]}`;
        return null;
    }).filter(url => url !== null);

    fetch('api/api_share.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videos: currentVideos })
    })
    .then(res => res.json())
    .then(data => {
        if (data.status === 'success') {
            const shareUrl = `${window.location.origin}${window.location.pathname}?list=${data.list_id}`;
            navigator.clipboard.writeText(shareUrl).then(() => {
                alert('Liste bağlantısı başarıyla kopyalandı:\n' + shareUrl);
            }).catch(err => {
                prompt('Bağlantıyı kopyalamak için Ctrl+C / Cmd+C yapın:', shareUrl);
            });
        } else {
            alert('Paylaşım hatası: ' + data.message);
        }
    })
    .catch(err => console.error('Paylaşım işleminde hata:', err));
}

function showLeaderboard() {
    const modal = document.getElementById('leaderboardModal');
    const listElement = document.getElementById('leaderboardList');
    
    listElement.innerHTML = '<li>Veriler yükleniyor...</li>';
    modal.style.display = 'block';

    fetch('api/api_leaderboard.php')
        .then(res => res.json())
        .then(data => {
            listElement.innerHTML = ''; 
            
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

// --- GEÇMİŞ SİDEBAR FONKSİYONLARI ---
function showHistorySidebar() {
    const sidebar = document.getElementById('historySidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const listElement = document.getElementById('historyList');
    
    // Yükleniyor durumu
    listElement.innerHTML = '<li style="justify-content: center; padding: 20px;">Geçmiş yükleniyor...</li>';
    
    // Sidebar'ı ve Örtüyü göster
    sidebar.classList.add('open');
    overlay.style.display = 'block';

    fetch('api/api_get_history.php')
        .then(res => res.json())
        .then(data => {
            listElement.innerHTML = ''; 
            
            if (data.status === 'success' && data.data.length > 0) {
                data.data.forEach(item => {
                    const li = document.createElement('li');
                    li.innerHTML = `
                        <div style="flex: 1; margin-right: 15px;">
                            <strong style="font-size: 1.1rem; display: block; margin-bottom: 5px;">${item.Video_Title}</strong>
                            <small style="color: gray;">Kanal: ${item.Channel_Name} | Platform: ${item.Platform}</small><br>
                            <a href="${item.Video_URL}" target="_blank" style="font-size: 13px; color: #007bff; text-decoration: none; word-break: break-all;">${item.Video_URL}</a>
                        </div>
                        <span style="font-size: 12px; color: #888; min-width: 110px; text-align: right;">${item.Added_At}</span>
                    `;
                    listElement.appendChild(li);
                });
            } else {
                listElement.innerHTML = '<li style="justify-content: center; color: gray;">Henüz kayıtlı geçmişiniz yok.</li>';
            }
        })
        .catch(err => {
            listElement.innerHTML = '<li style="color: #ff4d4d;">Geçmiş yüklenirken bir hata oluştu.</li>';
            console.error('Geçmiş hatası:', err);
        });
}

function closeHistorySidebar() {
    const sidebar = document.getElementById('historySidebar');
    const overlay = document.getElementById('sidebarOverlay');
    
    sidebar.classList.remove('open');
    // Animasyonun bitmesini bekleyip overlay'i gizle
    setTimeout(() => {
        overlay.style.display = 'none';
    }, 300);
}

// Lider tablosu modalı için tıklama kontrolü (Geçmiş modalı kaldırıldı)
window.onclick = function(event) {
    const leaderboardModal = document.getElementById('leaderboardModal');
    if (event.target === leaderboardModal) {
        leaderboardModal.style.display = 'none';
    }
};

// Oturum durumu kontrolü (Sadece historyBtn onclick fonksiyonunu güncelledik)
function checkAuthStatus() {
    fetch('api/api_check_auth.php')
        .then(res => res.json())
        .then(data => {
            const signinBtn = document.querySelector('.g_id_signin');
            const logoutBtn = document.getElementById('logoutBtn');
            const historyBtn = document.getElementById('historyBtn');
            
            isAuthenticated = data.logged_in; 
            
            // Eğer butonda eski onclick varsa onu yeni fonksiyonla değiştirelim
            if (historyBtn) historyBtn.onclick = showHistorySidebar;
            
            if (data.logged_in) {
                if (signinBtn) signinBtn.style.display = 'none';
                if (logoutBtn) logoutBtn.style.display = 'flex';
                if (historyBtn) historyBtn.style.display = 'flex'; 
            } else {
                if (signinBtn) signinBtn.style.display = 'block';
                if (logoutBtn) logoutBtn.style.display = 'none';
                if (historyBtn) historyBtn.style.display = 'none'; 
            }
        })
        .catch(err => console.error('Oturum kontrol hatası:', err));
}

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
                    versionElement.innerHTML = `<a href="${data.html_url}" target="_blank" style="color: inherit; text-decoration: none; border-bottom: 1px dashed currentColor;">Versiyon ${shortSha}</a>`; 
                }
            }
        })
        .catch(err => {
            console.error('GitHub API Hatası:', err);
        });
}