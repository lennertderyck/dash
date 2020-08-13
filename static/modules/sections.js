import moment from 'moment';
import 'moment/locale/nl-be';
import {node, fetchAPI, Element} from 'cutleryjs';
import {sesam} from 'sesam-collapse';
import {LocalDB} from './utils';
import {prefs} from './app';

const savedCoords = new LocalDB('savedCoords');

const clock = {
    init() {
        clock.display();
        clock.start();
        clock.correction();
    },
    
    settings() {
        return {
            
        }
    },    
    
    compose() {    
        const now = moment();    
        return `<span class="clock__hh">${now.format('HH')}</span><span class="clock__divider">:</span><span class="clock__mm">${now.format('mm')}</span><span class="clock__ss"></span>`;
    },
    
    display() {
        const $clock = node('[data-section="clock"] > .clock');
        $clock.innerHTML = clock.compose()
    },
    
    start() {
        setInterval(clock.display, 2000);
    },
    
    correction() {
        const now = moment();
        const sec = parseFloat(now.format('s'));
        const correction = 60 - sec;
        
        setTimeout((event) => {
            console.log('clock corrected');
            clock.start();
        }, (correction-0)*1000);
    }
}

const weather = {   
    async init() { 
        const savedLocation = prefs.importLocal('location');
        if (savedLocation != '') weather.getByLocationName().then(response => {
            weather.display(response);
        }).catch(err => {
            weather.error();
        });
        
        else weather.getByCoords().then(response => {
            weather.display(response);
        }).catch(err => {
            weather.error();
        })
    },
    
    getLocation() {  
        const options = {
            maximumAge: 60000, 
            timeout: 1000, 
            enableHighAccuracy:true
        }
        
        return new Promise((resolve, reject) => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition((position) => {
                    resolve(position)
                    savedCoords.add({
                        coords: {
                            longitude: position.coords.longitude,
                            latitude: position.coords.latitude
                        }
                    });
                }, (err) => {
                    if (savedCoords.exist() != false && savedCoords.count() != 0) resolve(savedCoords.getData()[0])
                    else reject({error: 'time out'});
                }, options);
            } else {
                reject({error: 'browser is too old'});
            }
        })
        
    },
    
    async getByCoords() {    
        const response = await weather.getLocation();
        if (!response.error) return await fetchAPI.json(`https://api.openweathermap.org/data/2.5/weather?lat=${response.coords.latitude}&lon=${response.coords.longitude}&appid=b4e6a074079d25dcf601b6981bbfde50&units=metric&lang=nl`)
    },
    
    async getByLocationName() {
        const location = prefs.importLocal('location');
        return await fetchAPI.json(`https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=b4e6a074079d25dcf601b6981bbfde50&units=metric&lang=nl`)
    },
    
    compose(data) {
        const now = moment().local('nl-be');
        return `
            <div class="details__day">${now.format('dddd, D MMM')} </div>
            <div class="details__devider"> | </div>
            <div class="details__weather weather d-flex align-items-center align-content-center">
                ${weather.getCondition(data.weather[0].icon)}    
                <a href="https://www.google.be/search?q=weer">
                     ${Math.ceil(data.main.temp)}°C in ${data.name}
                </a>
            </div>
        `
    },
    
    display(data) {
        const $weather = node('[data-section="details"] .details');
        $weather.innerHTML = weather.compose(data);
    },
    
    cache() {
        // cache city
    },
    
    getCondition(code) {
        return {
            '01d': '<i class="bx bxs-sun"></i>',
            '02d': '<i class="bx bx-cloud"></i>',
            '03d': '<i class="bx bxs-cloud"></i>',
            '04d': '<i class="bx bxs-cloud"></i>',
            '09d': '<i class="bx bx-cloud-rain"></i>',
            '10d': '<i class="bx bx-cloud-rain"></i>',
            '11d': '<i class="bx bx-cloud-lightning"></i>',
            '13d': '<i class="bx bx-cloud-snow"></i>',
            '50d': '<i class="x bx-water"></i>',
            '01n': '<i class="bx bxs-sun"></i>',
            '02n': '<i class="bx bx-cloud"></i>',
            '03n': '<i class="bx bxs-cloud"></i>',
            '04n': '<i class="bx bxs-cloud"></i>',
            '09n': '<i class="bx bx-cloud-rain"></i>',
            '10n': '<i class="bx bx-cloud-rain"></i>',
            '11n': '<i class="bx bx-cloud-lightning"></i>',
            '13n': '<i class="bx bx-cloud-snow"></i>',
            '50n': '<i class="x bx-water"></i>',
            
        }[code];
    },
    
    error() {
        const $weather = node('[data-section="details"] .details');
        $weather.innerHTML = 'er ging iets fout, ga naar buiten en kijk naar boven';
    }
}

