<?php
// api_view.php
require 'db.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['list_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'List ID eksik.']);
    exit;
}

$list_id = $data['list_id'];
// Gerçek IP adresini alıp SHA-256 ile şifrele
$ip_address = $_SERVER['REMOTE_ADDR'];
$ip_hash = hash('sha256', $ip_address);

try {
    // Son 30 dakika içinde bu IP_Hash ve List_ID için kayıt var mı kontrol et
    $check_stmt = $pdo->prepare("SELECT COUNT(*) as view_count FROM List_Views WHERE List_ID = ? AND IP_Hash = ? AND View_Date >= NOW() - INTERVAL 30 MINUTE");
    $check_stmt->execute([$list_id, $ip_hash]);
    $result = $check_stmt->fetch();

    if ($result['view_count'] == 0) {
        // Kayıt yoksa yeni görüntülenme ekle
        $insert_stmt = $pdo->prepare("INSERT INTO List_Views (List_ID, IP_Hash) VALUES (?, ?)");
        $insert_stmt->execute([$list_id, $ip_hash]);
        echo json_encode(['status' => 'success', 'message' => 'Görüntülenme eklendi.']);
    } else {
        echo json_encode(['status' => 'success', 'message' => 'Zaten görüntülenmiş, sayaç artırılmadı.']);
    }
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => 'İşlem başarısız.']);
}
?>