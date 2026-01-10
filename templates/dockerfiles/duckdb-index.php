<?php
// DuckDB Web Interface powered by FrankenPHP
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DuckDB Service - FrankenPHP</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #333; border-bottom: 2px solid #007acc; padding-bottom: 10px; }
        .info { background: #e7f3ff; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .status { background: #d4edda; padding: 10px; border-radius: 5px; color: #155724; }
        code { background: #f8f9fa; padding: 2px 6px; border-radius: 3px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🦆 DuckDB Service</h1>
        <div class="status">
            ✅ FrankenPHP Server Running - <?= date('Y-m-d H:i:s') ?>
        </div>
        
        <div class="info">
            <h3>📊 DuckDB Information</h3>
            <p><strong>Service:</strong> In-memory analytical database</p>
            <p><strong>Port:</strong> 4214</p>
            <p><strong>Web Server:</strong> FrankenPHP with integrated Caddy</p>
            <p><strong>PHP Version:</strong> <?= phpversion() ?></p>
        </div>

        <div class="info">
            <h3>🔧 Usage Instructions</h3>
            <ul>
                <li>Connect to DuckDB using CLI: <code>duckdb /app/data/database.db</code></li>
                <li>Use DuckDB from applications via file path</li>
                <li>Data persistence: <code>/app/data/</code> directory</li>
                <li>Web interface powered by FrankenPHP</li>
            </ul>
        </div>

        <div class="info">
            <h3>📁 File System</h3>
            <p><strong>Data Directory:</strong></p>
            <ul>
                <?php
                $dataDir = '/app/data';
                if (is_dir($dataDir)) {
                    $files = scandir($dataDir);
                    foreach ($files as $file) {
                        if ($file != '.' && $file != '..') {
                            echo "<li>📄 $file</li>";
                        }
                    }
                    if (count($files) <= 2) {
                        echo "<li><em>No database files yet</em></li>";
                    }
                } else {
                    echo "<li><em>Data directory not accessible</em></li>";
                }
                ?>
            </ul>
        </div>

        <div class="info">
            <h3>🚀 FrankenPHP Features</h3>
            <ul>
                <li>✅ Built-in Caddy web server</li>
                <li>✅ HTTP/2 and HTTP/3 support</li>
                <li>✅ Automatic HTTPS (when configured)</li>
                <li>✅ High performance PHP runtime</li>
            </ul>
        </div>
    </div>
</body>
</html>