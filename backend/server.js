import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import Groq from 'groq-sdk';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json());

// Roast level configurations
const roastLevelPrompts = {
  soft: `You are a friendly comedian who gently teases people.
    - Use playful, lighthearted humor
    - Keep it wholesome but still funny
    - Like a friend who lovingly makes fun of you
    - Use mild sarcasm and clever wordplay
    - Make them chuckle, not cry`,
  
  medium: `You are a stand-up comedian known for bold, sarcastic roasts.
    - Be witty and cutting but not cruel
    - Use sharp observations and clever burns
    - Reference their flaws creatively
    - Make it sting a little but in a fun way
    - Like a roast battle with some heat`,
  
  brutal: `You are a SAVAGE roast master with NO MERCY.
    - Go ABSOLUTELY BRUTAL - make them question their life choices
    - Attack their profession, dreams, and everything they told you
    - Use dark humor, devastating burns, and savage observations
    - Make it so harsh they might need therapy after
    - Be creative with insults - hit where it hurts
    - Reference their "about" section to make it deeply personal
    - Make them feel called out on a spiritual level
    - Like a verbal destruction with no survivors
    - BUT NEVER use slurs, hate speech, or genuinely harmful content`
};

/**
 * Detect language from user input
 * @param {string} text - Combined user input text
 * @returns {Object} - Language detection result
 */
function detectLanguage(text) {
  // Check for Devanagari script (Hindi/Marathi)
  const devanagariRegex = /[\u0900-\u097F]/;
  const hasDevanagari = devanagariRegex.test(text);
  
  // Common Marathi-specific words (transliterated)
  const marathiWords = /\b(kay|kasa|kaay|aahe|mala|tula|amhi|tumhi|majha|tuza|nahi|honar|zala|mhanun|pan|ani|sarva|kiti|koni|kuthe|kadhi|kashala|bara|chhan|bhau|tai|dada|aai|baba|zhala|zali|zale|kadhi|kasa|kashi|kahich|kahitari|watla|ashi|asa|ase)\b/i;
  
  // Common Hindi-specific words (transliterated)  
  const hindiWords = /\b(kya|kaise|kaisa|hai|hain|mujhe|tujhe|hum|tum|mera|tera|nahi|hoga|hua|isliye|lekin|aur|sab|kitna|kaun|kaha|kab|kyun|thik|achha|bhai|didi|maa|papa|hogaya|hogayi|hogaye|kabhi|kaisa|kaisi|kuch|kuchh|laga|aisa|aisi|aise)\b/i;
  
  // Check if text has Marathi indicators
  const hasMarathiWords = marathiWords.test(text);
  const hasHindiWords = hindiWords.test(text);
  
  // Marathi-specific Devanagari patterns
  const marathiDevanagari = /[ळऱ]|ला\s|ची\s|चे\s|चा\s|ण्या|ळा|ळे|झाल/;
  const hasMarathiDevanagari = marathiDevanagari.test(text);
  
  if (hasDevanagari) {
    // Text is in Devanagari script
    if (hasMarathiDevanagari) {
      return { language: 'marathi', script: 'devanagari' };
    }
    // Default to Hindi for Devanagari
    return { language: 'hindi', script: 'devanagari' };
  }
  
  // Text is in Latin script - check for transliterated words
  if (hasMarathiWords && !hasHindiWords) {
    return { language: 'marathi', script: 'latin' };
  }
  
  if (hasHindiWords && !hasMarathiWords) {
    return { language: 'hindi', script: 'latin' };
  }
  
  // If both detected, check which has more matches
  if (hasMarathiWords && hasHindiWords) {
    const marathiMatches = (text.match(marathiWords) || []).length;
    const hindiMatches = (text.match(hindiWords) || []).length;
    if (marathiMatches > hindiMatches) {
      return { language: 'marathi', script: 'latin' };
    }
    return { language: 'hindi', script: 'latin' };
  }
  
  // Default to English
  return { language: 'english', script: 'latin' };
}

/**
 * Get language instruction for the AI
 * @param {Object} langInfo - Language detection result
 * @returns {string} - Language instruction
 */
