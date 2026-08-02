// Twitch video işleme fonksiyonları
function handleTwitchVideo(url, saveToStorage = true) {
    const channelName = extractTwitchChannel(url);
    if (!channelName) {
        alert('Geçersiz Twitch bağlantısı');
        return;
    }

    const container = createTwitchEmbed(channelName);
    videos.push(container);
    videoGrid.appendChild(container);

    if (saveToStorage) {
        saveVideosToStorage();
    }
}

// Twitch kanal adını bağlantıdan çıkarıyoruz
function extractTwitchChannel(url) {
    const match = url.match(/(?:www\.)?twitch\.tv\/([a-zA-Z0-9_]+)/);
    return match ? match[1] : null;
}

// Twitch video gömme işlemini gerçekleştiriyoruz
function createTwitchEmbed(channelName) {
    const container = document.createElement('div');
    container.className = 'video-container';
    
    const button = document.createElement('button');
    button.className = 'remove-btn';
    button.textContent = '×';
    button.onclick = function() {
        removeVideo(this.parentElement);
    };
    
    const iframe = document.createElement('iframe');
    iframe.src = `https://player.twitch.tv/?channel=${encodeURIComponent(channelName)}&parent=${window.location.hostname}`;
    iframe.frameBorder = "0";
    iframe.allowFullscreen = true;
    iframe.scrolling = "no";
    iframe.height = "100%";
    iframe.width = "100%";
    
    container.appendChild(button);
    container.appendChild(iframe);
    
    return container;
}