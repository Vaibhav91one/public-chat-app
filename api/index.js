const express = require('express')
const mongoose = require('mongoose')
const dotenv = require('dotenv')
const jwt = require('jsonwebtoken')
const cors = require('cors')
const bcrypt = require("bcryptjs")
const cookieParser = require('cookie-parser');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')
const ws = require('ws')
const fs = require('fs')
const User = require('./models/User')
const Message = require('./models/Message')
const PusherServer = require('pusher')
const bodyParser = require('body-parser')


dotenv.config();
mongoose.connect(process.env.MONGO_URI)


const jwtSecret = process.env.JWT_SECRET
const bcryptSalt = bcrypt.genSaltSync()
const bucket = 'vaibhav-mern-chat'

const pusherServer = new PusherServer({
    appId: process.env.APP_ID,
    key: process.env.PUSHER_KEY,
    secret: process.env.PUSHER_SECRET,
    cluster: 'ap2',
})

const app = express();
app.use(bodyParser.json({limit: '200mb'}));
app.use(
    bodyParser.urlencoded({
      extended: true,
      limit: '200mb',
      parameterLimit: 50000,
    }),
  );
app.use(express.json())
app.use(cookieParser())

var corsOptions = {
    credentials: true,
    origin: process.env.CLIENT_URL,
    optionsSuccessStatus: 200
}

app.use(cors(corsOptions))

async function getUserDataFromRequest(req) {

    return new Promise((resolve, reject) => {
        const token = req.cookies?.token;
        if (token) {
            jwt.verify(token, jwtSecret, {}, (err, userData) => {
                if (err) {
                    console.log('Token verification error:', err);
                    throw err;
                }
                resolve(userData)
            })
        }
        else {
            reject('no token');
        }
    })


}

app.get('/api/test', (req, res) => {
    res.json('test ok')
})

app.get('/api/messages/', async (req, res) => {
    try {
        const messages = await Message.find({}).sort({ createdAt: 1 });
        res.json(messages);
      } catch (error) {
        res.status(500).send(error);
      }
})

async function uploadToS3(data, originalFilename, mimetype) {
    const client = new S3Client({
        region: 'ap-southeast-2',
        credentials: {
            accessKeyId: process.env.S3_ACCESS_KEY,
            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
        },
    })

    const parts = originalFilename.split('.');
    const ext = parts[parts.length - 1];
    const newFilename = Date.now() + '.' + ext;

    const resDataS3 = await client.send(new PutObjectCommand({
        Bucket: bucket,
        Body: data,
        Key: newFilename,
        ContentType: mimetype,
        ACL: 'public-read',
    }))

    return `https://${bucket}.s3.amazonaws.com/${newFilename}`
}

app.post('/api/message', async (req, res) => {

    const { userId, ChatRoomId, username, text } = req.body;

    const { file, name, type } = req.body;

    const now = new Date();
    const time24 = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });

    let filename = ''

    if (file) {
        const bufferData = new Buffer(file.split(',')[1], 'base64');

        filename = await uploadToS3(bufferData, name, type)

        const Response = {
            userId: userId,
            username: username,
            file: filename,
            time: time24,
        };

        await pusherServer.trigger(ChatRoomId, "incoming-message", Response);

        const messageDoc = await Message.create(Response);

    res.status(200).json({ message: 'Message sent successfully.' });

    }
    else {
        const Response = {
            userId: userId,
            username: username,
            text: text,
            time: time24
        };

        await pusherServer.trigger(ChatRoomId, "incoming-message", Response);

        const messageDoc = await Message.create(Response);
    res.status(200).json({ message: 'Message sent successfully.' });

    }

}
);


app.get('/api/profile', (req, res) => {
    const token = req.cookies?.token;
    if (token) {
        jwt.verify(token, jwtSecret, {}, (err, userData) => {
            if (err) {
                console.log('Token verification error:', err);
                throw err;
            }
            res.json(userData)
        })
    } else {
        console.log('No token found in request');
        res.status(401).json('no token');
    }
})

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const foundUser = await User.findOne({ username })
    if (foundUser) {
        const passOk = bcrypt.compareSync(password, foundUser.password)
        if (passOk) {
            jwt.sign({ userId: foundUser._id, username }, jwtSecret, {}, (err, token) => {
                res.cookie('token', token, { sameSite: 'none', secure: true }).json({
                    _id: foundUser._id,
                    username: foundUser.username,
                });
            })
        } else {
            // Password is incorrect
            res.status(401).json({ message: 'Password is incorrect.' });
        }
    } else {
        // Username is not found
        res.status(401).json({ message: 'Username is not found.' });
    }
})


