from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from openai import OpenAI
import os
from lib.supabase import supabase

# config
load_dotenv()
app = FastAPI(title="Engine")
client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# # app.include_router(instagram_router)
# app.include_router(messages_router)
# app.include_router(dashboard_router)
# app.include_router(reports_router)


# Health check endpoint for deployment
@app.get("/health")
def health_check():
    return {"status": "healthy", "message": "Backend is running"}


"""
  *below is the sample code of fetching info from supabase
  *this is not used in the project
  *review purpose only when needed

@app.get("/")
def supabase_test():
    response = supabase.table('test_users').select("*").execute()
    users = response.data
    return {"users": [u["name"] for u in users]}

"""
