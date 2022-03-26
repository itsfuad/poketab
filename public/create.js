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

$('#key').val(makeid(10));
$('#key').on('click', ()=>{
    let text = $('#key').val();
    console.log(text);
    navigator.clipboard.writeText(text);
    $('.popup-message').text(`Copied to clipboard`);
    $('.popup-message').fadeIn(500);
    setTimeout(function () {
      $('.popup-message').fadeOut(500);
    }, 1000);
});

$('#next').on('click',()=>{
    //alert('sadasd');
    let key = $('#key').val();
    if (key === '') {
        $('#key-label').text('Key is required');
        $('#key-label').css('color','red');
        return;
    }
    if (key.length <= 4){
        $('#key-label').text('Key less than 5 digit');
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
