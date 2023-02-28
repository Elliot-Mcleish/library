const Testing = window.location.host.split(":")[0] == "localhost";

function setAdminStatus(isAdmin){
    if(!isAdmin) return document.documentElement.removeAttribute("isAdmin");;
    document.documentElement.setAttribute("isAdmin", "true");
}

setAdminStatus(window.localStorage.getItem("password"));

//register service worker
if('serviceWorker' in navigator){
    function ShowUpdatePrompt(registration){
        if(confirm("An update has been installed. Would you like to refresh the page?") && registration.waiting){
            registration.waiting.postMessage({
                type: 'SKIP_WAITING'
            });
        }
    }

    window.addEventListener("load", async (e) => {
        const registration = await navigator.serviceWorker.register('sw.js');
        // ensure the case when the updatefound event was missed is also handled
        // by re-invoking the prompt when there's a waiting Service Worker
        if (registration.waiting) {
            ShowUpdatePrompt(registration);
        }

        // detect Service Worker update available and wait for it to become installed
        registration.addEventListener('updatefound', ()=>{
            if (registration.installing) {
                // wait until the new Service worker is actually installed (ready to take over)
                registration.installing.addEventListener('statechange', () => {
                    if (registration.waiting) {
                        // if there's an existing controller (previous Service Worker), show the prompt
                        if (navigator.serviceWorker.controller) {
                            ShowUpdatePrompt(registration)
                        } else {
                            // otherwise it's the first install, nothing to do
                            console.log('Service Worker initialized for the first time')
                        }
                    }
                });
            }
        });

        let refreshing = false;

        // detect controller change and refresh the page
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (!refreshing) {
                window.location.reload();
                refreshing = true;
            }
        });
    });
}else{
    alert("Unable to install Service Worker!");
}

async function getBookData(isbn){
    let response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=isbn:${isbn}`);
    return await response.json();
}

const API_URL = "https://elliotmcleish.wixsite.com/library/_functions/api";

async function API(functionName="ping", query={}, options={}){
    let querystring = new URLSearchParams();
    querystring.append("functionName", functionName);
    querystring.append("query", encodeURI(JSON.stringify(query)));
    querystring.append("password", window.localStorage.getItem("password"));
    let fullURL = `${API_URL}?${querystring.toString()}`;
    console.log(fullURL);
    try{
        let response = await fetch(fullURL, options);
        if(!response.ok) throw response;
        return await response.json();
    }catch(err){
        if(err instanceof Response) throw (err.status == 404) ? {status:404, statusText:"function not found"} : {status:err.status, statusText:err.statusText};
        throw navigator.onLine ? {status:404, statusText:"function not found"} : {status:418, statusText:"offline"};
    }
}

// API("auth", {"password":window.localStorage.getItem("password")}, {cache: "reload"}).then(console.log.bind(console)).catch(err => {
//     console.error(err);
// })

// var DATABASE = new function(){
//     this.initiated = false;
//     this.loaded = false;
//     this.outdated = null;
//     this.version = 0;
//     this.isAdmin = window.localStorage.getItem("password") != undefined;
//     this.date = 0;
//     this.data = {};
//     this.load = function(data){
//         if(!data.loadPattern) throw(new Error("Bad Data"));
//         this.loaded = false;
//         this.data = {};
//         data.loadPattern.forEach((collectionName, index) => {
//             let collectionData = {};
//             data.results[index].forEach(item => {
//                 collectionData[decodeURI(item._id)] = item;
//             });
//             this.data[collectionName] = collectionData;
//         });
//         this.isAdmin = data.isAdmin;
//         this.date = new Date(data.dbState.date).valueOf();
//         this.version = Number(data.dbState.version);
//         this.loaded = true;
//     }

//     this.get = function(...keys){
//         let result = this.data;
//         for(let i = 0; i < keys.length; ++i){
//             result = result[keys[i]];
//             if(!result) keys[i] = `{${keys[i]}}`;
//             if(i < keys.length-1 && !(result instanceof Object)){
//                 keys[i+1] = `[${keys[i+1]}]`;
//                 console.warn(`DATABASE.get(): "${keys.join(".")}" Does not exist.`);
//                 return null;
//             }
//         }
//         return result;
//     }

//     this.init = function(){
//         this.initiated = true;

//         try{
//             this.load(JSON.parse(window.localStorage.getItem("database")));
//             console.log("Loaded local database");
//         }catch{
//             console.warn("Failed to load local database!");
//         }
    
//         if(Testing && window.localStorage.getItem("quick-load") == "true"){
//             console.log("Quick load is on. Skipping outdated check...");
//             return document.dispatchEvent(new Event("database-loaded"));
//         }

//         let password = (this.isAdmin && !Testing) ? undefined : window.localStorage.getItem("password");
//         //if already admin -> password = undefined
//         //if not admin, but no password stored -> password = undefined
//         //if not admin, and password stored -> password is sent
//         //if testing -> password is sent
//         API("outdated", {"date":this.date, password}, {cache:"reload"}).then(async answer => {
//             console.log("isOutdated answer: ", answer);
//             this.outdated = answer.outdated;
//             if(!this.outdated && answer.isAdmin == this.isAdmin) return console.log("Local Database is up to date!\n", this.data);
//             console.log("Local Database is outdated!");
//             await API("load", {"password":window.localStorage.getItem("password")}, {cache:"reload"}).then(data => {
//                 this.load(data);
//                 window.localStorage.setItem("database", JSON.stringify(data));
//                 this.outdated = false;
//                 console.log("Updated local Database\n", this.data);
//             });
//         }).catch(badResponse => {
//             this.outdated = null;
//             console.log("Cannot tell if database is outdated\n", badResponse);
//         }).finally(() => {
//             document.dispatchEvent(new Event("database-loaded"));
//         });
//     }
// }

// function RESET(){
//     window.localStorage.clear();
//     try{
//         (async function(){
//             let reg = await navigator.serviceWorker.getRegistration();
//             await reg.unregister();
//             window.location.reload(true);
//         })();
//     }catch{
//         window.location.reload(true);
//     }
// }