'use strict';

var container = document.getElementById('container');
var globe = new DAT.Globe(container);
var dates = ['', '2000-04-29,' + new Date().toISOString().split('T')[0], 'upcoming', 'all'];

var timer;
   
// inputs
$('#searchBtn').click(function () {
    search();
});


function resetGlobe() {
    globe.reset();

}





$(document).ready(function () {
    if(!Detector.webgl){
        Detector.addGetWebGLMessage();
    } else {
        resetGlobe();
        globe.animate();
    }
});
