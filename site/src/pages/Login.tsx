import React, { useState } from 'react'

const Login = ({loginData, setLoginData}:{
    loginData: {username: string, password: string},        
    setLoginData:(data:{username: string, password: string})=>void
}) => {
     const [loginFormData, setLoginFormData] = useState(loginData)
  return (
    <div className="login-container">
          <h2>Login</h2>
          <input
            type="text"
            placeholder="Username"
            value={loginFormData.username}
            onChange={(e) => setLoginFormData({ ...loginFormData, username: e.target.value })}
          />
          <input
            type="password"
            placeholder="Password"
            value={loginFormData.password}
            onChange={(e) => setLoginFormData({ ...loginFormData, password: e.target.value })}
          />
          <button onClick={() => {
            // Simulate login
            if (loginFormData.username && loginFormData.password) {
              setLoginData({ ...loginFormData })
            }
          }}>Login</button>
        </div>
  )
}

export default Login