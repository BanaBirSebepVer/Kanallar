<?php
// api_sync_history.php
require 'db.php';
session_start();

header('Content-Type: application/json');

// Oturum kontrolü
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Oturum açmanız gerekiyor.']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    exit;
}

// Frontend'den gelen veriyi al
$data = json_decode(file_get_contents('php://input'), true);
$user_id = $_SESSION['user_id'];

if (!isset($data['history']) || !is_array($data['history'])) {
    echo json_encode(['status' => 'error', 'message' => 'Geçerli bir geçmiş verisi bulunamadı.']);
    exit;
}

try {
    $pdo->beginTransaction();

    // 1. Eski geçmişi temizle
    $delete_stmt = $pdo->prepare("DELETE FROM Watch_History WHERE User_ID = ?");
    $delete_stmt->execute([$user_id]);

    // 2. Yeni geçmişi dış API KULLANMADAN kendi belirlediğimiz değerlerle ekle
    $insert_stmt = $pdo->prepare("INSERT INTO Watch_History (User_ID, Video_URL, Video_Title, Channel_Name, Platform) VALUES (?, ?, ?, ?, ?)");
    
    foreach ($data['history'] as $item) {
        // Gelen veri bazen düz metin (URL), bazen de obje ({url: "...", title: "..."}) olabilir. 
        // Bunu tespit edip sadece URL'yi alıyoruz:
        $video_url = is_array($item) ? (isset($item['url']) ? $item['url'] : '') : $item;
        
        if (empty($video_url) || !is_string($video_url)) continue;

        $platform = 'unknown';
        $title = 'Bilinmeyen İçerik';
        $channel = 'Bilinmeyen Kanal'; 
        
        $lower_url = strtolower($video_url); // Artık $video_url kesinlikle bir string, çökme olmaz.
        
        // Sadece URL içindeki metinlere bakarak platformu ve genel başlığı belirliyoruz
        if (strpos($lower_url, 'youtube.com') !== false || strpos($lower_url, 'youtu.be') !== false) {
            $platform = 'youtube';
            $title = 'YouTube Videosu';
        } elseif (strpos($lower_url, 'twitch.tv') !== false || strpos($lower_url, 'player.twitch.tv') !== false) {
            $platform = 'twitch';
            $title = 'Twitch Yayını';
        } elseif (strpos($lower_url, 'kick.com') !== false || strpos($lower_url, 'player.kick.com') !== false) {
            $platform = 'kick';
            $title = 'Kick Yayını';
        }

        $insert_stmt->execute([$user_id, $video_url, $title, $channel, $platform]);
    }

    $pdo->commit();
    echo json_encode(['status' => 'success', 'message' => 'Geçmiş dışa bağımlılık olmadan kaydedildi.']);

} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo json_encode(['status' => 'error', 'message' => 'Kayıt hatası: ' . $e->getMessage()]);
}
?>