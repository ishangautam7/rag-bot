import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI
from tools.tools import utils
from typing import Annotated, TypedDict
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages

load_dotenv()

llm = ChatGoogleGenerativeAI(model_name="gemini-2.5-flash-lite", api_key=os.getenv("GOOGLE_API_KEY"))

tools = utils
llm_with_tools = llm.bind_tools(tools)

class AgentState(TypedDict):
    session_id: str
    current_file: str
    user_query: str
    ai_response: str
    output_path: str
    