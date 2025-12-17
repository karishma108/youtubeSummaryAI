// Robust Transcript Extractor Test
const https = require('https');

async function testTranscriptExtraction(videoId) {
    console.log(`🧪 Testing transcript extraction for: ${videoId}`);
    
    // Method 1: Direct YouTube page analysis
    console.log('\n📄 Method 1: YouTube page analysis...');
    const pageResult = await extractFromPage(videoId);
    
    // Method 2: Try ytdl-core approach
    console.log('\n🔧 Method 2: Alternative extraction...');
    const altResult = await alternativeExtraction(videoId);
    
    console.log('\n📊 Results Summary:');
    console.log('Page method:', pageResult.success ? '✅' : '❌', pageResult.length || 0, 'chars');
    console.log('Alt method:', altResult.success ? '✅' : '❌', altResult.length || 0, 'chars');
}

async function extractFromPage(videoId) {
    return new Promise((resolve) => {
        const url = `https://www.youtube.com/watch?v=${videoId}`;
        
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log('📥 Page downloaded, size:', data.length);
                
                // Look for various transcript patterns
                const patterns = [
                    /"captionTracks":\[(.*?)\]/,
                    /"captions".*?"playerCaptionsTracklistRenderer".*?"captionTracks":\[(.*?)\]/,
                    /playerCaptionsTracklistRenderer.*?captionTracks.*?\[(.*?)\]/
                ];
                
                for (let i = 0; i < patterns.length; i++) {
                    const match = data.match(patterns[i]);
                    if (match) {
                        console.log(`🎯 Found pattern ${i + 1}`);
                        try {
                            const captionsStr = '[' + match[1] + ']';
                            const captions = JSON.parse(captionsStr);
                            console.log('📝 Found', captions.length, 'caption tracks');
                            
                            for (const caption of captions) {
                                console.log('- Language:', caption.languageCode, 'URL:', caption.baseUrl ? 'present' : 'missing');
                            }
                            
                            resolve({
                                success: true,
                                length: match[1].length,
                                tracks: captions.length
                            });
                            return;
                        } catch (e) {
                            console.log('⚠️ Parse error for pattern', i + 1, ':', e.message);
                        }
                    }
                }
                
                // Check if page contains any transcript-related content
                const hasTranscript = data.includes('transcript') || data.includes('caption') || data.includes('subtitle');
                console.log('🔍 Page contains transcript keywords:', hasTranscript);
                
                resolve({
                    success: false,
                    length: 0,
                    hasKeywords: hasTranscript
                });
            });
        }).on('error', (err) => {
            console.log('❌ Network error:', err.message);
            resolve({ success: false, length: 0 });
        });
    });
}

async function alternativeExtraction(videoId) {
    // Try direct caption URLs
    const urls = [
        `https://www.youtube.com/api/timedtext?lang=en&v=${videoId}&fmt=srv3`,
        `https://video.google.com/timedtext?lang=en&v=${videoId}`,
        `https://www.youtube.com/api/timedtext?lang=en-US&v=${videoId}`,
        `https://www.youtube.com/api/timedtext?lang=a.en&v=${videoId}&fmt=vtt`
    ];
    
    for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        console.log(`🌐 Trying URL ${i + 1}...`);
        
        try {
            const result = await fetchUrl(url);
            if (result && result.length > 50) {
                console.log(`✅ Success with URL ${i + 1}:`, result.length, 'chars');
                return {
                    success: true,
                    length: result.length,
                    url: i + 1
                };
            } else {
                console.log(`❌ URL ${i + 1} failed or empty`);
            }
        } catch (error) {
            console.log(`❌ URL ${i + 1} error:`, error.message);
        }
    }
    
    return { success: false, length: 0 };
}

function fetchUrl(url) {
    return new Promise((resolve) => {
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200 && data.length > 0) {
                    resolve(data);
                } else {
                    resolve(null);
                }
            });
        }).on('error', () => resolve(null));
    });
}

// Test with a known video
const videoId = process.argv[2] || 'dQw4w9WgXcQ';
testTranscriptExtraction(videoId);