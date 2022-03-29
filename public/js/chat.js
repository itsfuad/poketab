const socket = io();

let incommingmessage = new Audio('./../sounds/incommingmessage.wav');
let outgoingmessage = new Audio('./../sounds/outgoingmessage.wav');
let joinsound = new Audio('./../sounds/join.wav');
let leavesound = new Audio('./../sounds/leave.wav');
let typingsound = new Audio('./../sounds/typing.wav');

let myname;
let myid;

const appHeight = () => {
  const doc = document.documentElement
  doc.style.setProperty('--app-height', `${window.innerHeight}px`)
}

window.addEventListener('resize', appHeight);

appHeight();

let scrolling = false;
let lastPageLength = $('#messages').scrollTop();;
let scroll = 0;

$('#messages').scroll(function (event) {
  scroll = $('#messages').scrollTop();

  if (scroll >= lastPageLength) {
    lastPageLength = scroll;
    removeNewMessagePopup();
    scrolling = false;
  } else {
    scrolling = true;
  }
  //console.log(scrolling);
});

function updateScroll(avatar = null, text = '') {
  if (scrolling) {
    if (text.length > 0) {
      $('.newmessagepopup img').attr('src', `./../images/avatars/${avatar}(custom).png`);
      $('.newmessagepopup .msg').text(text.substring(0, 20));
      $('.newmessagepopup').fadeIn(200);
    }
    return;
  }
  let element = document.getElementById("messages");
  element.scrollTop = element.scrollHeight;
  lastPageLength = $('#messages').scrollTop();
  removeNewMessagePopup();
}

$('.newmessagepopup').click(function () {
  scrolling = false;
  updateScroll();
  removeNewMessagePopup();
});

function removeNewMessagePopup() {
  $('.newmessagepopup').fadeOut(200);
}

function scrollToBottom() {
  let messages = $('#messages');
  let newMessage = messages.children('li:last-child')
  let clientHeight = messages.prop('clientHeight');
  let scrollTop = messages.prop('scrollTop');
  let scrollHeight = messages.prop('scrollHeight');
  let newMessageHeight = newMessage.innerHeight();
  let lastMessageHeight = newMessage.prev().innerHeight();
  if (clientHeight + scrollTop + newMessageHeight + lastMessageHeight >= scrollHeight) {
    messages.scrollTop(scrollHeight);
  }
}

function censorBadWords(text) {
  text = text.replace(/fuck/g, 'f**k');
  text = text.replace(/shit/g, 's**t');
  text = text.replace(/bitch/g, 'b**t');
  text = text.replace(/asshole/g, 'a**hole');
  text = text.replace(/dick/g, 'd**k');
  text = text.replace(/pussy/g, 'p**s');
  text = text.replace(/cock/g, 'c**k');
  text = text.replace(/baal/g, 'b**l');
  text = text.replace(/sex/g, 's*x');
  text = text.replace(/Fuck/g, 'F**k');
  text = text.replace(/Shit/g, 'S**t');
  text = text.replace(/Bitch/g, 'B**t');
  text = text.replace(/Asshole/g, 'A**hole');
  text = text.replace(/Dick/g, 'D**k');
  text = text.replace(/Pussy/g, 'P**s');
  text = text.replace(/Cock/g, 'C**k');
  text = text.replace(/Baal/g, 'B**l');
  text = text.replace(/Sex/g, 'S*x');
  return text;
}

function makeid(length) {
  let result = '';
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() *
      charactersLength));
  }
  return result;
}

socket.on('connect', function () {
  let name = $('#myname').text();
  let key = $('#mykey').text();
  let avatar = $('#myavatar').text();
  let maxuser = $('#maxuser').text();
  //console.log(name, key, avatar, maxuser);
  let params = {
    name: name,
    key: key,
    avatar: avatar,
    maxuser: maxuser
  };
  //console.log(params);
  //params = $.deparam(window.location.search);
  //console.log("Connected to server");
  socket.emit('join', params, function (err) {
    if (err) {
     console.log(err);
    } else {
      console.log('No error');
    }
  });
  $('#main-screen').css('visibility', 'visible');
  $('#preloader').css('visibility', 'hidden');
});

socket.on('disconnect', function () {
  console.log('Disconnected from server');
});

