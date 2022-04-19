/**
 * @author Fuad Hasan
 * @version 6.1.0
 * @since   2022-03-06
 */

const path = require('path');
const http = require('http');
const compression = require('compression');
const express = require('express');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const socketIO = require('socket.io');
const uuid = require("uuid");
const version = process.env.npm_package_version;

const {
  generateMessage,
  generateLocationMessage
} = require('./utils/message');
const {
  isRealString
} = require('./utils/validation');
const {
  Users
} = require('./utils/users');

const apiRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 1 minute
  max: 100, // limit each IP to 5 requests per windowMs
  message: "Too many requests. Temporarily blocked from PokeTab server. Please try again later",
  //handler: function (req, res, next) {
  //  res.render('block');
  //  next()
 // },
  standardHeaders: false, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false // Disable the `X-RateLimit-*` headers
});

const publicPath = path.join(__dirname, '../public');
const port = process.env.PORT || 3000;
let app = express();
let server = http.createServer(app);
let io = socketIO(server);
let users = new Users();

app.disable('x-powered-by');

//view engine setup
app.set('views', path.join(__dirname, '../public/views'));
app.set('view engine', 'ejs');
app.set('trust proxy', 1);

app.use(cors());
app.use(compression());
app.use(express.static(publicPath));
app.use(express.json());
app.use(express.urlencoded({
  extended: false
}));

app.use(apiRequestLimiter);

app.get('/', (_, res) => {
  res.redirect('/login');
});

app.get('/login', (_, res) => {
  res.render('login', {title: "Login", key_label: 'Enter join key <i class="fa-solid fa-key"></i>', version: `v.${version}`, key: null});
});

app.get('/login/:key', (req, res)=>{
  //console.log(req.params);
  let key_format = /^[0-9a-zA-Z]{3}-[0-9a-zA-Z]{3}-[0-9a-zA-Z]{3}-[0-9a-zA-Z]{3}$/;
  if (key_format.test(req.params.key)){
    res.render('login', {title: "Login", key_label: `Checking <i class="fa-solid fa-circle-notch fa-spin"></i>` , version: `v.${version}`, key: req.params.key});
  }
  else{
    res.redirect('/');
  }
});

app.get('/create', (_, res) => {
  res.render('create', {title: "Create", version: `v.${version}`});
});

app.get('/chat', (_, res) => {
  res.redirect('/');
});

app.get('*', (_, res) => {
  res.render('404');
});

app.post('/chat', (req, res) => {
  let username = req.body.name.replace(/(<([^>]+)>)/gi, "");
  res.render('chat', {myname: username, mykey: req.body.key, myavatar: req.body.avatar, maxuser: req.body.maxuser || users.getMaxUser(req.body.key)});
});



