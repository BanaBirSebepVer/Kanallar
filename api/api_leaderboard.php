<?php
// api_leaderboard.php
require 'db.php';

header('Content-Type: application/json');

try {
    // Son 1 ay içindeki görüntülemeleri baz alarak listeleri grupla ve büyükten küçüğe sırala
    $stmt = $pdo->query("
        SELECT 
            sl.List_ID, 
            COUNT(lv.View_ID) as Total_Views 
        FROM Shared_Lists sl
        JOIN List_Views lv ON sl.List_ID = lv.List_ID
        WHERE lv.View_Date >= NOW() - INTERVAL 1 MONTH
        GROUP BY sl.List_ID
        ORDER BY Total_Views DESC
        LIMIT 10
    ");
    
    $leaderboard = $stmt->fetchAll();

    echo json_encode(['status' => 'success', 'data' => $leaderboard]);
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => 'Lider tablosu oluşturulamadı.']);
}
?>