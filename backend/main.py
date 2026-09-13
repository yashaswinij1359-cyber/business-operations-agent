import os
from typing import Dict, Any

from dotenv import load_dotenv

# =========================================================
# LOAD ENVIRONMENT VARIABLES
# =========================================================
# IMPORTANT:
# Load .env BEFORE importing agent.py.
# This allows agent.py to read GEMINI_API_KEY correctly.

load_dotenv()


# =========================================================
# FASTAPI IMPORTS
# =========================================================

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


# =========================================================
# FRONTEND URL
# =========================================================

# ---------------------------------------------------------
# ADD YOUR VERCEL FRONTEND LINK HERE
# ---------------------------------------------------------
#
# Example:
# FRONTEND_URL = "https://opsai-agent.vercel.app"
#
# Replace the URL below with YOUR actual Vercel URL.
#
# DO NOT put your Gemini API key here.
# ---------------------------------------------------------

FRONTEND_URL = "https://YOUR-OPS-AI-APP.vercel.app"


# =========================================================
# GEMINI API KEY CHECK
# =========================================================

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if GEMINI_API_KEY:
    print("✅ GEMINI_API_KEY loaded successfully")
else:
    print("⚠️ GEMINI_API_KEY is missing")


# =========================================================
# IMPORT AI AGENT
# =========================================================

try:
    from agent import ask_business_agent

    ask_business_agent = ask_business_agent
    agent_import_error = None

    print("✅ AI Agent module loaded successfully")

except Exception as e:
    ask_business_agent = None
    agent_import_error = str(e)

    print("❌ Failed to load AI Agent module")
    print("Error:", agent_import_error)


# =========================================================
# FASTAPI APP
# =========================================================

app = FastAPI(
    title="OPSAI - Business Operations Agent",
    description="AI-powered Business Operations Automation",
    version="1.0.0"
)


# =========================================================
# CORS
# =========================================================

# These URLs are allowed to communicate with the backend.
#
# LOCAL DEVELOPMENT:
# http://localhost:5173
# http://127.0.0.1:5173
#
# DEPLOYED FRONTEND:
# Your Vercel URL is added using FRONTEND_URL above.

allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# Add Vercel URL if it is a real URL
if FRONTEND_URL.startswith("http"):
    allowed_origins.append(FRONTEND_URL)


app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# REQUEST MODEL
# =========================================================

class AgentRequest(BaseModel):
    question: str
    business_data: Dict[str, Any] = Field(default_factory=dict)


# =========================================================
# ROOT ENDPOINT
# =========================================================

@app.get("/")
def root():
    return {
        "status": "online",
        "message": "OPSAI Backend is running",
        "agent_endpoint": "/api/agent",
        "health_endpoint": "/api/health",
        "docs": "/docs"
    }


# =========================================================
# HEALTH CHECK
# =========================================================

@app.get("/api/health")
def health():

    return {
        "status": "ok",
        "message": "OPSAI backend is running",
        "agent_loaded": ask_business_agent is not None,
        "gemini_configured": bool(GEMINI_API_KEY)
    }


# =========================================================
# AGENT INFORMATION
# =========================================================

@app.get("/api/agent")
def agent_info():

    return {
        "status": "ok",
        "message": "Agent endpoint is available.",
        "method": "POST",
        "endpoint": "/api/agent"
    }


# =========================================================
# AI BUSINESS AGENT
# =========================================================

@app.post("/api/agent")
def agent(request: AgentRequest):

    # -----------------------------------------------------
    # Clean question
    # -----------------------------------------------------

    question = request.question.strip()

    if not question:
        return {
            "status": "error",
            "answer": "Please enter a business question."
        }


    # -----------------------------------------------------
    # Check Gemini API key
    # -----------------------------------------------------

    if not GEMINI_API_KEY:

        return {
            "status": "error",
            "answer": "Gemini API key is missing. Please configure GEMINI_API_KEY in the backend environment."
        }


    # -----------------------------------------------------
    # Check AI agent
    # -----------------------------------------------------

    if ask_business_agent is None:

        return {
            "status": "error",
            "answer": "AI Agent could not be loaded.",
            "error": agent_import_error
        }


    # -----------------------------------------------------
    # Call AI agent
    # -----------------------------------------------------

    try:

        result = ask_business_agent(
            question,
            request.business_data
        )

        # If agent returns a dictionary
        if isinstance(result, dict):
            return result

        # If agent returns normal text
        return {
            "status": "success",
            "answer": str(result)
        }


    except Exception as error:

        print("❌ AI Agent Error:", str(error))

        return {
            "status": "error",
            "answer": "The AI agent encountered an error.",
            "error": str(error)
        }


# =========================================================
# SERVER START MESSAGE
# =========================================================

@app.get("/api/status")
def status():

    return {
        "backend": "online",
        "agent": "online" if ask_business_agent else "offline",
        "gemini": "configured" if GEMINI_API_KEY else "missing",
        "frontend": business-operations-agent.vercel.app
    }
