from django.contrib import admin
from django.urls import include, path
from payroll.views import login_page

urlpatterns = [
    path("admin/", admin.site.urls),
    path("login/", login_page, name="login"),
    path("", include("payroll.urls")),
]
