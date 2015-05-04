var SPACE_BAR = 32;
var WHITE = 255;
var BLACK = 0;
var LIGHT_GREEN_HEX = '#33CC33';
var LIGHT_RED_HEX = '#FF1919';
var FRAME_DISPLAY_SPEED = 300;
var FRAME_PROCESSING_SPEED = 800;
var LINE_DISPLAY_SPEED = 300;
var LINE_PROCESSING_SPEED = 20;
var MIN_PIXELS_PER_PROCESSING_INTERVAL = 734000;
var MAX_PIXELS_PER_PROCESSING_INTERVAL = 1468000;
var LOCAL_IMAGES = ["./images/tree.jpg",
                    "./images/three.png",
                    "./images/mar.jpg",
                    "./images/bird.png",
                    "./images/ballon.png",
                    "./images/a_starry_night.png",
                    "./images/Vincent_van_Gogh.png"];
             
var local_image_idx = -1; // the idx into LOCAL_IMAGES if it is being used.
                    
var whiteChance = [];
var canvas = null;
var ctx = null;
var ori_data = [];
var imageData = null;

var displayVsProcess = 0;
var displayIntervalId = null;
var displaySpeed = FRAME_DISPLAY_SPEED;

var processingIntervalId = null;
var pixelsPerProcessingInveral = 0; // will get set to quarter of the image if possible.
var processingIntervalBufferIdx = 0;
var processingSpeed = FRAME_PROCESSING_SPEED;
var toDisplay=0; // the number of pixels generated but not yet written.

var color1r; // the R component of the color1. set on init
var color1g;
var color1b;
var color2r;
var color2g;
var color2b;

var useOriColor1 = false;
var useOriColor2 = false;

var toggleProcessingButton = document.getElementById('toggleProcessingButton');

document.getElementById('originalcolorbutton1').style.width = document.getElementById('colorpicker1').offsetWidth;
document.getElementById('originalcolorbutton2').style.width = document.getElementById('colorpicker2').offsetWidth;


var ORIGINAL_COLOR_BUTTON_1 = document.getElementById("originalcolorbutton1");
var ORIGINAL_COLOR_BUTTON_2 = document.getElementById("originalcolorbutton2");
var COLOR_PICKER_1 = document.getElementById("colorpicker1");
var COLOR_PICKER_2 = document.getElementById("colorpicker2");

// imageData is flat array and every group of four indicies denotes the RGBA values for a pixel
function get_pixel_count () {
    return (imageData.data.length / 4);
}

function get_curr_row_idx () {
  return ((processingIntervalBufferIdx/4) % canvas.height);
}

function get_curr_col_idx () {
  return ((processingIntervalBufferIdx/4) / canvas.height);
}

function get_row_count () {
    return (canvas.height);
}

function get_col_count () {
    return (canvas.width);
}

// 0,0 is the first pixel
function set_processingIntervalBufferIdx (r, c) {
  processingIntervalBufferIdx = (r + (canvas.height*c) ) * 4;
}

// if spacebar is pressed in a non-edit text senario then
// toggleProcessing() and override the spacebar behavior
document.addEventListener('keyup', function(event) {
	var doPrevent = false;
	if (event.keyCode === SPACE_BAR) {
		var d = event.srcElement || event.target;
		if ((d.tagName.toUpperCase() === 'INPUT' && 
				(d.type.toUpperCase() === 'TEXT' ||
				 d.type.toUpperCase() === 'PASSWORD' || 
			   d.type.toUpperCase() === 'FILE' || 
				 d.type.toUpperCase() === 'EMAIL' || 
				 d.type.toUpperCase() === 'SEARCH' || 
				 d.type.toUpperCase() === 'DATE' )
			  ) || d.tagName.toUpperCase() === 'TEXTAREA')
	 {
			doPrevent = d.readOnly || d.disabled;
		} else {
			doPrevent = true;
		}
	}

	if (doPrevent) {
		event.preventDefault();
		toggleProcessing(false);
	}
});

function isProcessing () {
	return (processingIntervalId != null);
}

function isDrawing() {
	return (displayIntervalId != null);
}

function toggleProcessing () {
	if (isProcessing()) {
		clearInterval(processingIntervalId);
		processingIntervalId = null;
		toggleProcessingButton.value = "start";
		toggleProcessingButton.style.background = LIGHT_GREEN_HEX;
	} else {
		processingIntervalId = setInterval(function(){computeFrame(selectedDirectionFillButton == CENTER_FILL_BUTTON)}, processingSpeed);
		toggleProcessingButton.value = "stop";
		toggleProcessingButton.style.background = LIGHT_RED_HEX;
	}
	
	if (isDrawing()) {
		clearInterval(displayIntervalId);
		displayIntervalId = null;
	} else if (selectedDirectionFillButton != CENTER_FILL_BUTTON) { // if not drawing and the fill method is not frame fill then turn on the drawing interval
		displayIntervalId = setInterval(function(){drawFrame();}, displaySpeed);
	}
}

