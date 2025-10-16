import { useRef, useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Confetti from 'react-confetti';
import { ArrowRight, Home, AlertCircle, Trophy, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import * as tf from '@tensorflow/tfjs';
// @ts-expect-error: No types for facemesh
import * as facemesh from '@tensorflow-models/facemesh';
import Header from './Header';
import Footer from './Footer';

// --- Types ---
type WordList = {
  word: string;
  image: string;
};

type ThemeLevel = {
  [key: number]: WordList[];
};

type WordLists = {
  [key: string]: ThemeLevel;
};

type Params = Record<string, string | undefined>;

const totalPuzzles = 10;

const Game = () => {
  // --- Routing/params ---
  const { theme: initialTheme = 'underwater', level: initialLevel = '1' } = useParams<Params>();
  const navigate = useNavigate();
  const location = useLocation();

  // --- State ---
  const [grid, setGrid] = useState<string[][]>([]);
  const [selected, setSelected] = useState<number[][]>([]);
  const [completed, setCompleted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showWrongMessage, setShowWrongMessage] = useState(false);
  const [showThemeComplete, setShowThemeComplete] = useState(false);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [correctStreak, setCorrectStreak] = useState(0);
  const [incorrectStreak, setIncorrectStreak] = useState(0);
  const [wordIndex, setWordIndex] = useState(0);
  const [lastTwoAnswers, setLastTwoAnswers] = useState<string[]>([]);
  const [playedPuzzles, setPlayedPuzzles] = useState<Set<string>>(new Set());
  const [wordLists, setWordLists] = useState<WordLists | null>(null);
  const totalPuzzles = 10;
  const [playedCount, setPlayedCount] = useState<number>(() => {
    const stored = sessionStorage.getItem('playedCount');
    return stored ? parseInt(stored, 10) : 0;
  });
  const [sessionId, setSessionId] = useState('');
  const [currentTheme, setCurrentTheme] = useState(initialTheme);
  const [currentLevel, setCurrentLevel] = useState(initialLevel);
  const [themes, setThemes] = useState<string[]>([]);
  const [landmarks, setLandmarks] = useState<any[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [model, setModel] = useState<any>(null);
  const [modelStatus, setModelStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [emotion, setEmotion] = useState<string | null>(null);
  const [detectionStatus, setDetectionStatus] = useState<string>('');
  const [score, setScore] = useState<number>(() => {
    const stored = sessionStorage.getItem('gameScore');
    return stored ? parseInt(stored) : 0;
  });
  const [isGameReady, setIsGameReady] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const lastSentRef = useRef(Date.now());

  // Add a useRef to track if sessionId has been set
  const sessionIdRef = useRef('');

  // Load word lists
  useEffect(() => {
    const fetchWordLists = async () => {
      try {
        console.log('Fetching word lists...');
        const response = await axios.get('http://localhost:5000/api/wordlists');

        // Update validation to expect an array with an object containing wordLists
        if (!response.data || !Array.isArray(response.data) || response.data.length === 0 || !response.data[0] || !response.data[0].wordLists) {
          console.error('Invalid response format: Expected an array containing an object with wordLists.');
          throw new Error('Invalid response format: Expected array with wordLists.');
        }

        // Access wordLists from the first element of the response array
        const rawWordListsData = response.data[0].wordLists;

        const fetchedWordLists: WordLists = {};

        // Process the raw wordLists data (themes and levels) similar to Game2.tsx's successful logic
        const themes = Object.keys(rawWordListsData);

        if (themes.length === 0) {
             console.error('No themes found in rawWordListsData');
             throw new Error('No themes found in fetched word lists.');
        }

        themes.forEach((theme) => {
          if (!fetchedWordLists[theme]) {
            fetchedWordLists[theme] = {};
          }

          const levels = rawWordListsData[theme];
          if (typeof levels === 'object' && levels !== null) {
             const levelKeys = Object.keys(levels);

             if (levelKeys.length === 0) {
                console.warn(`No levels found for theme ${theme}. Skipping theme.`);
                return; // Skip to the next theme
             }

             levelKeys.forEach((levelKey) => {
                const levelNum = parseInt(levelKey, 10);
                // Check if the parsed level is a valid number
                if (!isNaN(levelNum)) {
                   const words = levels[levelKey];

                   // Validate and process words array
                   if (Array.isArray(words)) {
                      const validWords = words.filter(word =>
                        typeof word === 'object' &&
                        word !== null && // Ensure word is not null
                        typeof word.word === 'string' &&
                        typeof word.image === 'string'
                      );

                      if (validWords.length > 0) {
                         fetchedWordLists[theme][levelNum] = validWords;
                      } else {
                         console.warn(`No valid words found (or invalid word structure) for theme ${theme}, level ${levelKey}. Skipping level.`);
                      }
                   } else {
                      console.warn(`Invalid word list format for theme ${theme}, level ${levelKey}: not an array. Skipping level.`, words);
                   }
                } else {
                   console.warn(`Invalid level key for theme ${theme}: ${levelKey}. Skipping level.`);
                }
             });
          } else {
             console.warn(`Invalid levels object for theme ${theme}. Skipping theme.`, levels);
          }
        });

        setWordLists(fetchedWordLists);
        setIsLoading(false);

      } catch (error) {
        console.error('Error fetching or processing word lists:', error);
        console.log('Attempting fallback or error state...');
        setWordLists({}); // Set to empty or a minimal default to avoid errors
        setIsLoading(false);
      }
    };

    fetchWordLists();
  }, []); // Empty dependency array to run once on mount

  // Save score to sessionStorage whenever it changes
  useEffect(() => {
    sessionStorage.setItem('gameScore', score.toString());
  }, [score]);

  // Save playedCount to sessionStorage whenever it changes
  useEffect(() => {
    sessionStorage.setItem('playedCount', playedCount.toString());
  }, [playedCount]);

  // Update isGameReady based on model status
  useEffect(() => {
    setIsGameReady(modelStatus === 'ready');
  }, [modelStatus]);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (showThemeComplete) {
      // Game is completed, clear session storage here
      sessionStorage.removeItem('playedCount');
      sessionStorage.removeItem('playedPuzzles');
    }
  }, [showThemeComplete]);

  // --- Camera initialization with robust error handling ---
  useEffect(() => {
    let stream: MediaStream | null = null;
    let stop = false;
    let retryTimeout: NodeJS.Timeout;

    const initializeCamera = async () => {
      if (stop) return;
      
      try {
        // First get the media stream
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 }
          }
        });

        // Then wait for video element to be ready
        const waitForVideo = () => {
          if (stop) return;
          
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            streamRef.current = stream;
            
            // Wait for 'loadeddata' event before attempting to play
            videoRef.current.onloadeddata = () => {
              if (stop) return; // Check stop flag again
              videoRef.current?.play()
                .then(() => {
                  console.log('Video started playing successfully after loadeddata');
                  setIsVideoReady(true);
                  setDetectionStatus('Camera ready, starting detection...');
                })
                .catch(err => {
                  console.error('Error playing video after loadeddata:', err);
                  // Depending on the error, may need different retry logic or user feedback
                });
            };

            // In case loadeddata doesn't fire or is already fired (e.g., on hot reload)
            if (videoRef.current.readyState >= 2) { // HAVE_CURRENT_DATA or higher
              videoRef.current.onloadeddata = null; // Prevent duplicate listener
              videoRef.current.play()
                .then(() => {
                  console.log('Video already loaded, started playing immediately');
                  setIsVideoReady(true);
                  setDetectionStatus('Camera ready, starting detection...');
                })
                .catch(err => {
                  console.error('Error playing video when already loaded:', err);
                  // Depending on the error, may need different retry logic or user feedback
                });
            }

          } else {
            // If video element not ready, retry after a short delay
            retryTimeout = setTimeout(waitForVideo, 100);
          }
        };

        waitForVideo();
      } catch (err) {
        console.error('Camera initialization error:', err);
        setDetectionStatus('Camera permission denied or not available');
      }
    };

    // Start camera initialization
    initializeCamera();

    // Cleanup function
    return () => {
      stop = true;
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
      if (stream) {
        stream.getTracks().forEach(track => {
          console.log('Stopping track:', track.kind);
          track.stop();
        });
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, []); // Empty dependency array since we want this to run once on mount

  // --- Model loading: facemesh only ---
  useEffect(() => {
    let isMounted = true;
    const loadModel = async () => {
      setModelStatus('loading');
      try {
        await tf.ready();
        const faceMeshModel = await facemesh.load({
          maxFaces: 1,
          refineLandmarks: true,
          mesh: true
        });
        if (!isMounted) return;
        setModel({
          type: 'facemesh',
          estimateFaces: faceMeshModel.estimateFaces.bind(faceMeshModel)
        });
        setModelStatus('ready');
      } catch (error) {
        console.error('Model loading error:', error);
        if (isMounted) {
          setModelStatus('error');
          setModel(null);
        }
      }
    };
    loadModel();
    return () => { isMounted = false; };
  }, []);

  // --- Detection: facemesh only ---
  useEffect(() => {
    if (!model || !videoRef.current || !isVideoReady) return;
    let stop = false;
    const detect = async () => {
      if (stop) return;
      try {
        if (!videoRef.current || videoRef.current.readyState < 2) {
          setTimeout(detect, 200);
          return;
        }
        if (model && 'estimateFaces' in model) {
          const predictions = await model.estimateFaces(videoRef.current);
          if (predictions.length > 0) {
            const now = Date.now();
            if (now - lastSentRef.current > 3000) { // 3 seconds
              lastSentRef.current = now;
              const rawLandmarks = predictions[0].scaledMesh;
              const flattenedLandmarks = rawLandmarks.reduce((acc: number[], point: number[]) => [...acc, ...point], []);
              if (!flattenedLandmarks || !Array.isArray(flattenedLandmarks) || flattenedLandmarks.length !== 1404) {
                setDetectionStatus('Invalid landmarks format');
                return;
              }
              setLandmarks(flattenedLandmarks);
              setDetectionStatus(`Face detected with ${flattenedLandmarks.length} landmarks`);
              try {
                const response = await fetch('http://localhost:5000/api/facemesh-landmarks', {
                  method: 'POST',
                  headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                  },
                  body: JSON.stringify({ landmarks: flattenedLandmarks })
                });
                if (!response.ok) {
                  return;
                }
                const data = await response.json();
                if (data.emotion) {
                  setEmotion(data.emotion);
                  //await trackEmotion(data.emotion);
                  console.log('Emotion detected (Facemesh backend): ', data.emotion);
                }
              } catch (error) {
                console.error('Error sending landmarks to backend:', error);
                setEmotion(null);
                setDetectionStatus('Backend error - check server');
              }
            }
          } else {
            setDetectionStatus('No face detected');
            setEmotion(null);
          }
        }
      } catch (error) {
        console.error('Detection loop error:', error);
      }
      if (!stop) setTimeout(detect, 100);
    };
    detect();
    return () => { stop = true; };
  }, [model, isVideoReady]);

  // --- Draw facemesh landmarks for debugging (hidden canvas) ---
  useEffect(() => {
    if (!model || !videoRef.current || !canvasRef.current) return;
    if (!('estimateFaces' in model)) return;
    const facemeshModel = model;
    let stop = false;
    const drawLandmarks = async () => {
      if (stop) return;
      if (!videoRef.current || !canvasRef.current) return;
      const predictions = await facemeshModel.estimateFaces(videoRef.current);
      const canvas = canvasRef.current;
      const ctx = canvas && videoRef.current ? canvas.getContext('2d') : null;
      if (!ctx || !canvas || !videoRef.current) return;
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (predictions.length > 0) {
        predictions.forEach((prediction: { scaledMesh: [number, number, number][] }) => {
          prediction.scaledMesh.forEach((point: [number, number, number]) => {
            ctx.beginPath();
            ctx.arc(point[0], point[1], 1, 0, 2 * Math.PI);
            ctx.fillStyle = 'red';
            ctx.fill();
          });
        });
      }
      requestAnimationFrame(drawLandmarks);
    };
    drawLandmarks();
    return () => { stop = true; };
  }, [model]);

  // --- Throttle backend facemesh landmark requests ---
  useEffect(() => {
    if (landmarks.length > 0) {
      const now = Date.now();
      if (now - lastSentRef.current < 3000) return; // throttle: 3 seconds
      lastSentRef.current = now;
      const sendLandmarksToBackend = async () => {
        try {
          await fetch('http://localhost:5000/api/facemesh-landmarks', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ landmarks }),
          });
          const data = await response.json();
          // Optionally log backend response for debugging
          // console.log('Backend response:', data);
        } catch (error) {
          console.error('Error sending landmarks to backend:', error);
        }
      };
      sendLandmarksToBackend();
    }
  }, [landmarks]);

  useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --- Session init ---
  useEffect(() => {
    const storedData = sessionStorage.getItem('childData');
    const storedPlayedCount = sessionStorage.getItem('playedCount');
    const storedScore = sessionStorage.getItem('gameScore');
    const storedPlayedPuzzles = sessionStorage.getItem('playedPuzzles');

    if (!storedData) {
      navigate('/child-login');
      return;
    }

    try {
      const { username, therapistCode, assignedThemes, sessionId: storedSessionId } = JSON.parse(storedData);
      setThemes(assignedThemes || []);

      const hasSessionIdBeenSet = sessionIdRef.current !== '';

      if (!hasSessionIdBeenSet && storedSessionId) {
        setSessionId(storedSessionId);
        sessionIdRef.current = storedSessionId;

        // Load existing game state from sessionStorage
        if (storedPlayedCount) {
          setPlayedCount(parseInt(storedPlayedCount, 10));
        }
        if (storedScore) {
          setScore(parseInt(storedScore, 10));
        }
        if (storedPlayedPuzzles) {
          try {
            setPlayedPuzzles(new Set(JSON.parse(storedPlayedPuzzles)));
          } catch (e) {
            console.error("Failed to parse stored playedPuzzles, starting fresh:", e);
            setPlayedPuzzles(new Set());
            sessionStorage.setItem('playedPuzzles', JSON.stringify([]));
          }
        }
        setCurrentTheme(assignedThemes?.[0] || 'underwater');
      } else if (hasSessionIdBeenSet) {
        // Session ID already set, do nothing
      } else {
        console.warn("No stored sessionId found in childData, navigating to login.");
        navigate('/child-login');
      }
    } catch (e) {
      console.error('Error initializing session or parsing data:', e);
      navigate('/child-login');
    }
  }, [navigate]);

  // --- Emotion fetch and tracking ---
  const trackEmotion = async (emotion: string) => {
    if (!sessionId) return;
    const childData = sessionStorage.getItem('childData');
    if (!childData) return;
    const { username, therapistCode } = JSON.parse(childData);
    try {
      // Update the emotion on the server
      const url = 'http://localhost:5000/api/track-emotion';
      const options = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          therapistCode,
          sessionId,
          emotion
        })
      };
      
      // console.log('Attempting to track emotion:', { url, options }); // Log the fetch details

      await fetch(url, options);

    } catch (error) {
      console.error('Error tracking emotion:', error);
    }
  };

  // --- Theme tracking ---
  const trackThemeChange = async (theme: string) => {
    if (!sessionId) return;
    const childData = sessionStorage.getItem('childData');
    if (!childData) return;
    const { username, therapistCode } = JSON.parse(childData);
    try {
      await fetch('http://localhost:5000/api/track-theme-change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          therapistCode,
          sessionId,
          theme
        })
      });
      // console.log("Tracked theme change:", theme);
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error tracking theme change:', error.message);
      } else {
        console.error('Error tracking theme change');
      }
    }
  };

  // --- Puzzle played tracking ---
  const trackPuzzlePlayed = async (theme: string, level: number, puzzleId: string, emotion: string) => {
    if (!sessionId) return;
    const childData = sessionStorage.getItem('childData');
    if (!childData) return;
    const { username, therapistCode } = JSON.parse(childData);
    try {
      await fetch('http://localhost:5000/api/update-played-puzzles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          therapistCode,
          sessionId,
          theme,
          level,
          puzzleId,
          emotions: [emotion]
        })
      });
      // console.log("Tracked puzzle played:", puzzleId, "Emotion:", emotion);
    } catch (error) {
      if (error instanceof Error) {
        console.error('Error tracking puzzle played:', error.message);
      } else {
        console.error('Error tracking puzzle played');
      }
    }
  };

  
