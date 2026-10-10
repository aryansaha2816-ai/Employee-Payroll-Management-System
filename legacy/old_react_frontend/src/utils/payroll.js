export const calculateNetSalary = (basicSalary, bonus, deductions) => (
  Number(basicSalary || 0) + Number(bonus || 0) - Number(deductions || 0)
)

export const formatCurrency = (value) => `₹ ${Number(value || 0).toLocaleString('en-IN')}`
