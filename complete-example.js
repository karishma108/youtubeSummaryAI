// Complete Working Example - Video Transcript Processor
const EnhancedVideoScraper = require('./enhanced-scraper');
const BackupVideoScraper = require('./backup-scraper');

class VideoProcessor {
    constructor() {
        this.primaryScraper = new EnhancedVideoScraper();
        this.backupScraper = new BackupVideoScraper();
    }

    async processVideoWithFallback(videoUrl) {
        console.log('🎬 Starting video processing...');
        console.log('🔗 URL:', videoUrl);
        console.log('='.repeat(80));

        // Method 1: Try enhanced scraper with transcript
        console.log('📝 Attempting to fetch transcript...');
        try {
            const result = await this.primaryScraper.processVideo(videoUrl, {
                summaryLength: 5,
                summaryMethod: 'hybrid',
                includeKeywords: true
            });

            if (result.success && !result.transcript?.isDemo) {
                console.log('✅ SUCCESS: Got real transcript!');
                this.primaryScraper.displayResults(result);
                return result;
            } else if (result.transcript?.isDemo) {
                console.log('⚠️  Got demo transcript, trying backup method...');
            }
        } catch (error) {
            console.log('❌ Primary method failed:', error.message);
        }

        // Method 2: Try backup scraper
        console.log('\n🔧 Attempting backup method (metadata scraping)...');
        try {
            const backupResult = await this.backupScraper.processVideo(videoUrl);
            if (backupResult.success) {
                console.log('✅ SUCCESS: Got video information via backup method!');
                this.backupScraper.displayResults(backupResult);
                return backupResult;
            }
        } catch (error) {
            console.log('❌ Backup method failed:', error.message);
        }

        // Method 3: Generate sample output for demonstration
        console.log('\n🎭 Generating demonstration output...');
        return this.generateDemoOutput(videoUrl);
    }

    generateDemoOutput(videoUrl) {
        const videoId = this.primaryScraper.extractVideoId(videoUrl);
        const demoResult = {
            success: true,
            videoUrl,
            videoId,
            method: 'demo',
            title: 'Sample Video Processing',
            summary: {
                text: 'This is a demonstration of the video processing system. In a real scenario, this would contain an intelligent summary of the video content extracted from either the transcript or video metadata. The system uses advanced text processing to create concise, meaningful summaries.',
                confidence: 75,
                method: 'demo'
            },
            transcript: {
                full: 'This is a sample transcript that would normally be extracted from the video captions or subtitles. The system processes this text to identify key concepts, extract important information, and generate comprehensive summaries that capture the essential points of the video content.',
                wordCount: 35,
                length: 280
            },
            keywords: [
                {word: 'video', frequency: 3},
                {word: 'processing', frequency: 2},
                {word: 'system', frequency: 2},
                {word: 'content', frequency: 2}
            ]
        };

        console.log('\n' + '='.repeat(80));
        console.log('🎭 DEMONSTRATION MODE - SAMPLE OUTPUT');
        console.log('='.repeat(80));
        console.log(`📹 Video ID: ${demoResult.videoId}`);
        console.log(`🎬 Method: ${demoResult.method}`);
        console.log(`🎯 Confidence: ${demoResult.summary.confidence}%`);
        
        console.log('\n📋 SAMPLE SUMMARY:');
        console.log('-'.repeat(50));
        console.log(demoResult.summary.text);
        
        console.log('\n🔍 SAMPLE KEYWORDS:');
        console.log('-'.repeat(50));
        demoResult.keywords.forEach((kw, i) => {
            console.log(`${i + 1}. ${kw.word} (${kw.frequency})`);
        });

        console.log('\n📜 SAMPLE TRANSCRIPT:');
        console.log('-'.repeat(50));
        console.log(demoResult.transcript.full);
        console.log('\n' + '='.repeat(80));
        console.log('💡 TIP: Try URLs with captions/subtitles for real transcript extraction!');
        console.log('📺 Good examples: TED talks, news videos, educational content');
        console.log('='.repeat(80));

        return demoResult;
    }
}

// Main execution
async function main() {
    const processor = new VideoProcessor();
    
    // Get URL from command line or use default
    const testUrl = process.argv[2] || 'https://www.youtube.com/watch?v=0RiDPisQAzM';
    
    try {
        await processor.processVideoWithFallback(testUrl);
    } catch (error) {
        console.error('❌ Processing failed:', error.message);
    }
}

// Export for use in other modules
module.exports = VideoProcessor;

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}