socket.on('updateUserList', function (users, ids, key, avatars) {
  let ol = $('<ul></ul>');
  for (let i = 0; i < users.length; i++) {
    ol.append($(`<li class='user' id='${ids[i]}'></li>`).html(`<img height='30px' width='30px' src='images/avatars/${avatars[i]}(custom).png'> ${users[i]}`));
  }
  $('.menu').html(`<i class="fa-solid fa-user"></i> ${users.length}`);
  $('.keyname1').text(`${key}`);
  $('.keyname2').text(`${key}`);
  $('.users').html(ol);
});

socket.on('newMessage', function (message, avatar, isReply, replyTo, replyText, id, targetId) {
  incommingmessage.play();
  let formattedTime = moment(message.createdAt).format('hh:mm a');
  let template, html;
  if (isReply) {
    if (replyTo == myname) replyTo = 'You';
    template = $('#message-template').html();
    html = Mustache.render(template, {
      text: linkify(message.text),
      from: `${message.from} replied to ${replyTo}`,
      reply: replyText,
      id: id,
      repId: targetId,
      repIcon: `<i class="fa-solid fa-reply"></i>`,
      createdAt: formattedTime,
      attr: "style",
      replyMessageStyle: `display: block; transform: translateY(20px);`,
      messageTitleStyle: `transform: translateY(20px)`,
      attrVal: `images/avatars/${avatar}(custom).png`
    });
  } else {
    template = $('#message-template').html();
    html = Mustache.render(template, {
      text: linkify(message.text),
      from: message.from,
      id: id,
      attr: "style",
      replyMessageStyle: `display: none; transform: translateY(0px);`,
      messageTitleStyle: `transform: translateY(0px)`,
      createdAt: formattedTime,
      attrVal: `images/avatars/${avatar}(custom).png`
    });
  }
  html = html.replace(/¶/g, '<br>');
  $('#messages').append(html);
  if (emo_test(message.text)) {
    $("#messages li:last div p").css({
      "background": "none",
      "font-size": "30px",
      "padding": "0px"
    });
  }
  //closePopup();
  updateScroll(avatar, message.text);
});


socket.on('messageSent', function (replaceId, id) {
  outgoingmessage.play();
  $(`#${replaceId}`).attr('id', id);
  $(`#${id} .sent`).attr('class', 'fa-solid fa-circle-check sent');
});


socket.on('server_message', function (message, name = null, id = null) {
  myname = name || myname;
  myid = id || myid;

  let formattedTime = moment(message.createdAt).format('hh:mm a');
  let template = $('#server-message-template').html();
  let html = Mustache.render(template, {
    text: message.text,
    from: message.from,
    createdAt: formattedTime
  });
  if (message.text.includes('joined')) {
    html = html.replace(/<p>/g, `<p style='color: limegreen;'>`);
    joinsound.play();
  }
  if (message.text.includes('left')) {
    html = html.replace(/<p>/g, `<p style='color: orangered;'>`);
    leavesound.play();
  } else {
    html = html.replace(/<p>/g, `<p style='color: var(--blue);'>`);
  }

  $('#messages').append(html);
  updateScroll();
});

socket.on('newLocationMessage', function (message) {
  let formattedTime = moment(message.createdAt).format('hh:mm a');
  let template = $('#location-message-template').html();
  let html = Mustache.render(template, {
    from: message.from,
    url: message.url,
    createdAt: formattedTime
  });
  incommingmessage.play();
  $('#messages').append(html);
  updateScroll();
});

socket.on('typing', (user, id) => {
  typingsound.play();
  let li = $(`<li id="${id}"></li>`).text(user + ' is typing...');
  $('#typingindicator').append(li);
});

socket.on('stoptyping', (id) => {
  $(`#${id}`).remove();
});

socket.on('vibrateResponse', (sender_name, id) => {
  if (id == myid) {
    if (sender_name == myname) sender_name = 'You';
    $('.popup-message').text(`${sender_name} just vibrated your Device`);
    $('.popup-message').fadeIn(500);
    navigator.vibrate(1000);
    setTimeout(function () {
      $('.popup-message').fadeOut(500);
    }, 1000);
  }
});

