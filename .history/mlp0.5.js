'use strict';
var melonpan = melonpan || {};
melonpan.modules = [];

class importHTML extends HTMLElement {
    constructor() {
        super();
        const xhr = new XMLHttpRequest();
        xhr.open("GET", this.textContent , false); //true : async
        xhr.send(null);
        if (xhr.status == '200') {
            this.outerHTML = xhr.responseText;
        } else {
           console.log(this.textContent + ' is not found.');
        }
    }
}
customElements.define('import-html', importHTML);

class flexModule extends HTMLElement {
    constructor() {
        super();
        if(this.getAttribute('id')!==null){
            melonpan.modules.push( {'id':this.getAttribute('id'), 'code':this.innerHTML});
            $(this).remove();
        }
    }
}
customElements.define('flex-module', flexModule);

class globalJs extends HTMLElement {
    constructor() {
        super();
        this.outerHTML = '<script type="text/javascript">'+(0,eval)(this.textContent)+'</script>';
    }
}
customElements.define('global-js', globalJs);

 
melonpan.Clone = class {
    constructor(self){
        const attr = self.getAttribute('clone');
        if(attr!==null){
            melonpan.Clone.template(self);
            self.removeAttribute('clone');
        }
    }

    static template(self){
        const template = document.querySelector('template#'+self.getAttribute('clone'));
        let clone = template.innerHTML;
        self.innerHTML = clone;
    }
}


melonpan.Data = class {
    constructor(self){
        const attr = self.getAttribute('data');
        if(attr!==null){
            const data = melonpan.Data.parse(attr);
            melonpan.Data.list( self, data);
        }
    }

    static parse(attribute){
        var data = [];
        var attr = attribute.replace(/(\s+)|(\t+)|(\r?\n)/g,"").split('#');
        attr = $.grep(attr, function(e){return e !== "";});

        attr.forEach(function(element){
            var el = element.split('=');
            data.push({'dst':el[0],'src':melonpan.Data.parseSrc(el[1])});
        });
        return data; 
    }

    static parseSrc(src){
        if(String(src).indexOf(',')>-1){
            return $.grep(src.split(','), function(e){return e !== "";});
        
        }else{
            if(String(src).indexOf('::')>-1){
                const split = src.split('::');
                const array = (0, eval)(split[0]);

                const property = split[1];
                var arr = [];
                array.forEach(function(element){
                    arr.push(element[property]);
                }); 
                return arr;
            }else{
                return (0, eval)(src);
            }
        }
    }

    static list(self, data){
        data.forEach(function(element){
            if(element.src.length>1){
                element.src.forEach(function(src){
                    var dom = self.cloneNode(true);
                    $(dom).html(dom.innerHTML.replace(new RegExp('{{'+element.dst+'}}', 'g'), src)).removeAttr('data').prop('outerHTML');
                    $(self).before(dom);
                });
                $(self).remove();
            }else{
                $(self).html(self.innerHTML.replace(new RegExp('{{'+element.dst+'}}', 'g'), element.src)).removeAttr('data').prop('outerHTML');
            }
        });
    }
}


melonpan.DataToFlex = class {
    constructor(self){
        const attr = self.getAttribute('data');
        if(attr!==null){
            const data = melonpan.Data.parse(attr);
            melonpan.DataToFlex.list( self, data);
        }
    }

    static list(self, data){
        data.forEach(function(element){
            if(element.src.length>1){
                element.src.forEach(function(src){
                    var dom = self.cloneNode(true);
                    $(dom).html(dom.innerHTML.replace(new RegExp('{{'+element.dst+'}}', 'g'), src)).removeAttr('data').prop('outerHTML');
                    $(self).before(dom);
                    $(dom).removeAttr('wait');
                    new melonpan.FlexOnlyEvent(dom);
                });
                $(self).remove();
            }else{
                $(self).html(self.innerHTML.replace(new RegExp('{{'+element.dst+'}}', 'g'), element.src)).removeAttr('data').prop('outerHTML');
            }
        });
    }
}


