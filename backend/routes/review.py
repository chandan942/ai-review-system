from fastapi import APIRouter
from backend.models import CodeRequest, ReviewResponse
from backend.services.reviewer import review_code as ai_review_code
from backend.utils.logger import get_logger

router = APIRouter()
logger = get_logger("review_route")


@router.post("/review", response_model=ReviewResponse)
async def review_code(request: CodeRequest):
    """Submit code for AI review and get structured feedback with metadata."""
    logger.info(f"Received review request: {request.language.value} in '{request.mode.value}' mode.")
    result = await ai_review_code(
        code=request.code,
        language=request.language.value,
        mode=request.mode.value,
    )
    return result
