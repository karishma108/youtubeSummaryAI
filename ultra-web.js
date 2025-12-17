// Ultra-Simple Web Server - No External Dependencies
const http = require('http');
const { URL } = require('url');
const UltraSimpleProcessor = require('./ultra-simple');

const processor = new UltraSimpleProcessor();
const port = 5000;

// HTML page template
const htmlTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ultra-Simple YouTube Video Processor</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6; 
            color: #333; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        .container { 
            max-width: 800px; 
            margin: 0 auto; 
            background: white; 
            border-radius: 15px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .header { 
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
            color: white; 
            padding: 30px; 
            text-align: center; 
        }
        .header h1 { font-size: 2.2em; margin-bottom: 10px; }
        .header p { font-size: 1.1em; opacity: 0.9; }
        .content { padding: 40px; }
        .form-group { margin-bottom: 20px; }
        label { display: block; margin-bottom: 8px; font-weight: bold; color: #555; }
        input[type="url"] { 
            width: 100%; 
            padding: 15px; 
            border: 2px solid #ddd; 
            border-radius: 8px; 
            font-size: 16px;
            transition: border-color 0.3s;
        }
        input[type="url"]:focus { 
            outline: none; 
            border-color: #667eea; 
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }
        .btn { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; 
            border: none; 
            padding: 15px 30px; 
            border-radius: 50px;
            font-size: 16px; 
            font-weight: bold;
            cursor: pointer; 
            transition: transform 0.3s, box-shadow 0.3s;
            width: 100%;
        }
        .btn:hover { 
            transform: translateY(-2px); 
            box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
        }
        .btn:disabled { 
            background: #ccc; 
            transform: none; 
            box-shadow: none; 
            cursor: not-allowed; 
        }
        .loading { 
            display: none; 
            text-align: center; 
            padding: 20px; 
            color: #666;
        }
        .spinner {
            border: 3px solid #f3f3f3;
            border-top: 3px solid #667eea;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            animation: spin 1s linear infinite;
            margin: 0 auto 15px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .results { 
            display: none; 
            margin-top: 30px; 
            padding: 25px; 
            background: #f8f9fa; 
            border-radius: 10px;
            border-left: 4px solid #667eea;
        }
        .result-item { 
            margin-bottom: 15px; 
            padding: 15px; 
            background: white; 
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
        .result-label { 
            font-weight: bold; 
            color: #555; 
            margin-bottom: 5px;
        }
        .result-value { color: #333; line-height: 1.5; }
        .summary-box { 
            background: white; 
            padding: 20px; 
            border-radius: 8px; 
            border-left: 4px solid #28a745;
            margin: 15px 0;
        }
        .stats { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); 
            gap: 15px; 
            margin: 20px 0;
        }
        .stat { 
            text-align: center; 
            padding: 15px; 
            background: white; 
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
        }
        .stat-value { 
            font-size: 1.5em; 
            font-weight: bold; 
            color: #667eea; 
            margin-bottom: 5px;
        }
        .stat-label { font-size: 0.9em; color: #666; }
        .error { 
            background: #f8d7da; 
            color: #721c24; 
            padding: 15px; 
            border-radius: 8px; 
            border-left: 4px solid #dc3545;
            margin-top: 20px;
        }
        .success { 
            background: #d4edda; 
            color: #155724; 
            padding: 15px; 
            border-radius: 8px; 
            border-left: 4px solid #28a745;
            margin-bottom: 20px;
        }
        @media (max-width: 600px) {
            .content { padding: 20px; }
            .header h1 { font-size: 1.8em; }
            .stats { grid-template-columns: repeat(2, 1fr); }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎬 YouTube Video Processor</h1>
            <p>Ultra-Simple • Fast • Reliable • No Dependencies Required</p>
        </div>
        
        <div class="content">
            <form onsubmit="processVideo(event)">
                <div class="form-group">
                    <label for="videoUrl">🔗 YouTube Video URL</label>
                    <input 
                        type="url" 
                        id="videoUrl" 
                        placeholder="https://www.youtube.com/watch?v=..." 
                        required
                    >
                </div>
                <button type="submit" class="btn" id="processBtn">
                    🚀 Process Video
                </button>
            </form>
            
            <div class="loading" id="loading">
                <div class="spinner"></div>
                <p>Processing your video...</p>
            </div>
            
            <div class="results" id="results"></div>
        </div>
    </div>

    <script>
        async function processVideo(event) {
            event.preventDefault();
            
            const url = document.getElementById('videoUrl').value.trim();
            const loading = document.getElementById('loading');
            const results = document.getElementById('results');
            const btn = document.getElementById('processBtn');
            
            // Reset UI
            loading.style.display = 'block';
            results.style.display = 'none';
            btn.disabled = true;
            
            try {
                const response = await fetch('/process', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ url: url })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    displaySuccess(data);
                } else {
                    displayError(data.error || 'Unknown error occurred');
                }
                
            } catch (error) {
                displayError('Network error: ' + error.message);
            } finally {
                loading.style.display = 'none';
                btn.disabled = false;
            }
        }
        
        function displaySuccess(data) {
            const results = document.getElementById('results');
            results.innerHTML = 
                '<div class="success">✅ Processing completed successfully!</div>' +
                '<div class="stats">' +
                    '<div class="stat">' +
                        '<div class="stat-value">' + data.stats.wordCount + '</div>' +
                        '<div class="stat-label">Words</div>' +
                    '</div>' +
                    '<div class="stat">' +
                        '<div class="stat-value">' + data.summary.confidence + '%</div>' +
                        '<div class="stat-label">Confidence</div>' +
                    '</div>' +
                    '<div class="stat">' +
                        '<div class="stat-value">' + data.stats.compressionRatio + '</div>' +
                        '<div class="stat-label">Compression</div>' +
                    '</div>' +
                    '<div class="stat">' +
                        '<div class="stat-value">' + data.videoId.substring(0, 6) + '...</div>' +
                        '<div class="stat-label">Video ID</div>' +
                    '</div>' +
                '</div>' +
                '<div class="result-item">' +
                    '<div class="result-label">🎬 Video Title</div>' +
                    '<div class="result-value">' + data.title + '</div>' +
                '</div>' +
                '<div class="summary-box">' +
                    '<div class="result-label">📋 Generated Summary</div>' +
                    '<div class="result-value">' + data.summary.text + '</div>' +
                '</div>' +
                '<div class="result-item">' +
                    '<div class="result-label">📄 Description</div>' +
                    '<div class="result-value">' + data.description + '</div>' +
                '</div>' +
                '<div class="result-item">' +
                    '<div class="result-label">ℹ️ Processing Info</div>' +
                    '<div class="result-value">Method: ' + data.method + ' | Processed: ' + data.processedAt + '</div>' +
                '</div>';
            
            results.style.display = 'block';
        }
        
        function displayError(errorMessage) {
            const results = document.getElementById('results');
            results.innerHTML = 
                '<div class="error">' +
                    '<h3>❌ Processing Error</h3>' +
                    '<p>' + errorMessage + '</p>' +
                    '<p><small>Please check the URL format and try again.</small></p>' +
                '</div>';
            results.style.display = 'block';
        }
        
        // Auto-fill demo URL for easy testing
        document.addEventListener('DOMContentLoaded', function() {
            const urlInput = document.getElementById('videoUrl');
            urlInput.value = 'https://www.youtube.com/watch?v=0RiDPisQAzM';
        });
    </script>
</body>
</html>`;

// Create HTTP server
const server = http.createServer((req, res) => {
    const parsedUrl = new URL(req.url, 'http://' + req.headers.host);
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    // Serve main page
    if (parsedUrl.pathname === '/' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(htmlTemplate);
        return;
    }
    
    // Process video endpoint
    if (parsedUrl.pathname === '/process' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const result = processor.processVideo(data.url);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(result));
                
                console.log('✅ Processed request for:', data.url);
                
            } catch (error) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    success: false, 
                    error: error.message 
                }));
                console.log('❌ Error processing request:', error.message);
            }
        });
        return;
    }
    
    // API endpoint for direct access
    if (parsedUrl.pathname === '/api' && req.method === 'GET') {
        const videoUrl = parsedUrl.searchParams.get('url');
        
        if (!videoUrl) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                error: 'Missing URL parameter',
                usage: '/api?url=https://www.youtube.com/watch?v=VIDEO_ID'
            }));
            return;
        }
        
        try {
            const result = processor.processVideo(videoUrl);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(result));
            console.log('✅ API request processed for:', videoUrl);
        } catch (error) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ 
                success: false, 
                error: error.message 
            }));
        }
        return;
    }
    
    // 404 for other paths
    res.writeHead(404, { 'Content-Type': 'text/html' });
    res.end('<h1>404 - Not Found</h1><p>Try <a href="/">Home Page</a> or <a href="/api?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ">API</a></p>');
});

// Start server
server.listen(port, () => {
    console.log('🎬 Ultra-Simple Video Processor initialized');
    console.log('🚀 Server running at http://localhost:' + port);
    console.log('📱 API endpoint: http://localhost:' + port + '/api?url=YOUR_YOUTUBE_URL');
    console.log('✅ Zero dependencies - guaranteed to work!');
    console.log('💡 Open your browser and go to: http://localhost:' + port);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    server.close(() => {
        console.log('✅ Server stopped');
        process.exit(0);
    });
});