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
    
    container.innerHTML = `
        <button class="remove-btn" onclick="removeVideo(this.parentElement)">×</button>
        <iframe
            src="https://player.twitch.tv/?channel=${channelName}&parent=${window.location.hostname}"
            frameborder="0"
            allowfullscreen="true"
            scrolling="no"
            height="100%"
            width="100%">
        </iframe>
    `;
    
    return container;
}