socket.on('imageGet', (sendername, imagefile, avatar, id) => {
  let template = $('#image-message-template').html();
  let html = Mustache.render(template, {
    from: sendername,
    id: id,
    attrVal: `images/avatars/${avatar}(custom).png`,
    image: `<img class='image-message' src='${imagefile}'>`,
    createdAt: moment().format('hh:mm a')
  });
  incommingmessage.play();
  $('#messages').append(html);
  //on image loadedd
  $(`#${id}`).find('.image-message').on('load', function () {
  updateScroll(avatar, 'Photo');
  });
});

$('#message-form').on('submit', function (e) {
  e.preventDefault();
  let messageTextbox = $('[name=message]');
  let text = messageTextbox.val();
  messageTextbox.val('');
  if (text.length > 10000) {
    text = text.substring(0, 10000);
  }
  if (text.replace(/\n/g, '').replace(/ /g, '').length == 0) {
    $('#textbox').css('height', 'auto');
    return;
  }
  text = text.trim();
  text = censorBadWords(text);
  text = text.replace(/\n/g, '¶');
  let replaceId = makeid(10);
  let formattedTime = moment().format('hh:mm a');
  let template, html;
  if (isReply) {
    template = $('#my-message-template').html();
    html = Mustache.render(template, {
      text: linkify(text),
      from: `You replied to ${replyTo == myname ? 'You': replyTo}`,
      id: replaceId,
      repId: targetId,
      reply: replyText,
      repIcon: `<i class="fa-solid fa-reply"></i>`,
      createdAt: formattedTime,
      attr: "style",
      replyMessageStyle: `display: block; transform: translateY(20px);`,
      messageTitleStyle: `display: block; transform: translateY(20px)`,
    });
  } else {
    template = $('#my-message-template').html();
    html = Mustache.render(template, {
      text: linkify(text),
      id: replaceId,
      from: myname,
      attr: "style",
      replyMessageStyle: `display: none; transform: translateY(0px);`,
      messageTitleStyle: `display: none; transform: translateY(0px)`,
      createdAt: formattedTime,
    });
  }
  html = html.replace(/¶/g, '<br>');
  $('#messages').append(html);
  if (emo_test(text)) {
    $("#messages li:last div p").css({
      "background": "none",
      "font-size": "30px",
      "padding": "0px"
    });
  }
  typing = false;
  socket.emit('stoptyping');
  socket.emit('createMessage', {
      text: text
    }, replaceId, isReply, replyTo, replyText, targetId,
    function () {
      $('#textbox').css('height', 'auto');
    });
  $('#textbox').css('height', 'auto');
  
  scrolling = false;
  closePopup();
  clickOptionHide();
  updateScroll();
});

let locationButton = $('#send-location');
locationButton.on('click', function () {
  if (!navigator.geolocation) {
    return alert('Geolocation not supported by your browser.');
  }

  locationButton.attr('disabled', 'disabled').html(`<i class="fa-solid fa-location-crosshairs"></i>`);

  navigator.geolocation.getCurrentPosition(function (position) {
    locationButton.removeAttr('disabled').html(`<i class="fa-solid fa-location-crosshairs"></i>`);
    socket.emit('createLocationMessage', {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude
    });
  }, function () {
    locationButton.removeAttr('disabled').html(`<i class="fa-solid fa-location-crosshairs"></i>`);
    alert('Unable to fetch location.');
  });
});

let typing = false;
let timeout = undefined;
$('#textbox').on('keydown', function () {
  if (timeout) {
    clearTimeout(timeout);
    timeout = undefined;
  }
  if (!typing) {
    typing = true;
    socket.emit('typing');
  }
  timeout = setTimeout(function () {
    typing = false;
    socket.emit('stoptyping');
  }, 1000);
});


$('.menu').on('click', function () {
  $('.menuwrapper').addClass('active');
});

//remove all popup on click


$('#textbox').on('focus', function () {
  updateScroll();
});


function closePopup() {
  isReply = false;
  $('.toast-popup').hide();
  $('.toast-popup-name').text('');
  $('.toast-popup-message').text('');
  $('.menuwrapper').removeClass('active');
}

$('.toast-popup-close').on('click', () => {
  closePopup();
});

let isReply = false;
let replyTo, replyText;
let targetId;

