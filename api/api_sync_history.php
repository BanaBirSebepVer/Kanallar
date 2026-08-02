<?php
// api_sync_history.php
require 'db.php';
session_start();

header('Content-Type: application/json');

// Sadece oturum açmış kullanıcılar bu işlemi yapabilir
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
    // Veritabanı işlemleri için Transaction başlat
    $pdo->beginTransaction();

    // 1. Kullanıcının eski geçmişini tamamen temizle
    $delete_stmt = $pdo->prepare("DELETE FROM Watch_History WHERE User_ID = ?");
    $delete_stmt->execute([$user_id]);

    // 2. Yeni geçmişi döngü ile ekle
    $insert_stmt = $pdo->prepare("INSERT INTO Watch_History (User_ID, Video_URL, Platform) VALUES (?, ?, ?)");
    
    foreach ($data['history'] as $video) {
        // URL'den platformu güvenli bir şekilde tespit et
        $platform = 'unknown';
        
        // Küçük harfe çevirerek arama yapıyoruz ki büyük/küçük harf sorunları yaşanmasın
        $lower_video = strtolower($video);
        
        if (strpos($lower_video, 'youtube.com') !== false || strpos($lower_video, 'youtu.be') !== false) {
            $platform = 'youtube';
        } elseif (strpos($lower_video, 'twitch.tv') !== false || strpos($lower_video, 'player.twitch.tv') !== false) {
            $platform = 'twitch';
        } elseif (strpos($lower_video, 'kick.com') !== false || strpos($lower_video, 'player.kick.com') !== false) {
            $platform = 'kick';
        }

        $insert_stmt->execute([$user_id, $video, $platform]);
    }

    // İşlemleri onayla
    $pdo->commit();
    echo json_encode(['status' => 'success', 'message' => 'Geçmiş bulutla senkronize edildi.']);

} catch (Exception $e) {
    // Hata olursa tüm işlemleri geri al
    $pdo->rollBack();
    echo json_encode(['status' => 'error', 'message' => 'Senkronizasyon hatası.']);
}
?>