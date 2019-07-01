'use strict';
var mlp = mlp || {}; mlp.modules = [];

class importFile extends HTMLElement {
    constructor() {
        super();
        const xhr = new XMLHttpRequest();
        xhr.open("GET", this.textContent , false); //true : async
        xhr.send(null);
        if (xhr.status == '200') {
            if(this.getAttribute('var')!==null && xhr.responseText!==''){
                const self = this;
                window.onload = function(){
                    if(self.getAttribute('json')!==null){
                        (0,eval)('window.'+self.getAttribute('var') +"='" + JSON.parse(xhr.responseText) +"';");
                    }else{
                        (0,eval)('window.'+self.getAttribute('var') +"='" + xhr.responseText +"';");
                    }
                    $(self).remove();
                }
            }
            else if(this.getAttribute('string')!==null && xhr.responseText!==''){
                const escapeHTML = function(string){
                    const map = {"&": "&amp;", "<":"&lt;", ">":"&gt;",'"':"&quot;"}
                    const pattern = Object.keys(map).join("|")
                    return string.replace(new RegExp(pattern, "g") , function(e){return map[e]})
                }
                this.outerHTML = escapeHTML(String(xhr.responseText));

            }else{
                this.outerHTML = xhr.responseText;
            }
        } else {
           console.log(this.textContent + ' is not found.');
        }
    }
}
customElements.define('import-file', importFile);


class flexModule extends HTMLElement {
    constructor() {
        super();
        if(this.getAttribute('id')!==null){
            mlp.modules.push( {'id':this.getAttribute('id'), 'code':this.innerHTML});
            (0,eval)('var '+this.getAttribute('id')+'='+this.getAttribute('id')+'||{};');
            $(this).remove();
        }
    }
}
customElements.define('flex-module', flexModule);


class preLoader extends HTMLElement {
    constructor() {
        super();
        const source = this.textContent;
        this.textContent = '';
        this.style = "position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:101;display:none;";
        this.style.background = "rgb(0,0,0)";
        if(source.match('.html')){
            const xhr = new XMLHttpRequest();
            xhr.open("GET", source , false); //true : async
            xhr.send(null);
            if (xhr.status == '200') {
                this.innerHTML = xhr.responseText;
            } else {
               console.log(source + ' is not found.');
            }
        }
        else if(source.match('.png')){
            const img = document.createElement('img');
            img.style = "position:fixed;top:0;left:0;bottom:0;right:0;margin:auto;";
            img.src = source;
            this.appendChild(img);
        }
        const loader = this;
        if(typeof loader.getAttribute('on')!=='undefined' && loader.getAttribute('on')==='load'){
            loader.style.display = 'block';
            setTimeout(function(){$(loader).fadeOut('slow');}, loader.getAttribute('timeout') || 2000);
        }
    }
}
customElements.define('pre-loader', preLoader);


