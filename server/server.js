const path = require('path');
const http = require('http');
const express = require('express');
const socketIO = require('socket.io');
const uuid = require("uuid");
const bodyParser = require('body-parser');

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

const publicPath = path.join(__dirname, '../public');
const port = process.env.PORT || 3000;
let app = express();
let server = http.createServer(app);
let io = socketIO(server);
let users = new Users();

//view engine setup
app.set('views', path.join(__dirname, '../public'));
app.set('view engine', 'ejs');

app.use(express.static(publicPath));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));

app.get('/', (req, res) => {
  res.redirect('/login');
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/create', (req, res) => {
  res.render('create');
});

app.get('/chat', (req, res) => {
  res.redirect('/');
});

app.get('*', (req, res) => {
  res.render('404');
});

app.post('/chat', (req, res) => {
  //console.log(req.body);
  //res.sendFile(publicPath + `/chat.html`);
  res.render('chat', {myname: req.body.name, mykey: req.body.key, myavatar: req.body.avatar, maxuser: req.body.maxuser});
  //res.redirect(`/chat.html?key=${req.body.key}&name=${req.body.name}&avatar=${req.body.avatar}`);
});



io.on('connection', (socket) => {

  socket.on('join', (params, callback) => {
    console.log(users);
    //console.log(users.getMaxUser(params.key));
    //console.log(params.name, params.key, params.maxuser);
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

    console.log(`New user ${params.name} connected on key ${params.key}`);
    socket.join(params.key);
    users.removeUser(socket.id);
    users.addUser(socket.id, params.name, params.key, params.avatar, params.maxuser || users.getMaxUser(params.key));
    io.to(params.key).emit('updateUserList', users.getUserList(params.key), users.getUserId(params.key), params.key, users.getAvatarList(params.key));
    socket.emit('server_message', generateMessage('', `You joined the chat.🔥`), params.name, socket.id);
    socket.broadcast.to(params.key).emit('server_message', generateMessage(params.name, `${params.name} joined the chat.🔥`));
  });

  socket.on('createMessage', (message, replaceId, isReply, replyTo, replyText, targetId, callback) => {
    let user = users.getUser(socket.id);
    if (user && isRealString(message.text)) {
      let id = uuid.v4();
      socket.emit('my__message', replaceId, id);
      socket.broadcast.to(user.key).emit('newMessage', generateMessage(user.name, message.text), user.avatar, isReply, replyTo, replyText, id, targetId);
    }
  });

  socket.on('createLocationMessage', (coords) => {
    let user = users.getUser(socket.id);
    if (user) {
      io.to(user.key).emit('newLocationMessage', generateLocationMessage(user.name, coords.latitude, coords.longitude));
    }
  });

  socket.on('image', (sendername, tempId, imagefile) => {
    let user = users.getUser(socket.id);
    if (user) {
      let id = uuid.v4();
      console.log(tempId);
      socket.emit('imageSent', tempId, id);
      socket.broadcast.to(user.key).emit('imageGet', sendername, imagefile, user.avatar, id);
    }
  });

  socket.on('disconnect', () => {
    let user = users.removeUser(socket.id);
    if (user) {
      io.to(user.key).emit('updateUserList', users.getUserList(user.key), users.getUserId(user.key), user.key, users.getAvatarList(user.key));
      io.to(user.key).emit('server_message', generateMessage(user.name, `${user.name} left the chat.🐸`));
      console.log(`User ${user.name} disconnected from key ${user.key}`);
      //console.log(users);
      let usercount = users.users.filter(datauser => datauser.key === user.key);
      if (usercount.length === 0) {
        users.removeMaxUser(user.key);
      }
    }
  });

  socket.on('typing', () => {
    let user = users.getUser(socket.id);
    if (user) {
      socket.broadcast.to(user.key).emit('typing', user.name, user.id + '-typing');
    }
  });
  socket.on('stoptyping', () => {
    let user = users.getUser(socket.id);
    if (user) {
      socket.broadcast.to(user.key).emit('stoptyping', user.id + '-typing');
    }
  });
  socket.on('joinRequest', key => {
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
  socket.on('createRequest', key => {
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

  socket.on('vibrate', (sender_name, userId) => {
    let user = users.getUser(userId);
    if (user) {
      io.to(user.key).emit('vibrateResponse', sender_name, userId);
    }
  });
});


server.listen(port, () => {
  console.log(`Server is up on ${port}`);
});