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
You are a conservative document editor. Your ONLY job is to modify the provided text according to the user's instruction while maintaining a professional format.

USER INSTRUCTION: "{instruction}"

TASK:
1. Read the original content below.
2. Modify it according to the user's instruction.
3. Convert the modified content into a clean, professional HTML document.
4. Use a <style> block to format it like a research paper (Times New Roman, 12pt, 1 inch margins).
5. Return ONLY the raw HTML code. Start with <html> and end with </html>.
6. Do NOT include any markdown blocks.

ORIGINAL CONTENT (Raw Text):
{pdf_content[:50000]}
... (End of Content)

MODIFIED HTML CONTENT:
"""
        else:
            task_description = f"""
You are a document improver. Your job is to fix grammatical errors and improve readability while formatting the document professionally.

TASK:
1. Read the raw text content below.
2. Improvements grammar and flow.
3. Convert the content into a well-structured HTML document.
4. Add CSS in a <style> block for a clean, academic look.
5. Return ONLY the raw HTML code.

ORIGINAL CONTENT:
{pdf_content[:50000]}

IMPROVED HTML CONTENT:
"""
        
        # 4. Call the AI model
        messages = [
            {"role": "system", "content": "You are an expert research paper formatter and editor."},
            {"role": "user", "content": task_description}
        ]
        
        ai_response = await call_model(
            model_name=model_name,
            messages=messages,
            api_key=api_key,
            api_endpoint=api_endpoint
        )
        
        # Clean markdown
        ai_response = ai_response.replace("```html", "").replace("```", "").strip()
        
        # 5. Write the new PDF using HTML converter
        # We need to reuse the new converter function
        # But `process_pdf` might call `write_pdf` which is the old function.
        # Let's switch to `convert_html_to_pdf`
        write_result = convert_html_to_pdf(ai_response, output_path)
        
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

from xhtml2pdf import pisa
import time

def convert_html_to_pdf(html_content: str, output_path: str) -> str:
    """Convert HTML content to PDF using xhtml2pdf"""
    try:
        with open(output_path, "wb") as f:
            pisa_status = pisa.CreatePDF(html_content, dest=f)
        
        if pisa_status.err:
            return f"Error creating PDF: {pisa_status.err}"
        return f"File saved to {output_path}"
    except Exception as e:
        return f"Error converting HTML to PDF: {str(e)}"

# ... (rest of imports/logic)

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
            
        # 1. Formulate prompt for HTML
        prompt = f"""
You are a research document generator.
USER INSTRUCTION: "{instruction}"

TASK:
1. Generate the FULL content for the document requested by the user.
2. Structure it using HTML5 with semantic tags (h1, h2, p, ul).
3. Include internal CSS in a <style> block to make it look like a professional research paper (Times New Roman font, logical margins, bold headers).
4. Return ONLY the complete HTML code. Start with <html> and end with </html>.
5. Do NOT include any markdown code blocks (like ```html), just the raw HTML code.
"""
        # 2. Call AI
        messages = [{"role": "user", "content": prompt}]
        content = await call_model(model_name, messages, api_key, api_endpoint)
        
        # Clean markdown if present
        content = content.replace("```html", "").replace("```", "").strip()
        
        # 3. Write PDF (HTML -> PDF)
        safe_name = f"gen_{int(time.time())}.pdf"
        output_path = os.path.join(output_dir, safe_name)
        
        write_result = convert_html_to_pdf(content, output_path)
        
        if "Error" in write_result:
             return {"success": False, "summary": write_result}
             
        return {
            "success": True, 
            "output_file": safe_name,
            "summary": f"Generated PDF saved to {safe_name}"
        }
        
    except Exception as e:
        return {"success": False, "summary": str(e)}