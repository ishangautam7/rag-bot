import os
from typing import Annotated, TypedDict, List, Literal
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langchain_core.tools import tool
from langgraph.graph import StateGraph, START, END
from langgraph.graph.message import add_messages
from langgraph.checkpoint.memory import MemorySaver
from pypdf import PdfReader, PdfWriter
from fpdf import FPDF

load_dotenv()

@tool
def read_pdf(file_path: str) -> str:
    """Read the pdf file and extract the text"""
    try:
        reader = PdfReader(file_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        return text
    except Exception as e:
        return str(e)

@tool
def create_pdf_copy(file_path: str, output_path: str) -> str:
    """Creates a copy of the original pdf given by user"""
    try:
        reader = PdfReader(file_path)
        writer = PdfWriter()
        for page in reader.pages:
            writer.add_page(page)
        with open(output_path, "wb") as f:
            writer.write(f)
        return output_path
    except Exception as e:
        return str(e)

@tool
def write_new_pdf(file_path: str, content: str) -> str:
    """Writes new text content to a PDF file"""
    try:
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Arial", size=12)
        safe_content = content.encode('latin-1', 'replace').decode('latin-1')
        pdf.multi_cell(0, 10, txt=safe_content)
        pdf.output(file_path)
        return f"File saved to {file_path}"
    except Exception as e:
        return str(e)

llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash-lite", api_key=os.getenv("GOOGLE_API_KEY"))
tools = [read_pdf, create_pdf_copy, write_new_pdf]
llm_with_tools = llm.bind_tools(tools)

class AgentState(TypedDict):
    messages: Annotated[List, add_messages]
    original_file_path: str
    working_file_path: str
    review_status: str
    user_feedback: str

def setup_node(state: AgentState):
    original = state["original_file_path"]
    working = f"working_copy_{os.path.basename(original)}"
    create_pdf_copy(original, working)
    return {
        "working_file_path": working,
        "messages": [SystemMessage(content=f"Created working copy: {working}")]
    }

def review_node(state: AgentState):
    # Manually read text to ensure context is available immediately
    file_content = read_pdf(state["working_file_path"])
    
    instructions = f"""
    You are an expert in PDF file review.
    1. Analyze the file content provided below.
    2. If there is previous feedback '{state.get('user_feedback', '')}', prioritize it.
    3. Propose specific changes or the full corrected text.
    4. DO NOT call write tools yet. Just propose.
    
    File Content:
    {file_content[:5000]}
    """
    
    response = llm.invoke([SystemMessage(content=instructions)] + state["messages"])
    return {
        "messages": [response],
        "review_status": "proposal_ready"
    }

def edit_node(state: AgentState):
    last_message = state["messages"][-1]
    instructions = f"""
    The user has approved the changes.
    Create the final PDF at: {state['working_file_path']}
    
    Content to write:
    {last_message.content}
    """
    # Use LLM with tools to decide how to write the file
    response = llm_with_tools.invoke([SystemMessage(content=instructions)])
    
    # If LLM didn't call tool, we force a manual write (fallback)
    if not response.tool_calls:
        write_new_pdf(state["working_file_path"], last_message.content)
        return {"messages": [AIMessage(content="File updated manually.")]}
        
    return {"messages": [response]}

def check_approval(state: AgentState) -> Literal["edit_node", "review_node"]:
    if state.get("review_status") == "approved":
        return "edit_node"
    return "review_node"

workflow = StateGraph(AgentState)

workflow.add_node("setup_node", setup_node)
workflow.add_node("review_node", review_node)
workflow.add_node("edit_node", edit_node)

workflow.add_edge(START, "setup_node")
workflow.add_edge("setup_node", "review_node")

workflow.add_conditional_edges(
    "review_node",
    check_approval,
    {
        "edit_node": "edit_node",
        "review_node": "review_node"
    }
)

workflow.add_edge("edit_node", END)

memory = MemorySaver()
app = workflow.compile(checkpointer=memory, interrupt_before=["edit_node"])