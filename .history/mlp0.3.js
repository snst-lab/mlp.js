'use strict';
var melonpan = melonpan || {};

melonpan.modules = [];
melonpan.targetDOM = ['div','input','svg'];

document.addEventListener('DOMContentLoaded', function(){
    Clone.init();
    Use.init();
    Replace.init();
    Data.init();
    Flex.init();
}, false);


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

class importJS extends HTMLElement {
    constructor() {
        super();
        this.outerHTML = '<script type="text/javascript" src="'+this.textContent+'"></script>';
    }
}
customElements.define('import-js', importJS);

class importCSS extends HTMLElement {
    constructor() {
        super();
        this.outerHTML = '<link rel="stylesheet" href="'+this.textContent+'" />';
    }
}
customElements.define('import-css', importCSS);


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

 
const Clone = {
    attrs:[],

    init:function(){
        melonpan.targetDOM.forEach(function(dom){
            $(dom).each(function(idx){
                const attr = this.getAttribute('clone');
                if(attr!==null){
                    Clone.template(this,idx);
                    this.removeAttribute('clone');
                }
           });
        });
    },

    template:function(self,idx){
        const template = document.querySelector('template#'+self.getAttribute('clone'));
        let clone = template.innerHTML;
        self.innerHTML = clone;
    }
}

const Data = {
    init:function(){
        melonpan.targetDOM.forEach(function(dom){
            $(dom).each(function(idx){
                const attr = this.getAttribute('data');
                if(attr!==null){
                    const data = Data.parse(attr);
                    Data.list( this, data);
                }
            });
        });
    },
    
    parse:function(attribute){
        var data = [];
        var attr = attribute.replace(/(\s+)|(\t+)|(\r?\n)/g,"").split('#');
        attr = $.grep(attr, function(e){return e !== "";});

        attr.forEach(function(element){
            var el = element.split('=');
            data.push({'dst':el[0],'src':Data.parseSrc(el[1])});
        });
        return data; 
    },

    parseSrc:function(src){
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
    },

    list:function(self, data){
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

var Replace = {
    init:function(){
        melonpan.targetDOM.forEach(function(dom){
            $(dom).each(function(idx){
                const attr = this.getAttribute('replace');
                if(attr!==null){
                    Replace.exec(this, Replace.parse(attr));
                    this.removeAttribute('replace');
                }
            });
        });
    },

    parse:function(attribute){
        var replace = [];

        var attr = attribute.split(';');
        attr = $.grep(attr, function(e){return e !== "";});

        attr.forEach(function(element){
            var el = element.split('->');
            replace.push({'src':el[0].replace(/(^\s+)|(\s+$)|(^\t+)|(\t+$)|(\r?\n)/g,""),
                       'dst':el[1].replace(/(^\s+)|(\s+$)|(^\t+)|(\t+$)|(\r?\n)/g,"")});
        });
        return replace;
    },

    exec:function(self, replace){
        replace.forEach(function(element){
            self.innerHTML = self.innerHTML.replace(new RegExp(element.src, 'g'), element.dst);
        });
    }
}


const Use = {
    init:function(){
        melonpan.targetDOM.forEach(function(dom){
            $(dom).each(function(idx){
                const attr = this.getAttribute('use');
                if(attr!==null){
                    Use.expand(this,attr);
                    this.removeAttribute('use');
                }
            });
        });
    },

    expand:function(self,moduleId){
        for(var mod of melonpan.modules){
            if (mod.id === moduleId){
                const codeByUse = mod.code;
                const codeByFlex = self.getAttribute('flex')!==null ? self.getAttribute('flex') : '';
                self.setAttribute('flex', '@id='+ moduleId+ codeByUse + codeByFlex);
            };
        }
    }
}

const Flex = {
    init:function(){
        Flex.createStyleTag();
        melonpan.targetDOM.forEach(function(dom){
            $(dom).each(function(idx){
                const attr = this.getAttribute('flex');
                if(attr!==null){
                    Flex.readModule(this,attr,idx);
                    this.removeAttribute('flex');
                }
            });
        })
    },

    createStyleTag :function (){  
        const style = document.createElement('style');
        style.id = 'style-master';  
        style.type = 'text/css';
        style.rel = 'stylesheet'; 
        const rule = document.createTextNode('html,body{height:100vh;width:100vw;margin:0;padding:0;}');
        const head = document.getElementsByTagName('head');
        style.appendChild(rule);
        head.item(0).appendChild(style);
    },

    parseModule:function(str){
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
    },

    readModule:function(self,code,idx){
        const mod = Flex.parseModule(code);
        Flex.setCSS(self, mod);
        Flex.setEvent(self, mod, idx);
    },

    uniqueStr:function(){
        const strong = 1000;
        return new Date().getTime().toString(16)  + Math.floor(strong*Math.random()).toString(16)
    },

    setCSS:function(self,mod){
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
    },
    
    setEvent: function(self,mod,idx){
        const selector = '"'+self.tagName+':eq('+idx+')"';
        if(typeof mod.id !== 'undefined'){
            var customMethodIndex = mod.id.replace(/\s+/g,"") + '_';
            for(var key in mod){
                if(key.substr(0,customMethodIndex.length) === customMethodIndex){
                    var code = mod[key].replace(/this/g,selector).replace(/%ARG\d/g,'arguments[$&]').replace(/%ARG/g,'');
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
        if(typeof mod.text !== 'undefined'){
            self.textContent = mod.text.replace(/(^\s+)|(\s+$)|(^\t+)|(\t+$)/g,"");
        }

        const eventList = ['mouseenter','mouseleave','click','focus','blur','change','touchstart','touchend','keyup'];
        eventList.forEach(function(event){
            if(typeof mod[event] !== 'undefined'){
                self.addEventListener( event ,function(){
                    (0,eval)(mod[event].replace(/this/g,selector));
                });
            }
        });
    }
}
