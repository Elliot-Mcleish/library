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

const API_URL = "http://elliotmcleish.wixsite.com/library/_functions/";
async function API(fname, searchParams="", options={}){
    let fullUrlString = `${API_URL}${fname}`;
    if(searchParams){
        let parsedSearchParams = new URLSearchParams(searchParams);
        fullUrlString = `${fullUrlString}?${parsedSearchParams}`;
    }

    try{
        let response = await fetch(fullUrlString, options);
        if(!response.ok) throw response;
        return await response.json();
    }catch(err){
        if(err instanceof Response) throw (err.status == 404) ? {status:404, statusText:"function not found"} : {status:err.status, statusText:err.statusText};
        throw navigator.onLine ? {status:404, statusText:"function not found"} : {status:418, statusText:"offline"};
    }
}

// API("authe", {"password":window.localStorage.getItem("password")}, {cache: "reload"}).then(console.log.bind(console)).catch(err => {
//     console.error(err);
// })

var DATABASE = {loaded:false};

function loadDatabase(data){
    DATABASE = {loaded:false};
    data.loadPattern.forEach((collectionName, index) => {
        let collectionData = {};
        data.results[index].forEach(item => {
            collectionData[decodeURI(item._id)] = item;
        });
        DATABASE[collectionName] = collectionData;
    });
    DATABASE.date = new Date(data.dbState.date).valueOf();
    DATABASE.loaded = true;
}

try{
    loadDatabase(JSON.parse(window.localStorage.getItem("database")));
    console.log("Loaded local database");
}catch{
    console.warn("Failed to load local database!\n", window.localStorage.getItem("database"));
}

API("outdated", {"date":DATABASE.date}, {cache:"reload"}).then(answer => {
    DATABASE.outdated = answer.outdated;
    if(!DATABASE.outdated) return console.log("Local Database is up to date!\n", DATABASE);
    console.log("Local Database is outdated!");
    API("load", {"password":window.localStorage.getItem("wrongpassword")}, {cache:"reload"}).then(data => {
        loadDatabase(data);
        window.localStorage.setItem("database", JSON.stringify(data));
        DATABASE.outdated = false;
        console.log("Updated local Database\n", DATABASE);
    });
}).catch(badResponse => {
    DATABASE.outdated = null;
    console.log("Cannot tell if database is outdated\n", badResponse);
}).finally(() => {
    document.dispatchEvent(new Event("database-loaded"));
});