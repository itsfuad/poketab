let socket = io();

let e_users = [];
let e_avatars = [];

const error = document.getElementById('error-callback');

const url = window.location.href;
const error_code = url.substring(url.indexOf('?') + 1);

console.log(error_code);

if (error_code !== url){
    error.innerText = '*Please fill up all requirements*';
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

//make id in xxx-xxx-xxx-xxx format
$('#key').val(`${makeid(3)}-${makeid(3)}-${makeid(3)}-${makeid(3)}`);

$('#key').on('click', ()=>{
    let text = $('#key').val();
    console.log(text);
    navigator.clipboard.writeText(text);
    //alert('Copied to clipboard');
    $('#key-label').css('color', 'limegreen');
    $('#key-label').text('Key copied!');
    setTimeout(()=>{
        $('#key-label').css('color', 'white');
        $('#key-label').text('Tap to Copy');
    }, 2000);
});

//slider on input
$('#maxuser').on('input', ()=>{
    $('#rangeValue').text($('#maxuser').val());
});

$('#next').on('click',()=>{
    //alert('sadasd');
    let key = $('#key').val();
    if (key === '') {
        $('#key-label').text('Key is required');
        $('#key-label').css('color','red');
        return;
    }
    if (key.length !== 15){
        $('#key-label').text('Key is 12 digit');
        $('#key-label').css('color', 'red');
        return;
    }
    else{
        socket.emit('createRequest', key);
    }
});

socket.on('createResponse', (keyExists, users, avatars) => {
    if (keyExists){
       $('#key-label').text('Key already exists');
       $('#key-label').css('color','red');
    }
    else{
        e_users = users;
        e_avatars = avatars;
        if (e_avatars){
            e_avatars.forEach(avatar => {
                $(`label[for='${avatar}']`).hide();
            });
        }
        $('.form-1').hide(100);
        $('.howtouse').hide(100);
        $('.form-2').show(100);
    }
});

function check(){
    //alert("Sen?");
    //check if any radio button is checked
    let allow = false;
    let name = $('#name').val();
    if (name === '') {
        $('#name-label').text('Name is required');
        $('#name-label').css('color','red');
        allow = false;
        return allow;
    }
    else{
        allow = true;
    }
    e_users.forEach(user => {
        if(name === user){
            $('#name-label').text('Name already exists');
            $('#name-label').css('color','red');
            allow = false;
        }
    });
    let radios = document.getElementsByName('avatar');
    let checked = false;
    for (var i = 0; i < radios.length; i++) {
        if (radios[i].checked) {
            checked = true;
            break;
        }
    }
    if (!checked){
        $('#name-label').text('Choose avatar');
        $('#name-label').css('color','red');
    }
    if (allow && checked){
        $('#join').val('Creating...');
        setTimeout(()=>{
            $('#join').val('Create');
        }, 2000);
    }
    return (allow && checked);
}


if ('serviceWorker' in navigator){
    
    window.addEventListener('load', () => {
        navigator.serviceWorker
        .register('sw-poketab.js')
        .then(reg => console.log("Service Worker Registered"))
        .catch(err => console.log(`Service Worker: Error ${err}`));
    });
}

if (navigator.onLine) {
  console.log('online');
  $('.offline').fadeOut(400);
} else {
  console.log('offline');
  $('.offline').text('You are offline!');
  $('.offline').css('background', 'orangered');
  $('.offline').fadeIn(400);
}


window.addEventListener('offline', function(e) { 
  console.log('offline'); 
  $('.offline').text('You are offline!');
  $('.offline').css('background', 'orangered');
  $('.offline').fadeIn(400);
});

window.addEventListener('online', function(e) {
  console.log('Back to online');
  $('.offline').text('Back to online!');
  $('.offline').css('background', 'limegreen');
  setTimeout(() => {
    $('.offline').fadeOut(400);
  }, 1500);
});


document.addEventListener('contextmenu', event => event.preventDefault());
