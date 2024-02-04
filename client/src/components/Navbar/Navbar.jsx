import Button from '@mui/material/Button';
import './Navbar.scss'
import LoginIcon from '@mui/icons-material/Login';
import { createTheme } from '@mui/material/styles';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import PersonIcon from '@mui/icons-material/Person';
import axios from 'axios'
import { setUserInfo } from '../../store/Slices/UserInfo/UserInfoSlice';

const theme = createTheme({
  palette: {
    myWhite: {
      main: '#FFFFFF',
      contrastText: 'black', // Choose the color of the text inside the button
    },
  },
});

export const Navbar = () => {


  const data = useSelector((state) => state.UserInfo)
  const dispatch = useDispatch();
  const navigate = useNavigate()

  const HandleLogout = async() =>{
    await axios.post('/logout', { withCredentials: true })
      .then(
        (response) => {
          dispatch(setUserInfo())
          navigate('/')
        })
      .catch(error => console.error('Error:', error));
  }

  return (
    <header>
      <nav className='NavBarWrapper'>
        <div className="AppName">
          <h2>
            Talk <span>Wisely</span>
          </h2>
        </div>


        {!(data?.userInfo?.username) && (
          <Link to="/">
            <div className="LoginButton">
              <Button variant="outlined" sx={{ color: theme.palette.myWhite.main, borderColor: theme.palette.myWhite.main }} endIcon={<LoginIcon />}>
                Login
              </Button>
            </div>
          </Link>
        )}


        {data?.userInfo?.username && (
          <div className='NavInfo'>
            <div className='userInfo'>
              <PersonIcon/>
              {data?.userInfo.username}
            </div>
            <div className="LogoutButton" onClick={HandleLogout}>
              <LoginIcon />
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
