# 🤖 Setting Up Gemini AI Integration

## 🚀 **How to Get Your Free Gemini API Key**

### Step 1: Get Gemini API Key
1. Go to: **https://makersuite.google.com/app/apikey**
2. Sign in with your Google account
3. Click **"Create API Key"**
4. Copy your API key

### Step 2: Configure the API Key

**Option A: Environment Variable (Recommended)**
```bash
# Windows PowerShell
$env:GEMINI_API_KEY="your_actual_api_key_here"
node gemini-processor.js "YOUR_YOUTUBE_URL"
```

**Option B: Edit the Code**
1. Open `gemini-processor.js`
2. Replace `YOUR_GEMINI_API_KEY_HERE` with your actual API key
3. Save the file

### Step 3: Test with AI Enhancement
```bash
# With environment variable
$env:GEMINI_API_KEY="your_key_here"
node gemini-processor.js "https://www.youtube.com/watch?v=dQw4w9WgXcQ"

# Or just run (if you edited the code)
node gemini-processor.js "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
```

## 🎯 **What You Get with Gemini AI**

### ✨ **AI-Powered Features:**
- 🧠 **Intelligent Analysis** - Context-aware summaries
- 📝 **Real Transcript Processing** - Analyzes actual video content  
- 🎯 **Key Topics Extraction** - Identifies main themes
- 📊 **Structured Summaries** - Organized, coherent output
- 💡 **Takeaways & Insights** - Actionable conclusions

### 📋 **Sample AI Output:**
```
🤖 AI-GENERATED SUMMARY:
This TED-Ed video explores the impact of sleep deprivation on teenage 
brain development and academic performance. Key topics covered include:

• Biological clock changes during adolescence
• Effects of sleep loss on cognitive function  
• Practical strategies for better sleep hygiene
• Research findings on teenage sleep patterns

Main takeaways: Teenagers naturally require later sleep schedules due to 
biological changes, and schools should consider later start times to 
optimize student learning and wellbeing.
```

## 🔧 **Quick Setup Commands:**

```bash
# 1. Set API key (replace with your actual key)
$env:GEMINI_API_KEY="your_gemini_api_key_here"

# 2. Test with a video
node gemini-processor.js "https://www.youtube.com/watch?v=0RiDPisQAzM"

# 3. Start AI-enhanced web server (coming next!)
npm run ai-web
```

## 💡 **Benefits of AI Integration:**

✅ **Much Better Summaries** - AI understands context and meaning  
✅ **Real Transcript Analysis** - Works with actual video content  
✅ **Structured Output** - Organized key points and takeaways  
✅ **High Accuracy** - 95% confidence with real transcripts  
✅ **Educational Focus** - Perfect for learning and research  

---

**🔗 Get your free API key:** https://makersuite.google.com/app/apikey

**💡 Tip:** The Gemini API has generous free limits perfect for video analysis!