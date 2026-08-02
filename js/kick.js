// Kick video işleme fonksiyonları
function handleKickVideo(url, saveToStorage = true) {
    const channelNameKick = extractKickChannel(url);
    if (!channelNameKick) {
        alert('Geçersiz Kick bağlantısı');
        return;
    }

    const container = createKickEmbed(channelNameKick);
    videos.push(container);
    videoGrid.appendChild(container);

    if (saveToStorage) {
        saveVideosToStorage();
    }
}

// Kick kanal adını bağlantıdan çıkarıyoruz
function extractKickChannel(url) {
    const match = url.match(/(?:www\.)?kick\.com\/([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
}

// Kick video gömme işlemini gerçekleştiriyoruz
function createKickEmbed(channelNameKick) {
    const container = document.createElement('div');
    container.className = 'video-container';
    
    const button = document.createElement('button');
    button.className = 'remove-btn';
    button.textContent = '×';
    button.onclick = function() {
        removeVideo(this.parentElement);
    };
    
    const iframe = document.createElement('iframe');
    iframe.src = `https://player.kick.com/${encodeURIComponent(channelNameKick)}`;
    iframe.frameBorder = "0";
    iframe.allowFullscreen = true;
    iframe.scrolling = "no";
    iframe.height = "100%";
    iframe.width = "100%";
    
    container.appendChild(button);
    container.appendChild(iframe);
    
    return container;
}