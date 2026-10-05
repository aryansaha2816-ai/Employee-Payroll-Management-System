from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError, transaction
from django.db.models import Count, Q, Sum
from django.db.models import Prefetch
from django.db.models.deletion import ProtectedError
from django.shortcuts import get_object_or_404, redirect, render
from django.utils import timezone
from django.utils.dateparse import parse_date
from django.views.decorators.http import require_http_methods
from django.views.decorators.http import require_POST

from .forms import AttendanceForm, DepartmentForm, EmployeeForm, LeaveForm, PayrollForm
from .models import Attendance, Department, Employee, LeaveRecord, Payroll


def login_page(request):
    if request.user.is_authenticated:
        return redirect("payroll:dashboard")

    error = ""
    if request.method == "POST":
        username = request.POST.get("username", "")
        password = request.POST.get("password", "")
        # Django's configured authentication backend verifies the credentials.
        user = authenticate(request, username=username, password=password)
        if user is not None:
            # login() records the authenticated user in Django's session.
            login(request, user)
            return redirect("payroll:dashboard")
        error = "Invalid username or password."

    return render(request, "login.html", {"error": error})


# @login_required sends anonymous visitors to the configured login URL.
@login_required
def dashboard(request):
    today = timezone.localdate()
    attendance_totals = Attendance.objects.filter(attendance_date=today).aggregate(
        total=Count("attendance_id"),
        present=Count("attendance_id", filter=Q(status="Present")),
        absent=Count("attendance_id", filter=Q(status="Absent")),
    )
    payroll_totals = Payroll.objects.aggregate(
        record_count=Count("payroll_id"),
        net_salary=Sum("net_salary"),
    )

    context = {
        "dashboard_date": today,
        "total_employees": Employee.objects.count(),
        "total_departments": Department.objects.count(),
        "present_today": attendance_totals["present"],
        "absent_today": attendance_totals["absent"],
        "today_attendance_total": attendance_totals["total"],
        "pending_leaves": LeaveRecord.objects.filter(status="Pending").count(),
        "payroll_summary": payroll_totals["net_salary"],
        "payroll_record_count": payroll_totals["record_count"],
        "recent_employees": Employee.objects.select_related("department").order_by("-emp_id")[:5],
        "recent_leaves": LeaveRecord.objects.select_related("emp").order_by("-from_date", "-leave_id")[:5],
    }
    return render(request, "dashboard.html", context)


@login_required
def employees(request):
    query = request.GET.get("q", "").strip()
    employee_list = Employee.objects.select_related("department")

    if query:
        search_filter = Q(emp_name__icontains=query) | Q(designation__icontains=query)
        employee_id = query.upper().removeprefix("EMP-")
        if employee_id.isdigit():
            search_filter |= Q(emp_id=int(employee_id))
        employee_list = employee_list.filter(search_filter)

    return render(
        request,
        "employees.html",
        {"employees": employee_list.order_by("emp_id"), "query": query},
    )


@login_required
def employee_add(request):
    form = EmployeeForm(request.POST if request.method == "POST" else None)
    if request.method == "POST" and form.is_valid():
        form.save()
        messages.success(request, "Employee added successfully.")
        return redirect("payroll:employees")
    return render(request, "employee_form.html", {"form": form, "page_title": "Add employee"})


@login_required
def employee_detail(request, emp_id):
    employee = get_object_or_404(
        Employee.objects.select_related("department"),
        emp_id=emp_id,
    )
    return render(request, "employee_detail.html", {"employee": employee})


@login_required
def employee_edit(request, emp_id):
    employee = get_object_or_404(Employee.objects.select_related("department"), emp_id=emp_id)
    form = EmployeeForm(
        request.POST if request.method == "POST" else None,
        instance=employee,
    )
    if request.method == "POST" and form.is_valid():
        form.save()
        messages.success(request, "Employee updated successfully.")
        return redirect("payroll:employees")
    return render(
        request,
        "employee_form.html",
        {"form": form, "employee": employee, "page_title": "Edit employee"},
    )


def _employee_related_record_counts(emp_id):
    return {
        "attendance": Attendance.objects.filter(emp_id=emp_id).count(),
        "leaves": LeaveRecord.objects.filter(emp_id=emp_id).count(),
        "payroll": Payroll.objects.filter(emp_id=emp_id).count(),
    }


