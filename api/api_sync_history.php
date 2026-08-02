<?php
// api_sync_history.php
require 'db.php';
session_start();

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Oturum açmanız gerekiyor.']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);
$user_id = $_SESSION['user_id'];

if (!isset($data['history']) || !is_array($data['history'])) {
    echo json_encode(['status' => 'error', 'message' => 'Geçerli bir geçmiş verisi bulunamadı.']);
    exit;
}

// URL'den başlık ve kanal adı çeken yardımcı fonksiyon (Sunucu tarafı)
function getVideoDetails($url, $platform) {
    $title = 'Bilinmeyen Video';
    $channel = 'Bilinmeyen Kanal';
    
    if ($platform === 'youtube') {
        // Sunucu üzerinden noembed API'sine hızlıca istek atar
        $api_url = "https://noembed.com/embed?url=" . urlencode($url);
        
        // Timeout süresini 2 saniye ile kısıtlıyoruz ki sunucu beklemesin
        $ctx = stream_context_create(['http' => ['timeout' => 2]]);
        $response = @file_get_contents($api_url, false, $ctx);
        
        if ($response) {
            $json = json_decode($response, true);
            if (isset($json['title'])) $title = $json['title'];
            if (isset($json['author_name'])) $channel = $json['author_name'];
        }
    }
    // İleride Twitch veya Kick için de buraya eklentiler yapılabilir
    return ['title' => $title, 'channel' => $channel];
}

try {
    $pdo->beginTransaction();

    $delete_stmt = $pdo->prepare("DELETE FROM Watch_History WHERE User_ID = ?");
    $delete_stmt->execute([$user_id]);

    $insert_stmt = $pdo->prepare("INSERT INTO Watch_History (User_ID, Video_URL, Video_Title, Channel_Name, Platform) VALUES (?, ?, ?, ?, ?)");
    
    foreach ($data['history'] as $video_url) {
        if (empty($video_url)) continue;

        $platform = 'unknown';
        $lower_url = strtolower($video_url);
        
        if (strpos($lower_url, 'youtube.com') !== false || strpos($lower_url, 'youtu.be') !== false) {
            $platform = 'youtube';
        } elseif (strpos($lower_url, 'twitch.tv') !== false || strpos($lower_url, 'player.twitch.tv') !== false) {
            $platform = 'twitch';
        } elseif (strpos($lower_url, 'kick.com') !== false || strpos($lower_url, 'player.kick.com') !== false) {
            $platform = 'kick';
        }

        // Başlık ve Kanal adını sunucuda çek!
        $details = getVideoDetails($video_url, $platform);

        $insert_stmt->execute([$user_id, $video_url, $details['title'], $details['channel'], $platform]);
    }

    $pdo->commit();
    echo json_encode(['status' => 'success', 'message' => 'Geçmiş başarıyla senkronize edildi.']);

} catch (Exception $e) {
    $pdo->rollBack();
    echo json_encode(['status' => 'error', 'message' => 'Senkronizasyon hatası: ' . $e->getMessage()]);
}
?>