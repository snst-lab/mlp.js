var mlp = mlp || {};

(function () {
'use strict';
var _mlp = _mlp || {}; _mlp.modules = [];

_mlp.defineMethods = class {
    constructor() {
        mlp.on = function (triggerEvent) {
            const event = document.createEvent('HTMLEvents');
            event.initEvent(triggerEvent, true, false);
            document.dispatchEvent(event);
        };

        mlp.loader = function (preloaderId) {
            const doms = document.querySelectorAll('pre-loader');
            Object.keys(doms).forEach(function (index) {
                const loader = doms[index];
                if (loader.getAttribute('id') !== null && loader.getAttribute('id') === preloaderId) {
                    preLoader.reload(loader);
                }
            });
        };

        mlp.dom = function (cssSelector) {
            return document.querySelector(cssSelector);
        };

        mlp.doms = function (cssSelector) {
            return document.querySelectorAll(cssSelector);
        };

        mlp.ajax = function(option) {
            var xhr = new XMLHttpRequest();
            if(option.type==='GET'){
                xhr.open('GET', option.url, option.async);
                xhr.send();
                if (xhr.status === 200) return xhr;
            }
            else if(option.type==='POST'){
                return new Promise(function(resolve,reject){
                    xhr.open('POST', option.url, option.async);
                    xhr.onreadystatechange = function(){
                        if(this.readyState === 4 && this.status >= 200 && this.status < 400){
                            resolve(this);
                        }else{
                            reject(this);
                        }
                    }
                    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
                    xhr.send(option.data);
                });
            }
        };

        _mlp.uniqueStr = function () {
            const strong = 1000;
            return new Date().getTime().toString(16) + Math.floor(strong * Math.random()).toString(16);
        };

        _mlp.ready = function (fn) {
            if (document.attachEvent ? document.readyState === "complete" : document.readyState !== "loading") {
                fn();
            } else {
                document.addEventListener('DOMContentLoaded', fn);
            }
        };

        if (!Array.prototype.inArray) {
            Object.defineProperty(Array.prototype, "inArray", {
                configurable: true,
                enumerable: false,
                writable: true,
                value: function (value) {
                    return [].indexOf.call(this, value) > -1;
                }
            });
        }

        if (!String.prototype.unescapeHTML) {
            Object.defineProperty(String.prototype, "unescapeHTML", {
                configurable: true,
                enumerable: false,
                writable: true,
                value: function () {
                    const map = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"' };
                    const pattern = Object.keys(map).join("|");
                    return this.replace(new RegExp(pattern, "g"), function (e) { return map[e] });
                }
            });
        }

        if (!String.prototype.escapeHTML) {
            Object.defineProperty(String.prototype, "escapeHTML", {
                configurable: true,
                enumerable: false,
                writable: true,
                value: function () {
                    const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" };
                    const pattern = Object.keys(map).join("|");
                    return this.replace(new RegExp(pattern, "g"), function (e) { return map[e] });
                }
            });
        }

        if (!String.prototype.toDom) {
            Object.defineProperty(String.prototype, "toDom", {
                configurable: true,
                enumerable: false,
                writable: true,
                value: function () {
                    const doc = new DOMParser().parseFromString(this, "text/html");
                    return doc.body.firstChild;
                }
            });
        }

        

        if (!HTMLElement.prototype.inview) {
            Object.defineProperty(HTMLElement.prototype, "inview", {
                configurable: true,
                enumerable: false,
                writable: true,
                value: function (callbackInView, callbackOutView, thresholdValue) {
                    const options = {
                        root: null,
                        rootMargin: '-3%',
                        threshold: [thresholdValue || 0.5]
                    };
                    const observer = new IntersectionObserver(function (entries) {
                        for (const e of entries) {
                            if (e.isIntersecting && Object.prototype.toString.call(callbackInView) === '[object Function]') {
                                callbackInView(e);
                            }
                            else if (!e.isIntersecting && Object.prototype.toString.call(callbackOutView) === '[object Function]') {
                                callbackOutView(e);
                            }
                        }
                    }, options);
                    observer.observe(this);
                }
            });
        }

        if (!HTMLElement.prototype.fadeIn) {
            Object.defineProperty(HTMLElement.prototype, "fadeIn", {
                configurable: true,
                enumerable: false,
                writable: true,
                value: function (timeout) {
                    const self = this;
                    if (timeout === 0) {
                        self.style.display = '';
                    } else {
                        const time = timeout || 200;
                        self.style.display = '';
                        self.style.opacity = 0;
                        const interval = setInterval(function () {
                            self.style.opacity = +self.style.opacity + 0.01;
                            if (self.style.opacity >= 1) {
                                clearInterval(interval);
                            }
                        }, time * 0.01);
                    }
                }
            });
        }

        if (!HTMLElement.prototype.fadeOut) {
            Object.defineProperty(HTMLElement.prototype, "fadeOut", {
                configurable: true,
                enumerable: false,
                writable: true,
                value: function (timeout) {
                    const self = this;
                    if (timeout === 0) {
                        self.style.display = 'none';
                    } else {
                        const time = timeout || 200;
                        const self = this;
                        self.style.opacity = 1;
                        const interval = setInterval(function () {
                            self.style.opacity = +self.style.opacity - 0.01;
                            if (self.style.opacity <= 0) {
                                clearInterval(interval);
                                self.style.display = 'none';
                            }
                        }, time * 0.01);
                    }
                }
            });
        }

        if (!HTMLElement.prototype.hold) {
            Object.defineProperty(HTMLElement.prototype, "hold", {
                configurable: true,
                enumerable: false,
                writable: true,
                value: function (callback, holdtime) {
                    this.addEventListener('touchstart', function (event) {
                        event.preventDefault();
                        callback();
                        let time = 0;
                        let interval = setInterval(function () {
                            time += 100;
                            if (time > holdtime) {
                                callback();
                            }
                        }, 100);
                        this.addEventListener('touchend', function (event) {
                            event.preventDefault();
                            clearInterval(interval);
                        });
                    });
                    this.addEventListener('mousedown', function (event) {
                        event.preventDefault();
                        callback();
                        let time = 0;
                        let interval = setInterval(function () {
                            time += 100;
                            if (time > holdtime) {
                                callback();
                            }
                        }, 100);
                        this.addEventListener('mouseup', function (event) {
                            event.preventDefault();
                            clearInterval(interval);
                        });
                    });
                }
            });
        }

        if (!HTMLElement.prototype.swipe) {
            Object.defineProperty(HTMLElement.prototype, "swipe", {
                configurable: true,
                enumerable: false,
                writable: true,
                value: function (direction, callback, sensitivity) {
                    const self = this;
                    const sens = Object.prototype.toString.call(sensitivity) !== '[object Number]' || sensitivity <= 0 ? 5 : sensitivity | 0;
                    switch (direction) {
                        case 'left':
                            self.addEventListener('touchstart', function (event) {
                                self.removeEventListener("touchstart", null, false);
                                var position = event.changedTouches[0].pageX;
                                self.addEventListener('touchend', function (event) {
                                    self.removeEventListener("touchend", null, false);
                                    if (event.changedTouches[0].pageX < position - self.style.width / sens) {
                                        callback(self);
                                    }
                                    position = 0;
                                });
                            }, false);
                            break;
                        case 'right':
                            self.addEventListener('touchstart', function (event) {
                                self.removeEventListener("touchstart", null, false);
                                var position = event.changedTouches[0].pageX;
                                self.addEventListener('touchend', function (event) {
                                    self.removeEventListener("touchend", null, false);
                                    if (event.changedTouches[0].pageX > position + self.style.width / sens) {
                                        callback(self);
                                    }
                                    position = self.style.width;
                                });
                            }, false);
                            break;
                        case 'up':
                            self.addEventListener('touchstart', function (event) {
                                self.removeEventListener("touchstart", null, false);
                                var position = event.changedTouches[0].pageY;
                                self.addEventListener('touchend', function (event) {
                                    self.removeEventListener("touchend", null, false);
                                    if (event.changedTouches[0].pageY < position - self.style.height / sens) {
                                        callback(self);
                                    }
                                    position = 0;
                                });
                            }, false);
                            break;
                        case 'down':
                            self.addEventListener('touchstart', function (event) {
                                self.removeEventListener("touchstart", null, false);
                                var position = event.changedTouches[0].pageY;
                                self.addEventListener('touchend', function (event) {
                                    self.removeEventListener("touchend", null, false);
                                    if (event.changedTouches[0].pageY > position + self.style.height / sens) {
                                        callback(self);
                                    }
                                    position = self.style.height;
                                });
                            }, false);
                            break;
                    }
                }
            });
        }
    }
}
new _mlp.defineMethods();


_mlp.Setting = class {
    constructor() {
        _mlp.screen = {};
        _mlp.targetDOM = [];
        _mlp.eventList = [];
        _mlp.animationList = [];
        _mlp.afterWait = [];
        _mlp.onTrigger = [];
        _mlp.atInterval = [];
        _mlp.attributes = ['clone', 'use', 'for', 'replace', 'flex', 'on', 'wait', 'interval', 'screen'];
        _mlp.resizeSaver = 0;
        _mlp.sanitize = true;
        _mlp.cookie = false;
        _mlp.Setting.init();
    }
    static init() {
        const setting = JSON.parse(mlp.ajax({ url: 'mlp.json', type: "GET", async: false }).responseText);
        if (typeof setting['screen'] !== 'undefined') {
            _mlp.screen = setting['screen'];
            for (var key in _mlp.screen) {
                (0, eval)('window.' + key + '=' + setting['screen'][key] + '? true : false;');
            }
        }
        _mlp.targetDOM = [];
        if (typeof setting['dom'] !== 'undefined') {
            _mlp.targetDOM = setting['dom'].split(',');
        }
        _mlp.eventList = [];
        if (typeof setting['event'] !== 'undefined') {
            _mlp.eventList = setting['event'].split(',');
        }
        if (typeof setting['sanitize'] !== 'undefined') {
            _mlp.sanitize = setting['sanitize'];
        }
        if (typeof setting['cookie'] !== 'undefined') {
            _mlp.cookie = setting['cookie'];
        }
    }
}
new _mlp.Setting();


_mlp.secureOverride = class{
    constructor() {
        _mlp.secureOverride.init();
    }
    static init(){
        var Submit = HTMLFormElement.prototype.submit;
        HTMLFormElement.prototype.submit = function(){
            if(_mlp.sanitize){
                Object.values(this.elements).forEach(function(e){
                    e.setAttribute('value',e.getAttribute('value').escapeHTML());
                });
            }
            if(!_mlp.cookie){
                _mlp.secureOverride.removeCookies();
            }
            return  Submit.apply(this);
        }
        var XHRSend = XMLHttpRequest.prototype.send;
        XMLHttpRequest.prototype.send = function(){
            if(_mlp.sanitize){
                if(arguments[0] !== null && arguments[0] !== ''){
                    arguments[0] = String(arguments[0]).escapeHTML();
                } 
            }
            if(!_mlp.cookie){
                _mlp.secureOverride.removeCookies();
            }
            return XHRSend.apply(this, [].slice.call(arguments)); 
        }
        if(jQuery){
            jQuery.ajaxSetup({
                beforeSend: function(jqXHR, option) {
                    if(_mlp.sanitize){
                        option.data = option.data.escapeHTML();
                    }
                    if(!_mlp.cookie){
                        _mlp.secureOverride.removeCookies();
                    }
                    return true;
                }
            });
        }
    }
    static removeCookies(){
        document.cookie.split(";").forEach(function(cookie) {
            const date = new Date();
            date.setDate(date.getDate() - 1);
            document.cookie = cookie.trim().replace(/=.*/, "=;expires=" + date.toUTCString() + "/");
        });
    }
}
new _mlp.secureOverride();


class flexModule extends HTMLElement {
    constructor() {
        super();
        if (this.getAttribute('id') !== null) {
            _mlp.modules.push({ 'id': this.getAttribute('id'), 'code': this.innerHTML });
            (0, eval)('var ' + this.getAttribute('id') + '=' + this.getAttribute('id') + '||{};');
            this.parentNode.removeChild(this);
        }
    }
}
customElements.define('flex-module', flexModule);


class importFile extends HTMLElement {
    constructor() {
        super();
        const self = this;
        const async = self.getAttribute('async') !== null ? true : false;
        const xhr = new XMLHttpRequest();
        xhr.open("GET", this.textContent, async); //true : async
        xhr.onload = function () {
            if (xhr.readyState === 4 && xhr.status === 200) {
                importFile.expand(self, xhr);
            } else {
                console.log(self.textContent + ' is not found.');
            }
        };
        xhr.onerror = function () {
            console.log('Failed to import ' + self.textContent);
        };
        xhr.send(null);
    }
    static expand(self, xhr) {
        if (self.getAttribute('var') !== null && xhr.responseText !== '') {
            window.onload = function () {
                if (self.getAttribute('as') === 'json') {
                    (0, eval)('window.' + self.getAttribute('var') + '=' + xhr.responseText + ';');
                }
                else if (self.getAttribute('as') === 'string') {
                    (0, eval)('window.' + self.getAttribute('var') + '="' + xhr.responseText.escapeHTML() + '";');
                }
                else {
                    (0, eval)('window.' + self.getAttribute('var') + '=' + xhr.responseText + ';');
                }
                self.parentNode.removeChild(self);
            }
        }
        else if (self.getAttribute('as') === 'string' && xhr.responseText !== '') {
            self.outerHTML = xhr.responseText.escapeHTML();

        } else {
            self.outerHTML = xhr.responseText;
        }
    }
}
customElements.define('import-file', importFile);


class preLoader extends HTMLElement {
    constructor() {
        super();
        const loader = this;
        const source = loader.textContent;
        loader.setAttribute('src', source);
        loader.textContent = '';
        const div = document.createElement('div');
        loader.appendChild(div);
        preLoader.onload(loader, div);
    }
    static onload(loader, div) {
        div.style.display = 'none';
        const source = loader.getAttribute('src');
        preLoader.readHTML(loader, source, div);
        preLoader.readImage(loader, source, div);
        if (loader.getAttribute('id') === null || loader.getAttribute('id') === 'onload') {
            preLoader.show(loader, div);
        }
    }
    static reload(loader) {
        const div = loader.children[0];
        preLoader.show(loader, div);
    }
    static readHTML(loader, source, div) {
        if (source.match('.html')) {
            const xhr = new XMLHttpRequest();
            xhr.open("GET", source, false); //true : async
            xhr.send(null);
            if (xhr.status === 200) {
                div.innerHTML = xhr.responseText;
                div.style.display = 'none';
            } else {
                console.log(source + ' is not found.');
            }
        }
    }
    static readImage(loader, source, div) {
        if (source.match(/\.(gif|jpg|jpeg|png)/)) {
            const img = document.createElement('img');
            img.style = "position:fixed;top:0;left:0;bottom:0;right:0;margin:auto;z-index:102;";
            img.src = source;
            div.appendChild(img);
            div.style.display = 'none';
        }
    }
    static show(loader, div) {
        const fadein = loader.getAttribute('fadein') || 0;
        const timeout = loader.getAttribute('timeout') || 2000;
        const fadeout = loader.getAttribute('fadeout') || 200;
        div.setAttribute('style', 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:101;display:none;background:' + (loader.getAttribute('background') || "white"));
        div.fadeIn(fadein);
        setTimeout(function () {
            div.fadeOut(fadeout);
        }, +fadein + timeout);
    }
}
customElements.define('pre-loader', preLoader);


_mlp.Clone = class {
    constructor(self) {
        const attr = self.getAttribute('clone');
        if (attr !== null) {
            self.removeAttribute('clone');
            _mlp.Clone.template(self, attr);
        }
    }

    static template(self, id) {
        const template = document.querySelector('template#' + id);
        const clone = template.innerHTML.replace(/#CONTENT/g, self.innerHTML);
        self.innerHTML = clone;
    }
}


_mlp.Operator = class {
    constructor(self) {
        if (self.childNodes.length === 1 && Object.prototype.toString.call(self.childNodes[0]) === '[object Text]') {
            if (self.getAttribute('for') === null) {
                self.outerHTML = _mlp.Operator.readScript(self.outerHTML);
            }
        }
    }
    static readScript(string) {
        if (string.match('{{') && string.match('}}')) {
            return _mlp.Operator.parse(string);
        } else {
            return string;
        }
    }
    static parse(string) {
        var str = string;
        var after = '';

        while (true) {
            const scriptStart = str.indexOf('{{', 0);
            if (scriptStart < 0) { after = after + str; break };
            const scriptEnd = str.indexOf('}}', scriptStart);
            const text = str.slice(0, scriptStart);
            const script = str.slice(scriptStart + 2, scriptEnd);
            // const script = str.slice(scriptStart + 2, scriptEnd).replace(/(^\s+)|(\s+$)|(^\t+)|(\t+$)|(\r?\n)/g, "");
            str = str.slice(scriptEnd + 2);
            after += text + String((0, eval)(script));
        }
        return after;
    }
}


_mlp.For = class {
    constructor(self) {
        const attr = self.getAttribute('for');
        if (attr !== null) {
            const data = _mlp.For.parse(attr);
            _mlp.For.expand(self, data);
        }
    }

    static parse(attribute) {
        var data = [];
        var attr = attribute.split(';');
        // var attr = attribute.replace(/(\s+)|(\t+)|(\r?\n)/g, "").split(';');
        attr = attr.filter(function (e) { return e !== ""; });

        attr.forEach(function (element) {
            var el = element.split(':');
            data.push({ 'dst': el[0], 'src': _mlp.For.parseSrc(el[1]) });
        });
        return data;
    }

    static parseSrc(src) {
        if (src.match(',') && !src.match('->') && !src.match('/')) {
            return src.split(',').filter(function (e) { return e !== ""; });
        }
        else if (!src.match(',') && src.match('->')) {
            const a = src.split('->');
            const start = +a[0];
            let end = a[1];
            let step = 1;
            if (src.match('/')) {
                const b = a[1].split('/');
                end = +b[0];
                step = +b[1];
            } else {
                end = +end;
            }
            var arr = [];
            if (start < end) {
                var count = start;
                while (count <= end) {
                    arr.push(count);
                    count += step;
                }
                return arr;
            } else if (end < start) {
                var count = start;
                while (count >= end) {
                    arr.push(count);
                    count -= step;
                }
                return arr;
            }
        }
        else if (!src.match(',') && !src.match('->') && !src.match('/')) {
            return src;
            // return src.replace(/(^\s+)|(\s+$)|(^\t+)|(\t+$)|(\r?\n)/g, "");
        }
    }

    static expand(self, data) {
        var master = String(self.outerHTML);
        data.forEach(function (element) {
            var fragment = '';
            var array = (0, eval)(element.src);
            if (array instanceof Array) {
                array.forEach(function (src, i) {
                    if (master.match('::') && !(element.src instanceof Array)) {
                        fragment += master.replace(new RegExp('#' + element.dst + '::', 'g'), element.src + '[' + i + '].');
                    }
                    else if (!master.match('::') && !(element.src instanceof Array)) {
                        fragment += master.replace(new RegExp('#' + element.dst, 'g'), element.src + '[' + i + ']');
                    }
                    else if (!master.match('::') && element.src instanceof Array) {
                        fragment += master.replace(new RegExp('#' + element.dst, 'g'), element.src[i]);
                    }
                });
            } else {
                fragment += master.replace(new RegExp('#' + element.dst, 'g'), element.src);
            }
            master = fragment;
        });
        master = _mlp.Operator.readScript(master.unescapeHTML());
        self.insertAdjacentHTML('afterend', master);
        self.style.display = 'none';
    }
}


_mlp.ForAfterWait = class {
    constructor(self, wait) {
        const attr = self.getAttribute('for');
        if (attr !== null) {
            const data = _mlp.For.parse(attr);
            _mlp.ForAfterWait.expand(self, data, wait);
        } else {
            _mlp.ForAfterWait.clone(self, wait);
        }
    }

    static expand(self, data, wait) {
        var master = String(self.outerHTML);
        var fragment = '';
        self.style.display = 'none';

        data.forEach(function (element) {
            var array = (0, eval)(element.src);
            if (array instanceof Array) {
                array.forEach(function (src, i) {
                    if (master.match('::') && !(element.src instanceof Array)) {
                        fragment = master.replace(new RegExp('#' + element.dst + '::', 'g'), element.src + '[' + i + '].');
                    }
                    else if (!master.match('::') && !(element.src instanceof Array)) {
                        fragment = master.replace(new RegExp('#' + element.dst, 'g'), element.src + '[' + i + ']');
                    }
                    else if (!master.match('::') && element.src instanceof Array) {
                        fragment = master.replace(new RegExp('#' + element.dst, 'g'), element.src[i]);
                    }
                    _mlp.ForAfterWait.convertToDom(self, fragment, wait);
                });
            } else {
                master = master.replace(new RegExp('#' + element.dst, 'g'), element.src);
                _mlp.ForAfterWait.convertToDom(self, master, wait);
            }
        });
    }

    static clone(self, wait) {
        var master = String(self.outerHTML);
        self.style.display = 'none';
        _mlp.ForAfterWait.convertToDom(self, master, wait);
    }

    static convertToDom(self, string, wait) {
        string = _mlp.Operator.readScript(string.unescapeHTML());
        const dom = string.toDom();
        self.parentNode.insertBefore(dom, self); // new dom insert after reference node
        dom.removeAttribute('wait');
        dom.classList.add('afterwait_' + wait);
        dom.style.display = '';
        new _mlp.FlexOnlyEvent(dom);
        new _mlp.Replace(dom);
    }
}


_mlp.ForOnTrigger = class {
    constructor(self, on) {
        const attr = self.getAttribute('for');
        if (attr !== null) {
            const data = _mlp.For.parse(attr);
            _mlp.ForOnTrigger.expand(self, data, on);
        } else {
            _mlp.ForOnTrigger.clone(self, on);
        }
    }

    static expand(self, data, on) {
        var master = String(self.outerHTML);
        var fragment = '';
        self.style.display = 'none';

        data.forEach(function (element) {
            var array = (0, eval)(element.src);
            if (array instanceof Array) {
                array.forEach(function (src, i) {
                    if (master.match('::') && !(element.src instanceof Array)) {
                        fragment = master.replace(new RegExp('#' + element.dst + '::', 'g'), element.src + '[' + i + '].');
                    }
                    else if (!master.match('::') && !(element.src instanceof Array)) {
                        fragment = master.replace(new RegExp('#' + element.dst, 'g'), element.src + '[' + i + ']');
                    }
                    else if (!master.match('::') && element.src instanceof Array) {
                        fragment = master.replace(new RegExp('#' + element.dst, 'g'), element.src[i]);
                    }
                    _mlp.ForOnTrigger.convertToDom(self, fragment, on);
                });
            } else {
                master = master.replace(new RegExp('#' + element.dst, 'g'), element.src);
                _mlp.ForOnTrigger.convertToDom(self, master, on);
            }
        });
    }

    static clone(self, on) {
        var master = String(self.outerHTML);
        self.style.display = 'none';
        _mlp.ForOnTrigger.convertToDom(self, master, on);
    }

    static convertToDom(self, string, on) {
        string = _mlp.Operator.readScript(string.unescapeHTML());
        const dom = string.toDom();
        self.parentNode.insertBefore(dom, self); // new dom insert after reference node
        dom.removeAttribute('on');
        dom.classList.add('ontrigger_' + on);
        dom.style.display = '';
        new _mlp.FlexOnlyEvent(dom);
        new _mlp.Replace(dom);
    }
}


_mlp.ForAtInterval = class {
    constructor(self, interval) {
        const attr = self.getAttribute('for');
        if (attr !== null) {
            const data = _mlp.For.parse(attr);
            _mlp.ForAtInterval.expand(self, data, interval);
        } else {
            _mlp.ForAtInterval.clone(self, interval);
        }
    }

    static expand(self, data, interval) {
        var master = String(self.outerHTML);
        var fragment = '';
        self.style.display = 'none';

        data.forEach(function (element) {
            var array = (0, eval)(element.src);
            if (array instanceof Array) {
                array.forEach(function (src, i) {
                    if (master.match('::') && !(element.src instanceof Array)) {
                        fragment = master.replace(new RegExp('#' + element.dst + '::', 'g'), element.src + '[' + i + '].');
                    }
                    else if (!master.match('::') && !(element.src instanceof Array)) {
                        fragment = master.replace(new RegExp('#' + element.dst, 'g'), element.src + '[' + i + ']');
                    }
                    else if (!master.match('::') && element.src instanceof Array) {
                        fragment = master.replace(new RegExp('#' + element.dst, 'g'), element.src[i]);
                    }
                    _mlp.ForAtInterval.convertToDom(self, fragment, interval);
                });
            } else {
                master = master.replace(new RegExp('#' + element.dst, 'g'), element.src);
                _mlp.ForAtInterval.convertToDom(self, master, interval);
            }
        });
    }

    static clone(self, interval) {
        var master = String(self.outerHTML);
        self.style.display = 'none';
        _mlp.ForAtInterval.convertToDom(self, master, interval);
    }

    static convertToDom(self, string, interval) {
        string = _mlp.Operator.readScript(string.unescapeHTML());
        const dom = string.toDom();
        self.parentNode.insertBefore(dom, self); // new dom insert after reference node
        dom.removeAttribute('interval');
        dom.classList.add('atinterval_' + interval);
        dom.style.display = '';
        new _mlp.FlexOnlyEvent(dom);
        new _mlp.Replace(dom);
    }
}


_mlp.Replace = class {
    constructor(self) {
        const attr = self.getAttribute('replace');
        if (attr !== null) {
            _mlp.Replace.execute(self, _mlp.Replace.parse(attr));
            self.removeAttribute('replace');
        }
    }

    static parse(attribute) {
        var replace = [];

        var attr = attribute.split('|');
        attr = attr.filter(function (e) { return e !== ""; });

        attr.forEach(function (element) {
            var el = element.split('=>');
            replace.push({
                'src': el[0].replace(/(^\s+)|(\s+$)|(^\t+)|(\t+$)|(\r?\n)/g, ""),
                'dst': el[1].replace(/(^\s+)|(\s+$)|(^\t+)|(\t+$)|(\r?\n)/g, "")
            });
        });
        return replace;
    }

    static execute(self, replace) {
        replace.forEach(function (element) {
            self.setAttribute('flex', String(self.getAttribute('flex')).replace(new RegExp(element.src, 'g'), element.dst));
            self.innerHTML = self.innerHTML.replace(new RegExp(element.src, 'g'), element.dst);
        });
    }
}


_mlp.Use = class {
    constructor(self) {
        const attr = self.getAttribute('use');
        if (attr !== null) {
            _mlp.Use.expand(self, attr);
            self.removeAttribute('use');
        }
    }

    static expand(self, moduleId) {
        for (var mod of _mlp.modules) {
            if (mod.id === moduleId) {
                const codeByUse = mod.code;
                const codeByFlex = self.getAttribute('flex') !== null ? self.getAttribute('flex') : '';
                self.classList.add(moduleId);
                self.setAttribute('flex', '@id=' + moduleId + codeByUse + codeByFlex);
            };
        }
    }
}


_mlp.Flex = class {
    constructor(self) {
        const attr = self.getAttribute('flex');
        if (attr !== null) {
            _mlp.Flex.readModule(self, attr);
            self.removeAttribute('flex');
        }
    }

    static parseModule(str) {
        var obj = {};
        var key, keyStart, keyEnd, value, valueEnd;
        while (true) {
            keyStart = str.indexOf('@', 0) + 1;
            keyEnd = str.indexOf('=', keyStart);
            key = str.slice(keyStart, keyEnd).replace(/(^\s+)|(\s+$)|(^\t+)|(\t+$)|(\r?\n)/g, "");
            str = str.slice(keyEnd);
            valueEnd = str.indexOf('@', 0);
            value = str.slice(1, valueEnd).replace(/(^\s+)|(\s+$)|(^\t+)|(\t+$)|(\r?\n)/g, "");
            str = str.slice(valueEnd);
            obj[key] = value;
            if (valueEnd < 0) break;
        }
        return obj;
    }

    static parseSwitch(str) {
        var obj = {};
        var key, keyStart, keyEnd, value, valueEnd;
        while (true) {
            keyStart = str.indexOf('#', 0) + 1;
            keyEnd = str.indexOf(':', keyStart);
            key = str.slice(keyStart, keyEnd).replace(/(^\s+)|(\s+$)|(^\t+)|(\t+$)|(\r?\n)/g, "");
            str = str.slice(keyEnd);
            valueEnd = str.indexOf('#', 0);
            value = str.slice(1, valueEnd).replace(/(^\s+)|(\s+$)|(^\t+)|(\t+$)|(\r?\n)/g, "");
            str = str.slice(valueEnd);
            if (valueEnd < 0) {
                obj[key] = value + ';';
                break;
            } else {
                obj[key] = value;
            }
        }
        return obj;
    }

    static readModule(self, code) {
        const mod = _mlp.Flex.parseModule(code);
        const className = 'c' + _mlp.uniqueStr();
        self.classList.add(className);
        _mlp.Flex.setCSS(self, mod, className);
        _mlp.Flex.setEvent(self, mod, className);
    }

    static setCSS(self, mod, className) {
        const styleTag = document.getElementById('_mlp-style-master');

        Object.keys(mod).forEach(function (key) {
            if (key === 'css') {
                const rule = document.createTextNode('.' + className + '{' + mod[key] + '}');
                styleTag.appendChild(rule);
            }
            if (key === 'cssHover') {
                const rule = document.createTextNode('.' + className + ':hover{' + mod[key] + '}');
                styleTag.appendChild(rule);
            }
            if (key === 'cssFocus') {
                const rule = document.createTextNode('.' + className + ':focus{' + mod[key] + '}');
                styleTag.appendChild(rule);
            }
            if (key === 'cssBefore') {
                const rule = document.createTextNode('.' + className + '::before{' + mod[key] + '}');
                styleTag.appendChild(rule);
            }
            if (key === 'cssAfter') {
                const rule = document.createTextNode('.' + className + '::after{' + mod[key] + '}');
                styleTag.appendChild(rule);
            }
            if (key.startsWith('media ')) {
                const rule = document.createTextNode('@' + key + '{' + '.' + className + '{' + mod[key] + '}}');
                styleTag.appendChild(rule);
            }
            if (key.startsWith('keyframes ')) {
                const animationName = key.replace('keyframes ', '').replace(/(^\s+)|(\s+$)|(^\t+)|(\t+$)|(\r?\n)/g, "");
                if (!_mlp.animationList.inArray(animationName)) {
                    const rule = document.createTextNode('@' + key + '{' + mod[key] + '}');
                    styleTag.appendChild(rule);
                    _mlp.animationList.push(animationName);
                }
            }
        });
    }

    static setEvent(self, mod, className) {
        const selector = '"' + self.tagName + '.' + className + '"';

        Object.keys(mod).forEach(function (key) {
            if (key === 'class') {
                const classes = mod[key].split(',');
                classes.forEach(function (cls) {
                    self.classList.add(cls);
                });
            }
            if (key === 'text') {
                self.textContent = mod[key];
                // self.textContent = mod[key].replace(/(^\s+)|(\s+$)|(^\t+)|(\t+$)/g, "");
            }
            if (key === 'script') {
                if (document.getElementById('script_' + mod.id) === null) {
                    const script = document.createElement('script');
                    script.id = 'script_' + mod.id;
                    script.innerHTML = mod.script.unescapeHTML();
                    document.querySelector('body').appendChild(script);
                }
            }
            if (key === 'onload') {
                _mlp.ready(function () {
                    (0, eval)(mod[key].replace(/THIS/g, selector).unescapeHTML());
                });
            }
            if (key.startsWith(mod.id + '_')) {
                if (mod[key].match('THIS')) {
                    if (typeof (0, eval)('window.' + key) === 'undefined') {
                        (0, eval)('window.' + key + '= function(){' + mod[key].replace(/THIS/g, selector).replace(/#ARG\d/g, 'arguments[$&]').replace(/#ARG/g, '').unescapeHTML() + '}');
                    }
                    else {
                        const func = ((0, eval)('window.' + key).toString()).replace('function(){', 'function(){' + mod[key].replace(/THIS/g, selector).replace(/#ARG\d/g, 'arguments[$&]').replace(/#ARG/g, '').unescapeHTML());
                        (0, eval)('window.' + key + '=' + func);
                    }
                } else {
                    if (typeof (0, eval)('window.' + key) === 'undefined') {
                        (0, eval)('window.' + key + '= function(){' + mod[key].replace(/#ARG\d/g, 'arguments[$&]').replace(/#ARG/g, '').unescapeHTML() + '}');
                    }
                }
            }
            if (key === 'show') {
                if (MutationObserver) {
                    var observer = new MutationObserver(function (mutations) {
                        mutations.forEach(function (mutation) {
                            if (String(mutation.oldValue).match('display: none;') && mutation.target.style.display !== "none") {
                                (0, eval)(mod[key].replace(/THIS/g, selector).unescapeHTML());
                            }
                        });
                    });
                    observer.observe(self, { attributes: true, attributeOldValue: true, attributeFilter: ['style'] });
                }
            }
            if (key === 'hide') {
                if (MutationObserver) {
                    var observer = new MutationObserver(function (mutations) {
                        mutations.forEach(function (mutation) {
                            if (!String(mutation.oldValue).match('display: none;') && mutation.target.style.display === "none") {
                                (0, eval)(mod[key].replace(/THIS/g, selector).unescapeHTML());
                            }
                        });
                    });
                    observer.observe(self, { attributes: true, attributeOldValue: true, attributeFilter: ['style'] });
                }
            }
            if (key === 'switch') {
                const switchObj = _mlp.Flex.parseSwitch(mod[key]);
                const variable = _mlp.uniqueStr();
                (0, eval)('window.s' + variable + '=1;');
                self.addEventListener('click', function () {
                    const idx = (0, eval)('window.s' + variable);
                    (0, eval)(switchObj[idx].replace(/THIS/g, selector).unescapeHTML());
                    if (idx === Object.keys(switchObj).length) {
                        (0, eval)('window.s' + variable + '=1;')
                    } else {
                        (0, eval)('window.s' + variable + '+=1;');
                    }
                });
            }
            if (key.startsWith('swipe ')) {
                const direction = key.replace('swipe ', '').replace(/(^\s+)|(\s+$)|(^\t+)|(\t+$)|(\r?\n)/g, "");
                self.swipe(direction, function () {
                    (0, eval)(mod[key].replace(/THIS/g, selector).unescapeHTML());
                });
            }
            if (key.startsWith('hold')) {
                const holdtime = key.replace('hold ', '').replace(/(^\s+)|(\s+$)|(^\t+)|(\t+$)|(\r?\n)/g, "");
                self.hold(function () {
                    (0, eval)(mod[key].replace(/THIS/g, selector).unescapeHTML());
                }, holdtime | 0 || 1000);
            }
            if (key.startsWith('inview')) {
                const threshold = key.replace('inview ', '').replace(/(^\s+)|(\s+$)|(^\t+)|(\t+$)|(\r?\n)/g, "");
                self.inview(function (e) {
                    (0, eval)(mod[key].replace(/THIS/g, selector).unescapeHTML());
                }, null, threshold | 0 || 0.5);
            }
            if (key.startsWith('outview')) {
                const threshold = key.replace('outview ', '').replace(/(^\s+)|(\s+$)|(^\t+)|(\t+$)|(\r?\n)/g, "");
                self.inview(null, function (e) {
                    (0, eval)(mod[key].replace(/THIS/g, selector).unescapeHTML());
                }, threshold | 0 || 0.5);
            }
            if (key.startsWith('interval')) {
                const interval = key.replace('interval ', '').replace(/(^\s+)|(\s+$)|(^\t+)|(\t+$)|(\r?\n)/g, "");
                setInterval(function () {
                    (0, eval)(mod[key].replace(/THIS/g, selector).unescapeHTML());
                }, interval | 0 || 1000);
            }
        });

        _mlp.eventList.forEach(function (event) {
            if (typeof mod[event] !== 'undefined') {
                self.addEventListener(event, function () {
                    (0, eval)(mod[event].replace(/THIS/g, selector).unescapeHTML());
                });
            }
        });
    }
}


_mlp.FlexOnlyCSS = class {
    constructor(self) {
        const attr = self.getAttribute('flex');
        if (attr !== null) {
            _mlp.Flex.readModule(self, attr);
        }
    }

    static readModule(self, code) {
        const mod = _mlp.Flex.parseModule(code);
        const className = 'c' + _mlp.uniqueStr();
        self.classList.add(className);
        _mlp.Flex.setCSS(self, mod, className);
    }
}


_mlp.FlexOnlyEvent = class {
    constructor(self) {
        const attr = self.getAttribute('flex');
        if (attr !== null) {
            _mlp.Flex.readModule(self, attr);
            self.removeAttribute('flex');
        }
    }

    static readModule(self, code) {
        const mod = _mlp.Flex.parseModule(code);
        const className = 'c' + _mlp.uniqueStr();
        self.classList.add(className);
        _mlp.Flex.setEvent(self, mod, className);
    }
}


_mlp.Screen = class {
    constructor() {
        if (typeof _mlp.screen !== 'undefined') {
            _mlp.Screen.readProperty();
            const fn = function () {
                if (_mlp.resizeSaver) return;
                _mlp.resizeSaver = setTimeout(function () {
                    _mlp.resizeSaver = 0;
                    _mlp.Screen.readProperty();
                }, 800);
            }
            window.addEventListener('resize', fn);
            window.addEventListener('orientationchange', fn);
        }
    }

    static readProperty() {
        for (var key in _mlp.screen) {
            (0, eval)('window.' + key + '=' + _mlp.screen[key] + '? true : false;');
        }
        _mlp.targetDOM.forEach(function (dom) {
            const doms = document.querySelectorAll(dom);
            Object.keys(doms).forEach(function (index) {
                const self = doms[index];
                const screenProperty = self.getAttribute('screen');
                if (screenProperty !== null) {
                    self.style.display = 'none';
                    const screenPropertyArray = screenProperty.split(',');
                    screenPropertyArray.forEach(function (property) {
                        const prop = property;
                        // const prop = property.replace(/(\s+)|(\t+)|(\r?\n)/g, "");
                        Object.keys(_mlp.screen).forEach(function (key) {
                            if (prop === key && (0, eval)(key)) {
                                self.style.display = '';
                            }
                        });
                    })
                }
            });
        });
    }
}


_mlp.Main = class {
    constructor() {
        _mlp.Main.createStyleTag();
        _mlp.Main.generateDOM(_mlp.Clone);
        _mlp.Main.generateDOM(_mlp.Use);
        _mlp.Main.generateDOM(_mlp.For);
        _mlp.Main.generateDOM(_mlp.Replace);
        _mlp.Main.generateDOM(_mlp.Flex);
        _mlp.Main.afterWait();
        _mlp.Main.onTrigger();
        _mlp.Main.atInterval();
        new _mlp.Screen();
    }

    static createStyleTag() {
        const style = document.createElement('style');
        style.id = '_mlp-style-master';
        style.type = 'text/css';
        style.rel = 'stylesheet';
        const head = document.querySelector('head');
        head.appendChild(style);
    }

    static generateDOM(Class) {
        _mlp.targetDOM.forEach(function (dom) {
            const doms = document.querySelectorAll(dom);
            Object.keys(doms).forEach(function (index) {
                const self = doms[index];
                const wait = self.getAttribute('wait');
                const on = self.getAttribute('on');
                const interval = self.getAttribute('interval');

                if (wait !== null && on === null && interval === null) {
                    if (Class === _mlp.For) {
                        self.style.display = 'none';
                        if (!_mlp.afterWait.inArray(wait)) {
                            _mlp.afterWait.push(wait);
                        }
                    } else if (Class === _mlp.Replace) {
                        return false;

                    } else if (Class === _mlp.Flex) {
                        new _mlp.FlexOnlyCSS(self);

                    } else {
                        new Class(self);
                    }
                } else if (wait === null && on !== null && interval === null) {
                    if (Class === _mlp.For) {
                        self.style.display = 'none';
                        if (!_mlp.onTrigger.inArray(on)) {
                            _mlp.onTrigger.push(on);
                        }
                    } else if (Class === _mlp.Replace) {
                        return false;

                    } else if (Class === _mlp.Flex) {
                        new _mlp.FlexOnlyCSS(self);

                    } else {
                        new Class(self);
                    }
                } else if (wait === null && on === null && interval !== null) {
                    if (Class === _mlp.For) {
                        self.style.display = 'none';
                        if (!_mlp.atInterval.inArray(interval)) {
                            _mlp.atInterval.push(interval);
                        }
                    } else if (Class === _mlp.Replace) {
                        return false;

                    } else if (Class === _mlp.Flex) {
                        new _mlp.FlexOnlyCSS(self);

                    } else {
                        new Class(self);
                    }
                } else {
                    new Class(self);
                }
            });
        });
    }

    static afterWait() {
        _mlp.afterWait.forEach(function (variable) {
            Object.defineProperty(window, variable, {
                val: undefined,
                get: function () { return this.val; },
                set: function (x) {
                    this.val = x;
                    const oldDOM = document.querySelectorAll('.afterwait_' + variable);
                    oldDOM.forEach(function (dom) {
                        dom.parentNode.removeChild(dom);
                    });
                    _mlp.targetDOM.forEach(function (dom) {
                        const doms = document.querySelectorAll(dom);
                        Object.keys(doms).forEach(function (index) {
                            const self = doms[index];
                            if (self.getAttribute('wait') === variable) {
                                new _mlp.ForAfterWait(self, variable);
                            }
                        });
                    });
                },
                configurable: true,
            });
        });
    }

    static onTrigger() {
        _mlp.onTrigger.forEach(function (on) {
            document.addEventListener(on, function () {
                const oldDOM = document.querySelectorAll('.ontrigger_' + on);
                oldDOM.forEach(function (dom) {
                    dom.parentNode.removeChild(dom);
                });
                _mlp.targetDOM.forEach(function (dom) {
                    const doms = document.querySelectorAll(dom);
                    Object.keys(doms).forEach(function (index) {
                        const self = doms[index];
                        if (self.getAttribute('on') === on) {
                            new _mlp.ForOnTrigger(self, on);
                        }
                    });
                });
            });
        });
    }

    static atInterval() {
        _mlp.atInterval.forEach(function (interval) {
            setInterval(function () {
                const oldDOM = document.querySelectorAll('.atinterval_' + interval);
                oldDOM.forEach(function (dom) {
                    dom.parentNode.removeChild(dom);
                });
                _mlp.targetDOM.forEach(function (dom) {
                    const doms = document.querySelectorAll(dom);
                    Object.keys(doms).forEach(function (index) {
                        const self = doms[index];
                        if (self.getAttribute('wait') === null && self.getAttribute('interval') === interval) {
                            new _mlp.ForAtInterval(self, interval);
                        }
                    });
                });
            }, interval);
        });
    }
}


_mlp.init = function () {
    return new Promise(function (resolve, reject) {
        // document.addEventListener('DOMContentLoaded', function () {
        const body = document.querySelector('body');
        body.style.display = '';
        new _mlp.Main();
        resolve();
        // }, false);
    });
}
_mlp.init().then(function () { mlp.on('load'); });
})(); 