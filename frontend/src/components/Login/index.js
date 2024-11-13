import React, { useState } from 'react';
import axios from 'axios';

import './index.css'

const  Login=()=> {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:5000/login', {
        email,
        password,
      });
      localStorage.setItem('token', response.data.token); 
      setMessage('Login successful!');
    } catch (error) {
      setMessage(error.response.data.error); 
    }
  };

  return (
    <div className="maincontainer">
      <h2 className="heading">Login</h2>
      <form onSubmit={handleLogin} className="form1">
        <input className="input1"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input className="input1"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Login</button>
      </form>
      <p>{message}</p> 
    </div>
  );
}

export default Login;
