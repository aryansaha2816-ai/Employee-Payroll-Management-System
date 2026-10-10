# DBMS Features and Django ORM

## Existing Database

The Django app maps the existing MySQL tables `Employees`, `Departments`, `Attendance`, `Leave_Record`, and `Payroll`. Their model `Meta` classes use `managed = False`; Django does not create or alter these tables. Do not run migrations for these legacy tables as part of normal verification.

The model declarations map these primary keys:

| Table | Django model | Declared primary key |
| --- | --- | --- |
| Employees | `Employee` | `emp_id` |
| Departments | `Department` | `department_id` |
| Attendance | `Attendance` | `attendance_id` |
| Leave_Record | `LeaveRecord` | `leave_id` |
| Payroll | `Payroll` | `payroll_id` |

These are verified against the Django model definitions. The live MySQL primary keys and foreign-key constraints require the read-only metadata queries below; the database could not be contacted in the current development environment because Django is not installed in its active Python interpreter.

## Keys and Data Integrity

The ORM exposes these intended relationships:

| Relationship | Django field / reverse name |
| --- | --- |
| Employees.department_id -> Departments.department_id | `Employee.department` / `Department.employees` |
| Attendance.emp_id -> Employees.emp_id | `Attendance.emp` / `Employee.attendance_records` |
| Leave_Record.emp_id -> Employees.emp_id | `LeaveRecord.emp` / `Employee.leave_records` |
| Payroll.emp_id -> Employees.emp_id | `Payroll.emp` / `Employee.payroll_records` |

Important constraint distinction: `Employee.department` has `db_constraint=False` because the legacy model documents that this MySQL foreign key is not declared. `EmployeeForm` uses a `ModelChoiceField`, so the normal form rejects a department that does not exist, but the database and arbitrary direct ORM writes are not protected by this field setting. `AttendanceForm`, `LeaveForm`, and `PayrollForm` also validate employee selections through `ModelChoiceField`. Their Django foreign-key declarations do not prove that matching constraints exist in the live database: all these models are unmanaged, so Django does not create the constraints.

Payroll duplicate employee/month validation is application-level in `PayrollForm.clean()`. It rejects a second record for the same employee and month without adding a database uniqueness constraint.

To inspect live keys using read-only metadata queries:

```sql
SELECT TABLE_NAME, COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
  AND CONSTRAINT_NAME = 'PRIMARY'
  AND TABLE_NAME IN ('Employees', 'Departments', 'Attendance', 'Leave_Record', 'Payroll')
ORDER BY TABLE_NAME;

SELECT TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN ('Employees', 'Departments', 'Attendance', 'Leave_Record', 'Payroll')
  AND REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY TABLE_NAME, COLUMN_NAME;
```

To check for orphaned non-null references without changing data:

```sql
SELECT COUNT(*) AS orphaned_employee_departments
FROM Employees e
LEFT JOIN Departments d ON d.department_id = e.department_id
WHERE e.department_id IS NOT NULL AND d.department_id IS NULL;

SELECT COUNT(*) AS orphaned_attendance_employees
FROM Attendance a
LEFT JOIN Employees e ON e.emp_id = a.emp_id
WHERE a.emp_id IS NOT NULL AND e.emp_id IS NULL;

SELECT COUNT(*) AS orphaned_leave_employees
FROM Leave_Record l
LEFT JOIN Employees e ON e.emp_id = l.emp_id
WHERE l.emp_id IS NOT NULL AND e.emp_id IS NULL;

SELECT COUNT(*) AS orphaned_payroll_employees
FROM Payroll p
LEFT JOIN Employees e ON e.emp_id = p.emp_id
WHERE p.emp_id IS NOT NULL AND e.emp_id IS NULL;
```

## SQL Joins and ORM

A JOIN combines columns from related tables. The Django models express the join paths, and `select_related()` asks Django to fetch single-valued foreign-key relationships with SQL joins in the same query:

| Data needed | Django ORM example | SQL join concept |
| --- | --- | --- |
| Employee + Department | `Employee.objects.select_related("department")` | Employees joined to Departments on `department_id` |
| Employee + Attendance | `Attendance.objects.select_related("emp")` | Attendance joined to Employees on `emp_id` |
| Employee + Leave_Record | `LeaveRecord.objects.select_related("emp")` | Leave_Record joined to Employees on `emp_id` |
| Employee + Payroll | `Payroll.objects.select_related("emp")` | Payroll joined to Employees on `emp_id` |
| Employee + Payroll + Department | `Payroll.objects.select_related("emp", "emp__department")` | Payroll joined to Employees, then Departments |

An INNER JOIN returns only rows with matching records on both sides. A LEFT JOIN returns every row from the left table and matching right-side data when present. The employee foreign-key fields in these models are nullable, so `select_related()` can use an outer join and preserve records whose related object is missing. The exact live join behavior and database constraints should be checked against the existing schema and data.

`filter()` is the ORM equivalent of a SQL `WHERE` condition. For example, `Payroll.objects.filter(month="2026-10")` filters payroll rows for one month. The reports view uses GET parameters and ORM filters for employee, department, designation, status, month, and date ranges; it does not concatenate user input into SQL.

