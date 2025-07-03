# API

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
uvicorn src.app:app --host 0.0.0.0 --port 8000 --reload
```
