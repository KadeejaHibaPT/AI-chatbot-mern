const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const Message = require('../model/Message');

// ✅ OpenAI client setup
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ✅ GET: Simple route to verify API is working
router.get('/chat', (req, res) => {
  res.json({
    message: '✅ Chat API is active. Please use POST /api/chat to send messages.',
  });
});

// ✅ GET: Fetch all saved chat messages
router.get('/messages', async (req, res) => {
  console.log('📥 GET /api/messages hit');
  try {
    const messages = await Message.find().sort({ timestamp: 1 });
    res.json(messages);
  } catch (err) {
    console.error('❌ Failed to fetch messages:', err.message);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// ✅ POST: Send message to chatbot
router.post('/chat', async (req, res) => {
  const { message } = req.body;
  console.log('🧾 Incoming message:', message);

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Invalid or missing message' });
  }

  try {
    // Save user message
    await Message.create({ sender: 'user', text: message });

    let botReply = 'Sorry, something went wrong.';

    // Try to get reply from OpenAI
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: message }],
      });

      botReply = response.choices[0]?.message?.content || 'No reply received.';
      console.log('✅ Bot reply:', botReply);
    } catch (openaiError) {
      if (openaiError.status === 429) {
        console.warn('⚠️ OpenAI quota exceeded. Sending fallback message.');
        botReply = '⚠️ OpenAI quota exceeded. Please try again later.';
      } else {
        console.error('❌ OpenAI Error:', openaiError.message);
        botReply = '❌ Failed to fetch AI response.';
      }
    }

    // Save bot reply
    await Message.create({ sender: 'bot', text: botReply });

    res.json({ reply: botReply });

  } catch (error) {
    console.error('❌ Chat Error:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
