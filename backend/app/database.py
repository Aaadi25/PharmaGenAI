from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from .config import settings

# Works with MySQL out of the box (via pymysql).
# For Postgres instead: pip install psycopg2-binary, and set
# DATABASE_URL=postgresql+psycopg2://user:pass@host:5432/complaints_db
engine = create_engine(settings.database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
