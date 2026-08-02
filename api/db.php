<?php
// .env dosyasını oku (api klasörünün bir üst dizininde olduğu için __DIR__ . '/../.env' kullanıyoruz)
$env = parse_ini_file(__DIR__ . '/../.env');

$host = $env['DB_HOST'];
$dbname = $env['DB_NAME'];
$username = $env['DB_USER'];
$password = $env['DB_PASS'];

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8mb4", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    header('Content-Type: application/json');
    die(json_encode(['status' => 'error', 'message' => 'Veritabanı bağlantı hatası.']));
}
?>