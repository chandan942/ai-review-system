from fastapi import APIRouter
from backend.models import BatchReviewRequest, BatchReviewResponse, BatchFileReviewResult
from backend.services.reviewer import review_code as ai_review_code
from backend.utils.logger import get_logger
import time

router = APIRouter()
logger = get_logger("batch_route")


@router.post("/batch-review", response_model=BatchReviewResponse)
async def batch_review_code(request: BatchReviewRequest):
    """Submit multiple files for batch code review."""
    start_time = time.time()
    logger.info(f"Received batch review request for {len(request.files)} files")

    results = []
    successful_files = 0
    failed_files = 0
    total_issues = 0

    for file_item in request.files:
        # Use file-specific language and mode, or fall back to defaults
        language = file_item.language or request.default_language
        mode = file_item.mode or request.default_mode

        try:
            result = await ai_review_code(
                code=file_item.code,
                language=language.value,
                mode=mode.value,
            )

            results.append(BatchFileReviewResult(
                filename=file_item.filename,
                language=language.value,
                mode=mode.value,
                review=result
            ))

            successful_files += 1
            total_issues += len(result.issues)

        except Exception as e:
            logger.error(f"Review failed for {file_item.filename}: {e}")
            results.append(BatchFileReviewResult(
                filename=file_item.filename,
                language=language.value if language else request.default_language.value,
                mode=mode.value if mode else request.default_mode.value,
                error=str(e)
            ))
            failed_files += 1

    batch_time_ms = int((time.time() - start_time) * 1000)

    # Generate overall summary
    if successful_files == 0:
        overall_summary = "All files failed to process."
    elif failed_files == 0:
        overall_summary = f"All {successful_files} files processed successfully with {total_issues} total issue(s) found."
    else:
        overall_summary = f"{successful_files} files processed successfully, {failed_files} failed. Total issues found: {total_issues}."

    return BatchReviewResponse(
        total_files=len(request.files),
        successful_files=successful_files,
        failed_files=failed_files,
        total_issues=total_issues,
        overall_summary=overall_summary,
        batch_time_ms=batch_time_ms,
        results=results
    )