@login_required
def employee_delete(request, emp_id):
    employee = get_object_or_404(Employee, emp_id=emp_id)
    related_counts = _employee_related_record_counts(emp_id)
    context = {"employee": employee, "related_counts": related_counts}

    if request.method == "POST":
        if any(related_counts.values()):
            messages.error(
                request,
                "This employee cannot be deleted while attendance, leave, or payroll records reference them.",
            )
            return render(request, "employee_confirm_delete.html", context)

        try:
            with transaction.atomic():
                employee.delete()
        except (IntegrityError, ProtectedError):
            messages.error(
                request,
                "This employee cannot be deleted because related records still exist.",
            )
            return render(request, "employee_confirm_delete.html", context)

        messages.success(request, "Employee deleted successfully.")
        return redirect("payroll:employees")

    return render(request, "employee_confirm_delete.html", context)


@login_required
def departments(request):
    query = request.GET.get("q", "").strip()
    department_list = Department.objects.annotate(
        employee_count=Count("employees", distinct=True),
    )
    if query:
        search_filter = Q(department_name__icontains=query)
        department_id = query.upper().removeprefix("DEP-")
        if department_id.isdigit():
            search_filter |= Q(department_id=int(department_id))
        department_list = department_list.filter(search_filter)

    return render(
        request,
        "departments.html",
        {"departments": department_list.order_by("department_id"), "query": query},
    )


@login_required
def department_add(request):
    form = DepartmentForm(request.POST if request.method == "POST" else None)
    if request.method == "POST" and form.is_valid():
        form.save()
        messages.success(request, "Department added successfully.")
        return redirect("payroll:departments")
    return render(request, "department_form.html", {"form": form, "page_title": "Add department"})


@login_required
def department_detail(request, department_id):
    department = get_object_or_404(
        Department.objects.annotate(employee_count=Count("employees", distinct=True)).prefetch_related(
            Prefetch("employees", queryset=Employee.objects.order_by("emp_id")),
        ),
        department_id=department_id,
    )
    return render(request, "department_detail.html", {"department": department})


@login_required
def department_edit(request, department_id):
    department = get_object_or_404(Department, department_id=department_id)
    form = DepartmentForm(
        request.POST if request.method == "POST" else None,
        instance=department,
    )
    if request.method == "POST" and form.is_valid():
        form.save()
        messages.success(request, "Department updated successfully.")
        return redirect("payroll:departments")
    return render(
        request,
        "department_form.html",
        {"form": form, "department": department, "page_title": "Edit department"},
    )


def _department_employee_count(department_id):
    return Employee.objects.filter(department_id=department_id).count()


@login_required
def department_delete(request, department_id):
    department = get_object_or_404(Department, department_id=department_id)
    context = {
        "department": department,
        "employee_count": _department_employee_count(department_id),
    }

    if request.method == "POST":
        try:
            with transaction.atomic():
                department = Department.objects.select_for_update().get(department_id=department_id)
                context["employee_count"] = _department_employee_count(department_id)
                if context["employee_count"]:
                    messages.error(
                        request,
                        "This department cannot be deleted because employees are assigned to it.",
                    )
                    return render(request, "department_confirm_delete.html", context)
                department.delete()
        except (IntegrityError, ProtectedError):
            messages.error(
                request,
                "This department cannot be deleted because employees are assigned to it.",
            )
            context["employee_count"] = _department_employee_count(department_id)
            return render(request, "department_confirm_delete.html", context)

        messages.success(request, "Department deleted successfully.")
        return redirect("payroll:departments")

    return render(request, "department_confirm_delete.html", context)


