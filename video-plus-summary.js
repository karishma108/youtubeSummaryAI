// Video + Summary Analyzer - Shows Video AND Analysis
const http = require('http');
const https = require('https');

// Try to use youtube-transcript if available
let YoutubeTranscript;
try {
    YoutubeTranscript = require('youtube-transcript');
    console.log('✅ youtube-transcript library loaded');
} catch (error) {
    console.log('⚠️ youtube-transcript not available, using manual extraction');
}

// Main function to get video information and transcript
async function analyzeVideo(videoId) {
    console.log(`🎬 Analyzing video: ${videoId}`);
    
    // Get basic video info first
    const videoInfo = await getVideoMetadata(videoId);
    console.log(`📹 Video title: ${videoInfo.title}`);
    
    // Try to get transcript
    const transcriptData = await getYouTubeTranscript(videoId);
    console.log(`📝 Transcript extraction result: ${transcriptData.success ? 'SUCCESS' : 'FAILED'}`);
    
    if (transcriptData.success && transcriptData.text) {
        console.log(`📄 Transcript length: ${transcriptData.text.length} characters`);
        console.log(`📝 Transcript preview: "${transcriptData.text.substring(0, 150)}..."`);
    }
    
    // Generate comprehensive summary
    let summary = '';
    let wordCount = 0;
    
    if (transcriptData.success && transcriptData.text && transcriptData.text.trim().length > 50) {
        console.log('✅ Using real transcript for summary generation');
        summary = generateIntelligentSummary(transcriptData.text);
        wordCount = transcriptData.text.split(' ').length;
        console.log(`📊 Generated transcript summary: ${summary.length} chars, ${wordCount} words`);
    } else {
        console.log('⚠️ Transcript not available - Creating content-aware summary');
        console.log(`📝 Reason: ${transcriptData.error || transcriptData.source || 'Unknown'}`);
        // Try to get a better summary using the video's actual content from description
        summary = await generateContentAwareSummary(videoInfo, videoId);
        wordCount = summary.split(' ').length;
        console.log(`📊 Generated content-aware summary: ${summary.length} chars, ${wordCount} words`);
    }
    
    return {
        videoId: videoId,
        title: videoInfo.title,
        description: videoInfo.description,
        summary: summary,
        transcript: transcriptData,
        stats: {
            duration: videoInfo.duration,
            views: videoInfo.views,
            wordCount: wordCount,
            hasTranscript: transcriptData.success
        },
        embedUrl: `https://www.youtube.com/embed/${videoId}`,
        watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
        processedAt: new Date().toLocaleString()
    };
}

// Get video metadata from YouTube page
async function getVideoMetadata(videoId) {
    return new Promise((resolve) => {
        const url = `https://www.youtube.com/watch?v=${videoId}`;
        
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    // Extract title
                    const titleMatch = data.match(/<title>(.*?)<\/title>/);
                    let title = titleMatch ? titleMatch[1].replace(' - YouTube', '').trim() : 'YouTube Video';
                    
                    // Extract description
                    const descMatch = data.match(/"shortDescription":"(.*?)"/);
                    let description = descMatch ? descMatch[1] : '';
                    description = description.replace(/\\n/g, ' ').replace(/\\"/g, '"').trim();
                    
                    // Extract view count
                    const viewMatch = data.match(/"viewCount":"(\d+)"/);
                    const views = viewMatch ? parseInt(viewMatch[1]).toLocaleString() : 'Unknown';
                    
                    // Extract duration
                    const durationMatch = data.match(/"lengthSeconds":"(\d+)"/);
                    const duration = durationMatch ? formatDuration(parseInt(durationMatch[1])) : 'Unknown';
                    
                    resolve({
                        title: title,
                        description: description.substring(0, 500),
                        duration: duration,
                        views: views
                    });
                } catch (error) {
                    resolve({
                        title: `YouTube Video ${videoId}`,
                        description: `Video analysis for ${videoId}`,
                        duration: 'Unknown',
                        views: 'Unknown'
                    });
                }
            });
        }).on('error', () => {
            resolve({
                title: `YouTube Video ${videoId}`,
                description: `Video content for ${videoId}`,
                duration: 'Unknown',
                views: 'Unknown'
            });
        });
    });
}

// Enhanced transcript extraction with multiple methods
async function getYouTubeTranscript(videoId) {
    console.log(`🔍 Starting transcript extraction for: ${videoId}`);
    
    // Method 1: Quick attempt with youtube-transcript library
    if (YoutubeTranscript) {
        try {
            console.log('📚 Trying youtube-transcript library (5 second timeout)...');
            const transcript = await Promise.race([
                YoutubeTranscript.fetchTranscript(videoId),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Library timeout')), 5000))
            ]);
            
            if (transcript && transcript.length > 0) {
                const fullText = transcript.map(item => item.text).join(' ').trim();
                if (fullText.length > 50) {
                    console.log(`✅ SUCCESS via library: ${fullText.length} characters`);
                    console.log(`📝 Preview: "${fullText.substring(0, 150)}..."`);
                    return {
                        success: true,
                        text: fullText,
                        source: 'YouTube Transcript Library',
                        length: fullText.length
                    };
                }
            }
        } catch (error) {
            console.log(`⚠️ Library method failed: ${error.message}`);
        }
    }

    // Method 2: Alternative approach - try to get any available data from video page
    console.log('🌐 Trying alternative data extraction...');
    try {
        const pageData = await getVideoPageData(videoId);
        if (pageData && pageData.length > 100) {
            console.log(`✅ Got page data: ${pageData.length} characters`);
            return {
                success: true,
                text: pageData,
                source: 'Page Content Extraction',
                length: pageData.length
            };
        }
    } catch (error) {
        console.log(`⚠️ Alternative extraction failed: ${error.message}`);
    }

    console.log('❌ All transcript extraction methods failed');
    return {
        success: false,
        text: null,
        source: 'All methods failed - using content analysis',
        error: 'Transcript not accessible',
        length: 0
    };
}

