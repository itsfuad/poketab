"use strict";

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


$('#next').on('click',()=>{
    //alert('sadasd');
    $('#key-label').css('color','white');
    $('#key-label').html('Checking <i class="fa-solid fa-circle-notch fa-spin"></i>');
    let key_format = /^[0-9a-zA-Z]{3}-[0-9a-zA-Z]{3}-[0-9a-zA-Z]{3}-[0-9a-zA-Z]{3}$/;
    let key = $('#key').val();
    if (key === '') {
        $('#key-label').html('Key is required <i class="fa-solid fa-triangle-exclamation" style="color: orange;"></i>');
        $('#key-label').css('color','red');
        return;
    }
    //check if key is in xxx-xxx-xxx-xxx format
    if (!key_format.test(key)){
        $('#key-label').html('Key is xxx-xxx-xxx-xxx format <i class="fa-solid fa-triangle-exclamation" style="color: orange;"></i>');
        $('#key-label').css('color', 'red');
        return;
    }
    else{

        socket.emit('joinRequest', key);
    }
});

socket.on('joinResponse', (keyExists, users, avatars, maxuser) => {
    //console.log(maxuser);
    if (!keyExists){
        $('#key-label').html('Key does not exists <i class="fa-solid fa-triangle-exclamation" style="color: orange;"></i>');
        $('#key-label').css('color','red');
     }
     else{
         e_users = users;
         e_avatars = avatars;
         if(e_users.length >= maxuser){
             $('.form-2').html("<img src='/images/sad-cry.gif' loop=infinite height='80px' width='80px'><p>Access denied on this Key</p><a href='/' style='color: var(--blue);'>Back</a>");
             $('.form-2').css({'text-align':'center','color': 'red', 'display': 'flex','flex-direction': 'column', 'gap': '20px', 'justify-content': 'center', 'align-items': 'center'});
             $('.form-2 img').css('border-radius','50%');
         }
         e_avatars.forEach(avatar => {
             $(`label[for='${avatar}']`).hide();
         });
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
        $('#name-label').html('Name is required <i class="fa-solid fa-triangle-exclamation" style="color: orange;"></i>');
        $('#name-label').css('color','red');
        allow = false;
        return allow;
    }
    else{
        allow = true;
    }
    e_users.forEach(user => {
        if(name === user){
            $('#name-label').html('Name already exists <i class="fa-solid fa-triangle-exclamation" style="color: orange;"></i>');
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
        $('#name-label').html('Choose avatar <i class="fa-solid fa-triangle-exclamation" style="color: orange;"></i>');
        $('#name-label').css('color','red');
    }
    if (allow && checked){
        $('#join').val('Joining...');
        setTimeout(()=>{
            $('#join').val('Join');
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
  $('.offline').html('You are offline <i class="fa-solid fa-triangle-exclamation" style="color: orange;"></i>');
  $('.offline').css('background', 'orangered');
  $('.offline').fadeIn(400);
}

window.addEventListener('offline', function(e) { 
  console.log('offline'); 
  $('.offline').html('You are offline <i class="fa-solid fa-triangle-exclamation" style="color: orange;"></i>');
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
