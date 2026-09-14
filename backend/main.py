from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.review import router as review_router

app = FastAPI(
    title="AI Code Reviewer",
    description="AI-powered code review API",
    version="0.1.0",
)

# CORS — allows frontend to call this API from the browser
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Lock this down in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(review_router)


@app.get("/")
def home():
    return {"message": "AI Code Reviewer API is running!"}