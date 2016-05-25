const halflifeXenon = 9.0;
const halflifeWaste = 6.0;
const xenonBurnoffRate = 0.7; //the xenon burnoff rate in hour

window.onload = init;


// Initialize everything and start the simulation
function init(){
	var reactor = new Reactor();
	var rController = new PidController();
	
	var wasteGraph = new Graph();
	var xenonGraph = new Graph();
	var referenceGraph = new Graph();
	var chart = new Chart();
	chart.setXAxis(0, 400, 10);
	chart.setYAxis(0, 200, 25);
	
	var context = document.getElementById("myCanvas").getContext("2d");
	var referenceWasteflow = 0;
	
	reactor.setWaste(0.0);
	reactor.setControlRodSetting(1.0);
	wasteGraph.setColor("#0f0");
	referenceGraph.setColor("#000");
	xenonGraph.setColor("#f00");
	
	
	for(var i = 0; i < 400; i++){
		
		reactor.simulateStep(1);
		
		var newControlRodSetting = 1 - rController.calcOutput(referenceWasteflow - reactor.getWaste());
		reactor.setControlRodSetting(newControlRodSetting);
		
		if(i == 5) referenceWasteflow = 200;
		if(i == 60) referenceWasteflow = 10;
		if(i == 70) referenceWasteflow = 100;
		if(i == 80) referenceWasteflow = 120;
		if(i == 90) referenceWasteflow = 140;
		if(i == 100) referenceWasteflow = 30;
		
		
		console.log(i + ": " + newControlRodSetting);
		wasteGraph.addValue(reactor.getWaste());
		xenonGraph.addValue(reactor.getXenon());
		referenceGraph.addValue(referenceWasteflow);
	}
	
	chart.addGraph(wasteGraph);
	chart.addGraph(xenonGraph);
	//chart.addGraph(referenceGraph);
	
	chart.draw(context);
	
	console.log(chart.scaleValueX(10));
	console.log(context.canvas.width * 0.05);
}

function format(value){
	return Math.round(100 * value) / 100;
}

class Reactor{
	constructor(){
		this.waste = 0.0;
		this.xenon = 0.0;
		this.producedNeutrons = 0.0;
		this.controlRodSetting = 0.0;
		this.maxNeutrons = 40.0;
	}
	
	simulateStep(timestep){
		/* Calculate powerlevel and xenon burnup*/
		//if xenon is available, burn xenon and don't produce neutrons
		this.producedNeutrons = this.maxNeutrons * (1 - this.controlRodSetting) * timestep;
		var burnedXenon = 0;
		if((this.xenon > 0) && (this.producedNeutrons > 0)){
			var burnedXenon = Math.min(this.xenon, this.producedNeutrons);
			this.producedNeutrons -= burnedXenon * 1, 0;
			this.producedNeutrons = Math.max(this.producedNeutrons, 0);
		}
		//var burnedXenon = this.producedNeutrons * xenonBurnoffRate * timestep;
		
		//console.log(burnedXenon);
		//console.log("N: " + this.producedNeutrons);
		
		/* Calculate decay */
		var newWastelevel = this.waste * Math.exp((-1) * this.calcDecayConst(halflifeWaste) * timestep);
		var newXenonlevel = this.xenon * Math.exp((-1) * this.calcDecayConst(halflifeXenon) * timestep);
		
		var decayedWaste = this.waste - newWastelevel;
		var decayedXenon = this.xenon - newXenonlevel;
		
		
		/* Set the values for the next iteration */
		this.waste = newWastelevel;
		this.waste += this.producedNeutrons;
		
		this.xenon = Math.max(0, newXenonlevel - burnedXenon);
		this.xenon += decayedWaste;
	}
	
	setController(value){
		this.controller = value;
	}
	
	setWaste(value){
		this.waste = value;
	}
	
	getWaste(){
		return this.waste;
	}
	
	setXenon(value){
		this.xenon = value;
	}
	
	getXenon(){
		return this.xenon;
	}
	
	setControlRodSetting(value){
		this.controlRodSetting = value;
	}
	
	getControlRodSetting(){
		return this.controlRodSetting;
	}
	
	calcDecayConst(halflife){
		return (0.693 / halflife);
	}
}

class PidController{
	constructor(){
		this.amplification = 0.04;
		this.integralGain = 0.003;
		this.derivativeGain = -0.001;
		
		this.errorOld = 0;
		this.derivativeTerm = 0;
		this.integralTerm = 0;
	}
	
