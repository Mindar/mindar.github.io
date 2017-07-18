window.onload = init;


// Display Settings
const timescale =  1/1e4;


// Simulation Settings
const c = 1e4; // 300 000 km/s 3e8
const f = 1.5e3;//2.4e3; //Hz == 2.4Ghz 2.4e9
const lambda = c / f;


// Util vars
var options = {};
var antenna = {};
var startTime;
var scaleX, scaleY;
var angle = 0;
var canv, ctx;

function init(){
	canv = document.getElementById('canv');
	canv.onmousemove = updateAngle;
	//canv.onwheel = updateDistance;

	ctx = canv.getContext('2d');
	ctx.fillRect(0, 0, canv.width, canv.height);

	antenna.senders = 7;
	antenna.senderDistance = 4.5; //px
	antenna.pos = {x: 5, y: 100}
	antenna.angle = 0;

	options.simWidth = 200;
	options.simHeight = 200;

	scaleX = canv.width / options.simWidth;
	scaleY = canv.height / options.simHeight;

	startTime = new Date();
	simStep();
}

function updateDistance(e){
	antenna.senderDistance += e.deltaY * 0.001;

	console.log(antenna.senderDistance);
}

let dt = 0;

function simStep(){
	let curTime = new Date();
	//let dt = curTime - startTime;
	dt += 1;
	antenna.phases = calcPhases();

	let field = calcField(dt);
	normalize(field);

	render(field);

	requestAnimationFrame(simStep);
}

function calcField(t){
	let result = [];
	let max = Number.MIN_VALUE;


	for(let x = 0; x < options.simWidth; x++){
		for(let y = 0; y < options.simHeight; y++){
			let total = calcFieldStrengthAt(x, y, t);

			result.push(total);
		}
	}
	return result;
}

function calcFieldStrengthAt(x, y, t){
	let result = 0;


	for(let i = 0; i < antenna.senders; i++){
		let patchX = antenna.pos.x;
		let patchY = antenna.pos.y - (antenna.senders * antenna.senderDistance) / 2 + i * antenna.senderDistance;

		let xDis = x - patchX;
		let yDis = y - patchY;

		let distance = Math.sqrt(xDis * xDis + yDis * yDis);

		result += Math.sin(2 * Math.PI * ((timescale * t * f) - (distance / (c / f))) - antenna.phases[i]);
	}

	return result;
}



function calcPhases(){
	let result = [];

	let centerPos = antenna.senders * antenna.senderDistance / 2;
	

	for(let i = 0; i < antenna.senders; i++){
		let senderPos = i * antenna.senderDistance;
		let d = senderPos - centerPos;

		//result.push(d * Math.sin(angle)); //= deltaS

		let deltaS = d * Math.sin(angle);
		let deltaT = deltaS / c;
		//deltaT *= timescale;
		let phase = 2 * Math.PI * f * deltaT;

		result.push(phase);
	}


	//calculate what this would be in radian, considering the frequency and wave speed
	//dphi = 2pi * f * deltaT
	//deltaT = deltaS / c
	
	return result;
}

function updateAngle(e){
	let antennaX = this.getBoundingClientRect().left + antenna.pos.x * scaleX;
	let antennaY = this.getBoundingClientRect().top + antenna.pos.y * scaleY;

	let mX = e.pageX;
	let mY = e.pageY;

	let rX = mX - antennaX;
	let rY = mY - antennaY;

	//let distance = Math.sqrt(rX * rX + rY * rY);
	angle = Math.atan2(rY, rX);

	//angle = angle / Math.PI * 180;

	//console.log('( ' + rX + ', ' + rY + ' ) d:' + Math.round(distance) + ' a:' + Math.round(angle));
}

function render(field){
	for(let i = 0; i < field.length; i++){
		let y = i % options.simWidth;
		let x = Math.floor(i / options.simHeight);
		


		let colval = colorCorrect(field[i]);
		let rgbval = Math.round(colval * 255);

		ctx.fillStyle = 'rgb(' + rgbval + ',' + rgbval + ',' + rgbval + ')';
		ctx.fillRect(scaleX * x, scaleY * y, scaleX, scaleY);
	}
}


function colorCorrect(val){
	let result = val;

	//result /= 3;

	/*if(val < 0.5){
		result = Math.sqrt(result);
	}*/

	return result;
}

function normalize(values){
	let max = Number.MIN_VALUE;
	let min = Number.MAX_VALUE;

	for(let i = 0; i < values.length; i++){
		if(max < values[i]){
			max = values[i];
		}

		if(min > values[i]){
			min = values[i];
		}
	}

	let range = max - min;
	for(let i = 0; i < values.length; i++){
		values[i] = (values[i] + 0) / max;
	}
}