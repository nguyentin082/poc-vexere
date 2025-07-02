# Vexere Chatbot POC

## Levels

-   L-1: FAQ RAG Chatbot
-   L-2: After-Service: Change departure time, Cancel ticket, Issue invoice, Submit a complaint
-   L-3: Booking ticket flow – includes prompting the user for travel date, route, seat selection, and payment.

## Create a virtual environment

```bash
cd agent
python3 -m venv venv

# activate the virtual environment
source venv/bin/activate
pip install --upgrade pip
# install the required packages
pip install -r requirements.txt
```

## Run the application

```bash
uvicorn src.app:app --host 0.0.0.0 --port 8080 --reload
```
