let socket = io();

let pop = new Audio('./../sounds/pop.wav');
let juntos = new Audio('./../sounds/juntos.wav');
let elegant = new Audio('./../sounds/elegant.wav');
let typing_sound = new Audio('./../sounds/typing.wav');

let myname;
let myid;

const appHeight = () => {
  const doc = document.documentElement
  doc.style.setProperty('--app-height', `${window.innerHeight}px`)
}
window.addEventListener('resize', appHeight);
appHeight();

let scrolling = false;

window.onscroll = (e) => {  
  scrolling = true;
  setTimeout(() => {
    scrolling = false;
  }, 2000);  
}

function updateScroll(){
  if (scrolling) {
    return;
  }
  let element = document.getElementById("messages");
  element.scrollTop = element.scrollHeight;
}

function scrollToBottom () {
  // Selectors
  let messages = $('#messages');
  let newMessage = messages.children('li:last-child')
  // Heights
  let clientHeight = messages.prop('clientHeight');
  let scrollTop = messages.prop('scrollTop');
  let scrollHeight = messages.prop('scrollHeight');
  let newMessageHeight = newMessage.innerHeight();
  let lastMessageHeight = newMessage.prev().innerHeight();

  if (clientHeight + scrollTop + newMessageHeight + lastMessageHeight >= scrollHeight) {
    messages.scrollTop(scrollHeight);
  }
}

socket.on('connect', function () {
  let params = $.deparam(window.location.search);
  console.log("Connected to server");
  elegant.play();
  socket.emit('join', params, function (err) {
    if (err) {
      //alert(err);
      if (err == 'empty') {
        window.location.href = '/?NR_0';
      }
      else if (err == 'exists'){
        window.location.href = '/?UE_1';
      }
      else if (err == 'avatar'){
        window.location.href = '/?NA_0';
      }

    } else {
      console.log('No error');
    }
  });
  //document.getElementById('main-screen').style.visibility = 'visible';
  //document.getElementById('preloader').style.visibility = 'hidden';
  $('#main-screen').css('visibility', 'visible');
  $('#preloader').css('visibility', 'hidden');
});

socket.on('disconnect', function () {
  console.log('Disconnected from server');
});

socket.on('updateUserList', function (users, ids, key, avatars) {
  let ol = $('<ul></ul>');
  //console.log(users);
  for (let i = 0; i < users.length; i++){
    ol.append($(`<li class='user' id='${ids[i]}'></li>`).html(`<img height='30px' width='30px' src='images/avatars/${avatars[i]}(custom).png'> ${users[i]}`));
  }

  //$("body").get(0).style.setProperty('--pattern-image', `url("./../images/avatars/${avatars}\(custom\).png")`)
  

  $('.menu').text(`Online: ${users.length}`);
  $('.keyname1').text(`${key}`);
  $('.keyname2').text(`${key}`);
  $('.users').html(ol);
});

