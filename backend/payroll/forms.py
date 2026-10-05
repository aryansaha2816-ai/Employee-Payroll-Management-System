from django import forms

from .models import Attendance, Department, Employee, LeaveRecord, Payroll


class EmployeeForm(forms.ModelForm):
	emp_name = forms.CharField(max_length=50, strip=True)
	gender = forms.CharField(max_length=10, strip=True)
	department = forms.ModelChoiceField(
		queryset=Department.objects.none(),
		empty_label="Select a department",
	)
	designation = forms.CharField(max_length=50, strip=True)
	join_date = forms.DateField(widget=forms.DateInput(attrs={"type": "date"}))
	basic_salary = forms.DecimalField(
		max_digits=10,
		decimal_places=2,
		min_value=0,
		widget=forms.NumberInput(attrs={"min": "0", "step": "0.01"}),
	)

	class Meta:
		model = Employee
		fields = ("emp_name", "gender", "department", "designation", "join_date", "basic_salary")
		labels = {
			"emp_name": "Employee name",
			"department": "Department",
			"join_date": "Join date",
			"basic_salary": "Basic salary",
		}

	def __init__(self, *args, **kwargs):
		super().__init__(*args, **kwargs)
		self.fields["department"].queryset = Department.objects.order_by("department_name")
		self.fields["emp_name"].widget.attrs.update({"class": "form-control", "autocomplete": "name"})
		self.fields["gender"].widget.attrs.update({"class": "form-control", "maxlength": "10"})
		self.fields["department"].widget.attrs["class"] = "form-control"
		self.fields["designation"].widget.attrs["class"] = "form-control"
		self.fields["join_date"].widget.attrs["class"] = "form-control"
		self.fields["basic_salary"].widget.attrs["class"] = "form-control"

	def clean_emp_name(self):
		value = self.cleaned_data["emp_name"].strip()
		if not value:
			raise forms.ValidationError("Employee name cannot be empty.")
		return value

	def clean_designation(self):
		value = self.cleaned_data["designation"].strip()
		if not value:
			raise forms.ValidationError("Designation cannot be empty.")
		return value


class DepartmentForm(forms.ModelForm):
	department_name = forms.CharField(max_length=50, strip=True)

	class Meta:
		model = Department
		fields = ("department_name",)
		labels = {"department_name": "Department name"}

	def __init__(self, *args, **kwargs):
		super().__init__(*args, **kwargs)
		self.fields["department_name"].widget.attrs.update({"class": "form-control", "autofocus": True})

	def clean_department_name(self):
		value = self.cleaned_data["department_name"].strip()
		if not value:
			raise forms.ValidationError("Department name cannot be empty.")

		duplicates = Department.objects.filter(department_name__iexact=value)
		if self.instance.pk:
			duplicates = duplicates.exclude(pk=self.instance.pk)
		if duplicates.exists():
			raise forms.ValidationError("A department with this name already exists.")
		return value


class AttendanceForm(forms.ModelForm):
	employee = forms.ModelChoiceField(
		queryset=Employee.objects.none(),
		empty_label="Select an employee",
		label="Employee",
	)
	attendance_date = forms.DateField(
		widget=forms.DateInput(attrs={"type": "date", "class": "form-control"}),
	)
	status = forms.ChoiceField(choices=(("Present", "Present"), ("Absent", "Absent")))

	class Meta:
		model = Attendance
		fields = ("attendance_date", "status")
		labels = {"attendance_date": "Attendance date"}

	def __init__(self, *args, **kwargs):
		super().__init__(*args, **kwargs)
		self.order_fields(("employee", "attendance_date", "status"))
		self.fields["employee"].queryset = Employee.objects.order_by("emp_name", "emp_id")
		self.fields["employee"].widget.attrs["class"] = "form-control"
		self.fields["attendance_date"].widget.attrs["class"] = "form-control"
		self.fields["status"].widget.attrs["class"] = "form-control"
		if self.instance.pk and self.instance.emp_id:
			self.initial.setdefault("employee", self.instance.emp_id)
		if self.instance.pk and self.instance.status not in {"Present", "Absent"}:
			self.fields["status"].choices = [
				(self.instance.status, f"{self.instance.status} (existing record)"),
				*self.fields["status"].choices,
			]

	def clean(self):
		cleaned_data = super().clean()
		employee = cleaned_data.get("employee")
		attendance_date = cleaned_data.get("attendance_date")
		if employee and attendance_date:
			duplicates = Attendance.objects.filter(
				emp_id=employee.emp_id,
				attendance_date=attendance_date,
			)
			if self.instance.pk:
				duplicates = duplicates.exclude(pk=self.instance.pk)
			if duplicates.exists():
				self.add_error(
					"employee",
					"Attendance for this employee on this date already exists.",
				)
		return cleaned_data

	def save(self, commit=True):
		attendance = super().save(commit=False)
		attendance.emp = self.cleaned_data["employee"]
		if commit:
			attendance.save()
		return attendance


