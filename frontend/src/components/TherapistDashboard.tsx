import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useToast } from './ToastContext';
import { PieChart, Pie, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// Types/interfaces
interface Session {
  sessionId: string;
  date: Date | string;
  assignedThemes: string[];
  themesChanged: string[];
  emotionsOfChild: string[];
  playedPuzzles: string[];
  typingResults?: { word: string; input: string; correct?: boolean; completedAt?: string }[];
  typingResultsMap?: Record<string, string>;
  preferredGame?: string | null;
}

interface Child {
  username: string;
  joinedAt: string;
  sessions?: Session[];
  assignedThemes?: string[];
  currentAssignedThemes?: string[];
}

// Add ThemeTransition type
type ThemeTransition = {
  type: 'start' | 'transition';
  theme?: string;
  from?: string;
  to?: string;
  emotion: string;
  isSameTheme?: boolean;
};

const TherapistDashboard: React.FC = () => {
  const [therapistUsername, setTherapistUsername] = useState('');
  const [therapistCode, setTherapistCode] = useState('');
  const [children, setChildren] = useState<Child[]>([]);
  const [newChildUsername, setNewChildUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedChild, setSelectedChild] = useState<Child | null>(null);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordChangeMessage, setPasswordChangeMessage] = useState('');
  const [deleteConfirmChild, setDeleteConfirmChild] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedGame, setSelectedGame] = useState<'typing' | 'puzzles'>('typing');
  const [childGameSelection, setChildGameSelection] = useState<Record<string, 'typing' | 'puzzles' | 'reading' | null>>({});
  const [showStoriesModal, setShowStoriesModal] = useState(false);
  const [showRecordingsModal, setShowRecordingsModal] = useState(false);
  const [stories, setStories] = useState<Array<{ _id: string; title: string; author?: string; story?: string; moral?: string }>>([]);
  const [recordings, setRecordings] = useState<Array<{ 
    sessionId: string; 
    date: string; 
    recordings: Array<{
      storyId: string;
      storyTitle: string;
      recordedAt: string;
      audioData: string;
    }>;
  }>>([]);
  const [storyLoading, setStoryLoading] = useState(false);
  const [recordingsLoading, setRecordingsLoading] = useState(false);
  const [previewStory, setPreviewStory] = useState<{ _id: string; title: string; author?: string; story?: string; moral?: string } | null>(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showTypingModal, setShowTypingModal] = useState(false);
  const [typingResultsLoading, setTypingResultsLoading] = useState(false);
  const [typingResultsData, setTypingResultsData] = useState<Array<{ sessionId: string; date: string; typingResultsMap?: Record<string,string> }>>([]);
  const [typingAnalytics, setTypingAnalytics] = useState<{
    username: string;
    overallStats: { totalWords: number; correctWords: number; overallAccuracy: number };
    sessionAnalyses: Array<{ sessionId: string; date: string | Date; analysis: {
      problematicLetters?: string[];
      confusionPatterns?: Array<{ confuses: string; with: string }>;
      strengths?: string[];
      overallAccuracy?: number;
      severity?: string;
      analyzedAt?: string | Date;
      totalWords?: number;
      correctWords?: number;
    } }>;
    hasData: boolean;
  } | null>(null);


  const navigate = useNavigate();
  const toast = (() => {
    try {
      // safe: attempt to use hook; if not inside provider this will throw
      return useToast();
    } catch (e) {
      return { showToast: (_: string) => {} } as any;
    }
  })();

  // Set background and get therapist data
  useEffect(() => {
    document.body.style.backgroundImage = "url('/images/bg-6.jpg')";
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundPosition = "center";
    document.body.style.backgroundRepeat = "no-repeat";
    document.body.style.backgroundAttachment = "fixed";
    document.body.style.margin = "0";
    document.body.style.padding = "0";
    document.body.style.minHeight = "100vh";

    const username = sessionStorage.getItem('therapistUsername');
    const code = sessionStorage.getItem('therapistCode');
    if (!username || !code) {
      navigate('/');
      return;
    }
    setTherapistUsername(username);
    setTherapistCode(code);
    fetchTherapistData(username);
  }, [navigate]);

  // Fetch therapist data
  const fetchTherapistData = async (username: string) => {
    try {
      const response = await fetch('http://localhost:5000/api/get-therapist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });

      const data = await response.json();
      if (response.ok) {
        setChildren(data.children || []);
        // initialize per-child game selection from sessionStorage if present
        const mapping: Record<string, 'typing' | 'puzzles' | null> = {};
        (data.children || []).forEach((c: any) => {
          const val = sessionStorage.getItem(`selectedGame_${c.username}`);
          mapping[c.username] = val === 'puzzles' ? 'puzzles' : val === 'typing' ? 'typing' : null;
        });
        setChildGameSelection(mapping);
        setError(null);
      } else {
        setError(data.message || 'Failed to fetch therapist data');
      }
    } catch (err) {
      setError('Server error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStories = async () => {
    setStoryLoading(true);
    try {
      const resp = await fetch('http://localhost:5000/api/stories');
      const data = await resp.json();
      if (resp.ok && data.success) setStories(data.stories || []);
      else setStories([]);
    } catch (err) {
      console.error('Failed to fetch stories', err);
      setStories([]);
    } finally {
      setStoryLoading(false);
    }
  };

  const fetchRecordings = async (childUsername: string) => {
    setRecordingsLoading(true);
    try {
      const resp = await fetch(`http://localhost:5000/api/get-reading-recordings?therapistCode=${encodeURIComponent(therapistCode)}&username=${encodeURIComponent(childUsername)}`);
      if (!resp.ok) {
        console.error('Failed to fetch recordings:', await resp.text());
        setRecordings([]);
        return;
      }
      const data = await resp.json();
      setRecordings(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch recordings', err);
      setRecordings([]);
    } finally {
      setRecordingsLoading(false);
    }
  };

  const savePreferredStory = async (childUsername: string, storyId: string) => {
    try {
      await fetch('http://localhost:5000/api/set-preferred-story', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ therapistCode, username: childUsername, storyId })
      });
      // refresh data so UI shows saved story
      await fetchTherapistData(therapistUsername);
      // Update local game selection state
      setChildGameSelection(prev => ({
        ...prev,
        [childUsername]: 'reading'
      }));
      // Store in session for immediate UI update
      sessionStorage.setItem(`selectedGame_${childUsername}`, 'reading');
      setShowStoriesModal(false);
      toast.showToast(`Saved story for ${childUsername}`);
    } catch (err) {
      console.error('Failed to save preferred story', err);
    }
  };  // Add child
  const handleAddChild = async () => {
    if (!newChildUsername.trim()) {
      setError('Enter a child username');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/add-child', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          therapistCode: therapistCode,
          childName: newChildUsername
        }),
      });

      const data = await response.json();

      if (response.ok) {
        await fetchTherapistData(therapistUsername);
        setNewChildUsername('');
        setError(null);
      } else {
        setError(data.message || 'Failed to add child');
      }
    } catch (err) {
      setError('Network error');
      console.error('Error adding child:', err);
    }
  };

  // Delete child
  const handleDeleteChild = async (childUsername: string) => {
    if (!deleteConfirmChild) {
      setDeleteConfirmChild(childUsername);
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch('http://localhost:5000/api/delete-child', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          therapistCode: therapistCode,
          childName: childUsername
        }),
      });

      const data = await response.json();

      if (response.ok) {
        await fetchTherapistData(therapistUsername);
        setDeleteConfirmChild(null);
        setError(null);
        if (selectedChild?.username === childUsername) {
          setSelectedChild(null);
        }
      } else {
        setError(data.message || 'Failed to delete child');
      }
    } catch (err) {
      setError('Network error');
      console.error('Error deleting child:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Prepare emotion data for chart
  const prepareEmotionData = (session: Session) => {
    if (!session.emotionsOfChild || session.emotionsOfChild.length === 0) return [];
    const emotionCounts: {[key: string]: number} = {};
    session.emotionsOfChild.forEach(emotion => {
      const normalizedEmotion = emotion.toLowerCase();
      emotionCounts[normalizedEmotion] = (emotionCounts[normalizedEmotion] || 0) + 1;
    });
    return Object.entries(emotionCounts).map(([emotion, count]) => ({
      emotion,
      count
    }));
  };

  // Assign themes
  const handleAssignThemes = (childUsername: string) => {
    sessionStorage.setItem('selectedChild', childUsername);
    sessionStorage.setItem('selectedChildTherapistCode', therapistCode);
    // pass selected game for this child to theme assignment so that UI can adapt
    const selectedForChild = childGameSelection[childUsername] || null;
    if (selectedForChild) {
      sessionStorage.setItem('selectedGame', selectedForChild);
      sessionStorage.setItem('selectedGame_for', childUsername);
    } else {
      // if nothing selected, clear any previous child-specific selection
      sessionStorage.removeItem('selectedGame');
      sessionStorage.removeItem('selectedGame_for');
    }
    navigate('/theme-assignment');
  };

  // Logout
  const handleLogout = () => {
    sessionStorage.clear();
    navigate('/');
  };

  // Child click
  const handleChildClick = (child: Child) => {
    setSelectedChild(selectedChild?.username === child.username ? null : child);
  };

  // Get emotion color
  const getEmotionColor = (emotion: string | undefined | null): string => {
    if (!emotion) return '#9E9E9E'; // Handle undefined/null
    const emotionColors: { [key: string]: string } = {
      happiness: '#4CAF50',
      sad: '#5C6BC0',
      anger: '#FF0000',
      fear: '#FF9800',
      neutral: '#9E9E9E',
      surprised: '#8E24AA',
      excited: '#FFD600',
      calm: '#03A9F4',
      unknown: '#9E9E9E',
    };
    const normalizedEmotion = emotion.trim().toLowerCase();
    if (emotionColors[normalizedEmotion]) {
      return emotionColors[normalizedEmotion];
    }
    const matchingKey = Object.keys(emotionColors).find(key => 
      normalizedEmotion.includes(key)
    );
    return matchingKey ? emotionColors[matchingKey] : emotionColors.unknown;
  };

  // Process theme transitions for display
  const processThemeTransitions = (session: Session): ThemeTransition[] => {
    if (!session.assignedThemes || session.assignedThemes.length === 0) {
      return [];
    }
    const firstTheme = session.assignedThemes[0];
    const results: ThemeTransition[] = [{
      type: 'start',
      theme: firstTheme,
      emotion: session.emotionsOfChild?.[0] || 'unknown'
    } as ThemeTransition];

    if (session.themesChanged && session.themesChanged.length > 0) {
      let currentTheme = firstTheme;
      for (let i = 0; i < session.themesChanged.length; i++) {
        const nextTheme = session.themesChanged[i];
        const emotion = i + 1 < session.emotionsOfChild.length
          ? session.emotionsOfChild[i + 1]
          : 'unknown';
        results.push({
          type: 'transition',
          from: currentTheme,
          to: nextTheme,
          emotion: emotion,
          isSameTheme: currentTheme === nextTheme
        } as ThemeTransition);
        currentTheme = nextTheme;
      }
    }
    return results;
  };

  // Format date for display
  const formatSessionDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Toggle session expand/collapse
  const toggleSession = (sessionId: string) => {
    setExpandedSessionId((prev) => (prev === sessionId ? null : sessionId));
  };

  // Fetch typing analytics (overall + per-session) from backend
  const fetchTypingResults = async (childUsername: string) => {
    setTypingResultsLoading(true);
    setTypingAnalytics(null);
    try {
      const resp = await fetch(`http://localhost:5000/api/typing/child-analysis?therapistCode=${encodeURIComponent(therapistCode)}&username=${encodeURIComponent(childUsername)}`);
      const data = await resp.json();
      if (resp.ok && data.success) {
        setTypingAnalytics(data);
      } else {
        setTypingAnalytics({ username: childUsername, overallStats: { totalWords: 0, correctWords: 0, overallAccuracy: 0 }, sessionAnalyses: [], hasData: false });
      }
      setShowTypingModal(true);
    } catch (err) {
      console.error('Failed to fetch typing analytics', err);
      setTypingAnalytics({ username: childUsername, overallStats: { totalWords: 0, correctWords: 0, overallAccuracy: 0 }, sessionAnalyses: [], hasData: false });
      setShowTypingModal(true);
    } finally {
      setTypingResultsLoading(false);
    }
  };

  // Filter children by search query
  const filteredChildren = children.filter((child) =>
    child.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Change password
  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) {
      setPasswordChangeMessage('Please fill in all fields');
      return;
    }
    try {
      const response = await fetch('http://localhost:5000/api/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: therapistUsername,
          currentPassword,
          newPassword,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setPasswordChangeMessage('Password changed successfully');
        setCurrentPassword('');
        setNewPassword('');
      } else {
        setPasswordChangeMessage(data.message || 'Failed to change password');
      }
    } catch (err) {
      setPasswordChangeMessage('Server error');
    }
  };

  if (loading) return <LoadingContainer>Loading...</LoadingContainer>;
  if (error) return <ErrorContainer>Error: {error}</ErrorContainer>;

  return (
    <Container>
      <Header>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Title>THERAPIST DASHBOARD</Title>
          <div style={{ display: 'flex', gap: 8 }}>
            <GameButton
              active={selectedGame === 'typing'}
              onClick={() => setSelectedGame('typing')}
              aria-pressed={selectedGame === 'typing'}
            >
              Typing Game
            </GameButton>
            <GameButton
              active={selectedGame === 'puzzles'}
              onClick={() => setSelectedGame('puzzles')}
              aria-pressed={selectedGame === 'puzzles'}
            >
              Puzzles Game
            </GameButton>
          </div>
        </div>
        <HeaderActions>
          <ChangePasswordButton onClick={() => setShowChangePassword(true)}>
            Change Password
          </ChangePasswordButton>
          <LogoutButton onClick={handleLogout}>Logout</LogoutButton>
        </HeaderActions>
      </Header>

      {/* Change Password Popup Modal */}
      {showChangePassword && (
        <ChangePasswordModalOverlay>
          <ChangePasswordModal>
            <ModalCloseButton onClick={() => setShowChangePassword(false)}>×</ModalCloseButton>
            <SectionHeader>
              <h2>Change Password</h2>
            </SectionHeader>
            <InputGroup>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Current Password"
              />
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New Password"
              />
              <Button onClick={handleChangePassword}>Change Password</Button>
            </InputGroup>
            {passwordChangeMessage && <ErrorMessage>{passwordChangeMessage}</ErrorMessage>}
          </ChangePasswordModal>
        </ChangePasswordModalOverlay>
      )}

      <InfoSection>
        <InfoCard>
          <h3>Your Therapist Code</h3>
          <CodeDisplay>{therapistCode}</CodeDisplay>
          <small>Share this code with your children to let them join</small>
        </InfoCard>
      </InfoSection>

      <Section>
        <SectionHeader>
          <h2>Your Children</h2>
          <SearchInput
            type="text"
            placeholder="Search for a child..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </SectionHeader>

        <AddChildSection>
          <InputGroup>
            <Input
              type="text"
              value={newChildUsername}
              onChange={(e) => setNewChildUsername(e.target.value)}
              placeholder="Enter child username"
            />
            <Button onClick={handleAddChild}>Add Child</Button>
          </InputGroup>
          {error && <ErrorMessage>{error}</ErrorMessage>}
        </AddChildSection>

        {filteredChildren.length === 0 ? (
          <EmptyState>No children found</EmptyState>
        ) : (
          <ChildrenGrid>
            {filteredChildren.map((child) => (
              <React.Fragment key={child.username}>
                <ChildCard 
                  onClick={() => handleChildClick(child)} 
                  isSelected={selectedChild?.username === child.username}
                >
                  <ChildCardHeader>
                    <h3>{child.username}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <SessionsCount>{child.sessions?.length || 0} Sessions</SessionsCount>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <SmallGameButton
                          active={childGameSelection[child.username] === 'typing'}
                          onClick={(e) => {
                            e.stopPropagation();
                            const mapping = { ...childGameSelection, [child.username]: 'typing' } as Record<string, 'typing' | 'puzzles' | null>;
                            setChildGameSelection(mapping);
                            // don't persist yet; wait for Save
                            sessionStorage.setItem(`selectedGame_${child.username}`, 'typing');
                          }}
                        >
                          Typing
                        </SmallGameButton>
                        <SmallGameButton
                          active={childGameSelection[child.username] === 'puzzles'}
                          onClick={(e) => {
                            e.stopPropagation();
                            const mapping = { ...childGameSelection, [child.username]: 'puzzles' } as Record<string, 'typing' | 'puzzles' | 'reading' | null>;
                            setChildGameSelection(mapping);
                            // don't persist yet; wait for Save
                            sessionStorage.setItem(`selectedGame_${child.username}`, 'puzzles');
                          }}
                        >
                          Puzzles
                        </SmallGameButton>
                        <SmallGameButton
                          active={childGameSelection[child.username] === 'reading'}
                          onClick={async (e) => {
                            e.stopPropagation();
                            const mapping = { ...childGameSelection, [child.username]: 'reading' } as Record<string, 'typing' | 'puzzles' | 'reading' | null>;
                            setChildGameSelection(mapping);
                            sessionStorage.setItem(`selectedGame_${child.username}`, 'reading');
                            // set selected child and fetch stories using helper
                            setSelectedChild(child);
                            setShowStoriesModal(true);
                            fetchStories();
                          }}
                        >
                          Reading
                        </SmallGameButton>
                      </div>
                    </div>
                    <RightControls>
                      <SaveChoiceButton
                        disabled={!childGameSelection[child.username]}
                        onClick={async (e) => {
                          e.stopPropagation();
                          const choice = childGameSelection[child.username];
                          try {
                            await fetch('http://localhost:5000/api/set-preferred-game', {
                              method: 'POST', headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ therapistCode: therapistCode, username: child.username, preferredGame: choice })
                            });
                            // For typing: only persist to backend. Child will see the game when they login.
                            if (choice === 'puzzles') {
                              // persist locally for immediate puzzles flow
                              sessionStorage.setItem('selectedGame', choice);
                              sessionStorage.setItem('selectedGame_for', child.username);
                              sessionStorage.setItem('selectedChild', child.username);
                              sessionStorage.setItem('selectedChildTherapistCode', therapistCode);
                              navigate('/theme-assignment');
                            }
                            // If typing selected, do not navigate or set sessionStorage here.
                          } catch (err) {
                            console.error('Failed to save preferred game', err);
                          }
                        }}
                      >
                        Save
                      </SaveChoiceButton>
                      <DeleteButton
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteChild(child.username);
                        }}
                        title="Delete child"
                        aria-label="Delete child"
                      >
                        ×
                      </DeleteButton>
                    </RightControls>
                  </ChildCardHeader>
                  <ChildCardContent>
                    <p>Joined: {new Date(child.joinedAt).toLocaleDateString()}</p>
                    <ThemesWrapper>
                      <p>Assigned Themes: </p>
                      <ThemesList>
                        {(child.currentAssignedThemes?.length || child.assignedThemes?.length) ? 
                          (child.currentAssignedThemes || child.assignedThemes)?.map((theme, idx) => (
                            <ThemeTag key={idx}>{theme}</ThemeTag>
                          ))
                          : <ThemeTag empty>None</ThemeTag>
                        }
                      </ThemesList>
                    </ThemesWrapper>
                  </ChildCardContent>
                  {/* Show action buttons only if this child's selected game is puzzles */}
                  {childGameSelection[child.username] === 'puzzles' ? (
                    <>
                      <ActionButton
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAssignThemes(child.username);
                        }}
                      >
                        Assign Themes & Puzzles
                      </ActionButton>
                      <ActionButton
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate('/all-sessions-emotions', {
                            state: {
                              allSessions: child.sessions || [],
                            },
                          });
                        }}
                        style={{ marginTop: '10px' }}
                      >
                        View All Sessions Emotions
                      </ActionButton>
                    </>
                  ) : childGameSelection[child.username] === 'reading' ? (
                    <>
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <ActionButton
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedChild(child);
                            setShowStoriesModal(true);
                            fetchStories();
                          }}
                        >
                          Select Story
                        </ActionButton>
                        <ActionButton
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedChild(child);
                            setShowRecordingsModal(true);
                            fetchRecordings(child.username);
                          }}
                          style={{ backgroundColor: '#4a67cc' }}
                        >
                          Session Recordings
                        </ActionButton>
                      </div>
                    </>
                  ) : childGameSelection[child.username] === 'typing' ? (
                    <>
                      <ActionButton
                        onClick={(e) => {
                          e.stopPropagation();
                          // Show typing results for typing-mode child
                          fetchTypingResults(child.username);
                        }}
                        style={{ backgroundColor: '#6c757d' }}
                      >
                        Show Typing Results
                      </ActionButton>
                    </>
                  ) : (
                    <div style={{ color: '#777', padding: '8px 0' }}>Select "Puzzles" or "Typing" for this child to enable actions</div>
                  )}
                </ChildCard>
  
                {selectedChild?.username === child.username && childGameSelection[child.username] === 'puzzles' && (
                  <SessionsContainer>
                    <SessionsContainerHeader>
                      <h4>Sessions History</h4>
                      <SessionsCount>Total: {child.sessions?.length || 0}</SessionsCount>
                    </SessionsContainerHeader>
                    
                    {!child.sessions || child.sessions.length === 0 ? (
                      <EmptySessionsState>
                        <NoSessionsIcon>📊</NoSessionsIcon>
                        <p>No sessions recorded yet</p>
                      </EmptySessionsState>
                    ) : (
                      <SessionsList>
                        {child.sessions.map((session: Session) => {
                          const isExpanded = expandedSessionId === session.sessionId;
                          const themeTransitions = processThemeTransitions(session);
                          return (
                            <SessionCard key={session.sessionId}>
                              <SessionHeader>
                                <SessionDate>
                                  <CalendarIcon>📅</CalendarIcon>
                                  {formatSessionDate(session.date)}
                                </SessionDate>
                                <SessionStats>
                                  <StatBadge>
                                    <StatIcon>🧩</StatIcon>
                                    {session.playedPuzzles?.length || 0} Puzzles
                                  </StatBadge>
                                  <StatBadge>
                                    <StatIcon>🎭</StatIcon>
                                    {themeTransitions.length} Transitions
                                  </StatBadge>
                                </SessionStats>
                                <ToggleArrow onClick={() => toggleSession(session.sessionId)}>
                                  {isExpanded ? '▲' : '▼'}
                                </ToggleArrow>
                              </SessionHeader>
                              
                              {isExpanded && (
                                <SessionBody>
                                  <SessionSection>
                                    <SectionTitle>Themes</SectionTitle>
                                    <ThemeWrapper>
                                      {session.assignedThemes?.map((theme, idx) => (
                                        <ThemeTag key={idx}>{theme}</ThemeTag>
                                      )) || <p>None</p>}
                                    </ThemeWrapper>
                                  </SessionSection>
  
                                  {themeTransitions.length > 0 && (
                                    <SessionSection>
                                      <SectionTitle>Theme Journey</SectionTitle>
                                      <ThemeJourneyTimeline>
                                        {themeTransitions.map((transition, index) => {
                                          const emotionColor = getEmotionColor(transition.emotion);
                                          if (transition.type === 'start') {
                                            return (
                                              <TimelineItem key={`start-${index}`} isFirst={true}>
                                                <TimelineConnector isFirst={true} />
                                                <TimelineBubble color={emotionColor}>
                                                  <EmotionIndicator color={emotionColor} />
                                                </TimelineBubble>
                                                <TimelineContent>
                                                  <TimelineTitle>Started with: {transition.theme}</TimelineTitle>
                                                  <TimelineDetail>Emotion: {transition.emotion}</TimelineDetail>
                                                </TimelineContent>
                                              </TimelineItem>
                                            );
                                          } else {
                                            return (
                                              <TimelineItem key={`transition-${index}`}>
                                                <TimelineConnector />
                                                <TimelineBubble color={emotionColor}>
                                                  <EmotionIndicator color={emotionColor} />
                                                </TimelineBubble>
                                                <TimelineContent>
                                                  <TimelineTitle>
                                                    {transition.from}{' '}
                                                    {transition.isSameTheme ? 
                                                      <StayedIndicator>(stayed)</StayedIndicator> : 
                                                      <TransitionArrow>→</TransitionArrow>
                                                    }{' '}
                                                    {!transition.isSameTheme && transition.to}
                                                  </TimelineTitle>
                                                  <TimelineDetail>Emotion: {transition.emotion}</TimelineDetail>
                                                </TimelineContent>
                                              </TimelineItem>
                                            );
                                          }
                                        })}
                                      </ThemeJourneyTimeline>
                                    </SessionSection>
                                  )}

                                  <SessionSection>
                                    <SectionTitle>Emotion Summary</SectionTitle>
                                    <div style={{ 
                                      display: 'flex', 
                                      alignItems: 'center', 
                                      gap: '16px',
                                      justifyContent: 'center',
                                    }}>
                                      <div style={{ width: '60%', maxWidth: '300px' }}>
                                        <ResponsiveContainer width="100%" height={300}>
                                          <PieChart>
                                            <Pie
                                              data={prepareEmotionData(session)}
                                              cx="50%"
                                              cy="50%"
                                              labelLine={false}
                                              outerRadius={80}
                                              fill="#8884d8"
                                              dataKey="count"
                                              nameKey="emotion"
                                              label={false}
                                            >
                                              {prepareEmotionData(session).map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={getEmotionColor(entry.emotion)} />
                                              ))}
                                            </Pie>
                                            <Tooltip 
                                              formatter={(value: number, name: string) => [
                                                value, 
                                                `${name}: ${((value / session.emotionsOfChild.length) * 100).toFixed(1)}%`
                                              ]}
                                            />
                                          </PieChart>
                                        </ResponsiveContainer>
                                      </div>
                                      <div style={{ 
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '8px',
                                        paddingLeft: '16px',
                                      }}>
                                        {prepareEmotionData(session).map((entry, index) => (
                                          <div key={`legend-${index}`} style={{ 
                                            display: 'flex', 
                                            alignItems: 'center',
                                            fontSize: '14px',
                                          }}>
                                            <div style={{
                                              width: '12px',
                                              height: '12px',
                                              backgroundColor: getEmotionColor(entry.emotion),
                                              marginRight: '8px',
                                              borderRadius: '2px',
                                            }} />
                                            <span>
                                              {entry.emotion}: <strong>{((entry.count / session.emotionsOfChild.length) * 100).toFixed(0)}%</strong>
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </SessionSection>
  
                                    {selectedGame === 'puzzles' && (
                                      <>
                                        {session.playedPuzzles && session.playedPuzzles.length > 0 ? (
                                          <SessionSection>
                                            <SectionTitle>Puzzles Played</SectionTitle>
                                            <div>{session.playedPuzzles.length || 0}</div>
                                          </SessionSection>
                                        ) : (
                                          <SessionSection>
                                            <SectionTitle>Puzzles Played</SectionTitle>
                                            <div>No puzzles played in this session</div>
                                          </SessionSection>
                                        )}

                                        {/* Example puzzles analysis: show emotions mapped to each puzzle result */}
                                        <SessionSection>
                                          <SectionTitle>Puzzle Analysis</SectionTitle>
                                          {session.playedPuzzles && session.playedPuzzles.length > 0 ? (
                                            <PuzzleAnalysisList>
                                              {session.playedPuzzles.map((puzzle, idx) => (
                                                <PuzzleAnalysisItem key={idx}>
                                                  <strong>Puzzle:</strong> {puzzle}
                                                  <span style={{ marginLeft: 8, color: '#666' }}>Emotion: {session.emotionsOfChild?.[idx] || 'unknown'}</span>
                                                </PuzzleAnalysisItem>
                                              ))}
                                            </PuzzleAnalysisList>
                                          ) : (
                                            <div style={{ color: '#666' }}>No puzzle analysis available</div>
                                          )}
                                        </SessionSection>
                                      </>
                                    )}

                                  {session.preferredGame === 'typing' && (
                                    <>
                                      <SessionSection>
                                        <SectionTitle>Typing Results (Map)</SectionTitle>
                                        {session.typingResultsMap && Object.keys(session.typingResultsMap).length > 0 ? (
                                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                            {Object.entries(session.typingResultsMap).map(([orig, typed]) => (
                                              <div key={orig} style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <div><strong>{orig}</strong></div>
                                                <div style={{ color: '#666' }}>{typed}</div>
                                              </div>
                                            ))}
                                          </div>
                                        ) : (
                                          <div style={{ color: '#666' }}>No typing map available</div>
                                        )}
                                      </SessionSection>

                                      <SessionSection>
                                        <SectionTitle>Typing Results (List)</SectionTitle>
                                        {session.typingResults && session.typingResults.length > 0 ? (
                                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                            {session.typingResults.map((r, i) => (
                                              <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <div>{r.word}</div>
                                                <div style={{ color: r.correct ? 'green' : '#e74c3c' }}>{r.input}</div>
                                              </div>
                                            ))}
                                          </div>
                                        ) : (
                                          <div style={{ color: '#666' }}>No typing results recorded</div>
                                        )}
                                      </SessionSection>
                                    </>
                                  )}
                                </SessionBody>
                              )}
                            </SessionCard>
                          );
                        })}
                      </SessionsList>
                    )}
                  </SessionsContainer>
                )}
              </React.Fragment>
            ))}
          </ChildrenGrid>
        )}
      </Section>

      {deleteConfirmChild && (
        <ConfirmationOverlay>
          <ConfirmationModal>
            <ConfirmationHeader>
              <WarningIcon>⚠️</WarningIcon>
              <h3>Confirm Deletion</h3>
            </ConfirmationHeader>
            <ConfirmationContent>
              <p>Are you sure you want to delete <strong>{deleteConfirmChild}</strong>?</p>
              <p>This action will permanently remove the child and all their session data.</p>
            </ConfirmationContent>
            <ConfirmationActions>
              <CancelButton 
                onClick={() => setDeleteConfirmChild(null)}
                disabled={isDeleting}
              >
                Cancel
              </CancelButton>
              <ConfirmDeleteButton 
                onClick={() => handleDeleteChild(deleteConfirmChild)}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </ConfirmDeleteButton>
            </ConfirmationActions>
          </ConfirmationModal>
        </ConfirmationOverlay>
      )}

      {/* Recordings Modal */}
      {showRecordingsModal && (
        <TypingModalOverlay>
          <TypingModal>
            <ModalCloseButton onClick={() => setShowRecordingsModal(false)}>×</ModalCloseButton>
            <ModalTitle>Session Recordings for {selectedChild?.username}</ModalTitle>
            {recordingsLoading ? (
              <div>Loading recordings...</div>
            ) : recordings.length === 0 ? (
              <div style={{ color: '#666' }}>No recordings found.</div>
            ) : (
              <div style={{ maxHeight: 420, overflow: 'auto' }}>
                <TypingResultsList>
                  {recordings.map((session) => (
                    <TypingSessionItem key={session.sessionId}>
                      <SessionLabel>
                        Session from {new Date(session.date).toLocaleDateString()}
                      </SessionLabel>
                      <KVList>
                        {session.recordings.map((recording, index) => (
                          <div key={index} style={{ marginBottom: '10px', padding: '10px', border: '1px solid #eef2f7', borderRadius: '4px' }}>
                            <KVRow>
                              <KVKey>Story:</KVKey>
                              <KVVal>{recording.storyTitle}</KVVal>
                            </KVRow>
                            <KVRow>
                              <KVKey>Recorded:</KVKey>
                              <KVVal>{new Date(recording.recordedAt).toLocaleString()}</KVVal>
                            </KVRow>
                            <div style={{ marginTop: '10px' }}>
                              <audio controls style={{ width: '100%' }}>
                                <source src={`data:audio/wav;base64,${recording.audioData}`} type="audio/wav" />
                                Your browser does not support the audio element.
                              </audio>
                            </div>
                          </div>
                        ))}
                      </KVList>
                    </TypingSessionItem>
                  ))}
                </TypingResultsList>
              </div>
            )}
          </TypingModal>
        </TypingModalOverlay>
      )}

      {/* Stories modal */}
      {showStoriesModal && (
        <TypingModalOverlay>
          <TypingModal>
            <ModalCloseButton onClick={() => setShowStoriesModal(false)}>×</ModalCloseButton>
            <ModalTitle>Select a Story {selectedChild ? `for ${selectedChild.username}` : ''}</ModalTitle>
            {storyLoading ? (
              <div>Loading stories...</div>
            ) : (
              <div>
                {stories.length === 0 ? (
                  <div style={{ color: '#666' }}>No stories found</div>
                ) : (
                  <div style={{ display: 'flex', gap: 18 }}>
                    <div style={{ flex: 1, maxHeight: 420, overflow: 'auto' }}>
                      <TypingResultsList>
                        {stories.map(s => (
                          <TypingSessionItem key={s._id} onClick={() => setPreviewStory(s)} style={{ cursor: 'pointer' }}>
                            <SessionLabel>
                              {s.title}
                              <small style={{ color: '#888', marginLeft: 8 }}>
                                {s.author && s.author.toString().trim() && s.author.toString().trim().toLowerCase() !== 'unknown' ? `by ${s.author}` : ''}
                              </small>
                            </SessionLabel>
                            <KVList style={{ marginTop: 8 }}>
                              <div style={{ fontSize: '15px', color: '#333', marginBottom: 8 }}>
                                <strong>Story:</strong>
                                <div style={{ marginTop: 4, color: '#555' }}>
                                  {s.story ? (s.story.length > 200 ? s.story.slice(0, 200) + '...' : s.story) : 'No story available'}
                                </div>
                              </div>
                              <div style={{ fontSize: '15px', color: '#333' }}>
                                <strong>Moral:</strong>
                                <div style={{ marginTop: 4, color: '#555' }}>
                                  {s.moral || 'No moral available'}
                                </div>
                              </div>
                            </KVList>
                            <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                              <Button onClick={(e) => { e.stopPropagation(); savePreferredStory((selectedChild && selectedChild.username) || '', s._id); }} disabled={!selectedChild}>Save for {selectedChild ? selectedChild.username : 'selected child'}</Button>
                              <Button onClick={(e) => { e.stopPropagation(); navigator.clipboard?.writeText(s.story || ''); }}>Copy story</Button>
                              <Button onClick={(e) => { e.stopPropagation(); setPreviewStory(s); }}>Preview</Button>
                            </div>
                          </TypingSessionItem>
                        ))}
                      </TypingResultsList>
                    </div>

                    <div style={{ flex: 1, maxHeight: 420, overflow: 'auto', padding: 12, borderLeft: '1px solid #eee', background: '#fafcff', borderRadius: 8 }}>
                      {previewStory ? (
                        <div>
                          <h4 style={{ margin: '0 0 12px 0' }}>{previewStory.title}</h4>
                          {previewStory.author && previewStory.author.toString().trim() && previewStory.author.toString().trim().toLowerCase() !== 'unknown' ? (
                            <div style={{ color: '#888', marginBottom: 12 }}>by {previewStory.author}</div>
                          ) : null}
                          
                          <div style={{ marginBottom: 20 }}>
                            <h5 style={{ margin: '0 0 8px 0', color: '#444' }}>Story:</h5>
                            {previewStory.story ? (
                              <div style={{ lineHeight: 1.6, color: '#333' }}>{previewStory.story}</div>
                            ) : (
                              <div style={{ color: '#666' }}>No story available</div>
                            )}
                          </div>

                          <div>
                            <h5 style={{ margin: '0 0 8px 0', color: '#444' }}>Moral:</h5>
                            {previewStory.moral ? (
                              <div style={{ lineHeight: 1.6, color: '#333' }}>{previewStory.moral}</div>
                            ) : (
                              <div style={{ color: '#666' }}>No moral available</div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div style={{ color: '#666' }}>Select a story to see its full content here</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TypingModal>
        </TypingModalOverlay>
      )}

      {/* Recordings Modal */}
      {showRecordingsModal && (
        <TypingModalOverlay>
          <TypingModal>
            <ModalCloseButton onClick={() => setShowRecordingsModal(false)}>×</ModalCloseButton>
            <ModalTitle>Session Recordings for {selectedChild?.username}</ModalTitle>
            {recordings.length === 0 ? (
              <div style={{ color: '#666' }}>No recordings found.</div>
            ) : (
              <div style={{ maxHeight: '70vh', overflow: 'auto' }}>
                {recordings.map((session) => (
                  <TypingSessionItem key={session.sessionId} style={{ marginBottom: '20px' }}>
                    <SessionLabel>Session: {new Date(session.date).toLocaleDateString()}</SessionLabel>
                    <KVList>
                      {session.recordings.map((recording, index) => (
                        <TypingSessionItem key={index} style={{ marginBottom: '10px', background: '#fff' }}>
                          <KVRow>
                            <KVKey>Story:</KVKey>
                            <KVVal>{recording.storyTitle}</KVVal>
                          </KVRow>
                          <KVRow>
                            <KVKey>Recorded:</KVKey>
                            <KVVal>{new Date(recording.recordedAt).toLocaleString()}</KVVal>
                          </KVRow>
                          <div style={{ marginTop: '10px' }}>
                            <audio controls style={{ width: '100%' }}>
                              <source src={`data:audio/wav;base64,${recording.audioData}`} type="audio/wav" />
                              Your browser does not support the audio element.
                            </audio>
                          </div>
                        </TypingSessionItem>
                      ))}
                    </KVList>
                  </TypingSessionItem>
                ))}
              </div>
            )}
          </TypingModal>
        </TypingModalOverlay>
      )}

      {previewStory && (
        <TypingModalOverlay>
          <TypingModal>
            <ModalCloseButton onClick={() => setPreviewStory(null)}>×</ModalCloseButton>
            <ModalTitle>
              {previewStory.title}{' '}
              {previewStory.author && previewStory.author.toString().trim() && previewStory.author.toString().trim().toLowerCase() !== 'unknown' ? (
                <small style={{ color: '#888', marginLeft: 8 }}>by {previewStory.author}</small>
              ) : null}
            </ModalTitle>
            <div style={{ maxHeight: 420, overflow: 'auto', padding: 8 }}>
              <div style={{ marginBottom: 20 }}>
                <h5 style={{ margin: '0 0 8px 0', color: '#444' }}>Story:</h5>
                {previewStory.story ? (
                  <div style={{ lineHeight: 1.6, color: '#333' }}>{previewStory.story}</div>
                ) : (
                  <div style={{ color: '#666' }}>No story available</div>
                )}
              </div>

              <div>
                <h5 style={{ margin: '0 0 8px 0', color: '#444' }}>Moral:</h5>
                {previewStory.moral ? (
                  <div style={{ lineHeight: 1.6, color: '#333' }}>{previewStory.moral}</div>
                ) : (
                  <div style={{ color: '#666' }}>No moral available</div>
                )}
              </div>
            </div>
            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
              <Button onClick={() => { if (selectedChild) savePreferredStory(selectedChild.username, previewStory._id); }}>Save for {selectedChild ? selectedChild.username : 'selected child'}</Button>
              <Button onClick={() => setPreviewStory(null)}>Close</Button>
            </div>
          </TypingModal>
        </TypingModalOverlay>
      )}

      {/* Typing Results Modal */}
      {/* Reading Recordings Modal */}
      {showRecordingsModal && (
        <TypingModalOverlay>
          <TypingModal>
            <ModalCloseButton onClick={() => setShowRecordingsModal(false)}>×</ModalCloseButton>
            <ModalTitle>Reading Recordings for {selectedChild?.username}</ModalTitle>
            {recordingsLoading ? (
              <div>Loading recordings...</div>
            ) : (
              <div style={{ maxHeight: '70vh', overflow: 'auto' }}>
                {recordings.length === 0 ? (
                  <div style={{ color: '#666' }}>No recordings found</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {recordings.map(session => (
                      <div key={session.sessionId} style={{ 
                        background: '#f8f9fa', 
                        padding: '15px', 
                        borderRadius: '8px',
                        border: '1px solid #e9ecef' 
                      }}>
                        <h4 style={{ marginBottom: '10px' }}>
                          Session: {new Date(session.date).toLocaleDateString()} {new Date(session.date).toLocaleTimeString()}
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {session.recordings.map((recording, idx) => (
                            <div key={idx} style={{ 
                              background: 'white', 
                              padding: '10px', 
                              borderRadius: '6px',
                              border: '1px solid #dee2e6'
                            }}>
                              <div style={{ marginBottom: '8px' }}>
                                <strong>Story:</strong> {recording.storyTitle}
                                <br />
                                <small style={{ color: '#666' }}>
                                  Recorded: {new Date(recording.recordedAt).toLocaleString()}
                                </small>
                              </div>
                              <audio 
                                controls 
                                src={`data:audio/webm;base64,${recording.audioData}`}
                                style={{ width: '100%' }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </TypingModal>
        </TypingModalOverlay>
      )}

      {showTypingModal && (
        <TypingModalOverlay>
          <TypingModal>
            <ModalCloseButton onClick={() => setShowTypingModal(false)}>×</ModalCloseButton>
            <ModalTitle>Typing Analysis</ModalTitle>
            {typingResultsLoading ? (
              <div>Loading...</div>
            ) : !typingAnalytics || !typingAnalytics.hasData ? (
              <div style={{ color: '#666' }}>No typing results available for this child.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <InfoCardsRow>
                  <InfoStatCard>
                    <h4>Total Words</h4>
                    <strong>{typingAnalytics.overallStats.totalWords}</strong>
                  </InfoStatCard>
                  <InfoStatCard>
                    <h4>Correct Words</h4>
                    <strong style={{ color: '#2e7d32' }}>{typingAnalytics.overallStats.correctWords}</strong>
                  </InfoStatCard>
                  <InfoStatCard>
                    <h4>Accuracy</h4>
                    <strong style={{ color: typingAnalytics.overallStats.overallAccuracy >= 80 ? '#2e7d32' : typingAnalytics.overallStats.overallAccuracy >= 60 ? '#f57c00' : '#c62828' }}>{typingAnalytics.overallStats.overallAccuracy}%</strong>
                  </InfoStatCard>
                </InfoCardsRow>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <InfoPanel>
                    <h4>Problematic Letters</h4>
                    {typingAnalytics.sessionAnalyses && typingAnalytics.sessionAnalyses.length > 0 ? (
                      <TagList>
                        {Array.from(new Set(typingAnalytics.sessionAnalyses.flatMap(s => s.analysis.problematicLetters || []))).slice(0, 12).map((l, i) => (
                          <Tag key={i}>{l}</Tag>
                        ))}
                      </TagList>
                    ) : (
                      <EmptyMuted>No data</EmptyMuted>
                    )}
                  </InfoPanel>

                  <InfoPanel>
                    <h4>Strengths</h4>
                    {typingAnalytics.sessionAnalyses && typingAnalytics.sessionAnalyses.length > 0 ? (
                      <TagList>
                        {Array.from(new Set(typingAnalytics.sessionAnalyses.flatMap(s => s.analysis.strengths || []))).slice(0, 12).map((l, i) => (
                          <Tag key={i} style={{ background: '#e8f5e9', color: '#2e7d32' }}>{l}</Tag>
                        ))}
                      </TagList>
                    ) : (
                      <EmptyMuted>No data</EmptyMuted>
                    )}
                  </InfoPanel>
                </div>

                <InfoPanel>
                  <h4>Common Confusions</h4>
                  {typingAnalytics.sessionAnalyses && typingAnalytics.sessionAnalyses.length > 0 ? (
                    <TagList>
                      {Array.from(new Set(typingAnalytics.sessionAnalyses.flatMap(s => (s.analysis.confusionPatterns || []).map(p => `${p.confuses}↔${p.with}`)))).slice(0, 12).map((p, i) => (
                        <Tag key={i} style={{ background: '#fff8e1', color: '#ef6c00' }}>{p}</Tag>
                      ))}
                    </TagList>
                  ) : (
                    <EmptyMuted>No data</EmptyMuted>
                  )}
                </InfoPanel>

                {/* Recommendations removed per request */}

                <div>
                  <h4 style={{ marginBottom: 8 }}>Sessions</h4>
                  <TypingResultsList>
                    {typingAnalytics.sessionAnalyses.map(sa => (
                      <TypingSessionItem key={sa.sessionId}>
                        <SessionLabel>{formatSessionDate(sa.date)}</SessionLabel>
                        <KVList>
                          <KVRow>
                            <KVKey>Accuracy</KVKey>
                            <KVVal>{(sa.analysis.overallAccuracy ?? 0)}%</KVVal>
                          </KVRow>
                          <KVRow>
                            <KVKey>Severity</KVKey>
                            <KVVal>{sa.analysis.severity || 'mild'}</KVVal>
                          </KVRow>
                        </KVList>
                        {(sa.analysis.problematicLetters && sa.analysis.problematicLetters.length > 0) && (
                          <div style={{ marginTop: 8 }}>
                            <small style={{ color: '#666' }}>Problem letters:</small>
                            <TagList>
                              {sa.analysis.problematicLetters.slice(0, 10).map((l, i) => <Tag key={i}>{l}</Tag>)}
                            </TagList>
                          </div>
                        )}
                      </TypingSessionItem>
                    ))}
                  </TypingResultsList>
                </div>
              </div>
            )}
          </TypingModal>
        </TypingModalOverlay>
      )}
    </Container>
  );
};

// Styled Components
const Container = styled.div`
  padding: 20px; 
  max-width: 1200px; 
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  margin-bottom: 30px;
`;

const Title = styled.h1`
  color: #333; 
  margin: 0;
  font-weight: 800;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
`;

const LogoutButton = styled.button`
  padding: 8px 16px; 
  background-color: #ff4444; 
  color: white;
  border: none; 
  border-radius: 4px; 
  cursor: pointer;
  transition: all 0.2s ease;
  &:hover { 
    background-color: #cc0000; 
    transform: translateY(-2px);
  }
`;

const InfoSection = styled.div`
  margin-bottom: 30px;
`;

const InfoCard = styled.div`
  background-color: rgba(255, 255, 255, 0.9);
  padding: 20px; 
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  backdrop-filter: blur(10px);
`;

const CodeDisplay = styled.div`
  font-size: 28px; 
  font-weight: bold; 
  color: #5a7af0; 
  margin: 15px 0;
  letter-spacing: 1px;
`;

const Section = styled.div`
  margin-bottom: 30px;
`;

const SectionHeader = styled.div`
  display: flex; 
  justify-content: space-between; 
  align-items: center;
  margin-bottom: 20px;
  h2 {
    font-weight: 800;
    text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8);
  }
`;

const AddChildSection = styled.div`
  margin-bottom: 25px;
`;

const InputGroup = styled.div`
  display: flex; 
  gap: 10px; 
  margin-bottom: 10px;
`;

const Input = styled.input`
  padding: 12px 15px; 
  border: 1px solid #ddd; 
  border-radius: 8px; 
  flex: 1;
  font-size: 16px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #5a7af0;
    box-shadow: 0 0 0 2px rgba(90, 122, 240, 0.2);
  }
`;

const Button = styled.button`
  padding: 12px 20px; 
  background-color: #5a7af0;
  color: white; 
  border: none; 
  border-radius: 8px; 
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;
  
  &:hover { 
    background-color: #4a67cc; 
    transform: translateY(-2px);
    box-shadow: 0 4px 10px rgba(90, 122, 240, 0.3);
  }
`;

const ErrorMessage = styled.div`
  color: #e74c3c; 
  background: #fdeaea; 
  padding: 0.8rem;
  border-radius: 8px; 
  text-align: center;
  border-left: 4px solid #e74c3c;
`;

const EmptyState = styled.div`
  text-align: center; 
  padding: 40px; 
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 12px; 
  color: #666;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
`;

const ChildrenGrid = styled.div`
  display: grid; 
  /* increase min card width so header controls can fit */
  grid-template-columns: repeat(auto-fill, minmax(420px, 1fr));
  gap: 30px;
  align-items: start;
`;

const ChildCard = styled.div<{ isSelected?: boolean }>`
  background: linear-gradient(180deg, rgba(255,255,255,0.98), rgba(250,252,255,0.98));
  padding: 30px 30px 34px 30px;
  border-radius: 18px;
  box-shadow: ${props => props.isSelected ? '0 20px 48px rgba(51,72,200,0.12)' : '0 10px 28px rgba(18, 38, 63, 0.06)'};
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
  border: 1px solid rgba(34,41,47,0.04);
  position: relative;
  min-height: 260px;

  &:hover {
    transform: translateY(-6px);
    box-shadow: 0 18px 40px rgba(17, 24, 39, 0.08);
  }
`;

const ChildCardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(34,41,47,0.04);
  /* leave space on the right for floating controls */
  /* leave more space on the right for floating controls */
  padding-right: 240px;

  h3 {
    margin: 0;
    color: #16202a;
    font-weight: 800;
    font-size: 18px;
    letter-spacing: -0.2px;
  }
`;

const RightControls = styled.div`
  position: absolute;
  top: 16px;
  right: 16px;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const SessionsCount = styled.span`
  background-color: #edf4ff;
  color: #2f5bd6;
  padding: 6px 9px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  box-shadow: 0 2px 6px rgba(47,91,214,0.08);
`;

const DeleteButton = styled.button`
  background: linear-gradient(135deg, #ff6b6b, #ee5a52);
  border: none;
  cursor: pointer;
  padding: 0;
  border-radius: 8px;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
  color: white;
  font-size: 18px;
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 18px rgba(238, 90, 82, 0.22);
  }
`;

const ChildCardContent = styled.div`
  margin: 12px 0 8px 0;

  p {
    margin: 6px 0;
    color: #4b5563;
    font-size: 13px;
  }
`;

const ThemesWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  
  p {
    margin: 0;
    font-weight: 600;
    color: #555;
  }
`;

const ThemesList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const ThemeTag = styled.span<{ empty?: boolean }>`
  background-color: ${props => props.empty ? '#ffffff' : '#eef6ff'};
  color: ${props => props.empty ? '#9aa2ad' : '#2f5bd6'};
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
  border: ${props => props.empty ? '1px dashed #e6edf6' : 'none'};
  box-shadow: ${props => props.empty ? 'none' : '0 2px 6px rgba(47,91,214,0.06)'};
`;

const ActionButton = styled.button`
  width: 100%;
  padding: 14px 18px;
  background-color: #6b7280;
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 800;
  font-size: 16px;
  transition: transform 0.12s ease, box-shadow 0.12s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 22px rgba(2,6,23,0.08);
  }
`;

const SessionsContainer = styled.div`
  grid-column: 1 / -1;
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 12px;
  padding: 25px;
  margin-top: 20px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
  backdrop-filter: blur(10px);
`;

const SessionsContainerHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 15px;
  
  h4 {
    margin: 0;
    color: #2c3e50;
    font-weight: 700;
    font-size: 20px;
  }
`;

const EmptySessionsState = styled.div`
  text-align: center;
  padding: 40px;
  color: #999;
  
  p {
    margin: 10px 0 0 0;
    font-size: 16px;
  }
`;

const NoSessionsIcon = styled.div`
  font-size: 48px;
  margin-bottom: 10px;
`;

const SessionsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const SessionCard = styled.div`
  background-color: #fafbfc;
  border-radius: 10px;
  padding: 20px;
  border-left: 4px solid #5a7af0;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #f5f7fa;
    transform: translateX(2px);
  }
`;

const SessionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  cursor: pointer;
`;

const SessionDate = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #2c3e50;
  font-size: 16px;
`;

const CalendarIcon = styled.span`
  font-size: 16px;
`;

const SessionStats = styled.div`
  display: flex;
  gap: 12px;
`;

const StatBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  background-color: #e8f4fd;
  color: #5a7af0;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
`;

const StatIcon = styled.span`
  font-size: 14px;
`;

const ToggleArrow = styled.button`
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  color: #5a7af0;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #e8f4fd;
  }
`;

const SessionBody = styled.div`
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e0e0e0;
`;

const SessionSection = styled.div`
  margin-bottom: 25px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h5`
  margin: 0 0 15px 0;
  color: #2c3e50;
  font-weight: 700;
  font-size: 16px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const ThemeWrapper = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const ThemeJourneyTimeline = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const TimelineItem = styled.div<{ isFirst?: boolean }>`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  position: relative;
`;

const TimelineConnector = styled.div<{ isFirst?: boolean }>`
  width: 2px;
  height: 40px;
  background-color: ${props => props.isFirst ? 'transparent' : '#ddd'};
  position: absolute;
  left: 11px;
  top: -40px;
`;

const TimelineBubble = styled.div<{ color: string }>`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: ${props => props.color};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const EmotionIndicator = styled.div<{ color: string }>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: white;
  opacity: 0.9;
`;

const TimelineContent = styled.div`
  flex: 1;
  padding-top: 2px;
`;

const TimelineTitle = styled.div`
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 4px;
`;

const TimelineDetail = styled.div`
  font-size: 12px;
  color: #666;
`;

const StayedIndicator = styled.span`
  color: #666;
  font-style: italic;
  font-size: 14px;
`;

const TransitionArrow = styled.span`
  color: #5a7af0;
  font-weight: bold;
  margin: 0 4px;
`;

const SearchInput = styled.input`
  padding: 10px 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  width: 250px;
  font-size: 14px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #5a7af0;
    box-shadow: 0 0 0 2px rgba(90, 122, 240, 0.2);
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  font-size: 18px;
  color: #666;
`;

const ErrorContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  font-size: 18px;
  color: #e74c3c;
  background-color: #fdeaea;
  border-radius: 8px;
  padding: 20px;
  margin: 20px;
`;

const ConfirmationOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
`;

const ConfirmationModal = styled.div`
  background-color: white;
  border-radius: 12px;
  padding: 30px;
  max-width: 400px;
  width: 90%;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  animation: modalSlideIn 0.3s ease-out;
  
  @keyframes modalSlideIn {
    from {
      opacity: 0;
      transform: translateY(-50px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
`;

const ConfirmationHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  
  h3 {
    margin: 0;
    color: #2c3e50;
    font-weight: 700;
  }
`;

const WarningIcon = styled.span`
  font-size: 24px;
`;

const ConfirmationContent = styled.div`
  margin-bottom: 25px;
  
  p {
    margin: 10px 0;
    color: #555;
    line-height: 1.5;
    
    &:first-child {
      font-weight: 600;
    }
  }
`;

const ConfirmationActions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
`;

const CancelButton = styled.button`
  padding: 10px 20px;
  background-color: #f8f9fa;
  color: #666;
  border: 1px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background-color: #e9ecef;
    border-color: #adb5bd;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ConfirmDeleteButton = styled.button`
  padding: 10px 20px;
  background-color: #e74c3c;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background-color: #c0392b;
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
`;

const ChangePasswordButton = styled.button`
  background: #5a7af0;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 18px;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 0;
  margin-right: 0;
  transition: background 0.2s, transform 0.2s;
  &:hover {
    background: #4a67cc;
    transform: translateY(-2px);
  }
`;

const GameButton = styled.button<{ active?: boolean }>`
  padding: 8px 12px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-weight: 700;
  background: ${props => props.active ? '#3348c8' : 'transparent'};
  color: ${props => props.active ? 'white' : '#3348c8'};
  box-shadow: ${props => props.active ? '0 6px 18px rgba(51,72,200,0.18)' : 'none'};
  transition: all 0.15s ease;
  &:hover { transform: translateY(-2px); }
`;

const PuzzleAnalysisList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const PuzzleAnalysisItem = styled.div`
  background: #fff;
  border: 1px solid #eee;
  padding: 10px 12px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #333;
  font-size: 14px;
`;

const SmallGameButton = styled.button<{ active?: boolean }>`
  padding: 6px 12px;
  border-radius: 999px;
  border: ${props => props.active ? 'none' : '1px solid rgba(74,103,204,0.12)'};
  background: ${props => props.active ? '#3348c8' : 'transparent'};
  color: ${props => props.active ? 'white' : '#3348c8'};
  cursor: pointer;
  font-weight: 800;
  font-size: 13px;
  transition: transform 0.12s ease, box-shadow 0.12s ease;
  &:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(51,72,200,0.08); }
`;

const SaveChoiceButton = styled.button`
  margin-left: 8px;
  padding: 8px 12px;
  border-radius: 10px;
  background: linear-gradient(180deg,#28a745,#1f9a4a);
  color: white;
  border: none;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(34,197,94,0.12);
  transition: transform 0.12s ease, box-shadow 0.12s ease;
  &:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 12px 28px rgba(34,197,94,0.14); }
  &:disabled { opacity: 0.6; cursor: not-allowed; box-shadow: none; }
`;

// Popup modal overlay for change password
const ChangePasswordModalOverlay = styled.div`
  position: fixed;
  z-index: 3000;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.35);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ChangePasswordModal = styled.div`
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 8px 40px rgba(90, 122, 240, 0.18);
  padding: 36px 28px 28px 28px;
  min-width: 340px;
  max-width: 95vw;
  min-height: 220px;
  position: relative;
  animation: fadeInScale 0.25s;

  @keyframes fadeInScale {
    from {
      opacity: 0;
      transform: scale(0.96) translateY(30px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }
`;

const ModalCloseButton = styled.button`
  position: absolute;
  top: 14px;
  right: 18px;
  background: none;
  border: none;
  font-size: 2rem;
  color: #888;
  cursor: pointer;
  line-height: 1;
  padding: 0;
  transition: color 0.2s;
  &:hover {
    color: #e74c3c;
  }
`;

// Typing Results Modal styles
const TypingModalOverlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 4000;
`;

const TypingModal = styled.div`
  background: #fff;
  border-radius: 12px;
  padding: 22px;
  width: 640px;
  max-width: 95vw;
  max-height: 80vh;
  overflow: auto;
`;

const InfoCardsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
`;

const InfoStatCard = styled.div`
  background: #f8fafc;
  border: 1px solid #eef2f7;
  border-radius: 8px;
  padding: 12px;
  h4 { margin: 0 0 6px 0; color: #455a64; font-size: 13px; font-weight: 700; }
  strong { font-size: 20px; color: #2c3e50; }
`;

const InfoPanel = styled.div`
  background: #ffffff;
  border: 1px solid #eef2f7;
  border-radius: 8px;
  padding: 12px;
  h4 { margin: 0 0 8px 0; color: #2c3e50; font-size: 14px; font-weight: 800; }
`;

const TagList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const Tag = styled.span`
  background: #e3f2fd;
  color: #1565c0;
  border-radius: 999px;
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 700;
`;

const EmptyMuted = styled.div`
  color: #90a4ae;
  font-size: 13px;
`;

const ModalTitle = styled.h3`
  margin: 0 0 12px 0;
  color: #2c3e50;
`;

const TypingResultsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const TypingSessionItem = styled.div`
  border: 1px solid #eef2f7;
  padding: 12px;
  border-radius: 8px;
  background: #fbfdff;
`;

const SessionLabel = styled.div`
  font-weight: 700;
  color: #3348c8;
  margin-bottom: 8px;
`;

const KVList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const KVRow = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
`;

const KVKey = styled.div`
  font-weight: 700;
  color: #2c3e50;
`;

const KVVal = styled.div`
  color: #666;
  text-align: right;
  min-width: 120px;
`;

export default TherapistDashboard;