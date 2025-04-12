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
    
    container.innerHTML = `
        <button class="remove-btn" onclick="removeVideo(this.parentElement)">×</button>
        <iframe
            src="https://player.kick.com/${channelNameKick}"
            frameborder="0"
            allowfullscreen="true"
            scrolling="no"
            height="100%"
            width="100%">
        </iframe>
    `;
    
    return container;
}