from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from .rag_engine import get_answer
import os

app = FastAPI(title="Robinson's Portfolio AI Chatbot API")

# Enable CORS for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with your domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str

@app.get("/")
async def root():
    return {"message": "AI Chatbot Backend is running!"}

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    try:
        if not request.message:
            raise HTTPException(status_code=400, detail="Message cannot be empty")
        
        answer = get_answer(request.message)
        return ChatResponse(response=answer)
    except Exception as e:
        print(f"Error in chat endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