	calcOutput(error){
		this.derivativeTerm = this.errorOld - error;
		this.integralTerm += error;
		
		var signal = this.amplification * error + this.integralGain * this.integralTerm + this.derivativeTerm * this.derivativeGain;
		signal = Math.max(signal, 0);
		signal = Math.min(signal, 1);
		
		this.errorOld = error;
		
		return signal;
	}
}

class Chart{
	constructor(){
		this.graphs = [];
		this.h = 0;
		this.w = 0;
	}
	
	addGraph(graph){
		this.graphs.push(graph);
	}
	
	draw(ctx){
		this.h = ctx.canvas.height;
		this.w = ctx.canvas.width;
		
		this.drawGrid(ctx);
		this.drawGraphs(ctx);
		this.drawAxes(ctx);
	}
	
	drawGraphs(ctx){
		for(var i = 0; i < this.graphs.length; i++){
			var tmpGraph = this.graphs[i];
			var maxIndex = Math.min(this.xMax, tmpGraph.getLength());
			var xRange = Math.round(this.xMax - this.xMin);
			
			ctx.strokeStyle = tmpGraph.getColor();
			ctx.lineWidth = 1;
			ctx.beginPath();
			ctx.moveTo(this.scaleValueX(this.xMin), this.scaleValueY(tmpGraph.getValue(this.xMin)));
			for(var j = 0; j < xRange; j++){
				ctx.lineTo(this.scaleValueX(j + this.xMin), this.scaleValueY(tmpGraph.getValue(j + this.xMin)));
			}
			ctx.stroke();
		}
	}
	
	scaleValueY(value){
		var yRange = this.yMax - this.yMin;
		var ySize = 0.9 * this.h;
		var yScale = ySize / yRange;
		var yOffset = 0.95 * this.h;
		
		return yOffset - yScale * value;
	}
	
	scaleValueX(value){
		var xRange = this.xMax - this.xMin;
		var xSize = 0.9 * this.w;
		var xScale = xSize / xRange;
		var xOffset = 0.05 * this.w;
		
		return xOffset + xScale * value;
	}
	
	drawGrid(ctx){
		//calc grid parameters
		var xGridlines = Math.floor((this.xMax - this.xMin) / this.xGridSize);
		var yGridlines = Math.floor((this.yMax - this.yMin) / this.yGridSize);
		
		ctx.lineWidth = 1;
		ctx.strokeStyle = "#ccc";
		ctx.beginPath();
		
		//draw x grid
		for(var i = 0; i < xGridlines; i++){
			ctx.moveTo(Math.round(this.scaleValueX((1 + i) * this.xGridSize)) + 0.5, 0.05 * this.h);
			ctx.lineTo(Math.round(this.scaleValueX((1 + i) * this.xGridSize)) + 0.5, 0.95 * this.h);
		}
		
		//draw y grid
		for(var i = 0; i < yGridlines; i++){
			ctx.moveTo(0.05 * this.w, Math.round(this.scaleValueY((1 + i) * this.yGridSize)) + 0.5);
			ctx.lineTo(0.95 * this.w, Math.round(this.scaleValueY((1 + i) * this.yGridSize)) + 0.5);
		}
		ctx.stroke();
	}
	
	drawAxes(ctx){
		ctx.lineWidth = 2;
		ctx.strokeStyle = "#000";
		ctx.beginPath();
		ctx.moveTo(0.05 * this.w, 0.05 * this.h);
		ctx.lineTo(0.05 * this.w, 0.95 * this.h);
		ctx.lineTo(0.95 * this.w, 0.95 * this.h);
		ctx.lineWidth = 2;
		ctx.stroke();
	}
	
	setXAxis(min, max, gridSize){
		this.xMin = min;
		this.xMax = max;
		this.xGridSize = gridSize;
	}
	
	setYAxis(min,max, gridSize){
		this.yMin = min;
		this.yMax = max;
		this.yGridSize = gridSize;
	}
	
	drawVerticalLine(y, ctx){
		ctx.lineWidth = 1;
		ctx.strokeStyle = "#000";
		ctx.beginPath();
		ctx.moveTo(0.05 * this.w, Math.round(this.scaleValueY(y)));
		ctx.lineTo(0.95 * this.w, Math.round(this.scaleValueY(y)));
		ctx.stroke();
	}
}

class Graph{
	constructor(){
		this.values = [];
	}
	
	addValue(value){
		this.values.push(value);
	}
	
	setColor(value){
		this.color = value;
	}
	
	getColor(){
		return this.color;
	}
	
	getLength(){
		return this.values.length;
	}
	
	getValues(){
		return this.values;
	}
	
	getValue(index){
		return this.values[index];
	}
}