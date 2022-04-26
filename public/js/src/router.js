const route = (event) => {
    event = event || window.event;
    event.preventDefault();
    window.history.pushState({}, "", event.target.href);
}

const routes = {
    404: "404.html",
    "/": "/login",
    "/login": "/login",
    "/create": "/create",
    "/chat": "/chat"
}

const handleLocation = async () => {
    const path = window.location.pathname;
    const route = routes[path] || routes["404"];
    const html = await fetch(route).then(res => res.text());
    console.log(html);
    document.querySelector(".container").innerHTML = html;
}

window.onpopstate = handleLocation;
window.route = route;
handleLocation();