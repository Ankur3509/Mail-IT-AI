# Mail IT AI 📧

A professional AI-powered email drafting and sending assistant.

## Features
- AI-driven draft generation (using Google Gemini)
- Modern, professional UI with glassmorphism
- Real-time preview of drafted emails
- Secure SMTP integration for sending
- Confirmation-first workflow (no accidental sends)

## Setup

### Backend
1. `cd backend`
2. Create a virtual environment: `python -m venv venv`
3. Activate it: `venv\Scripts\activate`
4. Install dependencies: `pip install -r requirements.txt`
5. Create `.env` from `.env.example` and add your API keys.
6. Run: `python main.py`

### Frontend
1. `cd frontend`
2. Install dependencies: `npm install`
3. Run: `npm run dev`
4. Open [http://localhost:3000](http://localhost:3000)

## API Keys Required
- **Google Gemini API Key**: Get it for free at [Google AI Studio](https://aistudio.google.com/)
- **SMTP Credentials**: Use a Gmail App Password or any SMTP service (Mailtrap, SendGrid, etc.)