io.on('connection', (socket) => {
  socket.on('join', (params, callback) => {
    if (!isRealString(params.name) || !isRealString(params.key)) {
      return callback('empty');
    }
    if (params.avatar === undefined) {
      return callback('avatar');
    }
    let userList = users.getUserList(params.key);
    let user = userList.includes(params.name);
    if (user) {
      return callback('exists');
    }
    callback();
    socket.join(params.key);
    users.removeUser(socket.id);
    users.addUser(socket.id, params.name, params.key, params.avatar, params.maxuser || users.getMaxUser(params.key));
    io.to(params.key).emit('updateUserList', users.getUserList(params.key), users.getUserId(params.key), params.key, users.getAvatarList(params.key));
    socket.emit('server_message', generateMessage('', `You joined the chat.🔥`), params.name, socket.id);
    socket.broadcast.to(params.key).emit('server_message', generateMessage(params.name, `${params.name} joined the chat.🔥`));
    console.log(`New user ${params.name} connected on key ${params.key} with avatar ${params.avatar} and maxuser ${params.maxuser || users.getMaxUser(params.key)}`);
    //console.log(users.getMaxUser(params.key));
  });

  socket.on('createMessage', async (message, replaceId, isReply, replyTo, replyText, targetId, callback) => {
    let user = users.getUser(socket.id);
    if (user && isRealString(message.text)) {
      let id = uuid.v4();
      message.text = message.text.replace(/>/gi, "&gt;").replace(/</gi, "&lt;");
      socket.emit('messageSent', replaceId, id);
      socket.broadcast.to(user.key).emit('newMessage', generateMessage(user.name, message.text), user.avatar, isReply, replyTo, replyText, id, targetId);
    }
  });

  socket.on('createLocationMessage', async (coords) => {
    let user = users.getUser(socket.id);
    if (user) {
      io.to(user.key).emit('newLocationMessage', generateLocationMessage(user.name, coords.latitude, coords.longitude));
    }
  });

  socket.on('image', async (sendername, tempId, imagefile) => {
    let user = users.getUser(socket.id);
    if (user) {
      let id = uuid.v4();
      socket.emit('messageSent', tempId, id);
      socket.broadcast.to(user.key).emit('imageGet', sendername, imagefile, user.avatar, id);
    }
  });

  socket.on('disconnect', async () => {
    let user = users.removeUser(socket.id);
    if (user) {
      io.to(user.key).emit('updateUserList', users.getUserList(user.key), users.getUserId(user.key), user.key, users.getAvatarList(user.key));
      io.to(user.key).emit('server_message', generateMessage(user.name, `${user.name} left the chat.🐸`));
      console.log(`User ${user.name} disconnected from key ${user.key}`);
      console.log(users.getMaxUser(user.key));
      let usercount = users.users.filter(datauser => datauser.key === user.key);
      if (usercount.length === 0) {
        users.removeMaxUser(user.key);
        console.log(`Session ended with key: ${user.key}`);
        console.log(users.getMaxUser(user.key));
      }
    }
  });

  socket.on('typing', async () => {
    let user = users.getUser(socket.id);
    if (user) {
      socket.broadcast.to(user.key).emit('typing', user.name, user.id + '-typing');
    }
  });
  socket.on('stoptyping', async () => {
    let user = users.getUser(socket.id);
    if (user) {
      socket.broadcast.to(user.key).emit('stoptyping', user.id + '-typing');
    }
  });
  socket.on('joinRequest', (key) => {
    console.log('Requset for join chat: ' + key);
    let maxuser = users.getMaxUser(key);
    let keyExists = users.getUserList(key).length > 0;
    if (!keyExists){
      socket.emit('joinResponse', keyExists, null, null, null);
    }
    else{
      console.log('New User Attempt');
      let userlist = users.getUserList(key);
      let avatarList = users.getAvatarList(key);
      socket.emit('joinResponse',keyExists, userlist, avatarList, maxuser);
    }
  });
  socket.on('createRequest', async (key) => {
    console.log('Requset for create chat: ' + key);
    let keyExists = users.getUserList(key).length > 0;
    if (keyExists){
      socket.emit('createResponse', keyExists, null, null);
    }
    else{
      socket.emit('createResponse', keyExists);
      console.log('New User Attempt');
      let userlist = users.getUserList(key);
      let avatarList = users.getAvatarList(key);
      socket.emit('createResponse', keyExists, userlist, avatarList);
    }
  });

  socket.on('vibrate', async (sender_name, userId) => {
    let user = users.getUser(userId);
    if (user) {
      io.to(user.key).emit('vibrateResponse', sender_name, userId);
    }
  });

  socket.on('reaction', (targetId, userName, reaction) => {
    //console.log('Reaction: ' + reaction);
    //console.log('TargetId: ' + targetId);
    //console.log('User: ' + userName);
    //console.log(reaction);
    let user = users.getUser(socket.id);
    if (user) {
      io.to(user.key).emit('reactionResponse', targetId, userName, reaction);
    }
  });

  socket.on('removeReact', (u_name, id)=>{
    let user = users.getUser(socket.id);
    if (user) {
      io.to(user.key).emit('removeReactResponse', u_name, id);
    }
  });

  socket.on('delete message', (messageId, userD) => {
    let user = users.getUser(socket.id);
    if (user) {
      io.to(user.key).emit('deleteMessage', messageId, userD);
    }
  });

  socket.on('delete image', (messageId, userD) => {
    let user = users.getUser(socket.id);
    if (user) {
      io.to(user.key).emit('deleteImage', messageId, userD);
    }
  });
});

server.listen(port, () => {
  console.log(`Server is up on ${port}`);
});
