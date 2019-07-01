
const randomColor= function (){
    var r=mlp.random(0,255);
    var g=mlp.random(0,255);
    var b=mlp.random(0,255);
    if(r<=g && r<=b){ r = 0;}
    if(g<=r && g<=b){ g = 0;}
    if(b<=r && b<=g){ b = 0;}
    return 'rgb('+ r +','+ g +','+ b +')';
}

const random = function (min,max){
    return Math.floor(Math.random() * (max - min + 1) + min);
}