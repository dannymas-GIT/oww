"""Locations database."""
from datetime import datetime
from sqlalchemy import Column, DateTime, Float, Integer, String
from app.db.base_class import Base

class Location(Base):
    __tablename__ = "locations"
    id = Column(Integer, primary_key=True)
    state_code = Column(String(2), nullable=False, index=True)
    zip_code = Column(String(20), nullable=True, index=True)
    city = Column(String(100), nullable=True)
    county = Column(String(100), nullable=True)
    region = Column(String(100), nullable=True, index=True)
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
    social_id = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
