import * as vscode from 'vscode';
import * as si from 'systeminformation';

async function sendInitData(sysPanel: vscode.WebviewPanel) {
	const data = await getInitData();
		
	sysPanel.webview.postMessage({ type: 'init', data: data });
}

export function activate(context: vscode.ExtensionContext) {
	const disposable = vscode.commands.registerCommand('monitor.showSysMonitor', async () => {
		var sysPanel: vscode.WebviewPanel = vscode.window.createWebviewPanel(
			'sysmonitor', // Identifies the type of the webview. Used internally
			'System Monitor', // Title of the panel displayed to the user
			vscode.ViewColumn.One, // Editor column to show the new webview panel in.
			{enableScripts: true}
		);

		sysPanel.webview.html = getWebviewContent();
		
		sendInitData(sysPanel);

		var sendingGraphData = false;
		const i1 = setInterval(async () => {
			if (sendingGraphData) {
				return;
			}
			sendingGraphData = true;
			const data = await getData();			
			sysPanel.webview.postMessage({ type: 'update', data: data });
			sendingGraphData = false;
		}, 1000);

		var sendingProcessData = false;
		const i2 = setInterval(async () => {
			if (sendingProcessData) {
				return;
			}
			sendingProcessData = true;
			const data = await getProcessData();			
			sysPanel.webview.postMessage({ type: 'process', data: data });
			sendingProcessData = false;
		}, 1000);

		var sendingMemoryData = false;
		const i3 = setInterval(async () => {
			if (sendingMemoryData) {
				return;
			}
			sendingMemoryData = true;
			const data = await getMemoryData();			
			sysPanel.webview.postMessage({ type: 'memory', data: data });
			sendingMemoryData = false;
		}, 1000);

		var sendingCPUData = false;
		const i4 = setInterval(async () => {
			if (sendingCPUData) {
				return;
			}
			sendingCPUData = true;
			const data = await getCPUData();			
			sysPanel.webview.postMessage({ type: 'cpu', data: data });
			sendingCPUData = false;
		}, 1000);

		sysPanel.onDidDispose(
			() => {
			  // When the panel is closed, cancel any future updates to the webview content
			  clearInterval(i1);
			  clearInterval(i2);
			  clearInterval(i3);
			  clearInterval(i4);
			},
			null,
			context.subscriptions
		  );

		  sysPanel.onDidChangeViewState(
			e => {
			  const panel = e.webviewPanel;
				if (panel.visible) {
					// Panel is visible
					//vscode.commands.executeCommand('workbench.action.webview.reloadWebviewAction');
					sendInitData(sysPanel);
				} else {
				}
			},
			null,
			context.subscriptions
		  );
	});

	// const disposable2 = vscode.commands.registerCommand('monitor.showNetMonitor', async () => {
	// 	var netPanel: vscode.WebviewPanel = vscode.window.createWebviewPanel(
	// 		'netmonitor', // Identifies the type of the webview. Used internally
	// 		'Network Monitor', // Title of the panel displayed to the user
	// 		vscode.ViewColumn.One, // Editor column to show the new webview panel in.
	// 		{
	// 			enableScripts: true,
	// 			//localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'media')]
	// 		}
	// 	);

	// 	// const onDiskPath = vscode.Uri.joinPath(context.extensionUri, 'media', 'world.json');
    //   	// const worldSrc = sysPanel.webview.asWebviewUri(onDiskPath);

	// 	netPanel.webview.html = getNetworkContent();

	// 	// const data = await getNetworkInit();
	// 	// await sysPanel.webview.postMessage({ type: 'init', data: data });
		

	// 	var sendingSpeedData = false;
	// 	const i1 = setInterval(async () => {
	// 		if (sendingSpeedData) {
	// 			return;
	// 		}
	// 		sendingSpeedData = true;
	// 		const data = await getSpeedData();		
	// 		netPanel.webview.postMessage({ type: 'speed', data: data });
	// 		sendingSpeedData = false;
	// 	}, 1000);

	// 	var sendingIfaceData = false;
	// 	const i2 = setInterval(async () => {
	// 		if (sendingIfaceData) {
	// 			return;
	// 		}
	// 		sendingIfaceData = true;
	// 		const data = await getInterfaceData();		
	// 		netPanel.webview.postMessage({ type: 'iface', data: data });
	// 		sendingIfaceData = false;
	// 	}, 1000);

	// 	var sendingGeoData = false;
	// 	const i3 = setInterval(async () => {
	// 		if (sendingGeoData) {
	// 			return;
	// 		}
	// 		sendingGeoData = true;
	// 		const data = await getIPGeoData();		
	// 		netPanel.webview.postMessage({ type: 'geo', data: data });
	// 		sendingGeoData = false;
	// 	}, 1000);

	// 	netPanel.onDidDispose(
	// 		() => {
	// 		  // When the panel is closed, cancel any future updates to the webview content
	// 		  clearInterval(i1);
	// 		  clearInterval(i2);
	// 		},
	// 		null,
	// 		context.subscriptions
	// 	  );

	// 	  netPanel.onDidChangeViewState(
	// 		e => {
	// 		  const panel = e.webviewPanel;
	// 			if (panel.visible) {
	// 				// Panel is visible
	// 				// Init data if needed
	// 			} else {
	// 			}
	// 		},
	// 		null,
	// 		context.subscriptions
	// 	  );
	// });

	context.subscriptions.push(disposable);
	// context.subscriptions.push(disposable2);
}

