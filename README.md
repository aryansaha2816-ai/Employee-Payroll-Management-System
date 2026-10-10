# Employee Payroll Management System

A Django and MySQL employee payroll application. The active application uses Django views, Django templates, HTML, and CSS. The previous React/Vite frontend and Express backend are preserved under `legacy/` and are not required to run Django.

## Features

- Session-based authentication, CSRF protection, and protected application pages
- Employee management with department assignment, search, details, and safe deletion
- Department management and employee counts
- Attendance records with employee/date duplicate validation and status summaries
- Leave applications with date validation, status filtering, approval, and rejection
- Payroll generation, editing, duplicate employee/month validation, filtering, and summaries
- Payslip listing, details, and browser printing
- Employee, attendance, leave, payroll, salary, and department reports

## Technology

- Python
- Django 5.2
- MySQL with `mysqlclient`
- Django Templates, HTML5, and CSS3

## Project Layout

```text
Employee Payroll Management System/
├── backend/
│   ├── manage.py
│   ├── payroll_system/
│   ├── payroll/
│   ├── templates/
│   ├── static/css/style.css
│   ├── requirements.txt
│   ├── .env                 # local secrets; ignored by Git
│   └── .env.example         # safe placeholder configuration
├── legacy/
│   ├── old_react_frontend/
│   └── old_node_backend/
├── DBMS_FEATURES.md
└── README.md
```

The Django models map the existing, unmanaged tables. Do not run migrations that create or alter the legacy business tables. The legacy archive is retained for reference and is not part of the Django runtime.

## Existing Database Tables

The app maps these MySQL tables:

- `Employees`
- `Departments`
- `Attendance`
- `Leave_Record`
- `Payroll`

The project expects the existing `calculate_net_salary` trigger and `InsertEmployee` procedure to remain unchanged. Payroll net salary is read from the value stored in MySQL.

## Configuration

From PowerShell, change to the backend directory:

```powershell
cd "C:\Users\HP\OneDrive\Desktop\Employee Payroll Management System\backend"
Copy-Item .env.example .env
```

Set the local values in `backend/.env`:

```dotenv
DB_NAME=payroll
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_HOST=localhost
DB_PORT=3306
DJANGO_SECRET_KEY=replace_with_a_private_random_value
DJANGO_DEBUG=true
DJANGO_ALLOWED_HOSTS=127.0.0.1,localhost
```

Use your local MySQL account and keep real values private. `backend/.env` is listed in `backend/.gitignore`; do not commit it. `.env.example` contains placeholders only.

## Install and Run

From `backend/`, create/use a Python virtual environment and install the dependencies:

```powershell
python -m venv ..\.venv
..\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

If `..\.venv` already exists, use its interpreter directly. Then run the non-migrating system check and start Django:

```powershell
..\.venv\Scripts\python.exe manage.py check
..\.venv\Scripts\python.exe manage.py runserver
```

Open `http://127.0.0.1:8000/login/`. The existing database must be available and contain the Django authentication/session tables as well as the payroll tables. No `makemigrations` or `migrate` command is required for normal startup or verification of the unmanaged business tables.

## Main URLs

- `/login/` — sign in
- `/logout/` — sign out using a CSRF-protected POST
- `/dashboard/` — database-backed dashboard
- `/employees/` — employee list, search, add, detail, edit, and delete
- `/departments/` — department list, search, add, detail, edit, and delete
- `/attendance/` — attendance list, filters, add, edit, and delete
- `/leaves/` — leave list, filters, apply, edit, approve, reject, and delete
- `/payroll/` — payroll list, filters, add, detail, edit, and delete
- `/payslip/` — filter and select existing payroll records
- `/payslip/<payroll_id>/` — printable payslip details
- `/reports/` — employee, attendance, leave, payroll, salary, and department reports

Application pages other than login require authentication. Forms that change data use POST and CSRF protection.

## DBMS Concepts

The application uses primary keys to identify rows and ORM relationships to represent employee, department, attendance, leave, and payroll associations. `select_related()` loads single-valued related rows through SQL joins. Django `filter()` expressions provide server-side WHERE conditions. `Count()` and `Sum()` provide report aggregations. The existing MySQL trigger calculates payroll net salary; Django does not accept a user-entered net salary or duplicate the trigger calculation. The existing procedure and live schema checks are documented in [DBMS_FEATURES.md](DBMS_FEATURES.md).

## Verification

From `backend/`, run:

```powershell
..\.venv\Scripts\python.exe manage.py check
..\.venv\Scripts\python.exe manage.py inspect_payroll_schema
..\.venv\Scripts\python.exe manage.py runserver
```

`inspect_payroll_schema` performs read-only metadata queries. Verify login, logout, protected-page redirects, CRUD forms, filters, summaries, payslips, reports, and printing through the browser. Do not submit destructive tests against data that must be preserved. Never use schema-changing or destructive SQL for routine verification.
