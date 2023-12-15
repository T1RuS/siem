from sqlalchemy import TIMESTAMP, Column, Integer, String
from db.connection_db import Base


class Siem(Base):
    __tablename__ = "siem"

    id = Column(Integer, primary_key=True, index=True)
    hostname = Column(String)
    port = Column(Integer)
    status_code = Column(Integer)
    act_type = Column(String)
    date = Column(TIMESTAMP)
    url = Column(String)
    massage = Column(String)
    