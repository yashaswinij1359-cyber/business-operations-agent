import os
import json

from dotenv import load_dotenv
from google import genai

load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")

client = None

if API_KEY:
    client = genai.Client(api_key=API_KEY)


def create_business_prompt(question, business_data):

    return f"""
You are OPSAI, an AI Business Operations Agent.

Answer the user's question using ONLY the business data below.

BUSINESS DATA:
{json.dumps(business_data, indent=2)}

USER QUESTION:
{question}

Rules:
- Do not invent information.
- Use the actual sales, inventory, tasks and team data.
- Perform calculations when necessary.
- If the data does not contain the answer, say so.
- Give a clear business recommendation.

Format your response as:

ANSWER:
...

INSIGHT:
...

RECOMMENDED ACTION:
...
"""


def ask_business_agent(question, business_data):

    if not API_KEY:
        return {
            "answer": "Gemini API key is missing.",
            "error": "GEMINI_API_KEY was not found in backend/.env"
        }

    try:

        prompt = create_business_prompt(
            question,
            business_data
        )

        response = client.models.generate_content(
            model="gemini-3.6-flash",
            contents=prompt
        )

        return {
            "answer": response.text
        }

    except Exception as error:

        print("====================================")
        print("GEMINI ERROR:")
        print(str(error))
        print("====================================")

        return {
            "answer": "Gemini request failed.",
            "error": str(error)
        }