// var state;
// 	var ipv4;
// 	var ping;
// 	var iface;
// 	var endpoint;

// async function getNetworkInit() {
// 	var json = fetch('https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json');
// 	const data = {
// 		timestamp: Date.now(),
// 		worldjson: json,
// 	};
	
// 	return JSON.stringify(json);
// }

var userIP: string;

var fetching = false;
function handleData(data: any) {
	console.log(data);
}

async function getIPGeoData() {
	if (fetching) {
		return;
	}

	fetching = true;
	var url = "https://ipapi.co/" + userIP + "/json/";
	var response = await fetch(url);
	var data = await response.json();
	var userLat = data.latitude;
	var userLon = data.longitude;

	console.log(userLat, userLon);

	const [connectionData] = await Promise.all([
		si.networkConnections(),
	]);

	var protocols = connectionData[0].protocol;
	var addresses = connectionData[0].peerAddress;
	var ports = connectionData[0].peerPort;
	var states = connectionData[0].state;

	
	
	var allAddresses = [];
	var allAddStrs = [];

	for (var i = 0; i < addresses.length; i++) {
		var address = addresses[i] + ':' + ports[i];
		allAddStrs.push(address);
		allAddresses.push(address);
	}

	var endplats = [];
	var endplons = [];


	for (var i = 0; i < allAddresses.length; i++) {
		var url = "https://ipapi.co/" + allAddresses[i] + "/json/";
		var response = await fetch(url);
		var data = await response.json();
		endplats.push(data.latitude);
		endplons.push(data.longitude);
	}


	

	const data2 = {
		timestamp: Date.now(),
		ulat: userLat,
		ulon: userLon,
		elats: endplats,
		elons: endplons,
		allAddresses: allAddresses,
		protocols: protocols,
		allstates: states,
	};
	fetching = false;
	return JSON.stringify(data2);
}

async function getPublicIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
		return data.ip;
    } catch (error) {
        return '???';
    }
}


async function getInterfaceData() {
	var ipv4;
	var iface;
	var isOnline = true;
	var ping;
	
	const [ifaceData, pingData] = await Promise.all([
		si.networkInterfaces('default'),
		si.inetLatency(),
	]);

	if (Array.isArray(ifaceData)) {
		iface = ifaceData[0].ifaceName;
	} else {
		iface = ifaceData.ifaceName;
	}
	ping = pingData;
	userIP = await getPublicIP();
	ipv4 = userIP;

	getIPGeoData();

	const data = {
		timestamp: Date.now(),
		ipv4: ipv4,
		iface: iface,
		isOnline: isOnline,
		ping: ping,
	};

	return JSON.stringify(data);
}

async function getSpeedData() {
	var downmb;
	var upmb;
	
	const [networkData] = await Promise.all([
		si.networkStats(),
	]);

	downmb = networkData[0].rx_sec;
	upmb = networkData[0].tx_sec;

	if (downmb === null) {
		downmb = "-";
	}
	if (upmb === null) {
		upmb = "-";
	}

	const data = {
		timestamp: Date.now(),
		downmb: downmb,
		upmb: upmb,
	};

	return JSON.stringify(data);
}

async function getInitData() {
	var manufacturer;
	var model;
	var chassis;
	var os;
	var arch;
	var hasBattery;
	var cpu;

	var numCores;

	const [manufacturerData, chassisData, osData, batteryData, cpuData] = await Promise.all([
		si.system(),
		si.chassis(),
		si.osInfo(),
		si.battery(),
		si.cpu(),
	]);

	//OS, power, manufac, model, cpu model
	manufacturer = manufacturerData.manufacturer;
	model = manufacturerData.model;
	chassis = chassisData.type;
	os = osData.platform;
	arch = osData.arch;
	hasBattery = batteryData.hasBattery;
	cpu = cpuData.manufacturer + ' ' + cpuData.brand;
	numCores = cpuData.cores;
	const coresHalf1 = Math.floor(numCores/2);
	const coresHalf2 = numCores - coresHalf1;

	const data = {
		timestamp: Date.now(),
		manufacturer: manufacturer,
		model: model,
		chassis: chassis,
		os: os,
		battery: hasBattery,
		arch: arch,
		cpu: cpu,
		coresHalf1: coresHalf1,
		coresHalf2: coresHalf2,
	};
	
	return JSON.stringify(data);
}