mlp.Clone = class {
    constructor(self){
        const attr = self.getAttribute('clone');
        if(attr!==null){
            self.removeAttribute('clone');
            mlp.Clone.template(self,attr);
        }
    }

    static template(self,id){
        // let attrs = self.attributes;
        const template = document.querySelector('template#'+id);
        let clone = template.innerHTML.replace(/#CONTENT/g,self.innerHTML);
        self.innerHTML = clone;
        // for (var i = 0, len = attrs.length; i < len; i++) {
        //     self.children[0].setAttribute(attrs[i].name,attrs[i].value);
        // }
    }
}


mlp.For = class {
    constructor(self){
        const attr = self.getAttribute('for');
        if(attr!==null){
            const data = mlp.For.parse(attr);
            mlp.For.expand(self, data);
        }else if(attr===null && !self.outerHTML.match('#') &&  
                typeof self.getAttribute('wait')==='undefined' &&
                typeof self.getAttribute('on')==='undefined' &&
                typeof self.getAttribute('interval')==='undefined'){
            self.outerHTML = mlp.For.parseScript(String(self.outerHTML));
        }
    }

    static parse(attribute){
        var data = [];
        var attr = attribute.replace(/(\s+)|(\t+)|(\r?\n)/g,"").split(';');
        attr = $.grep(attr, function(e){return e !== "";});

        attr.forEach(function(element){
            var el = element.split(':');
            data.push({'dst':el[0],'src':mlp.For.parseSrc(el[1])});
        });
        return data;
    }

    static parseSrc(src){
        if(src.match(',') && !src.match('->') && !src.match('/')){
            return $.grep(src.split(','), function(e){return e !== "";});
        }
        else if(!src.match(',') && src.match('->')){
            const a = src.split('->');
            const start = parseInt(a[0]);
            let end = parseInt(a[1]);
            let step = 1;
            if(src.match('/')){
                const b = a[1].split('/');
                end = parseInt(b[0]);
                step = parseInt(b[1]);
            }
            var arr = [];
            if(start < end){
                var count = start;
                while(count<=end){
                    arr.push(count);
                    count += step;
                }
                return arr;
            }else if(end < start){
                var count = start;
                while(count>=end){
                    arr.push(count);
                    count -= step;
                }
                return arr;
            }
        }
        else if(!src.match(',') && !src.match('->') && !src.match('/')){
            return src.replace(/(^\s+)|(\s+$)|(^\t+)|(\t+$)|(\r?\n)/g,"");
        }
    }

    static expand(self, data){
        var master = String(self.outerHTML);
        data.forEach(function(element){
            var fragment = '';
            var array = (0,eval)(element.src);
            if(array instanceof Array){
                array.forEach(function(src,i){
                    if( master.match('::') && !(element.src instanceof Array)){
                        fragment += master.replace(new RegExp( '#'+element.dst+'::', 'g'), element.src+'['+i+'].');
                    }
                    else if( !master.match('::') && !(element.src instanceof Array)){
                        fragment += master.replace(new RegExp( '#'+element.dst, 'g'), element.src+'['+i+']');
                    }
                    else if( !master.match('::') && element.src instanceof Array){
                        fragment += master.replace(new RegExp( '#'+element.dst, 'g'), element.src[i]);
                    }
                });
            }else{
                fragment += master.replace(new RegExp( '#'+element.dst, 'g'), element.src);
            }
            master = fragment;
        });
        master = mlp.For.readScript(master.unescapeHTML());
        $(self).after($(master));
        $(self).hide();
    }
    
    static readScript(text){
        if( text.match('{{') && text.match('}}')){
            return  mlp.For.parseScript(text);
        }else{
            return text;
        }
    }

    static parseScript(string){
        var str = string;
        var after = '';

        while(true){
            const scriptStart = str.indexOf('{{',0);  if(scriptStart<0){after = after+str; break};
            const scriptEnd = str.indexOf('}}', scriptStart);
            const text = str.slice(0,scriptStart);
            const script = str.slice(scriptStart+2,scriptEnd).replace(/(^\s+)|(\s+$)|(^\t+)|(\t+$)|(\r?\n)/g,"");
            str = str.slice(scriptEnd+2);
            after += text + String((0,eval)(script));
        }
        return after;
    }
}


mlp.ForAfterWait = class {
    constructor(self,wait){
        const attr = self.getAttribute('for');
        if(attr!==null){
            const data = mlp.For.parse(attr);
            mlp.ForAfterWait.expand(self, data, wait);
        }else{
            mlp.ForAfterWait.clone(self, wait);
        }
    }

    static expand(self, data, wait){
        var clone = self.cloneNode(true);
        clone.removeAttribute('wait');
        var master = String(clone.outerHTML);
        clone.remove();

        data.forEach(function(element){
            var fragment = '';
            var array = (0,eval)(element.src);
            if(array instanceof Array){
                array.forEach(function(src,i){
                    if( master.match('::') && !(element.src instanceof Array)){
                        fragment += master.replace(new RegExp( '#'+element.dst+'::', 'g'), element.src+'['+i+'].');
                    }
                    else if( !master.match('::') && !(element.src instanceof Array)){
                        fragment += master.replace(new RegExp( '#'+element.dst, 'g'), element.src+'['+i+']');
                    }
                    else if( !master.match('::') && element.src instanceof Array){
                        fragment += master.replace(new RegExp( '#'+element.dst, 'g'), element.src[i]);
                    }
                });
            }else{
                fragment += master.replace(new RegExp( '#'+element.dst, 'g'), element.src);
            }
            master = fragment;
        });

        master = mlp.For.readScript(master.unescapeHTML());
        const $dom = $(master).attr('afterwait',wait);
        $(self).after($dom);
        $(self).hide();
        $dom.show();
        $dom.each(function(){
            new mlp.FlexOnlyEvent($dom.get(0)); 
            new mlp.Replace(this);
        });
    }

    static clone(self, wait){
        var clone = self.cloneNode(true);
        clone.removeAttribute('wait');
        var master = String(clone.outerHTML);
        clone.remove();
        master = mlp.For.readScript(master.unescapeHTML());
        var $dom = $(master).attr('afterwait',wait);
        $(self).after($dom);
        $(self).hide();
        $dom.show();
        $dom.each(function(){
            new mlp.FlexOnlyEvent(this);
            new mlp.Replace(this);
        });
    }
}

mlp.ForOnTrigger= class {
    constructor(self,on){
        const attr = self.getAttribute('for');
        if(attr!==null){
            const data = mlp.For.parse(attr);
            mlp.ForOnTrigger.expand(self, data, on);
        }else{
            mlp.ForOnTrigger.clone(self, on);
        }
    }

    static expand(self, data, on){
        var clone = self.cloneNode(true);
        clone.removeAttribute('on');
        var master = String(clone.outerHTML);
        clone.remove();

        data.forEach(function(element){
            var fragment = '';
            var array = (0,eval)(element.src);
            if(array instanceof Array){
                array.forEach(function(src,i){
                    if( master.match('::') && !(element.src instanceof Array)){
                        fragment += master.replace(new RegExp( '#'+element.dst+'::', 'g'), element.src+'['+i+'].');
                    }
                    else if( !master.match('::') && !(element.src instanceof Array)){
                        fragment += master.replace(new RegExp( '#'+element.dst, 'g'), element.src+'['+i+']');
                    }
                    else if( !master.match('::') && element.src instanceof Array){
                        fragment += master.replace(new RegExp( '#'+element.dst, 'g'), element.src[i]);
                    }
                });
            }else{
                fragment += master.replace(new RegExp( '#'+element.dst, 'g'), element.src);
            }
            master = fragment;
        });

        master = mlp.For.readScript(master.unescapeHTML());
        const $dom = $(master).attr('ontrigger',on);
        $(self).after($dom);
        $(self).hide();
        $dom.show();
        $dom.each(function(){
            new mlp.FlexOnlyEvent($dom.get(0)); 
            new mlp.Replace(this);
        });
    }

    static clone(self, on){
        var clone = self.cloneNode(true);
        clone.removeAttribute('on');
        var master = String(clone.outerHTML);
        clone.remove();
        master = mlp.For.readScript(master.unescapeHTML());
        var $dom = $(master).attr('ontrigger',on);
        $(self).after($dom);
        $(self).hide();
        $dom.show();
        $dom.each(function(){
            new mlp.FlexOnlyEvent(this);
            new mlp.Replace(this);
        });
    }
}


mlp.ForAtInterval = class {
    constructor(self,interval){
        const attr = self.getAttribute('for');
        if(attr!==null){
            const data = mlp.For.parse(attr);
            mlp.ForAtInterval.expand(self, data, interval);
        }else{
            mlp.ForAtInterval.clone(self, interval);
        }
        
    }

    static expand(self, data, interval){
        var clone = self.cloneNode(true);
        clone.removeAttribute('interval');
        var master = String(clone.outerHTML);
        clone.remove();
       
        data.forEach(function(element){
            var fragment = '';
            var array = (0,eval)(element.src);
            if(array instanceof Array){
                array.forEach(function(src,i){
                    if( master.match('::') && !(element.src instanceof Array)){
                        fragment += master.replace(new RegExp( '#'+element.dst+'::', 'g'), element.src+'['+i+'].');
                    }
                    else if( !master.match('::') && !(element.src instanceof Array)){
                        fragment += master.replace(new RegExp( '#'+element.dst, 'g'), element.src+'['+i+']');
                    }
                    else if( !master.match('::') && element.src instanceof Array){
                        fragment += master.replace(new RegExp( '#'+element.dst, 'g'), element.src[i]);
                    }
                });
            }else{
                fragment += master.replace(new RegExp( '#'+element.dst, 'g'), element.src);
            }
            master = fragment;
        });

        master = mlp.For.readScript(master.unescapeHTML());
        const $dom = $(master).attr('atinterval', interval);
        $(self).after($dom);
        $(self).hide();
        $dom.show();
        $dom.each(function(){
            new mlp.FlexOnlyEvent(this);
            new mlp.Replace(this);
        });
    }

    static clone(self, interval){
        var clone = self.cloneNode(true);
        clone.removeAttribute('interval');
        var master = String(clone.outerHTML);
        clone.remove();
        master = mlp.For.readScript(master.unescapeHTML());
        var $dom = $(master).attr('atinterval', interval);
        $(self).after($dom);
        $(self).hide();
        $dom.show();
        $dom.each(function(){
            new mlp.FlexOnlyEvent(this);
            new mlp.Replace(this);
        });
    }
}


mlp.Replace = class {
    constructor(self){
        const attr = self.getAttribute('replace');
        if(attr!==null){
            mlp.Replace.execute(self, mlp.Replace.parse(attr));
            self.removeAttribute('replace');
        }
    }

    static parse(attribute){
        var replace = [];

        var attr = attribute.split('|');
        attr = $.grep(attr, function(e){return e !== "";});

        attr.forEach(function(element){
            var el = element.split('=>');
            replace.push({'src':el[0].replace(/(^\s+)|(\s+$)|(^\t+)|(\t+$)|(\r?\n)/g,""),
                       'dst':el[1].replace(/(^\s+)|(\s+$)|(^\t+)|(\t+$)|(\r?\n)/g,"")});
        });
        return replace;
    }

    static execute(self, replace){
        replace.forEach(function(element){
            self.setAttribute('flex', String(self.getAttribute('flex')).replace(new RegExp(element.src, 'g'), element.dst));
            self.innerHTML = self.innerHTML.replace(new RegExp(element.src, 'g'), element.dst);
        });
    }
}


mlp.Use = class {
    constructor(self){
        const attr = self.getAttribute('use');
        if(attr!==null){
            mlp.Use.expand(self,attr);
            self.removeAttribute('use');
        }
    }

    static expand(self,moduleId){
        for(var mod of mlp.modules){
            if (mod.id === moduleId){
                const codeByUse = mod.code;
                const codeByFlex = self.getAttribute('flex')!==null ? self.getAttribute('flex') : '';
                self.classList.add(moduleId);
                self.setAttribute('flex', '@id='+ moduleId+ codeByUse + codeByFlex);
            };
        }
    }
}


mlp.Flex = class {
    constructor(self){
        const attr = self.getAttribute('flex');
        if(attr!==null){
            mlp.Flex.readModule(self,attr);
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
        const mod = mlp.Flex.parseModule(code);
        const className = 'c'+ mlp.uniqueStr();
        self.classList.add(className);
        mlp.Flex.setCSS(self, mod, className);
        mlp.Flex.setEvent(self, mod, className);
    }

    static setCSS(self,mod,className){
        const styleTag = document.getElementById('mlp-style-master');

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
                // const moduleId = mod.id.replace(/\s+/g,"") + '_';
                // if(animationName.startsWith(moduleId)){
                    if(!mlp.animationList.includes(animationName)){
                        const rule = document.createTextNode( '@' + key + '{' + mod[key] + '}');
                        styleTag.appendChild(rule);
                        mlp.animationList.push(animationName);
                    }
                // }
            }
        });
    }

    static setEvent(self,mod,className){
        const selector = '"'+self.tagName+'.'+className+'"';

        Object.keys(mod).forEach(function (key) {
            if(key === 'class'){
                const classes = mod[key].split(',');
                classes.forEach(function(cls){
                    self.classList.add(cls);
                });
            }
            if(key === 'text'){
                self.textContent = mod[key].replace(/(^\s+)|(\s+$)|(^\t+)|(\t+$)/g,"");
            }
            if(key === 'script'){
                if(mod[key].match('SELF')){
                    const script = document.createElement('script');
                    script.id = 'script_'+mod.id+'_'+className;
                    script.innerHTML = mod[key].replace(/SELF/g,selector).unescapeHTML();
                    document.querySelector('body').appendChild(script);
                }else{
                    if(document.getElementById('script_'+mod.id) === null){
                        const script = document.createElement('script');
                        script.id = 'script_'+mod.id;
                        script.innerHTML = mod.script.replace(/SELF/g,selector).unescapeHTML();
                        document.querySelector('body').appendChild(script);
                    }
                }
            }
            if(key.startsWith(mod.id+'_')){
                if(mod[key].match('SELF')){
                    if(typeof (0,eval)('window.'+key) === 'undefined'){
                        (0,eval)('window.'+key+'= function(){' + mod[key].replace(/SELF/g,selector).replace(/#ARG\d/g,'arguments[$&]').replace(/#ARG/g,'').unescapeHTML() +'}');
                    }else{
                        const func = ((0,eval)('window.'+key).toString()).replace('function(){','function(){'+ mod[key].replace(/SELF/g,selector).replace(/#ARG\d/g,'arguments[$&]').replace(/#ARG/g,''));
                        (0,eval)('window.'+key+ '='+func);
                    }
                }else{
                    if(typeof (0,eval)('window.'+key) === 'undefined'){
                        (0,eval)('window.'+key+'= function(){' + mod[key].replace(/SELF/g,selector).replace(/#ARG\d/g,'arguments[$&]').replace(/#ARG/g,'').unescapeHTML() +'}');
                    }
                }
            }
            if(key === 'show'){
                var observer = new MutationObserver(function(mutations){
                    mutations.forEach(async function(mutation) {
                       if(mutation.oldValue.match('display: none;') && mutation.target.style.display !== "none"){
                            (0,eval)(mod[key].replace(/SELF/g,selector).unescapeHTML());
                        }
                    });
                });
                observer.observe(self, { attributes : true, attributeOldValue: true, attributeFilter : ['style'] });
            }
            if(key === 'hide'){
                var observer = new MutationObserver(function(mutations){
                    mutations.forEach(async function(mutation) {
                       if(!mutation.oldValue.match('display: none;') && mutation.target.style.display === "none"){
                             (0,eval)(mod[key].replace(/SELF/g,selector).unescapeHTML());
                        }
                    });
                });
                observer.observe(self, { attributes : true, attributeOldValue: true, attributeFilter : ['style'] });
            }
            if(key === 'switch'){
                const switchObj = mlp.Flex.parseSwitch(mod[key]);
                const variable = mlp.uniqueStr();
                (0,eval)('window.s'+variable+'=1;');
                self.addEventListener('click',async function(){
                    const idx = (0,eval)('window.s'+variable);
                    (0,eval)(switchObj[idx].replace(/SELF/g,selector).unescapeHTML());
                    if(idx == Object.keys(switchObj).length){
                        (0,eval)('window.s'+variable+'=1;')
                    }else{
                        (0,eval)('window.s'+variable+'+=1;');
                    }
                });
            }
            if(key.startsWith('hold ')){
                const holdtime = key.replace('hold ','').replace(/(^\s+)|(\s+$)|(^\t+)|(\t+$)|(\r?\n)/g,"");
                self.hold(function(){
                    (0,eval)(mod[key].replace(/SELF/g, selector).unescapeHTML());
                },holdtime);
            }
            if(key.startsWith('swipe ')){
                const direction = key.replace('swipe ','').replace(/(^\s+)|(\s+$)|(^\t+)|(\t+$)|(\r?\n)/g,"");
                self.swipe(direction,function(){
                    (0,eval)(mod[key].replace(/SELF/g, selector).unescapeHTML());
                });
            }
            if(key === 'inview'){
                self.inview(function(e){
                    (0,eval)(mod[key].replace(/SELF/g, selector).unescapeHTML());
                },null);
            }
            if(key === 'outview'){
                self.inview(null,function(e){
                    (0,eval)(mod[key].replace(/SELF/g, selector).unescapeHTML());
                });
            }
            if(key === 'onload'){
                $(document).ready(function(){
                    (0,eval)(mod[key].replace(/SELF/g,selector).unescapeHTML());
                });
            }
            if(key.startsWith('interval')){
                const interval = key.replace('interval ','').replace(/(^\s+)|(\s+$)|(^\t+)|(\t+$)|(\r?\n)/g,"");
                setInterval(function(){
                    (0,eval)(mod[key].replace(/SELF/g, selector).unescapeHTML());
                }, Number(interval) || 1000);
            }
        });

        mlp.eventList.forEach(function(event){
            if(typeof mod[event] !== 'undefined'){
                self.addEventListener( event, async function(){
                    (0,eval)(mod[event].replace(/SELF/g,selector).unescapeHTML());
                });
            }
        });
    }
}


mlp.FlexOnlyCSS = class {
    constructor(self){
        const attr = self.getAttribute('flex');
        if(attr!==null){
            mlp.Flex.readModule(self,attr);
        }
    }

    static readModule(self,code){
        const mod = mlp.Flex.parseModule(code);
        const className = 'c'+ mlp.uniqueStr();
        self.classList.add(className);
        mlp.Flex.setCSS(self, mod, className);
    }
}


mlp.FlexOnlyEvent = class {
    constructor(self){
        const attr = self.getAttribute('flex');
        if(attr!==null){
            mlp.Flex.readModule(self,attr);
            self.removeAttribute('flex');
        }
    }

    static readModule(self,code){
        const mod = mlp.Flex.parseModule(code);
        const className = 'c'+ mlp.uniqueStr();
        self.classList.add(className);
        mlp.Flex.setEvent(self, mod, className);
    }
}


mlp.Screen = class{
    constructor(){
        if(typeof mlp.screen !== 'undefined'){
            mlp.Screen.readProperty();

            $(window).on( "orientationchange resize", function () {
                if ( mlp.resizeSaver  ) return ;
                mlp.resizeSaver = setTimeout( function () {
                    mlp.resizeSaver  = 0;
                    mlp.Screen.readProperty();
                }, 500 ) ;
            });
        }
    }

    static readProperty(){
        for(var key in mlp.screen){
            (0,eval)('window.'+key+'='+mlp.screen[key]+'? true : false;');
        }

        mlp.targetDOM.forEach(function(dom){
            $(dom).each(function(){
                const self = this;
                const screenProperty = self.getAttribute('screen');
                if(screenProperty!==null){
                    $(self).hide();
                    const screenPropertyArray = screenProperty.split(',');
                    screenPropertyArray.forEach(function(property){
                        const prop = property.replace(/(\s+)|(\t+)|(\r?\n)/g,"");
                        Object.keys(mlp.screen).forEach(function(key) {
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


mlp.Main = class {
    constructor(){
        mlp.screen = {};
        mlp.targetDOM = [];
        mlp.eventList = [];
        mlp.animationList=[];
        mlp.afterWait = [];
        mlp.onTrigger = [];
        mlp.atInterval = [];
        mlp.attributes = ['clone','use','for','replace','flex','on','wait','interval','screen'];
        mlp.resizeSaver = 0;
        mlp.Main.init();
    }

    static async init(){
        await mlp.Main.readSetting();
        await mlp.Main.defineMethods();
        await mlp.Main.createStyleTag();
        await mlp.Main.generateDOM(mlp.Clone);
        await mlp.Main.generateDOM(mlp.Use);
        await mlp.Main.generateDOM(mlp.For);
        await mlp.Main.generateDOM(mlp.Replace);
        await mlp.Main.generateDOM(mlp.Flex);
        await mlp.Main.afterWait();
        await mlp.Main.onTrigger();
        await mlp.Main.atInterval();
        await new mlp.Screen();
    }

    static defineMethods(){
        mlp.on = function(event){
            $(document).trigger(event);
        }

        mlp.loader = function(id){
            $('pre-loader').each(function(){
                const self = this;
                if(typeof self.getAttribute('on')!=='undefined' && self.getAttribute('on')!=='load'  && self.getAttribute('on')===id){
                    self.style.display = 'block';
                    setTimeout(function(){$(self).fadeOut('slow');}, self.getAttribute('timeout') || 2000);
                }
            });
        }

        mlp.uniqueStr = function(){
            const strong = 1000;
            return new Date().getTime().toString(16)  + Math.floor(strong*Math.random()).toString(16)
        }
        
        String.prototype.unescapeHTML = function(){
            const map = {"&amp;": "&", "&lt;":"<", "&gt;":">","&quot;":'"'}
            const pattern = Object.keys(map).join("|")
            return this.replace(new RegExp(pattern, "g") , function(e){return map[e]})
        }

        String.prototype.escapeHTML = function(){
            const map = {"&": "&amp;", "<":"&lt;", ">":"&gt;",'"':"&quot;"}
            const pattern = Object.keys(map).join("|")
            return this.replace(new RegExp(pattern, "g") , function(e){return map[e]})
        }

        HTMLElement.prototype.childText = function(){
            var text = "";
            for (var i = 0; i < this.childNodes.length; i++) {
                if (this.childNodes[i].toString() == '[object Text]'){
                    text += this.childNodes[i].data;
                }
            }
            return text;
        }

        HTMLElement.prototype.inview = function(callbackInView, callbackOutView){
            const options = {
                root: null,  
                rootMargin: '0%', 
                threshold: [1] 
            };
            const observer = new IntersectionObserver((entries) => {
               for(const e of entries) {
                   if(e.isIntersecting && Object.prototype.toString.call(callbackInView) === '[object Function]'){
                        callbackInView(e);
                   }
                   else if(!e.isIntersecting && Object.prototype.toString.call(callbackOutView) === '[object Function]'){
                        callbackOutView(e);
                   }
               }
            },options);
            observer.observe(this);
        }

        HTMLElement.prototype.hold = function(callback,holdtime){
            this.addEventListener('touchstart', function (event) {
                event.preventDefault();
                callback();
                let time = 0;
                let interval = setInterval(function(){
                    time += 100;
                    if(time > holdtime){
                        callback();
                    }
                },100);
                this.addEventListener('touchend', function (event) {
                    event.preventDefault();
                    clearInterval(interval);
                });
            });
        }

        HTMLElement.prototype.swipe = function(direction,callback,sensitivity){
            const self = this;
            const sens =  Object.prototype.toString.call(sensitivity)!=='[object Number]' || sensitivity <= 0 ? 5 : sensitivity;
            switch(direction){
              case 'left':
                self.addEventListener('touchstart', function (event) {
                  self.removeEventListener("touchstart",null,false);
                  var position = event.changedTouches[0].pageX;
                  self.addEventListener('touchend', function (event) {
                    self.removeEventListener("touchend",null,false);
                    if (event.changedTouches[0].pageX < position - screen.width / sens){
                       callback(self);
                    }
                    position = 0;
                  });
                },false);
                break;
              case 'right':
                self.addEventListener('touchstart', function (event) {
                  self.removeEventListener("touchstart",null,false);  
                  var position = event.changedTouches[0].pageX;
                  self.addEventListener('touchend', function (event) {
                    self.removeEventListener("touchend",null,false);  
                    if(event.changedTouches[0].pageX > position + screen.width / sens){
                       callback(self);
                    }
                    position = screen.width;
                  });
                },false);
                break;
              case 'up':
                self.addEventListener('touchstart', function (event) {
                  self.removeEventListener("touchstart",null,false);  
                  var position = event.changedTouches[0].pageY;
                  self.addEventListener('touchend', function (event) {
                    self.removeEventListener("touchend",null,false); 
                    if(event.changedTouches[0].pageY < position - screen.height / sens){
                       callback(self);
                    }
                    position = 0;
                  });
                },false);
                break;
              case 'down':
                self.addEventListener('touchstart', function (event) {
                  self.removeEventListener("touchstart",null,false);  
                  var position = event.changedTouches[0].pageY;
                  self.addEventListener('touchend', function (event) {
                    self.removeEventListener("touchend",null,false); 
                    if(event.changedTouches[0].pageY > position + screen.height / sens){
                       callback(self);
                    }
                    position = screen.height;
                  });
                },false);
                break;
            }
          }
    }

    static generateDOM(Class){
        mlp.targetDOM.forEach(function(dom){
            $(dom).each(function(){
                const self = this;
                const wait = self.getAttribute('wait');
                const on = self.getAttribute('on');
                const interval = self.getAttribute('interval');
                if(wait!==null && on===null && interval===null){
                    if(Class === mlp.For){
                        $(self).hide();
                        if(!mlp.afterWait.includes(wait)){
                            mlp.afterWait.push(wait);
                        }
                    }else if(Class === mlp.Replace){
                        return false;

                    }else if(Class === mlp.Flex){
                        new mlp.FlexOnlyCSS(self);

                    }else{
                        new Class(self);
                    }
                }else if(wait===null && on!==null && interval===null){
                    if(Class === mlp.For){
                        $(self).hide();
                        if(!mlp.onTrigger.includes(on)){
                            mlp.onTrigger.push(on);
                        }
                    }else if(Class === mlp.Replace){
                        return false;

                    }else if(Class === mlp.Flex){
                        new mlp.FlexOnlyCSS(self);

                    }else{
                        new Class(self);
                    }
                }else if(wait===null && on===null && interval!==null){
                    if(Class === mlp.For){
                        $(self).hide();
                        if(!mlp.atInterval.includes(interval)){
                            mlp.atInterval.push(interval);
                        }
                    }else if(Class === mlp.Replace){
                        return false;

                    }else if(Class === mlp.Flex){
                        new mlp.FlexOnlyCSS(self);

                    }else{
                        new Class(self);
                    }
                }else{
                    new Class(self);
                }
            });
        });
    }

    static afterWait(){
        mlp.afterWait.forEach(function(variable){
            Object.defineProperty(window, variable, {
                val: undefined,
                get: function() { return this.val; },
                set: function (x) {
                    this.val = x;
                    $('[afterwait='+variable+']').off();
                    $('[afterwait='+variable+']').remove();
                    mlp.targetDOM.forEach(function(dom){
                        $(dom).each(function(){
                            const self = this;
                            if(self.getAttribute('wait')===variable){
                                new mlp.ForAfterWait(self,variable);
                            }
                        });
                    });
                },
                configurable: true,
            });
        });
    }

    static onTrigger(){
        mlp.onTrigger.forEach(function(on){
            $(document).on(on,function(){
                $('[ontrigger='+on+']').off();
                $('[ontrigger='+on+']').remove();
                mlp.targetDOM.forEach(function(dom){
                    $(dom).each(function(){
                        const self = this;
                        if(self.getAttribute('on')===on){
                            new mlp.ForOnTrigger(self,on);
                        }
                    });
                });
            });
        });
        mlp.on('load');
    }

    static atInterval(){
        mlp.atInterval.forEach(function(interval){
            setInterval(function(){
                $('[atinterval='+interval+']').off();
                $('[atinterval='+interval+']').remove();
                mlp.targetDOM.forEach(function(dom){
                    $(dom).each(function(){
                        const self = this;
                        if(self.getAttribute('wait')===null && self.getAttribute('interval')===interval){
                            new mlp.ForAtInterval(self,interval);
                        }
                    });
                });
            },interval);
        });
    }

    static readSetting(){
        const setting = JSON.parse($.ajax({ url: 'mlp.json', type: "GET", dataType: "text", async:false}).responseText);
        if(typeof setting['screen']!=='undefined'){
            mlp.screen = setting['screen'];
            for(var key in mlp.screen){
                (0,eval)('window.'+key+'='+setting['screen'][key]+'? true : false;');
            }
        }
        mlp.targetDOM = [];
        if(typeof setting['dom']!=='undefined'){
            mlp.targetDOM = setting['dom'].split(',');
        }
        mlp.eventList = [];
        if(typeof setting['event']!=='undefined'){
            mlp.eventList = setting['event'].split(',');
        }
        if(typeof setting['loading']!=='undefined'){
            mlp.loading = setting['loading'];
        }
    }

    static createStyleTag(){
        const style = document.createElement('style');
        style.id = 'mlp-style-master';  
        style.type = 'text/css';
        style.rel = 'stylesheet'; 
        //const rule = document.createTextNode('html,body{height:100%;width:100%;margin:0;padding:0;}');
        const head = document.getElementsByTagName('head');
        //style.appendChild(rule);
        head.item(0).appendChild(style);
    }
}

mlp.init = function(){
    const body = document.getElementsByTagName('body');
    body.item(0).style.display = 'none';
    document.addEventListener('DOMContentLoaded', function(){
        body.item(0).style.display = 'block';
        // $(body.item(0)).fadeIn(1000);
        new mlp.Main();
    }, false);
}
mlp.init();