import os
import json
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

# Configuration
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", 587))
IMAP_SERVER = "imap.gmail.com" # For drafting
SMTP_USERNAME = os.getenv("SMTP_USERNAME")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")

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
        # Handle cases where AI might wrap the JSON in markdown code blocks despite instructions
        if text.startswith("```"):
            text = text.split("```")[1]
            if text.startswith("json"):
                text = text[4:]
        
        draft_data = json.loads(text)
        
        # Robustness check: if AI returns a list containing the object
        if isinstance(draft_data, list) and len(draft_data) > 0:
            draft_data = draft_data[0]
            
        return EmailDraft(**draft_data)
    except Exception as e:
        print(f"Error generating draft: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate draft: {str(e)}")

@app.post("/send-email")
async def send_email(request: SendRequest):
    if not SMTP_USERNAME or not SMTP_PASSWORD:
        raise HTTPException(status_code=500, detail="SMTP credentials (email/app password) not configured in .env")

    try:
        msg = MIMEMultipart()
        msg['From'] = SMTP_USERNAME
        msg['To'] = request.recipient_email
        msg['Subject'] = request.subject
        msg.attach(MIMEText(request.body, 'plain'))

        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(msg)
            
        return {"status": "success", "message": "Email sent successfully"}
    except Exception as e:
        print(f"Error sending email: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/create-draft-gmail")
async def create_draft_gmail(request: SendRequest):
    """Creates a draft directly in the Gmail Drafts folder using IMAP."""
    import imaplib
    import time

    if not SMTP_USERNAME or not SMTP_PASSWORD:
        raise HTTPException(status_code=500, detail="Gmail credentials (email/app password) not configured in .env")

    try:
        # Create the email message
        msg = MIMEMultipart()
        msg['From'] = SMTP_USERNAME
        msg['To'] = request.recipient_email
        msg['Subject'] = request.subject
        msg['Date'] = time.strftime("%a, %d %b %Y %H:%M:%S %z")
        msg.attach(MIMEText(request.body, 'plain'))
        
        raw_message = msg.as_bytes()

        # Connect to Gmail IMAP
        imap = imaplib.IMAP4_SSL(IMAP_SERVER)
        imap.login(SMTP_USERNAME, SMTP_PASSWORD)
        
        # Select Drafts folder (Gmail standard is "[Gmail]/Drafts")
        imap.append("[Gmail]/Drafts", "", imaplib.Time2Internaldate(time.time()), raw_message)
        imap.logout()
        
        return {"status": "success", "message": "Draft created in Gmail successfully!"}
    except Exception as e:
        print(f"Error creating draft: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to create draft: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
