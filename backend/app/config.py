from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    groq_api_key: str = "your_groq_api_key_here"
    groq_extraction_model: str = "gemma2-9b-it"
    groq_reasoning_model: str = "llama-3.3-70b-versatile"
    database_url: str = "postgresql+psycopg2://postgres:postgres@localhost:5432/complaints_db"
    cors_origins: str = "http://localhost:5173,http://localhost:3000"

    class Config:
        env_file = ".env"


settings = Settings()
