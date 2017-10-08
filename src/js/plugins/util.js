/**
 * Created by emol on 10/8/17.
 */
// make random 5 character string
window.makeID = function(){
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for( var i=0; i < 5; i++ ) text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
}