const adjustDifficulty = async () => {
    let newLevel = parseInt(currentLevel);
    let newWordIndex = wordIndex + 1;
    let nextTheme = currentTheme;

    // Track last two answers for level adjustment
    const updatedAnswers = [...lastTwoAnswers, completed ? '✅' : '❌'].slice(-2);
    setLastTwoAnswers(updatedAnswers);
    console.log('🎮 Last two answers (in adjustDifficulty):', updatedAnswers.join(' '));
    
    if (updatedAnswers.length === 2) {
      const [prev, curr] = updatedAnswers;
      if (prev === '✅' && curr === '✅' && newLevel < 3) {
        newLevel++;
        // console.log('📈 Level increased to:', newLevel);
      } else if (prev === '❌' && curr === '❌' && newLevel > 1) {
        newLevel--;
        // console.log('📉 Level decreased to:', newLevel);
      }
    }


   let detectedEmotion = emotion || 'neutral'; // Use the state variable 'emotion'
    console.log('Using detected emotion for theme logic:', detectedEmotion);
    try {
      const res = await fetch('http://localhost:5000/api/emotion');
      const data = await res.json();
      detectedEmotion = data.emotion || 'neutral';
      console.log('Detected Emotion:', emotion);
    } catch (error) {
      console.error('Failed to fetch emotion:', error);
    }

   /* // "Bad" emotions trigger a theme change
    // Use the existing 'emotion' state variable, which is updated asynchronously
   */
  



    const stayInSameThemeEmotions = ['Happiness', 'surprise', 'neutral']; // Added neutral to stay
    const switchThemeEmotions = ['fear', 'anger', 'disgust','sad'];

    // Normalize detected emotion for comparison
    const normalizedDetectedEmotion = detectedEmotion.toLowerCase();
    console.log('Normalized detected emotion:',normalizedDetectedEmotion);
    if (switchThemeEmotions.includes(normalizedDetectedEmotion)) {
      const availableThemes = themes.filter(t => t !== nextTheme);
      // console.log('Available themes for switch:', availableThemes, 'Length:', availableThemes.length); // Added log

      if (availableThemes.length > 0) {
        nextTheme = availableThemes[Math.floor(Math.random() * availableThemes.length)];
        console.log(`Emotion '${detectedEmotion}' triggered theme switch. New theme: ${nextTheme}`);
      } else {
         console.log(`Emotion '${detectedEmotion}' detected, but no other themes available to switch.`);
      }
    }
    // Track theme transition no matter what (use nextTheme)
    await trackThemeChange(nextTheme);
    // Track emotion (use the detectedEmotion)
    if (detectedEmotion) await trackEmotion(detectedEmotion);

    // If changed theme, start at word 0
    newWordIndex = nextTheme !== currentTheme ? 0 : wordIndex + 1; // Increment wordIndex if theme didn't change

    // --- Find the next unplayed puzzle ---
    let nextPuzzle = null;
    const allThemes = Object.keys(wordLists || {});
    const shuffledThemes = allThemes.sort(() => Math.random() - 0.5); // Randomize theme order for search

    // Prioritize finding an unplayed puzzle in the determined next theme and level
    const potentialLevels = wordLists?.[nextTheme];
    if (potentialLevels) {
        const levelKeys = Object.keys(potentialLevels).map(Number).sort(); // Sort levels numerically
        // Start searching from the determined newLevel
        const startLevelIndex = levelKeys.indexOf(newLevel);
        const levelsToSearch = startLevelIndex !== -1 ? 
                               [...levelKeys.slice(startLevelIndex), ...levelKeys.slice(0, startLevelIndex)] : 
                               levelKeys; // If newLevel not found, search all levels

        for (const levelNum of levelsToSearch) {
            const wordsForLevel = wordLists?.[nextTheme]?.[levelNum];
            if (wordsForLevel && wordsForLevel.length > 0) {
                // Start searching from newWordIndex for the determined theme/level
                 const startIndex = Math.max(0, Math.min(newWordIndex, wordsForLevel.length -1)); // Ensure start index is valid
                 const wordsToSearch = [...wordsForLevel.slice(startIndex), ...wordsForLevel.slice(0, startIndex)];

                for (let i = 0; i < wordsToSearch.length; i++) {
                    const wordCandidate = wordsToSearch[i];
                    const originalIndex = wordsForLevel.indexOf(wordCandidate); // Find original index
                    const puzzleKey = `${nextTheme}-${levelNum}-${originalIndex}`;
                    
                    if (!playedPuzzles.has(puzzleKey)) {
                        nextPuzzle = { theme: nextTheme, level: levelNum, wordIndex: originalIndex };
                        // console.log('Found unplayed puzzle in target theme/level:', puzzleKey);
                        break; // Found an unplayed puzzle in the target theme/level or surrounding levels
                    }
                }
            }
            if (nextPuzzle) break; // Found puzzle, exit level loop
        }
    }

    // If no unplayed puzzle found in the determined next theme/levels, search across ALL themes and levels
    if (!nextPuzzle && wordLists) {
        console.log('Searching for unplayed puzzle across all themes and levels.');
        // Iterate through shuffled themes
        for (const theme of shuffledThemes) {
            const levelsInTheme = wordLists[theme];
             if (levelsInTheme) {
                const levelKeys = Object.keys(levelsInTheme).map(Number).sort();
                 for (const levelNum of levelKeys) {
                    const wordsForLevel = levelsInTheme[levelNum];
                     if (wordsForLevel && wordsForLevel.length > 0) {
                         // Iterate through words in the level
                         for (let idx = 0; idx < wordsForLevel.length; idx++) {
                            const puzzleKey = `${theme}-${levelNum}-${idx}`;
                             if (!playedPuzzles.has(puzzleKey)) {
                                 nextPuzzle = { theme: theme, level: levelNum, wordIndex: idx };
                                 // console.log('Found unplayed puzzle anywhere:', puzzleKey);
                                 break; // Found an unplayed puzzle anywhere
                             }
                         }
                     }
                    if (nextPuzzle) break; // Found puzzle, exit level loop
                 }
             }
            if (nextPuzzle) break; // Found puzzle, exit theme loop
        }
    }
    // --- End Find the next unplayed puzzle ---


    // Check if a next puzzle was found before proceeding
    if (!nextPuzzle) {
        console.warn('No unplayed puzzles left in any theme or level.');
        // Handle case where all puzzles are played (e.g., show completion screen)
        setShowThemeComplete(true); // Assuming this indicates game end
        stopCamera();
        return;
    }
    
    const { theme: finalNextTheme, level: finalNewLevel, wordIndex: finalNextWordIndex } = nextPuzzle;

    // Track puzzle played (after determining the next puzzle)
    await trackPuzzlePlayed(finalNextTheme, finalNewLevel, `${finalNextTheme}-${finalNewLevel}-${finalNextWordIndex}`, detectedEmotion || '');
    
    // Update playedPuzzles set BEFORE navigating
    setPlayedPuzzles(prev => new Set(prev).add(`${finalNextTheme}-${finalNewLevel}-${finalNextWordIndex}`));
    // console.log('Played Puzzles after update:', new Set(playedPuzzles).add(`${finalNextTheme}-${finalNewLevel}-${finalNextWordIndex}`));

    // Check total puzzles played AFTER determining the next puzzle but BEFORE navigating
    const nextPlayedCount = playedCount + 1;
    // console.log(`Played count: ${nextPlayedCount}/${totalPuzzles}`);

    if (nextPlayedCount >= totalPuzzles) {
      setShowThemeComplete(true);
      stopCamera();
      setPlayedCount(nextPlayedCount); // Update state for completion screen
      return;
    }

    // Update state and navigate to the next puzzle
    setPlayedCount(nextPlayedCount);
    setCurrentTheme(finalNextTheme);
    setCurrentLevel(finalNewLevel.toString());
    setWordIndex(finalNextWordIndex);

    setTimeout(() => {
      navigate(`/game/${finalNextTheme}/${finalNewLevel}`);
    }, 500); // Small delay before navigating
  };

  // --- Grid generator ---
  function generateGrid(size: number, word: string) {
    const grid: string[][] = [];
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let i = 0; i < size; i++) {
      grid[i] = [];
      for (let j = 0; j < size; j++) {
        grid[i][j] = letters[Math.floor(Math.random() * letters.length)];
      }
    }
    const direction = Math.random() < 0.5 ? 'horizontal' : 'vertical';
    const row = Math.floor(Math.random() * (size - (direction === 'vertical' ? word.length : 0)));
    const col = Math.floor(Math.random() * (size - (direction === 'horizontal' ? word.length : 0)));
    for (let i = 0; i < word.length; i++) {
      if (direction === 'horizontal') {
        grid[row][col + i] = word[i];
      } else {
        grid[row + i][col] = word[i];
      }
    }
    return grid;
  }

  // --- Selection state for click-and-drag ---
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<{row: number, col: number} | null>(null);

  // --- Cell selection handlers ---
  const handleCellMouseDown = (row: number, col: number) => {
    if (completed || !currentWord) return;
    setIsSelecting(true);
    setSelectionStart({ row, col });
    setSelected([[row, col]]);
  };

  const handleCellMouseEnter = (row: number, col: number) => {
    if (!isSelecting || !selectionStart) return;
    // Only allow straight line selection (horizontal or vertical)
    const { row: startRow, col: startCol } = selectionStart;
    let newSelected: number[][] = [];
    if (row === startRow) {
      // Horizontal
      const minCol = Math.min(col, startCol);
      const maxCol = Math.max(col, startCol);
      for (let c = minCol; c <= maxCol; c++) {
        newSelected.push([row, c]);
      }
    } else if (col === startCol) {
      // Vertical
      const minRow = Math.min(row, startRow);
      const maxRow = Math.max(row, startRow);
      for (let r = minRow; r <= maxRow; r++) {
        newSelected.push([r, col]);
      }
    }
    setSelected(newSelected);
  };

  const handleCellMouseUp = () => {
    if (!isSelecting || !currentWord) return;
    setIsSelecting(false);
    setSelectionStart(null);
    const selectedWord = selected.map(([r, c]) => grid[r][c]).join('');
    if (selectedWord.length === currentWord.word.length) {
      if (selectedWord === currentWord.word) {
        setCorrectStreak(cs => cs + 1);
        setIncorrectStreak(0);
        setCompleted(true);
        setShowConfetti(true);
        setScore(prev => (prev < 10 ? prev + 1 : prev));
        
        const updatedAnswers = [...lastTwoAnswers, '✅'].slice(-2);
        
      } else {
        setIncorrectStreak(is => is + 1);
        setCorrectStreak(0);
        setShowWrongMessage(true);
        
        const updatedAnswers = [...lastTwoAnswers, '❌'].slice(-2);
        
        
        setTimeout(() => {
          setSelected([]);
          setShowWrongMessage(false);
        }, 1000);
      }
    }
  };

  // --- Get word for current state ---
  const levelNum = Number(currentLevel) as 1 | 2 | 3;
  const wordListForLevel = wordLists?.[currentTheme]?.[levelNum] || [];
  const currentWord = wordListForLevel[wordIndex];
  const gridSize = currentWord ? Math.max(3, Math.min(6, currentWord.word.length)) : 4;

  // --- Generate grid whenever word changes ---
  useEffect(() => {
    if (!currentWord) return;
    setIsLoading(true);
    setGrid(generateGrid(gridSize, currentWord.word));
    setSelected([]);
    setCompleted(false);
    setShowConfetti(false);
    setShowWrongMessage(false);
    setIsLoading(false);
  }, [currentTheme, currentLevel, wordIndex, currentWord, gridSize]);

  // --- Next Level ---
  const handleNextLevel = async () => {
    // Only allow progress if a word list is loaded and the current puzzle is completed
    if (!wordLists /* || !completed */) { // Removed !completed check
      console.warn('Cannot go to next level: Word lists not loaded.'); // Adjusted log message
      return; // Prevent proceeding if data isn't ready
    }

    setShowConfetti(false);

    // The check for totalPuzzles and setShowThemeComplete is now handled within the adjusted difficulty/puzzle selection logic

    // The logic for finding and navigating to the next puzzle is now integrated into adjustDifficulty
    // Call the comprehensive puzzle adjustment and selection logic
    adjustDifficulty();
  };

  const stopCamera = () => {
    console.log('Trying to stop camera...');
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      if (tracks.length === 0) {
        console.log('No tracks found in stream.');
      } else {
        tracks.forEach((track) => {
          console.log(`Stopping track: ${track.kind}`);
          track.stop();
        });
      }
      streamRef.current = null;
    } else {
      console.log('No stream found in streamRef.');
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      //videoRef.current.load(); 
      console.log('Video source cleared.');
    } else {
      console.log('videoRef is null.');
    }
  };
  
  // Handle quit game
  const handleQuit = () => {
    const confirmQuit = window.confirm('Are you sure you want to quit the game?');
    if (confirmQuit) {
      stopCamera();
      setShowConfetti(false);
      setShowThemeComplete(true);
      
      // Clear game state
      sessionStorage.removeItem('gameScore');
      sessionStorage.removeItem('playedCount');
      sessionStorage.removeItem('playedPuzzles');
    }
  };
  const handleHomeClick = () => {
    stopCamera();
    setShowConfetti(false);
    
    // Clear game state
    sessionStorage.removeItem('gameScore');
    sessionStorage.removeItem('playedCount');
    sessionStorage.removeItem('playedPuzzles');
    
    navigate('/');
  };

  // --- Render ---
  if (!wordLists) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 to-blue-100">
        <div className="text-center p-8 bg-white/90 rounded-2xl shadow-xl">
          <h2 className="text-2xl font-bold text-purple-600 mb-4">
            {modelStatus === 'error' ? 'Error Loading Game Data' : 'Loading Game Data...'}
          </h2>
          {modelStatus === 'error' ? (
            <div className="space-y-4">
              <p className="text-red-500">Failed to load word lists. Please try:</p>
              <ul className="text-left text-gray-600 list-disc list-inside">
                <li>Refreshing the page</li>
                <li>Checking your internet connection</li>
                <li>Contacting support if the problem persists</li>
              </ul>
            </div>
          ) : (
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          )}
        </div>
      </div>
    );
  }

  if (!isGameReady || !currentWord || !currentWord.image) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 to-blue-100">
        <div className="text-center p-8 bg-white/90 rounded-2xl shadow-xl">
          <h2 className="text-2xl font-bold text-purple-600 mb-4">
            Loading Game...
          </h2>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  // Use type assertion for modelStatus in all switch statements and comparisons
  const status = modelStatus as 'loading' | 'ready' | 'error';
  let statusColor = '';
  switch (status) {
    case 'ready':
      statusColor = 'text-green-600';
      break;
    case 'loading':
      statusColor = 'text-yellow-600';
      break;
    case 'error':
      statusColor = 'text-red-600';
      break;
  }
  let buttonClass = 'px-4 py-2 rounded-lg shadow transition-colors text-white z-50 ';
  switch (status) {
    case 'ready':
      buttonClass += 'bg-blue-500 hover:bg-blue-600 ';
      break;
    case 'loading':
      buttonClass += 'bg-gray-500 cursor-not-allowed ';
      break;
    case 'error':
      buttonClass += 'bg-red-500 ';
      break;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div
        className="relative flex-grow w-full overflow-hidden"
        style={
          showThemeComplete
            ? {
                backgroundImage: `url('/images/bg-8.jpg')`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                width: '100vw',
                height: '100vh',
                minHeight: '100vh',
                minWidth: '100vw',
                position: 'fixed',
                left: 0,
                top: 0,
                zIndex: 0,
              }
            : {
                backgroundImage: `url('/images/${currentTheme}.jpg')`,
                backgroundSize: '100vw 100vh',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                backgroundColor: 'lightblue',
                width: '100vw',
                height: '100vh',
                minHeight: '100vh',
                minWidth: '100vw',
                position: 'fixed',
                left: 0,
                top: 0,
                zIndex: 0,
              }
        }
      >
        {/* Subtle overlay for readability */}
        <div
          className="absolute inset-0 z-0 pointer-events-none overflow-hidden"
          style={{
            background: 'linear-gradient(120deg, rgba(255,255,255,0.10) 0%, rgba(161,140,209,0.08) 100%)',
            mixBlendMode: 'lighten',
          }}
        ></div>
        <video 
          ref={videoRef} 
          style={{ display: 'none' }} 
          playsInline 
          muted 
          autoPlay
          onLoadedMetadata={() => {
            console.log('Video metadata loaded');
            if (videoRef.current) {
              videoRef.current.play()
                .then(() => {
                  console.log('Video started playing after metadata load');
                  setIsVideoReady(true);
                })
                .catch(err => console.error('Error playing video after metadata load:', err));
            }
          }}
        />
        <canvas ref={canvasRef} style={{ display: 'none' }} />

        {!showThemeComplete && (
          <div
            className="absolute inset-0 z-0 pointer-events-none overflow-hidden"
            style={{
              backgroundImage: `url('/images/${currentTheme}.jpg')`,
              backgroundSize: 'auto 150vh',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              backgroundColor: 'lightblue',
            }}
          ></div>
        )}
        <div
          className={`relative z-10 flex flex-col items-center justify-center min-h-screen p-8 ${
            showThemeComplete ? 'bg-transparent' : ''
          }`}
          style={{ paddingTop: 120 }} // Add top padding to prevent overlap
        >
          {showConfetti && (
            <Confetti
              width={windowSize.width}
              height={windowSize.height}
              numberOfPieces={200}
              recycle={false}
              colors={['#FFD700', '#FF69B4', '#00FFFF']}
              onConfettiComplete={() => setShowConfetti(false)}
            />
          )}

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleHomeClick}
            className="absolute top-4 left-4 bg-white/80 p-3 rounded-full hover:bg-white"
          >
            <Home />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleQuit}
            className="absolute top-4 right-4 bg-red-500/80 p-3 rounded-full hover:bg-red-500 text-white"
          >
            <X />
          </motion.button>

          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className={`bg-white/90 p-10 rounded-3xl shadow-2xl max-w-4xl w-full flex flex-col md:flex-row gap-10 border-2 border-purple-200 ${
              showThemeComplete ? 'bg-white/80' : ''
            }`}
          >
            {!showThemeComplete && (
              <div className="flex-1 flex items-center justify-center">
                <motion.img
                  initial={{ y: -20 }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.5 }}
                  src={currentWord.image}
                  alt={currentWord.word}
                  className="w-full h-64 md:h-96 object-contain rounded-xl"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/images/default.jpg';
                  }}
                />
              </div>
            )}

            <div className="flex-1 flex flex-col items-center justify-center">
              {/* --- Instruction added here --- */}
              {!showThemeComplete && (
                <div className="mb-2 text-sm text-purple-700 font-semibold">
                  Drag across the letters to play!
                </div>
              )}
              <AnimatePresence>
                {showWrongMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="flex items-center justify-center gap-2 text-red-500 mb-4"
                  >
                    <AlertCircle />
                    <span>Oops! Try again!</span>
                  </motion.div>
                )}
              </AnimatePresence>
              {!showThemeComplete && (
                <>
                  <div
                    className="word-grid w-full"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: `repeat(${gridSize}, minmax(60px, 1fr))`,
                      gap: '12px',
                    }}
                  >
                    {grid.map((row, i) =>
                      row.map((cell, j) => (
                        <motion.button
                          key={`${i}-${j}`}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          animate={{
                            scale: selected.some(([r, c]) => r === i && c === j) ? 1.2 : 1,
                            backgroundColor: selected.some(([r, c]) => r === i && c === j)
                              ? '#30253E'
                              : '#EDE9FE',
                          }}
                          className="text-2xl font-bold w-16 h-16 rounded-lg flex items-center justify-center"
                          style={{
                            color: selected.some(([r, c]) => r === i && c === j) ? 'white' : '#4C1D95',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                          }}
                          onMouseDown={() => handleCellMouseDown(i, j)}
                          onMouseEnter={() => handleCellMouseEnter(i, j)}
                          onMouseUp={handleCellMouseUp}
                          disabled={completed}
                        >
                          {cell}
                        </motion.button>
                      ))
                    )}
                  </div>
                  
                  <motion.div className="mt-8 text-center">
                    {showWrongMessage && (
                      <h2 className="text-2xl font-bold text-red-500 mb-4">Try Again! ❌</h2>
                    )}
                    {completed && (
                      <h2 className="text-2xl font-bold text-green-600 mb-4">Great job! 🎉</h2>
                    )}
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleNextLevel}
                      className={`px-8 py-3 rounded-full transition-colors flex items-center gap-2 mx-auto text-lg font-bold shadow-md
                        ${completed ? 'bg-green-500 hover:bg-green-600' : 'bg-purple-500 hover:bg-purple-600'} text-white`}
                    >
                      Next <ArrowRight size={20} />
                    </motion.button>
                  </motion.div>
                </>
              )}

              {showThemeComplete && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                  style={{
                    background: "rgba(255,255,255,0.85)",
                    borderRadius: "2rem",
                    boxShadow: "0 4px 32px 0 rgba(0,0,0,.18)"
                  }}
                >
                  <motion.div
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ repeat: Infinity, duration: 1 }}
                    className="text-6xl mb-6 flex justify-center"
                  >
                    <Trophy className="text-yellow-500" size={80} />
                  </motion.div>
                  <h2 className="text-3xl font-bold text-purple-600 mb-4">
                    {playedCount >= totalPuzzles ? "Amazing! You've completed all levels! 🎉" : "Game Ended"}
                  </h2>
                  <p className="text-xl text-purple-500 mb-6">
                    {playedCount >= totalPuzzles ? "You're a word search champion!" : "Thanks for playing!"}
                    <br />
                    <span className="text-lg text-gray-700">
                      Score: {score} / {playedCount}
                    </span>
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleHomeClick}
                    className="bg-purple-500 text-white px-8 py-4 rounded-full hover:bg-purple-600 transition-colors flex items-center gap-3 mx-auto"
                  >
                    <Home size={24} />
                    Back to Home
                  </motion.button>
                </motion.div>
              )}
            </div>
          </motion.div>

          {/* Score and Puzzles Played Counter */}
          {!showThemeComplete && (
            <div className="fixed top-6 left-6 z-30 flex flex-col items-start bg-white/80 px-4 py-2 rounded-xl shadow-lg text-sm min-w-[120px] max-w-[180px]">
              <span className="font-bold text-purple-700">Puzzles Played: {playedCount} / {totalPuzzles}</span>
              <span className="font-bold text-green-700">Score: {score}</span>
            </div>
          )}
        </div>
      </div>
      {/* Removed: Made with Joyverse */}
      <Footer />
    </div>
  );
};

export default Game;