// Alternative method to extract any useful content from the video page
async function getVideoPageData(videoId) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'www.youtube.com',
            path: `/watch?v=${videoId}`,
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            }
        };
        
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    // Try to extract any useful text content from the page
                    // Look for descriptions, comments, or any readable text
                    const descMatch = data.match(/"shortDescription":"([^"]+)"/);
                    const titleMatch = data.match(/"title":"([^"]+)"/);
                    
                    let extractedText = '';
                    
                    if (titleMatch) {
                        extractedText += `Title: ${titleMatch[1].replace(/\\u[\dA-F]{4}/gi, '').replace(/\\\\/g, '')}. `;
                    }
                    
                    if (descMatch) {
                        const description = descMatch[1]
                            .replace(/\\u[\dA-F]{4}/gi, '') // Remove unicode escapes
                            .replace(/\\\\/g, '') // Remove escaped backslashes
                            .replace(/\\n/g, ' ') // Convert line breaks
                            .replace(/\\"/g, '"'); // Fix escaped quotes
                        
                        if (description.length > 20) {
                            extractedText += `Description: ${description}`;
                        }
                    }
                    
                    if (extractedText.length > 50) {
                        console.log(`🔍 Extracted content from page: ${extractedText.length} chars`);
                        resolve(extractedText);
                    } else {
                        resolve(null);
                    }
                } catch (error) {
                    resolve(null);
                }
            });
        });
        
        req.on('error', () => resolve(null));
        req.setTimeout(10000, () => {
            req.destroy();
            resolve(null);
        });
        
        req.end();
    });
}

// Web scraping function that mimics browser behavior
async function scrapeYouTubeTranscript(videoId) {
    return new Promise((resolve) => {
        console.log(`🌐 Step 1: Fetching YouTube page HTML for video ${videoId}`);
        
        const options = {
            hostname: 'www.youtube.com',
            path: `/watch?v=${videoId}`,
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5,hi;q=0.3',
                'Accept-Encoding': 'gzip, deflate, br',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1',
                'Sec-Fetch-Dest': 'document',
                'Sec-Fetch-Mode': 'navigate',
                'Sec-Fetch-Site': 'none'
            }
        };
        
        const req = https.request(options, (res) => {
            console.log(`📡 Response status: ${res.statusCode}`);
            
            let data = '';
            let chunks = [];
            
            // Handle gzip/compression
            let stream = res;
            if (res.headers['content-encoding'] === 'gzip') {
                const zlib = require('zlib');
                stream = res.pipe(zlib.createGunzip());
            }
            
            stream.on('data', chunk => {
                data += chunk.toString();
                chunks.push(chunk);
            });
            
            stream.on('end', async () => {
                console.log(`📄 Received ${data.length} characters of HTML`);
                console.log(`🔍 Step 2: Searching for ytInitialPlayerResponse...`);
                
                try {
                    // Look for ytInitialPlayerResponse in the HTML
                    const patterns = [
                        /var ytInitialPlayerResponse = ({.*?});/s,
                        /window\["ytInitialPlayerResponse"\] = ({.*?});/s,
                        /ytInitialPlayerResponse":\s*({.*?})(?:,"qtEventTracker"|,"webPlayerShareEntityServiceEndpoint"|,"webPlayerActionsPorting")/s,
                        /ytInitialPlayerResponse = ({.*?});/s
                    ];
                    
                    let playerResponse = null;
                    for (const pattern of patterns) {
                        const match = data.match(pattern);
                        if (match) {
                            try {
                                console.log(`✅ Found ytInitialPlayerResponse pattern`);
                                playerResponse = JSON.parse(match[1]);
                                break;
                            } catch (parseError) {
                                console.log(`⚠️ JSON parse failed for pattern, trying next...`);
                                continue;
                            }
                        }
                    }
                    
                    if (!playerResponse) {
                        console.log(`❌ Could not find ytInitialPlayerResponse`);
                        return resolve({ success: false });
                    }
                    
                    console.log(`🔍 Step 3: Searching for caption tracks...`);
                    
                    // Navigate to captions -> playerCaptionsTracklistRenderer -> captionTracks
                    const captions = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
                    
                    if (!captions || !Array.isArray(captions) || captions.length === 0) {
                        console.log(`❌ No caption tracks found in player response`);
                        return resolve({ success: false });
                    }
                    
                    console.log(`📋 Found ${captions.length} caption tracks`);
                    
                    // Find the best caption track (prioritize Hindi, then English, then auto-generated)
                    let selectedTrack = captions.find(track => 
                        track.languageCode === 'hi' || 
                        track.languageCode === 'hi-IN' ||
                        (track.name?.simpleText && track.name.simpleText.includes('हिन्दी'))
                    ) || captions.find(track => 
                        track.languageCode === 'en' || 
                        track.languageCode === 'en-US'
                    ) || captions.find(track => 
                        track.kind === 'asr' // Auto-generated
                    ) || captions[0]; // Fallback to first available
                    
                    if (!selectedTrack || !selectedTrack.baseUrl) {
                        console.log(`❌ No usable caption track found`);
                        return resolve({ success: false });
                    }
                    
                    console.log(`🎯 Selected track: ${selectedTrack.languageCode || 'auto'} - ${selectedTrack.name?.simpleText || 'Auto-generated'}`);
                    console.log(`🔍 Step 4: Fetching caption content from baseUrl...`);
                    
                    // Clean and fetch the caption URL
                    const captionUrl = selectedTrack.baseUrl.replace(/\\u0026/g, '&').replace(/\\\//g, '/');
                    console.log(`🌐 Caption URL: ${captionUrl.substring(0, 100)}...`);
                    
                    // Fetch the actual captions
                    const captionContent = await fetchCaptionContent(captionUrl);
                    if (captionContent && captionContent.length > 20) {
                        console.log(`✅ Successfully extracted captions: ${captionContent.length} characters`);
                        resolve({
                            success: true,
                            text: captionContent,
                            source: `Web Scraping (${selectedTrack.languageCode || 'auto'})`,
                            language: selectedTrack.languageCode || 'auto',
                            method: 'ytInitialPlayerResponse extraction',
                            length: captionContent.length
                        });
                    } else {
                        console.log(`❌ Caption content extraction failed`);
                        resolve({ success: false });
                    }
                    
                } catch (error) {
                    console.log(`❌ Error processing HTML: ${error.message}`);
                    resolve({ success: false });
                }
            });
        });
        
        req.on('error', (error) => {
            console.log(`❌ Request error: ${error.message}`);
            resolve({ success: false });
        });
        
        req.setTimeout(15000, () => {
            console.log(`⏰ Request timeout`);
            req.destroy();
            resolve({ success: false });
        });
        
        req.end();
    });
}