// unset the border of the colorpicker then set the border of the original color button
function setOriginalColor(x) {
    if (x == 1) { // color 1
        var picker = COLOR_PICKER_1;
        var colorButton = ORIGINAL_COLOR_BUTTON_1;
        useOriColor1 = true;
    } else { // x == 2 (color 2)
        var picker = COLOR_PICKER_2;
        var colorButton = ORIGINAL_COLOR_BUTTON_2;
        useOriColor2 = true;
    }

    colorButton.style.borderStyle = 'dashed';
    colorButton.style.borderColor = '#ff0000';

    picker.style.borderStyle = '';
    picker.style.borderColor = '';
}

// set colorpicker and unset the original color
function setColor(x) {
	if (x == 1) { // color 1
		var picker = COLOR_PICKER_1;
		var rgb = hexToRgb(picker.value);
		color1r = rgb.r;
		color1g = rgb.g;
		color1b = rgb.b;
		
		useOriColor1 = false;
		var colorButton = ORIGINAL_COLOR_BUTTON_1;
	} else { // x == 2 (color 2)
		var picker = COLOR_PICKER_2;
		var rgb = hexToRgb(picker.value);
		color2r = rgb.r;
		color2g = rgb.g;
		color2b = rgb.b;
		
		useOriColor2 = false;
		var colorButton = ORIGINAL_COLOR_BUTTON_2;
	}

	picker.style.borderStyle = 'dashed';
	picker.style.borderColor = '#ff0000';
	
	colorButton.style.borderStyle = '';
	colorButton.style.borderColor = '';
}

function set_random_image_source() {
    var tmp_idx = Math.floor(Math.random()*LOCAL_IMAGES.length);
    if (tmp_idx == local_image_idx) {
        tmp_idx = (tmp_idx + 1) % LOCAL_IMAGES.length;
    }
    local_image_idx = tmp_idx;
    
    var imgSource = LOCAL_IMAGES[local_image_idx];
    // stop the processing and display intervals. start once new image is loaded.
    // big reason to stop is because the image might fail to load
    if (isProcessing()) {
        clearInterval(processingIntervalId);
        processingIntervalId = null;
    }
    if (isDrawing()) {
        clearInterval(displayIntervalId);
        displayIntervalId = null;
    }
    
    ori_data = [];
    whiteChance = [];
    
    putImage(imgSource, false);
}

function set_image_source_from_url() {
	var imgSource = document.getElementById("image_source_textbox").value;
	if (endsIn(imgSource, ".png") || endsIn(imgSource, ".jpg") ) {
		// stop the processing and display intervals. start once new image is loaded.
		// big reason to stop is because the image might fail to load
		if (isProcessing()) {
			clearInterval(processingIntervalId);
			processingIntervalId = null;
		}
		if (isDrawing()) {
			clearInterval(displayIntervalId);
			displayIntervalId = null;
		}
		
		ori_data = [];
		whiteChance = [];
		
		putImage(imgSource, true);
	} else {
		alert("invalid image: " + imgSource);
	}
}

// a pretty simple invert: swap the values for color1 and color2
function invertImage() {
	tmp = COLOR_PICKER_1.value;
	COLOR_PICKER_1.color.fromString(COLOR_PICKER_2.value);
	COLOR_PICKER_2.color.fromString(tmp);
	
	tmp = color1r;
	color1r = color2r;
	color2r = tmp;

	tmp = color1g;
	color1g = color2g;
	color2g = tmp;

	tmp = color1b;
	color1b = color2b;
	color2b = tmp;

	// change the selected buttons for the colorpickers and original colors
	// todo clean up (note the if statements are dependent such that chaning the values in the block can incorrectly effect the evaluation of the second if
	var turnOffOriginalColorButton1 = false;
	
	// if both color pickers are selected then their isn't much to do
	if (myXor(ORIGINAL_COLOR_BUTTON_1.style.borderStyle == '', ORIGINAL_COLOR_BUTTON_2.style.borderStyle == '')) {
		if (ORIGINAL_COLOR_BUTTON_1.style.borderStyle != '') {
			ORIGINAL_COLOR_BUTTON_1.style.borderStyle = '';
			ORIGINAL_COLOR_BUTTON_1.style.borderColor = '';
			useOriColor1 = false;
			
			COLOR_PICKER_1.style.borderStyle = 'dashed';
			COLOR_PICKER_1.style.borderColor = '#ff0000';
			
			ORIGINAL_COLOR_BUTTON_2.style.borderStyle = 'dashed';
			ORIGINAL_COLOR_BUTTON_2.style.borderColor = '#ff0000';
			useOriColor2 = true;
			
			COLOR_PICKER_2.style.borderStyle = '';
			COLOR_PICKER_2.style.borderColor = '';
		} else {
			ORIGINAL_COLOR_BUTTON_1.style.borderStyle = 'dashed';
			ORIGINAL_COLOR_BUTTON_1.style.borderColor = '#ff0000';
			useOriColor1 = true;
			
			COLOR_PICKER_1.style.borderStyle = '';
			COLOR_PICKER_1.style.borderColor = '';
			
			ORIGINAL_COLOR_BUTTON_2.style.borderStyle = '';
			ORIGINAL_COLOR_BUTTON_2.style.borderColor = '';
			useOriColor2 = false;
			
			COLOR_PICKER_2.style.borderStyle = 'dashed';
			COLOR_PICKER_2.style.borderColor = '#ff0000';
		}
	}
}

