from fastapi import FastAPI
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

from src.routes.ticket_route import router as ticket_router

app = FastAPI(
    title="Vexere Server",
    version="1.0",
    description="This is the Vexere server API.",
)


@app.get("/")
def read_root():
    return {"Hello": "World"}


app.include_router(ticket_router, prefix="/api/ticket")


@app.on_event("startup")
async def startup_event():
    logger = logging.getLogger("uvicorn.access")
    handler = logging.StreamHandler()
    handler.setFormatter(logging.Formatter("%(asctime)s - %(levelname)s - %(message)s"))
    logger.addHandler(handler)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8080, log_level="info")