@login_required
def attendance(request):
    today = timezone.localdate()
    query = Attendance.objects.select_related("emp").order_by("-attendance_date", "-attendance_id")
    employees = Employee.objects.order_by("emp_name", "emp_id")
    employee_filter = request.GET.get("employee", "").strip()
    date_filter = request.GET.get("date", "").strip()
    status_filter = request.GET.get("status", "").strip()

    if employee_filter:
        if employee_filter.isdecimal():
            query = query.filter(emp_id=int(employee_filter))
        else:
            messages.error(request, "Select a valid employee.")
    if date_filter:
        selected_date = parse_date(date_filter)
        if selected_date:
            query = query.filter(attendance_date=selected_date)
        else:
            messages.error(request, "Enter a valid attendance date.")
    if status_filter:
        if status_filter in {"Present", "Absent"}:
            query = query.filter(status=status_filter)
        else:
            messages.error(request, "Select Present or Absent as the status.")

    today_summary = Attendance.objects.filter(attendance_date=today).aggregate(
        present=Count("attendance_id", filter=Q(status="Present")),
        absent=Count("attendance_id", filter=Q(status="Absent")),
        total=Count("attendance_id"),
    )
    context = {
        "attendance_records": query,
        "employees": employees,
        "employee_filter": employee_filter,
        "date_filter": date_filter,
        "status_filter": status_filter,
        "today": today,
        "present_today": today_summary["present"],
        "absent_today": today_summary["absent"],
        "total_today": today_summary["total"],
    }
    return render(request, "attendance.html", context)


@login_required
def attendance_add(request):
    form = AttendanceForm(request.POST if request.method == "POST" else None)
    if request.method == "POST" and form.is_valid():
        form.save()
        messages.success(request, "Attendance marked successfully.")
        return redirect("payroll:attendance")
    return render(request, "attendance_form.html", {"form": form, "page_title": "Mark attendance"})


@login_required
def attendance_edit(request, attendance_id):
    record = get_object_or_404(
        Attendance.objects.select_related("emp"),
        attendance_id=attendance_id,
    )
    form = AttendanceForm(
        request.POST if request.method == "POST" else None,
        instance=record,
    )
    if request.method == "POST" and form.is_valid():
        form.save()
        messages.success(request, "Attendance updated successfully.")
        return redirect("payroll:attendance")
    return render(
        request,
        "attendance_form.html",
        {"form": form, "record": record, "page_title": "Edit attendance"},
    )


@login_required
@require_http_methods(["GET", "POST"])
def attendance_delete(request, attendance_id):
    record = get_object_or_404(
        Attendance.objects.select_related("emp"),
        attendance_id=attendance_id,
    )
    if request.method == "POST":
        record.delete()
        messages.success(request, "Attendance deleted successfully.")
        return redirect("payroll:attendance")
    return render(request, "attendance_confirm_delete.html", {"record": record})


@login_required
def leaves(request):
    leave_list = LeaveRecord.objects.select_related("emp").order_by("-from_date", "-leave_id")
    employees = Employee.objects.order_by("emp_name", "emp_id")
    employee_filter = request.GET.get("employee", "").strip()
    leave_type_filter = request.GET.get("leave_type", "").strip()
    status_filter = request.GET.get("status", "").strip()
    from_date_value = request.GET.get("from_date", "").strip()
    to_date_value = request.GET.get("to_date", "").strip()

    if employee_filter:
        if employee_filter.isdecimal():
            leave_list = leave_list.filter(emp_id=int(employee_filter))
        else:
            messages.error(request, "Select a valid employee.")
    if leave_type_filter:
        leave_list = leave_list.filter(leave_type__iexact=leave_type_filter)

    status_values = list(
        LeaveRecord.objects.exclude(status__isnull=True)
        .order_by()
        .values_list("status", flat=True)
        .distinct()
    )
    status_options = ["Pending", "Approved", "Rejected"]
    status_options.extend(value for value in status_values if value not in status_options)
    if status_filter:
        if status_filter in status_options:
            leave_list = leave_list.filter(status=status_filter)
        else:
            messages.error(request, "Select a valid leave status.")

    from_date = parse_date(from_date_value) if from_date_value else None
    to_date = parse_date(to_date_value) if to_date_value else None
    valid_date_range = True
    if from_date_value and from_date is None:
        messages.error(request, "Enter a valid start date.")
        valid_date_range = False
    if to_date_value and to_date is None:
        messages.error(request, "Enter a valid end date.")
        valid_date_range = False
    if from_date and to_date and from_date > to_date:
        messages.error(request, "From date cannot be later than to date.")
        valid_date_range = False
    if valid_date_range:
        if from_date:
            leave_list = leave_list.filter(to_date__gte=from_date)
        if to_date:
            leave_list = leave_list.filter(from_date__lte=to_date)

    summary = LeaveRecord.objects.aggregate(
        pending=Count("leave_id", filter=Q(status="Pending")),
        approved=Count("leave_id", filter=Q(status="Approved")),
        rejected=Count("leave_id", filter=Q(status="Rejected")),
    )
    return render(
        request,
        "leaves.html",
        {
            "leave_records": leave_list,
            "employees": employees,
            "leave_types": LeaveRecord.objects.exclude(leave_type__isnull=True)
            .order_by("leave_type")
            .values_list("leave_type", flat=True)
            .distinct(),
            "status_options": status_options,
            "employee_filter": employee_filter,
            "leave_type_filter": leave_type_filter,
            "status_filter": status_filter,
            "from_date_filter": from_date_value,
            "to_date_filter": to_date_value,
            "pending_count": summary["pending"],
            "approved_count": summary["approved"],
            "rejected_count": summary["rejected"],
        },
    )


