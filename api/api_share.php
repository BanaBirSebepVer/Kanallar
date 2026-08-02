<?php
// api_share.php
require 'db.php';
session_start();

header('Content-Type: application/json');

// Sadece POST isteklerini kabul et
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Geçersiz istek türü.']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['videos']) || !is_array($data['videos']) || count($data['videos']) === 0) {
    echo json_encode(['status' => 'error', 'message' => 'Video listesi boş olamaz.']);
    exit;
}

// UUID v4 oluşturma fonksiyonu
function generate_uuid() {
    return sprintf( '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
        mt_rand( 0, 0xffff ), mt_rand( 0, 0xffff ),
        mt_rand( 0, 0xffff ),
        mt_rand( 0, 0x0fff ) | 0x4000,
        mt_rand( 0, 0x3fff ) | 0x8000,
        mt_rand( 0, 0xffff ), mt_rand( 0, 0xffff ), mt_rand( 0, 0xffff )
    );
}

$list_id = generate_uuid();
$user_id = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null;
$videos_json = json_encode($data['videos']);

try {
    $stmt = $pdo->prepare("INSERT INTO Shared_Lists (List_ID, User_ID, Videos_JSON) VALUES (?, ?, ?)");
    $stmt->execute([$list_id, $user_id, $videos_json]);
    
    echo json_encode(['status' => 'success', 'list_id' => $list_id]);
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => 'Liste oluşturulamadı.']);
}
?>