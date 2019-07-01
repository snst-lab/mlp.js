'use strict';
var flex = flex || {};
flex.module = flex.module || {};

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
        const xhr = new XMLHttpRequest();
        xhr.open("GET", this.textContent , false); //true : async
        xhr.send(null);
        if (xhr.status == '200') {
           this.outerHTML = '<script type="text/javascript" src="'+this.textContent+'"></script>';
        } else {
           console.log(this.textContent + ' is not found.');
        }
    }
}
customElements.define('import-js', importJS);

class importCSS extends HTMLElement {
    constructor() {
        super();
        const xhr = new XMLHttpRequest();
        xhr.open("GET", this.textContent , false); //true : async
        xhr.send(null);
        if (xhr.status == '200') {
           this.outerHTML = '<link rel="stylesheet" href="'+this.textContent+'" />';
        } else {
           console.log(this.textContent + ' is not found.');
        }
    }
}
customElements.define('import-css', importCSS);

document.addEventListener('DOMContentLoaded', function(){
    flex.init();
}, false);


const flex = {
    templates:[],

    init:async function(){
        // var tag = document.createElement( 'style' ); 
        // tag.type = "text/css"; 
        // document.getElementsByTagName( 'head' ).item(0).appendChild( tag );
        // document.styleSheets.item(0).insertRule('self::after('+idx+'):hover{'+property.hover+'}',0);
  
        await flex.readTemplate(); 
        await flex.setDOM();
        await flex.setProperty();
    },

    readTemplate:function(){
        $('template').each(function(){
            if(this.getAttribute('flex')!==null){
                flex.templates.push( {'id':this.getAttribute('flex'), 'property':this.innerHTML});
            }
         });
         $('div,input,option').each(function(){
            if(this.getAttribute('flex')!==null){
                flex.templates.push( {'id':this.getAttribute('flex'), 'property':this.innerHTML});
            }
         });
    },

    setDOM:function(){
        $('div').each(function(idx){
            flex.cloneTemplate(this);
       });
       $('div').each(function(idx){
            flex.listData(this);
        });
        $('input').each(function(idx){
            flex.cloneTemplate(this);
       });
       $('input').each(function(idx){
            flex.listData(this);
        });
   },

    cloneTemplate:function(self){
        if(self.getAttribute('clone')!==null){
            const template = document.querySelector('template#'+self.getAttribute('clone'));
            let clone = template.innerHTML;
            if(self.getAttribute('arg')!==null){
                const arg = self.getAttribute('arg').split(';');
                for(var i=0;i<arg.length;i++){
                    clone = clone.replace(new RegExp('ARG'+i, 'g'), arg[i]);
                }
            }
            if(self.getAttribute('data')!==null){
                self.outerHTML = clone.replace('<div','<div data="'+self.getAttribute('data')+'"');
            }else{
                self.outerHTML = clone;
            }

        }
    },

    listData:function(self){
        if(self.getAttribute('data')!==null){
            const data = self.getAttribute('data');
            const content = $(self).text();

            if(data.indexOf(',')>-1){
                var array = $.grep(data.split(','), function(e){return e !== "";});
            }else{
                var array = (0, eval)(data);
            }

            if(Object.prototype.toString.call(array[0])==='[object Object]' && self.getAttribute('key')!==null){
                for(var element of array){
                    if(self.getAttribute('flex')!==null){
                        var text = content + '@text:'+element[self.getAttribute('key')];
                    }else{
                        var text = element[self.getAttribute('key')];
                    }
                    $(self).after($(self).text(text).prop('outerHTML')); 
                }
            }else{
                for(var element of array){
                    if(self.getAttribute('flex')!==null){
                        var text = content + '@text:'+element;
                    }else{
                        var text = element;
                    }
                    $(self).after($(self).text(text).prop('outerHTML')); 
                }
            }
            $(self).remove();
        }
    },

    setProperty:function(){
        $('div').each(async function(idx){
            await flex.setPropertyFromContent(this,idx);
            await flex.setPropertyFromAttr(this,idx);
        });
        $('input').each(async function(idx){
            await flex.setPropertyFromContent(this,idx);
            await flex.setPropertyFromAttr(this,idx);
        });
    },

    setPropertyFromContent:function(self,idx){
        if(self.getAttribute('flex')!==null){
            if(self.getAttribute('use')!==null){
                const templateId = self.getAttribute('use');
                for(var template of flex.templates){
                    let templateProperty = template.property;
                    const directProperty = (self.textContent!=='') ? self.textContent : ( (self.getAttribute('prop')!==null) ? self.getAttribute('prop') : '');
                    if (template.id === templateId){
                        if(self.getAttribute('arg')!==null){
                            const arg = self.getAttribute('arg').split(';');
                            for(var i=0;i<arg.length;i++){
                                templateProperty = templateProperty.replace(new RegExp('ARG'+i, 'g'), arg[i]);
                            }
                        }
                        const property = flex.parseProperty( templateProperty + directProperty);
                        if(typeof property.text === 'undefined'){
                            self.textContent = '';
                        }
                        flex.writeProperty(self, property ,idx);
                    };
                }
            }else{
                const directProperty = (self.textContent!=='') ? self.textContent : ( (self.getAttribute('prop')!==null) ? self.getAttribute('prop') : '');
                const property = flex.parseProperty(directProperty);
                if(typeof property.text === 'undefined'){
                    self.textContent = '';
                }
                flex.writeProperty(self, property,idx);
            }
        }else{
            if(self.getAttribute('use')!==null){
                const templateId = self.getAttribute('use');
                for(var template of flex.templates){
                    if (template.id === templateId){
                        var templateProperty = template.property;
                        if(self.getAttribute('arg')!==null){
                            const arg = self.getAttribute('arg').split(';');
                            for(var i=0;i<arg.length;i++){
                                templateProperty = templateProperty.replace(new RegExp('ARG'+i, 'g'), arg[i]);
                            }
                        }
                        const property = flex.parseProperty(templateProperty);
                        flex.writeProperty(self, property ,idx);
                    };
                }
            }
        }
    },

    setPropertyFromAttr:function(self,idx){
        if(self.getAttribute('css')!==null){
            self.style.cssText = self.getAttribute('css');
        }
        if(self.getAttribute('cssHover')!==null){
            const style = self.style.cssText;
            $(self).hover(
                function(){
                    self.style.cssText += self.getAttribute('cssHover');
                }, 
                function(){
                    self.style.cssText = style;
                }
            );
        }
        if(self.getAttribute('cssFocus')!==null){
            const style = self.style.cssText;
            $(self).focus(
                function(){
                    self.style.cssText += self.getAttribute('cssFocus');
                }, 
                function(){
                    self.style.cssText = style;
                }
            );
        }

        const selector = '"'+self.tagName+':eq('+idx+')"';

        if(self.getAttribute('load')!==null){
            window.onload = function(){
                new Function(self.getAttribute('load').replace('this',selector))();
            }
        }
        if(self.getAttribute('click')!==null){
            self.addEventListener('click',function(){
                new Function(self.getAttribute('click').replace('this',selector))();
            });
        }
        if(self.getAttribute('focus')!==null){
            self.addEventListener('focus',function(){
                new Function(self.getAttribute('focus').replace('this',selector))();
            });
        }
    },

    writeProperty:function(self,property,idx){
        if(typeof property.css !== 'undefined'){
            self.style.cssText = property.css;
        }
        if(typeof property.cssHover !== 'undefined'){
            const style = self.style.cssText;
            $(self).hover(
                function(){
                    self.style.cssText += property.cssHover;
                }, 
                function(){
                    self.style.cssText = style;
                }
            );
        }
        if(typeof property.cssFocus !== 'undefined'){
            const style = self.style.cssText;
            $(self).focus(
                function(){
                    self.style.cssText += property.cssFocus;
                }, 
                function(){
                    self.style.cssText = style;
                }
            );
        }

        const selector = '"'+self.tagName+':eq('+idx+')"';

        if(typeof property.onload !== 'undefined'){
            $(self).ready(function(){
                 new Function(property.onload.replace('this',selector))();
            });
        }
        if(typeof property.click !== 'undefined'){
            self.addEventListener('click',function(){
                new Function(property.click.replace('this',selector))();
            });
        }
        if(typeof property.focus !== 'undefined'){
            self.addEventListener('focus',function(){
                new Function(property.focus.replace('this',selector))();
            });
        }
        if(typeof property.blur !== 'undefined'){
            self.addEventListener('blur',function(){
                new Function(property.blur.replace('this',selector))();
            });
        }
        if(typeof property.change !== 'undefined'){
            self.addEventListener('change',function(){
                new Function(property.change.replace('this',selector))();
            });
        }
        if(typeof property.keyup !== 'undefined'){
            self.addEventListener('keyup',function(){
                new Function(property.keyup.replace('this',selector))();
            });
        }
        if(typeof property.touchstart !== 'undefined'){
            self.addEventListener('touchstart',function(){
                new Function(property.touchstart.replace('this',selector))();
            });
        }
        if(typeof property.touchend !== 'undefined'){
            self.addEventListener('touchend',function(){
                new Function(property.touchend.replace('this',selector))();
            });
        }
        if(typeof property.mouseenter !== 'undefined'){
            self.addEventListener('mouseenter',function(){
                new Function(property.mouseenter.replace('this',selector))();
            });
        }
        if(typeof property.mouseleave !== 'undefined'){
            self.addEventListener('mouseleave',function(){
                new Function(property.mouseleave.replace('this',selector))();
            });
        }
        if(typeof property.text !== 'undefined'){
            self.textContent = property.text.replace(/\r?\n?\t/g,"");
        }
    },

    parseProperty:function(str){
        var obj = {};
        var key,keyStart,keyEnd,value,valueEnd;
        while(true){
            keyStart = str.indexOf('@',0)+1;
            keyEnd = str.indexOf(':', keyStart);
            key = str.slice(keyStart,keyEnd).replace(/\r?\n?\s?\t/g,"");
            str = str.slice(keyEnd);
            valueEnd = str.indexOf('@',0);
            if(key!=='text'){
                value = str.slice(1,valueEnd).replace(/\r?\n?\s?\t/g,"");
            }else{
                valueEnd = (valueEnd != -1) ? valueEnd: str.length; 
                value = str.slice(1,valueEnd).replace(/\r?\n?\t/g,"");
            }
            str = str.slice(valueEnd);
            obj[key]=value;
            if(valueEnd<0) break;
        }
        return obj;
    }
}

