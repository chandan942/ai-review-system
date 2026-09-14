from fastapi import APIRouter, HTTPException
from backend.models import CodeRequest, ReviewResponse
from backend.services.reviewer import review_code

router = APIRouter()


@router.post("/review", response_model=ReviewResponse)
async def review_code(request: CodeRequest):
    """Submit code for AI review and get structured feedback."""
    try:
        print(f"Reviewing {request.language} code...")
        result = review_code(request.code, request.language)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Review failed: {str(e)}")
