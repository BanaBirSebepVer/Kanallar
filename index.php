<!DOCTYPE html>
<html lang="tr">
<head>
    <title>Kanallar | Bana Bir Sebep Ver</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">   
    <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&icon_names=light_mode" />
    <meta name="description" content="Farklı platformlardan videoları ve yayınları izleyebileceğiniz, medya takibi yapabileceğiniz site.">
    <meta property="og:type" content="website">
    <meta property="og:url" content="http://kanallar.banabirsebepver.com/">
    <meta property="og:title" content="Kanallar">
    <meta property="og:description" content="Farklı platformlardan videoları ve yayınları izleyebileceğiniz, medya takibi yapabileceğiniz site.">
    <meta property="og:image" content="http://kanallar.banabirsebepver.com/imaj/featuredimage.png">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:url" content="http://kanallar.banabirsebepver.com/">
    <meta name="twitter:title" content="Kanallar">
    <meta name="twitter:description" content="Farklı platformlardan videoları ve yayınları izleyebileceğiniz, medya takibi yapabileceğiniz site.">
    <meta name="twitter:image" content="http://kanallar.banabirsebepver.com/imaj/featuredimage.png">
    <link rel="icon" type="image/png" href="imaj/favicon.png">
    <link rel="stylesheet" href="styles.css">
    <!-- Google tag (gtag.js) -->
    <script async src="https://www.googletagmanager.com/gtag/js?id=G-F2SS5LY6B1"></script>
    <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());

    gtag('config', 'G-F2SS5LY6B1');
    </script>
    <script src="https://accounts.google.com/gsi/client" async defer></script>


</head>
<body>
    <nav class="navbar">         
        <form id="addChannelForm">
            <input type="text" id="videoUrl" placeholder="Video bağlantısı ekleyin" required>
            <button type="submit">Ekle</button>
            <!-- Paylaş Butonu -->
            <button type="button" id="shareListBtn" class="share-btn" onclick="shareCurrentList()"><span class="material-icons">share</span> Paylaş</button>
            <!-- Çıkış Yap Butonu (Başlangıçta Gizli) -->
            <button type="button" id="logoutBtn" class="logout-btn" style="display: none;" onclick="logoutUser()"><span class="material-icons">logout</span> Çıkış Yap</button>

            <!-- <nav class="navbar"> içine veya uygun bir yere eklenecek buton yapısı: -->
            <div id="g_id_onload"
                data-client_id="<?php echo parse_ini_file(__DIR__ . '/.env')['GOOGLE_CLIENT_ID']; ?>"
                data-callback="handleCredentialResponse"
                data-auto_prompt="false">
            </div>
            <div class="g_id_signin" data-type="standard" data-theme="outline" data-text="sign_in_with" data-shape="rectangular" data-logo_alignment="left"></div>

        </form>
    </nav>
    <div class="container">
        <div id="videoGrid"></div>
    </div>
    <footer class="footer">
        <p>© 2025 Bana Bir Sebep Ver</p>


        <div class="bg-controls">
            <input type="file" id="bgImageUpload" accept="image/*" style="display: none;">
            <button id="bgUploadBtn"><span class="material-icons icon">image</span></button>
            <button id="resetBgBtn"><span class="material-icons icon">refresh</span></button>
            <button id="leaderboardBtn" class="leaderboard-btn" onclick="showLeaderboard()"><span class="material-icons">leaderboard</span></button>
        </div>

        <div class="theme-selector">
            <select id="themeSelect" onchange="toggleTheme(this.value)">
                <option value="light">🌞 Açık</option>
                <option value="dark">🌙 Koyu</option>
                <option value="auto">🔄 Otomatik</option>
            </select>
        </div> 
        <span class="version" id="appVersion">Sürüm aranıyor...</span>
    </footer>
    <script src="js/script.js"></script>
    <script src="js/youtube.js"></script>
    <script src="js/twitch.js"></script>
    <script src="js/kick.js"></script>

    <!-- Lider Tablosu Modalı -->
    <div id="leaderboardModal" class="modal">
        <div class="modal-content">
            <span class="close-modal" onclick="closeLeaderboard()">&times;</span>
            <h2>🏆 Aylık Lider Tablosu</h2>
            <p>Son 30 günde en çok izlenen listeler</p>
            <ul id="leaderboardList">
                <!-- JavaScript ile API'den gelen veriler buraya eklenecek -->
            </ul>
        </div>
    </div>


</body>
</html>
