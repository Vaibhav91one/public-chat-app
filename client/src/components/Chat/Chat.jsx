import { MessageBox } from '../MessageBox/MessageBox'
import './Chat.scss'
import SendIcon from '@mui/icons-material/Send';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import { useSelector, useDispatch } from 'react-redux';
import { Navigate } from 'react-router';
import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import PusherClient from 'pusher-js'


export const Chat = () => {

  const data = useSelector((state) => state.UserInfo)
  const currentUserId = data?.userInfo?.userId;
  const [messages, setMessages] = useState([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [IncomingUserId, setIncomingUserId] = useState("")
  const divUnderMessagesRef = useRef();

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await axios.get('/messages/');
        setMessages(response.data);
      } catch (error) {
        console.error('Failed to fetch messages:', error);
      }
    }
    
    fetchData();
 }, []);

  if (!data?.userInfo?.username) {
    return <Navigate to='/' />
  }

  const pusherClient = new PusherClient(import.meta.env.VITE_PUSHER_KEY, {
    cluster: 'ap2',
  })

  const handleMessageSubmit = async (event) => {
    event.preventDefault();
    try {
      const response = await axios.post('/message', {
        userId: currentUserId,
        ChatRoomId: "mern-chat-app",
        username: data?.userInfo?.username,
        text: newMessageText,
      });

    } catch (error) {
      console.error(error);
    }

    setNewMessageText('');
  };

  const sendFile = (e) => {
    const reader = new FileReader();
    console.log(e.target.files)
    reader.readAsDataURL(e.target.files[0]);

    console.log("Sending File")

    reader.onload = async () => {
      try {
        const response = await axios.post('/message', {
          userId: currentUserId,
          ChatRoomId: "mern-chat-app",
          username: data?.userInfo?.username,
          name: e.target.files[0].name,
          file: reader.result,
          type: e.target.files[0].type
        });
        setNewMessageText('');

      } catch (error) {
        console.error(error);
      }
    }

  }

  useEffect(() => {
    pusherClient.subscribe("mern-chat-app")

    pusherClient.bind('incoming-message', (data) => {
      setMessages((prev) => {
        const existingMessage = prev.find((msg) => JSON.stringify(msg) === JSON.stringify(data));

        if (!existingMessage) {
          return [...prev, data];
        }

        // console.log(data)
        return prev;
      });
    })    

    return () => {
      pusherClient.unsubscribe("mern-chat-app")
    }
  }, [])

  useEffect(() => {
    const div = divUnderMessagesRef.current;

    if (div) {
      div.scrollIntoView({ behavior: 'smooth'});
    }
  }, [messages])



  return (
    <div className='ChatWrapper'>
      <div className="ChatBox" style={{ display: 'flex', flexDirection: 'column' }}>
        <div className='MessageBox' style={{ display: 'flex', flexDirection: 'column' }}>
          {messages.map((message, index) => {
            const direction = message.userId === currentUserId ? 'row-reverse' : 'row';
            
            return (
              <div key={index} style={{ display: 'flex', flexDirection: direction }}  >
                <MessageBox  username={message.username} message={message.text} file={message.file} id={message.userId} time={message.time} />
                <div ref={divUnderMessagesRef}></div>

              </div>
            );
          })}
        </div>
      </div>
      <form className='InputBox' onSubmit={handleMessageSubmit}>
        <input
          value={newMessageText}
          onChange={(e) => setNewMessageText(e.target.value)}
          type='text' placeholder='Type your message here' className='MessageInput' />

        <label type='button' className='labelInput'>
          <input type="file" className='FileInput' onChange={sendFile} />
          <AttachFileIcon />
        </label>

        <button type='submit' className='SendMessage' >
          <SendIcon />
        </button>
      </form>

      <p className='Note'>NOTE: If messages are not being shown the pusher daily limit might be up</p>
    </div>
  )
}
