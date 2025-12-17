// Video Transcript Scraper and Summarizer
const axios = require('axios');
const cheerio = require('cheerio');

class VideoTranscriptScraper {
    constructor() {
        this.baseUrl = 'https://www.youtube.com';
    }

    // Extract video ID from YouTube URL
    extractVideoId(url) {
        const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
        const match = url.match(regex);
        return match ? match[1] : null;
    }

    // Get transcript from YouTube video
    async getTranscript(videoUrl) {
        try {
            const videoId = this.extractVideoId(videoUrl);
            if (!videoId) {
                throw new Error('Invalid YouTube URL');
            }

            // Method 1: Try to get transcript from YouTube's transcript API
            const transcriptUrl = `https://www.youtube.com/api/timedtext?lang=en&v=${videoId}`;
            
            try {
                const response = await axios.get(transcriptUrl);
                const $ = cheerio.load(response.data, { xmlMode: true });
                
                let transcript = '';
                $('text').each((i, elem) => {
                    transcript += $(elem).text() + ' ';
                });
                
                if (transcript.trim()) {
                    return transcript.trim();
                }
            } catch (error) {
                console.log('Primary transcript method failed, trying alternative...');
            }

            // Method 2: Alternative approach using youtube-transcript library
            return await this.getTranscriptAlternative(videoId);
            
        } catch (error) {
            throw new Error(`Failed to get transcript: ${error.message}`);
        }
    }

    // Alternative method for getting transcript
    async getTranscriptAlternative(videoId) {
        // This would require youtube-transcript npm package
        // For now, return a placeholder
        throw new Error('Alternative transcript method not yet implemented. Please install youtube-transcript package.');
    }

    // Summarize transcript text
    summarizeText(text, maxSentences = 5) {
        if (!text || text.length < 100) {
            return 'Transcript too short to summarize effectively.';
        }

        // Simple extractive summarization
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
        
        if (sentences.length <= maxSentences) {
            return text;
        }

        // Score sentences by length and word frequency
        const wordFreq = this.calculateWordFrequency(text);
        const sentenceScores = sentences.map(sentence => {
            const words = sentence.toLowerCase().split(/\s+/);
            const score = words.reduce((sum, word) => {
                return sum + (wordFreq[word] || 0);
            }, 0) / words.length;
            return { sentence: sentence.trim(), score };
        });

        // Get top scored sentences
        const topSentences = sentenceScores
            .sort((a, b) => b.score - a.score)
            .slice(0, maxSentences)
            .map(item => item.sentence);

        return topSentences.join('. ') + '.';
    }

    // Calculate word frequency for summarization
    calculateWordFrequency(text) {
        const words = text.toLowerCase().split(/\s+/);
        const frequency = {};
        
        // Common words to ignore
        const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those']);

        words.forEach(word => {
            const cleanWord = word.replace(/[^\w]/g, '');
            if (cleanWord.length > 2 && !stopWords.has(cleanWord)) {
                frequency[cleanWord] = (frequency[cleanWord] || 0) + 1;
            }
        });

        return frequency;
    }

    // Main function to process video
    async processVideo(videoUrl, summaryLength = 5) {
        try {
            console.log('Extracting transcript from:', videoUrl);
            const transcript = await this.getTranscript(videoUrl);
            
            console.log('Generating summary...');
            const summary = this.summarizeText(transcript, summaryLength);
            
            return {
                success: true,
                videoUrl,
                transcript,
                summary,
                transcriptLength: transcript.length,
                summaryRatio: (summary.length / transcript.length * 100).toFixed(1) + '%'
            };
        } catch (error) {
            return {
                success: false,
                error: error.message,
                videoUrl
            };
        }
    }
}

// Export for use
module.exports = VideoTranscriptScraper;

// Example usage
if (require.main === module) {
    const scraper = new VideoTranscriptScraper();
    
    // Example YouTube URL
    const testUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    
    scraper.processVideo(testUrl)
        .then(result => {
            if (result.success) {
                console.log('\n=== VIDEO SUMMARY ===');
                console.log('URL:', result.videoUrl);
                console.log('Transcript Length:', result.transcriptLength, 'characters');
                console.log('Summary Ratio:', result.summaryRatio);
                console.log('\n=== SUMMARY ===');
                console.log(result.summary);
                console.log('\n=== FULL TRANSCRIPT ===');
                console.log(result.transcript.substring(0, 500) + '...');
            } else {
                console.error('Error:', result.error);
            }
        })
        .catch(console.error);
}