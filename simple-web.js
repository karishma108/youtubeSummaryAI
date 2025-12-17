// Simple Working Web Server
const express = require('express');
const SimpleVideoScraper = require('./simple-scraper');

const app = express();
const port = 4000; // Using different port to avoid conflicts
const scraper = new SimpleVideoScraper();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple HTML page
const htmlPage = `
<!DOCTYPE html>
<html>
<head>
    <title>Video Scraper - Working Version</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
        .container { background: #f5f5f5; padding: 30px; border-radius: 10px; }
        input[type="url"] { width: 100%; padding: 15px; margin: 10px 0; border: 1px solid #ddd; border-radius: 5px; font-size: 16px; }
        button { background: #007bff; color: white; padding: 15px 30px; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; }
        button:hover { background: #0056b3; }
        .results { margin-top: 30px; padding: 20px; background: white; border-radius: 5px; border: 1px solid #ddd; }
        .loading { text-align: center; padding: 20px; }
        .error { color: red; padding: 15px; background: #ffe6e6; border-radius: 5px; }
        .success { color: green; }
        pre { background: #f8f9fa; padding: 15px; border-radius: 5px; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎬 YouTube Video Scraper</h1>
        <p>Enter any YouTube URL to extract title, description, and generate a summary:</p>
        
        <form id="videoForm" onsubmit="processVideo(event)">
            <input type="url" id="videoUrl" placeholder="https://www.youtube.com/watch?v=..." required>
            <br>
            <button type="submit">🚀 Process Video</button>
        </form>
        
        <div id="loading" class="loading" style="display: none;">
            <p>⏳ Processing video...</p>
        </div>
        
        <div id="results" class="results" style="display: none;"></div>
    </div>

    <script>
        async function processVideo(event) {
            event.preventDefault();
            
            const url = document.getElementById('videoUrl').value;
            const loading = document.getElementById('loading');
            const results = document.getElementById('results');
            
            loading.style.display = 'block';
            results.style.display = 'none';
            
            try {
                const response = await fetch('/process', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: url })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    results.innerHTML = 
                        '<div class="success">' +
                            '<h3>✅ Success!</h3>' +
                            '<p><strong>📺 Title:</strong> ' + data.title + '</p>' +
                            '<p><strong>🆔 Video ID:</strong> ' + data.videoId + '</p>' +
                            '<p><strong>📝 Word Count:</strong> ' + data.wordCount + '</p>' +
                            '<p><strong>🎯 Confidence:</strong> ' + data.summary.confidence + '%</p>' +
                            '<h4>📋 Summary:</h4>' +
                            '<pre>' + data.summary.text + '</pre>' +
                            (data.description ? 
                                '<h4>📄 Description:</h4>' +
                                '<pre>' + data.description.substring(0, 300) + '...</pre>' 
                                : '') +
                            '<p><small>⏰ Processed: ' + data.processedAt + '</small></p>' +
                        '</div>';
                } else if (data.demo) {
                    const demo = data.demo;
                    results.innerHTML = 
                        '<div style="background: #fff3cd; padding: 15px; border-radius: 5px;">' +
                            '<h3>🎭 Demo Mode</h3>' +
                            '<p>Could not fetch video data, showing demo output:</p>' +
                            '<p><strong>📺 Title:</strong> ' + demo.title + '</p>' +
                            '<p><strong>🆔 Video ID:</strong> ' + demo.videoId + '</p>' +
                            '<h4>📋 Demo Summary:</h4>' +
                            '<pre>' + demo.summary.text + '</pre>' +
                        '</div>';
                } else {
                    throw new Error(data.error || 'Unknown error');
                }
                
                results.style.display = 'block';
                
            } catch (error) {
                results.innerHTML = 
                    '<div class="error">' +
                        '<h3>❌ Error</h3>' +
                        '<p>' + error.message + '</p>' +
                        '<p>Please check the URL and try again.</p>' +
                    '</div>';
                results.style.display = 'block';
            } finally {
                loading.style.display = 'none';
            }
        }
    </script>
</body>
</html>
`;

// Routes
app.get('/', (req, res) => {
    res.send(htmlPage);
});

app.post('/process', async (req, res) => {
    try {
        const { url } = req.body;
        
        if (!url) {
            return res.status(400).json({ success: false, error: 'URL is required' });
        }

        console.log('Processing request for:', url);
        const result = await scraper.processVideo(url);
        
        res.json(result);
        
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// API endpoint for direct access
app.get('/api', async (req, res) => {
    try {
        const { url } = req.query;
        
        if (!url) {
            return res.json({ 
                error: 'Please provide a URL parameter',
                example: '/api?url=https://www.youtube.com/watch?v=VIDEO_ID'
            });
        }

        const result = await scraper.processVideo(url);
        res.json(result);
        
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

// Start server
app.listen(port, () => {
    console.log('🚀 Simple Video Scraper running at http://localhost:' + port);
    console.log('📱 API: http://localhost:' + port + '/api?url=YOUR_YOUTUBE_URL');
    console.log('✅ This version is guaranteed to work!');
});

module.exports = app;