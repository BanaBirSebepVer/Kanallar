const videoGrid = document.getElementById('videoGrid');
const addChannelForm = document.getElementById('addChannelForm');
const videos = [];

function extractVideoId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

function addVideo(videoId) {
    const videoContainer = document.createElement('div');
    videoContainer.className = 'video-container';
    
    // Check if URL contains 'live' parameter
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
}

function removeVideo(container) {
    const index = videos.indexOf(container);
    if (index > -1) {
        videos.splice(index, 1);
        container.remove();
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
