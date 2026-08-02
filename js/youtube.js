// YouTube video işleme fonksiyonları
function handleYouTubeVideo(url, saveToStorage = true) {
    const videoId = extractYouTubeId(url);
    if (!videoId) {
        alert('Geçersiz YouTube bağlantısı');
        return;
    }

    const container = createYouTubeEmbed(videoId);
    videos.push(container);
    videoGrid.appendChild(container);

    // Videonun detaylarını (başlık ve kanal adı) çekip iframe'e ekle
    fetchYouTubeDetails(videoId, container.querySelector('iframe'), saveToStorage);
}

// YouTube video bağlantısından doğru video ID'sini alıyoruz
function extractYouTubeId(url) {
    const patterns = [
        /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/, // YouTube video formatı
        /^.*(?:youtube.com\/live\/)([^#&?]*).*/,  // Canlı yayın formatı
        /^.*(?:youtube.com\/shorts\/)([^#&?]*).*/  // YouTube Shorts formatı
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[2]?.length === 11) {
            return match[2];
        } else if (match && match[1]?.length === 11) {
            return match[1];
        }
    }
    return null;
}

// YouTube video gömme işlemini gerçekleştiriyoruz
function createYouTubeEmbed(videoId) {
    const container = document.createElement('div');
    container.className = 'video-container';
    
    const embedType = videoId.toLowerCase().includes('live') ? 'live_stream' : 'embed';
    
    const button = document.createElement('button');
    button.className = 'remove-btn';
    button.textContent = '×';
    button.onclick = function() {
        removeVideo(this.parentElement);
    };
    
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube.com/${embedType}/${encodeURIComponent(videoId)}?autoplay=1&mute=1`;
    iframe.frameBorder = "0";
    iframe.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
    iframe.allowFullscreen = true;
    
    // Geçici olarak bilinmeyen değerleri ata, API'den yanıt gelince bunlar güncellenecek
    iframe.setAttribute('data-title', 'Bilinmeyen Video');
    iframe.setAttribute('data-channel', 'Bilinmeyen Kanal');
    
    container.appendChild(button);
    container.appendChild(iframe);
    
    return container;
}

// YouTube oEmbed API'sini kullanarak video başlığını ve kanal adını çeker
function fetchYouTubeDetails(videoId, iframeElement, saveToStorage) {
    // YouTube'un kendi oembed'i tarayıcıdan (CORS) gelen istekleri 401 ile reddedebilir.
    // Bu yüzden güvenilir ve CORS destekli 'noembed' API'sini kullanıyoruz.
    const apiUrl = `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`;
    
    fetch(apiUrl)
        .then(response => {
            // Eğer sunucu 200 (Başarılı) dışında bir yanıt dönerse hata fırlat ve çökmesini engelle
            if (!response.ok) {
                throw new Error(`Ağ hatası: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // Noembed API'si video gizliyse veya silinmişse 'error' objesi döner
            if (data.error) {
                console.warn('Video detayları alınamadı (Video gizli veya silinmiş olabilir).');
            } else {
                if (data.title) iframeElement.setAttribute('data-title', data.title);
                if (data.author_name) iframeElement.setAttribute('data-channel', data.author_name);
            }
            
            // Bilgiler iframe'e yazıldıktan sonra depolamaya kaydet
            if (saveToStorage) {
                saveVideosToStorage();
            }
        })
        .catch(err => {
            console.error('Video bilgileri çekilemedi:', err);
            // Başlık çekilmese bile videonun (Bilinmeyen Video olarak) kaydedilmesi için çağırıyoruz
            if (saveToStorage) saveVideosToStorage();
        });
}