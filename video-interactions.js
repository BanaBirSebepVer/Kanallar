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
    
    // Yardımcı fonksiyonlar
    const applyConstraints = (value, min, max) => Math.min(Math.max(value, min), max);
    
    // Header oluşturma fonksiyonu
    const createHeader = (videoContainer) => {
        const header = document.createElement('div');
                header.className = 'video-header';
                header.innerHTML = '<div class="window-controls"><span class="window-control close"></span><span class="window-control minimize"></span><span class="window-control maximize"></span></div>';
                videoContainer.prepend(header);
                
                // Pencere kontrol butonu işlevsellikleri
                const closeButton = header.querySelector('.window-control.close');
                if (closeButton) {
                    closeButton.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const container = e.target.closest('.video-container');
                        if (container && typeof window.removeVideo === 'function') {
                            window.removeVideo(container);
                        }
                    });
                }
                
        // Maksimize butonu
                const maximizeButton = header.querySelector('.window-control.maximize');
                if (maximizeButton) {
                    maximizeButton.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const container = e.target.closest('.video-container');
                        
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
                        
                saveVideosCallback?.(videos);
                    });
                }
                
        // Minimize butonu
                const minimizeButton = header.querySelector('.window-control.minimize');
                if (minimizeButton) {
                    minimizeButton.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const container = e.target.closest('.video-container');
                        
                        if (container.classList.contains('minimized')) {
                            container.classList.remove('minimized');
                            container.style.height = container.dataset.prevHeight || '260px';
                        } else {
                            container.dataset.prevHeight = container.style.height;
                            container.classList.add('minimized');
                            container.style.height = '36px'; // Sadece başlık göster
                        }
                        
                saveVideosCallback?.(videos);
            });
        }
        
        return header;
    };
    
    // Resize handle oluşturma fonksiyonu
    const createResizeHandle = (videoContainer) => {
        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'resize-handle';
        resizeHandle.innerHTML = '<div class="resize-icon"><span></span><span></span><span></span></div>';
        videoContainer.appendChild(resizeHandle);
        return resizeHandle;
    };
    
    // Resize kenarlarını oluşturma fonksiyonu
    const createResizeEdges = (videoContainer) => {
        const rightEdge = document.createElement('div');
        rightEdge.className = 'edge-resize edge-right';
        
        const bottomEdge = document.createElement('div');
        bottomEdge.className = 'edge-resize edge-bottom';
        
        videoContainer.appendChild(rightEdge);
        videoContainer.appendChild(bottomEdge);
        
        return { rightEdge, bottomEdge };
    };
    
    // ResizeObserver kurulum fonksiyonu
    const setupResizeObserver = (videoContainer) => {
        if (!isEnabled) return null;
        
        let isResizing = false;
        let resizeMode = 'none';
        let size = { width: videoContainer.offsetWidth, height: videoContainer.offsetHeight };
        let rafId = null;
        let lastResizeTime = 0;
        const THROTTLE_DELAY = 16; // ~60fps
        
        const resizeObserver = new ResizeObserver(entries => {
            if (!isEnabled) return;
            
            const entry = entries[0];
            const now = performance.now();
            
            // Throttle uygula
            if (now - lastResizeTime < THROTTLE_DELAY) {
                if (rafId) cancelAnimationFrame(rafId);
                rafId = requestAnimationFrame(() => handleResize(entry));
                return;
            }
            
            lastResizeTime = now;
            handleResize(entry);
        });
        
        // Boyut değişikliğini işle
        function handleResize(entry) {
            if (!isEnabled) return;
            
            const newWidth = entry.contentRect.width;
            const newHeight = entry.contentRect.height;
            
            // Sınır kontrolü
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
            
            // Sınır kontrolünden sonra işleme devam et
            if (widthChanged || heightChanged) return;
            
            if (newWidth !== size.width || newHeight !== size.height) {
                if (!isResizing) {
                    isResizing = true;
                    videoContainer.classList.add('resizing');
                    
                    if (resizeMode === 'right') {
                        videoContainer.classList.add('resize-x');
                    } else if (resizeMode === 'bottom') {
                        videoContainer.classList.add('resize-y');
                    }
                }
                
                size.width = newWidth;
                size.height = newHeight;
                
                clearTimeout(videoContainer.resizeTimeout);
                videoContainer.resizeTimeout = setTimeout(() => {
                    isResizing = false;
                    videoContainer.classList.remove('resizing', 'resize-x', 'resize-y');
                    resizeMode = 'none';
                    saveVideosCallback?.(videos);
                }, 300);
            }
        }
        
        resizeObserver.observe(videoContainer);
        return resizeObserver;
    };
    
    // Resize handle için olay dinleyicileri ekle
    const setupResizeHandlers = (videoContainer, resizeHandle) => {
        if (!resizeHandle || !isEnabled) return;
        
        // Fare sürükleme için işleyici
        const setupMouseResize = (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            const resizeMode = 'corner';
            let isResizing = true;
            videoContainer.classList.add('resizing');
            
            const rect = videoContainer.getBoundingClientRect();
            const startX = e.clientX;
            const startY = e.clientY;
            const startWidth = rect.width;
            const startHeight = rect.height;
            let rafId = null;
            
            // Hareket olayı
            function handleResizeMove(e) {
                if (!isResizing || !isEnabled) return;
                
                if (rafId) cancelAnimationFrame(rafId);
                
                rafId = requestAnimationFrame(() => {
                    const newWidth = applyConstraints(
                        startWidth + (e.clientX - startX),
                        VideoConfig.MIN_WIDTH,
                        VideoConfig.MAX_WIDTH
                    );
                    
                    const newHeight = applyConstraints(
                        startHeight + (e.clientY - startY),
                        VideoConfig.MIN_HEIGHT,
                        VideoConfig.MAX_HEIGHT
                    );
                    
                    videoContainer.style.width = `${newWidth}px`;
                    videoContainer.style.height = `${newHeight}px`;
                });
            }
            
            // Bırakma olayı
            function handleResizeUp() {
                if (isResizing) {
                    isResizing = false;
                    videoContainer.classList.remove('resizing');
                    
                    document.removeEventListener('mousemove', handleResizeMove);
                    document.removeEventListener('mouseup', handleResizeUp);
                    
                    saveVideosCallback?.(videos);
                }
            }
            
            document.addEventListener('mousemove', handleResizeMove);
            document.addEventListener('mouseup', handleResizeUp);
        };
        
        // Dokunmatik sürükleme için işleyici
        const setupTouchResize = (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            let isResizing = true;
            videoContainer.classList.add('resizing');
            
            const rect = videoContainer.getBoundingClientRect();
            const touch = e.touches[0];
            const startX = touch.clientX;
            const startY = touch.clientY;
            const startWidth = rect.width;
            const startHeight = rect.height;
            let rafId = null;
            
            function handleResizeTouchMove(e) {
                if (!isResizing || !isEnabled) return;
                
                if (rafId) cancelAnimationFrame(rafId);
                
                rafId = requestAnimationFrame(() => {
                    const touch = e.touches[0];
                    
                    const newWidth = applyConstraints(
                        startWidth + (touch.clientX - startX),
                        VideoConfig.MIN_WIDTH,
                        VideoConfig.MAX_WIDTH
                    );
                    
                    const newHeight = applyConstraints(
                        startHeight + (touch.clientY - startY),
                        VideoConfig.MIN_HEIGHT,
                        VideoConfig.MAX_HEIGHT
                    );
                    
                    videoContainer.style.width = `${newWidth}px`;
                    videoContainer.style.height = `${newHeight}px`;
                });
            }
            
            function handleResizeTouchEnd() {
                if (isResizing) {
                    isResizing = false;
                    videoContainer.classList.remove('resizing');
                    
                    document.removeEventListener('touchmove', handleResizeTouchMove);
                    document.removeEventListener('touchend', handleResizeTouchEnd);
                    
                    saveVideosCallback?.(videos);
                }
            }
            
            document.addEventListener('touchmove', handleResizeTouchMove);
            document.addEventListener('touchend', handleResizeTouchEnd);
        };
        
        // Event dinleyicileri ekle
        resizeHandle.addEventListener('mousedown', setupMouseResize);
        resizeHandle.addEventListener('touchstart', setupTouchResize);
    };
    
    // Public API
    return {
        // Modülü başlat
        init(videosArray, grid, saveCallback, enabled = true) {
            videos = videosArray;
            videoGrid = grid;
            saveVideosCallback = saveCallback;
            
            // Durumu al
            const featureState = localStorage.getItem('tabsFeature') || 'off';
            isEnabled = featureState === 'on';
            
            // Pencere boyutu değişikliğini izle
            window.addEventListener('resize', this.handleWindowResize);
            
            // Mevcut durum bilgisini güncelle ve toggle olay dinleyici ekle
            const toggle = document.getElementById('tabsFeatureToggle');
            if (toggle) {
                toggle.value = featureState;
                
                // Toggle değişiklik olayını dinle
                toggle.addEventListener('change', (e) => {
                    const newValue = e.target.value;
                    localStorage.setItem('tabsFeature', newValue);
                    
                    // Eğer 'off' seçildiyse sayfayı yeniden yükle
                    if (newValue === 'off') {
                        window.location.reload();
                    } else {
                        // 'on' seçildiyse, sadece durumu güncelle
                        isEnabled = true;
                        this.setEnabled(true);
                    }
                });
            }
        },
        
        // Video etkileşimlerini etkinleştir
        enableInteractions(videoContainer) {
            if (!videoContainer || videoContainer.hasInteractionsEnabled) return;
            
            // Pozisyon ve boyut stil eklemeleri
            videoContainer.style.position = 'absolute';
            videoContainer.style.paddingBottom = '0';
            
            // İlk pozisyon hesapla ve ayarla
            videoContainer.style.left = videoContainer.style.left || '0';
            videoContainer.style.top = videoContainer.style.top || '0';
            
            // Header ekle (eğer yoksa)
            let header = videoContainer.querySelector('.video-header');
            if (!header) {
                header = createHeader(videoContainer);
                
                // Sürükleme işlevini ekle
                header.addEventListener('mousedown', this.startDrag.bind(this));
                header.addEventListener('touchstart', this.startDragTouch.bind(this));
            }
            
            // Resize handle ekle
            let resizeHandle = videoContainer.querySelector('.resize-handle');
            if (!resizeHandle) {
                resizeHandle = createResizeHandle(videoContainer);
            }
            
            // Aktif video işaretleme
            videoContainer.addEventListener('mousedown', this.activateVideo);
            videoContainer.addEventListener('touchstart', this.activateVideo);
            
            // Resize kenarları ve izleme kurulumu
            createResizeEdges(videoContainer);
            setupResizeHandlers(videoContainer, resizeHandle);
            videoContainer.resizeObserver = setupResizeObserver(videoContainer);
            
            // Container sınıflarını güncelle
            videoContainer.classList.remove('no-interactions');
            videoContainer.classList.add('app-window');
            
            // İşaretçi ekle
            videoContainer.hasInteractionsEnabled = true;
        },
        
        // Video etkileşimlerini devre dışı bırak
        disableInteractions(videoContainer) {
            if (!videoContainer || !videoContainer.hasInteractionsEnabled) return;
            
            // Temizlik işlemlerini yap
            this.cleanupVideoResources(videoContainer);
            
            // Container sınıflarını güncelle
            videoContainer.classList.add('no-interactions');
            videoContainer.classList.remove('app-window');
            
            // İşaretçiyi kaldır
            videoContainer.hasInteractionsEnabled = false;
        },
        
        // Etkileşim durumunu değiştir
        setEnabled(enabled) {
            isEnabled = enabled;
            
            if (videos?.length > 0) {
                videos.forEach(container => {
                    enabled ? this.enableInteractions(container) : this.disableInteractions(container);
                });
            }
        },
        
        // Etkileşim durumunu döndür
        isEnabled() {
            return isEnabled;
        },
        
        // Video etkileşimlerini ayarla (geriye uyumluluk için)
        setupVideoInteractions(videoContainer) {
            this.enableInteractions(videoContainer);
        },
        
        // Pencere boyut değişimlerini yönet
        handleWindowResize() {
            if (!videos?.length) return;
            
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
                
                // Taşma ve boyut kontrolü
                if (rect.right > gridRect.right) {
                    container.style.left = `${gridRect.width - rect.width}px`;
                }
                
                if (rect.bottom > gridRect.bottom) {
                    container.style.top = `${gridRect.height - rect.height}px`;
                }
                
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
        activateVideo(e) {
            if (e.target.classList.contains('resize-handle') || 
                e.target.classList.contains('video-header') || 
                e.target.classList.contains('remove-btn')) {
                return;
            }
            
            videos.forEach(v => v.classList.remove('active'));
            this.classList.add('active');
        },
        
        // Sürüklemeyi başlatma fonksiyonu
        startDrag(e) {
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
            if (currentDragElement.style.position !== 'absolute') {
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
        startDragTouch(e) {
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
            if (currentDragElement.style.position !== 'absolute') {
                currentDragElement.style.position = 'absolute';
            }
            
            // Tüm videoların active sınıfını kaldır ve bu videoyu aktif yap
            videos.forEach(v => v.classList.remove('active'));
            currentDragElement.classList.add('active');
            
            // Event listener'ları ekle
            document.addEventListener('touchmove', this.dragElementTouch.bind(this));
            document.addEventListener('touchend', this.stopDragTouch.bind(this));
        },
        
        // Sürükleme fonksiyonu (fare ve dokunmatik ortak kodlar)
        dragCommon(clientX, clientY) {
            if (!isDragging || !isEnabled || !currentDragElement) return;
            
            // Yeni konumu hesapla
            const dx = clientX - initialX;
            const dy = clientY - initialY;
            
            // Container sınırları ve video element boyutları
            const containerRect = videoGrid.getBoundingClientRect();
            const videoRect = currentDragElement.getBoundingClientRect();
            
            // Sınırları belirle ve uygula
            const newLeft = applyConstraints(
                initialLeft + dx,
                0,
                containerRect.width - videoRect.width
            );
            
            const newTop = applyConstraints(
                initialTop + dy,
                0,
                containerRect.height - videoRect.height
            );
            
            // Container'ın konumunu güncelle
            currentDragElement.style.left = `${newLeft}px`;
            currentDragElement.style.top = `${newTop}px`;
        },
        
        // Fare sürükleme fonksiyonu
        dragElement(e) {
            this.dragCommon(e.clientX, e.clientY);
        },
        
        // Dokunmatik sürükleme fonksiyonu
        dragElementTouch(e) {
            this.dragCommon(e.touches[0].clientX, e.touches[0].clientY);
        },
        
        // Sürüklemeyi durdurma fonksiyonu (ortak)
        stopDragCommon() {
            if (isDragging && isEnabled && currentDragElement) {
                currentDragElement.classList.remove('dragging');
                isDragging = false;
                saveVideosCallback?.(videos);
            }
        },
        
        // Fare sürüklemeyi durdurma
        stopDrag() {
            this.stopDragCommon();
            document.removeEventListener('mousemove', this.dragElement.bind(this));
            document.removeEventListener('mouseup', this.stopDrag.bind(this));
        },
        
        // Dokunmatik sürüklemeyi durdurma
        stopDragTouch() {
            this.stopDragCommon();
                document.removeEventListener('touchmove', this.dragElementTouch.bind(this));
                document.removeEventListener('touchend', this.stopDragTouch.bind(this));
        },
        
        // Boyut değişimi tamamlandığında video konumunu kaydet
        saveVideoSizeAndPosition() {
            if (isEnabled) {
                saveVideosCallback?.(videos);
            }
        },
        
        // Video kaynakları temizle
        cleanupVideoResources(container) {
            // ResizeObserver'ı temizle
            if (container.resizeObserver) {
                container.resizeObserver.disconnect();
                delete container.resizeObserver;
            }
            
            // Özel elementleri kaldır
            ['video-header', 'resize-handle', 'edge-right', 'edge-bottom']
                .forEach(className => {
                    const element = container.querySelector(`.${className}`);
                    if (element) element.remove();
                });
            
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
        }
    };
})();

// Sayfa yüklendiğinde etkileşim durumunu kontrol et
window.addEventListener('DOMContentLoaded', () => {
    const featureState = localStorage.getItem('tabsFeature') || 'off';
    const toggle = document.getElementById('tabsFeatureToggle');
    if (toggle) {
        toggle.value = featureState;
        
        // Toggle değişiklik olayını dinle - DOMContentLoaded'da da ekle
        // Bu sayede sayfa yüklendiğinde var olan toggle için de dinleyici eklenir
        toggle.addEventListener('change', (e) => {
            const newValue = e.target.value;
            localStorage.setItem('tabsFeature', newValue);
            
            // Eğer 'off' seçildiyse sayfayı yeniden yükle
            if (newValue === 'off') {
                window.location.reload();
            } else {
                // 'on' seçildiyse, sadece durumu güncelle
                VideoInteractions.setEnabled(true);
            }
        });
    }
});

// Dışa aktar
window.VideoInteractions = VideoInteractions;
window.VideoConfig = VideoConfig; 