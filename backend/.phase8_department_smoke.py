import os
import secrets

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "payroll_system.settings")

import django

django.setup()

from django.contrib.auth import get_user_model
from django.db import connection, transaction
from django.test import Client
from django.test.utils import setup_test_environment

from payroll.models import Department, Employee


setup_test_environment()
User = get_user_model()
suffix = secrets.token_hex(4)
username = f"phase8-check-{suffix}"
password = secrets.token_urlsafe(24)
department_name = f"Phase8 Test {suffix}"
updated_name = f"Phase8 Updated {suffix}"
test_user = User.objects.create_user(username=username, password=password)
client = Client(enforce_csrf_checks=True, HTTP_HOST="localhost")
test_department_id = None

try:
    login_page = client.get("/login/")
    csrf_token = client.cookies["csrftoken"].value
    login_response = client.post(
        "/login/",
        {
            "username": username,
            "password": password,
            "csrfmiddlewaretoken": csrf_token,
        },
        HTTP_X_CSRFTOKEN=csrf_token,
    )
    assert login_page.status_code == 200
    assert login_response.status_code == 302 and login_response.url == "/dashboard/"
    csrf_token = client.cookies["csrftoken"].value

    anonymous = Client(HTTP_HOST="localhost").get("/departments/")
    assert anonymous.status_code == 302 and anonymous.url.startswith("/login/")

    listing = client.get("/departments/")
    assert listing.status_code == 200
    existing = Department.objects.order_by("department_id").first()
    assert existing is not None
    assert client.get("/departments/", {"q": existing.department_name}).status_code == 200
    assert existing.department_name.encode() in client.get(
        "/departments/", {"q": existing.department_name}
    ).content
    assert f"DEP-{existing.department_id}".encode() in client.get(
        "/departments/", {"q": f"DEP-{existing.department_id}"}
    ).content
    empty_search = client.get("/departments/", {"q": f"missing-{suffix}"})
    assert b"No departments found." in empty_search.content

    no_csrf = client.post("/departments/add/", {"department_name": department_name})
    assert no_csrf.status_code == 403

    invalid = client.post(
        "/departments/add/",
        {"department_name": "   ", "csrfmiddlewaretoken": csrf_token},
        HTTP_X_CSRFTOKEN=csrf_token,
    )
    assert invalid.status_code == 200 and b"This field is required" in invalid.content

    duplicate = client.post(
        "/departments/add/",
        {"department_name": existing.department_name.upper(), "csrfmiddlewaretoken": csrf_token},
        HTTP_X_CSRFTOKEN=csrf_token,
    )
    assert duplicate.status_code == 200 and b"already exists" in duplicate.content

    added = client.post(
        "/departments/add/",
        {"department_name": department_name, "csrfmiddlewaretoken": csrf_token},
        HTTP_X_CSRFTOKEN=csrf_token,
        follow=True,
    )
    new_department = Department.objects.get(department_name=department_name)
    test_department_id = new_department.department_id
    assert added.status_code == 200 and b"Department added successfully." in added.content

    empty_detail = client.get(f"/departments/{test_department_id}/")
    assert empty_detail.status_code == 200 and b"No employees belong to this department." in empty_detail.content

    edited = client.post(
        f"/departments/{test_department_id}/edit/",
        {"department_name": updated_name, "csrfmiddlewaretoken": csrf_token},
        HTTP_X_CSRFTOKEN=csrf_token,
        follow=True,
    )
    new_department.refresh_from_db()
    assert edited.status_code == 200 and b"Department updated successfully." in edited.content
    assert new_department.department_name == updated_name
    assert Department.objects.filter(department_id=test_department_id).count() == 1

    assigned_employee = Employee.objects.exclude(department_id__isnull=True).select_related("department").first()
    assert assigned_employee is not None and assigned_employee.department is not None
    member_detail = client.get(f"/departments/{assigned_employee.department_id}/")
    assert member_detail.status_code == 200 and assigned_employee.emp_name.encode() in member_detail.content
    assert str(assigned_employee.emp_id).encode() in member_detail.content

    protected_department_id = assigned_employee.department_id
    with transaction.atomic():
        blocked = client.post(
            f"/departments/{protected_department_id}/delete/",
            {"csrfmiddlewaretoken": csrf_token},
            HTTP_X_CSRFTOKEN=csrf_token,
        )
        assert blocked.status_code == 200
        assert b"cannot be deleted because employees are assigned to it" in blocked.content
        assert Department.objects.filter(department_id=protected_department_id).exists()
        transaction.set_rollback(True)
    assert Department.objects.filter(department_id=protected_department_id).exists()

    confirmation = client.get(f"/departments/{test_department_id}/delete/")
    assert confirmation.status_code == 200 and b"Current employees" in confirmation.content
    removed = client.post(
        f"/departments/{test_department_id}/delete/",
        {"csrfmiddlewaretoken": csrf_token},
        HTTP_X_CSRFTOKEN=csrf_token,
        follow=True,
    )
    assert removed.status_code == 200 and b"Department deleted successfully." in removed.content
    assert not Department.objects.filter(department_id=test_department_id).exists()
    test_department_id = None

    print({
        "login": login_response.status_code,
        "department_list": listing.status_code,
        "search_name_id_empty": True,
        "blank_and_duplicate_validation": True,
        "csrf_rejected": no_csrf.status_code,
        "add": added.status_code,
        "edit_same_record": edited.status_code,
        "detail_empty_and_members": True,
        "assigned_delete_blocked": blocked.status_code,
        "unassigned_delete": removed.status_code,
        "unauthenticated_redirect": anonymous.status_code,
    })
finally:
    if test_department_id and Department.objects.filter(department_id=test_department_id).exists():
        if not Employee.objects.filter(department_id=test_department_id).exists():
            token = client.cookies.get("csrftoken")
            if token is None:
                client.get("/login/")
                token = client.cookies["csrftoken"]
            client.post(
                f"/departments/{test_department_id}/delete/",
                {"csrfmiddlewaretoken": token.value},
                HTTP_X_CSRFTOKEN=token.value,
            )
    client.logout()
    with connection.cursor() as cursor:
        cursor.execute(
            "DELETE FROM auth_user WHERE id = %s AND username = %s",
            [test_user.pk, username],
        )
        print("Temporary auth user removed:", cursor.rowcount == 1)