melonpan.Replace = class {
    constructor(self){
        const attr = self.getAttribute('replace');
        if(attr!==null){
            melonpan.Replace.exec(self, melonpan.Replace.parse(attr));
            self.removeAttribute('replace');
        }
    }

    static parse(attribute){
        var replace = [];

        var attr = attribute.split(';');
        attr = $.grep(attr, function(e){return e !== "";});

        attr.forEach(function(element){
            var el = element.split('->');
            replace.push({'src':el[0].replace(/(^\s+)|(\s+$)|(^\t+)|(\t+$)|(\r?\n)/g,""),
                       'dst':el[1].replace(/(^\s+)|(\s+$)|(^\t+)|(\t+$)|(\r?\n)/g,"")});
        });
        return replace;
    }

    static exec(self, replace){
        replace.forEach(function(element){
            self.setAttribute('flex', String(self.getAttribute('flex')).replace(new RegExp(element.src, 'g'), element.dst));
            self.innerHTML = self.innerHTML.replace(new RegExp(element.src, 'g'), element.dst);
        });
    }
}


melonpan.Use = class {
    constructor(self){
        const attr = self.getAttribute('use');
        if(attr!==null){
            melonpan.Use.expand(self,attr);
            self.removeAttribute('use');
        }
    }

    static expand(self,moduleId){
        for(var mod of melonpan.modules){
            if (mod.id === moduleId){
                const codeByUse = mod.code;
                const codeByFlex = self.getAttribute('flex')!==null ? self.getAttribute('flex') : '';
                self.setAttribute('flex', '@id='+ moduleId+ codeByUse + codeByFlex);
            };
        }
    }
}


