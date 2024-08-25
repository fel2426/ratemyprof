'use client';
import { useEffect, useRef, useState } from "react";
import { Box, Stack, TextField, Button, Typography, Paper, Divider } from "@mui/material";

export default function Home() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hi! I'm the Rate My Professor support assistant. How can I help you today?",
    }
  ]);
  const [message, setMessage] = useState('');
  const [sentiment, setSentiment] = useState(null);
  const [selectedProfessor, setSelectedProfessor] = useState('');
  const [professorSentiment, setProfessorSentiment] = useState(null);
  const [professorTrends, setProfessorTrends] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (message.trim() === '') return; // Prevent sending empty messages

    setMessages((messages) => [
      ...messages,
      { role: "user", content: message },
      { role: "assistant", content: '' }
    ]);
    setMessage('');

    try {
      const response = await fetch('/api/chat', {
        method: "POST",
        headers: {
          'Content-type': 'application/json'
        },
        body: JSON.stringify([...messages, { role: "user", content: message }])
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let result = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        result += decoder.decode(value, { stream: true });
        setMessages((messages) => {
          const lastMessage = messages[messages.length - 1];
          return [
            ...messages.slice(0, -1),
            { ...lastMessage, content: lastMessage.content + result }
          ];
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendMessage();
    }
  };

  const fetchProfessorData = async () => {
    if (selectedProfessor.trim() === '') return;

    try {
      // Fetch sentiment and trends data for the selected professor
      const sentimentResponse = await fetch(`/get_professor_sentiment?name=${encodeURIComponent(selectedProfessor)}`);
      const sentimentResult = await sentimentResponse.json();
      setProfessorSentiment(sentimentResult);

      const trendsResponse = await fetch(`/get_professor_trends?name=${encodeURIComponent(selectedProfessor)}`);
      const trendsResult = await trendsResponse.json();
      setProfessorTrends(trendsResult);
    } catch (error) {
      console.error('Error fetching professor data:', error);
    }
  };

  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      bgcolor="#f5f5f5"
      padding="16px"
    >
      <Paper
        elevation={3}
        sx={{
          width: "500px",
          height: "700px",
          borderRadius: "16px",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#ffffff",
        }}
      >
        <Box
          sx={{
            backgroundColor: "#1976d2",
            color: "white",
            padding: "16px",
            borderBottom: "1px solid #e0e0e0"
          }}
        >
          <Typography variant="h6">Rate My Professor Assistant</Typography>
        </Box>

        <Stack
          direction="column"
          spacing={2}
          flexGrow={1}
          overflow="auto"
          padding="16px"
          sx={{
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: '#c1c1c1',
              borderRadius: '8px',
            }
          }}
        >
          {messages.map((message, index) => (
            <Box
              key={index}
              display="flex"
              justifyContent={message.role === "assistant" ? 'flex-start' : 'flex-end'}
              sx={{ paddingBottom: "8px" }}
            >
              <Box
                bgcolor={message.role === 'assistant' ? "#e3f2fd" : "#1976d2"}
                color={message.role === 'assistant' ? "black" : "white"}
                borderRadius="16px"
                padding="12px 16px"
                maxWidth="75%"
                boxShadow="0px 2px 5px rgba(0, 0, 0, 0.1)"
                sx={{
                  whiteSpace: 'pre-wrap'
                }}
              >
                {message.content}
              </Box>
            </Box>
          ))}
          <div ref={messagesEndRef} />
        </Stack>

        <Box
          padding="16px"
          borderTop="1px solid #e0e0e0"
          bgcolor="#fafafa"
        >
          <Stack direction="row" spacing={2}>
            <TextField
              label="Type your message..."
              variant="outlined"
              fullWidth
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown} // Listen for the Enter key
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '16px',
                }
              }}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={sendMessage}
              sx={{ borderRadius: '16px' }}
            >
              Send
            </Button>
          </Stack>
        </Box>
      </Paper>

      <Box
        mt={4}
        width="500px"
        padding="16px"
      
      >
        <Typography variant="h6">Professor Insights:</Typography>
        <Stack direction="row" spacing={2} mt={2}>
          <TextField
            label="Professor Name"
            variant="outlined"
            fullWidth
            value={selectedProfessor}
            onChange={(e) => setSelectedProfessor(e.target.value)}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={fetchProfessorData}
          >
            Get Insights
          </Button>
        </Stack>
        {professorSentiment && (
          <Box mt={2}>
            <Typography variant="h6">Sentiment Analysis for {selectedProfessor}:</Typography>
            <Typography>Positive: {professorSentiment.pos}</Typography>
            <Typography>Neutral: {professorSentiment.neu}</Typography>
            <Typography>Negative: {professorSentiment.neg}</Typography>
            <Typography>Compound: {professorSentiment.compound}</Typography>
          </Box>
        )}
        {professorTrends && (
          <Box mt={2}>
            <Typography variant="h6">Trends for {selectedProfessor}:</Typography>
            <Typography>Average Rating: {professorTrends.averageRating}</Typography>
            <Typography>Number of Reviews: {professorTrends.reviewCount}</Typography>
            {/* Display other trend details as needed */}
          </Box>
        )}
      </Box>
    </Box>
  );
}
