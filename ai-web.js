// AI-Enhanced Web Server with Gemini Integration
const http = require('http');
const { URL } = require('url');
const GeminiEnhancedProcessor = require('./gemini-processor');

const processor = new GeminiEnhancedProcessor();
const port = 6000; // Different port for AI version

// Enhanced HTML template with AI features
const htmlTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🤖 AI-Enhanced YouTube Video Analyzer</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
            color: #333;
        }
        .container { 
            max-width: 900px; 
            margin: 0 auto; 
            background: white; 
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.15);
            overflow: hidden;
        }
        .header { 
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
            color: white; 
            padding: 40px; 
            text-align: center; 
            position: relative;
        }
        .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="20" cy="20" r="2" fill="rgba(255,255,255,0.1)"/><circle cx="80" cy="20" r="2" fill="rgba(255,255,255,0.1)"/><circle cx="20" cy="80" r="2" fill="rgba(255,255,255,0.1)"/><circle cx="80" cy="80" r="2" fill="rgba(255,255,255,0.1)"/></svg>');
        }
        .header-content { position: relative; z-index: 1; }
        .header h1 { 
            font-size: 2.8em; 
            margin-bottom: 15px; 
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .header p { 
            font-size: 1.2em; 
            opacity: 0.95; 
            margin-bottom: 10px;
        }
        .ai-badge {
            display: inline-block;
            background: rgba(255,255,255,0.2);
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 0.9em;
            margin-top: 10px;
        }
        .content { padding: 50px; }
        .form-section {
            background: #f8f9fa;
            padding: 30px;
            border-radius: 15px;
            margin-bottom: 30px;
            border: 2px dashed #667eea;
        }
        .form-group { margin-bottom: 25px; }
        label { 
            display: block; 
            margin-bottom: 10px; 
            font-weight: 600; 
            color: #555; 
            font-size: 1.1em;
        }
        input[type="url"] { 
            width: 100%; 
            padding: 18px; 
            border: 3px solid #e0e0e0; 
            border-radius: 12px; 
            font-size: 16px;
            transition: all 0.3s ease;
            background: white;
        }
        input[type="url"]:focus { 
            outline: none; 
            border-color: #667eea; 
            box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.15);
            transform: translateY(-2px);
        }
        .api-status {
            padding: 15px;
            border-radius: 10px;
            margin-bottom: 20px;
            font-weight: 500;
        }
        .api-configured {
            background: #d4edda;
            color: #155724;
            border: 2px solid #c3e6cb;
        }
        .api-not-configured {
            background: #fff3cd;
            color: #856404;
            border: 2px solid #ffeaa7;
        }
        .btn { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white; 
            border: none; 
            padding: 18px 40px; 
            border-radius: 60px;
            font-size: 18px; 
            font-weight: 600;
            cursor: pointer; 
            transition: all 0.3s ease;
            width: 100%;
            position: relative;
            overflow: hidden;
        }
        .btn::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
            transition: left 0.5s;
        }
        .btn:hover::before {
            left: 100%;
        }
        .btn:hover { 
            transform: translateY(-3px); 
            box-shadow: 0 15px 35px rgba(102, 126, 234, 0.4);
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
            padding: 30px; 
            color: #666;
        }
        .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #f3f3f3;
            border-top: 4px solid #667eea;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .progress-text {
            font-size: 1.1em;
            margin-bottom: 10px;
            font-weight: 500;
        }
        .results { 
            display: none; 
            margin-top: 40px; 
        }
        .result-header {
            background: linear-gradient(135deg, #00b894 0%, #00cec9 100%);
            color: white;
            padding: 25px;
            border-radius: 15px 15px 0 0;
            text-align: center;
        }
        .result-header h2 {
            font-size: 1.8em;
            margin-bottom: 10px;
        }
        .result-body {
            background: white;
            border: 3px solid #00b894;
            border-top: none;
            border-radius: 0 0 15px 15px;
            padding: 30px;
        }
        .stats-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 20px; 
            margin-bottom: 30px;
        }
        .stat-card { 
            text-align: center; 
            padding: 20px; 
            background: #f8f9fa; 
            border-radius: 12px;
            border-left: 5px solid #667eea;
            transition: transform 0.3s;
        }
        .stat-card:hover {
            transform: translateY(-5px);
        }
        .stat-value { 
            font-size: 2em; 
            font-weight: bold; 
            color: #667eea; 
            margin-bottom: 8px;
        }
        .stat-label { 
            font-size: 0.95em; 
            color: #666; 
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .summary-section {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            padding: 25px;
            border-radius: 15px;
            margin: 20px 0;
            border-left: 5px solid #28a745;
        }
        .summary-title {
            font-size: 1.4em;
            font-weight: 600;
            color: #333;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
        }
        .ai-indicator {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 5px 12px;
            border-radius: 15px;
            font-size: 0.8em;
            margin-left: 10px;
        }
        .summary-text {
            line-height: 1.7;
            font-size: 1.1em;
            color: #444;
        }
        .transcript-section {
            background: white;
            border: 2px solid #e9ecef;
            border-radius: 12px;
            padding: 25px;
            margin: 20px 0;
        }
        .transcript-header {
            font-size: 1.3em;
            font-weight: 600;
            margin-bottom: 15px;
            color: #333;
        }
        .transcript-text {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            max-height: 300px;
            overflow-y: auto;
            line-height: 1.6;
            font-family: 'Courier New', monospace;
            border-left: 4px solid #667eea;
        }
        .error { 
            background: #f8d7da; 
            color: #721c24; 
            padding: 20px; 
            border-radius: 12px; 
            border-left: 5px solid #dc3545;
            margin-top: 20px;
        }
        .setup-link {
            display: inline-block;
            margin-top: 15px;
            padding: 10px 20px;
            background: #007bff;
            color: white;
            text-decoration: none;
            border-radius: 25px;
            font-weight: 500;
            transition: all 0.3s;
        }
        .setup-link:hover {
            background: #0056b3;
            transform: translateY(-2px);
        }
        .method-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 0.85em;
            font-weight: 500;
            margin-left: 10px;
        }
        .method-ai { background: #d1ecf1; color: #0c5460; }
        .method-fallback { background: #fff3cd; color: #856404; }
        @media (max-width: 768px) {
            .content { padding: 30px 25px; }
            .header h1 { font-size: 2.2em; }
            .stats-grid { grid-template-columns: repeat(2, 1fr); }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="header-content">
                <h1>🤖 AI Video Analyzer</h1>
                <p>Powered by Google Gemini AI for Intelligent Video Analysis</p>
                <div class="ai-badge">🧠 Advanced AI • 📝 Real Transcripts • 🎯 Smart Summaries</div>
            </div>
        </div>
        
        <div class="content">
            <div class="form-section">
                <div id="apiStatus" class="api-status api-not-configured">
                    ⚠️ Gemini API not configured - using enhanced fallback mode
                    <a href="#" class="setup-link" onclick="showApiSetup()">🔧 Setup Gemini API</a>
                </div>
                
                <form onsubmit="processVideoWithAI(event)">
                    <div class="form-group">
                        <label for="videoUrl">🔗 YouTube Video URL</label>
                        <input 
                            type="url" 
                            id="videoUrl" 
                            placeholder="https://www.youtube.com/watch?v=..." 
                            value="https://www.youtube.com/watch?v=0RiDPisQAzM"
                            required
                        >
                    </div>
                    
                    <button type="submit" class="btn" id="processBtn">
                        🤖 Analyze with AI
                    </button>
                </form>
            </div>
            
            <div class="loading" id="loading">
                <div class="spinner"></div>
                <div class="progress-text" id="progressText">🧠 AI is analyzing your video...</div>
                <p>This may take a few moments for the best results</p>
            </div>
            
            <div class="results" id="results"></div>
            
            <div id="apiSetupModal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 1000; padding: 20px;">
                <div style="max-width: 600px; margin: 50px auto; background: white; border-radius: 15px; padding: 30px;">
                    <h2>🔧 Gemini API Setup</h2>
                    <p style="margin: 15px 0;">Get your free Gemini API key for enhanced AI features:</p>
                    <ol style="margin: 15px 0; padding-left: 20px;">
                        <li>Visit: <a href="https://makersuite.google.com/app/apikey" target="_blank">Google AI Studio</a></li>
                        <li>Sign in with your Google account</li>
                        <li>Click "Create API Key"</li>
                        <li>Copy your API key</li>
                        <li>Set it in your environment variables or code</li>
                    </ol>
                    <button onclick="hideApiSetup()" style="background: #667eea; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer;">Got it!</button>
                </div>
            </div>
        </div>
    </div>

    <script>
        let processingSteps = [
            '🔍 Extracting video information...',
            '📝 Attempting to fetch real transcript...',
            '🤖 Analyzing content with AI...',
            '📊 Generating intelligent summary...',
            '✨ Finalizing results...'
        ];
        let currentStep = 0;

        async function processVideoWithAI(event) {
            event.preventDefault();
            
            const url = document.getElementById('videoUrl').value.trim();
            const loading = document.getElementById('loading');
            const results = document.getElementById('results');
            const btn = document.getElementById('processBtn');
            
            // Reset UI
            loading.style.display = 'block';
            results.style.display = 'none';
            btn.disabled = true;
            currentStep = 0;
            
            // Animate processing steps
            const stepInterval = setInterval(() => {
                if (currentStep < processingSteps.length) {
                    document.getElementById('progressText').textContent = processingSteps[currentStep];
                    currentStep++;
                } else {
                    clearInterval(stepInterval);
                }
            }, 1500);
            
            try {
                const response = await fetch('/analyze', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ url: url })
                });
                
                const data = await response.json();
                clearInterval(stepInterval);
                
                if (data.success) {
                    displayAIResults(data);
                } else if (data.fallback) {
                    displayAIResults(data.fallback);
                } else {
                    displayError(data.error || 'Unknown error occurred');
                }
                
            } catch (error) {
                clearInterval(stepInterval);
                displayError('Network error: ' + error.message);
            } finally {
                loading.style.display = 'none';
                btn.disabled = false;
            }
        }
        
        function displayAIResults(data) {
            const results = document.getElementById('results');
            
            const methodBadge = data.stats?.aiEnhanced ? 
                '<span class="method-badge method-ai">🤖 AI Enhanced</span>' :
                '<span class="method-badge method-fallback">📝 Enhanced Fallback</span>';
                
            results.innerHTML = 
                '<div class="result-header">' +
                    '<h2>✅ Analysis Complete!</h2>' +
                    '<p>AI-powered video analysis results</p>' +
                '</div>' +
                '<div class="result-body">' +
                    '<div class="stats-grid">' +
                        '<div class="stat-card">' +
                            '<div class="stat-value">' + (data.stats?.confidence || 85) + '%</div>' +
                            '<div class="stat-label">Confidence</div>' +
                        '</div>' +
                        '<div class="stat-card">' +
                            '<div class="stat-value">' + (data.transcript?.wordCount || 'N/A') + '</div>' +
                            '<div class="stat-label">Words</div>' +
                        '</div>' +
                        '<div class="stat-card">' +
                            '<div class="stat-value">' + (data.transcript?.available ? '✅' : '❌') + '</div>' +
                            '<div class="stat-label">Real Transcript</div>' +
                        '</div>' +
                        '<div class="stat-card">' +
                            '<div class="stat-value">' + data.videoId.substring(0, 8) + '...</div>' +
                            '<div class="stat-label">Video ID</div>' +
                        '</div>' +
                    '</div>' +
                    
                    '<div class="summary-section">' +
                        '<div class="summary-title">' +
                            '🤖 AI-Generated Summary' +
                            methodBadge +
                        '</div>' +
                        '<div class="summary-text">' + data.summary.text + '</div>' +
                    '</div>' +
                    
                    (data.transcript?.available && data.transcript.text ? 
                        '<div class="transcript-section">' +
                            '<div class="transcript-header">📜 Video Transcript (' + data.transcript.length + ' characters)</div>' +
                            '<div class="transcript-text">' + data.transcript.text.substring(0, 800) + '...</div>' +
                        '</div>' : ''
                    ) +
                    
                    '<div style="margin-top: 25px; padding: 15px; background: #f8f9fa; border-radius: 10px; font-size: 0.9em; color: #666;">' +
                        '<strong>📊 Analysis Details:</strong><br>' +
                        'Method: ' + (data.stats?.processingMethod || data.summary.method) + ' | ' +
                        'Processed: ' + data.processedAt +
                    '</div>' +
                '</div>';
            
            results.style.display = 'block';
        }
        
        function displayError(errorMessage) {
            const results = document.getElementById('results');
            results.innerHTML = 
                '<div class="error">' +
                    '<h3>❌ Analysis Error</h3>' +
                    '<p>' + errorMessage + '</p>' +
                    '<p><small>Please check the URL format and try again.</small></p>' +
                '</div>';
            results.style.display = 'block';
        }
        
        function showApiSetup() {
            document.getElementById('apiSetupModal').style.display = 'block';
        }
        
        function hideApiSetup() {
            document.getElementById('apiSetupModal').style.display = 'none';
        }
    </script>
