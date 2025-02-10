from dotenv import load_dotenv
import os
load_dotenv()

SERVER_URL = os.getenv('SERVER_URL', '0.0.0.0')  # Default to 0.0.0.0 for external access
PORT = os.getenv('PORT', '8000')  # Use Render's assigned port or fallback to 8000
ENV = os.getenv('ENV', 'production')  # Default to production if not set
GEMINI_API_KEY=os.getenv('GEMINI_API_KEY')