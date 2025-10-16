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
app.use(bodyParser.json());


// MongoDB connection (use 127.0.0.1 for compatibility)
mongoose.connect('mongodb://127.0.0.1:27017/joyverse', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('MongoDB connection error:', err);
});


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
        },
      ],
      currentAssignedThemes: { type: [String], default: [] },
      assignedThemes: { type: [String], default: [] },
      playedPuzzles: { type: [String], default: [] },
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

const code = await generateUniqueCode();

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
        });

        await therapistWithChild.save();

        console.log('Child login successful');
        return res.status(200).json({
          role: 'child',
          username: child.username,
          therapistCode: therapistWithChild.code,
          assignedThemes: child.currentAssignedThemes || [],
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
      playedPuzzles: []   // For backward compatibility
    });
    await therapist.save();

    res.status(200).json({ message: 'Child added successfully' });
  } catch (error) {
    console.error('Error adding child:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

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
      playedPuzzles: []
    });

    await therapist.save();

    res.status(200).json({
      message: 'Child login successful',
      username: childName,
      sessionId,
      assignedThemes: therapist.children[childIndex].currentAssignedThemes || therapist.children[childIndex].assignedThemes || []
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
    console.log(currentPassword, newPassword);
    if (!username || !currentPassword || !newPassword) {
      return res.status(400).json({ error: "All fields are required" });
    }
      const therapist = await Therapist.findOne({ username });
    if (!therapist) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, therapist.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Hash the new password before saving
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    therapist.password = hashedNewPassword;
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



let currentPuzzleEmotions = [];

app.post('/api/facemesh-landmarks', async (req, res) => {
  const { landmarks } = req.body;
  
  // Validate input
  if (!landmarks || !Array.isArray(landmarks)) {
    console.error('Invalid landmarks data received:', landmarks);
    return res.status(400).json({ error: 'Invalid landmarks data' });
  }

  // Validate landmarks length (should be 1404 for the model)
  if (landmarks.length !== 1404) {
    console.error(`Invalid landmarks length: ${landmarks.length}, expected 1404`);
    return res.status(400).json({ 
      error: 'Invalid landmarks length',
      details: `Expected 1404 features, got ${landmarks.length}`
    });
  }

  console.log("Received Landmarks array length:", landmarks.length);
  
  try {
    // Forward to Python Flask server
    const response = await axios.post('http://127.0.0.1:5000/predict', { 
      landmarks: landmarks 
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.data || !response.data.emotion) {
      console.error('Invalid response from emotion model:', response.data);
      return res.status(500).json({ error: 'Invalid response from emotion model' });
    }
    
    const emotion = response.data.emotion;
    console.log('Predicted emotion from model:', emotion);
    currentPuzzleEmotions.push(emotion);
    res.status(200).json({ emotion });
  } catch (error) {
    console.error('Error predicting emotion:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to predict emotion',
      details: error.response?.data || error.message
    });
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
    const wordLists = await WordList.find(); // Only one expected
    

    // Wrap it in an array to match frontend expectations
    res.status(200).json(wordLists);
  } catch (error) {
    console.error('Error fetching word lists:', error);
    res.status(500).json({ error: 'Failed to fetch word lists' });
  }
});




// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
