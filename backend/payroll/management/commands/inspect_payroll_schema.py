from django.core.management.base import BaseCommand, CommandError
from django.db import connection


EXPECTED_TABLES = ("Employees", "Departments", "Attendance", "Leave_Record", "Payroll")


class Command(BaseCommand):
    help = "Read-only connection and schema inspection for the existing payroll database."

    def handle(self, *args, **options):
        with connection.cursor() as cursor:
            cursor.execute("SELECT DATABASE(), VERSION()")
            database_name, server_version = cursor.fetchone()

            self.stdout.write(f"Connection: successful (MySQL {server_version})")
            self.stdout.write(f"Database: {database_name}")
            if database_name != "payroll":
                raise CommandError("Refusing schema inspection: configured database is not 'payroll'.")

            cursor.execute(
                """
                SELECT TABLE_NAME, TABLE_TYPE
                FROM information_schema.TABLES
                WHERE TABLE_SCHEMA = DATABASE()
                ORDER BY TABLE_NAME
                """
            )
            table_rows = cursor.fetchall()
            table_names = {row[0].casefold(): row[0] for row in table_rows}
            table_types = {row[0].casefold(): row[1] for row in table_rows}
            self.stdout.write(
                "Database objects found: "
                + (", ".join(f"{row[0]} ({row[1]})" for row in table_rows) or "(none)")
            )

            missing_tables = [
                name for name in EXPECTED_TABLES
                if table_types.get(name.casefold()) != "BASE TABLE"
            ]
            if missing_tables:
                self.stdout.write(self.style.ERROR(f"Expected tables missing: {', '.join(missing_tables)}"))

            for expected_name in EXPECTED_TABLES:
                actual_name = table_names.get(expected_name.casefold())
                if actual_name is None:
                    continue

                cursor.execute(f"SHOW COLUMNS FROM `{actual_name}`")
                columns = cursor.fetchall()
                cursor.execute(f"SHOW KEYS FROM `{actual_name}` WHERE Key_name = 'PRIMARY'")
                primary_keys = [row[4] for row in cursor.fetchall()]

                cursor.execute(
                    """
                    SELECT COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
                    FROM information_schema.KEY_COLUMN_USAGE
                    WHERE TABLE_SCHEMA = DATABASE()
                      AND TABLE_NAME = %s
                      AND REFERENCED_TABLE_NAME IS NOT NULL
                    ORDER BY CONSTRAINT_NAME, ORDINAL_POSITION
                    """,
                    [actual_name],
                )
                foreign_keys = cursor.fetchall()

                self.stdout.write(f"\n{actual_name}")
                self.stdout.write("  Columns: " + ", ".join(f"{row[0]} ({row[1]})" for row in columns))
                self.stdout.write("  Primary key: " + (", ".join(primary_keys) or "(not declared)"))
                if foreign_keys:
                    self.stdout.write("  Foreign keys:")
                    for column_name, referenced_table, referenced_column in foreign_keys:
                        self.stdout.write(f"    {column_name} -> {referenced_table}.{referenced_column}")
                else:
                    self.stdout.write("  Foreign keys: (none declared)")

            cursor.execute(
                """
                SELECT TRIGGER_NAME, EVENT_MANIPULATION, EVENT_OBJECT_TABLE, ACTION_TIMING
                FROM information_schema.TRIGGERS
                WHERE TRIGGER_SCHEMA = DATABASE()
                ORDER BY EVENT_OBJECT_TABLE, TRIGGER_NAME
                """
            )
            triggers = cursor.fetchall()
            self.stdout.write(
                "\nTriggers: "
                + (", ".join(f"{row[0]} ({row[1]} on {row[2]}, {row[3]})" for row in triggers) or "(none visible)")
            )

            cursor.execute(
                """
                SELECT ROUTINE_NAME, ROUTINE_TYPE
                FROM information_schema.ROUTINES
                WHERE ROUTINE_SCHEMA = DATABASE()
                ORDER BY ROUTINE_NAME
                """
            )
            routines = cursor.fetchall()
            self.stdout.write(
                "Stored routines: "
                + (", ".join(f"{row[0]} ({row[1]})" for row in routines) or "(none visible)")
            )

            if missing_tables:
                raise CommandError("Schema inspection completed, but one or more expected tables were not found.")

            self.stdout.write(self.style.SUCCESS("Read-only schema inspection completed; no migrations or writes were run."))
