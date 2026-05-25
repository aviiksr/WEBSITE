const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI = null;
if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key') {
  genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

/**
 * Smart AI/Heuristic categorization of files.
 * Uses Google Gemini API if configured in .env, otherwise falls back to highly robust heuristics.
 */
const categorizeFile = async (filename, mimeType) => {
  if (!genAI) {
    return runHeuristicCategorization(filename, mimeType);
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const prompt = `You are an advanced AI file analyzer. Analyze the file details below and classify it into one of these strict categories: 'Images', 'Documents', 'Media', 'Code', 'Archives', 'Others'.
    Also, extract 3 to 5 smart, highly contextual descriptive tags (labels) in lowercase for search indexing based on the filename and type (e.g. 'tutorial', 'receipt', 'javascript', 'invoice', 'presentation').
    
    File Name: "${filename}"
    MIME Type: "${mimeType}"
    
    Respond STRICTLY in JSON format matching this schema:
    {
      "category": "Images | Documents | Media | Code | Archives | Others",
      "tags": ["tag1", "tag2", "tag3"]
    }`;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json"
      }
    });

    const responseText = result.response.text();
    const data = JSON.parse(responseText);
    
    const validCategories = ['Images', 'Documents', 'Media', 'Code', 'Archives', 'Others'];
    const category = validCategories.includes(data.category) ? data.category : 'Others';
    const tags = Array.isArray(data.tags) ? data.tags.map(t => t.toLowerCase()) : [];
    
    return { category, tags, isAiPowered: true };
  } catch (error) {
    console.error("Gemini AI Categorization failed, falling back to heuristics:", error.message);
    return runHeuristicCategorization(filename, mimeType);
  }
};

const runHeuristicCategorization = (filename, mimeType) => {
  const ext = filename.split('.').pop().toLowerCase();
  let category = 'Others';
  
  if (mimeType.startsWith('image/')) {
    category = 'Images';
  } else if (mimeType.startsWith('video/') || mimeType.startsWith('audio/')) {
    category = 'Media';
  } else {
    const documentTypes = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'rtf'];
    if (documentTypes.includes(ext) || mimeType.includes('document')) {
      category = 'Documents';
    } else {
      const codeTypes = ['js', 'jsx', 'ts', 'tsx', 'html', 'css', 'json', 'py', 'java', 'c', 'cpp', 'go', 'rs', 'php', 'sh'];
      if (codeTypes.includes(ext) || mimeType.includes('text/x-') || mimeType.includes('application/json')) {
        category = 'Code';
      } else {
        const archiveTypes = ['zip', 'rar', 'tar', 'gz', '7z'];
        if (archiveTypes.includes(ext) || mimeType.includes('zip') || mimeType.includes('tar')) {
          category = 'Archives';
        }
      }
    }
  }

  // Create clean fallback tags
  const tags = [ext, mimeType.split('/')[0]].filter(Boolean);
  return { category, tags, isAiPowered: false };
};

module.exports = { categorizeFile };