async function getMemoryData() {
	const memoryData = await si.mem();
	var active = Math.round((440*memoryData.active)/memoryData.total);
	var available = Math.round((440*(memoryData.available-memoryData.free))/memoryData.total);
	var totalGiB = Math.round((memoryData.total/1073742000)*10)/10; 
	var usedGiB = Math.round((memoryData.active/1073742000)*10)/10;
	var usedSwap = Math.round((100*memoryData.swapused)/memoryData.swaptotal);
	var usedSwapGiB = Math.round((memoryData.swapused/1073742000)*10)/10;

	const data = {
		timestamp: Date.now(),
		active: active,
		available: available,
		total: totalGiB,
		used: usedGiB,
		usedSwap: usedSwap,
		swapTotal: memoryData.swaptotal,
		usedSwapGiB: usedSwapGiB,
	};

	return JSON.stringify(data);
}

async function getProcessData() {
	var processPids;
	var processNames;
	var processCpus;
	var processMems;
	var tasks;

	const processes = await si.processes();
	tasks = processes.all;

	var processList = processes.list;
	processList.sort((a, b) => b.cpu - a.cpu);

	var p0mem: number = 1;
	var p0cpu: number = 1;

	processList.forEach(p => {
		if (p.pid === 0) {
			p0mem = p.mem;
			p0cpu = p.cpu;
		}
	});

	//remove pid = 0
	processList = processList.filter(p => p.pid !== 0);
	processPids = processList.map(p => p.pid);
	processNames = processList.map(p => p.name);

	processCpus = processList.map(p => {
		return ((p.cpu / (100 - p0cpu))*100).toFixed(1) + '%';
	});

	processMems = processList.map(p => {
		return ((p.mem / (100 - p0mem))*100).toFixed(1) + '%';
	});


	const data = {
		timestamp: Date.now(),
		processPids: processPids,
		processNames: processNames,
		processCpus: processCpus,
		processMems: processMems,
		tasks: tasks,
	};

	return JSON.stringify(data);
}

async function getCPUData() {
	const cpuData = await si.cpu();
	const data = {
		timestamp: Date.now(),
		speedmax: cpuData.speedMax,
		speedmin: cpuData.speedMin,
	};

	return JSON.stringify(data);
}

async function getData() {
		var loads;
		var uptime: number;

		//si.cpuCurrentSpeed()
		const [loadData, timeData] = await Promise.all([
			si.currentLoad(),
			si.time(),		
			
		]);

		loads = loadData.cpus.map(cpu => cpu.load);
		uptime = timeData.uptime;

		//to y m d
		var hours = Math.floor(Number(uptime) / 3600);
		uptime = Number(uptime) - hours*3600;
		var minutes = Math.floor((Number(uptime) % 3600) / 60);
		uptime = Number(uptime) - minutes*60;
		var seconds = Math.floor(uptime % 60);
		
		var uptimeStr = hours + ":" + minutes + ":" + seconds;

		var loadsHalf1 = loads.slice(0, Math.floor(loads.length/2));
		var loadsHalf2 = loads.slice(Math.floor(loads.length/2), loads.length);
		var loadsAvg1 = (loadsHalf1.reduce((a, b) => a + b, 0)/loadsHalf1.length).toFixed(1) + '%';
		var loadsAvg2 = (loadsHalf2.reduce((a, b) => a + b, 0)/loadsHalf2.length).toFixed(1) + '%';
	
	const data = {
		timestamp: Date.now(),
		loadsh1: loadsHalf1,
		loadsh2: loadsHalf2,
		loadsAvg1: loadsAvg1,
		loadsAvg2: loadsAvg2,
		uptime: uptimeStr,
	};

	return JSON.stringify(data);
}




