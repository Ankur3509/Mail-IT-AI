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

load_dotenv()

# Configuration
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# SMTP Configuration
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
SENDER_NAME = os.getenv("SENDER_NAME", "Mailit AI")
ADMIN_TOKEN = os.getenv("ADMIN_TOKEN", "default_secret_token_123") # Simple protection

# Initialize Groq
client = Groq(api_key=GROQ_API_KEY)

app = FastAPI(title="Mailit AI Private API")

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
    admin_token: str

class EmailDraft(BaseModel):
    subject: str
    body: str

class SendRequest(BaseModel):
    recipient_email: str
    subject: str
    body: str
    admin_token: str # Simple token for private use

@app.post("/generate-draft", response_model=EmailDraft)
async def generate_draft(request: DraftRequest):
    # Security check
    if request.admin_token != ADMIN_TOKEN:
        raise HTTPException(status_code=403, detail="Unauthorized")
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
        return EmailDraft(**draft_data)
    except Exception as e:
        print(f"Error generating draft: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate draft: {str(e)}")

@app.post("/send-email")
async def send_email(request: SendRequest):
    # Security check: Simple token
    if request.admin_token != ADMIN_TOKEN:
        raise HTTPException(status_code=403, detail="Unauthorized: Access restricted to the owner.")

    if not SMTP_USERNAME or not SMTP_PASSWORD:
        raise HTTPException(status_code=500, detail="SMTP credentials not configured.")

    try:
        message = MIMEMultipart()
        message['From'] = f"{SENDER_NAME} <{SMTP_USERNAME}>"
        message['To'] = request.recipient_email
        message['Subject'] = request.subject
        message.attach(MIMEText(request.body, 'plain'))
        
        # SMTP Sending
        server = smtplib.SMTP(SMTP_SERVER, SMTP_PORT)
        server.starttls()
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        server.send_message(message)
        server.quit()
        
        return {"status": "success", "message": "Email sent successfully via your private SMTP server!"}
    except Exception as e:
        print(f"Error sending email: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Note: create-draft-gmail is removed as it requires Gmail API / OAuth which we are disabling for public-less use.


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
