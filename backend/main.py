from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
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
# CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# REQUEST MODEL
# =========================================================

class AgentRequest(BaseModel):
    """
    Accepts the format currently being sent by the frontend.

    Frontend:
    {
        "question": "...",
        "business_data": {...}
    }
    """

    question: Optional[str] = None

    business_data: Optional[Dict[str, Any]] = None

    # Also support the older format
    message: Optional[str] = None

    context: Optional[Dict[str, Any]] = None


# =========================================================
# ROOT
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
# STATUS
# =========================================================

@app.get("/api/status")
async def status():

    return {
        "backend": "online",
        "agent_available": AGENT_AVAILABLE,
        "agent_error": AGENT_ERROR
    }


# =========================================================
# AI AGENT
# =========================================================

@app.post("/api/agent")
async def business_agent(request: AgentRequest):

    # -----------------------------------------------------
    # Get question
    # -----------------------------------------------------

    question = request.question or request.message

    if not question or not question.strip():

        raise HTTPException(
            status_code=400,
            detail="Question/message cannot be empty."
        )


    # -----------------------------------------------------
    # Get business data
    # -----------------------------------------------------

    business_data = (
        request.business_data
        or request.context
        or {}
    )


    # -----------------------------------------------------
    # Check AI agent
    # -----------------------------------------------------

    if not AGENT_AVAILABLE or ask_business_agent is None:

        raise HTTPException(
            status_code=500,
            detail={
                "message": "AI agent is not available.",
                "error": AGENT_ERROR
            }
        )


    try:

        print("======================================")
        print("BUSINESS AGENT REQUEST")
        print("QUESTION:")
        print(question)
        print()
        print("BUSINESS DATA:")
        print(business_data)
        print("======================================")


        # -------------------------------------------------
        # Call your existing AI agent
        # -------------------------------------------------

        result = ask_business_agent(
            question,
            business_data
        )


        # -------------------------------------------------
        # Support async agent
        # -------------------------------------------------

        if hasattr(result, "__await__"):
            result = await result


        # -------------------------------------------------
        # Return dictionary
        # -------------------------------------------------

        if isinstance(result, dict):

            return result


        # -------------------------------------------------
        # Return text
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
# OLD /ASK ENDPOINT
# =========================================================

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
