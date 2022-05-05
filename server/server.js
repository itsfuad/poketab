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
const {Telegraf} = require('telegraf');
const axios = require("axios");

const apiKey = process.env.TELEGRAM_API_KEY;
const bot = new Telegraf(apiKey);


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

let keys = new Array();

const apiRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minute
  max: 100, // limit each IP to 100 requests per windowMs
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

app.get('/', (req, res) => {
  bot.telegram.sendMessage(process.env.TELEGRAM_ADMIN_ID, `Request from ip: ${req.ip}`, {});
  res.redirect('/login');
});

app.get('/login', (req, res) => {
  bot.telegram.sendMessage(process.env.TELEGRAM_ADMIN_ID, `/login Request from ip: ${req.ip}`, {});
  res.render('login', {title: "Login", key_label: 'Chat Key <i class="fa-solid fa-key"></i>', version: `v.${version}`, key: null});
});

app.get('/login/:key', (req, res)=>{
  bot.telegram.sendMessage(process.env.TELEGRAM_ADMIN_ID, `/login:KEY Request from ip: ${req.ip}`, {});
  const key_format = /^[0-9a-zA-Z]{3}-[0-9a-zA-Z]{3}-[0-9a-zA-Z]{3}-[0-9a-zA-Z]{3}$/;
  if (key_format.test(req.params.key)){
    res.render('login', {title: "Login", key_label: `Checking <i class="fa-solid fa-circle-notch fa-spin"></i>` , version: `v.${version}`, key: req.params.key});
  }
  else{
    res.redirect('/');
  }
});

app.get('/create', (req, res) => {
  bot.telegram.sendMessage(process.env.TELEGRAM_ADMIN_ID, `/Create Request from ip: ${req.ip}`, {});
  const key = makeid(12);
  keys.push(key);
  res.render('create', {title: "Create", version: `v.${version}`, key: key});
});

app.get('/chat', (req, res) => {
  bot.telegram.sendMessage(process.env.TELEGRAM_ADMIN_ID, `Cheat Request from ip: ${req.ip}`, {});
  res.redirect('/');
});

app.get('/offline', (_, res) => {
  res.render('offline');
});

app.get('*', (req, res) => {
  bot.telegram.sendMessage(process.env.TELEGRAM_ADMIN_ID, `Error Request from ip: ${req.ip}`, {});
  res.render('404');
});

app.post('/chat', (req, res) => {
  bot.telegram.sendMessage(process.env.TELEGRAM_ADMIN_ID, `POST Request from ip: ${req.ip}`, {});
  let username = req.body.name.replace(/(<([^>]+)>)/gi, "");
  //get current users list on key
  let key = req.body.key;
  if (keys.includes(key)){
    let user = users.getUserList(key);
    let max_users = users.getMaxUser(key);
    let uid = uuid.v4();
    if (user.length >= max_users){
      //send unauthorized access message
      res.status(401).send({
        message: "Unauthorized access"
      });
      bot.telegram.sendMessage(process.env.TELEGRAM_ADMIN_ID, `Unauthorized access from ${req.body.name}`);
    }
    res.render('chat', {myname: username, mykey: key, myid: uid, myavatar: req.body.avatar, maxuser: req.body.maxuser || max_users});
  }else{
    //send invalid key message
    res.status(401).send({
      message: "Invalid key"
    });
  }
});


