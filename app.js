

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
function API(fname, searchParams=""){
    let parsedSearchParams = new URLSearchParams(searchParams);
    return fetch(`${API_URL}${fname}?${parsedSearchParams}`);
}

//Element Handles

//initiate app