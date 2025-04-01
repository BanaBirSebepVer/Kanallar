// Video Interactions Module
// Bu modül, video bileşenlerinin sürükleme ve boyutlandırma işlemlerini yönetir

// Video boyut yapılandırması
const VideoConfig = {
    MIN_WIDTH: 250,   // Minimum genişlik (piksel)
    MIN_HEIGHT: 140,  // Minimum yükseklik (piksel)
    MAX_WIDTH: 1600,  // Maksimum genişlik (piksel)
    MAX_HEIGHT: 900   // Maksimum yükseklik (piksel)
};

// Video Etkileşimleri Modülü
const VideoInteractions = (function() {
    // Private değişkenler
    let videos = [];
    let videoGrid = null;
    let saveVideosCallback = null;
    let isEnabled = false; // Varsayılan olarak devre dışı
    
    // Sürükleme için değişkenler
    let isDragging = false;
    let currentDragElement = null;
    let initialX = 0;
    let initialY = 0;
    let initialLeft = 0;
    let initialTop = 0;
    
    // Public API
    return {
        // Modülü başlat
        init: function(videosArray, grid, saveCallback, enabled = true) {
            videos = videosArray;
            videoGrid = grid;
            saveVideosCallback = saveCallback;
            isEnabled = enabled;
            
            // Durumu al
            const featureState = localStorage.getItem('tabsFeature') || 'off';
            isEnabled = featureState === 'on';
            
            // Pencere boyutu değişikliğini izle
            window.addEventListener('resize', this.handleWindowResize);
            
            // Mevcut durum bilgisini güncelle
            if (document.getElementById('tabsFeatureToggle')) {
                document.getElementById('tabsFeatureToggle').value = featureState;
            }
        },
        
        // Video etkileşimlerini etkinleştir
        enableInteractions: function(videoContainer) {
            if (!videoContainer || videoContainer.hasInteractionsEnabled) return;
            
            // Pozisyon ve boyut stil eklemeleri - bu kritik
            videoContainer.style.position = 'absolute';
            videoContainer.style.paddingBottom = '0';
            
            // İlk pozisyon hesapla
            const containerRect = videoContainer.getBoundingClientRect();
            const gridRect = videoGrid.getBoundingClientRect();
            const left = videoContainer.style.left || '0';
            const top = videoContainer.style.top || '0';
            
            videoContainer.style.left = left;
            videoContainer.style.top = top;
            
            // Header ekle (eğer yoksa)
            let header = videoContainer.querySelector('.video-header');
            if (!header) {
                header = document.createElement('div');
                header.className = 'video-header';
                header.innerHTML = '<div class="window-controls"><span class="window-control close"></span><span class="window-control minimize"></span><span class="window-control maximize"></span></div>';
                videoContainer.prepend(header);
                
                // Pencere kontrol butonu işlevsellikleri
                const closeButton = header.querySelector('.window-control.close');
                if (closeButton) {
                    closeButton.addEventListener('click', (e) => {
                        e.stopPropagation();
                        // Pencere kapama işlevi - videoyu kaldır
                        const container = e.target.closest('.video-container');
                        if (container && typeof window.removeVideo === 'function') {
                            window.removeVideo(container);
                        }
                    });
                }
                
                const maximizeButton = header.querySelector('.window-control.maximize');
                if (maximizeButton) {
                    maximizeButton.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const container = e.target.closest('.video-container');
                        
                        // Eğer zaten maksimize edilmişse normal boyuta döndür
                        if (container.classList.contains('maximized')) {
                            container.classList.remove('maximized');
                            container.style.width = container.dataset.prevWidth || '400px';
                            container.style.height = container.dataset.prevHeight || '260px';
                            container.style.left = container.dataset.prevLeft || '0';
                            container.style.top = container.dataset.prevTop || '0';
                        } else {
                            // Önceki boyut ve pozisyonları kaydet
                            container.dataset.prevWidth = container.style.width;
                            container.dataset.prevHeight = container.style.height;
                            container.dataset.prevLeft = container.style.left;
                            container.dataset.prevTop = container.style.top;
                            
                            // Tam ekran yap
                            const gridRect = videoGrid.getBoundingClientRect();
                            container.classList.add('maximized');
                            container.style.width = `${gridRect.width}px`;
                            container.style.height = `${gridRect.height}px`;
                            container.style.left = '0';
                            container.style.top = '0';
                        }
                        
                        if (saveVideosCallback) {
                            saveVideosCallback(videos);
                        }
                    });
                }
                
                const minimizeButton = header.querySelector('.window-control.minimize');
                if (minimizeButton) {
                    minimizeButton.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const container = e.target.closest('.video-container');
                        
                        // Minimize işlevi - şimdilik sadece küçült
                        if (container.classList.contains('minimized')) {
                            container.classList.remove('minimized');
                            container.style.height = container.dataset.prevHeight || '260px';
                        } else {
                            container.dataset.prevHeight = container.style.height;
                            container.classList.add('minimized');
                            container.style.height = '36px'; // Sadece başlık göster
                        }
                        
                        if (saveVideosCallback) {
                            saveVideosCallback(videos);
                        }
                    });
                }
            }
            
            // Resize handle ekle
            let resizeHandle = videoContainer.querySelector('.resize-handle');
            if (!resizeHandle) {
                resizeHandle = document.createElement('div');
                resizeHandle.className = 'resize-handle';
                resizeHandle.innerHTML = '<div class="resize-icon"><span></span><span></span><span></span></div>';
                videoContainer.appendChild(resizeHandle);
            }
            
            // Sürükleme işlevini ekle
            header.addEventListener('mousedown', this.startDrag.bind(this));
            header.addEventListener('touchstart', this.startDragTouch.bind(this));
            
            // Aktif video işaretleme
            videoContainer.addEventListener('mousedown', this.activateVideo);
            videoContainer.addEventListener('touchstart', this.activateVideo);
            
            // Boyut değişimi izleme ve kaydetme işlevi
            this.setupResizeMonitoring(videoContainer);
            
            // Container'dan no-interactions sınıfını kaldır
            videoContainer.classList.remove('no-interactions');
            videoContainer.classList.add('app-window');
            
            // İşaretçi ekle
            videoContainer.hasInteractionsEnabled = true;
        },
        
        // Video etkileşimlerini devre dışı bırak
        disableInteractions: function(videoContainer) {
            if (!videoContainer || !videoContainer.hasInteractionsEnabled) return;
            
            // Temizlik işlemlerini yap
            this.cleanupVideoResources(videoContainer);
            
            // Container'a no-interactions sınıfını ekle
            videoContainer.classList.add('no-interactions');
            videoContainer.classList.remove('app-window');
            
            // Resize handle ve header'ı kaldır
            const header = videoContainer.querySelector('.video-header');
            const resizeHandle = videoContainer.querySelector('.resize-handle');
            
            if (header) header.remove();
            if (resizeHandle) resizeHandle.remove();
            
            // İşaretçiyi kaldır
            videoContainer.hasInteractionsEnabled = false;
        },
        
        // Etkileşim durumunu değiştir
        setEnabled: function(enabled) {
            isEnabled = enabled;
            
            if (videos && videos.length > 0) {
                videos.forEach(container => {
                    if (enabled) {
                        this.enableInteractions(container);
                    } else {
                        this.disableInteractions(container);
                    }
                });
            }
        },
        
        // Etkileşim durumunu döndür
        isEnabled: function() {
            return isEnabled;
        },
        
        // Video etkileşimlerini ayarla (geriye uyumluluk için)
        setupVideoInteractions: function(videoContainer) {
            this.enableInteractions(videoContainer);
        },
        
        // Pencere boyut değişimlerini yönet
        handleWindowResize: function() {
            // Ekran boyutuna göre dinamik sınırlar belirle
            const vw = window.innerWidth;
            const vh = window.innerHeight;
            
            // Tarayıcının %80'ini geçmeyecek şekilde maksimum boyut belirle
            const dynamicMaxWidth = Math.min(VideoConfig.MAX_WIDTH, vw * 0.8);
            const dynamicMaxHeight = Math.min(VideoConfig.MAX_HEIGHT, vh * 0.8);
            
            // Tüm videoları kontrol et ve taşanları sınırlar içine al
            videos.forEach(container => {
                const rect = container.getBoundingClientRect();
                const gridRect = videoGrid.getBoundingClientRect();
                
                // Taşma kontrolü
                if (rect.right > gridRect.right) {
                    container.style.left = `${gridRect.width - rect.width}px`;
                }
                
                if (rect.bottom > gridRect.bottom) {
                    container.style.top = `${gridRect.height - rect.height}px`;
                }
                
                // Çok büyük videoları ekrana sığdır
                if (rect.width > dynamicMaxWidth) {
                    container.style.width = `${dynamicMaxWidth}px`;
                }
                
                if (rect.height > dynamicMaxHeight) {
                    container.style.height = `${dynamicMaxHeight}px`;
                }
                
                // Min-max sınırları güncelle
                container.style.maxWidth = `${dynamicMaxWidth}px`;
                container.style.maxHeight = `${dynamicMaxHeight}px`;
            });
        },
        
        // Videoyu aktif hale getir (öne getir)
        activateVideo: function(e) {
            // Resize handle veya header tıklamalarında zaten işlem yapılacak
            if (e.target.classList.contains('resize-handle') || 
                e.target.classList.contains('video-header') || 
                e.target.classList.contains('remove-btn')) {
                return;
            }
            
            // Tüm videoların active sınıfını kaldır
            videos.forEach(v => v.classList.remove('active'));
            
            // Bu videoyu aktif yap
            this.classList.add('active');
        },
        
        // Sürüklemeyi başlatma fonksiyonu
        startDrag: function(e) {
            if (!isEnabled) return;
            
            e.preventDefault();
            
            // Sürükleme işlemini başlat
            isDragging = true;
            currentDragElement = e.target.closest('.video-container');
            currentDragElement.classList.add('dragging');
            
            // İlk konumu kaydet
            initialX = e.clientX;
            initialY = e.clientY;
            initialLeft = parseFloat(currentDragElement.style.left) || 0;
            initialTop = parseFloat(currentDragElement.style.top) || 0;
            
            // Absolute pozisyon kontrolü
            if (!currentDragElement.style.position || currentDragElement.style.position !== 'absolute') {
                currentDragElement.style.position = 'absolute';
            }
            
            // Tüm videoların active sınıfını kaldır ve bu videoyu aktif yap
            videos.forEach(v => v.classList.remove('active'));
            currentDragElement.classList.add('active');
            
            // Event listener'ları ekle
            document.addEventListener('mousemove', this.dragElement.bind(this));
            document.addEventListener('mouseup', this.stopDrag.bind(this));
        },
        
        // Dokunmatik cihazlar için sürüklemeyi başlatma fonksiyonu
        startDragTouch: function(e) {
            if (!isEnabled) return;
            
            e.preventDefault();
            
            // Sürükleme işlemini başlat
            isDragging = true;
            currentDragElement = e.target.closest('.video-container');
            currentDragElement.classList.add('dragging');
            
            // İlk konumu kaydet
            initialX = e.touches[0].clientX;
            initialY = e.touches[0].clientY;
            initialLeft = parseFloat(currentDragElement.style.left) || 0;
            initialTop = parseFloat(currentDragElement.style.top) || 0;
            
            // Absolute pozisyon kontrolü
            if (!currentDragElement.style.position || currentDragElement.style.position !== 'absolute') {
                currentDragElement.style.position = 'absolute';
            }
            
            // Tüm videoların active sınıfını kaldır ve bu videoyu aktif yap
            videos.forEach(v => v.classList.remove('active'));
            currentDragElement.classList.add('active');
            
            // Event listener'ları ekle
            document.addEventListener('touchmove', this.dragElementTouch.bind(this));
            document.addEventListener('touchend', this.stopDragTouch.bind(this));
        },
        
        // Sürükleme fonksiyonu
        dragElement: function(e) {
            if (!isDragging || !isEnabled) return;
            
            // Yeni konumu hesapla
            const dx = e.clientX - initialX;
            const dy = e.clientY - initialY;
            
            // Container sınırları
            const containerRect = videoGrid.getBoundingClientRect();
            
            // Video element boyutları
            const videoRect = currentDragElement.getBoundingClientRect();
            
            // Sınırları belirle (containerın dışına çıkmasını engelle)
            const newLeft = Math.min(
                Math.max(initialLeft + dx, 0),
                containerRect.width - videoRect.width
            );
            
            const newTop = Math.min(
                Math.max(initialTop + dy, 0),
                containerRect.height - videoRect.height
            );
            
            // Container'ın konumunu güncelle
            currentDragElement.style.left = `${newLeft}px`;
            currentDragElement.style.top = `${newTop}px`;
        },
        
        // Dokunmatik cihazlar için sürükleme fonksiyonu
        dragElementTouch: function(e) {
            if (!isDragging || !isEnabled) return;
            
            // Yeni konumu hesapla
            const dx = e.touches[0].clientX - initialX;
            const dy = e.touches[0].clientY - initialY;
            
            // Container sınırları
            const containerRect = videoGrid.getBoundingClientRect();
            
            // Video element boyutları
            const videoRect = currentDragElement.getBoundingClientRect();
            
            // Sınırları belirle (containerın dışına çıkmasını engelle)
            const newLeft = Math.min(
                Math.max(initialLeft + dx, 0),
                containerRect.width - videoRect.width
            );
            
            const newTop = Math.min(
                Math.max(initialTop + dy, 0),
                containerRect.height - videoRect.height
            );
            
            // Container'ın konumunu güncelle
            currentDragElement.style.left = `${newLeft}px`;
            currentDragElement.style.top = `${newTop}px`;
        },
        
        // Sürüklemeyi durdurma fonksiyonu
        stopDrag: function() {
            if (isDragging && isEnabled) {
                currentDragElement.classList.remove('dragging');
                isDragging = false;
                
                // Event listener'ları kaldır
                document.removeEventListener('mousemove', this.dragElement.bind(this));
                document.removeEventListener('mouseup', this.stopDrag.bind(this));
                
                // Video konumlarını kaydet
                saveVideosCallback(videos);
            }
        },
        
        // Dokunmatik cihazlar için sürüklemeyi durdurma fonksiyonu
        stopDragTouch: function() {
            if (isDragging && isEnabled) {
                currentDragElement.classList.remove('dragging');
                isDragging = false;
                
                // Event listener'ları kaldır
                document.removeEventListener('touchmove', this.dragElementTouch.bind(this));
                document.removeEventListener('touchend', this.stopDragTouch.bind(this));
                
                // Video konumlarını kaydet
                saveVideosCallback(videos);
            }
        },
        
        // Boyut değişimi tamamlandığında video konumunu kaydet
        saveVideoSizeAndPosition: function() {
            if (isEnabled) {
                saveVideosCallback(videos);
            }
        },
        
        // Video kaynakları temizle
        cleanupVideoResources: function(container) {
            // ResizeObserver'ı temizle
            if (container.resizeObserver) {
                container.resizeObserver.disconnect();
                delete container.resizeObserver;
            }
            
            // Event listener'ları temizle
            const header = container.querySelector('.video-header');
            const resizeHandle = container.querySelector('.resize-handle');
            const rightEdge = container.querySelector('.edge-right');
            const bottomEdge = container.querySelector('.edge-bottom');
            
            // Tüm özel eklenen elementleri temizle
            if (header) header.remove();
            if (resizeHandle) resizeHandle.remove();
            if (rightEdge) rightEdge.remove();
            if (bottomEdge) bottomEdge.remove();
            
            // Timeout'ları temizle
            if (container.resizeTimeout) {
                clearTimeout(container.resizeTimeout);
                delete container.resizeTimeout;
            }
            
            // Özel stilleri temizle
            container.style.position = '';
            container.style.width = '';
            container.style.height = '';
            
            // TabsFeature inaktifse, orijinal haline geri döndür
            const tabsFeatureActive = localStorage.getItem('tabsFeature') === 'on';
            if (!tabsFeatureActive) {
                container.style.paddingBottom = '56.25%';
            }
        },
        
        // Her videoyu resize izlemeyle başlat
        setupResizeMonitoring: function(videoContainer) {
            if (!isEnabled) return;
            
            let isResizing = false;
            let resizeMode = 'none'; // 'none', 'corner', 'right', 'bottom'
            let size = { width: videoContainer.offsetWidth, height: videoContainer.offsetHeight };
            let rafId = null;
            let lastResizeTime = 0;
            const THROTTLE_DELAY = 16; // ~60fps için uygun throttle değeri
            
            // Kenar resize kontrol elemanlarını ekle
            const rightEdge = document.createElement('div');
            rightEdge.className = 'edge-resize edge-right';
            
            const bottomEdge = document.createElement('div');
            bottomEdge.className = 'edge-resize edge-bottom';
            
            videoContainer.appendChild(rightEdge);
            videoContainer.appendChild(bottomEdge);
            
            // Resize handle için event listener'lar
            const resizeHandle = videoContainer.querySelector('.resize-handle');
            
            if (resizeHandle) {
                // Mouse sürükleme için
                resizeHandle.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Resize işlemini başlat
                    resizeMode = 'corner';
                    isResizing = true;
                    videoContainer.classList.add('resizing');
                    
                    const rect = videoContainer.getBoundingClientRect();
                    const startX = e.clientX;
                    const startY = e.clientY;
                    const startWidth = rect.width;
                    const startHeight = rect.height;
                    
                    // Hareket olayı
                    function handleResizeMove(e) {
                        if (!isResizing || !isEnabled) return;
                        
                        if (rafId) {
                            cancelAnimationFrame(rafId);
                        }
                        
                        rafId = requestAnimationFrame(() => {
                            let newWidth = startWidth + (e.clientX - startX);
                            let newHeight = startHeight + (e.clientY - startY);
                            
                            // Sınırlamaları uygula
                            newWidth = Math.min(Math.max(newWidth, VideoConfig.MIN_WIDTH), VideoConfig.MAX_WIDTH);
                            newHeight = Math.min(Math.max(newHeight, VideoConfig.MIN_HEIGHT), VideoConfig.MAX_HEIGHT);
                            
                            videoContainer.style.width = `${newWidth}px`;
                            videoContainer.style.height = `${newHeight}px`;
                        });
                    }
                    
                    // Bırakma olayı
                    function handleResizeUp() {
                        if (isResizing) {
                            isResizing = false;
                            videoContainer.classList.remove('resizing');
                            resizeMode = 'none';
                            
                            document.removeEventListener('mousemove', handleResizeMove);
                            document.removeEventListener('mouseup', handleResizeUp);
                            
                            // Videoyu kaydet
                            saveVideosCallback(videos);
                        }
                    }
                    
                    document.addEventListener('mousemove', handleResizeMove);
                    document.addEventListener('mouseup', handleResizeUp);
                });
                
                // Dokunmatik ekranlar için
                resizeHandle.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    resizeMode = 'corner';
                    isResizing = true;
                    videoContainer.classList.add('resizing');
                    
                    const rect = videoContainer.getBoundingClientRect();
                    const touch = e.touches[0];
                    const startX = touch.clientX;
                    const startY = touch.clientY;
                    const startWidth = rect.width;
                    const startHeight = rect.height;
                    
                    function handleResizeTouchMove(e) {
                        if (!isResizing || !isEnabled) return;
                        
                        if (rafId) {
                            cancelAnimationFrame(rafId);
                        }
                        
                        rafId = requestAnimationFrame(() => {
                            const touch = e.touches[0];
                            let newWidth = startWidth + (touch.clientX - startX);
                            let newHeight = startHeight + (touch.clientY - startY);
                            
                            // Sınırlamaları uygula
                            newWidth = Math.min(Math.max(newWidth, VideoConfig.MIN_WIDTH), VideoConfig.MAX_WIDTH);
                            newHeight = Math.min(Math.max(newHeight, VideoConfig.MIN_HEIGHT), VideoConfig.MAX_HEIGHT);
                            
                            videoContainer.style.width = `${newWidth}px`;
                            videoContainer.style.height = `${newHeight}px`;
                        });
                    }
                    
                    function handleResizeTouchEnd() {
                        if (isResizing) {
                            isResizing = false;
                            videoContainer.classList.remove('resizing');
                            resizeMode = 'none';
                            
                            document.removeEventListener('touchmove', handleResizeTouchMove);
                            document.removeEventListener('touchend', handleResizeTouchEnd);
                            
                            // Videoyu kaydet
                            saveVideosCallback(videos);
                        }
                    }
                    
                    document.addEventListener('touchmove', handleResizeTouchMove);
                    document.addEventListener('touchend', handleResizeTouchEnd);
                });
            }
            
            // Boyut değişimini izlemek için ResizeObserver
            const resizeObserver = new ResizeObserver(entries => {
                if (!isEnabled) return;
                
                const entry = entries[0];
                const now = performance.now();
                
                // Throttle uygula - çok hızlı resize işlemlerini sınırla
                if (now - lastResizeTime < THROTTLE_DELAY) {
                    // Eğer zaten bekleyen bir animasyon çerçevesi varsa iptal et
                    if (rafId) {
                        cancelAnimationFrame(rafId);
                    }
                    
                    // Yeni bir animasyon çerçevesi planla
                    rafId = requestAnimationFrame(() => handleResize(entry));
                    return;
                }
                
                // Doğrudan işle
                lastResizeTime = now;
                handleResize(entry);
            });
            
            // Boyut değişikliğini işle
            function handleResize(entry) {
                if (!isEnabled) return;
                
                // Eğer boyut değiştiyse
                const newWidth = entry.contentRect.width;
                const newHeight = entry.contentRect.height;
                
                // Minimum ve maksimum sınırlara uygun olduğunu kontrol et
                let widthChanged = false;
                let heightChanged = false;
                
                if (newWidth < VideoConfig.MIN_WIDTH) {
                    videoContainer.style.width = `${VideoConfig.MIN_WIDTH}px`;
                    widthChanged = true;
                } else if (newWidth > VideoConfig.MAX_WIDTH) {
                    videoContainer.style.width = `${VideoConfig.MAX_WIDTH}px`;
                    widthChanged = true;
                }
                
                if (newHeight < VideoConfig.MIN_HEIGHT) {
                    videoContainer.style.height = `${VideoConfig.MIN_HEIGHT}px`;
                    heightChanged = true;
                } else if (newHeight > VideoConfig.MAX_HEIGHT) {
                    videoContainer.style.height = `${VideoConfig.MAX_HEIGHT}px`;
                    heightChanged = true;
                }
                
                // Eğer sınırları aşan bir durum varsa yeniden kontrol et ve dön
                if (widthChanged || heightChanged) {
                    return;
                }
                
                // Eğer boyut değiştiyse ve sınırlar içindeyse
                if (newWidth !== size.width || newHeight !== size.height) {
                    if (!isResizing) {
                        isResizing = true;
                        videoContainer.classList.add('resizing');
                        
                        // Resize moduna göre cursor'ı ayarla
                        if (resizeMode === 'right') {
                            videoContainer.classList.add('resize-x');
                        } else if (resizeMode === 'bottom') {
                            videoContainer.classList.add('resize-y');
                        }
                    }
                    
                    // Boyut bilgisini güncelle
                    size.width = newWidth;
                    size.height = newHeight;
                    
                    // Boyut değişimi biraz duraklar duraklamaz kaydet ve işaretlemeyi temizle
                    clearTimeout(videoContainer.resizeTimeout);
                    videoContainer.resizeTimeout = setTimeout(() => {
                        isResizing = false;
                        videoContainer.classList.remove('resizing');
                        videoContainer.classList.remove('resize-x');
                        videoContainer.classList.remove('resize-y');
                        resizeMode = 'none';
                        saveVideosCallback(videos);
                    }, 300);
                }
            }
            
            // İzlemeyi başlat
            resizeObserver.observe(videoContainer);
            
            // Videoyu temizlerken izlemeyi de temizle
            videoContainer.resizeObserver = resizeObserver;
        }
    };
})();

// Sayfa yüklendiğinde etkileşim durumunu kontrol et
window.addEventListener('DOMContentLoaded', () => {
    const featureState = localStorage.getItem('tabsFeature') || 'off';
    if (document.getElementById('tabsFeatureToggle')) {
        document.getElementById('tabsFeatureToggle').value = featureState;
    }
});

// Dışa aktar
window.VideoInteractions = VideoInteractions;
window.VideoConfig = VideoConfig; 