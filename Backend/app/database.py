import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://root:@localhost/edutech")
# ambil env dari variabel railway nantinya, jika tidak ada maka gunakan default mysql+pymysql://root:@localhost/edutech

if DATABASE_URL.startswith("mysql://") and "pymysql" not in DATABASE_URL.split("://")[0]:
    DATABASE_URL = DATABASE_URL.replace("mysql://", "mysql+pymysql://", 1)
# memaksa merubah format database URL untuk menjadi mysql+pymysql:// jika tidak ada pymysql di dalamnya, karena sqlalchemy tidak bisa membaca mysql:// saja 


# harus di normalisasi karena sqlalchemy tidak bisa membaca mysql:// saja, harus ada mysql+pymysql://

engine = create_engine(DATABASE_URL)
# engine baru bisa membaca database URL yang sudah di normalisasi SQLAlchemy (dialect+driver://username:password@host:port/database)
# dialect = jenis DBMS (contoh: mysql, postgresql, sqlite)
# driver = pustaka Python yang benar-benar berbicara protokol jaringan ke DBMS itu
# karena menggunakan railway, maka driver yang digunakan adalah pymysql, karena railway menggunakan mysql sebagai DBMS nya

SessionLocal = sessionmaker(bind=engine)
# agar membuat session baru setiap kali ada request baru, karena session tidak bisa di share ke request lain, karena session itu bukan thread safe
# ini juga mendukung asynchronous, karena sessionmaker bisa di bind ke engine yang mendukung asynchronous

Base = declarative_base()
# agar mencatat model database yang dibuat (models.py) ke dalam Base, sehingga bisa di create_all() nanti di main.py