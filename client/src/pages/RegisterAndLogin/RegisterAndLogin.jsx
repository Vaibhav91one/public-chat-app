import { useState, useEffect } from 'react';
import './RegisterAndLogin.scss'
import axios from 'axios'
import { useSelector, useDispatch } from 'react-redux';
import { setUserInfo } from '../../store/Slices/UserInfo/UserInfoSlice';
import { useNavigate } from 'react-router-dom'
import { Navigate } from 'react-router';

export const RegisterAndLogin = () => {

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginOrRegister, setIsLoginOrRegister] = useState('register');

  // const data = useSelector((state) => state.UserInfo)

  const navigate = useNavigate();

  const dispatch = useDispatch();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = isLoginOrRegister === 'register' ? 'register' : 'login'
    try {
      const response = await axios.post(`/${url}`, { username, password });

      if (response.status >= 200 && response.status < 300) {
        dispatch(setUserInfo(response.data));
        navigate('/chat')
      } else {
        alert.error('Error during request');
      }
    } catch (error) {
      console.error('Error during request', error);
    }
  }

  useEffect(() => {
    axios.get('/profile', { withCredentials: true })
      .then((response) => {
        dispatch(setUserInfo(response.data))
      navigate('/chat')
      })
      .catch(error => console.error('Error:', error));
  }, []);

  return (
    <div className="RegisterWrapper" onSubmit={handleSubmit}>
      <form className="FormWrapper">
        <input value={username} onChange={(e) => { setUsername(e.target.value) }}
          type='text' placeholder='Username' className='usernameInput' />
        <input value={password} onChange={(e) => { setPassword(e.target.value) }}
          type='password' placeholder='Password' className='passwordInput' />
        <button className="SubmitButton">
          {isLoginOrRegister === 'register' ? 'Register' : 'Login'}
        </button>
        {isLoginOrRegister === 'register' && (
          <div className="additionalInfo">
            Already a member?
            <button className='switchBtn'
              onClick={() => { setIsLoginOrRegister("login") }}
            >Login Here</button>
          </div>

        )}
        {isLoginOrRegister === 'login' && (
          <div className="additionalInfo">
            Dont have an account?
            <button className='switchBtn'
              onClick={() => { setIsLoginOrRegister("register") }}
            >Register</button>
          </div>

        )}

      </form>
    </div>
  )
}
