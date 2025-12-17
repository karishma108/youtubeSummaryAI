// Web Interface for Video Transcript Scraper
const express = require('express');
const path = require('path');
const EnhancedVideoScraper = require('./enhanced-scraper');
const BackupVideoScraper = require('./backup-scraper');

const app = express();
const port = 3000;
const scraper = new EnhancedVideoScraper();
const backupScraper = new BackupVideoScraper();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routes
app.get('/', (req, res) => {
    res.render('index', { title: 'Video Transcript Scraper' });
});

app.post('/scrape', async (req, res) => {
    try {
        const { videoUrl, summaryLength, summaryMethod, includeKeywords } = req.body;
        
        if (!videoUrl) {
            return res.status(400).json({ error: 'Video URL is required' });
        }

        const options = {
            summaryLength: parseInt(summaryLength) || 5,
            summaryMethod: summaryMethod || 'frequency',
            includeKeywords: includeKeywords === 'on',
            includeTimestamps: false
        };

        console.log('Processing request for:', videoUrl);

        // Try primary scraper first
        let result = await scraper.processVideo(videoUrl, options);
        
        // If primary scraper fails, try backup scraper
        if (!result.success || result.transcript?.isDemo) {
            console.log('Primary scraper failed or returned demo, trying backup method...');
            const backupResult = await backupScraper.processVideo(videoUrl);
            
            if (backupResult.success) {
                // Format backup result to match expected structure
                result = {
                    success: true,
                    videoUrl: backupResult.videoUrl,
                    videoId: backupResult.videoId,
                    duration: 'Unknown',
                    transcript: {
                        full: backupResult.content.text,
                        length: backupResult.content.length,
                        wordCount: backupResult.content.text.split(/\s+/).length,
                        source: 'backup_method'
                    },
                    summary: {
                        text: backupResult.summary.text,
                        length: backupResult.summary.text.length,
                        method: 'backup_scraper',
                        confidence: backupResult.summary.confidence,
                        compressionRatio: 'N/A'
                    },
                    keywords: [], // Backup method doesn't extract keywords
                    title: backupResult.title,
                    method: 'backup',
                    processedAt: backupResult.processedAt
                };
            }
        }
        
        if (result.success) {
            res.json(result);
        } else {
            res.status(500).json(result);
        }
        
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

app.get('/api/scrape', async (req, res) => {
    try {
        const { url, length, method } = req.query;
        
        if (!url) {
            return res.status(400).json({ error: 'URL parameter is required' });
        }

        const result = await scraper.processVideo(url, {
            summaryLength: parseInt(length) || 5,
            summaryMethod: method || 'frequency',
            includeKeywords: true
        });
        
        res.json(result);
        
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            error: error.message 
        });
    }
});

// Start server
app.listen(port, () => {
    console.log(`🚀 Video Transcript Scraper running at http://localhost:${port}`);
    console.log(`📖 API endpoint: http://localhost:${port}/api/scrape?url=YOUR_YOUTUBE_URL`);
});

module.exports = app;