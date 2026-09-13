from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any

# =========================================================
# IMPORT AI AGENT
# =========================================================

try:
    from agent import ask_business_agent
    AGENT_AVAILABLE = True
    AGENT_ERROR = None

except Exception as e:
    ask_business_agent = None
    AGENT_AVAILABLE = False
    AGENT_ERROR = str(e)


# =========================================================
# APP
# =========================================================

app = FastAPI(
    title="Business Operations Agent",
    description="AI-powered business operations automation agent",
    version="1.0.0"
)


# =========================================================
# CORS
# =========================================================
# IMPORTANT:
# Your Vercel frontend must be included here.

origins = [
    # Production frontend
    "business-operations-agent.vercel.app",

    # Local development
    "http://localhost:5173",
    "http://127.0.0.1:5173",

    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# REQUEST MODEL
# =========================================================

class AgentRequest(BaseModel):
    message: str

    context: Optional[Dict[str, Any]] = {}


# =========================================================
# ROOT
# =========================================================

@app.get("/")
def root():
    return {
        "status": "online",
        "message": "Business Operations Agent API is running",
        "version": "1.0.0"
    }


# =========================================================
# HEALTH CHECK
# =========================================================

@app.get("/api/health")
def health_check():

    return {
        "status": "ok",
        "backend": "online",
        "agent": "online" if AGENT_AVAILABLE else "offline"
    }


# =========================================================
# AGENT STATUS
# =========================================================

@app.get("/api/status")
def agent_status():

    return {
        "backend": "online",
        "agent_available": AGENT_AVAILABLE,
        "agent_error": AGENT_ERROR
    }


# =========================================================
# AI BUSINESS AGENT
# =========================================================

@app.post("/api/agent")
async def business_agent(request: AgentRequest):

    # ---------------------------------------------
    # Check message
    # ---------------------------------------------

    if not request.message.strip():
        raise HTTPException(
            status_code=400,
            detail="Message cannot be empty."
        )

    # ---------------------------------------------
    # Check AI agent
    # ---------------------------------------------

    if not AGENT_AVAILABLE or ask_business_agent is None:

        raise HTTPException(
            status_code=500,
            detail={
                "message": "AI agent is not available.",
                "error": AGENT_ERROR
            }
        )

    # ---------------------------------------------
    # Prepare business context
    # ---------------------------------------------

    context = request.context or {}

    try:

        # -----------------------------------------
        # Call AI agent
        # -----------------------------------------

        result = ask_business_agent(
            request.message,
            context
        )

        # -----------------------------------------
        # Support async agent functions
        # -----------------------------------------

        if hasattr(result, "__await__"):
            result = await result

        # -----------------------------------------
        # Return response
        # -----------------------------------------

        if isinstance(result, dict):

            return result

        return {
            "success": True,
            "response": str(result)
        }

    except Exception as e:

        print("AI AGENT ERROR:", str(e))

        raise HTTPException(
            status_code=500,
            detail=f"AI agent failed: {str(e)}"
        )


# =========================================================
# OPTIONAL ALIAS
# =========================================================
# This allows older frontend code using /ask to continue
# working.

@app.post("/ask")
async def ask_agent(request: AgentRequest):

    return await business_agent(request)


# =========================================================
# SERVER START
# =========================================================

if __name__ == "__main__":

    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