melonpan.Flex = class {
    constructor(self){
        const attr = self.getAttribute('flex');
        if(attr!==null){
            melonpan.Flex.readModule(self,attr);
            self.removeAttribute('flex');
        }
    }

    static parseModule(str){
        var obj = {};
        var key,keyStart,keyEnd,value,valueEnd;
        while(true){
            keyStart = str.indexOf('@',0)+1;
            keyEnd = str.indexOf('=', keyStart);
            key = str.slice(keyStart,keyEnd).replace(/(^\s+)|(\s+$)|(^\t+)|(\t+$)|(\r?\n)/g,"");
            str = str.slice(keyEnd);
            valueEnd = str.indexOf('@',0);
            value = str.slice(1,valueEnd).replace(/(^\s+)|(\s+$)|(^\t+)|(\t+$)|(\r?\n)/g,"");
            str = str.slice(valueEnd);
            obj[key]=value;
            if(valueEnd<0) break;
        }
        return obj;
    }

    static parseSwitch(str){
        var obj = {};
        var key,keyStart,keyEnd,value,valueEnd;
        while(true){
            keyStart = str.indexOf('#',0)+1;
            keyEnd = str.indexOf(':', keyStart);
            key = str.slice(keyStart,keyEnd).replace(/(^\s+)|(\s+$)|(^\t+)|(\t+$)|(\r?\n)/g,"");
            str = str.slice(keyEnd);
            valueEnd = str.indexOf('#',0);
            value = str.slice(1,valueEnd).replace(/(^\s+)|(\s+$)|(^\t+)|(\t+$)|(\r?\n)/g,"");
            str = str.slice(valueEnd);
            if(valueEnd<0){
                obj[key]=value+';';
                break;
            }else{
                obj[key]=value;
            }
        }
        return obj;
    }

    static readModule(self,code){
        const mod = melonpan.Flex.parseModule(code);
        const className = 'c'+melonpan.Flex.uniqueStr();
        self.classList.add(className);
        melonpan.Flex.setCSS(self, mod, className);
        melonpan.Flex.setEvent(self, mod, className);
    }

    static uniqueStr(){
        const strong = 1000;
        return new Date().getTime().toString(16)  + Math.floor(strong*Math.random()).toString(16)
    }

    static setCSS(self,mod,className){
        const styleTag = document.getElementById('style-master');

        Object.keys(mod).forEach(function (key) {
            if(key == 'css'){
                const rule = document.createTextNode('.'+className + '{'+ mod[key]+ '}');
                styleTag.appendChild(rule);
            }
            if(key == 'cssHover'){
                const rule = document.createTextNode('.'+className + ':hover{'+ mod[key] + '}');
                styleTag.appendChild(rule);
            }
            if(key == 'cssFocus'){
                const rule = document.createTextNode('.'+className + ':focus{'+ mod[key] + '}');
                styleTag.appendChild(rule);
            }
            if(key == 'cssBefore'){
                const rule = document.createTextNode('.'+className + '::before{'+ mod[key] + '}');
                styleTag.appendChild(rule);
            }
            if(key == 'cssAfter'){
                const rule = document.createTextNode('.'+className + '::after{'+ mod[key] + '}');
                styleTag.appendChild(rule);
            }
            if(key.startsWith('media ')){
                const rule = document.createTextNode( '@' + key + '{' + '.' +className + '{'+ mod[key] + '}}');
                styleTag.appendChild(rule);
            }
            if(key.startsWith('keyframes ')){
                const animationName = key.replace('keyframes ','').replace(/(^\s+)|(\s+$)|(^\t+)|(\t+$)|(\r?\n)/g,"");
                const moduleId = mod.id.replace(/\s+/g,"") + '_';
                if(animationName.startsWith(moduleId)){
                    const rule = document.createTextNode( '@' + key + '{' + mod[key] + '}');
                    styleTag.appendChild(rule);
                }
            }
        });
    }

    static setEvent(self,mod,className){
        const selector = '"'+self.tagName+'.'+className+'"';
        if(typeof mod.id !== 'undefined'){
            const customMethodIndex = mod.id.replace(/\s+/g,"") + '_';
            for(var key in mod){
                if(key.substr(0,customMethodIndex.length) === customMethodIndex){
                    const code = mod[key].replace(/this/g,selector).replace(/%ARG\d/g,'arguments[$&]').replace(/%ARG/g,'');
                    if(typeof (0,eval)('window.'+key) === 'undefined'){
                        (0,eval)('window.'+key+'= function(){'+code+'}');
                    }else{
                        const func = ((0,eval)('window.'+key).toString()).replace('function(){','function(){'+code);
                        (0,eval)('window.'+key+ '='+func);
                    }
                }
            }
        }
        if(typeof mod.onload !== 'undefined'){
            $(document).ready(function(){
                (0,eval)(mod.onload.replace(/this/g,selector));
            });
        }
        if(typeof mod.class !== 'undefined'){
            self.classList.add(mod.class);
        }
        if(typeof mod.text !== 'undefined'){
            self.textContent = mod.text.replace(/(^\s+)|(\s+$)|(^\t+)|(\t+$)/g,"");
        }
        if(typeof mod.show !== 'undefined'){
            var observer = new MutationObserver(function(mutations){
                mutations.forEach(async function(mutation) {
                   if(mutation.oldValue.match('display: none;') && mutation.target.style.display !== "none"){
                        (0,eval)(mod.show);
                    }
                });
            });
            observer.observe(self, { attributes : true, attributeOldValue: true, attributeFilter : ['style'] });
        }
        if(typeof mod.hide !== 'undefined'){
            var observer = new MutationObserver(function(mutations){
                mutations.forEach(async function(mutation) {
                   if(!mutation.oldValue.match('display: none;') && mutation.target.style.display === "none"){
                         (0,eval)(mod.hide);
                    }
                });
            });
            observer.observe(self, { attributes : true, attributeOldValue: true, attributeFilter : ['style'] });
        }
        if(typeof mod.switch !== 'undefined'){
            const switchObj = melonpan.Flex.parseSwitch(mod.switch);
            const variable = melonpan.Flex.uniqueStr();
            (0,eval)('window.s'+variable+'=1;');
            self.addEventListener('click',async function(){
                const idx = (0,eval)('window.s'+variable);
                (0,eval)(switchObj[idx].replace(/this/g,selector));
                if(idx == Object.keys(switchObj).length){
                    (0,eval)('window.s'+variable+'=1;')
                }else{
                    (0,eval)('window.s'+variable+'+=1;');
                }
            });
        }

        melonpan.eventList.forEach(function(event){
            if(typeof mod[event] !== 'undefined'){
                self.addEventListener( event, async function(){
                    (0,eval)(mod[event].replace(/this/g,selector));
                });
            }
        });
    }
}