const search = {
    async do(formData) {        
        const $searchResults = node('[data-label="searchResults"]');   
             
        $searchResults.classList.remove('animate__fadeOutDown');
        $searchResults.classList.add('animate__fadeInUp')
        
        sesam({
            target: 'searchCollapse',
            action: 'show',
            modal: {
                backdrop: true
            }
        })

        const query = formData.get('query');
        const resultsData =  await fetchAPI.json(`https://www.googleapis.com/customsearch/v1?key=AIzaSyDfIB_kua_hd8VLeIzKGOoTWJQihAM9ouw&cx=009271218045259039608:9chrbhrnk50&q=${query}&num=4`);
        if (resultsData.items) search.display(resultsData, query);
        else search.error();  
        
        // + more results button -> link to google
    },
    
    render(data) {
        const $item = new Element('a');
        
        $item.class(['result', 'flex-grid__item'])
        $item.attributes([
            ['href', data.href]
        ])
        
        $item.inner(`
            <div class="result__thumb">
                <img src="${data.thumb}">
            </div>
            <div class="d-flex flex-column">
                <div class="result__domain">
                    <span class="result__favicon"><img src="https://www.google.com/s2/favicons?sz=64&domain_url=${data.domain}"></span>
                    <span class="result__domain-name">${data.domain}</span>
                </div>
                <span class="result__title">${data.title}</span>
                <!-- <span class="result__snippet">${data.snippet}</span> -->
            </div>
        `);
        
        $item.append('[data-label="searchResults"] .flex-grid__wrapper')
    },
    
    async display(resultsData, query) {
        const $loader = node('[data-label="searchResults"] .spinner-border');

        await resultsData.items.forEach((result, index) => {
            if (index == 0) $loader.remove();
            const resultData = {
                domain: result.displayLink,
                title: result.title,
                href: result.link,
                snippet: result.snippet,
                thumb: search.detectThumbnail(result, query)[0].src
            }
            
            search.render(resultData);
        });
    },
    
    detectThumbnail(data, query) {
        const noResult = [{
            src: `https://source.unsplash.com/200x200/?${query}`,
            height: 200,
            width: 200
        }]
        if (!data.pagemap) return noResult
        if (data.pagemap.cse_thumbnail || data.pagemap.cse_image) return data.pagemap.cse_thumbnail || data.pagemap.cse_image
        if (data.pagemap.metatags[0]["og:image"]) return {
            src: data.pagemap.metatags[0]["og:image"],
            height: data.pagemap.metatags[0]["og:image:height"],
            width: data.pagemap.metatags[0]["og:image:width"]
        }
        return noResult
    },
    
    reset() {
        const $results = node('[data-label="searchResults"]');
        const $wrapper = node('[data-label="searchResults"] .search-results__wrapper');
        
        $results.classList.remove('animate__fadeInUp');
        $results.classList.add('animate__fadeOutDown');
        
        $wrapper.innerHTML = `
        <div class="spinner-border d-block mx-auto mb-4" role="status">
            <span class="sr-only">Loading...</span>
        </div>
        <div class="flex-grid__wrapper">
        </div>
        `;
    },
    
    error() {
        const $wrapper = node('[data-label="searchResults"] .search-results__wrapper');
        const $moreResults = node('[data-label="moreResults"]');
        
        $wrapper.outerHTML = `
            <img class="d-block mx-auto" src="https://memegenerator.net/img/instances/55452028/error-404-page-not-found.jpg" width="200px">
        `;
        
        
        $moreResults.href = 'https://google.be/search?q=404'
    }
}

const messenger = {
    getLast() {
        const url = `https://graph.facebook.com/v8.0/me/messages?access_token=EAAKr2eZBRbBsBAFOEQ8qJ0SrP0uYZBWZCoY44cQvjA3iZC3n1O0kNFj6WNjnee6v4LkzZA490ipj0g4FGUW5sDR32fEyYfkZBqZAD8bIM7FqZCzlt0Ex4MseWMlQRs2MqWaZA4Ku0SxPZCwAo54NZB3y7gcRGqzZC0nt1niyFxUppKLqbDgI5yDeRc0X7jepMnu8NRoZD`
        fetchAPI.json('')
        
    }
}

const calendar = {
    async getEvents() {
        
    }
}

const coronaStats = {
    async init() {
        coronaStats.render();
    },
    
    async getData() {
        const url = 'https://api.thevirustracker.com/free-api?countryTotal=BE';
        const timelineUrl = 'https://api.thevirustracker.com/free-api?countryTimeline=BE'
        
        const response = await fetchAPI.json(url);
        console.log(response);
        return {
            deaths: response.countrydata[0].total_deaths,
            clean: response.countrydata[0].total_recovered,
            cases: response.countrydata[0].total_new_cases_today
        }
    },
    
    async calculatePercentages() {
        const data = await coronaStats.getData();
        const totalCases = await data.deaths + data.cases + data.clean;
        
        const deaths = await data.deaths / totalCases,
        cases = await data.cases / totalCases,
        clean = await data.clean / totalCases;
        
        return {
            deaths: parseFloat((deaths*100).toFixed(1)),
            clean: parseFloat((clean*100).toFixed(1)),
            cases: parseFloat((cases*100).toFixed(1)),
            origin: data,
            total: totalCases
        }
    },
    
    async render() {
        const percentages = await coronaStats.calculatePercentages();
        const $statBar = node('[data-section="corona"] .corona__stats');
        const $loader = node('[data-section="corona"] .spinner-border');
        
        $loader.remove();
        $statBar.innerHTML = `
            <div class="corona__deaths" style="width: ${percentages.deaths}%">
                <div class="info">
                    <div class="info__wrapper">
                        <span>Doden</span>
                        <span>${percentages.origin.deaths}</span>
                    </div>
                </div>
            </div>
            <div class="corona__cases" style="width: ${percentages.cases}%">
                <div class="info">
                    <div class="info__wrapper">
                        <span>Cases</span>
                        <span>${percentages.origin.cases}</span>
                    </div>
                </div>
            </div>
            <div class="corona__clean" style="width: ${percentages.clean}%">
                <div class="info">
                    <div class="info__wrapper">
                        <span>Genezen</span>
                        <span>${percentages.origin.clean}</span>
                    </div>
                </div>
            </div>
        `;
    }
}

const testing = (message) => {
    return {
        prepend: (pre) => {
            return `${pre} ${message}`
        },
        
        append: (apd) => {
            return `${message} ${apd}`
        }
    }
}

export {
    clock,
    weather,
    search,
    calendar,
    testing,
    coronaStats
}