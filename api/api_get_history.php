<?php
// api_get_history.php
require 'db.php';
session_start();

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Oturum açık değil.']);
    exit;
}

$user_id = $_SESSION['user_id'];

try {
    $stmt = $pdo->prepare("SELECT Video_URL, Video_Title, Channel_Name, Platform, Added_At FROM Watch_History WHERE User_ID = ? ORDER BY Added_At DESC LIMIT 50");
    $stmt->execute([$user_id]);
    $history = $stmt->fetchAll();

    echo json_encode(['status' => 'success', 'data' => $history]);
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => 'Geçmiş alınamadı.']);
}
?>