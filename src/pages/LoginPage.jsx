import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

const LoginPage = ({ onLogin }) => {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()

    if (!username.trim() || !password) {
      setError('Username and password are required.')
      return
    }

    if (username.trim() !== 'admin' || password !== 'admin123') {
      setError('Invalid credentials. Use the development account provided below.')
      return
    }

    setError('')
    onLogin(rememberMe)
    navigate('/dashboard', { replace: true })
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-brand">
          <div className="brand-logo large">EP</div>
          <h1>Employee Payroll Management System</h1>
          <p>Secure admin access to manage payroll and employee operations.</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <Input
            label="Email or Username"
            type="text"
            placeholder="Enter your username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
          />
          <div className="password-field">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
            />
            <button type="button" className="password-toggle" onClick={() => setShowPassword((visible) => !visible)}>
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>

          {error && <p className="login-error" role="alert">{error}</p>}

          <div className="login-meta">
            <label className="remember-row">
              <input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} />
              Remember me
            </label>
            <button type="button" className="forgot-link" onClick={() => setError('Password recovery will be connected in a later phase.')}>Forgot password?</button>
          </div>

          <Button type="submit" className="full-width">Login</Button>
          <p className="mock-auth-note">Development login: <strong>admin</strong> / <strong>admin123</strong></p>
        </form>
      </div>
    </div>
  )
}

export default LoginPage
