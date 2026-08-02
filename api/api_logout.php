<?php
// api_logout.php
session_start();
session_unset();
session_destroy();

header('Content-Type: application/json');
echo json_encode(['status' => 'success', 'message' => 'Oturum kapatıldı.']);
?>