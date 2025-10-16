import React, { useState } from 'react';

const Feedback = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/submit-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, message }),
      });

      if (response.ok) {
        alert('Feedback submitted successfully!');
        setName('');
        setEmail('');
        setMessage('');
      } else {
        alert('Failed to submit feedback.');
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('An error occurred while submitting feedback.');
    }
  };

  return (
    <div style={{
      backgroundImage: `url('/images/bg-4.jpg')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      minHeight: '100vh',
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      alignItems: 'center',
      padding: '3rem 2rem',
      boxSizing: 'border-box',
    }}>
      <div style={{
        marginBottom: '2rem',
        color: '#1E90FF',
        textAlign: 'right',
        alignSelf: 'flex-end',
      }}>
        
      </div>

      <h1 style={{
        color: '#00008B',
        fontSize: '2.5rem',
        marginBottom: '1rem',
        textAlign: 'center',
        textShadow: '2px 2px 4px rgba(0, 0, 0, 0.1)',
      }}>Share Your Thoughts</h1>
      
      <p style={{
        color: '#00008B',
        fontSize: '1.2rem',
        marginBottom: '2.5rem',
        textAlign: 'center',
        textShadow: '1px 1px 2px rgba(0, 0, 0, 0.1)',
      }}>Your feedback helps us grow and improve</p>

      <div style={{
        width: '100%',
        maxWidth: '600px',
        backgroundColor: 'rgba(255, 255, 255, 0.85)',
        borderRadius: '15px',
        padding: '2rem',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
      }}>
        <form onSubmit={handleSubmit} style={{
          width: '100%',
        }}>
          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="name" style={{
              color: '#1E90FF',
              display: 'block',
              marginBottom: '0.5rem',
              fontSize: '1.1rem',
              fontWeight: '500',
            }}>Name:</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.8rem',
                fontSize: '1rem',
                backgroundColor: '#ffffff',
                border: '1px solid #1E90FF',
                borderRadius: '8px',
                color: '#1E90FF',
                outline: 'none',
                transition: 'border-color 0.3s ease',
              }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label htmlFor="email" style={{
              color: '#1E90FF',
              display: 'block',
              marginBottom: '0.5rem',
              fontSize: '1.1rem',
              fontWeight: '500',
            }}>Email:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '0.8rem',
                fontSize: '1rem',
                backgroundColor: '#ffffff',
                border: '1px solid #1E90FF',
                borderRadius: '8px',
                color: '#1E90FF',
                outline: 'none',
                transition: 'border-color 0.3s ease',
              }}
            />
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label htmlFor="message" style={{
              color: '#1E90FF',
              display: 'block',
              marginBottom: '0.5rem',
              fontSize: '1.1rem',
              fontWeight: '500',
            }}>Message:</label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              required
              style={{
                width: '100%',
                padding: '0.8rem',
                fontSize: '1rem',
                backgroundColor: '#ffffff',
                border: '1px solid #1E90FF',
                borderRadius: '8px',
                color: '#1E90FF',
                outline: 'none',
                transition: 'border-color 0.3s ease',
                resize: 'vertical',
              }}
            />
          </div>

          <button type="submit" style={{
            width: '100%',
            padding: '1rem',
            fontSize: '1.1rem',
            fontWeight: '500',
            color: '#ffffff',
            backgroundColor: '#1E90FF',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            transition: 'background-color 0.3s ease',
            ':hover': {
              backgroundColor: '#1876D0',
            }
          }}>
            Submit Feedback
          </button>
        </form>
      </div>
    </div>
  );
};

export default Feedback;