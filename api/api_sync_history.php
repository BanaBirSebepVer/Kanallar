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

try {
    $pdo->beginTransaction();

    // 1. Eski geçmişi temizle
    $delete_stmt = $pdo->prepare("DELETE FROM Watch_History WHERE User_ID = ?");
    $delete_stmt->execute([$user_id]);

    // 2. Yeni geçmişi başlık ve kanal bilgileriyle birlikte ekle
    $insert_stmt = $pdo->prepare("INSERT INTO Watch_History (User_ID, Video_URL, Video_Title, Channel_Name, Platform) VALUES (?, ?, ?, ?, ?)");
    
    foreach ($data['history'] as $item) {
        $video_url = isset($item['url']) ? $item['url'] : '';
        $video_title = isset($item['title']) ? $item['title'] : 'Bilinmeyen Video';
        $channel_name = isset($item['channel']) ? $item['channel'] : 'Bilinmeyen Kanal';
        
        if (empty($video_url)) continue;

        // Platformu tespit et
        $platform = 'unknown';
        $lower_url = strtolower($video_url);
        
        if (strpos($lower_url, 'youtube.com') !== false || strpos($lower_url, 'youtu.be') !== false) {
            $platform = 'youtube';
        } elseif (strpos($lower_url, 'twitch.tv') !== false || strpos($lower_url, 'player.twitch.tv') !== false) {
            $platform = 'twitch';
        } elseif (strpos($lower_url, 'kick.com') !== false || strpos($lower_url, 'player.kick.com') !== false) {
            $platform = 'kick';
        }

        $insert_stmt->execute([$user_id, $video_url, $video_title, $channel_name, $platform]);
    }

    $pdo->commit();
    echo json_encode(['status' => 'success', 'message' => 'Geçmiş ve video detayları bulutla senkronize edildi.']);

} catch (Exception $e) {
    $pdo->rollBack();
    echo json_encode(['status' => 'error', 'message' => 'Senkronizasyon veritabanı hatası: ' . $e->getMessage()]);
}
?>