import os
from dotenv import load_dotenv
from google import genai

load_dotenv()

_api_key = os.getenv("GEMINI_API_KEY")
if not _api_key:
    raise ValueError("GEMINI_API_KEY is not set in the environment.")

client = genai.Client(api_key=_api_key)