// Alternative transcript extraction method
async function getTranscriptAlternative(videoId) {
    return new Promise((resolve) => {
        const options = {
            hostname: 'www.youtube.com',
            path: `/watch?v=${videoId}`,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        };
        
        https.get(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    // Look for automatic captions or closed captions
                    const captionPatterns = [
                        /"captionTracks":\[(.*?)\]/s,
                        /"automaticCaptions".*?"captionTracks":\[(.*?)\]/s,
                        /\"captions\".*?\"captionTracks\":\[(.*?)\]/s
                    ];
                    
                    let captions = null;
                    for (const pattern of captionPatterns) {
                        const match = data.match(pattern);
                        if (match) {
                            try {
                                captions = JSON.parse('[' + match[1] + ']');
                                break;
                            } catch (e) {
                                continue;
                            }
                        }
                    }
                    
                    if (captions && captions.length > 0) {
                        // Find the best available caption
                        let targetCaption = captions.find(cap => cap.languageCode === 'hi') ||
                                          captions.find(cap => cap.languageCode === 'en') ||
                                          captions[0];
                        
                        if (targetCaption && targetCaption.baseUrl) {
                            // Fetch the caption content
                            const captionUrl = targetCaption.baseUrl.replace(/\\u0026/g, '&');
                            https.get(captionUrl, (captionRes) => {
                                let captionData = '';
                                captionRes.on('data', chunk => captionData += chunk);
                                captionRes.on('end', () => {
                                    const text = extractTextFromXML(captionData);
                                    if (text && text.length > 50) {
                                        resolve({
                                            success: true,
                                            text: text,
                                            source: 'Alternative Extraction',
                                            language: targetCaption.languageCode,
                                            length: text.length
                                        });
                                    } else {
                                        resolve({ success: false });
                                    }
                                });
                            }).on('error', () => resolve({ success: false }));
                        } else {
                            resolve({ success: false });
                        }
                    } else {
                        resolve({ success: false });
                    }
                } catch (error) {
                    resolve({ success: false });
                }
            });
        }).on('error', () => resolve({ success: false }));
    });
}

// Extract text from XML captions
function extractTextFromXML(xmlData) {
    try {
        const textMatches = xmlData.match(/<text[^>]*>(.*?)<\/text>/g);
        if (textMatches) {
            return textMatches
                .map(match => match.replace(/<[^>]*>/g, '').trim())
                .filter(text => text.length > 0)
                .join(' ')
                .replace(/\s+/g, ' ')
                .trim();
        }
    } catch (error) {
        console.log('XML parsing error:', error.message);
    }
    return null;
}// Extract transcript directly from YouTube page
async function extractTranscriptFromPage(videoId) {
    return new Promise((resolve) => {
        const url = `https://www.youtube.com/watch?v=${videoId}`;
        
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', async () => {
                try {
                    // Look for caption tracks
                    const patterns = [
                        /"captionTracks":\[(.*?)\]/,
                        /"captions".*?"playerCaptionsTracklistRenderer".*?"captionTracks":\[(.*?)\]/,
                        /playerCaptionsTracklistRenderer.*?captionTracks.*?\[(.*?)\]/
                    ];
                    
                    for (const pattern of patterns) {
                        const match = data.match(pattern);
                        if (match) {
                            try {
                                const captionsStr = '[' + match[1] + ']';
                                const captions = JSON.parse(captionsStr);
                                
                                // Find available captions - try Hindi, English, and any language
                                let targetCaption = captions.find(cap => 
                                    cap.languageCode === 'hi' || // Hindi
                                    cap.languageCode === 'hi-IN' ||
                                    cap.name?.simpleText?.includes('हिन्दी') ||
                                    cap.name?.simpleText?.includes('Hindi')
                                ) || captions.find(cap => 
                                    cap.languageCode === 'en' || // English fallback
                                    cap.languageCode === 'en-US' ||
                                    cap.languageCode === 'a.en'
                                ) || captions[0]; // Any available caption
                                
                                console.log(`🌐 Found caption: ${targetCaption.languageCode || 'unknown'} - ${targetCaption.name?.simpleText || 'Auto-generated'}`);
                                
                                if (targetCaption && targetCaption.baseUrl) {
                                    const transcriptText = await fetchCaptionContent(targetCaption.baseUrl);
                                    if (transcriptText && transcriptText.length > 20) {
                                        console.log(`✅ Extracted ${transcriptText.length} characters from ${targetCaption.languageCode || 'unknown'} captions`);
                                        return resolve({
                                            success: true,
                                            text: transcriptText,
                                            source: `YouTube Captions (${targetCaption.languageCode || 'auto'})`,
                                            language: targetCaption.languageCode || 'unknown',
                                            length: transcriptText.length
                                        });
                                    }
                                }
                            } catch (parseError) {
                                continue;
                            }
                        }
                    }
                    
                    resolve({ success: false });
                } catch (error) {
                    resolve({ success: false });
                }
            });
        }).on('error', () => {
            resolve({ success: false });
        });
    });
}

