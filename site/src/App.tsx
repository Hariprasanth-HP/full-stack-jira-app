import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";

function App() {
  const [loginData, setLoginData] = useState({
    username: "",
    password: "",
  });

  return (
    <div
    style={{
      width:'100vw'
    }}
    >
      {loginData.username ? (
        <Login loginData={loginData} setLoginData={setLoginData} />
      ) : (
        <Dashboard />
      )}
    </div>
  );
}

export default App;
