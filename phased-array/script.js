window.onload = init;

var canv, ctx;

var startTime;
var senders = [];

const frequency = 1;
const xSize = 200;
const ySize = 200;

function init(){
	canv = document.getElementById('canv');
	ctx = canv.getContext('2d');

	
	senders = [];
	senders.push({x: 100 - 10, y:5});
	senders.push({x: 100 -  5, y:5});
	senders.push({x: 100     , y:5});
	senders.push({x: 100 +  5, y:5});
	senders.push({x: 100 + 10, y:5});

	
	ctx.clearRect(0, 0, canv.width, canv.height);

	startTime = new Date();
	loop();
}

function loop(){


	let datenow = new Date();
	let t = datenow - startTime;

	let waves = [];
	for(let i = 0; i < senders.length; i++){
		waves.push(getWave(senders[i], -0.001 * t, frequency, 0));//calcPhase(senders, i)));
	}

	let sum = sumwav(waves);

	//plot(sum, 1)
	plotWave(sum);

	window.requestAnimationFrame(loop);
}

function sumwav(waves){
	let result = [];
	let max = Number.MIN_VALUE;

	for(let valIndex = 0; valIndex < waves[0].length; valIndex++){
		let total = 0;

		//add all wave's values
		for(let waveIndex = 0; waveIndex < waves.length; waveIndex++){
			total += waves[waveIndex][valIndex];
		}

		//add value to output
		result.push(total);

		//update max
		if(total > max){
			max = total;
		}
	}

	for(let i = 0; i < result.length; i++){
		result[i] = result[i] / max;
	}

	return result;
}

function getWave(sender, dt, freq, phase){
	let out = [];

	for(let xPos = 0; xPos < xSize; xPos++){
		for(let yPos = 0; yPos < ySize; yPos++){
			let x = xPos - sender.x;
			let y = yPos - sender.y;
			let distance = Math.sqrt(x * x + y * y);

			// this is not quite correct, the distance part should take wavelength etc into account
			let val = Math.sin(distance + 2 * Math.PI * freq * dt + phase);
			out.push(val);
		}
	}

	return out;
}

function plotWave(wave){
	let x,y = 0;

	for(i = 0; i < wave.length; i++){
		y = Math.floor(i / 200);
		x = i % 200;

		let col = Math.round(wave[i] * 255);

		ctx.fillStyle = 'rgb(' + col + ',' + col + ',' + col + ')';
		ctx.fillRect(3 * x, 3 * y, 3, 3);
	}
}