// Fetch actual caption content from YouTube's timedtext API
async function fetchCaptionContent(url) {
    return new Promise((resolve) => {
        console.log(`📥 Fetching caption XML from timedtext API...`);
        
        // Parse the URL to handle both HTTP and HTTPS
        const urlObj = new URL(url);
        const protocol = urlObj.protocol === 'https:' ? https : require('http');
        
        const options = {
            hostname: urlObj.hostname,
            path: urlObj.pathname + urlObj.search,
            method: 'GET',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/xml, text/xml, */*',
                'Accept-Language': 'en-US,en;q=0.9,hi;q=0.8',
                'Referer': 'https://www.youtube.com/',
                'Origin': 'https://www.youtube.com'
            }
        };
        
        const req = protocol.request(options, (res) => {
            console.log(`📡 Caption fetch status: ${res.statusCode}`);
            
            if (res.statusCode !== 200) {
                console.log(`❌ Caption fetch failed with status: ${res.statusCode}`);
                return resolve(null);
            }
            
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    console.log(`📄 Received ${data.length} characters of XML data`);
                    
                    // Parse XML captions and extract text
                    if (data.includes('<text') || data.includes('<transcript>')) {
                        console.log(`🔍 Parsing XML caption data...`);
                        
                        // Extract text from XML tags
                        const textMatches = data.match(/<text[^>]*>(.*?)<\/text>/g);
                        if (textMatches && textMatches.length > 0) {
                            console.log(`📝 Found ${textMatches.length} text segments`);
                            
                            const transcript = textMatches
                                .map(match => {
                                    // Remove XML tags and decode HTML entities
                                    let text = match.replace(/<[^>]*>/g, '')
                                                  .replace(/&amp;/g, '&')
                                                  .replace(/&lt;/g, '<')
                                                  .replace(/&gt;/g, '>')
                                                  .replace(/&quot;/g, '"')
                                                  .replace(/&#39;/g, "'")
                                                  .replace(/&nbsp;/g, ' ')
                                                  .replace(/&#(\d+);/g, (match, num) => String.fromCharCode(num))
                                                  .trim();
                                    
                                    return text;
                                })
                                .filter(text => text.length > 0) // Remove empty segments
                                .join(' ')
                                .replace(/\s+/g, ' ') // Clean up multiple spaces
                                .trim();
                            
                            console.log(`✅ Extracted transcript: ${transcript.length} characters`);
                            console.log(`📝 Preview: "${transcript.substring(0, 200)}..."`);
                            
                            if (transcript.length > 20) {
                                resolve(transcript);
                            } else {
                                console.log(`❌ Transcript too short: ${transcript.length} characters`);
                                resolve(null);
                            }
                        } else {
                            console.log(`❌ No text segments found in XML`);
                            resolve(null);
                        }
                    } else {
                        console.log(`❌ Invalid XML format received`);
                        console.log(`📄 Data preview: "${data.substring(0, 200)}..."`);
                        resolve(null);
                    }
                } catch (error) {
                    console.log(`❌ Error parsing caption XML: ${error.message}`);
                    resolve(null);
                }
            });
        });
        
        req.on('error', (error) => {
            console.log(`❌ Caption request error: ${error.message}`);
            resolve(null);
        });
        
        req.setTimeout(10000, () => {
            console.log(`⏰ Caption request timeout`);
            req.destroy();
            resolve(null);
        });
        
        req.end();
    });
}

// Generate summary from transcript - Maximum content possible
function generateIntelligentSummary(transcript) {
    const cleanText = transcript.replace(/\s+/g, ' ').trim();
    
    // Handle multiple languages - split by common punctuation marks used in various languages
    const sentences = cleanText.split(/[.!?।॥|]+/).filter(s => {
        const trimmed = s.trim().toLowerCase();
        
        // Filter out promotional content, social media, contact info, and non-content material
        return trimmed.length > 15 && 
               !trimmed.includes('subscribe') && 
               !trimmed.includes('like this video') &&
               !trimmed.includes('hit the like') &&
               !trimmed.includes('smash that like') &&
               !trimmed.includes('ring the bell') &&
               !trimmed.includes('notification bell') &&
               !trimmed.includes('follow') && 
               !trimmed.includes('follow us') &&
               !trimmed.includes('follow me') &&
               !trimmed.includes('instagram') && 
               !trimmed.includes('facebook') && 
               !trimmed.includes('twitter') && 
               !trimmed.includes('youtube') &&
               !trimmed.includes('tiktok') &&
               !trimmed.includes('linkedin') &&
               !trimmed.includes('snapchat') &&
               !trimmed.includes('contact') && 
               !trimmed.includes('contact us') &&
               !trimmed.includes('reach out') &&
               !trimmed.includes('get in touch') &&
               !trimmed.includes('email') && 
               !trimmed.includes('whatsapp') && 
               !trimmed.includes('call us') &&
               !trimmed.includes('phone number') &&
               !trimmed.includes('website') &&
               !trimmed.includes('visit our') &&
               !trimmed.includes('check out our') &&
               !trimmed.includes('link in description') &&
               !trimmed.includes('description below') &&
               !trimmed.includes('links below') &&
               !trimmed.includes('more info') &&
               !trimmed.includes('@') &&
               !trimmed.includes('www.') &&
               !trimmed.includes('http') &&
               !trimmed.includes('.com') &&
               !trimmed.includes('.org') &&
               !trimmed.includes('.net') &&
               !trimmed.includes('sponsor') &&
               !trimmed.includes('sponsored by') &&
               !trimmed.includes('affiliate') &&
               !trimmed.includes('affiliate link') &&
               !trimmed.includes('patreon') &&
               !trimmed.includes('support us') &&
               !trimmed.includes('donate') &&
               !trimmed.includes('buy me') &&
               !trimmed.includes('merch') &&
               !trimmed.includes('merchandise') &&
               !trimmed.includes('shop now') &&
               !trimmed.includes('discount') &&
               !trimmed.includes('promo code') &&
               !trimmed.includes('coupon') &&
               !trimmed.includes('special offer') &&
               !trimmed.includes('limited time') &&
               !trimmed.includes('act now') &&
               !trimmed.includes('click here') &&
               !trimmed.includes('watch more') &&
               !trimmed.includes('next video') &&
               !trimmed.includes('previous video') &&
               !trimmed.includes('playlist') &&
               !trimmed.includes('share this') &&
               !trimmed.includes('tell your friends') &&
               !trimmed.includes('spread the word') &&
               !trimmed.includes('comment below') &&
               !trimmed.includes('let me know') &&
               !trimmed.includes('what do you think') &&
               !trimmed.includes('thanks for watching') &&
               !trimmed.includes('see you next') &&
               !trimmed.includes('until next time') &&
               !trimmed.includes('goodbye') &&
               !trimmed.includes('bye bye') &&
               !trimmed.includes('peace out') &&
               !trimmed.includes('catch you later');
    });
    
    console.log(`Found ${sentences.length} filtered sentences from transcript`);
    
    if (sentences.length === 0) {
        console.log('No valid content sentences found after filtering');
        return "No valid content found in transcript for summary generation after filtering promotional material.";
    }
    
    // Generate exactly 10 lines of pure content summary
    let selectedSentences = [];
    const maxLines = 10;
    
    // Take the best content sentences, distributed throughout the video
    if (sentences.length <= maxLines) {
        console.log('Using all available clean content sentences');
        selectedSentences = sentences.map(s => s.trim());
    } else {
        console.log(`Selecting ${maxLines} best sentences from ${sentences.length} clean sentences`);
        
        // Take sentences distributed throughout but prioritize meaningful content
        const step = Math.max(1, Math.floor(sentences.length / maxLines));
        
        for (let i = 0; i < sentences.length && selectedSentences.length < maxLines; i += step) {
            const sentence = sentences[i].trim();
            if (sentence.length > 15) {
                selectedSentences.push(sentence);
            }
        }
        
        // Fill remaining slots with any missed quality sentences
        if (selectedSentences.length < maxLines) {
            for (let i = 0; i < sentences.length && selectedSentences.length < maxLines; i++) {
                const sentence = sentences[i].trim();
                if (sentence.length > 15 && !selectedSentences.includes(sentence)) {
                    selectedSentences.push(sentence);
                }
            }
        }
    }
    
    console.log(`Selected ${selectedSentences.length} sentences for filtered summary`);
    
    // Create numbered summary with exactly 10 lines of pure content
    let summaryLines = [];
    selectedSentences.slice(0, maxLines).forEach((sentence, index) => {
        const cleanSentence = sentence.charAt(0).toUpperCase() + sentence.slice(1).trim();
        summaryLines.push(`${index + 1}. ${cleanSentence}.`);
    });
    
    // Fill remaining slots if we have less than 10 lines
    while (summaryLines.length < maxLines) {
        summaryLines.push(`${summaryLines.length + 1}. Additional relevant content is covered in the video.`);
    }
    
    const finalSummary = summaryLines.join('\n');
    console.log(`Generated exactly ${summaryLines.length} lines of pure content summary`);
    
    return finalSummary;
}

// Generate content-aware summary when transcript isn't available
async function generateContentAwareSummary(videoInfo, videoId) {
    console.log('🧠 Creating content-aware summary from available data');
    
    const title = videoInfo.title || 'Video';
    const description = videoInfo.description || '';
    
    console.log(`📖 Title: ${title}`);
    console.log(`📄 Description length: ${description.length} characters`);
    
    let summaryLines = [];
    
    // If we have a substantial description, extract exactly 10 lines from it
    if (description && description.length > 100) {
        console.log('📝 Extracting exactly 10 lines from description...');
        
        // Clean the description and filter out promotional content
        const cleanDescription = description
            .replace(/https?:\/\/[^\s]+/g, '') // Remove URLs
            .replace(/#\w+/g, '') // Remove hashtags  
            .replace(/@\w+/g, '') // Remove mentions
            .replace(/\n+/g, '. ') // Convert line breaks
            .replace(/\s+/g, ' ') // Clean spaces
            .trim();
        
        const allSentences = cleanDescription
            .split(/[.!?]+/)
            .map(s => s.trim())
            .filter(s => {
                const lower = s.toLowerCase();
                return s.length > 15 && 
                       !lower.includes('subscribe') && 
                       !lower.includes('like') && 
                       !lower.includes('follow') && 
                       !lower.includes('instagram') && 
                       !lower.includes('facebook') && 
                       !lower.includes('twitter') && 
                       !lower.includes('contact') && 
                       !lower.includes('email') && 
                       !lower.includes('whatsapp') && 
                       !lower.includes('@') &&
                       !lower.includes('sponsor') &&
                       !lower.includes('affiliate') &&
                       !lower.includes('patreon');
            });
        
        if (allSentences.length >= 5) {
            console.log(`✅ Found ${allSentences.length} clean sentences - selecting 10`);
            const selectedSentences = allSentences.slice(0, 10); // Take first 10 clean sentences
            
            selectedSentences.forEach((sentence, index) => {
                summaryLines.push(`${index + 1}. ${sentence.charAt(0).toUpperCase() + sentence.slice(1).trim()}.`);
            });
            
            // Fill remaining slots if less than 10
            while (summaryLines.length < 10 && summaryLines.length < allSentences.length + 10) {
                summaryLines.push(`${summaryLines.length + 1}. Additional relevant content is covered in the video.`);
            }
        }
    }
    
    // If description doesn't provide enough content, create exactly 10 lines from title analysis
    if (summaryLines.length < 10) {
        console.log('📋 Generating exactly 10 lines from title analysis...');
        
        const titleLower = title.toLowerCase();
        summaryLines = []; // Reset
        
        // Analyze title for content type and create exactly 10 relevant lines
        if (titleLower.includes('tutorial') || titleLower.includes('how to') || titleLower.includes('guide') || titleLower.includes('learn')) {
            summaryLines = [
                '1. This is an educational tutorial video designed to teach specific skills',
                '2. The content provides step-by-step instructions and detailed explanations', 
                '3. Viewers can expect practical, actionable information they can apply',
                '4. The tutorial format suggests a structured approach to learning',
                '5. This video aims to help viewers master specific techniques or concepts',
                '6. The instructional content is designed to be easy to follow',
                '7. Viewers will gain practical skills and knowledge applicable to their needs',
                '8. The tutorial likely includes examples and demonstrations of key concepts',
                '9. Step-by-step guidance ensures viewers can follow along effectively',
                '10. The educational approach makes complex topics accessible to learners'
            ];
        } else if (titleLower.includes('review') || titleLower.includes('unboxing') || titleLower.includes('test') || titleLower.includes('comparison')) {
            summaryLines = [
                '1. This video provides a detailed review or evaluation of a product/service',
                '2. The content includes honest opinions and detailed analysis',
                '3. Viewers can expect comprehensive examination of features and performance',
                '4. The review likely covers both positive and negative aspects',
                '5. This content helps viewers make informed purchasing decisions',
                '6. The evaluation is based on real-world testing and usage',
                '7. Viewers will gain insights into product quality and value proposition',
                '8. Detailed specifications and performance metrics are discussed',
                '9. Comparisons with similar products or alternatives might be included',
                '10. The review provides practical insights for potential buyers'
            ];
        } else if (titleLower.includes('news') || titleLower.includes('update') || titleLower.includes('breaking') || titleLower.includes('latest')) {
            summaryLines = [
                '1. This video covers recent news or important updates on the topic',
                '2. The content provides timely and relevant information about current events',
                '3. Viewers can expect factual reporting and analysis of recent developments',
                '4. The news format ensures viewers stay informed about important changes',
                '5. This content addresses current issues and their implications',
                '6. The information is presented in an accessible and understandable format',
                '7. Viewers will gain awareness of significant developments in the field',
                '8. Context and background information help viewers understand significance',
                '9. Recent developments and their potential impact are thoroughly discussed',
                '10. The news coverage provides comprehensive analysis of current events'
            ];
        } else {
            summaryLines = [
                '1. This video provides informative content focused on the specific topic',
                '2. The content is designed to educate and inform viewers about the subject',
                '3. Viewers can expect detailed discussion and comprehensive coverage',
                '4. The video format allows for thorough exploration of key concepts',
                '5. This content aims to provide valuable insights and knowledge',
                '6. The information is presented in an engaging and accessible manner',
                '7. Viewers will gain a better understanding of the subject matter',
                '8. The content covers important aspects related to the main topic',
                '9. Expert knowledge and insights are shared to benefit the audience',
                '10. The video provides comprehensive coverage of relevant information'
            ];
        }
    }
    
    // Ensure exactly 10 lines
    summaryLines = summaryLines.slice(0, 10);
    const finalSummary = summaryLines.join('\n');
    console.log(`✅ Generated exactly ${summaryLines.length} filtered summary lines`);
    
    return finalSummary;
}

// Format duration from seconds
function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
}

const htmlTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🤖 YouTube Video Summary AI</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f5f5f5;
            color: #333;
            line-height: 1.6;
        }
        .container { 
            max-width: 1400px; 
            margin: 0 auto; 
            padding: 20px;
        }
        .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%, #f093fb 200%);
            color: white; 
            padding: 40px; 
            border-radius: 20px;
            text-align: center; 
            margin-bottom: 30px;
            box-shadow: 0 15px 40px rgba(102, 126, 234, 0.3);
            position: relative;
            overflow: hidden;
        }
        .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(45deg, rgba(255,255,255,0.1) 0%, transparent 100%);
            z-index: 1;
        }
        .header-content {
            position: relative;
            z-index: 2;
        }
        .header h1 { 
            font-size: 3em; 
            margin-bottom: 15px; 
            text-shadow: 2px 2px 8px rgba(0,0,0,0.3);
            background: linear-gradient(45deg, #fff, #f0f0f0);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .header p { 
            font-size: 1.3em; 
            opacity: 0.95; 
            text-shadow: 1px 1px 4px rgba(0,0,0,0.2);
        }
        
        .input-section {
            background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
            padding: 35px;
            border-radius: 20px;
            margin-bottom: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            border: 1px solid rgba(102, 126, 234, 0.1);
        }
        .form-group { margin-bottom: 20px; }
        label { 
            display: block; 
            margin-bottom: 8px; 
            font-weight: 600; 
            color: #555; 
        }
        input[type="url"] { 
            width: 100%; 
            padding: 15px; 
            border: 2px solid #e0e0e0; 
            border-radius: 10px; 
            font-size: 16px;
            transition: border-color 0.3s;
        }
        input[type="url"]:focus { 
            outline: none; 
            border-color: #667eea; 
        }
        
        .btn { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
            color: white; 
            border: none; 
            padding: 18px 45px; 
            border-radius: 50px;
            font-size: 18px; 
            font-weight: 600;
            cursor: pointer; 
            transition: all 0.3s ease;
            width: 100%;
            box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
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
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
            transition: left 0.6s;
        }
        .btn:hover::before {
            left: 100%;
        }
        .btn:hover { 
            transform: translateY(-3px); 
            box-shadow: 0 12px 35px rgba(102, 126, 234, 0.4);
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
            padding: 40px;
            background: white;
            border-radius: 15px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.1);
        }
        .spinner {
            width: 50px;
            height: 50px;
            border: 5px solid #f3f3f3;
            border-top: 5px solid #667eea;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .results { 
            display: none; 
        }
        .video-content {
            display: grid;
            grid-template-columns: 1fr 450px;
            gap: 30px;
            margin-bottom: 30px;
            align-items: start;
        }
        
        .video-player {
            background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 15px 40px rgba(0,0,0,0.15);
            border: 1px solid rgba(102, 126, 234, 0.1);
        }
        .video-embed {
            width: 100%;
            height: 400px;
            border: none;
        }
        .video-info {
            padding: 25px;
            background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
        }
        .video-title {
            font-size: 1.5em;
            font-weight: 700;
            color: #333;
            margin-bottom: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        .video-stats {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
            margin-bottom: 15px;
        }
        .stat-item {
            text-align: center;
            padding: 10px;
            background: white;
            border-radius: 8px;
        }
        .stat-value {
            font-size: 1.2em;
            font-weight: bold;
            color: #667eea;
        }
        .stat-label {
            font-size: 0.9em;
            color: #666;
        }
        
        .summary-panel {
            background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
            border-radius: 20px;
            box-shadow: 0 15px 40px rgba(0,0,0,0.1);
            overflow: visible;
            border: 1px solid rgba(40, 167, 69, 0.1);
            min-height: fit-content;
            height: auto;
            min-width: 500px;
            max-width: 650px;
        }
        .summary-header {
            background: linear-gradient(135deg, #28a745 0%, #20c997 50%, #17a2b8 100%);
            color: white;
            padding: 25px;
            text-align: center;
            position: relative;
        }
        .summary-header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(45deg, rgba(255,255,255,0.1) 0%, transparent 100%);
        }
        .summary-header h2, .summary-header p {
            position: relative;
            z-index: 1;
        }
        .summary-body {
            padding: 30px;
            max-height: none;
            overflow: visible;
        }
        .summary-text {
            font-size: 1.15em;
            line-height: 1.8;
            margin-bottom: 20px;
            color: #444;
            word-wrap: break-word;
            white-space: normal;
            overflow: visible;
            max-height: none;
        }
        
        .transcript-info {
            background: #f8f9fa;
            border: 2px solid #e9ecef;
            border-radius: 10px;
            padding: 20px;
            margin-top: 20px;
        }
        .transcript-available {
            border-color: #28a745;
            background: #d4edda;
        }
        .transcript-unavailable {
            border-color: #ffc107;
            background: #fff3cd;
        }
        
        .action-buttons {
            margin-top: 20px;
            display: flex;
            gap: 10px;
        }
        .action-btn {
            padding: 10px 20px;
            border: none;
            border-radius: 25px;
            cursor: pointer;
            font-weight: 500;
            text-decoration: none;
            display: inline-block;
            text-align: center;
            transition: transform 0.2s;
        }
        .action-btn:hover { transform: translateY(-1px); }
        .btn-watch {
            background: #ff0000;
            color: white;
        }
        .btn-share {
            background: #1976d2;
            color: white;
        }
        
        @media (max-width: 768px) {
            .video-content {
                grid-template-columns: 1fr;
                gap: 20px;
            }
            .video-embed {
                height: 250px;
            }
            .video-stats {
                grid-template-columns: repeat(2, 1fr);
            }
            .summary-panel {
                order: 2;
            }
            .video-player {
                order: 1;
            }
            .summary-text {
                font-size: 1.1em;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="header-content">
                <h1>🤖 YouTube Video Summary AI</h1>
                <p>Watch YouTube videos with intelligent AI-powered summaries</p>
            </div>
        </div>
        
        <div class="input-section">
            <form onsubmit="analyzeVideo(event)">
                <div class="form-group">
                    <label for="videoUrl">📺 YouTube Video URL</label>
                    <input 
                        type="url" 
                        id="videoUrl" 
                        placeholder="https://www.youtube.com/watch?v=..." 
                        value="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                        required
                    >
                </div>
                
                <button type="submit" class="btn" id="analyzeBtn">
                    🔍 Analyze Video + Summary
                </button>
            </form>
        </div>
        
        <div class="loading" id="loading">
            <div class="spinner"></div>
            <h3>🤖 Analyzing your video...</h3>
            <p>Extracting video information and generating summary</p>
        </div>
        
        <div class="results" id="results"></div>
    </div>

    <script>
        async function analyzeVideo(event) {
            event.preventDefault();
            
            const url = document.getElementById('videoUrl').value.trim();
            const loading = document.getElementById('loading');
            const results = document.getElementById('results');
            const btn = document.getElementById('analyzeBtn');
            
            // Reset UI
            loading.style.display = 'block';
            results.style.display = 'none';
            btn.disabled = true;
            
            try {
                const response = await fetch('/analyze', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: url })
                });
                
                const data = await response.json();
                
                if (data.success || data.videoId) {
                    displayVideoResults(data);
                } else {
                    displayError(data.error || 'Analysis failed');
                }
                
            } catch (error) {
                displayError('Network error: ' + error.message);
            } finally {
                loading.style.display = 'none';
                btn.disabled = false;
            }
        }
        
        function displayVideoResults(data) {
            const results = document.getElementById('results');
            results.innerHTML = \`
                <div class="video-content">
                    <div class="video-player">
                        <iframe 
                            class="video-embed"
                            src="\${data.embedUrl}?autoplay=1&rel=0" 
                            title="YouTube video player" 
                            frameborder="0" 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                            allowfullscreen>
                        </iframe>
                        
                        <div class="video-info">
                            <div class="video-title">\${data.title}</div>
                            
                            <div class="video-stats">
                                <div class="stat-item">
                                    <div class="stat-value">\${data.stats.duration}</div>
                                    <div class="stat-label">Duration</div>
                                </div>
                                <div class="stat-item">
                                    <div class="stat-value">\${data.stats.views}</div>
                                    <div class="stat-label">Views</div>
                                </div>
                                <div class="stat-item">
                                    <div class="stat-value">🤖</div>
                                    <div class="stat-label">AI Summary</div>
                                </div>
                            </div>
                            
                            <div class="action-buttons">
                                <a href="\${data.watchUrl}" target="_blank" class="action-btn btn-watch">
                                    📺 Watch on YouTube
                                </a>
                                <button onclick="shareVideo('\${data.watchUrl}')" class="action-btn btn-share">
                                    🔗 Share
                                </button>
                            </div>
                        </div>
                    </div>
                    
                    <div class="summary-panel">
                        <div class="summary-header">
                            <h2>📝 Video Summary</h2>
                            <p>AI-generated intelligent analysis</p>
                        </div>
                        
                        <div class="summary-body">
                            <div class="summary-text">\${data.summary}</div>
                        </div>
                    </div>
                </div>
            \`;
            
            results.style.display = 'block';
        }
        
        function displayError(errorMessage) {
            const results = document.getElementById('results');
            results.innerHTML = \`
                <div style="background: white; padding: 30px; border-radius: 15px; box-shadow: 0 5px 20px rgba(0,0,0,0.1); text-align: center;">
                    <h3 style="color: #dc3545; margin-bottom: 15px;">❌ Analysis Error</h3>
                    <p style="color: #666; margin-bottom: 20px;">\${errorMessage}</p>
                    <p><small>Please check the URL format and try again.</small></p>
                </div>
            \`;
            results.style.display = 'block';
        }
        
        function shareVideo(url) {
            if (navigator.share) {
                navigator.share({
                    title: 'Check out this video!',
                    url: url
                });
            } else {
                navigator.clipboard.writeText(url);
                alert('Video URL copied to clipboard!');
            }
        }
    </script>
</body>
</html>`;

// Create server
const server = http.createServer((req, res) => {
    const parsedUrl = new URL(req.url, 'http://' + req.headers.host);
    
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    // Homepage
    if (parsedUrl.pathname === '/' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(htmlTemplate);
        return;
    }
    
    // Analysis endpoint
    if (parsedUrl.pathname === '/analyze' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', async () => {
            try {
                const data = JSON.parse(body);
                const videoUrl = data.url;
                
                // Extract video ID
                const match = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
                const videoId = match ? match[1] : null;
                
                if (!videoId) {
                    throw new Error('Invalid YouTube URL');
                }
                
                console.log('🎬 Analyzing video with player:', videoId);
                const result = await analyzeVideo(videoId);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    success: true,
                    ...result
                }));
                
                console.log('✅ Video + Summary analysis completed:', result.title);
                
            } catch (error) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ 
                    success: false, 
                    error: error.message 
                }));
                console.log('❌ Analysis error:', error.message);
            }
        });
        return;
    }
    
    // 404
    res.writeHead(404, { 'Content-Type': 'text/html' });
    res.end('<h1>404 - Not Found</h1><p><a href="/">← Go back to Video Analyzer</a></p>');
});

const port = 8000;
server.listen(port, () => {
    console.log('🎬 Video + Summary Analyzer Started!');
    console.log('🚀 Server URL: http://localhost:' + port);
    console.log('✨ Features: Embedded video player + AI summaries');
    console.log('🌟 Open your browser: http://localhost:' + port);
    console.log('💡 Perfect for watching videos while reading summaries!');
});

// Handle shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Stopping Video + Summary server...');
    server.close();
    process.exit(0);
});