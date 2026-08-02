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

    $insert_stmt = $pdo->prepare("INSERT INTO Watch_History (User_ID, Video_URL, Video_Title, Channel_Name, Platform) VALUES (?, ?, ?, ?, ?)");
    
    foreach ($data['history'] as $item) {
        $video_url = is_array($item) ? (isset($item['url']) ? $item['url'] : '') : $item;
        if (empty($video_url) || !is_string($video_url)) continue;

        $platform = 'unknown';
        $title = 'Bilinmeyen İçerik';
        $channel = 'Bilinmeyen Kanal'; 
        
        $lower_url = strtolower($video_url);
        
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
    echo json_encode(['status' => 'success', 'message' => 'Geçmişe eklendi.']);

} catch (Throwable $e) {
    if ($pdo->inTransaction()) {
        $pdo->rollBack();
    }
    echo json_encode(['status' => 'error', 'message' => 'Kayıt hatası: ' . $e->getMessage()]);
}
?>