/*
function drawBlackWhite() {
	if (toggle) { // NOTE toggle is always false
		//imageData.data = ori_data;
		for (var i = 0; i < imageData.data.length; ++i) {
			imageData.data[i] = ori_data[i];
		}
	} else {
		for (var startIdx = 0; startIdx < imageData.data.length; startIdx+=4) {
			// random num to check against whiteChance (invert will change the result)
			if (myXor(whiteChance[startIdx / 4] >= Math.random(), invert)) {
				imageData.data[startIdx] = color1r;
				imageData.data[startIdx+1] = color1g;
				imageData.data[startIdx+2] = color1b;
				//imageData.data[startIdx+3] = color1a;
			} else {
				imageData.data[startIdx] = color2r;
				imageData.data[startIdx+1] = color2g;
				imageData.data[startIdx+2] = color2b;
				//imageData.data[startIdx+3] = color2a;
			}
		}
	}
	ctx.putImageData(imageData, 0, 0);
	//toggle = !toggle;
}
*/

function computeFrame (doDraw) {
	// the display is too slow (either reduce the compute speed or increase the display speed)
	if (toDisplay > imageData.data.length * 2) {
		console.log("speeding up display speed");
		if (isDrawing()) { // todo maybe unnecessary
			clearInterval(displayIntervalId);
		}
		displaySpeed -= 50;
		displayIntervalId = setInterval(function(){drawFrame();}, displaySpeed);
	}
  
    updatePixelsPerProcessingInveral();
	for (var written = 0; written < pixelsPerProcessingInveral; ++written) {
		// random num to check against whiteChance. will use the "color1" or the "color2". Will then use colorpicker or original colors.
		use_color1 = (whiteChance[processingIntervalBufferIdx / 4] >= Math.random());
		if (use_color1) {
            if (useOriColor1) { // use the original image color
                imageData.data[processingIntervalBufferIdx] = ori_data[processingIntervalBufferIdx];
                imageData.data[processingIntervalBufferIdx+1] = ori_data[processingIntervalBufferIdx+1];
                imageData.data[processingIntervalBufferIdx+2] = ori_data[processingIntervalBufferIdx+2];
            } else { // use the color from the color picker
                imageData.data[processingIntervalBufferIdx] = color1r;
                imageData.data[processingIntervalBufferIdx+1] = color1g;
                imageData.data[processingIntervalBufferIdx+2] = color1b;
            }
		} else {
            if (useOriColor2) { // use the original image color
                imageData.data[processingIntervalBufferIdx] = ori_data[processingIntervalBufferIdx];
                imageData.data[processingIntervalBufferIdx+1] = ori_data[processingIntervalBufferIdx+1];
                imageData.data[processingIntervalBufferIdx+2] = ori_data[processingIntervalBufferIdx+2];
            } else { // use the color from the color picker
                imageData.data[processingIntervalBufferIdx] = color2r;
                imageData.data[processingIntervalBufferIdx+1] = color2g;
                imageData.data[processingIntervalBufferIdx+2] = color2b;
            }
		}
		
		pixelStep(); // update the processingIntervalBufferIdx
	}
	toDisplay += pixelsPerProcessingInveral;
	
	--displayVsProcess;	
	
	if(doDraw) { 
		drawFrame();
	}
}

function drawFrame () {
	// speed up the processing
	if (displayVsProcess > 2) {
		console.log("speeding up processing speed");
		if (isProcessing()) {
			clearInterval(processingIntervalId);
			processingSpeed -= 50;
			processingIntervalId = setInterval(function(){computeFrame(false)}, processingSpeed);
			displayVsProcess = 0;
		}
	}
	
	ctx.putImageData(imageData, 0, 0);
	if (toDisplay < imageData.data.length) toDisplay = 0;
	else toDisplay -= imageData.data.length;
	
	++displayVsProcess;
}

