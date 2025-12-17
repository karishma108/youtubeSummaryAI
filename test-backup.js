// Test script for backup scraper
const BackupVideoScraper = require('./backup-scraper');

async function testBackupScraper() {
    const scraper = new BackupVideoScraper();
    const testUrl = 'https://www.youtube.com/watch?v=0RiDPisQAzM';
    
    console.log('🔧 Testing Backup Scraper...');
    console.log('URL:', testUrl);
    
    try {
        const result = await scraper.processVideo(testUrl);
        scraper.displayResults(result);
    } catch (error) {
        console.error('Test failed:', error.message);
    }
}

if (require.main === module) {
    testBackupScraper();
}

module.exports = { testBackupScraper };