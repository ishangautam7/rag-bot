import os 
from pypdf import PdfReader, PdfWriter
from fpdf import FPDF
from langchain_core.tools import tool

@tool
def read_pdf(file_path: str)->str:
    """
    Read the pdf file and extract the text
    Args: file_path (str) : path to the pdf file
    Returns: str: text from the pdf file
    """
    try:
        reader = PdfReader(file_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        return text
    except Exception as e:
        return str(e)   


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


# @tool
# def create_revised_pdf(copy_path: str, output_path: str)->str:
#     """
#     Create a revised pdf file from the original pdf file with suggestion from AI,
#     fixed grammar and spelling errors, format the document properly in the same 
#     font and style as original file.
#     Args: copy_path (str) : path to the copy of the pdf file
#     output_path (str) : path to the new pdf file
#     Returns: str: path to the new pdf file
#     """
#     try:
#         reader = PdfReader(copy_path)
#         writer = PdfWriter()
#         for page in reader.pages:
#             text = page.extract_text()
            



utils = [read_pdf, create_pdf_copy]