function getNetworkContent() {
	var html = `
	
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=10.0"> 

		<title>SystemMonitor</title>
		<style>
			
			body {
				background-color: #0d1117;
				/*background-color: rgba(0,0,0,0);*/
				color: #d1d5da;
				font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
				font-size: 4vw;
			}
			
		</style>
		<script src="https://cdn.jsdelivr.net/npm/smoothie@1.36.1/smoothie.min.js"></script>
		<script src="https://cdn.jsdelivr.net/npm/topojson@3.0.2/dist/topojson.min.js"></script>
		<script src = "https://d3js.org/d3.v4.min.js"></script>
    </head>	
	<body>
		<style>
			.layout > div {
				max-width: 20em;
				margin-inline: auto;
				
			}
			  
			.multi-cols {
				display: grid;
				grid-template-columns: repeat( auto-fit, minmax(2em, 1fr));
			}

			.data-table {
				padding-left: 10em;
				padding-right: 10em;
				text-align: left;
			}

			hr {
				width: 20em;
			}

			#current-time {
				font-size: 6vw;
				text-align: center;
				font-weight: bold;
			}

			.small {
				font-size: 2vw;
			}

			.small-grey {
				font-size: 2vw;
				color: grey;
			}

			.medium {
				font-size: 3vw;
			}

			.medium-grey {
				font-size: 3vw;
				color: grey;
			}

			.medium-bold {
				font-size: 3vw;
				font-weight: bold;
			}

			.ip {
				font-size: 3vw;
				color: greenyellow;
			}

			.point {
				width: 0.25vh;
				height: 0.25vh;
				background-color: greenyellow;
				padding: 0.05em;
				margin: .07em;
			}

			.chart {
				display: flex;
				gap: 1rem;
				max-width: 20rem;
				
			}
			  
			.chart_title {
				display: flex;
				flex-direction: column;
				flex-grow: 1;
				text-align: left;
				justify-content: center;
			}

			.chart_graph {
				display: flex;
				flex-direction: column;
				text-align: center;
				justify-content: center;
				align-self: center;
			}
			  
			.layout-mem > div {
				max-width: 20em;
				margin-inline: auto;
			}
			  
			.multi-cols-mem {
				display: grid;
				grid-template-columns: repeat(40, minmax(.05em, 1fr));
			}

			.bold {
				font-weight: bold;
			}
		</style>

		<div class="layout">
			<hr/>

			<div class="multi-cols">
				<span class="medium-bold">NETWORK STATUS</span>
				<span class="small-grey" id="interface">Interface: 21313</span>
			</div>
			<div class="multi-cols">
				<span class="medium-grey">STATE</span>
				<span class="medium-grey">IPV4</span>
				<span class="medium-grey">PING</span>
			</div>
			<div class="multi-cols">
				<span class="medium" id="state"></span>
				<span class="ip" id="ipv4"></span>
				<span class="medium" id="ping""></span>
			</div>

			<hr/>

			<div class="multi-cols">
				<span class="medium-bold">WORLD VIEW</span>
				<span class="medium-grey"></span>
				<span class="small-grey">GLOBAL NETWORK MAP</span>
			</div>

			<div id="map"></div>

			<div class="multi-cols">
				<span class="medium-grey">ENDPOINT LAT/LON</span>
				<span class="medium-grey" id="endpoint"></span>
			</div>
			
			<hr/>

			<div class="multi-cols">
				<span class="medium-bold">NETWORK TRAFFIC</span>
				<span class="small-grey">UP/DOWN</span>
			</div>
			<div class="multi-cols">
				<span class="medium-bold"></span>
				<span class="small-grey" id="ud-speed"></span>
			</div>

			<hr style="visibility: hidden;"/>

			<div class="chart_graph">
				<canvas id="net-up" width="580em" height="65em"></canvas>
			</div>
			<div class="chart_graph">
				<canvas id="net-down" width="580em" height="65em"></canvas>
			</div>

			<hr/>

			<div id="network-monitor"></div>
			</div>
			
			<hr/>
			

			<script>
				var markerslist = [];
				function drawMarkers(markerGroup, projection, center) {

					const latLong = [49.0861, 3.9411];
					const markers = markerGroup.selectAll('circle').data(markerslist);
				
					markers.enter()
					.append('circle')
					.merge(markers)
					.attr('cx', d => projection([d[0], d[0]])[0])
						.attr('cy', d => projection([d[0], d[0]])[1])
					.attr('fill', d => {
						const coordinate = [d[0], d[0]];
						const gdistance = d3.geoDistance(coordinate, projection.invert(center));
						return gdistance > 1.5 ? 'none' : 'yellowgreen';
					})
					.attr('stroke', d => {
						const coordinate = [d[0], d[0]];
						const gdistance = d3.geoDistance(coordinate, projection.invert(center));
						return gdistance > 1.5 ? 'none' : 'white';
					})
					.attr('r', 4);
				
					markerGroup.each(function () {
					this.parentNode.appendChild(this);
					});
				}

				function initSmoothies() {
					document.getElementById('net-up').style.display = 'block';
					document.getElementById('net-up').style.paddingLeft = '0px';
					document.getElementById('net-up').style.paddingRight = '0px';
	
					document.getElementById('net-down').style.display = 'block';
					document.getElementById('net-down').style.paddingLeft = '0px';
					document.getElementById('net-down').style.paddingRight = '0px';
					
	
					const smoothie = new SmoothieChart({
						grid: {
							fillStyle: 'transparent',
							borderVisible: true,
							millisPerLine: 0,
							verticalSections: 3,
						},
						tooltipLine:{strokeStyle:'#bbbbbb'},
						timestampFormatter: SmoothieChart.timeFormatter
					});

					const smoothie2 = new SmoothieChart({
						grid: {
							fillStyle: 'transparent',
							borderVisible: true,
							millisPerLine: 0,
							verticalSections: 3,
						},
						tooltipLine:{strokeStyle:'#bbbbbb'},
						timestampFormatter: SmoothieChart.timeFormatter
					});
	
				
					line1 = new TimeSeries();
					line2 = new TimeSeries();

					smoothie.addTimeSeries(line1, {lineWidth:2,strokeStyle:'yellowgreen',interpolation:'linear'});
					smoothie2.addTimeSeries(line2, {lineWidth:2,strokeStyle:'yellowgreen',interpolation:'linear'});
	
					smoothie.streamTo(document.getElementById('net-up'), 1000);
					smoothie2.streamTo(document.getElementById('net-down'), 1000);

					var width = window.innerWidth/1.244; 
					var height = window.innerWidth/8; 
					smoothie.canvas.width  = width;
					smoothie.canvas.height = height;
					smoothie2.canvas.width  = width;
					smoothie2.canvas.height = height;
					
					
					window.addEventListener('resize', event => {
						var width = window.innerWidth/1.244; 
						var height = window.innerWidth/8; 
						smoothie.canvas.width  = width;
						smoothie.canvas.height = height;
						smoothie2.canvas.width  = width;
						smoothie2.canvas.height = height;
					},false);

				}
				initSmoothies();
				
				
				async function initGlobe() {
					d3.select("#map").selectAll("*").remove();
					const dmap = document.getElementById('map');
					dmap.innerHTML = '';

					

					
					let width = d3.select("#map").node().getBoundingClientRect().width;
					let height = d3.select("#map").node().getBoundingClientRect().width;
					const sensitivity = 75;
				  
					const projection = d3.geoOrthographic()
					  .scale(window.innerWidth/2.5)
					  .center([0, 0])
					  .rotate([0,-30])
					  .translate([width / 2, height / 2])	;				  
				  
					const initialScale = projection.scale();
					let path = d3.geoPath().projection(projection);
				  
					const svg = d3.select("#map")
					  .append("svg")
					  .attr("width", width)
					  .attr("height", height)
				  
					let globe = svg.append("circle")
					  .attr("fill", "#EEE")
					  .attr("stroke", "#000")
					  .attr("stroke-width", "0.2")
					  .attr("cx", width/2)
					  .attr("cy", height/2)
					  .attr("r", initialScale)

					  svg.call(d3.drag().on('drag', () => {
						const rotate = projection.rotate()
						const k = sensitivity / projection.scale()
						projection.rotate([
						  rotate[0] + d3.event.dx * k,
						  rotate[1] - d3.event.dy * k
						])
						path = d3.geoPath().projection(projection)
						svg.selectAll("path").attr("d", path)
					  }))
						.call(d3.zoom().on('zoom', () => {
						  if(d3.event.transform.k > 0.3) {
							projection.scale(initialScale * d3.event.transform.k)
							path = d3.geoPath().projection(projection)
							svg.selectAll("path").attr("d", path)
							globe.attr("r", projection.scale())
						  }
						  else {
							d3.event.transform.k = 0.3
						  }
						}))

					let map = svg.append("g")

					var resp = await fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
				  .then(response => response.json());

					let data = resp
				  
					let countries = topojson.feature(data, data.objects.land).features
					//draw
					map.selectAll("path")
					  .data(countries)
					  .enter().append("path")
					  .attr("d", path)
					  .attr("fill", "#ccc")
					  .attr("stroke", "#000")
					  .attr("stroke-width", "0.")
					  .attr("class", "country")
										
					


					d3.timer(function(elapsed) {
						const rotate = projection.rotate()
						const k = sensitivity / projection.scale()
						projection.rotate([
						  rotate[0] - 1 * k,
						  rotate[1]
						])
						path = d3.geoPath().projection(projection)
						svg.selectAll("path").attr("d", path)
						map = svg.selectAll("g");
						drawMarkers(map, projection, [width/2, height/2]);
					},200);
						
							
						
				}

				initGlobe();
				window.addEventListener('resize', event => {
					initGlobe();
				},false);

				// Listen for messages from the extension
				window.addEventListener('message', event => {
                    var message = event.data; // The JSON data our extension sent
                    switch (message.type) {
                        case 'speed':
							var updateData = JSON.parse(message.data);
							var downmb = updateData.downmb.toFixed(2);
							var upmb = updateData.upmb;
							upmb = (upmb).toFixed(2);
							line1.append(updateData.timestamp, downmb);
							line2.append(updateData.timestamp, upmb);
							document.getElementById('ud-speed').textContent = upmb + ' Mb / ' + downmb + ' Mb';
							break;
						case 'iface':
							var updateData = JSON.parse(message.data);
							var ipv4 = updateData.ipv4;
							var iface = updateData.iface;
							//var isOnline = updateData.isOnline;
							var isOnline = window.navigator.onLine;
							var ping = updateData.ping;
							document.getElementById('ipv4').textContent = ipv4;
							document.getElementById('interface').textContent = iface;
							document.getElementById('ping').textContent = ping + ' ms';
							if (isOnline) {
								document.getElementById('state').textContent = 'ONLINE';
							} else {
								document.getElementById('state').textContent = 'OFFLINE';
							}
							break;
						case 'geo':
							var updateData = JSON.parse(message.data);
							var endpoints = updateData.endpoints;
							var elats = updateData.elats;
							var elons = updateData.elons;
							var allAddresses = updateData.allAddresses;
							var protocols = updateData.protocols;
							

							for (i = 0; i < elats.length; i++) {
								var lat = elats[i];
								var lon = elons[i];
								console.log(lat, lon);
								markerslist.push([lat, lon]);
							}

							

							//document.getElementById('endpoint').textContent = endpoints;
							break;
						
					
						}
						
					
					});


			</script>
		</div>							
	</body>
</html>

	`;

	return html;
}

