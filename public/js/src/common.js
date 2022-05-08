function showWait(){
    document.getElementById('wait').style.display = 'flex';
    return true;
}

function errorLog(target, msg){
    $(`#${target}`).html(msg);
}

function check(){
    //alert("Sen?");
    //check if any radio button is checked
    errorLog('username-error', '');
    errorLog('avatar-error', '');
    let allow = false;
    let name = $('#name').val().trim();
    $('#name').val(name);
    let nameRegex = /^[a-zA-Z]{3,20}$/;
    if (name === '') {
        errorLog('username-error', '*Name is required');
        allow = false;
        return allow;
    }
    else if(name.length < 3 || name.length > 20){
        errorLog('username-error', '*Name must be between 3 and 20 characters');
        allow = false;
        return allow;
    }
    else{
        //if e_users array contains name
        if (e_users.includes(name)){
            errorLog('username-error', 'Username exists <i class="fa-solid fa-triangle-exclamation" style="color: orange;"></i>');
            allow = false;
            return allow;
        }
        else if (!nameRegex.test(name)){
            errorLog('username-error', 'Username can contain only letters <i class="fa-solid fa-triangle-exclamation" style="color: orange;"></i>');
            allow = false;
            return allow;
        }
        else{
            allow = true;
        }
    }
    let radios = document.getElementsByName('avatar');
    let checked = false;
    for (var i = 0; i < radios.length; i++) {
        if (radios[i].checked) {
            checked = true;
            break;
        }
    }
    if (!checked){
        errorLog('avatar-error', 'Select avatar <i class="fa-solid fa-triangle-exclamation" style="color: orange;"></i>');
    }
    if (allow && checked){
        document.getElementById('wait').style.display = 'flex';
    }
    return (allow && checked);
}


if ('serviceWorker' in navigator){
    
    window.addEventListener('load', () => {
        navigator.serviceWorker
        .register('serviceWorkerPoketab.js')
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

console.log('common.js loaded');