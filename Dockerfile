FROM python:3.11-slim

# Set working directory
WORKDIR /code

# Copy the requirements file
COPY ./backend/requirements.txt /code/requirements.txt

# Install dependencies
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

# Copy the backend code
COPY ./backend /code/backend

# Expose the port FastAPI runs on
EXPOSE 7860

# Command to run the application (Hugging Face routes to port 7860 by default)
CMD ["uvicorn", "backend.app.main:app", "--host", "0.0.0.0", "--port", "7860"]
