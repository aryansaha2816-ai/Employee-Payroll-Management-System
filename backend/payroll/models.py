from django.db import models


class Department(models.Model):
	department_id = models.AutoField(primary_key=True)
	department_name = models.CharField(max_length=50, blank=True, null=True)

	class Meta:
		managed = False
		db_table = "departments"

	def __str__(self):
		return self.department_name or f"Department {self.department_id}"


class Employee(models.Model):
	emp_id = models.AutoField(primary_key=True)
	emp_name = models.CharField(max_length=50, blank=True, null=True)
	gender = models.CharField(max_length=10, blank=True, null=True)
	# The legacy column has no declared MySQL FK, so expose the ORM relation without a DB constraint.
	department = models.ForeignKey(
		Department,
		models.DO_NOTHING,
		db_column="department_id",
		db_constraint=False,
		related_name="employees",
		blank=True,
		null=True,
	)
	designation = models.CharField(max_length=50, blank=True, null=True)
	join_date = models.DateField(blank=True, null=True)
	basic_salary = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)

	class Meta:
		managed = False
		db_table = "employees"

	def __str__(self):
		return self.emp_name or f"Employee {self.emp_id}"


class Attendance(models.Model):
	attendance_id = models.AutoField(primary_key=True)
	# This relation maps the existing Attendance.emp_id FK to Employees.emp_id.
	emp = models.ForeignKey(
		Employee,
		models.DO_NOTHING,
		db_column="emp_id",
		related_name="attendance_records",
		blank=True,
		null=True,
	)
	attendance_date = models.DateField(blank=True, null=True)
	status = models.CharField(max_length=10, blank=True, null=True)

	class Meta:
		managed = False
		db_table = "attendance"

	def __str__(self):
		return f"Attendance {self.attendance_id}"


class LeaveRecord(models.Model):
	leave_id = models.AutoField(primary_key=True)
	# This relation maps the existing Leave_Record.emp_id FK to Employees.emp_id.
	emp = models.ForeignKey(
		Employee,
		models.DO_NOTHING,
		db_column="emp_id",
		related_name="leave_records",
		blank=True,
		null=True,
	)
	leave_type = models.CharField(max_length=20, blank=True, null=True)
	from_date = models.DateField(blank=True, null=True)
	to_date = models.DateField(blank=True, null=True)
	status = models.CharField(max_length=20, blank=True, null=True)

	class Meta:
		managed = False
		db_table = "leave_record"

	def __str__(self):
		return f"Leave record {self.leave_id}"


class Payroll(models.Model):
	payroll_id = models.AutoField(primary_key=True)
	# This relation maps the existing Payroll.emp_id FK to Employees.emp_id.
	emp = models.ForeignKey(
		Employee,
		models.DO_NOTHING,
		db_column="emp_id",
		related_name="payroll_records",
		blank=True,
		null=True,
	)
	month = models.CharField(max_length=20, blank=True, null=True)
	basic_salary = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
	bonus = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
	deductions = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
	net_salary = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)

	class Meta:
		managed = False
		db_table = "payroll"

	def __str__(self):
		return f"Payroll {self.payroll_id}"
