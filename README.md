# AI Browser App

A mobile-first browser AI assistant that runs on an iPhone 13 and uses OpenAI for live responses.

Features:
- Clean mobile interface for Safari
- Chat with a live AI
- Voice input using browser speech recognition
- Text-to-speech output
- Responsive design for iPhone-sized screens
- Works as a browser app with no native install required

## Quick start

1. Install dependencies
   ```bash
   npm install
   ```

2. Copy the environment file
   ```bash
   cp .env.example .env
   ```

3. Add your OpenAI API key to `.env`

4. Start the app
   ```bash
   npm start
   ```

5. Open `http://localhost:3000` in your browser

## Notes

- This is a browser-based web app designed for iPhone 13 screens.
- The AI uses the OpenAI API. Without a valid API key, the app will respond with a setup message instead of generating answers.
- For production, add authentication, rate limiting, and secure deployment layers.
