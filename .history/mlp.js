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

class jsModule extends HTMLElement {
    constructor() {
        super();
        this.outerHTML = '<script type="text/javascript">'+(0,eval)(this.textContent)+'</script>';
    }
}
customElements.define('js-module', jsModule);

 
class Clone{
    constructor(){
        this.attrs = [];
        melonpan.targetDOM.forEach(function(dom){
            $(dom).each(function(idx){
                const attr = this.getAttribute('clone');
                if(attr!==null){
                    Clone.template(this,idx);
                    this.removeAttribute('clone');
                }
           });
        });
    }

    static template(self,idx){
        const template = document.querySelector('template#'+self.getAttribute('clone'));
        let clone = template.innerHTML;
        self.innerHTML = clone;
    }
}


class Data{
    constructor(){
        melonpan.targetDOM.forEach(function(dom){
            $(dom).each(function(idx){
                const attr = this.getAttribute('data');
                if(attr!==null){
                    const data = Data.parse(attr);
                    Data.list( this, data);
                }
            });
        });
    }

    static parse(attribute){
        var data = [];
        var attr = attribute.replace(/(\s+)|(\t+)|(\r?\n)/g,"").split('#');
        attr = $.grep(attr, function(e){return e !== "";});

        attr.forEach(function(element){
            var el = element.split('=');
            data.push({'dst':el[0],'src':Data.parseSrc(el[1])});
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
            element.src.forEach(function(src){
                var dom = self.cloneNode(true);
                $(dom).html(dom.innerHTML.replace(new RegExp('{{'+element.dst+'}}', 'g'), src)).removeAttr('data').prop('outerHTML');
                $(self).before(dom);
            });
        });
        $(self).remove();
    }
}


class Replace{
    constructor(){
        melonpan.targetDOM.forEach(function(dom){
            $(dom).each(function(idx){
                const attr = this.getAttribute('replace');
                if(attr!==null){
                    Replace.exec(this, Replace.parse(attr));
                    this.removeAttribute('replace');
                }
            });
        });
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
            self.innerHTML = self.innerHTML.replace(new RegExp(element.src, 'g'), element.dst);
        });
    }
}


class Use{
    constructor(){
        melonpan.targetDOM.forEach(function(dom){
            $(dom).each(function(idx){
                const attr = this.getAttribute('use');
                if(attr!==null){
                    Use.expand(this,attr);
                    this.removeAttribute('use');
                }
            });
        });
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


class Flex{
    constructor(){
        melonpan.targetDOM.forEach(function(dom){
            $(dom).each(function(idx){
                const attr = this.getAttribute('flex');
                if(attr!==null){
                    Flex.readModule(this,attr,idx);
                    this.removeAttribute('flex');
                }
            });
        })
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

    static readModule(self,code,idx){
        const mod = Flex.parseModule(code);
        Flex.setCSS(self, mod);
        Flex.setEvent(self, mod, idx);
    }

    static uniqueStr(){
        const strong = 1000;
        return new Date().getTime().toString(16)  + Math.floor(strong*Math.random()).toString(16)
    }

    static setCSS(self,mod){
        const className = 'c'+Flex.uniqueStr();
        const styleTag = document.getElementById('style-master');
        self.classList.add(className);

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

    static setEvent(self,mod,idx){
        const selector = '"'+self.tagName+':eq('+idx+')"';
        if(typeof mod.id !== 'undefined'){
            const customMethodIndex = mod.id.replace(/\s+/g,"") + '_';
            for(var key in mod){
                if(key.substr(0,customMethodIndex.length) === customMethodIndex){
                    const code = mod[key].replace(/this/g,selector).replace(/%ARG\d/g,'arguments[$&]').replace(/%ARG/g,'');
                    if(typeof (0,eval)('window.'+key) === 'undefined'){
                        (0,eval)('window.'+key+'=function(){'+code+'}');
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
        melonpan.eventList.forEach(function(event){
            if(typeof mod[event] !== 'undefined'){
                self.addEventListener( event ,function(){
                    (0,eval)(mod[event].replace(/this/g,selector));
                });
            }
        });
    }
}


class Main {
    constructor(){
        Main.init();
    }

    static async init(){
        await Main.readSetting();
        await Main.createStyleTag();
        await new Clone();
        await new Use();
        await new Replace();
        await new Data();
        await new Flex();
    }

    static readSetting(){
        const setting = JSON.parse($.ajax({ url: 'setting.json', type: "GET", dataType: "text", async:false}).responseText);
        if(typeof setting['screen']!=='undefined'){
            for(var key in setting['screen']){
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
    new Main();
}, false);
