from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

try:
    from agent import ask_business_agent
except Exception as e:
    ask_business_agent = None
    agent_import_error = str(e)


app = FastAPI(
    title="OPSAI - Business Operations Agent",
    description="AI-powered Business Operations Automation",
    version="1.0.0"
)


# --------------------------------------------------
# CORS
# --------------------------------------------------

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------
# REQUEST MODEL
# --------------------------------------------------

class AgentRequest(BaseModel):
    question: str
    business_data: dict = {}


# --------------------------------------------------
# ROOT
# --------------------------------------------------

@app.get("/")
def root():
    return {
        "status": "online",
        "message": "OPSAI Backend is running",
        "agent_endpoint": "/api/agent",
        "docs": "/docs"
    }


# --------------------------------------------------
# HEALTH CHECK
# --------------------------------------------------

@app.get("/api/health")
def health():
    return {
        "status": "ok",
        "message": "OPSAI backend is running"
    }


# --------------------------------------------------
# TEST AGENT ENDPOINT
# --------------------------------------------------

@app.get("/api/agent")
def agent_info():
    return {
        "status": "ok",
        "message": "Agent endpoint is available. Use POST /api/agent to ask a question."
    }


# --------------------------------------------------
# AI AGENT
# --------------------------------------------------

@app.post("/api/agent")
def agent(request: AgentRequest):

    question = request.question.strip()

    if not question:
        return {
            "answer": "Please enter a business question."
        }

    if ask_business_agent is None:
        return {
            "answer": "Agent module could not be loaded.",
            "error": agent_import_error
        }

    try:

        result = ask_business_agent(
            question,
            request.business_data
        )

        return result

    except Exception as error:

        return {
            "answer": "The AI agent encountered an error.",
            "error": str(error)
        }