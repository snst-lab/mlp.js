'use strict';
var mlp = mlp || {}; mlp.modules = [];

class importFile extends HTMLElement {
    constructor() {
        super();
        const xhr = new XMLHttpRequest();
        xhr.open("GET", this.textContent, false); //true : async
        xhr.send(null);
        if (xhr.status === 200) {
            importFile.expand(this, xhr);
        } else {
            console.log(this.textContent + ' is not found.');
        }
    }
    static expand(self, xhr) {
        if (self.getAttribute('var') !== null && xhr.responseText !== '') {
            window.onload = function () {
                if (self.getAttribute('as') === 'json') {
                    (0, eval)('window.' + self.getAttribute('var') + "='" + JSON.parse(xhr.responseText) + "';");
                }
                else if (self.getAttribute('as') === 'string') {
                    (0, eval)('window.' + self.getAttribute('var') + "='" + importFile.escapeHTML(xhr.responseText) + "';");
                }
                else {
                    (0, eval)('window.' + self.getAttribute('var') + "='" + xhr.responseText + "';");
                }
                self.parentNode.removeChild(self);
            }
        }
        else if (self.getAttribute('as') === 'string' && xhr.responseText !== '') {
            self.outerHTML = importFile.escapeHTML(xhr.responseText);

        } else {
            self.outerHTML = xhr.responseText;
        }
    }
    static escapeHTML(string) {
        const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }
        const pattern = Object.keys(map).join("|")
        return string.replace(new RegExp(pattern, "g"), function (e) { return map[e] })
    }
}
customElements.define('import-file', importFile);


class flexModule extends HTMLElement {
    constructor() {
        super();
        if (this.getAttribute('id') !== null) {
            mlp.modules.push({ 'id': this.getAttribute('id'), 'code': this.innerHTML });
            (0, eval)('var ' + this.getAttribute('id') + '=' + this.getAttribute('id') + '||{};');
            this.parentNode.removeChild(this);
        }
    }
}
customElements.define('flex-module', flexModule);


class preLoader extends HTMLElement {
    constructor() {
        super();
        const loader = this ;
        const source = loader.textContent;
        const div= document.createElement('div');
        loader.appendChild(div);

        if (source.match('.html')) {
            const xhr = new XMLHttpRequest();
            xhr.open("GET", source, false); //true : async
            xhr.send(null);
            if (xhr.status === 200) {
                div.innerHTML = xhr.responseText;
            } else {
                console.log(source + ' is not found.');
            }
        }
        else if(source.match('.png')) {
            const img = document.createElement('img');
            img.style = "position:fixed;top:0;left:0;bottom:0;right:0;margin:auto;z-index:102;";
            img.src = source;
            div.appendChild(img);
        }
        div.style.display = 'none';

        if (loader.getAttribute('on') === null || loader.getAttribute('on') === 'load') {
            preLoader.fade(loader);
        }
    }
    static fade(loader){
        const div = loader.children[0];
        const timeout =  loader.getAttribute('timeout') || 2000;
        const duration =  loader.getAttribute('duration') || 200;
        div.style = "position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:101;background:white;";
        div.style.background = loader.getAttribute('background') || "white";
        setTimeout(function () { 
            loader.children[0].fadeOut(duration);
        },timeout);
    }
}
customElements.define('pre-loader', preLoader);


