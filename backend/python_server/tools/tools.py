import os 
from pypdf import PdfReader, PdfWriter
from fpdf import FPDF
from langchain_core.tools import tool
from xhtml2pdf import pisa
import time
import fitz  # PyMuPDF

@tool
def read_pdf(file_path: str)->str:
    """
    Read the pdf file and extract the content as HTML to preserve structure/formatting.
    Args: file_path (str) : path to the pdf file
    Returns: str: HTML representation of the pdf content
    """
    try:
        doc = fitz.open(file_path)
        text = ""
        for page in doc:
            # get_text("html") preserves font info, layout as HTML/CSS
            text += page.get_text("html") + "\n<hr>\n"
        return text
    except Exception as e:
        return f"Error reading PDF: {str(e)}"   


@tool
def create_pdf_copy(file_path: str, output_path: str)->str:
    """
    Creates a copy of the original pdf given by user so that changes can be made to the new file
    Args: file_path (str) : path to the pdf file
    output_path (str) : path to the new pdf file
    Returns: str: path to the new pdf file
    """

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
def write_html_to_pdf(html_content: str, output_filename: str = None) -> str:
    """
    Converts HTML content to a PDF file.
    Args:
        html_content (str): The full HTML content (including <style>) to convert.
        output_filename (str, optional): Desired filename. If None, a timestamped name is generated.
    Returns:
        str: The absolute path to the saved PDF file.
    """
    try:
        from services import rag_service
        output_dir = rag_service.UPLOAD_FOLDER
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
            
        if not output_filename:
            output_filename = f"gen_{int(time.time())}.pdf"
            
        # Ensure extension
        if not output_filename.endswith('.pdf'):
            output_filename += '.pdf'
            
        output_path = os.path.join(output_dir, os.path.basename(output_filename))
        
        with open(output_path, "wb") as f:
            pisa_status = pisa.CreatePDF(html_content, dest=f)
            
        if pisa_status.err:
            return f"Error creating PDF: {pisa_status.err}"
            
        return output_path
    except Exception as e:
        return f"Error converting HTML to PDF: {str(e)}"

utils = [read_pdf, create_pdf_copy, write_html_to_pdf]