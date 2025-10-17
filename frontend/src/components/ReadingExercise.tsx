import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const ReadingExercise: React.FC = () => {
  const [story, setStory] = useState<{ _id: string; title: string; author?: string; story?: string; moral?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const childData = sessionStorage.getItem('childData');
    if (!childData) {
      navigate('/child-login');
      return;
    }
    const parsed = JSON.parse(childData);
    const preferredStory = parsed.preferredStory || null;
    if (!preferredStory) {
      setLoading(false);
      return;
    }
    // fetch story by id
    (async () => {
      try {
        const resp = await fetch(`http://localhost:5000/api/stories/${preferredStory}`);
        const data = await resp.json();
        if (resp.ok && data.success) setStory(data.story || null);
      } catch (err) {
        console.error('Failed to fetch story', err);
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Configure MediaRecorder for compressed audio
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 32000 // Lower bitrate for smaller file size
      });
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
      };
      // Record in smaller chunks
      mediaRecorderRef.current.start(1000); // Record in 1-second chunks
      setRecording(true);
    } catch (err) {
      console.error('Recording not allowed', err);
    }
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current) return;
    mediaRecorderRef.current.stop();
    setRecording(false);
  };

  const saveRecording = async () => {
    if (!audioChunksRef.current.length) return;
    // Combine chunks and create optimized blob
    const blob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
    
    // Compress audio data before sending
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = (reader.result as string).split(',')[1];
      const childData = JSON.parse(sessionStorage.getItem('childData') || '{}');
      try {
        const response = await fetch('http://localhost:5000/api/save-reading-audio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            therapistCode: childData.therapistCode,
            username: childData.username,
            sessionId: childData.sessionId,
            storyId: story?._id,
            audioData: base64,
          })
        });
        
        if (!response.ok) {
          console.error('Failed to save recording:', await response.text());
          return;
        }
        
        const result = await response.json();
        if (result.success) {
          // on success navigate back to landing
          navigate('/landing');
        } else {
          console.error('Failed to save recording:', result.error);
        }
      } catch (err) {
        console.error('Failed to save recording', err);
      }
    };
    reader.readAsDataURL(blob);
  };

  if (loading) return <Container>Loading...</Container>;

  return (
    <Container>
      <Card>
        <h2>{story?.title || 'No Story Selected'}</h2>
        <p style={{ color: '#666' }}>{story?.author ? `by ${story.author}` : ''}</p>

        <ContentSection>
          <h3>Story:</h3>
          <ContentBox>
            {story?.story || 'No story available.'}
          </ContentBox>
        </ContentSection>

        <ContentSection>
          <h3>Moral:</h3>
          <ContentBox style={{ background: '#f3f6ff' }}>
            {story?.moral || 'No moral available.'}
          </ContentBox>
        </ContentSection>

        <Controls>
          {!recording && <ActionButton onClick={startRecording}>Start Recording</ActionButton>}
          {recording && <ActionButton onClick={stopRecording}>Stop Recording</ActionButton>}
          {audioUrl && <ActionButton onClick={saveRecording}>Save Recording</ActionButton>}
          <CancelButton onClick={() => navigate('/landing')}>Cancel</CancelButton>
        </Controls>
      </Card>
    </Container>
  );
};

const Container = styled.div`
  display:flex; align-items:center; justify-content:center; min-height:100vh; padding:2rem;
`;
const Card = styled.div`
  width:100%; max-width:800px; background:white; padding:2rem; border-radius:12px; box-shadow:0 8px 24px rgba(0,0,0,0.08);
`;
const ContentBox = styled.div`
  max-height: 400px; overflow:auto; background:#fafafa; padding:12px; border-radius:8px; margin:12px 0;
`;
const Controls = styled.div`
  display:flex; gap:12px; margin-top:12px; flex-wrap:wrap;
`;
const ActionButton = styled.button`
  background:#4caf50; color:white; padding:8px 14px; border-radius:8px; border:none; cursor:pointer;
`;
const CancelButton = styled.button`
  background:#eee; color:#333; padding:8px 14px; border-radius:8px; border:none; cursor:pointer;
`;

const ContentSection = styled.div`
  margin: 20px 0;
  h3 {
    margin: 0 0 10px 0;
    color: #2c3e50;
  }
`;

export default ReadingExercise;