@login_required
def leave_add(request):
    form = LeaveForm(request.POST if request.method == "POST" else None)
    if request.method == "POST" and form.is_valid():
        form.save()
        messages.success(request, "Leave application submitted successfully.")
        return redirect("payroll:leaves")
    return render(request, "leave_form.html", {"form": form, "page_title": "Apply for leave"})


@login_required
def leave_edit(request, leave_id):
    record = get_object_or_404(LeaveRecord.objects.select_related("emp"), leave_id=leave_id)
    form = LeaveForm(
        request.POST if request.method == "POST" else None,
        instance=record,
    )
    if request.method == "POST" and form.is_valid():
        form.save()
        messages.success(request, "Leave updated successfully.")
        return redirect("payroll:leaves")
    return render(
        request,
        "leave_form.html",
        {"form": form, "record": record, "page_title": "Edit leave"},
    )


@login_required
@require_POST
def leave_approve(request, leave_id):
    return _change_leave_status(request, leave_id, "Approved")


@login_required
@require_POST
def leave_reject(request, leave_id):
    return _change_leave_status(request, leave_id, "Rejected")


def _change_leave_status(request, leave_id, new_status):
    with transaction.atomic():
        record = get_object_or_404(
            LeaveRecord.objects.select_for_update(),
            leave_id=leave_id,
        )
        if record.status != "Pending":
            messages.error(request, "Only pending leave applications can be approved or rejected.")
            return redirect("payroll:leaves")
        record.status = new_status
        record.save(update_fields=["status"])

    if new_status == "Approved":
        messages.success(request, "Leave approved successfully.")
    else:
        messages.success(request, "Leave rejected successfully.")
    return redirect("payroll:leaves")


@login_required
@require_http_methods(["GET", "POST"])
def leave_delete(request, leave_id):
    record = get_object_or_404(LeaveRecord.objects.select_related("emp"), leave_id=leave_id)
    if request.method == "POST":
        record.delete()
        messages.success(request, "Leave deleted successfully.")
        return redirect("payroll:leaves")
    return render(request, "leave_confirm_delete.html", {"record": record})


@login_required
def payroll(request):
    payroll_list = Payroll.objects.select_related("emp").order_by("-month", "-payroll_id")
    employees = Employee.objects.order_by("emp_name", "emp_id")
    employee_filter = request.GET.get("employee", "").strip()
    month_filter = request.GET.get("month", "").strip()
    if employee_filter:
        if employee_filter.isdecimal():
            payroll_list = payroll_list.filter(emp_id=int(employee_filter))
        else:
            messages.error(request, "Select a valid employee.")
    if month_filter:
        payroll_list = payroll_list.filter(month=month_filter)

    totals = Payroll.objects.aggregate(
        record_count=Count("payroll_id"),
        basic_salary=Sum("basic_salary"),
        bonus=Sum("bonus"),
        deductions=Sum("deductions"),
        net_salary=Sum("net_salary"),
    )
    months = (
        Payroll.objects.exclude(month__isnull=True)
        .order_by("month")
        .values_list("month", flat=True)
        .distinct()
    )
    return render(
        request,
        "payroll.html",
        {
            "payroll_records": payroll_list,
            "employees": employees,
            "months": months,
            "employee_filter": employee_filter,
            "month_filter": month_filter,
            "totals": {key: value or 0 for key, value in totals.items()},
        },
    )