melonpan.FlexOnlyCSS = class {
    constructor(self){
        const attr = self.getAttribute('flex');
        if(attr!==null){
            melonpan.Flex.readModule(self,attr);
        }
    }

    static readModule(self,code){
        const mod = melonpan.Flex.parseModule(code);
        const className = 'c'+melonpan.Flex.uniqueStr();
        self.classList.add(className);
        melonpan.Flex.setCSS(self, mod, className);
    }
}


melonpan.FlexOnlyEvent = class {
    constructor(self){
        const attr = self.getAttribute('flex');
        if(attr!==null){
            melonpan.Flex.readModule(self,attr);
            self.removeAttribute('flex');
        }
    }

    static readModule(self,code){
        const mod = melonpan.Flex.parseModule(code);
        const className = 'c'+melonpan.Flex.uniqueStr();
        self.classList.add(className);
        melonpan.Flex.setEvent(self, mod, className);
    }
}


melonpan.Screen = class{
    constructor(){
        if(typeof melonpan.screen !== 'undefined'){
            melonpan.Screen.readProperty();

            $(window).on( "orientationchange resize", function () {
                if ( melonpan.resizeSaver  ) return ;
                melonpan.resizeSaver = setTimeout( function () {
                    melonpan.resizeSaver  = 0;
                    melonpan.Screen.readProperty();
                }, 500 ) ;
            });
        }
    }

    static readProperty(){
        for(var key in melonpan.screen){
            (0,eval)('window.'+key+'='+melonpan.screen[key]+'? true : false;');
        }

        melonpan.targetDOM.forEach(function(dom){
            $(dom).each(function(){
                const self = this;
                const screenProperty = self.getAttribute('screen');
                if(screenProperty!==null){
                    $(self).hide();
                    const screenPropertyArray = screenProperty.split(',');
                    screenPropertyArray.forEach(function(property){
                        const prop = property.replace(/(\s+)|(\t+)|(\r?\n)/g,"");
                        Object.keys(melonpan.screen).forEach(function(key) {
                            if(prop===key && (0,eval)(key)){
                                $(self).show('slow');
                            }
                        });
                    })
                }
            });
        });
    }
}


