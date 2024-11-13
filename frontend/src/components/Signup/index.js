import React, { useState} from 'react';
import axios from 'axios';



import './index.css'

const  Signup=()=> {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
 
  

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:3523/register', {
        name,
        email,
        password,
      });
      console.log(response)
      setMessage(response.data.message); 
    } catch (error) {
    const errorMessage = error.response?.data?.error || "An unexpected error occurred. Please try again.";
    setMessage(errorMessage); 
    console.error("Signup error:", error);
  }
};

  return (
    <div className="maincontainer">
      <h2 className="heading">Signup</h2>
      <form onSubmit={handleSignup} className="form1">
        <input className="input1"
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        /><input className="input1"
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
        <button type="submit">Signup</button>
      </form>
      <p>{message}</p>

    </div>
  );
}

export default Signup;