function getWebviewContent() {
	var html =`
	
<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=10.0"> 
		<meta withCredentials="true">

		<title>SystemMonitor</title>
		<style>
			
			body {
			
				/*background-color: rgba(0,0,0,0);*/
				color: #d1d5da;
				font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
				font-size: 4vw;
			}
			
		</style>
		<script src="https://cdn.jsdelivr.net/npm/smoothie@1.36.1/smoothie.min.js"></script>
    </head>	
	<body>
		<style>
			.layout > div {
				max-width: 20em;
				margin-inline: auto;
				
			}
			  
			.multi-cols {
				display: grid;
				grid-template-columns: repeat( auto-fit, minmax(2em, 1fr));
			}

			.data-table {
				padding-left: 10em;
				padding-right: 10em;
				text-align: left;
			}

			hr {
				width: 20em;
			}

			#current-time {
				font-size: 6vw;
				text-align: center;
				font-weight: bold;
			}

			.point {
				width: 0.25vh;
				height: 0.25vh;
				background-color: greenyellow;
				padding: 0.05em;
				margin: .07em;
			}

			.chart {
				display: flex;
				gap: 1rem;
				max-width: 20rem;
				
			}
			  
			.chart_title {
				display: flex;
				flex-direction: column;
				flex-grow: 1;
				text-align: left;
				justify-content: center;
			}
			  
			.layout-mem > div {
				max-width: 20em;
				margin-inline: auto;
			}
			  
			.multi-cols-mem {
				display: grid;
				grid-template-columns: repeat(40, minmax(.05em, 1fr));
			}

			.bold {
				font-weight: bold;
			}
		</style>

		<div class="layout">
			<hr/>
			<div id="current-time">00:00:00</div>
			<hr/>

			<div class="multi-cols">
				<div id="year" class="bold">2024</div>
				<div class="bold">UPTIME</div>
				<div class="bold">OS</div>
				<div class="bold">POWER</div>
			</div>

			<div class="multi-cols">
				<div id="md"></div>
				<div id="uptime"></div>
				<div id="os"></div>
				<div id="power"></div>
			</div>

			<hr/>

			<div class="multi-cols">
				<div class="bold">MANUF</div>
				<div class="bold">MODEL</div>
				<div class="bold">CHASSIS</div>
				<div class="bold">ARCH</div>
			</div>

			<div class="multi-cols">
				<div id="manufacturer"></div>
				<div id="model"></div>
				<div id="chassis"></div>
				<div id="arch"></div>
			</div>
			
			<hr/>


			<div>
				<span class="bold" id="cpu">
				</span>
			</div>
			
			<div class="chart">
				<div class="chart_title">
				  <span class="bold" id="core-num-1"></span>
				  <span id="cpu-avg-1"></span>
				</div>
				<div class="chart_graph">
					<canvas id="cpu-usage1" width="200em" height="65em"></canvas>
				</div>
			</div>

			<div class="chart">
				<div class="chart_title">
				  <span class="bold" id="core-num-2"></span>
				  <span id="cpu-avg-2"></span>
				</div>
				<div>
					<canvas  class="chart_graph" id="cpu-usage2" width="200em" height="65em"></canvas>
				</div>
			</div>

			<hr/>

			<div class="multi-cols">
				<div class="bold">MIN</div>
				<div class="bold">MAX</div>
				<div class="bold">TASKS</div>
			</div>

			<div class="multi-cols">
				<div id="min"></div>
				<div id="max"></div>
				<div id="tasks"></div>
			</div>
			
			<hr/>

			<div class="multi-cols">
				<div class="bold">MEMORY</div>
				<div id="mem-gb"></div>
			</div>

			
			<div class="layout-mem">
				<div id="mem-grid" class="multi-cols-mem">
				</div>
			</div>

			<div class="multi-cols">
				<div class="bold">SWAP</div>
				<div></div>
				<div></div>
				<div id="swap-gb">0 Gb</div>
			</div>

			
			<hr/>

			

			<div id="process-monitor">
			</div>
			
			<hr/>
		</div>

		<script>
			const points = []
			function getCurrentTime() {
				const now = new Date();
				const hours = now.getHours().toString().padStart(2, '0');
				const minutes = now.getMinutes().toString().padStart(2, '0');
				const seconds = now.getSeconds().toString().padStart(2, '0');
				const timestring = hours + ":" + minutes + ':' + seconds;
				return timestring;
			}

			function setDate() {
				const now = new Date();
				document.getElementById('year').textContent = now.getFullYear().toString();
				document.getElementById('md').textContent = (now.getMonth() + 1).toString() + '/' + now.getDate().toString();
			}

			function shuffle(array) {
				let currentIndex = array.length;
			  
				// While there remain elements to shuffle...
				while (currentIndex != 0) {
			  
				  // Pick a remaining element...
				  let randomIndex = Math.floor(Math.random() * currentIndex);
				  currentIndex--;
			  
				  // And swap it with the current element.
				  [array[currentIndex], array[randomIndex]] = [
					array[randomIndex], array[currentIndex]];
				}
			}

			function init() {
				setInterval(() => {
					const currentTime = getCurrentTime();
					document.getElementById('current-time').textContent = currentTime;
				}, 1000);
				
				initSmoothies();
				setDate();

				const memGrid = document.getElementById('mem-grid');

				for (let i = 0; i < 440; i++) {
				  const newPoint = document.createElement('div');
				  newPoint.className = 'point';
				  points.push(newPoint);
				  memGrid.appendChild(newPoint);
				}

				shuffle(points);
				let i = 0;
				points.forEach(point => {
						
					i +=1;
					const randColor = '#' + Math.floor(Math.random()*16777215).toString(16);
					if (i % 2 == 0) {
						point.style.backgroundColor = 'greenyellow';
					} else {
						point.style.backgroundColor = 'grey';
					}
				});

				
			}

			function initSmoothies() {
				document.getElementById('cpu-usage1').style.display = 'block';
				document.getElementById('cpu-usage1').style.paddingLeft = '0px';
				document.getElementById('cpu-usage1').style.paddingRight = '0px';

				document.getElementById('cpu-usage2').style.display = 'block';
				document.getElementById('cpu-usage2').style.paddingLeft = '0px';
				document.getElementById('cpu-usage2').style.paddingRight = '0px';
				

				const smoothie = new SmoothieChart({
					grid: {
						fillStyle: 'rgba(0,0,0,0)',
						borderVisible: true,
						millisPerLine: 0,
						verticalSections: 0,
					}, maxValue:100,minValue:0,
				});

				const smoothie2 = new SmoothieChart({
					grid: {
						fillStyle: 'rgba(0,0,0,0)',
						borderVisible: true,
						millisPerLine: 0,
						verticalSections: 0,
					}, maxValue:100,minValue:0,
				});

                smoothie.streamTo(document.getElementById('cpu-usage1'), 1000);
				smoothie2.streamTo(document.getElementById('cpu-usage2'), 1000);

				const lines1 = [];
				const lines2 = [];
                // Listen for messages from the extension
                window.addEventListener('message', event => {
                    const message = event.data; // The JSON data our extension sent
                    switch (message.type) {
                        case 'init':
							const initData = JSON.parse(message.data);
							const manufacturer = initData.manufacturer;
							const model = initData.model;
							const chassis = initData.chassis;
							const os = initData.os;
							const hasBattery = initData.battery;
							const arch = initData.arch;
							const cpu = initData.cpu;
							const coresHalf1 = parseInt(initData.coresHalf1);
							const coresHalf2 = parseInt(initData.coresHalf2);

							const colors = ['red', 'green', 'blue', 'yellow', 'purple', 'orange', 'pink', 'cyan', 'magenta', 'brown', 'black', 'white'];

							for (let i = 0; i < coresHalf1; i++) {
								var newLine = new TimeSeries();
								lines1.push(newLine);
							}

							for (let i = 0; i < coresHalf2; i++) {
								var newLine = new TimeSeries();
								lines2.push(newLine);
							}


							for (let i = 0; i < lines1.length; i++) {
								var randomColor = '#' + Math.floor(Math.random()*16777215).toString(16);
								smoothie.addTimeSeries(lines1[i], { strokeStyle: colors[i], lineWidth: 2 });
							}

							for (let i = 0; i < lines2.length; i++) {
								var randomColor = '#' + Math.floor(Math.random()*16777215).toString(16);
								smoothie2.addTimeSeries(lines2[i], {lineWidth: 2, strokeStyle: colors[i]});
							}
							
							
							
							document.getElementById('core-num-1').textContent = "1 - " + coresHalf1;
							document.getElementById('core-num-2').textContent = (parseInt(coresHalf1) + 1) + " - " + (parseInt(coresHalf1) + parseInt(coresHalf2));

							document.getElementById('cpu').textContent = cpu;
							document.getElementById('manufacturer').textContent = manufacturer;
							document.getElementById('model').textContent = model;
							document.getElementById('chassis').textContent = chassis;
							document.getElementById('os').textContent = os;
							document.getElementById('power').textContent = hasBattery ? 'Battery' : 'AC';
							document.getElementById('arch').textContent = arch;

							// type, power, manufac, model, cpu model
                            break;
                        case 'update':
                            const updateData = JSON.parse(message.data);
							var uptime = updateData.uptime;
							const loadsAvg1 = updateData.loadsAvg1;
							const loadsAvg2 = updateData.loadsAvg2;
							const loadsHalf1 = updateData.loadsh1;
							const loadsHalf2 = updateData.loadsh2;

							for (let i = 0; i < lines1.length; i++) {
								lines1[i].append(updateData.timestamp, loadsHalf1[i]);
							}

							for (let i = 0; i < lines2.length; i++) {
								lines2[i].append(updateData.timestamp, loadsHalf2[i]);
							}

							document.getElementById('cpu-avg-1').textContent = loadsAvg1;
							document.getElementById('cpu-avg-2').textContent = loadsAvg2;
							document.getElementById('uptime').textContent = uptime;
                            break;
						case 'process':
							const processData = JSON.parse(message.data);
							const processPids = processData.processPids;
							const processNames = processData.processNames;
							const processCpu = processData.processCpus;
							const processMem = processData.processMems;
							const tasks = processData.tasks;

							document.getElementById('tasks').textContent = tasks;

							const processMonitor = document.getElementById('process-monitor');
							
							processMonitor.innerHTML = '';

							var div = document.createElement('div');
							div.className = 'multi-cols';
							var pidDiv = document.createElement('div');
							pidDiv.className = 'bold';
							pidDiv.textContent = 'PID';
							var nameDiv = document.createElement('div');
							nameDiv.className = 'bold';
							nameDiv.textContent = 'NAME';
							var cpuDiv = document.createElement('div');
							cpuDiv.className = 'bold';
							cpuDiv.textContent = 'CPU';
							var memDiv = document.createElement('div');
							memDiv.className = 'bold';
							memDiv.textContent = 'MEM';
							div.appendChild(pidDiv);
							div.appendChild(nameDiv);
							div.appendChild(cpuDiv);
							div.appendChild(memDiv);
							processMonitor.appendChild(div);

							var procsesLength = processPids.length;

							//create div
							for (let i = 0; i < procsesLength; i++) {
								var div = document.createElement('div');
								div.className = 'multi-cols';
								var pidDiv = document.createElement('div');
								pidDiv.textContent = processPids[i];
								var nameDiv = document.createElement('div');
								nameDiv.textContent = processNames[i];
								nameDiv.style.overflow = 'hidden';
								nameDiv.style.textOverflow = 'ellipsis';
								nameDiv.style.whiteSpace = 'nowrap';

								var cpuDiv = document.createElement('div');
								cpuDiv.textContent = processCpu[i];
								var memDiv = document.createElement('div');
								memDiv.textContent = processMem[i];
								div.appendChild(pidDiv);
								div.appendChild(nameDiv);
								div.appendChild(cpuDiv);
								div.appendChild(memDiv);
								processMonitor.appendChild(div);
							}
							break;
						case 'memory':
							const memoryData = JSON.parse(message.data);
							const active = memoryData.active;
							const available = memoryData.available;

							const totalGiB = memoryData.total
							const usedGiB = memoryData.used;

							const usedSwapGiB = memoryData.usedSwapGiB;
	
							// active mem
							points.slice(0, active).forEach(point => {
								point.style.backgroundColor = 'yellowgreen';
							});

							// available mem
							points.slice(active, available).forEach(point => {
								point.style.backgroundColor = 'grey';
							});

							// free mem
							points.slice(active+available, points.length).forEach(point => {
								point.style.backgroundColor = 'black';
							});

							document.getElementById('mem-gb').textContent = usedGiB + ' GB ' + " of " + totalGiB + ' GB';
							document.getElementById('swap-gb').textContent = usedSwapGiB + ' GB';

							break;
						case 'cpu':
							const cpuData = JSON.parse(message.data);
							const speedmax = cpuData.speedmax;
							const speedmin = cpuData.speedmin;
							document.getElementById('min').textContent = speedmin + ' GHz';
							document.getElementById('max').textContent = speedmax + ' GHz';
							break;
                    }
                });

				var width = window.innerWidth/1.6; 
				var height = window.innerWidth/6; 
				smoothie.canvas.width  = width;
				smoothie.canvas.height = height;
				smoothie2.canvas.width  = width;
				smoothie2.canvas.height = height;
				
				
				window.addEventListener('resize', event => {
					var width = window.innerWidth/1.6; 
					var height = window.innerWidth/6; 
					smoothie.canvas.width  = width;
					smoothie.canvas.height = height;
					smoothie2.canvas.width  = width;
					smoothie2.canvas.height = height;
					
				},false);
			}

			init();
		</script>

	</body>
</html>

	`;
	return html;
}

// Implement interval change

// This method is called when your extension is deactivated
export function deactivate() {}
