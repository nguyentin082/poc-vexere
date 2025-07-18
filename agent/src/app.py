from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import sys
import os
import logging

sys.path.append(
    os.path.abspath(
        os.path.join(
            os.path.dirname(__file__),
            "..",
        )
    )
)

from src.routes.faq_route import router as faq_router
from src.routes.after_service_route import router as after_service_router

# Main chat route
# This is the main chat route that handles all chat-related requests.
# It includes the chat service which processes user messages and determines the appropriate response.
# It also includes the classification logic to route messages to either FAQ or after-service handling.
# The chat route is designed to be flexible and can be extended in the future to include more features or services.
from src.routes.chat_route import router as chat_router

app = FastAPI(
    title="Vexere Server",
    version="1.0",
    description="This is the Vexere server API.",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)


@app.get("/")
def read_root():
    return {"Hello": "World"}


app.include_router(faq_router, prefix="/api/faq")
app.include_router(after_service_router, prefix="/api/after-service")
# MAIN ROUTE
app.include_router(chat_router, prefix="/api/chat")


@app.on_event("startup")
async def startup_event():
    logger = logging.getLogger("uvicorn.access")
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter("%(asctime)s - %(levelname)s - %(message)s"))
    logger.addHandler(handler)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8080, log_level="info")
