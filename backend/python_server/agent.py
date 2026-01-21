"""
PDF Processing Agent
Handles PDF modification based on user instructions or auto-improvement.
"""
import os
import asyncio
from typing import Optional
from dotenv import load_dotenv
from pypdf import PdfReader
from fpdf import FPDF
from model import call_model

load_dotenv()

def read_pdf(file_path: str) -> str:
    """Read the pdf file and extract the text"""
    try:
        reader = PdfReader(file_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        return text
    except Exception as e:
        return f"Error reading PDF: {str(e)}"

def write_pdf(file_path: str, content: str) -> str:
    """Writes new text content to a PDF file"""
    try:
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Arial", size=12)
        # FPDF issues with utf-8, simple workaround for latin-1
        safe_content = content.encode('latin-1', 'replace').decode('latin-1')
        pdf.multi_cell(0, 10, txt=safe_content)
        pdf.output(file_path)
        return f"File saved to {file_path}"
    except Exception as e:
        return f"Error writing PDF: {str(e)}"

async def process_pdf(
    file_path: str,
    instruction: str = "",
    model_name: str = "gemini-2.5-flash-lite",
    api_key: Optional[str] = None,
    api_endpoint: Optional[str] = None
) -> dict:
    """
    Process a PDF file with AI assistance.
    
    Args:
        file_path: Path to input PDF
        instruction: User instruction (empty for auto-fix mode)
        model_name: AI model to use
        api_key: Optional API key
        api_endpoint: Optional custom endpoint
    
    Returns:
        dict with 'output_file', 'summary', and 'success' keys
    """
    try:
        # 1. Read the input PDF
        pdf_content = read_pdf(file_path)
        
        if "Error reading PDF" in pdf_content:
            return {
                "output_file": None,
                "summary": f"Could not read file: {file_path}",
                "success": False
            }
        
        if len(pdf_content.strip()) < 50:
            return {
                "output_file": None,
                "summary": "The PDF appears to be empty or contains only images (scanned). This tool only works with text-selectable PDFs.",
                "success": False
            }
        
        # 3. Determine output path
        output_path = file_path.replace(".pdf", "_modified.pdf")
        if output_path == file_path:
            output_path = file_path.rsplit(".", 1)[0] + "_modified.pdf"
        
        # 4. Formulate the prompt
        if instruction:
            task_description = f"""
You are a conservative text editor. Your ONLY job is to modify the provided text according to the user's instruction.

USER INSTRUCTION: "{instruction}"

CRITICAL RULES:
1. RETAIN the original document's structure, topic, and content exactly, UNLESS specifically asked to change it.
2. Do NOT generate new content from scratch. Do NOT hallucinate a completely different document.
3. If the user asks to change a name (e.g., "Change author to X"), ONLY change that name. Keep everything else (Abstract, Introduction, etc.) IDENTICAL.
4. Input text might be messy (extracted from PDF). Do your best to clean up broken lines but KEEP THE WORDS THE SAME.

ORIGINAL CONTENT (Start):
{pdf_content[:50000]}
... (End of Content)

MODIFIED CONTENT (return the full text for the new PDF):
"""
        else:
            task_description = f"""
You are a text editor. Your job is to fix grammatical errors and improve readability while STRICTLY preserving the original meaning and structure.

CRITICAL RULES:
1. Do NOT change the topic or content.
2. Do NOT generate a new document.
3. RETAIN all sections, headers, and key information.

ORIGINAL CONTENT:
{pdf_content[:50000]}

IMPROVED CONTENT:
"""
        
        # 4. Call the AI model
        messages = [
            {"role": "system", "content": "You are an expert PDF content editor."},
            {"role": "user", "content": task_description}
        ]
        
        ai_response = await call_model(
            model_name=model_name,
            messages=messages,
            api_key=api_key,
            api_endpoint=api_endpoint
        )
        
        # 5. Write the new PDF
        write_result = write_pdf(output_path, ai_response)
        
        if "Error" in write_result:
            return {
                "output_file": None,
                "summary": write_result,
                "success": False
            }
        
        # 6. Return success
        return {
            "output_file": output_path,
            "summary": f"Successfully processed PDF. Output saved to: {output_path}",
            "success": True
        }
        
    except Exception as e:
        return {
            "output_file": None,
            "summary": f"Error processing PDF: {str(e)}",
            "success": False
        }

# Synchronous wrapper for non-async contexts
def process_pdf_sync(
    file_path: str,
    instruction: str = "",
    model_name: str = "gemini-2.5-flash-lite",
    api_key: Optional[str] = None,
    api_endpoint: Optional[str] = None
) -> dict:
    """Synchronous wrapper for process_pdf."""
    return asyncio.run(process_pdf(file_path, instruction, model_name, api_key, api_endpoint))

async def generate_pdf(
    instruction: str,
    output_filename: str = "generated_doc.pdf",
    model_name: str = "gemini-2.5-flash-lite",
    api_key: Optional[str] = None,
    api_endpoint: Optional[str] = None
) -> dict:
    """
    Generate a new PDF based on user instruction.
    """
    try:
        from services import rag_service
        output_dir = rag_service.UPLOAD_FOLDER
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
            
        # 1. Formulate prompt
        prompt = f"""
You are a document generator.
USER INSTRUCTION: "{instruction}"

TASK:
1. Generate the full content for the document requested by the user.
2. Format it professionally.
3. Return ONLY the text content of the document.
4. Do NOT include markdown code blocks, just the text.
"""
        # 2. Call AI
        messages = [{"role": "user", "content": prompt}]
        content = await call_model(model_name, messages, api_key, api_endpoint)
        
        # 3. Write PDF
        # Ensure filename is safe
        import time
        safe_name = f"gen_{int(time.time())}.pdf"
        output_path = os.path.join(output_dir, safe_name)
        
        write_result = write_pdf(output_path, content)
        
        if "Error" in write_result:
             return {"success": False, "summary": write_result}
             
        return {
            "success": True, 
            "output_file": safe_name,
            "summary": f"Generated PDF saved to {safe_name}"
        }
        
    except Exception as e:
        return {"success": False, "summary": str(e)}