socket.on('newMessage', function (message, avatar, isReply, replyTo, replyText, id, targetId) {
  elegant.play();
  //console.log(`Avatar: ${avatar}`);
  let formattedTime = moment(message.createdAt).format('h:mm a');
  let template, html;
  if (isReply){
    if (replyTo == myname) replyTo = 'You';
    template = $('#message-template').html();
    html = Mustache.render(template, {
      text: linkify(message.text),
      from: `${message.from} replied to ${replyTo}`,
      reply: replyText,
      id: id,
      repId: targetId,
      repIcon: `<img src='./../images/reply-blue.png' height='10px' width='10px' class='rep-icon'> `,
      createdAt: formattedTime,
      attr: "style",
      replyMessageStyle: `display: block; transform: translateY(20px);`,
      messageTitleStyle: `transform: translateY(20px)`,
      attrVal: `images/avatars/${avatar}(custom).png`
    });
  }
  else{
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
  //pop.play();
  //$("#messages li:last div p")
  html = html.replace(/¶/g ,'<br>');
  $('#messages').append(html);
  //console.log(emo_test(message.text));
  if (emo_test(message.text))
  {
    $("#messages li:last div p").css({"background": "none", "font-size": "30px", "padding": "0px"});
  }
  closePopup();
  updateScroll();
});

socket.on('my__message', function (message, avatar, isReply, replyTo, replyText, id, targetId) {
  pop.play();
  //console.log(id);
  let formattedTime = moment(message.createdAt).format('h:mm a');
  let template, html;
  if (isReply){
    if (replyTo == myname) replyTo = 'You';
    template = $('#my-message-template').html();
    html = Mustache.render(template, {
      text: linkify(message.text),
      from: `You replied to ${replyTo}`,
      id: id,
      repId: targetId,
      reply: replyText,
      repIcon: `<img src='./../images/reply-blue.png' height='10px' width='10px' class='rep-icon'> `,
      createdAt: formattedTime,
      attr: "style",
      replyMessageStyle: `display: block; transform: translateY(20px);`,
      messageTitleStyle: `display: block; transform: translateY(20px)`,
      attrVal: `images/avatars/${avatar}(custom).png`
    });
  }
  else{
    template = $('#my-message-template').html();
    html = Mustache.render(template, {
      text: linkify(message.text),
      from: message.from,
      id: id,
      attr: "style",
      replyMessageStyle: `display: none; transform: translateY(0px);`,
      messageTitleStyle: `display: none; transform: translateY(0px)`,
      createdAt: formattedTime,
      attrVal: `images/avatars/${avatar}(custom).png`
    });
  }
  //pop.play();
  html = html.replace(/¶/g ,'<br>');
  //html = linkify(html);
  //console.log(html);
  $('#messages').append(html);
  //console.log(emo_test(message.text));
  if (emo_test(message.text))
  {
    $("#messages li:last div p").css({"background": "none", "font-size": "30px", "padding": "0px"});
  }
  closePopup();
  updateScroll();
});


socket.on('server_message', function(message, name = null, id = null){
  myname = name || myname;
  myid = id || myid;
  juntos.play();
  let formattedTime = moment(message.createdAt).format('h:mm a');
  let template = $('#server-message-template').html();
  let html = Mustache.render(template, {
    text: message.text,
    from: message.from,
    createdAt: formattedTime
  });
 // html = html.replace(/<p>Welcome/g, `<p style='color: var(--blue);'>Welcome to the chat key!`);
 // html = html.replace(/<p>[a-z]+ joined/i, `<p style='color: limegreen;'>${message.from} joined`);
 // html = html.replace(/<p>[a-z]+ left/i, `<p style='color: orangered;'>${message.from} left`);
  
  //change html color if html contains 'joined'
  if (message.text.includes('joined')){
    html = html.replace(/<p>/g, `<p style='color: limegreen;'>`);
  }
  if (message.text.includes('left')){
    html = html.replace(/<p>/g, `<p style='color: orangered;'>`);
  }
  else{
    html = html.replace(/<p>/g, `<p style='color: var(--blue);'>`);
  }
  
  $('#messages').append(html);
  //console.log(html);
  updateScroll();
});

socket.on('newLocationMessage', function (message) {
  let formattedTime = moment(message.createdAt).format('h:mm a');
  let template = $('#location-message-template').html();
  let html = Mustache.render(template, {
    from: message.from,
    url: message.url,
    createdAt: formattedTime
  });
  pop.play();
  $('#messages').append(html);
  updateScroll();
});

socket.on('typing', (user, avatar) => {
  let template = $('#typing-template').html();
  let html = Mustache.render(template, {
    attrVal: `./../images/avatars/${avatar}(custom).png`,
    from: user
  });
  $('#typingindicator').append(html);
  updateScroll();
  typing_sound.play();
});

socket.on('stoptyping', () => {
  $('#typingindicator').html('');
  updateScroll();
});

socket.on('vibrateResponse', (sender_name, id) => {
  if (id == myid)
  {
    //alert('You have been vibrated by ' + sender_name);
    if(sender_name == myname) sender_name = 'You';
    //vibrate
    $('.popup-message').text(`${sender_name} just vibrated your Device`);
    $('.popup-message').fadeIn(500);
    navigator.vibrate(1000);
    setTimeout(function(){
      $('.popup-message').fadeOut(500);
    }, 1000);
  }
});

$('#message-form').on('submit', function (e) {
  e.preventDefault();
  let messageTextbox = $('[name=message]');
  let text = messageTextbox.val();
  messageTextbox.val('');
  
  //trim text to 255 charecters
  if (text.length > 10000) {
    text = text.substring(0, 10000);
  }
  //console.log(`Length: ${text.replace(/\n/g,'').replace(/ /g,'').length}`);
  if (text.replace(/\n/g,'').replace(/ /g,'').length == 0){
    $('#textbox').css('height', 'auto');
    return;
  }
  
  text = text.trim();
  text = text.replace(/\n/g, '¶');

  socket.emit('createMessage', {
    text: text
  }, isReply, replyTo, replyText ,targetId, function () {
    $('#textbox').css('height', 'auto');
  });
  $('#textbox').css('height', 'auto');
  closePopup();
});

let locationButton = $('#send-location');
locationButton.on('click', function () {
  if (!navigator.geolocation) {
    return alert('Geolocation not supported by your browser.');
  }

  locationButton.attr('disabled', 'disabled').html(`<img id="sendlocation" height='25px' width="25px" src="./images/icons8-gps-48.png" alt="" srcset="">`);

  navigator.geolocation.getCurrentPosition(function (position) {
    locationButton.removeAttr('disabled').html(`<img id="sendlocation" height='25px' width="25px" src="./images/icons8-gps-48.png" alt="" srcset="">`);
    socket.emit('createLocationMessage', {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude
    });
  }, function () {
    locationButton.removeAttr('disabled').html(`<img id="sendlocation" height='25px' width="25px" src="./images/icons8-gps-48.png" alt="" srcset="">`);
    alert('Unable to fetch location.');
  });
});


//typing indicator
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

$('.chat').on('click', function () {
  $('.menuwrapper').removeClass('active');
});

$('#textbox').on('focus', function () {
  //document.getElementById('textbox').style.background = '#f0f';
  //console.log('text box selected..\nScrolling to bottom');
  updateScroll();
});

function closePopup()
{
  isReply = false;
  $('.toast-popup').hide();
  $('.toast-popup-name').text('');
  $('.toast-popup-message').text('');
}

$('.toast-popup-close').on('click', ()=>{
  closePopup();
});

let isReply = false;
let replyTo, replyText;
let targetId;

$('#messages').on('click', function (evt) {
  //evt.preventDefault();
  //console.log('clicked on messages');
  let target = evt.target;
  
  if (target.className === 'textMessage'){
    targetId = target.parentElement.parentElement.parentElement.id;
    //trim target text to 10 charecters
    replyText =  `${target.innerText.substring(0, 300)}...`;
    replyTo = evt.target.parentElement.previousElementSibling.previousElementSibling.innerText;
    replyTo = replyTo.replace(/ replied to [a-zA-Z]+/g, '');
    let replyToPop = replyTo;
    if (replyToPop == myname) replyToPop = 'You';
    if (replyTo == 'You') replyTo = myname;
    isReply = true;
    $('.toast-popup').show();
    $('.toast-popup-name').text(`Replying to ${replyToPop}`);
    $('.toast-popup-message').text(`${target.innerText.substring(0, 100)}`);
    $('#textbox').focus();
  }
  else if (target.className.includes('replyMessage')){
    const msgId = target.dataset.repid;
    const element = document.getElementById(msgId);
    /*const elementRect = element.getBoundingClientRect();
    const absoluteElementTop = elementRect.top + window.pageYOffset;
    const middle = absoluteElementTop - (window.innerHeight / 2);
    window.scrollTo(0, middle);*/
    element.scrollIntoView({block: "center"});
    $('#messages .my__message').css('filter', 'brightness(0.5)');
    $('#messages .message').css('filter', 'brightness(0.5)');
    $(`#${msgId}`).css('filter', 'initial');
    setTimeout(function(){
      $('#messages .my__message').css('filter', '');
      $('#messages .message').css('filter', '');
      $(`#${msgId}`).css('filter', '');
    }, 1000);
  }
});

$('.users').on('click', function (evt) {
  evt.preventDefault();
  console.log('clicked on users');
  let target = evt.target;
  if (target.className === 'user'){
    let targetId = target.id;
    socket.emit('vibrate', myname, targetId);

    if (targetId !== myid){
      $('.popup-message').text(`You just vibrated ${target.innerText}'s Device`);
      $('.popup-message').fadeIn(500);
      setTimeout(function(){
        $('.popup-message').fadeOut(500);
      }, 1000);
    }
  }
});




window.addEventListener('resize', () => {
  updateScroll();
});

$(window).on('hashchange', function(e){
  setTimeout(function(){
    let hash = location.hash.replace('#','');
    if(hash != ''){
        // Show the hash if it's set
        //alert(hash);
        // Clear the hash in the URL
        location.hash = '';
    }
  }, 600);
})

$('.send').on('focus', function(){
  //console.log('focused');
  $('#textbox').focus();
});



$("textarea").each(function () {
  this.setAttribute("style", "height:" + (this.scrollHeight) + "px;overflow-y:hidden;");
}).on("input", function () {
  this.style.height = "auto";
  this.style.height = (this.scrollHeight) + "px";
});


function linkify(inputText) {
  var replacedText, replacePattern1, replacePattern2, replacePattern3;

  //URLs starting with http://, https://, or ftp://
  replacePattern1 = /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
  replacedText = inputText.replace(replacePattern1, '<a href="$1" target="_blank">$1</a>');

  //URLs starting with "www." (without // before it, or it'd re-link the ones done above).
  replacePattern2 = /(^|[^\/])(www\.[\S]+(\b|$))/gim;
  replacedText = replacedText.replace(replacePattern2, '$1<a href="http://$2" target="_blank">$2</a>');

  //Change email addresses to mailto:: links.
  replacePattern3 = /(([a-zA-Z0-9\-\_\.])+@[a-zA-Z\_]+?(\.[a-zA-Z]{2,6})+)/gim;
  replacedText = replacedText.replace(replacePattern3, '<a href="mailto:$1">$1</a>');
  return replacedText;
}

var emoji_regex = /^(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|[\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|[\ud83c[\ude32-\ude3a]|[\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])+$/;

function emo_test(str){
  return emoji_regex.test(str);
}

/*
$("textarea").on("keypress", function(e) {
  if (e.keyCode === 13) {
    $(".send").click();
  }
});
*/