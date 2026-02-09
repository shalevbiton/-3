import sqlite3
from datetime import datetime

# הגדרת שם קובץ מסד הנתונים
DB_FILE = 'evidence.db'

def create_table():
    """
    פונקציה לאתחול מסד הנתונים ויצירת טבלת הטלפונים.
    """
    try:
        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()
        
        # יצירת הטבלה עם כל העמודות הנדרשות
        # unique_id מוגדר כ-UNIQUE כדי למנוע כפילויות ברמת ה-DB
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS phone_evidence (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                case_number TEXT NOT NULL,
                delivered_by TEXT NOT NULL,
                authority TEXT,
                received_by TEXT,
                timestamp TEXT,
                manufacturer TEXT,
                model TEXT,
                color TEXT,
                unique_id TEXT NOT NULL UNIQUE,
                airplane_mode BOOLEAN,
                passcode TEXT,
                condition TEXT,
                has_sim BOOLEAN,
                has_sd_card BOOLEAN,
                has_case BOOLEAN,
                has_cable BOOLEAN,
                internal_barcode TEXT,
                notes TEXT
            )
        ''')
        
        conn.commit()
        print("מסד הנתונים אותחל והטבלה 'phone_evidence' מוכנה לשימוש.")
    except sqlite3.Error as e:
        print(f"שגיאה ביצירת הטבלה: {e}")
    finally:
        if conn:
            conn.close()

def register_new_phone(phone_data):
    """
    פונקציה לקליטת מכשיר טלפון חדש.
    מבצעת ולידציות מחמירות, לוגיקה עסקית ושמירה.
    """
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()

    # --- שלב 1: בדיקת שדות חובה (Mandatory Fields) ---
    # מוודאים שמספר תיק, שם המוסר, ומזהה ייחודי (IMEI) אינם ריקים
    if not phone_data.get('case_number') or \
       not phone_data.get('delivered_by') or \
       not phone_data.get('unique_id'):
        print("שגיאה: שדות חובה חסרים (מספר תיק, מוסר, או מזהה ייחודי).")
        conn.close()
        return

    # --- שלב 2: בדיקת כפילות (Duplicate Check) ---
    # שאילתה לבדוק האם ה-IMEI כבר קיים בטבלה
    unique_id = phone_data['unique_id']
    cursor.execute("SELECT id FROM phone_evidence WHERE unique_id = ?", (unique_id,))
    if cursor.fetchone():
        print("שגיאה: מכשיר עם מספר סידורי זה כבר קיים במערכת.")
        conn.close()
        return

    # --- שלב 3: לוגיקה למדיה נשלפת (Removable Media Logic) ---
    # אם המכשיר מכיל SIM או כרטיס זיכרון, מוסיפים הערה באופן אוטומטי
    notes = phone_data.get('notes', '')
    if phone_data.get('has_sim') or phone_data.get('has_sd_card'):
        # הוספת הטקסט בעברית אם הוא לא קיים כבר
        if "מכיל מדיה נשלפת!" not in notes:
            notes += " מכיל מדיה נשלפת!"
    
    # הכנת חותמת זמן נוכחית
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    try:
        # ביצוע שמירה ראשונית (INSERT)
        cursor.execute('''
            INSERT INTO phone_evidence (
                case_number, delivered_by, authority, received_by, timestamp,
                manufacturer, model, color, unique_id,
                airplane_mode, passcode, condition,
                has_sim, has_sd_card, has_case, has_cable,
                notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            phone_data['case_number'],
            phone_data['delivered_by'],
            phone_data.get('authority'),
            phone_data.get('received_by'),
            timestamp,
            phone_data.get('manufacturer'),
            phone_data.get('model'),
            phone_data.get('color'),
            unique_id,
            phone_data.get('airplane_mode', False),
            phone_data.get('passcode'),
            phone_data.get('condition'),
            phone_data.get('has_sim', False),
            phone_data.get('has_sd_card', False),
            phone_data.get('has_case', False),
            phone_data.get('has_cable', False),
            notes
        ))
        
        # קבלת ה-ID האוטומטי שנוצר עבור הרשומה החדשה
        new_id = cursor.lastrowid
        
        # --- שלב 4: יצירת ברקוד (Barcode Generation) ---
        # פורמט הברקוד: YEAR-CASE-ID (לדוגמה: 2024-505-1)
        current_year = datetime.now().year
        case_num = phone_data['case_number']
        barcode = f"{current_year}-{case_num}-{new_id}"
        
        # עדכון הרשומה עם הברקוד שנוצר
        cursor.execute("UPDATE phone_evidence SET internal_barcode = ? WHERE id = ?", (barcode, new_id))
        
        conn.commit()
        print(f"הטלפון נקלט בהצלחה. ברקוד המערכת: {barcode}")
        
    except sqlite3.Error as e:
        print(f"שגיאה בשמירה למסד הנתונים: {e}")
    finally:
        conn.close()

# --- בלוק ראשי לסימולציה (Main Execution Block) ---
if __name__ == "__main__":
    # 1. יצירת הטבלה והמסד
    create_table()
    
    print("\n--- בדיקה 1: קליטת מכשיר תקין ---")
    # נתונים לדוגמה (מקרה תקין)
    valid_phone = {
        'case_number': '505',
        'delivered_by': 'השוטר אזולאי',
        'authority': 'משטרת ישראל',
        'received_by': 'חוקר ראשי כהן',
        'manufacturer': 'Samsung',
        'model': 'Galaxy S22',
        'color': 'שחור',
        'unique_id': 'IMEI-123456789012345', # IMEI
        'airplane_mode': True,
        'passcode': '1234',
        'condition': 'מסך שבור',
        'has_sim': True,      # זה יפעיל את הטריגר של "מכיל מדיה נשלפת"
        'has_sd_card': False,
        'has_case': True,
        'has_cable': False,
        'notes': 'התקבל בשקית ראיות מסומנת.'
    }
    
    # הפעלת פונקציית הקליטה
    register_new_phone(valid_phone)
    
    print("\n--- בדיקה 2: ניסיון קליטה כפול (בדיקת IMEI) ---")
    # ניסיון להכניס את אותו מכשיר שוב (אמור להיכשל)
    register_new_phone(valid_phone)
    
    print("\n--- בדיקה 3: שדות חובה חסרים ---")
    # נתונים חסרים (ללא מספר תיק)
    invalid_phone = {
        'case_number': '', # שדה ריק - שגיאה
        'delivered_by': 'פלוני אלמוני',
        'unique_id': 'IMEI-999'
    }
    register_new_phone(invalid_phone)
