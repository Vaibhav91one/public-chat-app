import './Footer.scss'
import GitHubIcon from '@mui/icons-material/GitHub';
import XIcon from '@mui/icons-material/X';
export const Footer = () => {
  return (
    <footer className='FooterWrapper'>
      <div className='AppName'>
      <h2>
            Talk <span>Wisely</span>
          </h2>
      </div>
      <div className='SocialLinks'>
        <GitHubIcon/>
        <XIcon/>
      </div>  
    </footer>
  )
}
