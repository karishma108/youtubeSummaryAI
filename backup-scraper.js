// Backup Video Information Scraper
const axios = require('axios');
const cheerio = require('cheerio');

class BackupVideoScraper {
    constructor() {
        this.name = 'Backup Video Scraper';
    }

    // Extract video ID from YouTube URL
    extractVideoId(url) {
        const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/;
        const match = url.match(regex);
        return match ? match[1] : null;
    }

    // Get video information from YouTube page
    async getVideoInfo(videoUrl) {
        try {
            const videoId = this.extractVideoId(videoUrl);
            if (!videoId) {
                throw new Error('Invalid YouTube URL');
            }

            console.log('Fetching video information...');
            const response = await axios.get(videoUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                }
            });

            const $ = cheerio.load(response.data);
            
            // Extract video title
            const title = $('title').text().replace(' - YouTube', '') || 'Video Title Not Found';
            
            // Extract description from meta tags
            const description = $('meta[name="description"]').attr('content') || 
                              $('meta[property="og:description"]').attr('content') || 
                              'Description not available';

            // Generate content based on title and description
            const combinedContent = `${title}. ${description}`;
            
            return {
                success: true,
                videoId,
                title,
                description,
                content: combinedContent,
                source: 'metadata'
            };

        } catch (error) {
            throw new Error(`Failed to fetch video info: ${error.message}`);
        }
    }

    // Generate summary from available content
    summarizeContent(content, maxSentences = 3) {
        if (!content || content.length < 50) {
            return {
                summary: 'Unable to generate meaningful summary from available content.',
                confidence: 10
            };
        }

        // Clean and split content
        const cleanContent = content
            .replace(/\s+/g, ' ')
            .trim();

        const sentences = cleanContent
            .split(/[.!?]+/)
            .filter(s => s.trim().length > 10)
            .map(s => s.trim());

        if (sentences.length <= maxSentences) {
            return {
                summary: cleanContent,
                confidence: 80
            };
        }

        // Take first few sentences and ensure variety
        const selectedSentences = sentences.slice(0, maxSentences);
        const summary = selectedSentences.join('. ') + '.';

        return {
            summary: summary,
            confidence: 60
        };
    }

    // Main processing function
    async processVideo(videoUrl) {
        try {
            console.log('🎥 Processing video with backup method:', videoUrl);
            
            const videoInfo = await this.getVideoInfo(videoUrl);
            const summaryResult = this.summarizeContent(videoInfo.content, 4);

            return {
                success: true,
                videoUrl,
                videoId: videoInfo.videoId,
                title: videoInfo.title,
                method: 'backup_scraper',
                content: {
                    text: videoInfo.content,
                    length: videoInfo.content.length,
                    source: videoInfo.source
                },
                summary: {
                    text: summaryResult.summary,
                    confidence: summaryResult.confidence,
                    method: 'metadata_based'
                },
                processedAt: new Date().toISOString()
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                videoUrl,
                method: 'backup_scraper',
                processedAt: new Date().toISOString()
            };
        }
    }

    // Display results
    displayResults(result) {
        console.log('\n' + '='.repeat(60));
        console.log('📺 BACKUP VIDEO SCRAPER RESULTS');
        console.log('='.repeat(60));
        
        if (!result.success) {
            console.log('❌ ERROR:', result.error);
            return;
        }

        console.log(`📹 Video ID: ${result.videoId}`);
        console.log(`🎬 Title: ${result.title}`);
        console.log(`📊 Method: ${result.method}`);
        console.log(`🎯 Confidence: ${result.summary.confidence}%`);
        
        console.log('\n📋 SUMMARY:');
        console.log('-'.repeat(40));
        console.log(result.summary.text);
        
        console.log('\n📄 SOURCE CONTENT:');
        console.log('-'.repeat(40));
        console.log(result.content.text.substring(0, 300) + '...');
        console.log('\n' + '='.repeat(60));
    }
}

module.exports = BackupVideoScraper;