function getLanguageInstruction(langInfo) {
  const { language, script } = langInfo;
  
  if (language === 'marathi' && script === 'devanagari') {
    return `IMPORTANT: The user has written in Marathi (Devanagari script). 
    You MUST respond entirely in Marathi using Devanagari script (मराठी).
    Use authentic Marathi phrases, slang, and expressions for the roast.
    Example: "अरे बाबा", "काय रे", "भावा", "मग काय"`;
  }
  
  if (language === 'marathi' && script === 'latin') {
    return `IMPORTANT: The user has written in Marathi using English letters (transliterated).
    You MUST respond in Marathi but written in English letters (Roman Marathi/Romanized Marathi).
    Use authentic Marathi phrases and slang written in English.
    Example: "Arre baba", "Kay re", "Bhava", "Mag kay", "Kiti bore aahe"`;
  }
  
  if (language === 'hindi' && script === 'devanagari') {
    return `IMPORTANT: The user has written in Hindi (Devanagari script).
    You MUST respond entirely in Hindi using Devanagari script (हिंदी).
    Use authentic Hindi phrases, slang, and expressions for the roast.
    Example: "अरे भाई", "क्या बात है", "बंदे", "भइया"`;
  }
  
  if (language === 'hindi' && script === 'latin') {
    return `IMPORTANT: The user has written in Hindi using English letters (transliterated).
    You MUST respond in Hindi but written in English letters (Hinglish/Romanized Hindi).
    Use authentic Hindi phrases and slang written in English.
    Example: "Arre bhai", "Kya baat hai", "Bande", "Bhaiya", "Kitna boring hai"`;
  }
  
  return `Respond in English with modern, relatable humor.`;
}

/**
 * Generate a roast using Groq AI
 * @param {Object} userData - User data for personalized roast
 * @returns {Promise<string>} - Generated roast
 */
async function generateRoast(userData) {
  const { name, profession, level, about } = userData;
  
  // Detect language from user input
  const combinedText = `${name} ${profession} ${about}`;
  const langInfo = detectLanguage(combinedText);
  const languageInstruction = getLanguageInstruction(langInfo);
  
  console.log(`🌐 Detected language: ${langInfo.language} (${langInfo.script})`);
  
  const systemPrompt = roastLevelPrompts[level] || roastLevelPrompts.medium;
  
  const userPrompt = `Roast this person based on the following info:

Name: ${name}
Profession: ${profession}
About them: ${about || 'No additional info provided'}
Roast Level: ${level.toUpperCase()}

${languageInstruction}

Instructions:
- Write 4-6 lines of roast
- Make it personal using the info provided
- ${level === 'brutal' ? 'Be absolutely SAVAGE and RUTHLESS' : level === 'soft' ? 'Keep it playful and fun' : 'Be bold and sarcastic'}
- Use humor and references appropriate to the detected language
- Each line should be a separate burn
- End with a devastating closer
- DO NOT include any disclaimers or apologies
- DO NOT break character
- STRICTLY follow the language instruction above`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: level === 'brutal' ? 0.9 : level === 'soft' ? 0.7 : 0.8,
      max_tokens: 500,
      top_p: 1,
      stream: false
    });

    return completion.choices[0]?.message?.content || 'Even AI refuses to roast you. That\'s how boring you are.';
  } catch (error) {
    console.error('Groq API Error:', error);
    throw new Error('Failed to generate roast');
  }
}

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: '🔥 RoastMe AI Backend is running!',
    endpoints: {
      roast: 'POST /api/roast'
    }
  });
});

// Main roast endpoint
app.post('/api/roast', async (req, res) => {
  try {
    const { name, profession, level, about } = req.body;

    // Validation
    if (!name || !profession || !level) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, profession, and level are required'
      });
    }

    // Validate roast level
    const validLevels = ['soft', 'medium', 'brutal'];
    if (!validLevels.includes(level.toLowerCase())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid roast level. Choose: soft, medium, or brutal'
      });
    }

    console.log(`🎯 Generating ${level} roast for ${name}...`);

    // Generate roast
    const roast = await generateRoast({
      name: name.trim(),
      profession: profession.trim(),
      level: level.toLowerCase(),
      about: about?.trim() || ''
    });

    console.log(`✅ Roast generated successfully for ${name}`);

    res.json({
      success: true,
      roast,
      level: level.toLowerCase(),
      name
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to generate roast. Please try again.'
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
  🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥
  
     ROAST ME AI - Backend Server
     
     ⚡ Running on: http://localhost:${PORT}
     🤖 Powered by: Groq AI (Llama 3.3)
     
     Ready to destroy some egos! 😈
  
  🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥
  `);
});

export default app;
