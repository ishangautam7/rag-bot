
import os
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv
from langchain_core.messages import SystemMessage, HumanMessage, ToolMessage
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI
from tools.tools import utils as tools
from langgraph.prebuilt import create_react_agent
from langchain_core.tools import Tool

load_dotenv()

# System Prompt with Strong Style Preservation Instructions
SYSTEM_PROMPT = """You are an expert AI document editor and generator.
Your goal is to help the user read, modify, or create PDF documents.

**EXECUTION RULE**: 
- If the user's intent is clear (e.g., "Change author to X", "Create a PDF about Y"), **DO NOT ASK FOR CONFIRMATION**. 
- ALso if user says "this file" or "it", it means the latest file uploaded.
- **EXECUTE IMMEDIATELY**.
- Do not say "I will do this, shall I proceed?". JUST DO IT.
- Call the necessary tools (`read_pdf` -> `write_html_to_pdf`) in a single turn if possible.

CAPABILITIES:
1. **Read PDF**: Use `read_pdf` to get the content of a file.
2. **Write/Create PDF**: Use `write_html_to_pdf` to save content as a PDF.

CRITICAL RULES FOR PDF GENERATION/EDITING:
- You CANNOT directly edit a PDF binary. You must READ the text, MODIFY the text, and then WRITE a NEW PDF.
- When creating or modifying document content, you MUST generate **valid, professional HTML5**.
- **ALWAYS** include a `<style>` block in your HTML.
- **STYLE PRESERVATION (CRITICAL)**: 
    - If modifying an existing document, try to MIMIC the original font style (Serif vs. Sans-Serif) and layout as much as possible based on the text content.
    - If the original text feels academic (dense paragraphs, citations), use **Times New Roman** or similar Serif fonts.
    - If the original text feels modern/business (short paragraphs, bullet points), use **Arial** or **Helvetica**.
    - If uncertain, default to a clean **Arial** (Sans-Serif) for readability.
- **NEVER** return markdown code blocks (like ```html) to the tool. Pass the raw HTML string directly to `write_html_to_pdf`.
- **RAG vs FILE**: **IGNORE** RAG snippets for editing. Call `read_pdf` first.

- **LAYOUT & STYLE (CRITICAL)**: 
    - Your goal is to **PRESERVE** the original document's "identity".
    - Analyze the text content and structure to INFER the original font (Serif vs Sans-Serif), layout (centered titles, columns?), and tone.
    - **Generate your own <style> block** that best reconstructs this inferred style. 
    - Do not default to a specific template unless you are sure it matches the content.
    - Ensure margins and font sizes look professional (e.g., 10-12pt body text).

CONTEXT:
 The user may be referring to a specific "latest file". If provided in the user prompt, prioritizing working with that file if the user says "this file" or "it".
"""

async def run_agent(
    message: str,
    history: List[Dict[str, str]] = [],
    model_name: str = "gemini-2.5-flash-lite",
    api_key: Optional[str] = None,
    api_endpoint: Optional[str] = None,
    latest_file: Optional[str] = None
) -> Dict[str, Any]:
    """
    Run the agentic workflow using LangGraph/LangChain.
    """
    try:

        # 1. Initialize Model
        from model import get_llm
        llm = await get_llm(model_name, api_key, api_endpoint)
        
        # 2. Bind Tools
        # llm_with_tools = llm.bind_tools(tools) # create_react_agent does this
        
        # 3. Prepare State/Messages
        system_msg = SYSTEM_PROMPT
        if latest_file:
            system_msg += f"\n\nCURRENT FILE CONTEXT: The user is working with: '{latest_file}'. YOU MUST USE THIS PATH if the user implies 'this file'. DO NOT ASK FOR THE FILE PATH AGAIN."
        
        # Convert history to LangChain format
        lc_messages = [SystemMessage(content=system_msg)]
        for msg in history:
            if msg['role'] == 'user':
                lc_messages.append(HumanMessage(content=msg['content']))
            elif msg['role'] == 'assistant':
                from langchain_core.messages import AIMessage
                lc_messages.append(AIMessage(content=msg['content']))
        
        lc_messages.append(HumanMessage(content=message))
        
        # 4. Create Agent
        agent_executor = create_react_agent(llm, tools)
        
        # 5. Invoke Agent
        final_state = await agent_executor.ainvoke({"messages": lc_messages})
        
        # 6. Extract Response
        last_message = final_state["messages"][-1]
        response_text = last_message.content
        
        # 7. Check for generated files in tool outputs
        attachments = []
        for msg in final_state["messages"]:
            if isinstance(msg, ToolMessage) and msg.name == "write_html_to_pdf":
                output_path = msg.content
                if output_path and os.path.exists(output_path) and not output_path.startswith("Error"):
                    filename = os.path.basename(output_path)
                    
                    # Get Public URL from env
                    public_api = os.getenv("PUBLIC_API_URL", "http://localhost:4000")
                    url = f"{public_api}/api/chat/files/{filename}"
                    
                    attachments.append({
                        "name": filename,
                        "type": "application/pdf",
                        "url": url
                    })

        return {
            "response": response_text,
            "attachments": attachments,
            "is_error": False
        }

    except Exception as e:
        print(f"Agent Error: {e}")
        return {
            "response": f"I encountered an error processing your request: {str(e)}",
            "attachments": [],
            "is_error": True
        }