mlp.Clone = class {
    constructor(self) {
        const attr = self.getAttribute('clone');
        if (attr !== null) {
            self.removeAttribute('clone');
            mlp.Clone.template(self, attr);
        }
    }

    static template(self, id) {
        const template = document.querySelector('template#' + id);
        let clone = template.innerHTML.replace(/#CONTENT/g, self.innerHTML);
        self.innerHTML = clone;
    }
}


mlp.For = class {
    constructor(self) {
        const attr = self.getAttribute('for');
        if (attr !== null) {
            const data = mlp.For.parse(attr);
            mlp.For.expand(self, data);
        } else if (attr === null && !self.outerHTML.match('#') &&
            typeof self.getAttribute('wait') === 'undefined' &&
            typeof self.getAttribute('on') === 'undefined' &&
            typeof self.getAttribute('interval') === 'undefined') {
            self.outerHTML = mlp.For.parseScript(String(self.outerHTML));
        }
    }

    static parse(attribute) {
        var data = [];
        var attr = attribute.replace(/(\s+)|(\t+)|(\r?\n)/g, "").split(';');
        attr = attr.filter(function (e) { return e !== ""; });

        attr.forEach(function (element) {
            var el = element.split(':');
            data.push({ 'dst': el[0], 'src': mlp.For.parseSrc(el[1]) });
        });
        return data;
    }

    static parseSrc(src) {
        if (src.match(',') && !src.match('->') && !src.match('/')) {
            return src.split(',').filter(function (e) { return e !== ""; });
        }
        else if (!src.match(',') && src.match('->')) {
            const a = src.split('->');
            const start = parseInt(a[0]);
            let end = parseInt(a[1]);
            let step = 1;
            if (src.match('/')) {
                const b = a[1].split('/');
                end = parseInt(b[0]);
                step = parseInt(b[1]);
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
            return src.replace(/(^\s+)|(\s+$)|(^\t+)|(\t+$)|(\r?\n)/g, "");
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
        master = mlp.For.readScript(master.unescapeHTML());
        self.insertAdjacentHTML('afterend', master);
        self.style.display = 'none';
    }

    static readScript(text) {
        if (text.match('{{') && text.match('}}')) {
            return mlp.For.parseScript(text);
        } else {
            return text;
        }
    }

    static parseScript(string) {
        var str = string;
        var after = '';

        while (true) {
            const scriptStart = str.indexOf('{{', 0); if (scriptStart < 0) { after = after + str; break };
            const scriptEnd = str.indexOf('}}', scriptStart);
            const text = str.slice(0, scriptStart);
            const script = str.slice(scriptStart + 2, scriptEnd).replace(/(^\s+)|(\s+$)|(^\t+)|(\t+$)|(\r?\n)/g, "");
            str = str.slice(scriptEnd + 2);
            after += text + String((0, eval)(script));
        }
        return after;
    }
}


mlp.ForAfterWait = class {
    constructor(self, wait) {
        const attr = self.getAttribute('for');
        if (attr !== null) {
            const data = mlp.For.parse(attr);
            mlp.ForAfterWait.expand(self, data, wait);
        } else {
            mlp.ForAfterWait.clone(self, wait);
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
                    mlp.ForAfterWait.convertToDom(self, fragment, wait);
                });
            } else {
                master = master.replace(new RegExp('#' + element.dst, 'g'), element.src);
                mlp.ForAfterWait.convertToDom(self, master, wait);
            }
        });
    }

    static clone(self, wait) {
        var master = String(self.outerHTML);
        self.style.display = 'none';
        mlp.ForAfterWait.convertToDom(self, master, wait);
    }

    static convertToDom(self, string, wait) {
        string = mlp.For.readScript(string.unescapeHTML());
        const dom = string.toDom();
        self.parentNode.insertBefore(dom, self.nextSibling); // new dom insert after reference node
        dom.removeAttribute('wait');
        dom.classList.add('afterwait_' + wait);
        dom.style.display = '';
        new mlp.FlexOnlyEvent(dom);
        new mlp.Replace(dom);
    }
}


mlp.ForOnTrigger = class {
    constructor(self, on) {
        const attr = self.getAttribute('for');
        if (attr !== null) {
            const data = mlp.For.parse(attr);
            mlp.ForOnTrigger.expand(self, data, on);
        } else {
            mlp.ForOnTrigger.clone(self, on);
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
                    mlp.ForOnTrigger.convertToDom(self, fragment, on);
                });
            } else {
                master = master.replace(new RegExp('#' + element.dst, 'g'), element.src);
                mlp.ForOnTrigger.convertToDom(self, master, on);
            }
        });
    }

    static clone(self, on) {
        var master = String(self.outerHTML);
        self.style.display = 'none';
        mlp.ForOnTrigger.convertToDom(self, master, on);
    }

    static convertToDom(self, string, on) {
        string = mlp.For.readScript(string.unescapeHTML());
        const dom = string.toDom();
        self.parentNode.insertBefore(dom, self.nextSibling); // new dom insert after reference node
        dom.removeAttribute('on');
        dom.classList.add('ontrigger_' + on);
        dom.style.display = '';
        new mlp.FlexOnlyEvent(dom);
        new mlp.Replace(dom);
    }
}


