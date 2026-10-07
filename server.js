require('dotenv').config();
const express = require('express');
const path = require('path');
const OpenAI = require('openai');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.get('/api/health', (_, res) => {
  res.json({ ok: true, message: 'AI browser app is running.' });
});

app.post('/api/chat', async (req, res) => {
  try {
    const { messages = [] } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'A valid messages array is required.' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(200).json({
        role: 'assistant',
        content:
          'AI is ready, but no OpenAI API key was found. Add OPENAI_API_KEY to your .env file to enable live responses.',
      });
    }

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful, concise AI assistant designed for a mobile web app. Provide clear, useful answers and keep responses friendly and easy to read on a small screen.',
        },
        ...messages,
      ],
      temperature: 0.7,
      max_tokens: 800,
    });

    const reply = completion.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      return res.status(500).json({ error: 'No response returned from the model.' });
    }

    res.json({ role: 'assistant', content: reply });
  } catch (error) {
    console.error('Chat error:', error);
    const message =
      error?.response?.data?.error?.message ||
      error?.message ||
      'Something went wrong while contacting the AI service.';

    res.status(500).json({
      role: 'assistant',
      content: `The AI request failed: ${message}`,
    });
  }
});

app.get('*', (_, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`AI browser app running at http://localhost:${PORT}`);
});
