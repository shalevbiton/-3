import tkinter as tk
from tkinter import ttk, messagebox
import sqlite3
from datetime import datetime

# הגדרת שם קובץ מסד הנתונים
DB_FILE = 'evidence_gui.db'

def init_db():
    """
    אתחול מסד הנתונים ויצירת הטבלה הנדרשת.
    """
    conn = sqlite3.connect(DB_FILE)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS phone_evidence (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            case_number TEXT,
            delivered_by TEXT,
            authority TEXT,
            received_by TEXT,
            manufacturer TEXT,
            model TEXT,
            color TEXT,
            imei TEXT UNIQUE,
            condition TEXT,
            has_sim BOOLEAN,
            has_sd BOOLEAN,
            has_case BOOLEAN,
            has_cable BOOLEAN,
            internal_barcode TEXT,
            notes TEXT,
            timestamp TEXT
        )
    ''')
    conn.commit()
    conn.close()

class PhoneReceptionApp:
    def __init__(self, root):
        self.root = root
        self.root.title("L.E.M.S - עמדת קליטת סלולר")
        self.root.geometry("600x750")
        
        # הגדרת סגנון כללי
        style = ttk.Style()
        style.configure("TLabel", font=("Arial", 11))
        style.configure("TButton", font=("Arial", 11, "bold"))
        style.configure("TCheckbutton", font=("Arial", 10))

        # מסגרת ראשית עם ריפוד
        main_frame = ttk.Frame(root, padding="20")
        main_frame.pack(fill=tk.BOTH, expand=True)

        # כותרת
        header = ttk.Label(main_frame, text="טופס קליטת מכשיר סלולרי", font=("Arial", 16, "bold", "underline"))
        header.pack(pady=(0, 20))

        # --- יצירת טופס קלט ---
        # אנו נשתמש ב-Grid כדי למקם תוויות מימין ושדות משמאל (RTL סימולציה)
        self.form_frame = ttk.Frame(main_frame)
        self.form_frame.pack(fill=tk.BOTH, expand=True)

        # משתנים לשמירת המידע
        self.vars = {
            'case_number': tk.StringVar(),
            'delivered_by': tk.StringVar(),
            'authority': tk.StringVar(value="משטרת ישראל"),
            'received_by': tk.StringVar(),
            'manufacturer': tk.StringVar(),
            'model': tk.StringVar(),
            'color': tk.StringVar(),
            'imei': tk.StringVar(),
            'condition': tk.StringVar(),
            'has_sim': tk.BooleanVar(),
            'has_sd': tk.BooleanVar(),
            'has_case': tk.BooleanVar(),
            'has_cable': tk.BooleanVar(),
            'notes': tk.StringVar()
        }

        # רשימת השדות ליצירה בלולאה (תווית, שם משתנה, האם חובה)
        fields = [
            ("מספר תיק *", 'case_number', True),
            ("שם המוסר *", 'delivered_by', True),
            ("סמכות מוסרת", 'authority', False),
            ("שם הקולט (המשתמש)", 'received_by', False),
            ("--- פרטי מכשיר ---", None, False),
            ("יצרן (מותג)", 'manufacturer', False),
            ("דגם", 'model', False),
            ("צבע", 'color', False),
            ("מספר סידורי / IMEI *", 'imei', True),
            ("מצב פיזי", 'condition', False),
            ("הערות נוספות", 'notes', False)
        ]

        row = 0
        for label_text, var_name, is_mandatory in fields:
            if var_name is None:
                # כותרת ביניים
                sep = ttk.Label(self.form_frame, text=label_text, font=("Arial", 10, "bold"), foreground="blue")
                sep.grid(row=row, column=0, columnspan=2, pady=(15, 5), sticky="e")
            else:
                # תווית מימין
                lbl = ttk.Label(self.form_frame, text=label_text, foreground="red" if is_mandatory else "black")
                lbl.grid(row=row, column=1, sticky="e", padx=(10, 0), pady=5)
                
                # שדה קלט משמאל
                entry = ttk.Entry(self.form_frame, textvariable=self.vars[var_name], justify="right")
                entry.grid(row=row, column=0, sticky="ew", pady=5)
            
            row += 1

        self.form_frame.columnconfigure(0, weight=1)

        # --- תיבות סימון (Checkboxes) ---
        checks_frame = ttk.LabelFrame(main_frame, text="אביזרים נלווים ומדיה", padding=10)
        checks_frame.pack(fill=tk.X, pady=15)
        
        # סידור התיבות בשורה
        ttk.Checkbutton(checks_frame, text="כרטיס SIM", variable=self.vars['has_sim']).pack(side=tk.RIGHT, padx=10)
        ttk.Checkbutton(checks_frame, text="כרטיס זיכרון", variable=self.vars['has_sd']).pack(side=tk.RIGHT, padx=10)
        ttk.Checkbutton(checks_frame, text="מגן / כיסוי", variable=self.vars['has_case']).pack(side=tk.RIGHT, padx=10)
        ttk.Checkbutton(checks_frame, text="כבל הטענה", variable=self.vars['has_cable']).pack(side=tk.RIGHT, padx=10)

        # --- כפתור שמירה ---
        save_btn = ttk.Button(main_frame, text="שמור וקלוט מוצג", command=self.save_record)
        save_btn.pack(fill=tk.X, pady=10, ipady=5)

    def save_record(self):
        """
        לוגיקה לשמירת הנתונים: ולידציה, בדיקת כפילות, יצירת ברקוד ושמירה ל-DB.
        """
        data = {k: v.get() for k, v in self.vars.items()}

        # 1. ולידציה לשדות חובה
        if not data['case_number'] or not data['delivered_by'] or not data['imei']:
            messagebox.showerror("שגיאה", "אנא מלא את כל שדות החובה המסומנים בכוכבית (*)")
            return

        conn = sqlite3.connect(DB_FILE)
        cursor = conn.cursor()

        # 2. בדיקת כפילות (IMEI)
        try:
            cursor.execute("SELECT id FROM phone_evidence WHERE imei = ?", (data['imei'],))
            if cursor.fetchone():
                messagebox.showerror("שגיאה", "שגיאה: מכשיר עם מספר סידורי זה כבר קיים במערכת")
                conn.close()
                return

            # 3. הערות אוטומטיות למדיה נשלפת
            final_notes = data['notes']
            if data['has_sim'] or data['has_sd']:
                suffix = " [מכיל מדיה נשלפת!]"
                if suffix not in final_notes:
                    final_notes += suffix

            # חותמת זמן
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

            # הכנסה ראשונית כדי לקבל ID
            cursor.execute('''
                INSERT INTO phone_evidence (
                    case_number, delivered_by, authority, received_by,
                    manufacturer, model, color, imei, condition,
                    has_sim, has_sd, has_case, has_cable,
                    notes, timestamp
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                data['case_number'], data['delivered_by'], data['authority'], data['received_by'],
                data['manufacturer'], data['model'], data['color'], data['imei'], data['condition'],
                data['has_sim'], data['has_sd'], data['has_case'], data['has_cable'],
                final_notes, timestamp
            ))

            new_id = cursor.lastrowid

            # 4. יצירת ברקוד
            current_year = datetime.now().year
            barcode = f"{current_year}-{data['case_number']}-{new_id}"
            
            # עדכון הברקוד ברשומה
            cursor.execute("UPDATE phone_evidence SET internal_barcode = ? WHERE id = ?", (barcode, new_id))
            
            conn.commit()
            
            # 5. הודעת הצלחה וניקוי
            messagebox.showinfo("הצלחה", f"המוצג נקלט בהצלחה!\nברקוד פנימי: {barcode}")
            self.clear_form()

        except sqlite3.Error as e:
            messagebox.showerror("שגיאה במסד נתונים", str(e))
        finally:
            conn.close()

    def clear_form(self):
        """
        איפוס הטופס לקליטה חדשה.
        """
        for key, var in self.vars.items():
            if isinstance(var, tk.BooleanVar):
                var.set(False)
            else:
                # שמירה על ערכים מסוימים כברירת מחדל
                if key == 'authority':
                    var.set("משטרת ישראל")
                else:
                    var.set("")

if __name__ == "__main__":
    # אתחול ה-DB
    init_db()
    
    # הפעלת ה-GUI
    root = tk.Tk()
    
    # ניסיון להגדיר כיוון כללי לחלון (עובד חלקית במערכות הפעלה מסוימות)
    try:
        root.tk.call('tk', 'windowingsystem')  
    except:
        pass

    app = PhoneReceptionApp(root)
    root.mainloop()
