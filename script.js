const videoGrid = document.getElementById('videoGrid');
const addChannelForm = document.getElementById('addChannelForm');
const videos = [];

function saveVideosToStorage(videos) {
    const videoIds = Array.from(videos).map(container => {
        const iframe = container.querySelector('iframe');
        const src = iframe.getAttribute('src');
        return src.split('/').pop();
    });
    document.cookie = `savedVideos=${JSON.stringify(videoIds)}; expires=Fri, 31 Dec 9999 23:59:59 GMT; path=/`;
}

function loadVideosFromStorage() {
    const cookie = document.cookie.split('; ').find(row => row.startsWith('savedVideos='));
    if (cookie) {
        const videoIds = JSON.parse(cookie.split('=')[1]);
        videoIds.forEach(videoId => addVideo(videoId, false));
    }
}

function extractVideoId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

function addVideo(videoId, shouldSave = true) {
    const videoContainer = document.createElement('div');
    videoContainer.className = 'video-container';
    
    const embedType = videoId.toLowerCase().includes('live') ? 'live_stream' : 'embed';
    
    videoContainer.innerHTML = `
        <button class="remove-btn" onclick="removeVideo(this.parentElement)">×</button>
        <iframe
            src="https://www.youtube.com/${embedType}/${videoId}"
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
}

function removeVideo(container) {
    const index = videos.indexOf(container);
    if (index > -1) {
        videos.splice(index, 1);
        container.remove();
        saveVideosToStorage(videos);
    }
}

addChannelForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const videoUrl = document.getElementById('videoUrl').value;
    const videoId = extractVideoId(videoUrl);
    
    if (videoId) {
        addVideo(videoId);
        document.getElementById('videoUrl').value = '';
    } else {
        alert("Lütfen geçerli bir YouTube URL'si girin.");
    }
});

// Load saved videos when the page loads
document.addEventListener('DOMContentLoaded', loadVideosFromStorage);