## Aggregation

An aggregate summarizes multiple rows. The reports use Django ORM aggregation instead of handwritten data queries:

- Department employee totals use `Department.objects.annotate(employee_count=Count("employees", distinct=True))`, conceptually a `GROUP BY department` with `COUNT(employee)`.
- Attendance summaries use conditional `Count()` expressions for total, present, and absent records after applying the selected filters.
- Leave summaries use conditional `Count()` expressions for pending, approved, and rejected records.
- Payroll totals use `Count("payroll_id")` and `Sum()` for basic salary, bonus, deductions, and the stored `net_salary`.

`Count()` counts matching rows. `Sum()` adds a numeric column over matching rows. Django returns `None` for an empty sum; the reports convert empty summary values to zero for display.

## Trigger and Stored Procedure

The application does not calculate or accept a user-entered `net_salary`. The Payroll form excludes that field, the views reload it from the database after saving, and reports sum/read the stored value. The project expects the existing MySQL trigger `calculate_net_salary` to calculate:

```text
net_salary = basic_salary + bonus - deductions
```

For example, `25000 + 2000 - 1000` should produce `26000`. This is the expected trigger behavior, not a live result verified in this environment. Do not create or modify a trigger to test it.

Use these read-only queries to verify the live trigger name and definition and the stored procedure name:

```sql
SELECT TRIGGER_NAME, EVENT_OBJECT_TABLE, ACTION_TIMING, EVENT_MANIPULATION, ACTION_STATEMENT
FROM information_schema.TRIGGERS
WHERE TRIGGER_SCHEMA = DATABASE()
  AND TRIGGER_NAME = 'calculate_net_salary';

SELECT ROUTINE_NAME, ROUTINE_TYPE
FROM information_schema.ROUTINES
WHERE ROUTINE_SCHEMA = DATABASE()
  AND ROUTINE_NAME = 'InsertEmployee';
```

The Django management command `inspect_payroll_schema` also reads table columns, keys, trigger metadata, and routine names. It performs no migrations or database writes.

## Common Viva Questions

1. **Why MySQL?** It is the existing relational database for this system and stores connected payroll and employee records.
2. **Why Django?** Django provides URL routing, authentication, forms, templates, and an ORM in one Python framework.
3. **What is a primary key?** A column that uniquely identifies each row, such as `Employees.emp_id`.
4. **What is a foreign key?** A column that refers to a key in another table, such as `Payroll.emp_id` referring to an employee.
5. **Why use foreign keys?** They represent relationships and, when enforced by the database, prevent references to missing rows.
6. **What is a JOIN?** A query operation that combines related rows from different tables.
7. **Why use JOIN?** It lets a report show related values, such as an employee's department name.
8. **What is a trigger?** Database code that runs automatically in response to a table event.
9. **Why is `calculate_net_salary` used?** It lets MySQL calculate and store net salary from the payroll components.
10. **What is a stored procedure?** A named routine stored in the database that can perform a group of database operations.
11. **Why use `InsertEmployee`?** It is the existing database procedure for employee insertion; this phase verifies it and does not modify it.
12. **What is normalization?** Organizing data into related tables to reduce unnecessary duplication and update errors.
13. **What is CRUD?** Create, Read, Update, and Delete, the basic operations used to manage records.
14. **What is ORM?** Object-Relational Mapping, which lets Python code query database tables through model objects.
15. **What is `select_related()`?** A Django ORM method that fetches related single-valued objects through SQL joins and helps avoid N+1 queries.
16. **What is aggregation?** Calculating a summary across rows, for example a count or salary total.
17. **How is net salary calculated?** The expected database calculation is basic salary plus bonus minus deductions; the existing trigger owns this calculation.
18. **How are attendance records connected to employees?** `Attendance.emp_id` maps to `Employee.emp_id`, exposed as `Attendance.emp` in Django.
19. **How are leaves connected to employees?** `LeaveRecord.emp_id` maps to `Employee.emp_id`, exposed as `LeaveRecord.emp`.
20. **How is payroll connected to employees?** `Payroll.emp_id` maps to `Employee.emp_id`, exposed as `Payroll.emp`.
21. **How are departments connected to employees?** `Employee.department_id` maps to `Department.department_id`, exposed as `Employee.department` and `Department.employees`.
22. **What does `filter()` do?** It limits a Django queryset using conditions similar to SQL `WHERE`.
23. **What do `Count()` and `Sum()` do?** `Count()` counts matching rows, while `Sum()` totals a numeric field.
24. **Why are the database models unmanaged?** The tables already exist and are maintained outside Django migrations, so Django must not create or alter them.
25. **How are duplicate payroll periods prevented?** `PayrollForm.clean()` checks for an existing employee/month pair and reports a validation error.

## Verification Commands

Run from the `backend` directory after installing the project requirements and configuring the existing MySQL connection:

```powershell
python manage.py check
python manage.py inspect_payroll_schema
```

Both commands are non-migrating. `inspect_payroll_schema` is read-only. In the current workspace, neither command could start because the active Python interpreter reported `ModuleNotFoundError: No module named 'django'`; live primary keys, foreign keys, trigger definition, and stored procedure existence therefore remain unverified here.