class LeaveForm(forms.ModelForm):
	leave_type = forms.CharField(max_length=20, strip=True, label="Leave type")
	from_date = forms.DateField(widget=forms.DateInput(attrs={"type": "date", "class": "form-control"}))
	to_date = forms.DateField(widget=forms.DateInput(attrs={"type": "date", "class": "form-control"}))

	class Meta:
		model = LeaveRecord
		fields = ("leave_type", "from_date", "to_date")

	def __init__(self, *args, **kwargs):
		super().__init__(*args, **kwargs)
		self.fields["employee"] = forms.ModelChoiceField(
			queryset=Employee.objects.order_by("emp_name", "emp_id"),
			empty_label="Select an employee",
			label="Employee",
			widget=forms.Select(attrs={"class": "form-control"}),
		)
		if self.instance.pk and self.instance.emp_id:
			self.initial.setdefault("employee", self.instance.emp_id)
		self.fields["leave_type"].widget.attrs["class"] = "form-control"
		self.order_fields(("employee", "leave_type", "from_date", "to_date"))

	def clean(self):
		cleaned_data = super().clean()
		from_date = cleaned_data.get("from_date")
		to_date = cleaned_data.get("to_date")
		if from_date and to_date and from_date > to_date:
			self.add_error("from_date", "From date cannot be later than to date.")
		return cleaned_data

	def save(self, commit=True):
		leave = super().save(commit=False)
		leave.emp = self.cleaned_data["employee"]
		if self.instance._state.adding:
			leave.status = "Pending"
		if commit:
			leave.save()
		return leave


class PayrollForm(forms.ModelForm):
	month = forms.CharField(max_length=20, strip=True)
	basic_salary = forms.DecimalField(
		max_digits=10,
		decimal_places=2,
		min_value=0,
		widget=forms.NumberInput(attrs={"class": "form-control", "min": "0", "step": "0.01"}),
	)
	bonus = forms.DecimalField(
		max_digits=10,
		decimal_places=2,
		min_value=0,
		widget=forms.NumberInput(attrs={"class": "form-control", "min": "0", "step": "0.01"}),
	)
	deductions = forms.DecimalField(
		max_digits=10,
		decimal_places=2,
		min_value=0,
		widget=forms.NumberInput(attrs={"class": "form-control", "min": "0", "step": "0.01"}),
	)

	class Meta:
		model = Payroll
		fields = ("month", "basic_salary", "bonus", "deductions")

	def __init__(self, *args, **kwargs):
		hide_employee = kwargs.pop("hide_employee", False)
		super().__init__(*args, **kwargs)
		self.fields["employee"] = forms.ModelChoiceField(
			queryset=Employee.objects.order_by("emp_name", "emp_id"),
			empty_label="Select an employee",
			label="Employee",
			widget=forms.HiddenInput() if hide_employee else forms.Select(attrs={"class": "form-control"}),
		)
		if self.instance.pk and self.instance.emp_id:
			self.initial.setdefault("employee", self.instance.emp_id)
		if hide_employee:
			self.order_fields(("employee", "month", "basic_salary", "bonus", "deductions"))
		else:
			self.order_fields(("employee", "month", "basic_salary", "bonus", "deductions"))
		self.fields["month"].widget.attrs["class"] = "form-control"

	def clean(self):
		cleaned_data = super().clean()
		employee = cleaned_data.get("employee")
		month = cleaned_data.get("month")
		if employee and month:
			duplicates = Payroll.objects.filter(emp_id=employee.emp_id, month=month)
			if self.instance.pk:
				duplicates = duplicates.exclude(pk=self.instance.pk)
			if duplicates.exists():
				self.add_error("employee", "Payroll for this employee and month already exists.")
		return cleaned_data

	def save(self, commit=True):
		payroll = super().save(commit=False)
		payroll.emp = self.cleaned_data["employee"]
		if commit:
			payroll.save()
		return payroll