app.post('/api/logout', (req, res) => {
    res.cookie('token', '', { sameSite: 'none', secure: true }).json('Ok');
})

app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;

    try {
        const hashedPassword = bcrypt.hashSync(password, bcryptSalt)

        const createdUser = await User.create({
            username: username,
            password: hashedPassword
        });
        jwt.sign({ userId: createdUser._id, username }, jwtSecret, {}, (err, token) => {
            if (err) throw err;
            res.cookie('token', token, { sameSite: 'none', secure: true }).status(201).json({
                _id: createdUser._id,
            });
        })
    } catch (error) {
        if (error.code === 11000) {
            // Duplicate key error
            res.status(400).json({ message: 'Username already exists.' });
        } else {
            res.status(500).json('error');
        }
    }
});

async function uploadToS3(data, originalFilename, mimetype) {
    const client = new S3Client({
        region: 'ap-southeast-2',
        credentials: {
            accessKeyId: process.env.S3_ACCESS_KEY,
            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
        },
    })

    const parts = originalFilename.split('.');
    const ext = parts[parts.length - 1];
    const newFilename = Date.now() + '.' + ext;

    const resDataS3 = await client.send(new PutObjectCommand({
        Bucket: bucket,
        Body: data,
        Key: newFilename,
        ContentType: mimetype,
        ACL: 'public-read',
    }))

    return `https://${bucket}.s3.amazonaws.com/${newFilename}`
}

const server = app.listen(4000);

// const wss = new ws.WebSocketServer({ server });

// wss.on('connection', (connection, req) => {

//     function notifyAboutOnlinePeople() {
//         [...wss.clients].forEach(client => {
//             client.send(JSON.stringify({
//                 online: [...wss.clients].map(c => ({ userId: c.userId, username: c.username }))
//             }))
//         })
//     }

//     connection.isAlive = true;

//     connection.timer = setInterval(() => {
//         connection.ping();
//         connection.deathTimer = setTimeout(() => {
//             connection.isAlive = false;
//             clearInterval(connection.timer);
//             connection.terminate();
//             notifyAboutOnlinePeople();
//             console.log('dead');
//         }, 1000);
//     }, 5000);

//     connection.on('pong', () => {
//         clearTimeout(connection.deathTimer);
//     });

//     // read username and id from cookie for this connection
//     const cookies = req.headers.cookie;
//     if (cookies) {
//         const tokenCookieString = cookies.split(';').find(str => str.startsWith('token='))
//         if (tokenCookieString) {
//             const token = tokenCookieString.split('=')[1];
//             if (token) {
//                 jwt.verify(token, jwtSecret, {}, (err, userData) => {
//                     if (err) throw err;
//                     const { userId, username } = userData;
//                     connection.userId = userId;
//                     connection.username = username;
//                 })
//             }
//         }
//     }




//     connection.on('message', async (message) => {
//         const messageData = JSON.parse(message.toString());
//         const { recipient, text, file } = messageData;

//         let filename = null

//         if (file) {
//             const parts = file.name.split('.');
//             const ext = parts[parts.length - 1]
//             // const path = __dirname + '/uploads/' + filename;

//             // const {path, name, type} = file

//             const bufferData = new Buffer(file.data.split(',')[1], 'base64');

//             filename = await uploadToS3(bufferData, file.name, file.type)
//         }

//         if (recipient && (text || file)) {

//             const messageDoc = await Message.create({
//                 sender: connection.userId,
//                 recipient,
//                 text,
//                 file: file ? filename : null,
//             });

//             [...wss.clients].filter(c => c.userId === recipient)
//                 .forEach(c => c.send(JSON.stringify({
//                     text,
//                     sender: connection.userId,
//                     file: file ? filename : null,
//                     _id: messageDoc._id,
//                     recipient,
//                 })))
//         }
//     });

//     // notify everyone about online people
//     notifyAboutOnlinePeople();


// })