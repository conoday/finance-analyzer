import re

with open('api/main.py', 'r', encoding='utf-8') as f:
    text = f.read()

# We will add an exception handler right after CORSMiddleware
exception_handler = """
from fastapi.responses import JSONResponse
import logging

logger = logging.getLogger(__name__)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global Exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Maaf, terjadi kesalahan internal pada sistem. Kami sedang memeriksanya."},
    )
"""

text = text.replace(
    'allow_headers=["*"],\n)',
    'allow_headers=["*"],\n)\n' + exception_handler
)

with open('api/main.py', 'w', encoding='utf-8') as f:
    f.write(text)

print('api/main.py patched for exception handling')
