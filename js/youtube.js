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

    if (saveToStorage) {
        saveVideosToStorage();
    }
}

// YouTube video bağlantısından doğru video ID'sini alıyoruz
function extractYouTubeId(url) {
    const patterns = [
        /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/, /// YouTube video formatı
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
    
    container.appendChild(button);
    container.appendChild(iframe);
    
    return container;
}