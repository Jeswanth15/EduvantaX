import mysql.connector

try:
    conn = mysql.connector.connect(
        host="localhost",
        user="root",
        password="root",
        database="edu_ml"
    )
    cursor = conn.cursor()
    cursor.execute("ALTER TABLE users MODIFY COLUMN role ENUM('STUDENT', 'TEACHER', 'PRINCIPAL', 'SCHOOLADMIN', 'ADMIN', 'DRIVER')")
    conn.commit()
    print("SUCCESS")
except Exception as e:
    print("FAILED:", e)
finally:
    if 'cursor' in locals():
        cursor.close()
    if 'conn' in locals() and conn.is_connected():
        conn.close()
