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
    let key = $('#key').val();
    if (key === '') {
        $('#key-label').text('Key is required');
        $('#key-label').css('color','red');
        return;
    }
    else{
        socket.emit('newUserRequest', key);
        //disable radio button which contains values of e_avatars
    }
});

socket.on('newUserResponse', (users, avatars) => {
    e_users = users;
    e_avatars = avatars;
    if(e_users.length >= 15){
        $('.form-2').html("<img src='images/sad-cry.gif' height='80px' width='80px'>Maximum user reached on the Room<br>Try a different Room Key");
        $('.form-2').css({'text-align':'center','color': 'red', 'display': 'flex','flex-direction': 'column', 'justify-content': 'center', 'align-items': 'center'});
        $('.form-2 img').css('border-radius','50%');
    }
    $('.form-1').hide(100);
    $('.form-2').show(100);

    e_avatars.forEach(avatar => {
        $(`label[for='${avatar}']`).hide();
    });
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