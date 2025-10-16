import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const WORDS = ['apple', 'banana', 'cherry', 'mango', 'grape'];

const TypingGame: React.FC = () => {
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState('');
  const [results, setResults] = useState<Array<{ word: string; input: string; correct: boolean }>>([]);
  const navigate = useNavigate();
  const [childData, setChildData] = useState<{ username: string; therapistCode: string; sessionId: string } | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('childData');
    if (!stored) {
      navigate('/child-login');
      return;
    }
    try {
      const parsed = JSON.parse(stored);
      setChildData(parsed);

      // If child's preferred game is puzzles, redirect back to landing or game
      const pref = sessionStorage.getItem(`selectedGame_${parsed.username}`) || sessionStorage.getItem('selectedGame');
      if (pref === 'puzzles') {
        navigate('/landing');
        return;
      }
    } catch (err) {
      navigate('/child-login');
    }
  }, [navigate]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const word = WORDS[index];
    const correct = input.trim().toLowerCase() === word;
    const entry = { word, input, correct };
    setResults(prev => [...prev, entry]);
    setInput('');
    if (index < WORDS.length - 1) {
      setIndex(index + 1);
    } else {
      // finished, save results
      saveResults([...results, entry]);
    }
  };

  const saveResults = async (finalResults: Array<{ word: string; input: string; correct: boolean }>) => {
    if (!childData) return;
    try {
      const payload = {
        therapistCode: childData.therapistCode,
        username: childData.username,
        sessionId: childData.sessionId,
        results: finalResults
      };
      const resp = await fetch('http://localhost:5000/api/save-typing-results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await resp.json();
      if (resp.ok) {
        setMessage('Typing game completed. Results saved.');
        setTimeout(() => {
          navigate('/landing');
        }, 1600);
      } else {
        setMessage(data.message || 'Failed to save results');
      }
    } catch (err) {
      setMessage('Network error while saving results');
    }
  };

  if (!childData) return <Container>Loading...</Container>;

  return (
    <Container>
      <Card>
        <Title>Typing Game</Title>
        <Instruction>Type the word shown below in the box.</Instruction>
        <WordBox>{WORDS[index]}</WordBox>
        <Form onSubmit={handleSubmit}>
          <TextInput
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type here..."
            autoFocus
          />
          <SubmitButton type="submit">Submit</SubmitButton>
        </Form>
        <Progress>{index + 1} / {WORDS.length}</Progress>
        {message && <Message>{message}</Message>}
      </Card>
    </Container>
  );
};

const Container = styled.div`
  display:flex;
  align-items:center;
  justify-content:center;
  min-height:100vh;
  background: rgba(240,248,255,0.6);
`;

const Card = styled.div`
  background:white;
  padding:28px;
  border-radius:12px;
  box-shadow:0 8px 30px rgba(0,0,0,0.08);
  width:420px;
  text-align:center;
`;
const Title = styled.h2`
  margin:0 0 8px 0;
`;
const Instruction = styled.p`
  color:#666;
  margin:0 0 12px 0;
`;
const WordBox = styled.div`
  font-size:28px;
  font-weight:700;
  padding:12px 8px;
  margin-bottom:12px;
`;
const Form = styled.form`
  display:flex;
  gap:8px;
  justify-content:center;
  margin-bottom:12px;
`;
const TextInput = styled.input`
  padding:12px 10px;
  border:1px solid #ddd;
  border-radius:8px;
  width:220px;
  font-size:16px;
`;
const SubmitButton = styled.button`
  padding:10px 14px;
  background:#4a67cc;
  color:white;
  border:none;
  border-radius:8px;
`;
const Progress = styled.div`
  color:#666;
  font-size:14px;
`;
const Message = styled.div`
  margin-top:12px;
  color:green;
`;

export default TypingGame;