function makeid(count){
  let text = "";
  let possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const key_format = /^[0-9a-zA-Z]{3}-[0-9a-zA-Z]{3}-[0-9a-zA-Z]{3}-[0-9a-zA-Z]{3}$/;
  for (let i = 0; i < count; i++){
    if (i % 3 == 0 && i != 0){
        text += '-';
    }
    text += possible.charAt(Math.floor(Math.random() * possible.length - 1));
  }
  if (!key_format.test(text)){
    text = makeid(count);
  }
  return text;
}


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
    socket.emit('server_message', generateMessage('', `You joined the chat.🔥`));
    socket.broadcast.to(params.key).emit('server_message', generateMessage('', `${params.name} joined the chat.🔥`));
    console.log(`New user ${params.name} connected on key ${params.key} with avatar ${params.avatar} and maxuser ${params.maxuser || users.getMaxUser(params.key)}`);
  });

  socket.on('createMessage', (message, sender_id, replaceId, isReply, replyTo, replyText, targetId, callback) => {
    let user = users.getUser(socket.id);
    if (user && isRealString(message.text)) {
      let id = uuid.v4();
      message.text = message.text.replace(/>/gi, "&gt;").replace(/</gi, "&lt;");
      socket.emit('messageSent', replaceId, id);
      socket.broadcast.to(user.key).emit('newMessage', generateMessage(user.name, message.text), sender_id, user.avatar, isReply, replyTo, replyText, id, targetId);
    }
  });

  socket.on('createLocationMessage', (coords) => {
    let user = users.getUser(socket.id);
    if (user) {
      io.to(user.key).emit('newLocationMessage', generateLocationMessage(user.name, coords.latitude, coords.longitude));
    }
  });

  socket.on('image', (sendername, sender_id, tempId, imagefile) => {
    let user = users.getUser(socket.id);
    if (user) {
      let id = uuid.v4();
      socket.emit('messageSent', tempId, id);
      socket.broadcast.to(user.key).emit('imageGet', sendername, sender_id, imagefile, user.avatar, id);
    }
  });

  socket.on('disconnect', () => {
    let user = users.removeUser(socket.id);
    if (user) {
      io.to(user.key).emit('updateUserList', users.getUserList(user.key), users.getUserId(user.key), user.key, users.getAvatarList(user.key));
      io.to(user.key).emit('server_message', generateMessage(user.name, `${user.name} left the chat.🐸`));
      console.log(`User ${user.name} disconnected from key ${user.key}`);
      let usercount = users.users.filter(datauser => datauser.key === user.key);
      if (usercount.length === 0) {
        users.removeMaxUser(user.key);
        //delete key from keys
        keys = keys.filter(key => key !== user.key);

        console.log(`Session ended with key: ${user.key}`);
      }
      console.log(`${usercount.length } users left`);
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
  socket.on('joinRequest', (key) => {
    const key_format = /^[0-9a-zA-Z]{3}-[0-9a-zA-Z]{3}-[0-9a-zA-Z]{3}-[0-9a-zA-Z]{3}$/;;
    if (key_format.test(key) && keys.includes(key)){
      let maxuser = users.getMaxUser(key);
      let userlist = users.getUserList(key);
      let avatarList = users.getAvatarList(key);
      socket.emit('joinResponse',true, userlist, avatarList, maxuser);
    }
    else{
      socket.emit('joinResponse', false, null, null, null);
    }
  });
  socket.on('createRequest', (key, callback) => {
    let keyExists = users.getUserList(key).length > 0;
    if (keyExists){
      socket.emit('createResponse', keyExists, null, null);
    }
    else{
      const key_format = /^[0-9a-zA-Z]{3}-[0-9a-zA-Z]{3}-[0-9a-zA-Z]{3}-[0-9a-zA-Z]{3}$/;;
      if (key_format.test(key) && keys.includes(key)) {
        socket.emit('createResponse', keyExists);
        console.log('Creating new key: ' + key);
        let userlist = users.getUserList(key);
        let avatarList = users.getAvatarList(key);
        socket.emit('createResponse', keyExists, userlist, avatarList);
      }
      else{
        callback('Invalid key');
      }
    }
  });

  socket.on('reaction', (targetId, userName, avatar, reaction) => {
    let user = users.getUser(socket.id);
    if (user) {
      io.to(user.key).emit('reactionResponse', targetId, userName, avatar, reaction);
    }
  });

  socket.on('removeReact', (u_name, id)=>{
    let user = users.getUser(socket.id);
    if (user) {
      io.to(user.key).emit('removeReactResponse', u_name, id);
    }
  });

  socket.on('delete message', (messageId, msgUid, userName, userId) => {
    let user = users.getUser(socket.id);
    if (user) {
      if (msgUid == userId){
        io.to(user.key).emit('deleteMessage', messageId, userName);
      }
    }
  });

});

console.log(`Telegram bot started`);

bot.command('start', ctx => {
  console.log(ctx.from)
  bot.telegram.sendMessage(ctx.chat.id, 'Hello there! Welcome to the Code Capsules telegram bot.\nI respond to /ethereum. Please try it', {
  })
})

bot.command('ethereum', ctx => {
  var rate;
  //console.log(ctx.from)
  axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd`)
  .then(response => {
    //console.log(response.data)
    rate = response.data.ethereum
    const message = `Hello, today the ethereum price is ${rate.usd}USD`
    bot.telegram.sendMessage(ctx.chat.id, message, {
    })
  })
})


bot.launch();


server.listen(port, () => {
  console.log(`Server is up on ${port}`);
});