@login_required
def payroll_add(request):
    selected_employee = None
    if request.method == "POST":
        employee_id = request.POST.get("employee", "")
        selected_employee = Employee.objects.filter(emp_id=employee_id).first()
        form = PayrollForm(request.POST, hide_employee=True)
        if form.is_valid():
            payroll_record = form.save()
            payroll_record.refresh_from_db(fields=["net_salary"])
            messages.success(request, "Payroll generated successfully.")
            return redirect("payroll:payroll")
    else:
        employee_id = request.GET.get("employee", "")
        if employee_id:
            selected_employee = Employee.objects.filter(emp_id=employee_id).first()
            if selected_employee is None:
                messages.error(request, "Select a valid employee.")
        if selected_employee:
            form = PayrollForm(
                initial={
                    "employee": selected_employee.emp_id,
                    "month": "",
                    "basic_salary": selected_employee.basic_salary,
                    "bonus": 0,
                    "deductions": 0,
                },
                hide_employee=True,
            )
        else:
            form = PayrollForm()

    return render(
        request,
        "payroll_form.html",
        {
            "form": form,
            "page_title": "Generate payroll",
            "selected_employee": selected_employee,
            "employees": Employee.objects.order_by("emp_name", "emp_id"),
        },
    )


@login_required
def payroll_detail(request, payroll_id):
    record = get_object_or_404(
        Payroll.objects.select_related("emp", "emp__department"),
        payroll_id=payroll_id,
    )
    return render(request, "payroll_detail.html", {"record": record})


@login_required
def payroll_edit(request, payroll_id):
    record = get_object_or_404(Payroll.objects.select_related("emp"), payroll_id=payroll_id)
    form = PayrollForm(
        request.POST if request.method == "POST" else None,
        instance=record,
    )
    if request.method == "POST" and form.is_valid():
        payroll_record = form.save()
        payroll_record.refresh_from_db(fields=["net_salary"])
        messages.success(request, "Payroll updated successfully.")
        return redirect("payroll:payroll")
    return render(
        request,
        "payroll_form.html",
        {"form": form, "record": record, "page_title": "Edit payroll", "selected_employee": record.emp},
    )


@login_required
@require_http_methods(["GET", "POST"])
def payroll_delete(request, payroll_id):
    record = get_object_or_404(Payroll.objects.select_related("emp"), payroll_id=payroll_id)
    if request.method == "POST":
        record.delete()
        messages.success(request, "Payroll deleted successfully.")
        return redirect("payroll:payroll")
    return render(request, "payroll_confirm_delete.html", {"record": record})


@login_required
def payslip(request):
    payroll_records = Payroll.objects.select_related("emp", "emp__department").order_by(
        "-month",
        "-payroll_id",
    )
    employees = Employee.objects.order_by("emp_name", "emp_id")
    employee_filter = request.GET.get("employee", "").strip()
    month_filter = request.GET.get("month", "").strip()

    if employee_filter:
        if employee_filter.isdecimal():
            payroll_records = payroll_records.filter(emp_id=int(employee_filter))
        else:
            messages.error(request, "Select a valid employee.")
    if month_filter:
        payroll_records = payroll_records.filter(month=month_filter)

    months = (
        Payroll.objects.exclude(month__isnull=True)
        .exclude(month="")
        .order_by("month")
        .values_list("month", flat=True)
        .distinct()
    )
    return render(
        request,
        "payslip.html",
        {
            "payroll_records": payroll_records,
            "employees": employees,
            "months": months,
            "employee_filter": employee_filter,
            "month_filter": month_filter,
        },
    )


@login_required
def payslip_detail(request, payroll_id):
    record = get_object_or_404(
        Payroll.objects.select_related("emp", "emp__department"),
        payroll_id=payroll_id,
    )
    return render(
        request,
        "payslip_detail.html",
        {"record": record, "printed_on": timezone.localdate()},
    )


