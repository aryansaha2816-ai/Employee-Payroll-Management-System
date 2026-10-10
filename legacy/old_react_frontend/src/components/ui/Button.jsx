const Button = ({ children, variant = 'primary', size = 'md', className = '', ...props }) => {
  const variants = {
    primary: 'button button-primary',
    secondary: 'button button-secondary',
    danger: 'button button-danger',
    ghost: 'button button-ghost',
  }

  const sizes = {
    sm: 'button-sm',
    md: 'button-md',
    lg: 'button-lg',
  }

  return (
    <button className={`${variants[variant]} ${sizes[size]} ${className}`.trim()} {...props}>
      {children}
    </button>
  )
}

export default Button
