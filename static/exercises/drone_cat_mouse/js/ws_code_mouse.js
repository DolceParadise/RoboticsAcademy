//Editor Part
var editor = ace.edit("editor");
editor.setTheme("ace/theme/monokai");
editor.session.setMode("ace/mode/python");

// running variable for psuedo decoupling
// Play/Pause from Reset
var frequency = "0";

let bot_list = {
	'bot-easy':'bot1',
	'bot-medium':'bot2',
	'bot-advanced':'bot3',
}

//WebSocket for Code
var websocket_code_guest;
function declare_code_guest(websocket_address){
    websocket_code_guest = new WebSocket(websocket_address);

    websocket_code_guest.onopen = function(event){
		connectionUpdate({connection: 'exercise', command: 'launch_level', level: '5'}, '*');
		if (websocket_gui_guest.readyState == 1 && websocket_code.readyState == 1 && websocket_gui.readyState == 1) {
			alert("[open] Connection established!");
			connectionUpdate({connection: 'exercise', command: 'up'}, '*');
		}
    }
    websocket_code_guest.onclose = function(event){
        connectionUpdate({connection: 'exercise', command: 'down'}, '*');
        if (websocket_gui_guest.readyState == 1 && websocket_code.readyState == 1 && websocket_gui.readyState == 1) {
            if(event.wasClean){
                alert(`[close] Connection closed cleanly, code=${event.code} reason=${event.reason}`);
            }
            else{
                alert("[close] Connection closed!");
            }
        }
    }

    websocket_code_guest.onmessage = function(event){
        let source_code = event.data;
        let frequency_message;
        operation = source_code.substring(0, 5);

        if(operation == "#load"){
            editor.setValue(source_code.substring(5,));
        }
        else if(operation == "#freq"){
            frequency_message = JSON.parse(source_code.substring(5,));
			// Parse GUI and Brain frequencies
			document.querySelector("#ideal_gui_frequency").value = frequency_message.gui;
			document.querySelector('#ideal_code_frequency').value = frequency_message.brain;
            // Parse real time factor
			document.querySelector('#real_time_factor').value = frequency_message.rtf;
        }

        // Send the acknowledgment message along with frequency
        code_frequency = document.querySelector('#code_freq').value;
		gui_frequency = document.querySelector('#gui_freq').value;
        real_time_factor = document.querySelector('#real_time_factor').value;

		frequency_message = {"brain": code_frequency, "gui": gui_frequency};
		websocket_code_guest.send("#freq" + JSON.stringify(frequency_message));
    };
}

// Get the code from the server
function getCode(user){
	let path;
	let req = new XMLHttpRequest();

	// cambio exercise por exercise template que es donde se almacena en aws
	if (server !== '127.0.0.1'){
		path = window.location.protocol+'//'+server+'/academy/exercise/request/'+exercise_id+'?user='+user;
	}else{
		path = window.location.protocol+'//'+"127.0.0.1:8000"+'/academy/exercise/request/'+exercise_id+'?user='+user;
	}

	console.log('PATH: ' ,path);

	req.open("GET", path, false );
	req.send( null );

	return req.responseText;
}

// Function that sends/submits the code!
function submitCodeMouse(){
    try {
        let difficulty = $('#difficulty_selector').val();
        
        // Get the code from editor and add headers
        let python_code = getCode(bot_list[difficulty]);
        python_code = "#code\n" + python_code;
        console.log(python_code);

        websocket_code_guest.send(python_code);
        console.log("Code Sent! Check terminal for more information!");
    }
	catch (e){
		alert("Connection must be established before sending the code: ", e)
	}
}