@login_required
def reports(request):
    employees = list(Employee.objects.select_related("department").order_by("emp_name", "emp_id"))
    employee_ids = {employee.emp_id for employee in employees}

    def filter_employee(queryset, parameter):
        value = request.GET.get(parameter, "").strip()
        if not value:
            return queryset, ""
        if not value.isdecimal() or int(value) not in employee_ids:
            messages.error(request, "Select a valid employee for each report filter.")
            return queryset, ""
        return queryset.filter(emp_id=int(value)), value

    def report_date_range(prefix):
        from_value = request.GET.get(f"{prefix}_from_date", "").strip()
        to_value = request.GET.get(f"{prefix}_to_date", "").strip()
        from_date = parse_date(from_value) if from_value else None
        to_date = parse_date(to_value) if to_value else None
        valid = True
        if from_value and from_date is None:
            messages.error(request, f"Enter a valid {prefix} report start date.")
            valid = False
        if to_value and to_date is None:
            messages.error(request, f"Enter a valid {prefix} report end date.")
            valid = False
        if from_date and to_date and from_date > to_date:
            messages.error(request, f"The {prefix} report start date cannot be later than its end date.")
            valid = False
        return (from_date, to_date) if valid else (None, None)

    departments = list(Department.objects.order_by("department_name", "department_id"))
    department_ids = {department.department_id for department in departments}
    department_filter = request.GET.get("employee_department", "").strip()
    employee_report = Employee.objects.select_related("department").order_by("emp_id")
    if department_filter:
        if department_filter.isdecimal() and int(department_filter) in department_ids:
            employee_report = employee_report.filter(department_id=int(department_filter))
        else:
            messages.error(request, "Select a valid department.")
            department_filter = ""

    designations = list(
        Employee.objects.exclude(designation__isnull=True)
        .exclude(designation="")
        .order_by()
        .values_list("designation", flat=True)
        .distinct()
    )
    designation_filter = request.GET.get("employee_designation", "").strip()
    if designation_filter:
        if designation_filter in designations:
            employee_report = employee_report.filter(designation=designation_filter)
        else:
            messages.error(request, "Select a valid designation.")
            designation_filter = ""

    employee_name_filter = request.GET.get("employee_name", "").strip()
    if employee_name_filter:
        if len(employee_name_filter) <= 100:
            employee_report = employee_report.filter(emp_name__icontains=employee_name_filter)
        else:
            messages.error(request, "Employee name search must be 100 characters or fewer.")
            employee_name_filter = ""

    attendance_report = Attendance.objects.select_related("emp").order_by(
        "-attendance_date",
        "-attendance_id",
    )
    attendance_report, attendance_employee_filter = filter_employee(
        attendance_report,
        "attendance_employee",
    )
    attendance_status_options = list(
        Attendance.objects.exclude(status__isnull=True)
        .exclude(status="")
        .order_by()
        .values_list("status", flat=True)
        .distinct()
    )
    attendance_status_filter = request.GET.get("attendance_status", "").strip()
    if attendance_status_filter:
        if attendance_status_filter in attendance_status_options:
            attendance_report = attendance_report.filter(status=attendance_status_filter)
        else:
            messages.error(request, "Select a valid attendance status.")
            attendance_status_filter = ""

    attendance_from_date, attendance_to_date = report_date_range("attendance")
    if attendance_from_date:
        attendance_report = attendance_report.filter(attendance_date__gte=attendance_from_date)
    if attendance_to_date:
        attendance_report = attendance_report.filter(attendance_date__lte=attendance_to_date)
    attendance_totals = attendance_report.aggregate(
        total=Count("attendance_id"),
        present=Count("attendance_id", filter=Q(status__iexact="Present")),
        absent=Count("attendance_id", filter=Q(status__iexact="Absent")),
    )

    leave_report = LeaveRecord.objects.select_related("emp").order_by("-from_date", "-leave_id")
    leave_report, leave_employee_filter = filter_employee(leave_report, "leave_employee")
    leave_type_options = list(
        LeaveRecord.objects.exclude(leave_type__isnull=True)
        .exclude(leave_type="")
        .order_by()
        .values_list("leave_type", flat=True)
        .distinct()
    )
    leave_type_filter = request.GET.get("leave_type", "").strip()
    if leave_type_filter:
        if leave_type_filter in leave_type_options:
            leave_report = leave_report.filter(leave_type=leave_type_filter)
        else:
            messages.error(request, "Select a valid leave type.")
            leave_type_filter = ""

    leave_status_options = list(
        LeaveRecord.objects.exclude(status__isnull=True)
        .exclude(status="")
        .order_by()
        .values_list("status", flat=True)
        .distinct()
    )
    for standard_status in ("Pending", "Approved", "Rejected"):
        if standard_status not in leave_status_options:
            leave_status_options.append(standard_status)
    leave_status_filter = request.GET.get("leave_status", "").strip()
    if leave_status_filter:
        if leave_status_filter in leave_status_options:
            leave_report = leave_report.filter(status=leave_status_filter)
        else:
            messages.error(request, "Select a valid leave status.")
            leave_status_filter = ""

    leave_from_date, leave_to_date = report_date_range("leave")
    if leave_from_date:
        leave_report = leave_report.filter(to_date__gte=leave_from_date)
    if leave_to_date:
        leave_report = leave_report.filter(from_date__lte=leave_to_date)
    leave_totals = leave_report.aggregate(
        total=Count("leave_id"),
        pending=Count("leave_id", filter=Q(status__iexact="Pending")),
        approved=Count("leave_id", filter=Q(status__iexact="Approved")),
        rejected=Count("leave_id", filter=Q(status__iexact="Rejected")),
    )

    payroll_report = Payroll.objects.select_related("emp", "emp__department").order_by(
        "-month",
        "-payroll_id",
    )
    payroll_report, payroll_employee_filter = filter_employee(payroll_report, "payroll_employee")
    payroll_month_options = list(
        Payroll.objects.exclude(month__isnull=True)
        .exclude(month="")
        .order_by()
        .values_list("month", flat=True)
        .distinct()
    )
    payroll_month_filter = request.GET.get("payroll_month", "").strip()
    if payroll_month_filter:
        if payroll_month_filter in payroll_month_options:
            payroll_report = payroll_report.filter(month=payroll_month_filter)
        else:
            messages.error(request, "Select a valid payroll month.")
            payroll_month_filter = ""
    payroll_totals = payroll_report.aggregate(
        total=Count("payroll_id"),
        basic_salary=Sum("basic_salary"),
        bonus=Sum("bonus"),
        deductions=Sum("deductions"),
        net_salary=Sum("net_salary"),
    )

    department_report = Department.objects.annotate(
        employee_count=Count("employees", distinct=True),
    ).order_by("department_name", "department_id")

    return render(
        request,
        "reports.html",
        {
            "employees": employees,
            "departments": departments,
            "department_ids": department_ids,
            "employee_report": employee_report,
            "department_filter": department_filter,
            "designations": designations,
            "designation_filter": designation_filter,
            "employee_name_filter": employee_name_filter,
            "attendance_report": attendance_report,
            "attendance_status_options": attendance_status_options,
            "attendance_employee_filter": attendance_employee_filter,
            "attendance_status_filter": attendance_status_filter,
            "attendance_from_date_filter": request.GET.get("attendance_from_date", ""),
            "attendance_to_date_filter": request.GET.get("attendance_to_date", ""),
            "attendance_totals": {key: value or 0 for key, value in attendance_totals.items()},
            "leave_report": leave_report,
            "leave_type_options": leave_type_options,
            "leave_status_options": leave_status_options,
            "leave_employee_filter": leave_employee_filter,
            "leave_type_filter": leave_type_filter,
            "leave_status_filter": leave_status_filter,
            "leave_from_date_filter": request.GET.get("leave_from_date", ""),
            "leave_to_date_filter": request.GET.get("leave_to_date", ""),
            "leave_totals": {key: value or 0 for key, value in leave_totals.items()},
            "payroll_report": payroll_report,
            "payroll_month_options": payroll_month_options,
            "payroll_employee_filter": payroll_employee_filter,
            "payroll_month_filter": payroll_month_filter,
            "payroll_totals": {key: value or 0 for key, value in payroll_totals.items()},
            "department_report": department_report,
        },
    )


@require_POST
def logout_view(request):
    # logout() clears the current authenticated session.
    logout(request)
    return redirect("login")
