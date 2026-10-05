from django.urls import path

from . import views

app_name = "payroll"

urlpatterns = [
    path("", views.dashboard, name="home"),
    path("login/", views.login_page, name="login"),
    path("dashboard/", views.dashboard, name="dashboard"),
    path("employees/", views.employees, name="employees"),
    path("employees/add/", views.employee_add, name="employee_add"),
    path("employees/<int:emp_id>/", views.employee_detail, name="employee_detail"),
    path("employees/<int:emp_id>/edit/", views.employee_edit, name="employee_edit"),
    path("employees/<int:emp_id>/delete/", views.employee_delete, name="employee_delete"),
    path("departments/", views.departments, name="departments"),
    path("departments/add/", views.department_add, name="department_add"),
    path("departments/<int:department_id>/", views.department_detail, name="department_detail"),
    path("departments/<int:department_id>/edit/", views.department_edit, name="department_edit"),
    path("departments/<int:department_id>/delete/", views.department_delete, name="department_delete"),
    path("attendance/", views.attendance, name="attendance"),
    path("attendance/add/", views.attendance_add, name="attendance_add"),
    path("attendance/<int:attendance_id>/edit/", views.attendance_edit, name="attendance_edit"),
    path("attendance/<int:attendance_id>/delete/", views.attendance_delete, name="attendance_delete"),
    path("leaves/", views.leaves, name="leaves"),
    path("leaves/add/", views.leave_add, name="leave_add"),
    path("leaves/<int:leave_id>/edit/", views.leave_edit, name="leave_edit"),
    path("leaves/<int:leave_id>/approve/", views.leave_approve, name="leave_approve"),
    path("leaves/<int:leave_id>/reject/", views.leave_reject, name="leave_reject"),
    path("leaves/<int:leave_id>/delete/", views.leave_delete, name="leave_delete"),
    path("payroll/", views.payroll, name="payroll"),
    path("payroll/add/", views.payroll_add, name="payroll_add"),
    path("payroll/<int:payroll_id>/", views.payroll_detail, name="payroll_detail"),
    path("payroll/<int:payroll_id>/edit/", views.payroll_edit, name="payroll_edit"),
    path("payroll/<int:payroll_id>/delete/", views.payroll_delete, name="payroll_delete"),
    path("payslip/", views.payslip, name="payslip"),
    path("payslip/<int:payroll_id>/", views.payslip_detail, name="payslip_detail"),
    path("reports/", views.reports, name="reports"),
    path("logout/", views.logout_view, name="logout"),
]