mlp.ForAtInterval = class {
    constructor(self, interval) {
        const attr = self.getAttribute('for');
        if (attr !== null) {
            const data = mlp.For.parse(attr);
            mlp.ForAtInterval.expand(self, data, interval);
        } else {
            mlp.ForAtInterval.clone(self, interval);
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
                    mlp.ForAtInterval.convertToDom(self, fragment, interval);
                });
            } else {
                master = master.replace(new RegExp('#' + element.dst, 'g'), element.src);
                mlp.ForAtInterval.convertToDom(self, master, interval);
            }
        });
    }

    static clone(self, interval) {
        var master = String(self.outerHTML);
        self.style.display = 'none';
        mlp.ForAtInterval.convertToDom(self, master, interval);
    }

    static convertToDom(self, string, interval) {
        string = mlp.For.readScript(string.unescapeHTML());
        const dom = string.toDom();
        self.parentNode.insertBefore(dom, self.nextSibling); // new dom insert after reference node
        dom.removeAttribute('interval');
        dom.classList.add('atinterval_' + interval);
        dom.style.display = '';
        new mlp.FlexOnlyEvent(dom);
        new mlp.Replace(dom);
    }
}


mlp.Replace = class {
    constructor(self) {
        const attr = self.getAttribute('replace');
        if (attr !== null) {
            mlp.Replace.execute(self, mlp.Replace.parse(attr));
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


mlp.Use = class {
    constructor(self) {
        const attr = self.getAttribute('use');
        if (attr !== null) {
            mlp.Use.expand(self, attr);
            self.removeAttribute('use');
        }
    }

    static expand(self, moduleId) {
        for (var mod of mlp.modules) {
            if (mod.id === moduleId) {
                const codeByUse = mod.code;
                const codeByFlex = self.getAttribute('flex') !== null ? self.getAttribute('flex') : '';
                self.classList.add(moduleId);
                self.setAttribute('flex', '@id=' + moduleId + codeByUse + codeByFlex);
            };
        }
    }
}


mlp.Flex = class {
    constructor(self) {
        const attr = self.getAttribute('flex');
        if (attr !== null) {
            mlp.Flex.readModule(self, attr);
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
        const mod = mlp.Flex.parseModule(code);
        const className = 'c' + mlp.uniqueStr();
        self.classList.add(className);
        mlp.Flex.setCSS(self, mod, className);
        mlp.Flex.setEvent(self, mod, className);
    }

    static setCSS(self, mod, className) {
        const styleTag = document.getElementById('mlp-style-master');

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
                if (!mlp.animationList.inArray(animationName)) {
                    const rule = document.createTextNode('@' + key + '{' + mod[key] + '}');
                    styleTag.appendChild(rule);
                    mlp.animationList.push(animationName);
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
                self.textContent = mod[key].replace(/(^\s+)|(\s+$)|(^\t+)|(\t+$)/g, "");
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
                mlp.ready(function () {
                    (0, eval)(mod[key].replace(/SELF/g, selector).unescapeHTML());
                });
            }
            if (key.startsWith(mod.id + '_')) {
                if (mod[key].match('SELF')) {
                    if (typeof (0, eval)('window.' + key) === 'undefined') {
                        (0, eval)('window.' + key + '= function(){' + mod[key].replace(/SELF/g, selector).replace(/#ARG\d/g, 'arguments[$&]').replace(/#ARG/g, '').unescapeHTML() + '}');
                    }
                    else {
                        const func = ((0, eval)('window.' + key).toString()).replace('function(){', 'function(){' + mod[key].replace(/SELF/g, selector).replace(/#ARG\d/g, 'arguments[$&]').replace(/#ARG/g, ''));
                        (0, eval)('window.' + key + '=' + func);
                    }
                } else {
                    if (typeof (0, eval)('window.' + key) === 'undefined') {
                        (0, eval)('window.' + key + '= function(){' + mod[key].replace(/#ARG\d/g, 'arguments[$&]').replace(/#ARG/g, '').unescapeHTML() + '}');
                    }
                }
            }
            if (key === 'show') {
                var observer = new MutationObserver(function (mutations) {
                    mutations.forEach(function (mutation) {
                        if (String(mutation.oldValue).match('display: none;') && mutation.target.style.display !== "none") {
                            (0, eval)(mod[key].replace(/SELF/g, selector).unescapeHTML());
                        }
                    });
                });
                observer.observe(self, { attributes: true, attributeOldValue: true, attributeFilter: ['style'] });
            }
            if (key === 'hide') {
                var observer = new MutationObserver(function (mutations) {
                    mutations.forEach(function (mutation) {
                        if (!String(mutation.oldValue).match('display: none;') && mutation.target.style.display === "none") {
                            (0, eval)(mod[key].replace(/SELF/g, selector).unescapeHTML());
                        }
                    });
                });
                observer.observe(self, { attributes: true, attributeOldValue: true, attributeFilter: ['style'] });
            }
            if (key === 'switch') {
                const switchObj = mlp.Flex.parseSwitch(mod[key]);
                const variable = mlp.uniqueStr();
                (0, eval)('window.s' + variable + '=1;');
                self.addEventListener('click', function () {
                    const idx = (0, eval)('window.s' + variable);
                    (0, eval)(switchObj[idx].replace(/SELF/g, selector).unescapeHTML());
                    if (idx === Object.keys(switchObj).length) {
                        (0, eval)('window.s' + variable + '=1;')
                    } else {
                        (0, eval)('window.s' + variable + '+=1;');
                    }
                });
            }
            if (key.startsWith('hold ')) {
                const holdtime = key.replace('hold ', '').replace(/(^\s+)|(\s+$)|(^\t+)|(\t+$)|(\r?\n)/g, "");
                self.hold(function () {
                    (0, eval)(mod[key].replace(/SELF/g, selector).unescapeHTML());
                }, holdtime);
            }
            if (key.startsWith('swipe ')) {
                const direction = key.replace('swipe ', '').replace(/(^\s+)|(\s+$)|(^\t+)|(\t+$)|(\r?\n)/g, "");
                self.swipe(direction, function () {
                    (0, eval)(mod[key].replace(/SELF/g, selector).unescapeHTML());
                });
            }
            if (key.startsWith('inview')) {
                const threshold = key.replace('inview ', '').replace(/(^\s+)|(\s+$)|(^\t+)|(\t+$)|(\r?\n)/g, "");
                self.inview(function (e) {
                    (0, eval)(mod[key].replace(/SELF/g, selector).unescapeHTML());
                }, null, threshold);
            }
            if (key.startsWith('outview')) {
                const threshold = key.replace('outview ', '').replace(/(^\s+)|(\s+$)|(^\t+)|(\t+$)|(\r?\n)/g, "");
                self.inview(null, function (e) {
                    (0, eval)(mod[key].replace(/SELF/g, selector).unescapeHTML());
                }, threshold);
            }
            if (key.startsWith('interval')) {
                const interval = key.replace('interval ', '').replace(/(^\s+)|(\s+$)|(^\t+)|(\t+$)|(\r?\n)/g, "");
                setInterval(function () {
                    (0, eval)(mod[key].replace(/SELF/g, selector).unescapeHTML());
                }, Number(interval) || 1000);
            }
        });

        mlp.eventList.forEach(function (event) {
            if (typeof mod[event] !== 'undefined') {
                self.addEventListener(event, function () {
                    (0, eval)(mod[event].replace(/SELF/g, selector).unescapeHTML());
                });
            }
        });
    }
}


mlp.FlexOnlyCSS = class {
    constructor(self) {
        const attr = self.getAttribute('flex');
        if (attr !== null) {
            mlp.Flex.readModule(self, attr);
        }
    }

    static readModule(self, code) {
        const mod = mlp.Flex.parseModule(code);
        const className = 'c' + mlp.uniqueStr();
        self.classList.add(className);
        mlp.Flex.setCSS(self, mod, className);
    }
}


mlp.FlexOnlyEvent = class {
    constructor(self) {
        const attr = self.getAttribute('flex');
        if (attr !== null) {
            mlp.Flex.readModule(self, attr);
            self.removeAttribute('flex');
        }
    }

    static readModule(self, code) {
        const mod = mlp.Flex.parseModule(code);
        const className = 'c' + mlp.uniqueStr();
        self.classList.add(className);
        mlp.Flex.setEvent(self, mod, className);
    }
}


mlp.Screen = class {
    constructor() {
        if (typeof mlp.screen !== 'undefined') {
            mlp.Screen.readProperty();
            const fn = function () {
                if (mlp.resizeSaver) return;
                mlp.resizeSaver = setTimeout(function () {
                    mlp.resizeSaver = 0;
                    mlp.Screen.readProperty();
                }, 500);
            }
            window.addEventListener('resize', fn);
            window.addEventListener('orientationchange', fn);
        }
    }

    static readProperty() {
        for (var key in mlp.screen) {
            (0, eval)('window.' + key + '=' + mlp.screen[key] + '? true : false;');
        }
        mlp.targetDOM.forEach(function (dom) {
            const doms = document.querySelectorAll(dom);
            Object.keys(doms).forEach(function (index) {
                const self = doms[index];
                const screenProperty = self.getAttribute('screen');
                if (screenProperty !== null) {
                    self.style.display = 'none';
                    const screenPropertyArray = screenProperty.split(',');
                    screenPropertyArray.forEach(function (property) {
                        const prop = property.replace(/(\s+)|(\t+)|(\r?\n)/g, "");
                        Object.keys(mlp.screen).forEach(function (key) {
                            if (prop === key && (0, eval)(key)) {
                                self.fadeIn(200);
                            }
                        });
                    })
                }
            });
        });
    }
}


mlp.Main = class {
    constructor() {
        mlp.Main.createStyleTag();
        mlp.Main.generateDOM(mlp.Clone);
        mlp.Main.generateDOM(mlp.Use);
        mlp.Main.generateDOM(mlp.For);
        mlp.Main.generateDOM(mlp.Replace);
        mlp.Main.generateDOM(mlp.Flex);
        mlp.Main.afterWait();
        mlp.Main.onTrigger();
        mlp.Main.atInterval();
        new mlp.Screen();
    }

    static createStyleTag() {
        const style = document.createElement('style');
        style.id = 'mlp-style-master';
        style.type = 'text/css';
        style.rel = 'stylesheet';
        const head = document.getElementsByTagName('head').item(0);
        head.appendChild(style);
    }

    static generateDOM(Class) {
        mlp.targetDOM.forEach(function (dom) {
            const doms = document.querySelectorAll(dom);
            Object.keys(doms).forEach(function (index) {
                const self = doms[index];
                const wait = self.getAttribute('wait');
                const on = self.getAttribute('on');
                const interval = self.getAttribute('interval');
                if (wait !== null && on === null && interval === null) {
                    if (Class === mlp.For) {
                        self.style.display = 'none';
                        if (!mlp.afterWait.inArray(wait)) {
                            mlp.afterWait.push(wait);
                        }
                    } else if (Class === mlp.Replace) {
                        return false;

                    } else if (Class === mlp.Flex) {
                        new mlp.FlexOnlyCSS(self);

                    } else {
                        new Class(self);
                    }
                } else if (wait === null && on !== null && interval === null) {
                    if (Class === mlp.For) {
                        self.style.display = 'none';
                        if (!mlp.onTrigger.inArray(on)) {
                            mlp.onTrigger.push(on);
                        }
                    } else if (Class === mlp.Replace) {
                        return false;

                    } else if (Class === mlp.Flex) {
                        new mlp.FlexOnlyCSS(self);

                    } else {
                        new Class(self);
                    }
                } else if (wait === null && on === null && interval !== null) {
                    if (Class === mlp.For) {
                        self.style.display = 'none';
                        if (!mlp.atInterval.inArray(interval)) {
                            mlp.atInterval.push(interval);
                        }
                    } else if (Class === mlp.Replace) {
                        return false;

                    } else if (Class === mlp.Flex) {
                        new mlp.FlexOnlyCSS(self);

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
        mlp.afterWait.forEach(function (variable) {
            Object.defineProperty(window, variable, {
                val: undefined,
                get: function () { return this.val; },
                set: function (x) {
                    this.val = x;
                    const oldDOM = document.querySelectorAll('.afterwait_' + variable);
                    oldDOM.forEach(function (dom) {
                        dom.parentNode.removeChild(dom);
                    });
                    mlp.targetDOM.forEach(function (dom) {
                        const doms = document.querySelectorAll(dom);
                        Object.keys(doms).forEach(function (index) {
                            const self = doms[index];
                            if (self.getAttribute('wait') === variable) {
                                new mlp.ForAfterWait(self, variable);
                            }
                        });
                    });
                },
                configurable: true,
            });
        });
    }

    static onTrigger() {
        mlp.onTrigger.forEach(function (on) {
            document.addEventListener(on, function () {
                const oldDOM = document.querySelectorAll('.ontrigger_' + on);
                oldDOM.forEach(function (dom) {
                    dom.parentNode.removeChild(dom);
                });
                mlp.targetDOM.forEach(function (dom) {
                    const doms = document.querySelectorAll(dom);
                    Object.keys(doms).forEach(function (index) {
                        const self = doms[index];
                        if (self.getAttribute('on') === on) {
                            new mlp.ForOnTrigger(self, on);
                        }
                    });
                });
            });
        });
    }

    static atInterval() {
        mlp.atInterval.forEach(function (interval) {
            setInterval(function () {
                const oldDOM = document.querySelectorAll('.atinterval_' + interval);
                oldDOM.forEach(function (dom) {
                    dom.parentNode.removeChild(dom);
                });
                mlp.targetDOM.forEach(function (dom) {
                    const doms = document.querySelectorAll(dom);
                    Object.keys(doms).forEach(function (index) {
                        const self = doms[index];
                        if (self.getAttribute('wait') === null && self.getAttribute('interval') === interval) {
                            new mlp.ForAtInterval(self, interval);
                        }
                    });
                });
            }, interval);
        });
    }
}

mlp.defineMethods = class {
    constructor() {
        mlp.on = function (triggerEvent) {
            const event = document.createEvent('HTMLEvents');
            event.initEvent(triggerEvent, true, false);
            document.dispatchEvent(event);
        }

        mlp.loader = function (id) {
            const doms = document.querySelectorAll('pre-loader');
            Object.keys(doms).forEach(function (index) {
                const loader = doms[index];
                if (loader.getAttribute('on') !== null && loader.getAttribute('on') === id) {
                    preLoader.fade(loader);
                }
            });
        }

        mlp.uniqueStr = function () {
            const strong = 1000;
            return new Date().getTime().toString(16) + Math.floor(strong * Math.random()).toString(16);
        }

        mlp.ready = function (fn) {
            if (document.attachEvent ? document.readyState === "complete" : document.readyState !== "loading") {
                fn();
            } else {
                document.addEventListener('DOMContentLoaded', fn);
            }
        }

        mlp.ajax = function (option) {
            const xhr = new XMLHttpRequest();
            if (option.type === 'GET') {
                xhr.open('GET', option.url, option.async);
                xhr.send();
                if (xhr.status >= 200 && xhr.status < 400) {
                    return xhr;
                }
            }
            if (option.type === 'POST') {
                request.open('POST', option.url, option.async);
                request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
                request.send(option.data);
            }
        }

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

        if (!HTMLElement.prototype.childText) {
            Object.defineProperty(HTMLElement.prototype, "childText", {
                configurable: true,
                enumerable: false,
                writable: true,
                value: function () {
                    var text = "";
                    for (var i = 0; i < this.childNodes.length; i++) {
                        if (Object.prototype.toString.call(this.childNodes[i]) === '[object Text]') {
                            text += this.childNodes[i].data;
                        }
                    }
                    return text;
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
                    if(timeout===0){
                        self.style.display = '';
                    }else{
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
                    if(timeout===0){
                        self.style.display = 'none';
                    }else{
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
                    const sens = Object.prototype.toString.call(sensitivity) !== '[object Number]' || sensitivity <= 0 ? 5 : sensitivity;
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

mlp.Setting = class {
    constructor() {
        mlp.screen = {};
        mlp.targetDOM = [];
        mlp.eventList = [];
        mlp.animationList = [];
        mlp.afterWait = [];
        mlp.onTrigger = [];
        mlp.atInterval = [];
        mlp.attributes = ['clone', 'use', 'for', 'replace', 'flex', 'on', 'wait', 'interval', 'screen'];
        mlp.resizeSaver = 0;
        mlp.Setting.init();
    }

    static init() {
        const setting = JSON.parse(mlp.ajax({ url: 'mlp.json', type: "GET", async: false }).responseText);
        if (typeof setting['screen'] !== 'undefined') {
            mlp.screen = setting['screen'];
            for (var key in mlp.screen) {
                (0, eval)('window.' + key + '=' + setting['screen'][key] + '? true : false;');
            }
        }
        mlp.targetDOM = [];
        if (typeof setting['dom'] !== 'undefined') {
            mlp.targetDOM = setting['dom'].split(',');
        }
        mlp.eventList = [];
        if (typeof setting['event'] !== 'undefined') {
            mlp.eventList = setting['event'].split(',');
        }
    }
}

mlp.init = function () {
    const body = document.getElementsByTagName('body').item(0);
    body.style.display = 'none';
    new mlp.defineMethods();
    new mlp.Setting();
    
    document.addEventListener('DOMContentLoaded', function () {
        body.style.display = '';
        new mlp.Main();
    }, false);
}
mlp.init();