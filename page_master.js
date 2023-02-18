
const TabsContainer = document.getElementById("tabs-container");
const CheckPasswordButton = document.getElementById("check-password");

function switchTab(name){
    let tab = document.querySelector(`section[tab-name='${name}']`);
    if(!tab) return;
    document.querySelectorAll('section').forEach(page=>page.hidden=true);
    tab.hidden=false;
    tab.dispatchEvent(new Event("open"));
}

document.getElementById("set-password").value = window.localStorage.getItem("password");

function checkPassword(password){
    CheckPasswordButton.disabled = true;
    CheckPasswordButton.setAttribute("status", "...");
    API('auth', {password}, {cache:'reload'})
        .then(() => {
            window.localStorage.setItem('password', password);
            setAdminStatus(true);
            switchTab("Search");
            CheckPasswordButton.removeAttribute("status");
            alert("You are now an Admin!");
        })
        .catch(errorResponse => {
            switch(errorResponse.status){
                case 418: //no internet
                    CheckPasswordButton.setAttribute("status", "No Internet");
                break;
                case 403: //wrong password
                    CheckPasswordButton.setAttribute("status", "Wrong Password");
                break;
                default:
                    console.error(errorResponse);
                    CheckPasswordButton.setAttribute("status", "Error");
                break;
            }
        }).finally(() => {
            CheckPasswordButton.disabled = false;
        })
}

document.querySelectorAll("section[tab-name]").forEach(page => {
    let tabName = page.getAttribute("tab-name");
    let tab = document.createElement("div");
    tab.classList.add("tab");
    tab.innerText = tabName;
    TabsContainer.appendChild(tab);
});

document.addEventListener("database-loaded", e => {
    document.getElementById("loading-graphic").hidden = true;
    document.getElementById("page-search").hidden = false;
    let Indicator = document.getElementById("online-indicator");
    var indication = (DATABASE.outdated === false) ? {g:255, title:"Local Database is up to date"} : {g:100, title:"Local Database may be out of date"};
    Indicator.style.backgroundColor = `rgb(100,${indication.g},100)`;
    Indicator.style.cursor = "help";
    Indicator.setAttribute("title", indication.title)
    console.log("Database:", DATABASE);
    loadAllTags(DATABASE.get("Tags"));
});

DATABASE.init();

