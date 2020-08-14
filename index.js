import {clock, weather, search, calendar, coronaStats} from './static/modules/sections';
import {eventCallback, getFormData, node, fetchAPI} from 'cutleryjs';
import {sesamCollapse, sesam} from 'sesam-collapse';
import {prefs} from './static/modules/app';

const app = {
    init() {
        sesamCollapse.initialize();
        app.listeners();
        
        // sections
        clock.init();
        app.reload();
    },
    
    async reload() {
        prefs.init();
        coronaStats.init();
        
        await creds.test((credsData) => {
            weather.init();
        })
    },
    
    listeners() {
        document.addEventListener('click', (event) => {
            eventCallback('[data-label="sesamBackdrop"]', () => {
                sesam({
                    target: 'searchCollapse',
                    action: 'hide',
                    modal: {
                        backdrop: false
                    }
                }, search.reset)
            }, false)
        })
        
        document.addEventListener('submit', (event) => {
            event.preventDefault();
            
            eventCallback('[data-form="searchEngine"]', (target) => {
                const formData = getFormData(target);
                search.do(formData);
                
                const $moreResults = node('[data-label="moreResults"]')
                $moreResults.href = `https://google.be/search?q=${formData.get('query')}`
            }, false)
            
            eventCallback('[data-form="appPrefs"]', (target) => {
                const formData = getFormData(target);                
                prefs.set(formData);
                app.reload();
            }, false)
        })
    }
}

const creds = {
    async get() {
        return await fetchAPI.json('https://api.lennertderyck.be/api/dashboard', {mode: 'cors'})
    },
    
    async test(allowCallback, errCallback) {
        const credsData = await creds.get();
        if (credsData.error) errCallback(credsData.error);
        if (!credsData.error) allowCallback(credsData);
    }
}

app.init();