</body>
</html>`;

// Create AI-enhanced HTTP server
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
    
    // AI analysis endpoint
    if (parsedUrl.pathname === '/analyze' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
            body += chunk.toString();
        });
        
        req.on('end', async () => {
            try {
                const data = JSON.parse(body);
                console.log('🤖 AI Analysis request for:', data.url);
                
                const result = await processor.processVideoWithAI(data.url);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(result));
                
                console.log('✅ AI Analysis completed for:', data.url);
                
            } catch (error) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    success: false, 
                    error: error.message 
                }));
                console.log('❌ Error processing AI request:', error.message);
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
        
        (async () => {
            try {
                console.log('🤖 API AI Analysis request for:', videoUrl);
                const result = await processor.processVideoWithAI(videoUrl);
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(result));
                console.log('✅ API AI Analysis completed for:', videoUrl);
            } catch (error) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    success: false, 
                    error: error.message 
                }));
            }
        })();
        return;
    }
    
    // 404 for other paths
    res.writeHead(404, { 'Content-Type': 'text/html' });
    res.end('<h1>404 - Not Found</h1><p>Try <a href="/">AI Video Analyzer</a> or <a href="/api?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ">API</a></p>');
});

// Start server
server.listen(port, () => {
    console.log('🤖 Gemini AI Enhanced Video Processor initialized');
    console.log('🚀 AI-Enhanced server running at http://localhost:' + port);
    console.log('📱 API endpoint: http://localhost:' + port + '/api?url=YOUR_YOUTUBE_URL');
    console.log('💡 Features: Real transcripts + AI analysis + Smart summaries');
    console.log('🔧 Setup Gemini API for full AI features (see GEMINI-SETUP.md)');
    console.log('🌟 Open your browser: http://localhost:' + port);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down AI server...');
    server.close(() => {
        console.log('✅ AI Server stopped');
        process.exit(0);
    });
});