function clickOptionShow(type, evt)
{
  $('.click-option').show();
  if(type === 'text'){
    $('.view-action').hide();
    $('.store-action').hide();
    $('.copy-action').show();
    $('.reply-action').on('click', () => {
      textReply(evt);
      clickOptionHide();
    });
    $('.copy-action').on('click', ()=>{
      copyText(evt.target.innerText);
      clickOptionHide();
    });
  }
  else if (type === 'image'){
    $('.view-action').show();
    $('.store-action').show();
    $('.copy-action').hide();
    $('.reply-action').on('click', () => {
      imageReply(evt);
      clickOptionHide();
    });
    $('.view-action').on('click', () => {
      openImageView(evt);
      clickOptionHide();
    });
    $('.store-action').on('click', () => {
      $('.lightbox__image').html('');
      $('.lightbox__image').append(`<img src="${evt.target.src}" alt="">`);
      saveImage();
      clickOptionHide();
    });
  }
}

function clickOptionHide()
{
  //console.log('hide');
  $('.click-option').hide();
  $('.view-action').hide();
  $('.store-action').hide();
  $('.copy-action').hide();
}

function textReply(evt)
{
  let target = evt.target;
  targetId = target.parentElement.parentElement.parentElement.id;
  replyText = `${target.innerText.substring(0, 200)} ...`;
  replyTo = evt.target.parentElement.previousElementSibling.previousElementSibling.innerText;
  replyTo = replyTo.replace(/ replied to [a-zA-Z]+/g, '');
  let replyToPop = replyTo;
  if (replyToPop == myname) replyToPop = 'You';
  if (replyTo == 'You') replyTo = myname;
  isReply = true;
  $('.toast-popup').show();
  $('.toast-popup-name').html(`<i class="fa-solid fa-reply"></i> Replying to ${replyToPop}`);
  $('.toast-popup-message').text(`${target.innerText.substring(0, 50)} ...`);
  $('#textbox').focus();
}

function imageReply(evt)
{
  //console.log(evt);
  let target = evt.target;
  targetId = target.parentElement.parentElement.parentElement.parentElement.id;
  replyText = `Image`;
  replyTo = target.parentElement.parentElement.previousElementSibling.innerText;
  replyTo = replyTo.replace(/ replied to [a-zA-Z]+/g, '');
  let replyToPop = replyTo;
  if (replyToPop == myname) replyToPop = 'You';
  if (replyTo == 'You') replyTo = myname;
  isReply = true;
  $('.toast-popup').show();
  $('.toast-popup-name').html(`<i class="fa-solid fa-reply"></i> Replying to ${replyToPop}`);
  $('.toast-popup-message').text(`Image`);
  $('#textbox').focus();
}

function openImageView(evt)
{
  let target = evt.target;
  $('.lightbox__image').html('');
  $('.lightbox__image').append(`<img src="${target.src}" alt="">`);
  $('.lightbox').fadeIn(100);
}

$('#messages').on('click', function (evt) {
  let target = evt.target;
  //console.log(target);
  if (target.className === 'textMessage') {
    clickOptionShow('text', evt);
  } else if (target.className.includes('replyMessage')) {
    const msgId = target.dataset.repid;
    const element = document.getElementById(msgId);
    element.scrollIntoView({
      block: "center"
    });
    $('#messages .my__message').css('filter', 'brightness(0.5)');
    $('#messages .message').css('filter', 'brightness(0.5)');
    $(`#${msgId}`).css('filter', 'initial');
    setTimeout(function () {
      $('#messages .my__message').css('filter', '');
      $('#messages .message').css('filter', '');
      $(`#${msgId}`).css('filter', '');
    }, 1000);
  }else if(target.className.includes('image-message')){
    clickOptionShow('image', evt);
  }
});

$('.key').on('click', () => {
  //console.log('clicked');
  let text = $('.keyname1').text();
  copyText(text);
});

function copyText(text){
  navigator.clipboard.writeText(text);
  $('.popup-message').text(`Copied to clipboard`);
  $('.popup-message').fadeIn(500);
  setTimeout(function () {
    $('.popup-message').fadeOut(500);
  }, 1000);
}

$('.users').on('click', function (evt) {
  evt.preventDefault();
  //console.log('clicked on users');
  let target = evt.target;
  if (target.className === 'user') {
    let targetId = target.id;
    socket.emit('vibrate', myname, targetId);
    if (targetId !== myid) {
      $('.popup-message').text(`You just vibrated ${target.innerText}'s Device`);
      $('.popup-message').fadeIn(500);
      setTimeout(function () {
        $('.popup-message').fadeOut(500);
      }, 1000);
    }
  }
});

