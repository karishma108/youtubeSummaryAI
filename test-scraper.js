// Simple test script for video transcript scraper
const EnhancedVideoScraper = require('./enhanced-scraper');

async function testScraper() {
    const scraper = new EnhancedVideoScraper();
    
    // Test URLs - you can replace these with any YouTube video URLs
    const testVideos = [
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Famous Rick Roll
        'https://www.youtube.com/watch?v=9bZkp7q19f0', // Popular tech video
        // Add your own test URLs here
    ];

    console.log('🎬 Testing Video Transcript Scraper');
    console.log('='.repeat(50));

    for (const url of testVideos) {
        console.log(`\n🎯 Testing: ${url}`);
        
        try {
            const result = await scraper.processVideo(url, {
                summaryLength: 4,
                summaryMethod: 'hybrid',
                includeKeywords: true
            });

            if (result.success) {
                console.log(`✅ Success!`);
                console.log(`📊 Duration: ${result.duration}`);
                console.log(`📝 Transcript: ${result.transcript.wordCount} words`);
                console.log(`🎯 Summary confidence: ${result.summary.confidence}%`);
                console.log(`\n📋 Summary:`);
                console.log(result.summary.text.substring(0, 200) + '...');
                
                if (result.keywords && result.keywords.length > 0) {
                    console.log(`\n🔑 Top keywords: ${result.keywords.slice(0, 5).map(k => k.word).join(', ')}`);
                }
            } else {
                console.log(`❌ Failed: ${result.error}`);
            }
            
        } catch (error) {
            console.log(`❌ Error: ${error.message}`);
        }
        
        console.log('-'.repeat(50));
    }
}

// Command line usage
if (process.argv.length > 2) {
    const url = process.argv[2];
    const scraper = new EnhancedVideoScraper();
    
    console.log('🎬 Processing single video...');
    scraper.processVideo(url, {
        summaryLength: 6,
        summaryMethod: 'frequency',
        includeKeywords: true
    })
    .then(result => scraper.displayResults(result))
    .catch(console.error);
} else {
    testScraper().catch(console.error);
}

module.exports = { testScraper };