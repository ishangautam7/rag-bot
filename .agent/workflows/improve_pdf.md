---
description: Auto-improve or modify a PDF file based on user instructions
---

This workflow allows you to submit a PDF file for intelligent modification. The system can either automatically improve the document (grammar, clarity) or follow specific user instructions.

### Prerequisites

Ensure the python server dependencies are installed.

```bash
pip install -r backend/python_server/requirements.txt
```

### Usage (Python Interface)

The agent is designed to be called from the `backend/python_server/agent.py` module.

**1. Import the processor:**

```python
from backend.python_server.agent import process_pdf
```

**2. Run with specific instructions:**

```python
result = process_pdf(
    file_path="path/to/document.pdf", 
    instruction="Rewrite the introduction to be more professional and change the tone to formal.",
    model_name="gemini-1.5-pro"
)
print(f"New File: {result['output_file']}")
print(f"Summary: {result['summary']}")
```

**3. Run in Auto-Fix mode:**

If you provide no instruction, the agent will automatically look for and fix errors.

```python
result = process_pdf(
    file_path="path/to/draft.pdf",
    instruction="" # Empty string triggers auto-fix
)
```

### Integration Notes

*   **Model Selection**: You can pass the model name (e.g., `gemini-1.5-flash`, `gpt-4o`) dynamically.
*   **Output**: The function returns a dictionary with the path to the modified file (`_modified.pdf`) and a text summary of what was done.
*   **Centralized Model**: All model initializations use `backend/python_server/model.py`.
