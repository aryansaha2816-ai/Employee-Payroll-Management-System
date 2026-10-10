export const employees = [
  { emp_id: 1, emp_name: 'Aisha Khan', gender: 'Female', department_id: 1, department_name: 'Human Resources', designation: 'HR Manager', join_date: '2021-06-15', basic_salary: 82000 },
  { emp_id: 2, emp_name: 'Rohit Sharma', gender: 'Male', department_id: 2, department_name: 'Engineering', designation: 'Senior Developer', join_date: '2020-09-10', basic_salary: 120000 },
  { emp_id: 3, emp_name: 'Priya Nair', gender: 'Female', department_id: 3, department_name: 'Finance', designation: 'Accountant', join_date: '2022-01-20', basic_salary: 76000 },
  { emp_id: 4, emp_name: 'Daniel Wilson', gender: 'Male', department_id: 4, department_name: 'Operations', designation: 'Operations Lead', join_date: '2019-11-05', basic_salary: 98000 },
  { emp_id: 5, emp_name: 'Meera Patel', gender: 'Female', department_id: 2, department_name: 'Engineering', designation: 'Frontend Developer', join_date: '2023-02-14', basic_salary: 86000 },
]

export const departments = [
  { department_id: 1, department_name: 'Human Resources', employee_count: 12 },
  { department_id: 2, department_name: 'Engineering', employee_count: 28 },
  { department_id: 3, department_name: 'Finance', employee_count: 8 },
  { department_id: 4, department_name: 'Operations', employee_count: 15 },
  { department_id: 5, department_name: 'Sales', employee_count: 10 },
]

export const attendance = [
  { attendance_id: 1, emp_id: 1, emp_name: 'Aisha Khan', attendance_date: '2026-09-01', status: 'Present' },
  { attendance_id: 2, emp_id: 2, emp_name: 'Rohit Sharma', attendance_date: '2026-09-01', status: 'Present' },
  { attendance_id: 3, emp_id: 3, emp_name: 'Priya Nair', attendance_date: '2026-09-01', status: 'Late' },
  { attendance_id: 4, emp_id: 4, emp_name: 'Daniel Wilson', attendance_date: '2026-09-01', status: 'Absent' },
  { attendance_id: 5, emp_id: 5, emp_name: 'Meera Patel', attendance_date: '2026-09-01', status: 'Present' },
  { attendance_id: 6, emp_id: 1, emp_name: 'Aisha Khan', attendance_date: '2026-09-02', status: 'Present' },
  { attendance_id: 7, emp_id: 2, emp_name: 'Rohit Sharma', attendance_date: '2026-09-02', status: 'Present' },
  { attendance_id: 8, emp_id: 3, emp_name: 'Priya Nair', attendance_date: '2026-09-02', status: 'Present' },
]

export const leaveRecords = [
  { leave_id: 1, emp_id: 2, emp_name: 'Rohit Sharma', leave_type: 'Annual', from_date: '2026-09-10', to_date: '2026-09-12', status: 'Approved' },
  { leave_id: 2, emp_id: 3, emp_name: 'Priya Nair', leave_type: 'Medical', from_date: '2026-09-11', to_date: '2026-09-13', status: 'Pending' },
  { leave_id: 3, emp_id: 5, emp_name: 'Meera Patel', leave_type: 'Casual', from_date: '2026-09-14', to_date: '2026-09-14', status: 'Approved' },
  { leave_id: 4, emp_id: 1, emp_name: 'Aisha Khan', leave_type: 'Sick', from_date: '2026-09-15', to_date: '2026-09-16', status: 'Rejected' },
]

export const payrolls = [
  { payroll_id: 1, emp_id: 1, emp_name: 'Aisha Khan', month: 'Sep 2026', basic_salary: 82000, bonus: 4000, deductions: 1500, net_salary: 84500 },
  { payroll_id: 2, emp_id: 2, emp_name: 'Rohit Sharma', month: 'Sep 2026', basic_salary: 120000, bonus: 6500, deductions: 2100, net_salary: 124400 },
  { payroll_id: 3, emp_id: 3, emp_name: 'Priya Nair', month: 'Sep 2026', basic_salary: 76000, bonus: 3000, deductions: 1200, net_salary: 77800 },
  { payroll_id: 4, emp_id: 4, emp_name: 'Daniel Wilson', month: 'Sep 2026', basic_salary: 98000, bonus: 5200, deductions: 1800, net_salary: 100400 },
  { payroll_id: 5, emp_id: 5, emp_name: 'Meera Patel', month: 'Sep 2026', basic_salary: 86000, bonus: 4100, deductions: 1400, net_salary: 87700 },
]

export const reports = [
  { title: 'Monthly Payroll Summary', value: '₹ 5,22,800', trend: '+8.2%' },
  { title: 'Attendance Rate', value: '94.6%', trend: '+2.4%' },
  { title: 'Leave Requests', value: '18', trend: '-1.1%' },
  { title: 'Pending Payouts', value: '₹ 88,450', trend: '+5.7%' },
]