function putImage (imgSource, isWeb) {
	//console.log("in putImage");
	
	// Create an image object.  
	var image = new Image();

	// Can't do anything until the image loads.
	// Hook its onload event before setting the src property.
	image.onload = function () {
		
		if (ctx == null) {
			// Create a canvas
			canvas = document.getElementById('canvas');

			// Get the drawing context.
			ctx = canvas.getContext('2d');
		}
		
		// Get the width/height of the image and set
		// the canvas to the same size.
		var width = image.width;
		var height = image.height;

		toggleProcessingButton.style.width = width; // make the button more obvious
		canvas.width = width;
		canvas.height = height;

		// Draw the image to the canvas.
		ctx.drawImage(image, 0, 0);

		// Get the image data from the canvas, which now contains the contents of the image.
		imageData = ctx.getImageData(0, 0, width, height);

		// The actual RGBA values are stored in the data property.
		var pixelData = imageData.data;

		// Loop through every pixel - this could be slow for huge images.
		for (var startIdx = 0; startIdx < imageData.data.length; startIdx+=4) {
			// Get the alpha and if it is 0 (no color at all then set the pixel to white)
			var alpha = pixelData[startIdx + 3];
			if (alpha == 0) {
				var red = pixelData[startIdx] = WHITE;
				var green = pixelData[startIdx + 1] = WHITE;
				var blue = pixelData[startIdx + 2] = WHITE;
			} else {
				var red = pixelData[startIdx];
				var green = pixelData[startIdx + 1];
				var blue = pixelData[startIdx + 2];
			}
			pixelData[startIdx + 3] = 255; // opaque
			ori_data.push(red);
			ori_data.push(green);
			ori_data.push(blue);
			ori_data.push(255);
		
			// Convert to grayscale.
			var grayScale = (red * 0.2989) + (green * 0.5870) + (blue * 0.1140);
			whiteChance.push((255-grayScale) / 255);
		}
		
		if (isWeb) {
		    local_image_idx = -1;
		}
		
		// start the processing and display intervals.
		if (isProcessing()) {
			alert("the processing interval should not be set"); // debugging
		} else if (isDrawing()) {
			alert("the display interval should not be set"); // debugging
		} else {
			if (selectedDirectionFillButton == CENTER_FILL_BUTTON) {
				processingSpeed = FRAME_PROCESSING_SPEED;
				displaySpeed = FRAME_DISPLAY_SPEED;
				pixelsPerProcessingInveral = imageData.data.length / 4; // all the pixels
			} else {
				processingSpeed = LINE_PROCESSING_SPEED;
				displaySpeed = LINE_DISPLAY_SPEED;
				if (selectedDirectionFillButton == document.getElementById('RightFillButton') || selectedDirectionFillButton == document.getElementById('LeftFillButton') ) {
					pixelsPerProcessingInveral = canvas.height;
				} else if (selectedDirectionFillButton == document.getElementById('UpFillButton') || selectedDirectionFillButton == document.getElementById('DownFillButton') ) {
					pixelsPerProcessingInveral = canvas.width;
				} else { //} else if (selectedDirectionFillButton == document.getElementById('LeftDownFillButton') || selectedDirectionFillButton == document.getElementById('RightDownFillButton') ) {
                    // diagonal 
                    updatePixelsPerProcessingInveral();
                }
			}
			toggleProcessing();
		}
	};

	image.onerror = function () {
		console.error("Failed to load image");
		alert("I couldn't load the image.");
	}

	// Load an image to convert.
	if (imgSource == null) {
    	local_image_idx = 0;
		image.src = LOCAL_IMAGES[local_image_idx];
	} else {
		image.src = imgSource;
	}
	
	// this line helps allow loading images
	if (isWeb) {
		image.crossOrigin = ''; // no credentials flag. Same as img.crossOrigin='anonymous'
	}
	
	//console.log("out putImage");
}	

// like set_image_source_from_url but for the load image from local file.
document.getElementById('image_loader').onchange = function handleImage(e) {
	var fileName = e.target.files[0].name;
	if (endsIn(fileName, ".png") || endsIn(fileName, ".jpg")) {
		// stop the processing and display intervals. start once new image is loaded.
		// big reason to stop is because the image might fail to load
		if (isProcessing()) {
			clearInterval(processingIntervalId);
			processingIntervalId = null;
		}
		if (isDrawing()) {
			clearInterval(displayIntervalId);
			displayIntervalId = null;
		}

		ori_data = [];
		whiteChance = [];
		
		var reader = new FileReader();
		reader.onload = function (event) {
			putImage(event.target.result, false);
		}
		reader.readAsDataURL(e.target.files[0]);
	} else {
		console.log("invalid image: " + fileName);
	}
}

function main () {
    setColor(1);
    setColor(2);
    fillFrame();
    putImage(null, false);
}