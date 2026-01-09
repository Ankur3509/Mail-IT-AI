import os
import json
import smtplib
import base64
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from fastapi import FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from groq import Groq

# Google Auth imports
from google_auth_oauthlib.flow import Flow
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from google.auth.transport.requests import Request as GoogleRequest

load_dotenv()

# Configuration
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI", "https://mail-it-ai.onrender.com/oauth2callback")

# Scopes for Gmail
SCOPES = [
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.compose',
    'https://www.googleapis.com/auth/userinfo.email',
    'openid'
]

# Initialize Groq
client = Groq(api_key=GROQ_API_KEY)

app = FastAPI(title="Mail IT AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class DraftRequest(BaseModel):
    sender_name: str
    recipient_name: str
    purpose: str
    tone: str

class EmailDraft(BaseModel):
    subject: str
    body: str

class SendRequest(BaseModel):
    recipient_email: str
    subject: str
    body: str
    auth_token: str # Token from OAuth

@app.post("/generate-draft", response_model=EmailDraft)
async def generate_draft(request: DraftRequest):
    prompt = f"""
    You are a senior executive assistant. 
    Draft a stunningly professional email from {request.sender_name} to {request.recipient_name}.
    Purpose: {request.purpose}
    Tone: {request.tone}
    
    The email must be:
    1. Highly structured with a clear subject.
    2. Contain a proper salutation, well-organized body paragraphs, and a professional sign-off.
    3. Use great formatting (paragraphs, clear spacing).
    
    Return ONLY a valid JSON object:
    {{
      "subject": "Clear and Impactful Subject Line",
      "body": "Detailed and well-formatted email body..."
    }}
    Do not use markdown code blocks (```json). Just the raw JSON.
    """
    
    try:
        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            model="llama-3.1-8b-instant",
            response_format={"type": "json_object"}
        )
        
        text = chat_completion.choices[0].message.content.strip()
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        
        draft_data = json.loads(text)
        if isinstance(draft_data, list) and len(draft_data) > 0:
            draft_data = draft_data[0]
            
        return EmailDraft(**draft_data)
    except Exception as e:
        print(f"Error generating draft: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate draft: {str(e)}")

# --- OAuth2 Endpoints ---

@app.get("/auth-url")
async def get_auth_url():
    if not CLIENT_ID or not CLIENT_SECRET:
        raise HTTPException(status_code=500, detail="Google Client credentials not configured")
        
    client_config = {
        "web": {
            "client_id": CLIENT_ID,
            "project_id": "mail-it-ai",
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
            "client_secret": CLIENT_SECRET,
            "redirect_uris": [REDIRECT_URI]
        }
    }
    
    flow = Flow.from_client_config(client_config, scopes=SCOPES)
    flow.redirect_uri = REDIRECT_URI
    
    auth_url, _ = flow.authorization_url(prompt='consent', access_type='offline')
    return {"url": auth_url}

@app.get("/oauth2callback")
async def oauth2callback(code: str):
    client_config = {
        "web": {
            "client_id": CLIENT_ID,
            "project_id": "mail-it-ai",
            "auth_uri": "https://accounts.google.com/o/oauth2/auth",
            "token_uri": "https://oauth2.googleapis.com/token",
            "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
            "client_secret": CLIENT_SECRET,
            "redirect_uris": [REDIRECT_URI]
        }
    }
    
    flow = Flow.from_client_config(client_config, scopes=SCOPES)
    flow.redirect_uri = REDIRECT_URI
    flow.fetch_token(code=code)
    
    creds = flow.credentials
    # In a real app, we'd store this in a DB. 
    # For now, we'll redirect back to frontend with the token in the URL (simplified)
    frontend_url = os.getenv("FRONTEND_URL", "https://mailitai.netlify.app")
    token_json = creds.to_json()
    encoded_token = base64.b64encode(token_json.encode()).decode()
    
    from fastapi.responses import RedirectResponse
    return RedirectResponse(f"{frontend_url}/?token={encoded_token}")

@app.post("/send-email")
async def send_email(request: SendRequest):
    try:
        # Reconstruct credentials
        token_data = base64.b64decode(request.auth_token).decode()
        creds_info = json.loads(token_data)
        creds = Credentials.from_authorized_user_info(creds_info, SCOPES)
        
        if creds.expired and creds.refresh_token:
            creds.refresh(GoogleRequest())

        service = build('gmail', 'v1', credentials=creds)
        
        message = MIMEMultipart()
        message['to'] = request.recipient_email
        message['subject'] = request.subject
        message.attach(MIMEText(request.body, 'plain'))
        
        raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode()
        create_message = {'raw': raw_message}
        
        service.users().messages().send(userId="me", body=create_message).execute()
        return {"status": "success", "message": "Email sent successfully via your Gmail!"}
    except Exception as e:
        print(f"Error sending email: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/create-draft-gmail")
async def create_draft_gmail(request: SendRequest):
    try:
        token_data = base64.b64decode(request.auth_token).decode()
        creds_info = json.loads(token_data)
        creds = Credentials.from_authorized_user_info(creds_info, SCOPES)
        
        if creds.expired and creds.refresh_token:
            creds.refresh(GoogleRequest())

        service = build('gmail', 'v1', credentials=creds)
        
        message = MIMEMultipart()
        message['to'] = request.recipient_email
        message['subject'] = request.subject
        message.attach(MIMEText(request.body, 'plain'))
        
        raw_message = base64.urlsafe_b64encode(message.as_bytes()).decode()
        draft = {
            'message': {
                'raw': raw_message
            }
        }
        
        service.users().drafts().create(userId="me", body=draft).execute()
        return {"status": "success", "message": "Draft created in your Gmail account!"}
    except Exception as e:
        print(f"Error creating draft: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
