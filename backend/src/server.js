import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import bodyParser from 'body-parser';
import { customAlphabet } from 'nanoid';
import axios from 'axios';
import bcrypt from 'bcrypt';


dotenv.config();
const app = express();
const port = process.env.PORT || 5000;

const generateNumericCode = customAlphabet('0123456789', 6);

// Enable CORS for all routes
app.use(cors());
// Increase payload size limit for audio files (50MB)
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Server is running!',
  });
});

// MongoDB connection (use 127.0.0.1 for compatibility)
mongoose.connect("mongodb://localhost:27017/joyverse", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB Atlas'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Invitation Code Schema (New)
const invitationSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  isUsed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  usedBy: { type: String, default: null },
  usedAt: { type: Date, default: null }
});
const Invitation = mongoose.model('Invitation', invitationSchema);

// Therapist Schema
const therapistSchema = new mongoose.Schema({

  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  code: { type: String, unique: true },
  children: [
    {
      username: String,
      joinedAt: { type: Date, default: Date.now },
      sessions: [
        {
          sessionId: String,
          date: { type: Date, default: Date.now },
          assignedThemes: [String],
          themesChanged: [String],
          emotionsOfChild: [String],
          playedPuzzles: [
            {
              theme: String,
              level: Number,
              puzzleId: String,
              completedAt: { type: Date, default: Date.now },
              emotionsDuring: [String],
            },
          ],
              typingResults: [
                {
                  word: String,
                  input: String,
                  correct: Boolean,
                  completedAt: { type: Date, default: Date.now }
                }
              ],
              typingResultsMap: { type: Object, default: {} },
              preferredGame: { type: String, default: null },
              preferredStory: { type: String, default: null },
              readingRecordings: { type: Array, default: [] },
        },
      ],
      currentAssignedThemes: { type: [String], default: [] },
      assignedThemes: { type: [String], default: [] },
      playedPuzzles: { type: [String], default: [] },
      preferredGame: { type: String, default: null },
      preferredStory: { type: String, default: null },
    },
  ],
});
const Therapist = mongoose.model('Therapist', therapistSchema);

// Child Schema (not directly used, but kept for completeness)
const childSchema = new mongoose.Schema({
  username: String,
  assignedThemes: { type: [String], default: [] },
  playedPuzzles: { type: [String], default: [] },
  joinedAt: { type: Date, default: Date.now }
});
const Child = mongoose.model('Child', childSchema);

// Feedback Schema
const feedbackSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
const Feedback = mongoose.model('Feedback', feedbackSchema);

// FAQ Schema
const faqSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  question: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
const FAQ = mongoose.model('FAQ', faqSchema);

const wordListSchema = new mongoose.Schema({
  theme: { type: String, required: true },
  level: { type: Number, required: true },
  words: [
    {
      word: { type: String, required: true },
      image: { type: String, required: true },
    },
  ],
});

const WordList = mongoose.model('WordList', wordListSchema);

// Story Schema
const storySchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, default: 'Unknown' },
  story: { type: String, required: true },
  moral: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
const Story = mongoose.model('Story', storySchema);

// Generate unique 6-digit therapist code
const generateUniqueCode = async () => {
  let code;
  let exists = true;
  while (exists) {
    code = generateNumericCode();
    exists = await Therapist.findOne({ code });
  }
  return code;
};

// Generate a unique session ID
const generateSessionId = () => Date.now().toString(36) + Math.random().toString(36).substring(2);