melonpan.Main = class {
    constructor(){
        melonpan.screen = {};
        melonpan.targetDOM = [];
        melonpan.eventList = [];
        melonpan.attributes = ['clone','use','data','wait','replace','flex','screen'];
        melonpan.resizeSaver = 0;
        melonpan.Main.init();
    }

    static async init(){
        await melonpan.Main.defineMethods();
        await melonpan.Main.readSetting();
        await melonpan.Main.createStyleTag();
        await melonpan.Main.generateDOM(melonpan.Clone);
        await melonpan.Main.generateDOM(melonpan.Use);
        await melonpan.Main.generateDOM(melonpan.Replace);
        await melonpan.Main.generateDOM(melonpan.Data);
        await melonpan.Main.generateDOM(melonpan.Flex);
        await new melonpan.Screen();
    }

    static defineMethods(){
        window.trigger = function(event){
            $(document).trigger(event);
        }

        $.prototype.swipe = function(direction,sensitivity,callback){
            const sens = sensitivity <= 0 ? 1 : sensitivity;
            switch(direction){
                case 'left':
                    $(this).on('touchstart', function (event) {
                        var position = event.originalEvent.changedTouches[0].pageX;
                        $(this).on('touchend',  function (event) {
                            $(this).off('touchend');
                            if (event.originalEvent.changedTouches[0].pageX < position - screen.width / sens){
                                callback();
                            }
                        });
                    });
                break;
                case 'right':
                    $(this).on('touchstart', function (event) {
                        var position = event.originalEvent.changedTouches[0].pageX;
                        $(this).on('touchend',  function (event) {
                            $(this).off('touchend');
                            if(event.originalEvent.changedTouches[0].pageX > position + screen.width / sens){
                                callback();
                            }
                        });
                    });
                break;
                case 'up':
                    $(this).on('touchstart', function (event) {
                        var position = event.originalEvent.changedTouches[0].pageY;
                        $(this).on('touchend',  function (event) {
                            $(this).off('touchend');
                            if(event.originalEvent.changedTouches[0].pageY < position - screen.height / sens){
                                callback();
                            }
                        });
                    });
                break;
                case 'down':
                    $(this).on('touchstart', function (event) {
                        var position = event.originalEvent.changedTouches[0].pageY;
                        $(this).on('touchend',  function (event) {
                            $(this).off('touchend');
                            if(event.originalEvent.changedTouches[0].pageY > position + screen.height / sens){
                                callback();
                            }
                        });
                    });
                break;
            }
        }; 

        window.sleep = (time) => {return new Promise(resolve => {setTimeout(() => {resolve()}, time)})};

        $.prototype.countup = async function(tick,timeout){
            const countMax = this.text().replace(/[^0-9.]/g, "");
            const unit = this.text().replace(/[0-9.]/g, "");
                 
            const time = timeout/tick;
            const step = countMax/tick;
                 
            var count = 0;
            while(count < countMax){
                  await sleep(time);
                  this.text(Math.floor(count*1000)/1000 + unit);
                  count += step;
            }
            this.text(countMax + unit);
        }
         $.prototype.countdown = async function(tick,timeout){
             const countMax = this.text().replace(/[^0-9.]/g, "");
             const unit = this.text().replace(/[0-9.]/g, "");
         
           　const time = timeout/tick;
             const step = countMax/tick;
         
             var count = countMax;
             while(count <= 0){
             　　 await sleep(time);
                  this.text(Math.floor(count*1000)/1000 + unit);
                  count -= step;
             }
             this.text(countMax + unit);
         }
    }

    static generateDOM(Class){
        melonpan.targetDOM.forEach(function(dom){
            $(dom).each(function(){
                const self = this;
                const wait = self.getAttribute('wait');
                if(wait!==null){
                    if(Class == melonpan.Data){
                        $(self).hide();
                        $(document).on(wait,function(){
                            $(self).show();
                            new melonpan.DataToFlex(self);
                        });
                    }else if(Class == melonpan.Flex){
                        new melonpan.FlexOnlyCSS(self);
                    }else{
                        new Class(self);
                    }
                }else{
                    new Class(self);
                }
            });
        });
    }

    static readSetting(){
        const setting = JSON.parse($.ajax({ url: 'setting.json', type: "GET", dataType: "text", async:false}).responseText);
        if(typeof setting['screen']!=='undefined'){
            melonpan.screen = setting['screen'];
            for(var key in melonpan.screen){
                (0,eval)('window.'+key+'='+setting['screen'][key]+'? true : false;');
            }
        }
        melonpan.targetDOM = [];
        if(typeof setting['dom']!=='undefined'){
            melonpan.targetDOM = setting['dom'].split(',');
        }
        melonpan.eventList = [];
        if(typeof setting['event']!=='undefined'){
            melonpan.eventList = setting['event'].split(',');
        }
    }

    static createStyleTag(){
        const style = document.createElement('style');
        style.id = 'style-master';  
        style.type = 'text/css';
        style.rel = 'stylesheet'; 
        const rule = document.createTextNode('html,body{height:100%;width:100%;margin:0;padding:0;}');
        const head = document.getElementsByTagName('head');
        style.appendChild(rule);
        head.item(0).appendChild(style);
    }
}


document.addEventListener('DOMContentLoaded', function(){
    new melonpan.Main();
}, false);

