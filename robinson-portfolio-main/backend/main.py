import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
try:
    from .rag_engine import get_answer
    from . import database, auth
except ImportError:
    from rag_engine import get_answer
    import database
    import auth

# Initialize DB and create default admin
def setup_db():
    database.init_db()
    db = database.SessionLocal()
    try:
        admin_username = os.getenv("ADMIN_USERNAME", "admin")
        admin_password = os.getenv("ADMIN_PASSWORD", "admin123")[:70]
        user = auth.get_user_by_username(db, admin_username)
        if not user:
            print(f"Creating default admin user: {admin_username}")
            hashed_password = auth.get_password_hash(admin_password)
            new_user = database.User(username=admin_username, hashed_password=hashed_password)
            db.add(new_user)
            db.commit()
    finally:
        db.close()

@asynccontextmanager
async def lifespan(app: FastAPI):
    setup_db()
    yield

app = FastAPI(title="Robinson's Portfolio AI Chatbot API", lifespan=lifespan)# Enable CORS for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://robinsonkr.vercel.app", "http://localhost:3000", "http://127.0.0.1:3000"],  # Restrict to Vercel production domain + localhost
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


@app.post("/token")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    user = auth.get_user_by_username(db, form_data.username)
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/admin/dashboard_data")
async def get_admin_dashboard(current_user: database.User = Depends(auth.get_current_user)):
    # This acts as a protected route returning private data
    return {
        "message": f"Welcome to the confidential admin area, {current_user.username}!",
        "stats": {
            "chatbot_queries": 152,
            "portfolio_views": 843,
            "new_messages": 5
        }
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
