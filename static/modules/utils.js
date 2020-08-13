"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Create a random string with length equals 4.
 */
function s4() {
    return Math.round(new Date().getTime() * Math.random())
        .toString(16)
        .substr(0, 4);
}
/**
 * Create a random number between 0 and (length - 1).
 * @param length Length of chaining numbers.
 */
function ramdomNumber(length) {
    return Math.floor(Math.random() * length);
}
/**
 * Create a default Id with length equals 24.
 */
function defaultId() {
    const charCodes = ['-', '_', '@', '#', '$', '%', '^', '&', '*'];
    const { length } = charCodes;
    return (s4() +
        charCodes[ramdomNumber(length)] +
        s4() +
        charCodes[ramdomNumber(length)] +
        s4() +
        charCodes[ramdomNumber(length)] +
        s4() +
        charCodes[ramdomNumber(length)] +
        s4());
}
/**
 * Create a lovely Id with thinid.
 * @param length Length of Id.
 */
function thinid(length) {
    if (!length || length <= 0) {
        return defaultId();
    }
    const defaultLength = defaultId().length;
    const x = length % defaultLength;
    const y = Math.floor(length / defaultLength);
    let result = defaultId().substr(0, x);
    for (let i = 0; i < y; i++) {
        result += defaultId();
    }
    return result;
}
exports.thinid = thinid;

export class LocalDB {
    constructor(name) {
        this.name = name;
        this.data = [];
        
        if (this.exist() == false) window.localStorage.setItem(name, JSON.stringify({name: this.name, data: this.data}));
    }
    
    getData() {
        const localData = window.localStorage.getItem(this.name)
        if (localData) return JSON.parse(localData).data;
        return 'There is no localStorage item with this name';
    }
    
    exist() {
        const item = window.localStorage.getItem(this.name);
        if (item) return item;
        return false;
    }
    
    detatch() {
        window.localStorage.removeItem(this.name);
        console.log(`local database '${this.name}' removed`)
        return this.name;
    }
    
    store(data) {
        window.localStorage.setItem(this.name, JSON.stringify({name: this.name, data: data}));
    }
    
    addMeta(data) {
        data.map(i => {
            i.__id = thinid(11)
        })
    }
    
    add(data, callback) {
        const localData = this.getData();
        
        const newData = Array.isArray(data) == false ? [data] : data;
        this.addMeta(newData);
        
        this.data = Array.isArray(data) == false ? [...localData, ...newData] : [...localData, ...newData];
        this.store(this.data);
        
        if (callback) callback();
    }
    
    remove(data, callback) {
        const localData = this.getData();
        const allowed = Object.keys(data)[0];
        
        const index = localData.findIndex((record) => {
            return record[allowed] == data[allowed];
        })
        localData.splice(index, 1);
        this.store(localData);
        
        if (callback) callback();
    }
    
    item(data) {
        const localData = this.getData();
        const allowed = Object.keys(data)[0];
        
        return localData.find((record) => {
            return record[allowed] == data[allowed];
        })
    }
    
    count() {
        const localData = this.getData();
        return localData.length;
    }
    
    empty() {
        this.store([]);
    }
}

export const findPath = (array, value) => {
    var path = [];

    array.some(function iter(p) {
        return function (a, i) {
            if (a === value) {
                path = p.concat(i);
                return true;
            }
            if (Array.isArray(a)) {
                return a.some(iter(p.concat(i)));
            };
        };
    }([]));

    return path;
}