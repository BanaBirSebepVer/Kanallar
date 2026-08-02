<?php
require 'db.php';
session_start();

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

if (!isset($data['credential'])) {
    echo json_encode(['status' => 'error', 'message' => 'Token bulunamadı.']);
    exit;
}

$id_token = $data['credential'];
$client_id = parse_ini_file(__DIR__ . '/../.env')['GOOGLE_CLIENT_ID'];

// Google API'sine doğrudan doğrulama isteği atılır (Hafif ve güvenli yöntem)
$verify_url = 'https://oauth2.googleapis.com/tokeninfo?id_token=' . $id_token;
$response = @file_get_contents($verify_url);

if ($response === FALSE) {
    echo json_encode(['status' => 'error', 'message' => 'Token doğrulanamadı veya süresi dolmuş.']);
    exit;
}

$google_data = json_decode($response, true);

// Biletin bizim uygulamamıza (Client ID'ye) ait olup olmadığını kontrol et
if (!isset($google_data['aud']) || $google_data['aud'] !== $client_id) {
    echo json_encode(['status' => 'error', 'message' => 'Geçersiz yetkilendirme kaynağı.']);
    exit;
}

$oauth_id = $google_data['sub']; // Google'ın kullanıcıya verdiği kalıcı ve eşsiz ID
$email = isset($google_data['email']) ? $google_data['email'] : null;

try {
    // Veritabanında kullanıcı sorgusu
    $stmt = $pdo->prepare("SELECT ID FROM Users WHERE OAuth_Provider = 'google' AND OAuth_ID = ?");
    $stmt->execute([$oauth_id]);
    $user = $stmt->fetch();

    if ($user) {
        // Kullanıcı önceden kayıtlı, sisteme girişini sağla
        $_SESSION['user_id'] = $user['ID'];
    } else {
        // Kullanıcı yeni, veritabanına kaydet ve girişini sağla
        $insert = $pdo->prepare("INSERT INTO Users (OAuth_Provider, OAuth_ID, Email) VALUES ('google', ?, ?)");
        $insert->execute([$oauth_id, $email]);
        $_SESSION['user_id'] = $pdo->lastInsertId();
    }

    echo json_encode(['status' => 'success', 'message' => 'Giriş başarılı.']);
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => 'Veritabanı bağlantı veya kayıt hatası.']);
}
?>