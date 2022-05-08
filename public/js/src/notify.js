function showNotification(title, text, icon){
    const notification = new Notification(title, {
        body: text,
        icon: `/images/avatars/${icon}(custom).png`
    });
}

console.log(Notification.permission);

if (Notification.permission === 'granted'){
    alert("We have permission");
}
else if (Notification.permission !== 'denied'){
    Notification.requestPermission().then(permission => {
        console.log(permission);
        if (permission === 'granted'){
            showNotification("Poketab", "Welcome to Poketab!", "pikachu");
        }
    });
}