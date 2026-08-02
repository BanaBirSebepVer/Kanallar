<?php
// api_get_list.php
require 'db.php';

header('Content-Type: application/json');

if (!isset($_GET['id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Liste ID belirtilmedi.']);
    exit;
}

$list_id = $_GET['id'];

try {
    $stmt = $pdo->prepare("SELECT Videos_JSON, Created_At FROM Shared_Lists WHERE List_ID = ?");
    $stmt->execute([$list_id]);
    $list = $stmt->fetch();

    if ($list) {
        echo json_encode(['status' => 'success', 'data' => json_decode($list['Videos_JSON'], true)]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Liste bulunamadı veya silinmiş.']);
    }
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => 'Sorgu hatası.']);
}
?>