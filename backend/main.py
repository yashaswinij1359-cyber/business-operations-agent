from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any


# =========================================================
# AI AGENT IMPORT
# =========================================================

try:
    from agent import ask_business_agent

    AGENT_AVAILABLE = True
    AGENT_ERROR = None

except Exception as e:
    ask_business_agent = None

    AGENT_AVAILABLE = False
    AGENT_ERROR = str(e)

    print("Agent import error:", AGENT_ERROR)


# =========================================================
# FASTAPI APP
# =========================================================

app = FastAPI(
    title="Business Operations Agent",
    description="AI-powered business operations automation agent",
    version="1.0.0"
)


# =========================================================
# CORS CONFIGURATION
# =========================================================

# Exact allowed frontend origins
ALLOWED_ORIGINS = [
    "https://business-operations-agent.vercel.app",

    # Local React/Vite
    "http://localhost:5173",
    "http://127.0.0.1:5173",

    # Local React/CRA
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]


app.add_middleware(
    CORSMiddleware,

    # Exact origins
    allow_origins=ALLOWED_ORIGINS,

    # Allow Vercel preview deployments too
    allow_origin_regex=r"https://.*\.vercel\.app",

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],

    expose_headers=["*"],
)


# =========================================================
# REQUEST MODEL
# =========================================================

class AgentRequest(BaseModel):

    message: str = Field(..., min_length=1)

    context: Optional[Dict[str, Any]] = None


# =========================================================
# ROOT ENDPOINT
# =========================================================

@app.get("/")
async def root():

    return {
        "status": "online",
        "message": "Business Operations Agent API is running",
        "version": "1.0.0"
    }


# =========================================================
# HEALTH CHECK
# =========================================================

@app.get("/api/health")
async def health_check():

    return {
        "status": "ok",
        "backend": "online",
        "agent": "online" if AGENT_AVAILABLE else "offline"
    }


# =========================================================
# STATUS ENDPOINT
# =========================================================

@app.get("/api/status")
async def status():

    return {
        "backend": "online",
        "agent_available": AGENT_AVAILABLE,
        "agent_error": AGENT_ERROR
    }


# =========================================================
# AI AGENT ENDPOINT
# =========================================================

@app.post("/api/agent")
async def business_agent(request: AgentRequest):

    # -----------------------------------------------------
    # Validate message
    # -----------------------------------------------------

    if not request.message.strip():

        raise HTTPException(
            status_code=400,
            detail="Message cannot be empty."
        )


    # -----------------------------------------------------
    # Check agent
    # -----------------------------------------------------

    if not AGENT_AVAILABLE or ask_business_agent is None:

        raise HTTPException(
            status_code=500,
            detail={
                "message": "AI agent is not available.",
                "error": AGENT_ERROR
            }
        )


    # -----------------------------------------------------
    # Business context
    # -----------------------------------------------------

    context = request.context or {}


    try:

        print("======================================")
        print("BUSINESS AGENT REQUEST")
        print("Message:", request.message)
        print("Context:", context)
        print("======================================")


        # -------------------------------------------------
        # Call AI agent
        # -------------------------------------------------

        result = ask_business_agent(
            request.message,
            context
        )


        # -------------------------------------------------
        # Handle async agent functions
        # -------------------------------------------------

        if hasattr(result, "__await__"):

            result = await result


        # -------------------------------------------------
        # Return dictionary response
        # -------------------------------------------------

        if isinstance(result, dict):

            return result


        # -------------------------------------------------
        # Return normal text response
        # -------------------------------------------------

        return {
            "success": True,
            "response": str(result)
        }


    except Exception as e:

        print("======================================")
        print("AI AGENT ERROR")
        print(str(e))
        print("======================================")


        raise HTTPException(
            status_code=500,
            detail=f"AI agent failed: {str(e)}"
        )


# =========================================================
# BACKWARD COMPATIBILITY
# =========================================================
# If your old frontend calls /ask, it will still work.

@app.post("/ask")
async def ask_agent(request: AgentRequest):

    return await business_agent(request)


# =========================================================
# RUN LOCALLY
# =========================================================

if __name__ == "__main__":

    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
