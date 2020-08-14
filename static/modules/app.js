import {node} from 'cutleryjs';
import {findPath} from './utils';
import { sesam } from 'sesam-collapse';
import { clock } from './sections';

const prefs = {
    init() {
        prefs.setForm();
        prefs.apply();
    },
    
    set(data) {
        prefs.save(data);
    },
    
    save(data) {
        const dataString = JSON.stringify([...data]);
        window.localStorage.setItem('savedPrefs', dataString);
    },
    
    importLocal(prefKey) {
        const savedPrefs = JSON.parse(window.localStorage.getItem('savedPrefs'));
        return savedPrefs[findPath(savedPrefs, prefKey)[0]][1];
    },
    
    setForm() {
        const savedPrefs = JSON.parse(window.localStorage.getItem('savedPrefs'))
        savedPrefs.forEach((pref) => {
            const value = pref[1], key = pref[0]
            const $input = node(`[data-form="appPrefs"] input[name="${key}"]`);
            const type = $input.getAttribute('type');
            
            if (type != 'checkbox') $input.value = value
            else if (type == 'checkbox' && value == 'on') $input.setAttribute('checked', 'true');
        });
    },
    
    apply() {
        const darkmode = prefs.importLocal('darkmode');
        if (darkmode == 'on') applyPref.darkmode(true)
        else applyPref.darkmode(false);
        
        const displayCorona = prefs.importLocal('coronastats');
        if (displayCorona == 'on') applyPref.coronaStats(true)
        else applyPref.coronaStats(false);
        
        const clockPostition = prefs.importLocal('clock-position');
        applyPref.clockPostition(clockPostition);
    }
}

const applyPref = {
    darkmode(bool) {
        document.body.setAttribute('data-darkmode', bool);
    },
    
    coronaStats(bool) {
        const state = bool == true ? 'show' : 'hide';
        
        sesam({
            target: 'coronaStats',
            action: state
        })
    },
    
    clockPostition(number) {
        const position = clock.position(number);
        const $clock = node('[data-section="clock"]');
        
        const styles = window.getComputedStyle($clock)
        let currentPosition = styles.getPropertyValue('align-items');
        currentPosition = currentPosition.replace('flex-', '');
        
        $clock.classList.remove(`align-items-${currentPosition}`)
        $clock.classList.add(`align-items-${position}`)
    }
}

export {
    prefs
}