// API endpoint to create invitation codes (Admin only)
app.post('/api/create-invitation', async (req, res) => {
  try {
    const { adminKey } = req.body;
    
    // A secure admin key should be used in production
    if (adminKey !== 'admin-secret-key') {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    // Use fixed invitation code 'joyversetherapist'
    const code = 'joyversetherapist';
    
    // Check if this code already exists
    const existingCode = await Invitation.findOne({ code });
    if (existingCode) {
      return res.status(400).json({ 
        message: 'Fixed invitation code already exists',
        code: code
      });
    }
    
    const newInvitation = new Invitation({ code });
    await newInvitation.save();
    
    res.status(201).json({ 
      message: 'Invitation code created successfully',
      code: newInvitation.code
    });
  } catch (error) {
    console.error('Error creating invitation code:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// API endpoint to list all invitation codes (Admin only)
app.get('/api/invitations', async (req, res) => {
  try {
    const { adminKey } = req.query;
    
    if (adminKey !== 'admin-secret-key') {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    const invitations = await Invitation.find();
    res.status(200).json(invitations);
  } catch (error) {
    console.error('Error fetching invitations:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Therapist Signup
app.post('/api/signup', async (req, res) => {
  console.log("Request body:", req.body);
  try {
    const { username, password, invitationCode } = req.body;

    // Check if the username already exists
    const existing = await Therapist.findOne({ username });
    if (existing) return res.status(400).json({ message: 'User already exists' });

    // Validate the invitation code - accept both the fixed code and any existing valid codes
    const fixedCode = 'joyversetherapist';
    let invitation;

    if (invitationCode === fixedCode) {
      // Check if fixed code exists in database, if not create it
      invitation = await Invitation.findOne({ code: fixedCode });
      if (!invitation) {
        invitation = new Invitation({ code: fixedCode });
        await invitation.save();
      }
    } else {
      // Check for other valid invitation codes
      invitation = await Invitation.findOne({ code: invitationCode });
      if (!invitation) {
        return res.status(403).json({ message: 'Invalid invitation code' });
      }
      
      // Check if non-fixed invitation code has already been used
      if (invitation.code !== fixedCode && invitation.isUsed) {
        return res.status(403).json({ message: 'Invitation code has already been used' });
      }
    }

    // Generate therapist code
    const code = await generateUniqueCode();

    // Create therapist
    const newTherapist = new Therapist({ 
      username, 
      password, 
      code,
      invitationCodeUsed: invitationCode 
    });
    await newTherapist.save();

    // Mark invitation as used (note: fixed code can be used multiple times)
    if (invitation.code !== fixedCode) {
      invitation.isUsed = true;
    }
    invitation.usedBy = invitationCode === fixedCode ? `${invitation.usedBy || ''}${username}, ` : username;
    invitation.usedAt = new Date();
    await invitation.save();

    res.status(201).json({ message: 'Signup successful', username, code });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// Therapist Login
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('Login attempt:', { username, password });

    // Check if the user is a therapist
    const therapist = await Therapist.findOne({ username });
    if (therapist) {
      console.log('Therapist found:', therapist.username);
      const isPasswordValid = await bcrypt.compare(password, therapist.password);
      if (isPasswordValid) {
        console.log('Therapist login successful');
        return res.status(200).json({
          role: 'therapist',
          username: therapist.username,
          code: therapist.code,
        });
      } else {
        console.log('Invalid therapist password');
      }
    }

    // Check if the user is a child
    const therapistWithChild = await Therapist.findOne({
      "children.username": username,
    });

    if (therapistWithChild) {
      console.log('Therapist with child found:', therapistWithChild.username);
      const child = therapistWithChild.children.find(
        (child) => child.username === username
      );

      if (child) {
        console.log('Child found:', child.username);
        const sessionId = generateSessionId();
        child.sessions.push({
          sessionId,
          assignedThemes: child.currentAssignedThemes || [],
          themesChanged: [],
          emotionsOfChild: [],
          playedPuzzles: [],
          preferredStory: child.preferredStory || null,
        });

        await therapistWithChild.save();

        console.log('Child login successful');
        return res.status(200).json({
          role: 'child',
          username: child.username,
          therapistCode: therapistWithChild.code,
          assignedThemes: child.currentAssignedThemes || [],
          preferredGame: child.preferredGame || null,
          preferredStory: child.preferredStory || null,
          sessionId,
        });
      }
    }

    console.log('Invalid username or password');
    res.status(401).json({ message: 'Invalid username or password' });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Add Child
app.post('/api/add-child', async (req, res) => {
  try {
    const { therapistCode, childName } = req.body;

    if (!therapistCode || !childName) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const therapist = await Therapist.findOne({ code: therapistCode });
    if (!therapist) return res.status(404).json({ message: 'Therapist not found' });

    const exists = therapist.children.find(child => child.username === childName);
    if (exists) return res.status(400).json({ message: 'Child already exists' });

    therapist.children.push({
      username: childName,
      currentAssignedThemes: [],
      assignedThemes: [], // For backward compatibility
      playedPuzzles: [],  // For backward compatibility
      preferredGame: null
    });
    await therapist.save();

    res.status(200).json({ message: 'Child added successfully' });
  } catch (error) {
    console.error('Error adding child:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Set preferred game for a child
app.post('/api/set-preferred-game', async (req, res) => {
  try {
    const { therapistCode, username, preferredGame } = req.body;
    if (!therapistCode || !username) return res.status(400).json({ error: 'Missing fields' });

    await Therapist.updateOne(
      { code: therapistCode, 'children.username': username },
      { $set: { 'children.$.preferredGame': preferredGame } }
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error setting preferred game:', error);
    res.status(500).json({ error: 'Server error' });
  }
});


// ==================== GEMINI-POWERED TYPING GAME ENDPOINTS ====================
// Place this section AFTER the generateSessionId() function (around line 138)
// and BEFORE the app.post('/api/save-typing-results') endpoint

// Import Gemini AI at the top of your file (around line 7)
import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI (place after other initializations, around line 15)
const genAI = new GoogleGenerativeAI("AIzaSyBqyTaqtqroFrAWYmc8txnZX3fFyoYh-14");

// Helper function to get Gemini model
function getGeminiModel() {
  return genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
}

// ========== NEW TYPING ENDPOINTS - ADD THESE ==========

// 1. Generate initial word for new typing session
app.post('/api/typing/generate-initial-word', async (req, res) => {
  try {
    const { sessionId, username, therapistCode } = req.body;
    
    if (!sessionId || !username || !therapistCode) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const model = getGeminiModel();
    
    const prompt = `You are helping a dyslexic child practice typing. Generate ONE simple word from common categories (fruits, animals, colors, objects) that is:
- 3-5 letters long
- Easy to spell
- Commonly known by children
- Suitable for dyslexic children (avoid confusing letter combinations like 'b/d', 'p/q')

Return ONLY the word in lowercase, nothing else. No punctuation, no explanations.`;

    const result = await model.generateContent(prompt);
    const word = result.response.text().trim().toLowerCase().replace(/[^a-z]/g, '');

    console.log('Generated initial word:', word);

    res.json({ 
      success: true, 
      word: word,
      isInitial: true 
    });
  } catch (error) {
    console.error('Error generating initial word:', error);
    res.status(500).json({ error: 'Failed to generate word', details: error.message });
  }
});

// 2. Generate next word based on typing history (ADAPTIVE)
// Adaptive next word generation (no repeats, focus on problem letters, max 5 letters)
app.post('/api/typing/generate-next-word', async (req, res) => {
  try {
    const { sessionId, username, therapistCode, typingHistory } = req.body;
    
    if (!sessionId || !username || !therapistCode || !typingHistory) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const model = getGeminiModel();
    
    // List of words already given
    const usedWords = typingHistory.map(item => item.word.toLowerCase()).join(', ');

    // Prepare typing history for analysis
    const historyText = typingHistory.map(item => 
      `Word: "${item.word}", Typed: "${item.input}", Correct: ${item.correct}`
    ).join('\n');

    const prompt = `You are an AI assistant helping a dyslexic child improve typing skills.

TYPING HISTORY:
${historyText}

Avoid repeating any of these words: ${usedWords}

Analyze the mistakes and identify which letters the child is struggling with (common dyslexic patterns: b/d, p/q, m/n, u/n, w/m, etc.).

Based on this analysis, generate ONE new word that:
1. Contains letters the child struggled with
2. Is simple and age-appropriate
3. Helps diagnose specific letter confusion patterns
4. Has a maximum of 5 letters
5. Is NOT one of the words already given

Return ONLY the word in lowercase, nothing else. No punctuation, no explanations.`;

    const result = await model.generateContent(prompt);
    const word = result.response.text().trim().toLowerCase().replace(/[^a-z]/g, '');

    console.log('Generated adaptive word:', word, 'based on history:', typingHistory.length, 'attempts');

    res.json({ 
      success: true, 
      word: word,
      isAdaptive: true 
    });
  } catch (error) {
    console.error('Error generating next word:', error);
    res.status(500).json({ error: 'Failed to generate word', details: error.message });
  }
});


// 3. Analyze typing session and identify problem letters
app.post('/api/typing/analyze-session', async (req, res) => {
  try {
    const { sessionId, username, therapistCode } = req.body;
    
    if (!sessionId || !username || !therapistCode) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const therapist = await Therapist.findOne({
      code: therapistCode,
      'children.username': username,
      'children.sessions.sessionId': sessionId
    });

    if (!therapist) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const child = therapist.children.find(c => c.username === username);
    const session = child.sessions.find(s => s.sessionId === sessionId);

    if (!session.typingResults || session.typingResults.length === 0) {
      return res.status(400).json({ error: 'No typing results to analyze' });
    }

    const model = getGeminiModel();

    // Prepare detailed analysis data
    const resultsText = session.typingResults.map(item => 
      `Word: "${item.word}", Typed: "${item.input}", Correct: ${item.correct}`
    ).join('\n');

    const prompt = `You are an expert in dyslexia and learning disabilities. Analyze this typing session data from a dyslexic child:

${resultsText}

Provide a detailed analysis in JSON format with these exact fields:
{
  "problematicLetters": ["array", "of", "letters"],
  "confusionPatterns": [{"confuses": "b", "with": "d"}],
  "strengths": ["array", "of", "strengths"],
  "overallAccuracy": 85,
  "recommendations": ["specific", "recommendations"],
  "severity": "mild"
}

Guidelines:
- problematicLetters: Letters consistently confused or missed
- confusionPatterns: Specific letter pair confusions (b/d, p/q, etc.)
- strengths: What the child does well
- overallAccuracy: Percentage 0-100
- recommendations: Specific practice suggestions for therapist
- severity: "mild", "moderate", or "severe"

Return ONLY valid JSON, no markdown, no code blocks, no explanations.`;

    const result = await model.generateContent(prompt);
    let analysisText = result.response.text().trim();
    
    // Remove markdown code blocks if present
    analysisText = analysisText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const analysis = JSON.parse(analysisText);

    // Store analysis in session
    session.typingAnalysis = {
      ...analysis,
      analyzedAt: new Date(),
      totalWords: session.typingResults.length,
      correctWords: session.typingResults.filter(r => r.correct).length
    };

    await therapist.save();

    console.log('Analysis completed for session:', sessionId);

    res.json({ 
      success: true, 
      analysis: session.typingAnalysis 
    });
  } catch (error) {
    console.error('Error analyzing typing session:', error);
    res.status(500).json({ 
      error: 'Failed to analyze session',
      details: error.message 
    });
  }
});

// 4. Get typing analysis for a child (across all sessions)
app.get('/api/typing/child-analysis', async (req, res) => {
  try {
    const { therapistCode, username } = req.query;
    
    if (!therapistCode || !username) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    const therapist = await Therapist.findOne({
      code: therapistCode,
      'children.username': username
    });

    if (!therapist) {
      return res.status(404).json({ error: 'Therapist or child not found' });
    }

    const child = therapist.children.find(c => c.username === username);
    
    // Collect all typing results across sessions
    const allTypingResults = [];
    const sessionAnalyses = [];

    child.sessions.forEach(session => {
      if (session.typingResults && session.typingResults.length > 0) {
        allTypingResults.push(...session.typingResults);
        
        if (session.typingAnalysis) {
          sessionAnalyses.push({
            sessionId: session.sessionId,
            analysis: session.typingAnalysis,
            date: session.typingAnalysis.analyzedAt || session.date
          });
        }
      }
    });

    // Calculate overall statistics
    const totalWords = allTypingResults.length;
    const correctWords = allTypingResults.filter(r => r.correct).length;
    const overallAccuracy = totalWords > 0 ? (correctWords / totalWords * 100).toFixed(2) : 0;

    res.json({
      success: true,
      username: username,
      overallStats: {
        totalWords,
        correctWords,
        overallAccuracy: parseFloat(overallAccuracy)
      },
      sessionAnalyses,
      hasData: totalWords > 0
    });
  } catch (error) {
    console.error('Error fetching child typing analysis:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// ========== MODIFIED: Enhanced save typing results with automatic analysis ==========
// REPLACE your existing app.post('/api/save-typing-results') with this:

app.post('/api/save-typing-results', async (req, res) => {
  try {
    const { therapistCode, username, sessionId, results } = req.body;
    if (!therapistCode || !username || !sessionId || !results) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    const therapist = await Therapist.findOne({ 
      code: therapistCode, 
      'children.username': username, 
      'children.sessions.sessionId': sessionId 
    });
    
    if (!therapist) return res.status(404).json({ error: 'Not found' });

    const childIndex = therapist.children.findIndex(c => c.username === username);
    const sessionIndex = therapist.children[childIndex].sessions.findIndex(s => s.sessionId === sessionId);
    
    if (sessionIndex === -1) return res.status(404).json({ error: 'Session not found' });

    const session = therapist.children[childIndex].sessions[sessionIndex];

    // Only allow saving typing results if session.preferredGame is 'typing'
    if (session.preferredGame && session.preferredGame !== 'typing') {
      return res.status(400).json({ 
        error: 'Typing results not allowed for this session (preferred game mismatch)' 
      });
    }

    // Append typing results to session
    session.typingResults = session.typingResults || [];
    session.typingResultsMap = session.typingResultsMap || {};
    
    results.forEach(r => {
      session.typingResults.push({ 
        word: r.word, 
        input: r.input, 
        correct: !!r.correct, 
        completedAt: new Date() 
      });
      session.typingResultsMap[r.word] = r.input;
    });

    await therapist.save();

    // Trigger automatic analysis if enough data (10+ words) and not already analyzed
    let autoAnalysis = null;
    if (session.typingResults.length >= 10 && !session.typingAnalysis) {
      try {
        console.log('Auto-analyzing session with', session.typingResults.length, 'words');
        
        const model = getGeminiModel();
        const resultsText = session.typingResults.map(item => 
          `Word: "${item.word}", Typed: "${item.input}", Correct: ${item.correct}`
        ).join('\n');

        const prompt = `Analyze this typing session from a dyslexic child and return ONLY valid JSON:

${resultsText}

Return this exact structure:
{
  "problematicLetters": [],
  "confusionPatterns": [],
  "strengths": [],
  "overallAccuracy": 0,
  "recommendations": [],
  "severity": "mild"
}`;

        const result = await model.generateContent(prompt);
        let analysisText = result.response.text().trim()
          .replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        
        autoAnalysis = JSON.parse(analysisText);
        
        session.typingAnalysis = {
          ...autoAnalysis,
          analyzedAt: new Date(),
          totalWords: session.typingResults.length,
          correctWords: session.typingResults.filter(r => r.correct).length
        };
        
        await therapist.save();
        console.log('Auto-analysis completed successfully');
      } catch (analysisError) {
        console.error('Auto-analysis failed:', analysisError);
      }
    }

    res.json({ 
      success: true,
      autoAnalysis: autoAnalysis,
      totalWords: session.typingResults.length
    });
  } catch (error) {
    console.error('Error saving typing results:', error);
    res.status(500).json({ error: 'Server error' });
  }
});
// Save typing results for a session
// app.post('/api/save-typing-results', async (req, res) => {
//   try {
//     const { therapistCode, username, sessionId, results } = req.body; // results = [{word,input,correct}]
//     if (!therapistCode || !username || !sessionId || !results) return res.status(400).json({ error: 'Missing fields' });

//     const therapist = await Therapist.findOne({ code: therapistCode, 'children.username': username, 'children.sessions.sessionId': sessionId });
//     if (!therapist) return res.status(404).json({ error: 'Not found' });

//     const childIndex = therapist.children.findIndex(c => c.username === username);
//     const sessionIndex = therapist.children[childIndex].sessions.findIndex(s => s.sessionId === sessionId);
//     if (sessionIndex === -1) return res.status(404).json({ error: 'Session not found' });

//     const session = therapist.children[childIndex].sessions[sessionIndex];

//     // Only allow saving typing results if session.preferredGame is 'typing'
//     if (session.preferredGame && session.preferredGame !== 'typing') {
//       return res.status(400).json({ error: 'Typing results not allowed for this session (preferred game mismatch)' });
//     }

//     // Append typing results to session.typingResults
//     session.typingResults = session.typingResults || [];
//     session.typingResultsMap = session.typingResultsMap || {};
//     results.forEach(r => {
//       session.typingResults.push({ word: r.word, input: r.input, correct: !!r.correct, completedAt: new Date() });
//       session.typingResultsMap[r.word] = r.input;
//     });

//     await therapist.save();
//     res.json({ success: true });
//   } catch (error) {
//     console.error('Error saving typing results:', error);
//     res.status(500).json({ error: 'Server error' });
//   }
// });

// Get Therapist Details
app.post('/api/get-therapist', async (req, res) => {
  try {
    const { username } = req.body;
    const therapist = await Therapist.findOne({ username });
    if (!therapist) return res.status(404).json({ message: 'Therapist not found' });

    res.status(200).json({
      username: therapist.username,
      code: therapist.code,
      children: therapist.children,
    });
  } catch (error) {
    console.error('Error fetching therapist:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Child Login (starts a new session)
app.post('/api/child-login', async (req, res) => {
  try {
    const { code, childName } = req.body;
    if (!code || !childName) {
      return res.status(400).json({ message: 'Both therapist code and child name are required' });
    }

    const therapist = await Therapist.findOne({ code });
    
    if (!therapist) return res.status(404).json({ message: 'Therapist not found' });

    const childIndex = therapist.children.findIndex(child => child.username === childName);
    console.log(childIndex);
    if (childIndex === -1) return res.status(401).json({ message: 'Child not found under this therapist' });

    // Create a new session
    const sessionId = generateSessionId();
    therapist.children[childIndex].sessions.push({
      sessionId,
      assignedThemes: [...(therapist.children[childIndex].currentAssignedThemes || therapist.children[childIndex].assignedThemes || [])],
      themesChanged: [],
      emotionsOfChild: [],
      playedPuzzles: [],
      typingResults: [],
      typingResultsMap: {},
      preferredGame: therapist.children[childIndex].preferredGame || null,
      preferredStory: therapist.children[childIndex].preferredStory || null,
    });

    await therapist.save();

    res.status(200).json({
      message: 'Child login successful',
      username: childName,
      sessionId,
      assignedThemes: therapist.children[childIndex].currentAssignedThemes || therapist.children[childIndex].assignedThemes || []
      ,
      preferredStory: therapist.children[childIndex].preferredStory || null,
    });
  } catch (error) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get child themes
app.get('/api/get-child-themes', async (req, res) => {
  try {
    const therapist = await Therapist.findOne({
      code: req.query.therapistCode,
      "children.username": req.query.username
    });

    const child = therapist?.children.find(c => c.username === req.query.username);
    res.json({
      themes: child?.currentAssignedThemes || child?.assignedThemes || ['underwater']
    });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Update child themes (for therapist assignment)
app.post('/api/update-child-themes', async (req, res) => {
  try {
    const { username, therapistCode, themes } = req.body;
    await Therapist.updateOne(
      { code: therapistCode, "children.username": username },
      { $set: { "children.$.currentAssignedThemes": themes, "children.$.assignedThemes": themes } }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to update themes" });
  }
});

// Track theme changes during session
app.post('/api/track-theme-change', async (req, res) => {
  try {
    const { username, therapistCode, sessionId, theme } = req.body;

    // Validate required fields
    if (!username || !therapistCode || !sessionId || !theme) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const therapist = await Therapist.findOne({
      code: therapistCode,
      "children.username": username,
      "children.sessions.sessionId": sessionId
    });

    if (!therapist) {
      return res.status(404).json({ error: "Therapist or session not found" });
    }

    const childIndex = therapist.children.findIndex(c => c.username === username);
    if (childIndex === -1) {
      return res.status(404).json({ error: "Child not found" });
    }

    const sessionIndex = therapist.children[childIndex].sessions.findIndex(s => s.sessionId === sessionId);
    if (sessionIndex === -1) {
      return res.status(404).json({ error: "Session not found" });
    }

    // Initialize themesChanged array if it doesn't exist
    if (!therapist.children[childIndex].sessions[sessionIndex].themesChanged) {
      therapist.children[childIndex].sessions[sessionIndex].themesChanged = [];
    }

    // Always push the theme to themesChanged array
    // This ensures we track all theme transitions, even if the theme remains the same
    therapist.children[childIndex].sessions[sessionIndex].themesChanged.push(theme);

    // Save the changes
    await therapist.save();

    res.json({
      success: true,
      message: "Theme change tracked successfully",
      currentTheme: theme
    });
  } catch (error) {
    console.error('Error tracking theme change:', error);
    res.status(500).json({
      error: "Server error",
      details: error.message
    });
  }
});

// Track emotions during session
app.post('/api/track-emotion', async (req, res) => {
  try {
    const { username, therapistCode, sessionId, emotion } = req.body;

    const therapist = await Therapist.findOne({
      code: therapistCode,
      "children.username": username,
      "children.sessions.sessionId": sessionId
    });

    if (!therapist) return res.status(404).json({ error: "Not found" });

    const child = therapist.children.find(c => c.username === username);
    const session = child.sessions.find(s => s.sessionId === sessionId);

    session.emotionsOfChild.push(emotion);
    await therapist.save();

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// Track played puzzles for session-based tracking
app.post('/api/update-played-puzzles', async (req, res) => {
  try {
    const { username, therapistCode, sessionId, theme, level, puzzleId, emotionsDuring } = req.body;

    // Validate required fields
    if (!username || !therapistCode || !sessionId || !theme || !level || !puzzleId) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const therapist = await Therapist.findOne({
      code: therapistCode,
      "children.username": username,
      "children.sessions.sessionId": sessionId
    });

    if (!therapist) {
      return res.status(404).json({ error: "Therapist, child, or session not found" });
    }

    const childIndex = therapist.children.findIndex(c => c.username === username);
    const sessionIndex = therapist.children[childIndex].sessions.findIndex(s => s.sessionId === sessionId);

    // Add puzzle to session tracking
    therapist.children[childIndex].sessions[sessionIndex].playedPuzzles.push({
      theme,
      level: Number(level),
      puzzleId,
      completedAt: new Date(),
      emotionsDuring: emotionsDuring || []
    });

    // Also update the backward-compatible playedPuzzles array
    if (!therapist.children[childIndex].playedPuzzles.includes(puzzleId)) {
      therapist.children[childIndex].playedPuzzles.push(puzzleId);
    }

    await therapist.save();

    res.json({ 
      success: true,
      message: "Puzzle completion recorded successfully"
    });
  } catch (error) {
    console.error('Error tracking puzzle completion:', error);
    res.status(500).json({ 
      error: "Server error",
      details: error.message
    });
  }
});

// Get session data
app.get('/api/get-session-data', async (req, res) => {
  try {
    const { therapistCode, childName, sessionId } = req.query;

    if (!therapistCode || !childName || !sessionId) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    const therapist = await Therapist.findOne({ 
      code: therapistCode,
      "children.username": childName
    });

    if (!therapist) {
      return res.status(404).json({ error: "Therapist or child not found" });
    }

    const child = therapist.children.find(c => c.username === childName);
    if (!child) {
      return res.status(404).json({ error: "Child not found" });
    }

    const session = child.sessions.find(s => s.sessionId === sessionId);
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }

    res.json({
      sessionData: session,
      success: true
    });
  } catch (error) {
    console.error('Error fetching session data:', error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get all sessions for a child
app.get('/api/get-child-sessions', async (req, res) => {
  try {
    const { therapistCode, childName } = req.query;

    if (!therapistCode || !childName) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    const therapist = await Therapist.findOne({ 
      code: therapistCode,
      "children.username": childName
    });

    if (!therapist) {
      return res.status(404).json({ error: "Therapist or child not found" });
    }

    const child = therapist.children.find(c => c.username === childName);
    if (!child) {
      return res.status(404).json({ error: "Child not found" });
    }

    res.json({
      sessions: child.sessions || [],
      success: true
    });
  } catch (error) {
    console.error('Error fetching child sessions:', error);
    res.status(500).json({ error: "Server error" });
  }
});

// Submit feedback
app.post('/api/submit-feedback', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    
    if (!name || !email || !message) {
      return res.status(400).json({ error: "All fields are required" });
    }
    
    const feedback = new Feedback({
      name,
      email,
      message
    });
    
    await feedback.save();
    
    res.status(201).json({ 
      success: true,
      message: "Feedback submitted successfully"
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get all feedback (admin only)
app.get('/api/get-feedback', async (req, res) => {
  try {
    const { adminKey } = req.query;
    
    if (adminKey !== 'admin-secret-key') {
      return res.status(403).json({ message: 'Unauthorized' });
    }
    
    const feedback = await Feedback.find().sort({ createdAt: -1 });
    res.json({ feedback });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ error: "Server error" });
  }
});

// Add FAQ
app.post('/api/add-faq', async (req, res) => {
  try {
    const { name,email,question } = req.body;
    if (!question || !name || !email) {
      return res.status(400).json({ error: "Question and answer are required" });
    }
    
    const faq = new FAQ({
      name,
      email,
      question
    });
    
    await faq.save();
    
    res.status(201).json({ 
      success: true,
      message: "FAQ added successfully"
    });
  } catch (error) {
    console.error('Error adding FAQ:', error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get all FAQs
app.get('/api/get-faqs', async (req, res) => {
  try {
    const faqs = await FAQ.find().sort({ createdAt: -1 });
    res.json({ faqs });
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    res.status(500).json({ error: "Server error" });
  }
});

// Delete Child
app.post('/api/delete-child', async (req, res) => {
  try {
    const { therapistCode, childName } = req.body;
    
    if (!therapistCode || !childName) {
      return res.status(400).json({ error: "Therapist code and child name are required" });
    }
    
    const therapist = await Therapist.findOne({ code: therapistCode });
    if (!therapist) {
      return res.status(404).json({ error: "Therapist not found" });
    }
    
    const childIndex = therapist.children.findIndex(child => child.username === childName);
    if (childIndex === -1) {
      return res.status(404).json({ error: "Child not found" });
    }
    
    // Remove the child from the therapist's children array
    therapist.children.splice(childIndex, 1);
    await therapist.save();
    
    res.json({ 
      success: true, 
      message: "Child deleted successfully" 
    });
  } catch (error) {
    console.error('Error deleting child:', error);
    res.status(500).json({ error: "Server error" });
  }
});

// Change Therapist Password
app.post('/api/change-password', async (req, res) => {
  try {
    const { username, currentPassword, newPassword } = req.body;
    
    if (!username || !currentPassword || !newPassword) {
      return res.status(400).json({ error: "All fields are required" });
    }
    
    const therapist = await Therapist.findOne({ username, password: currentPassword });
    if (!therapist) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    
    therapist.password = newPassword;
    await therapist.save();
    
    res.json({ 
      success: true, 
      message: "Password changed successfully" 
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ error: "Server error" });
  }
});

app.post('/api/superadmin/login', (req, res) => {
  const { username, password } = req.body;

  // Replace with your actual Super Admin credentials
  const SUPER_ADMIN_USERNAME = 'admin';
  const SUPER_ADMIN_PASSWORD = 'admin123';

  if (username === SUPER_ADMIN_USERNAME && password === SUPER_ADMIN_PASSWORD) {
    res.json({ message: 'Super Admin login successful' });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

app.post('/api/superadmin/register-therapist', authenticateSuperAdmin, async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  try {
    // Generate a unique code for the therapist
    const code = await generateUniqueCode();

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new therapist
    const therapist = new Therapist({ username, password: hashedPassword, code });
    await therapist.save();

    res.status(201).json({ message: 'Therapist registered successfully', code });
  } catch (error) {
    console.error('Error registering therapist:', error);
    res.status(500).json({ message: 'Failed to register therapist' });
  }
});

app.get('/api/superadmin/therapists', authenticateSuperAdmin, async (req, res) => {
  try {
    const therapists = await Therapist.find({}, { username: 1, code: 1, _id: 1 }); // Fetch only necessary fields
    res.status(200).json(therapists);
  } catch (error) {
    console.error('Error fetching therapists:', error);
    res.status(500).json({ message: 'Failed to fetch therapists' });
  }
});

app.delete('/api/superadmin/delete-therapist/:id', authenticateSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const therapist = await Therapist.findByIdAndDelete(id);

    if (!therapist) {
      return res.status(404).json({ message: 'Therapist not found' });
    }

    res.status(200).json({ message: 'Therapist deleted successfully' });
  } catch (error) {
    console.error('Error deleting therapist:', error);
    res.status(500).json({ message: 'Failed to delete therapist' });
  }
});

// Middleware to authenticate Super Admin
function authenticateSuperAdmin(req, res, next) {
  // Simply allow all requests to pass through
  next();
}

let currentPuzzleEmotions = [];

app.post('/api/facemesh-landmarks', async (req, res) => {
  const { landmarks } = req.body;
  console.log("Received Landmarks",landmarks.length)
  try {
    const response = await axios.post('http://127.0.0.1:5001/predict', { landmarks });
    const emotion = response.data.emotion;
    console.log('Predicted emotion from model:', emotion);
    currentPuzzleEmotions.push(emotion); // accumulate emotions
    res.status(200).json({ emotion });
  } catch (error) {
    res.status(500).json({ error: 'Failed to predict emotion' });
  }
});
 
app.get('/api/emotion', (req, res) => {
  if (currentPuzzleEmotions.length === 0) {
    return res.status(404).json({ error: 'No emotions recorded for this puzzle yet' });
  }

  // Calculate the most frequent (mode)
  const counts = {};
  for (const e of currentPuzzleEmotions) {
    counts[e] = (counts[e] || 0) + 1;
  }
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const dominantEmotion = sorted[0][0];
  console.log(currentPuzzleEmotions)
  // Clear history for the next puzzle
  currentPuzzleEmotions = [];

  res.json({ emotion: dominantEmotion });
});

app.get('/api/wordlists', async (req, res) => {
  try {
    const wordLists = await WordList.find();
    res.status(200).json(wordLists);
  } catch (error) {
    console.error('Error fetching word lists:', error);
    res.status(500).json({ error: 'Failed to fetch word lists' });
  }
});

// Migration endpoint: normalize therapist->children->sessions schema
// WARNING: Run this once in a controlled environment. It will modify DB documents.
app.post('/api/migrate-sessions', async (req, res) => {
  try {
    const therapists = await Therapist.find();
    let updated = 0;
    for (const t of therapists) {
      let changed = false;
      const newChildren = (t.children || []).map(child => {
        const c = child.toObject ? child.toObject() : JSON.parse(JSON.stringify(child));
        if (c.preferredGame === undefined) {
          c.preferredGame = null;
          changed = true;
        }
        c.sessions = (c.sessions || []).map(session => {
          const s = session;
          if (!s.typingResults) { s.typingResults = []; changed = true; }
          if (!s.typingResultsMap) { s.typingResultsMap = {}; changed = true; }
          if (s.preferredGame === undefined) { s.preferredGame = c.preferredGame || null; changed = true; }
          return s;
        });
        return c;
      });
      if (changed) {
        t.children = newChildren;
        await t.save();
        updated++;
      }
    }
    res.json({ success: true, updated });
  } catch (error) {
    console.error('Migration error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// Get stories list
app.get('/api/stories', async (req, res) => {
  try {
    const stories = await Story.find().sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, stories });
  } catch (err) {
    console.error('Error fetching stories', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Get a story by ID
app.get('/api/stories/:id', async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);
    if (!story) {
      return res.status(404).json({ success: false, message: 'Story not found' });
    }
    res.json({ success: true, story });
  } catch (err) {
    console.error('Error fetching story', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Set preferred story for a child
app.post('/api/set-preferred-story', async (req, res) => {
  try {
    const { therapistCode, username, storyId } = req.body;
    if (!therapistCode || !username || !storyId) return res.status(400).json({ error: 'Missing fields' });

    await Therapist.updateOne(
      { code: therapistCode, 'children.username': username },
      { 
        $set: { 
          'children.$.preferredStory': storyId,
          'children.$.preferredGame': 'reading'
        } 
      }
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Error setting preferred story', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Save reading audio (base64 or URL) to session recordings
app.post('/api/save-reading-audio', async (req, res) => {
  try {
    const { therapistCode, username, sessionId, storyId, audioData } = req.body;
    if (!therapistCode || !username || !sessionId || !storyId || !audioData) return res.status(400).json({ error: 'Missing fields' });

    const therapist = await Therapist.findOne({ code: therapistCode, 'children.username': username, 'children.sessions.sessionId': sessionId });
    if (!therapist) return res.status(404).json({ error: 'Not found' });

    const childIndex = therapist.children.findIndex(c => c.username === username);
    const sessionIndex = therapist.children[childIndex].sessions.findIndex(s => s.sessionId === sessionId);
    if (sessionIndex === -1) return res.status(404).json({ error: 'Session not found' });

    // Find the story title first
    const story = await Story.findById(storyId);
    if (!story) return res.status(404).json({ error: 'Story not found' });

    const session = therapist.children[childIndex].sessions[sessionIndex];
    session.readingRecordings = session.readingRecordings || [];
    session.readingRecordings.push({ 
      storyId, 
      storyTitle: story.title,
      audioData, 
      recordedAt: new Date() 
    });

    await therapist.save();
    res.json({ success: true });
  } catch (err) {
    console.error('Error saving reading audio', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get child's preferredGame and preferredStory
// Get child's reading recordings
app.get('/api/get-reading-recordings', async (req, res) => {
  try {
    const { therapistCode, username } = req.query;
    if (!therapistCode || !username) return res.status(400).json({ success: false, error: 'Missing params' });

    const therapist = await Therapist.findOne({ code: therapistCode })
      .populate('children.sessions.readingRecordings.storyId'); // Populate story details
    if (!therapist) return res.status(404).json({ success: false, error: 'Therapist not found' });

    const child = therapist.children.find(c => c.username === String(username));
    if (!child) return res.status(404).json({ success: false, error: 'Child not found' });

    // Get all sessions with recordings
    const sessionsWithRecordings = child.sessions
      .filter(s => s.readingRecordings && s.readingRecordings.length > 0)
      .map(s => ({
        sessionId: s.sessionId,
        date: s.date,
        recordings: s.readingRecordings.map(r => ({
          storyId: r.storyId,
          storyTitle: r.storyTitle || r.storyId?.title || 'Unknown Story',
          recordedAt: r.recordedAt,
          audioData: r.audioData
        }))
      }))
      // Sort sessions by date, newest first
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    res.json(sessionsWithRecordings);
  } catch (err) {
    console.error('Error fetching reading recordings', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/get-child-preference', async (req, res) => {
  try {
    const { therapistCode, username } = req.query;
    if (!therapistCode || !username) return res.status(400).json({ success: false, error: 'Missing params' });

    const therapist = await Therapist.findOne({ code: therapistCode });
    if (!therapist) return res.status(404).json({ success: false, error: 'Therapist not found' });

    const child = therapist.children.find(c => c.username === String(username));
    if (!child) return res.status(404).json({ success: false, error: 'Child not found' });

    res.json({ success: true, preferredGame: child.preferredGame || null, preferredStory: child.preferredStory || null });
  } catch (err) {
    console.error('Error fetching child preference', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});