$('.chat').on('click', function (evt) {
    $('.menuwrapper').removeClass('active');
});

$('.close-action').on('click', function (evt) {
  $('.click-option').hide();
});

function hideOnClickOutside(element) {
  const outsideClickListener = event => {
      if (!element.contains(event.target) && isVisible(element)) { // or use: event.target.closest(selector) === null
        element.style.display = 'none'
        removeClickListener()
      }
  }

  const removeClickListener = () => {
      document.removeEventListener('click', outsideClickListener)
  }

  document.addEventListener('click', outsideClickListener)
}

const isVisible = elem => !!elem && !!( elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length ) 


window.addEventListener('resize', () => {
  updateScroll();
});

$('.send').on('focus', function () {
  $('#textbox').focus();
});


$("textarea").each(function () {
  this.setAttribute("style", "height:" + (this.scrollHeight) + "px;overflow-y:hidden;");
}).on("input", function () {
  this.style.height = "auto";
  this.style.height = (this.scrollHeight) + "px";
});


$('#photo').on('change', ()=>{
  //console.log('Photo selected');
  
  var file = $('#photo')[0].files[0];
  var reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = function(e)
  {
    $('.previewimage__image').html("<img src='"+e.target.result+"' alt='image'/>");
  }
  $('.previewimage').show();

});

$('.previewimage__close').on('click', () => {
  $('.previewimage').hide(100);
});

$('.sendimage').on('click', () => {
  //console.log('Sending image');

  var file = $('#photo')[0].files[0];
  var reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = function(e)
  {
    let tempId = makeid(10);
    let template = $('#my-image-message-template').html();
    let html = Mustache.render(template, {
      from: myname,
      id: tempId,
      image: `<img class='image-message' src='${e.target.result}'>`,
      createdAt: moment(moment().valueOf()).format('hh:mm a')
    });
    $('#messages').append(html);
    updateScroll();
    socket.emit('image', myname, tempId, e.target.result);
  }
  $('.previewimage').hide();
  $('.previewimage__image').html("");
  clickOptionHide();
});

$('.lightbox__close').on('click', ()=>{
  lightboxClose();
});

function lightboxClose()
{
  $('.lightbox').fadeOut(100, ()=>{
    $('.lightbox__image').html("");
  });
}

$('.lightbox__save').on('click', ()=>{
  saveImage();
});

function saveImage()
{
  //console.log('Saving image');
  let a = document.createElement('a');
  a.href = $('.lightbox__image img').attr('src');
  a.download = `IMG-POKETAB-${moment().valueOf()}-${makeid(5)}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

$('.lightbox').on('click', e => { 
  if (e.target.className === 'lightbox__image'){
    lightboxClose();
  }
});

/*
$('.mode').on('click', ()=>{
  //console.log('clicked', $('.mode').hasClass('active'));
  if($('.mode').hasClass('active')){
    //console.log('Removing active');
    //Darkmode



    $('.mode').removeClass('active');
    $('.mode').html(`<i class="fa-solid fa-sun"></i>`);
  }
  else{
    //console.log('Adding class');
    //Light Mode




    $('.mode').addClass('active');
    $('.mode').html(`<i class="fa-solid fa-moon"></i>`);
  }
});
*/

function linkify(inputText) {
  let replacedText, replacePattern1, replacePattern2, replacePattern3;
  replacePattern1 = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
  replacedText = inputText.replace(replacePattern1, '<a href="$1" target="_blank">$1</a>');
  replacePattern2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
  replacedText = replacedText.replace(replacePattern2, '$1<a href="http://$2" target="_blank">$2</a>');
  replacePattern3 = /(([a-zA-Z0-9\-\_\.])+@[a-zA-Z\_]+?(\.[a-zA-Z]{2,6})+)/gim;
  replacedText = replacedText.replace(replacePattern3, '<a href="mailto:$1">$1</a>');
  return replacedText;
}

const emoji_regex = /^(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|[\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|[\ud83c[\ude32-\ude3a]|[\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])+$/;

function emo_test(str) {
  return emoji_regex.test(str);
}

$('#textbox').on('keydown', (evt) => {
  if (evt.ctrlKey && (evt.key === 'Enter')) {
    $('.send').click();
  }
});

document.addEventListener('contextmenu', event => event.preventDefault());
