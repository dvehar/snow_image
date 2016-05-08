import { DO_NOTHING, hexToRgb, myXor, randomInt } from './util';
import Jscolor from './jscolor-1.4.3/jscolor';

const SPACE_BAR = 32;
const WHITE = 255;
const BLACK = 0;
const LIGHT_GREEN_HEX = '#33CC33';
const LIGHT_RED_HEX = '#FF1919';
const FRAME_DISPLAY_SPEED = 300;
const FRAME_PROCESSING_SPEED = 800;
const LINE_DISPLAY_SPEED = 300;
const LINE_PROCESSING_SPEED = 20;
const MIN_PIXELS_PER_PROCESSING_INTERVAL = 734000;
const MAX_PIXELS_PER_PROCESSING_INTERVAL = 1468000;
const LOCAL_IMAGES = [
	'./images/tree.jpg',
	'./images/three.png',
	'./images/mar.jpg',
	'./images/bird.png',
	'./images/ballon.png',
	'./images/a_starry_night.png',
	'./images/Vincent_van_Gogh.png'
];

let local_image_idx = -1; // the idx into LOCAL_IMAGES if it is being used.

let whiteChance = [];
let canvas = null;
let ctx = null;
let ori_data = [];
let imageData = null;

let displayVsProcess = 0;
let displayIntervalId = null;
let displaySpeed = FRAME_DISPLAY_SPEED;

let processingIntervalId = null;
let pixelsPerProcessingInterval = 0; // will get set to quarter of the image if possible.
let processingIntervalBufferIdx = 0;
let processingSpeed = FRAME_PROCESSING_SPEED;
let toDisplay = 0; // the number of pixels generated but not yet written.

let color1r; // the R component of the color1. set on init
let color1g;
let color1b;
let color2r;
let color2g;
let color2b;

let useOriColor1 = false;
let useOriColor2 = false;

let toggleProcessingButton = $('#toggleProcessingButton')[0];

$('#originalcolorbutton1')[0].style.width = $('#colorpicker1')[0].offsetWidth;
$('#originalcolorbutton2')[0].style.width = $('#colorpicker2')[0].offsetWidth;

let ORIGINAL_COLOR_BUTTON_1 = $('#originalcolorbutton1')[0];
let ORIGINAL_COLOR_BUTTON_2 = $('#originalcolorbutton2')[0];
let COLOR_PICKER_1 = $('#colorpicker1')[0];
let COLOR_PICKER_2 = $('#colorpicker2')[0];

let pixelStep = null; // a function that determines which pixel to render next
let updatePixelsPerProcessingInterval = null; // a function that determines the number of pixels to render per processing interveral

// imageData is flat array and every group of four indicies denotes the RGBA values for a pixel
function get_pixel_count() {
	return imageData.data.length / 4;
}

function get_curr_row_idx() {
	return processingIntervalBufferIdx / 4 % canvas.height;
}

function get_curr_col_idx() {
	return processingIntervalBufferIdx / 4 / canvas.height;
}

function get_row_count() {
	return canvas.height;
}

function get_col_count() {
	return canvas.width;
}

// 0,0 is the first pixel
function set_processingIntervalBufferIdx(r, c) {
	processingIntervalBufferIdx = (r + canvas.height * c) * 4;
}

function isProcessing() {
	return processingIntervalId != null;
}

function isDrawing() {
	return displayIntervalId != null;
}

function toggleProcessing() {
	if (isProcessing()) {
		clearInterval(processingIntervalId);
		processingIntervalId = null;
		toggleProcessingButton.value = 'start';
		toggleProcessingButton.style.background = LIGHT_GREEN_HEX;
	} else {
		processingIntervalId = setInterval(() => {
			computeFrame(selectedDirectionFillButton == CENTER_FILL_BUTTON);
		}, processingSpeed);
		toggleProcessingButton.value = 'stop';
		toggleProcessingButton.style.background = LIGHT_RED_HEX;
	}

	if (isDrawing()) {
		clearInterval(displayIntervalId);
		displayIntervalId = null;
	} else if (selectedDirectionFillButton != CENTER_FILL_BUTTON) {
		// if not drawing and the fill method is not frame fill then turn on the drawing interval
		displayIntervalId = setInterval(() => {
			drawFrame();
		}, displaySpeed);
	}
}

// unset the border of the colorpicker then set the border of the original color button
function setOriginalColor(x) {
	let picker;
	let colorButton;
	if (x == 1) {
		// color 1
		picker = COLOR_PICKER_1;
		colorButton = ORIGINAL_COLOR_BUTTON_1;
		useOriColor1 = true;
	} else {
		// x == 2 (color 2)
		picker = COLOR_PICKER_2;
		colorButton = ORIGINAL_COLOR_BUTTON_2;
		useOriColor2 = true;
	}

	colorButton.style.borderStyle = 'dashed';
	colorButton.style.borderColor = '#ff0000';

	picker.style.borderStyle = '';
	picker.style.borderColor = '';
}

// set colorpicker and unset the original color
function setColor(x) {
	let picker;
	let rgb;
	let colorButton;
	if (x == 1) {
		// color 1
		picker = COLOR_PICKER_1;
		rgb = hexToRgb(picker.value);
		color1r = rgb.r;
		color1g = rgb.g;
		color1b = rgb.b;

		useOriColor1 = false;
		colorButton = ORIGINAL_COLOR_BUTTON_1;
	} else {
		// x == 2 (color 2)
		picker = COLOR_PICKER_2;
		rgb = hexToRgb(picker.value);
		color2r = rgb.r;
		color2g = rgb.g;
		color2b = rgb.b;

		useOriColor2 = false;
		colorButton = ORIGINAL_COLOR_BUTTON_2;
	}

	picker.style.borderStyle = 'dashed';
	picker.style.borderColor = '#ff0000';

	colorButton.style.borderStyle = '';
	colorButton.style.borderColor = '';
}

function set_random_image_source() {
	let tmp_idx = Math.floor(Math.random() * LOCAL_IMAGES.length);
	if (tmp_idx == local_image_idx) {
		tmp_idx = (tmp_idx + 1) % LOCAL_IMAGES.length;
	}
	local_image_idx = tmp_idx;

	let imgSource = LOCAL_IMAGES[local_image_idx];
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
	let imgSource = $('#image_source_textbox')[0].value;
	if (imgSource.endsWith('.png') || imgSource.endsWith('.jpg')) {
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
		alert('invalid image: ' + imgSource);
	}
}

// a pretty simple invert: swap the values for color1 and color2
function invertImage() {
	let tmp = COLOR_PICKER_1.value;

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
	let turnOffOriginalColorButton1 = false;

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
		for (let i = 0; i < imageData.data.length; ++i) {
			imageData.data[i] = ori_data[i];
		}
	} else {
		for (let startIdx = 0; startIdx < imageData.data.length; startIdx+=4) {
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

function computeFrame(doDraw) {
	// the display is too slow (either reduce the compute speed or increase the display speed)
	if (toDisplay > imageData.data.length * 2) {
		console.log('speeding up display speed');
		if (isDrawing()) {
			// todo maybe unnecessary
			clearInterval(displayIntervalId);
		}
		displaySpeed -= 50;
		displayIntervalId = setInterval(() => {
			drawFrame();
		}, displaySpeed);
	}

	updatePixelsPerProcessingInterval();
	for (let written = 0; written < pixelsPerProcessingInterval; ++written) {
		// random num to check against whiteChance. will use the 'color1' or the 'color2'. Will then use colorpicker or original colors.
		let use_color1 = whiteChance[processingIntervalBufferIdx / 4] >= Math.random();
		if (use_color1) {
			if (useOriColor1) {
				// use the original image color
				imageData.data[processingIntervalBufferIdx] = ori_data[processingIntervalBufferIdx];
				imageData.data[processingIntervalBufferIdx + 1] = ori_data[processingIntervalBufferIdx + 1];
				imageData.data[processingIntervalBufferIdx + 2] = ori_data[processingIntervalBufferIdx + 2];
			} else {
				// use the color from the color picker
				imageData.data[processingIntervalBufferIdx] = color1r;
				imageData.data[processingIntervalBufferIdx + 1] = color1g;
				imageData.data[processingIntervalBufferIdx + 2] = color1b;
			}
		} else {
			if (useOriColor2) {
				// use the original image color
				imageData.data[processingIntervalBufferIdx] = ori_data[processingIntervalBufferIdx];
				imageData.data[processingIntervalBufferIdx + 1] = ori_data[processingIntervalBufferIdx + 1];
				imageData.data[processingIntervalBufferIdx + 2] = ori_data[processingIntervalBufferIdx + 2];
			} else {
				// use the color from the color picker
				imageData.data[processingIntervalBufferIdx] = color2r;
				imageData.data[processingIntervalBufferIdx + 1] = color2g;
				imageData.data[processingIntervalBufferIdx + 2] = color2b;
			}
		}

		pixelStep(); // update the processingIntervalBufferIdx
	}
	toDisplay += pixelsPerProcessingInterval;

	--displayVsProcess;

	if (doDraw) {
		drawFrame();
	}
}

function drawFrame() {
	// speed up the processing
	if (displayVsProcess > 2) {
		console.log('speeding up processing speed');
		if (isProcessing()) {
			clearInterval(processingIntervalId);
			processingSpeed -= 50;
			processingIntervalId = setInterval(() => {
				computeFrame(false);
			}, processingSpeed);
			displayVsProcess = 0;
		}
	}

	ctx.putImageData(imageData, 0, 0);
	if (toDisplay < imageData.data.length) toDisplay = 0;else toDisplay -= imageData.data.length;

	++displayVsProcess;
}

function putImage(imgSource, isWeb) {
	//console.log('in putImage');

	// Create an image object.
	let image = new Image();

	// Can't do anything until the image loads.
	// Hook its onload event before setting the src property.
	image.onload = () => {

		if (ctx == null) {
			// Create a canvas
			canvas = $('#canvas')[0];

			// Get the drawing context.
			ctx = canvas.getContext('2d');
		}

		// Get the width/height of the image and set
		// the canvas to the same size.
		let width = image.width;
		let height = image.height;

		toggleProcessingButton.style.width = width; // make the button more obvious
		canvas.width = width;
		canvas.height = height;

		// Draw the image to the canvas.
		ctx.drawImage(image, 0, 0);

		// Get the image data from the canvas, which now contains the contents of the image.
		imageData = ctx.getImageData(0, 0, width, height);

		// The actual RGBA values are stored in the data property.
		let pixelData = imageData.data;

		// Loop through every pixel - this could be slow for huge images.
		for (let startIdx = 0; startIdx < imageData.data.length; startIdx += 4) {
			// Get the alpha and if it is 0 (no color at all then set the pixel to white)
			let red;
			let green;
			let blue;
			let alpha = pixelData[startIdx + 3];
			if (alpha === 0) {
				red = pixelData[startIdx] = WHITE;
				green = pixelData[startIdx + 1] = WHITE;
				blue = pixelData[startIdx + 2] = WHITE;
			} else {
				red = pixelData[startIdx];
				green = pixelData[startIdx + 1];
				blue = pixelData[startIdx + 2];
			}
			pixelData[startIdx + 3] = 255; // opaque
			ori_data.push(red);
			ori_data.push(green);
			ori_data.push(blue);
			ori_data.push(255);

			// Convert to grayscale.
			let grayScale = red * 0.2989 + green * 0.5870 + blue * 0.1140;
			whiteChance.push((255 - grayScale) / 255);
		}

		if (isWeb) {
			local_image_idx = -1;
		}

		// start the processing and display intervals.
		if (isProcessing()) {
			alert('the processing interval should not be set'); // debugging
		} else if (isDrawing()) {
				alert('the display interval should not be set'); // debugging
			} else {
					if (selectedDirectionFillButton == CENTER_FILL_BUTTON) {
						processingSpeed = FRAME_PROCESSING_SPEED;
						displaySpeed = FRAME_DISPLAY_SPEED;
						pixelsPerProcessingInterval = imageData.data.length / 4; // all the pixels
					} else {
							processingSpeed = LINE_PROCESSING_SPEED;
							displaySpeed = LINE_DISPLAY_SPEED;
							if (selectedDirectionFillButton == $('#RightFillButton')[0] || selectedDirectionFillButton == $('#LeftFillButton')[0]) {
								pixelsPerProcessingInterval = canvas.height;
							} else if (selectedDirectionFillButton == $('#UpFillButton')[0] || selectedDirectionFillButton == $('#DownFillButton')[0]) {
								pixelsPerProcessingInterval = canvas.width;
							} else {
								//} else if (selectedDirectionFillButton == $('#LeftDownFillButton') || selectedDirectionFillButton == $('#RightDownFillButton') ) {
								// diagonal
								updatePixelsPerProcessingInterval();
							}
						}
					toggleProcessing();
				}
	};

	image.onerror = () => {
		console.error('Failed to load image');
		alert('I couldn\'t load the image.');
	};

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

	//console.log('out putImage');
}

var CENTER_FILL_BUTTON = document.getElementById('FrameFillButton');
var selectedDirectionFillButton = null;

function _setFillButton(id) {
	// reset previous button
	if (selectedDirectionFillButton != null) {
		selectedDirectionFillButton.style.borderStyle = '';
		selectedDirectionFillButton.style.borderColor = '';
	}

	// set new button
	selectedDirectionFillButton = document.getElementById(id);
	selectedDirectionFillButton.style.borderStyle = 'dashed';
	selectedDirectionFillButton.style.borderColor = '#ff0000';
}

// used by up, down, right, and left
// it is also currently used by random pixel
function _commonButtonChangingLogic() {
	// if the drawing speed doesn't match the initial speed for the line filling functions
	// or the drawing interval is not yet set
	// then reset the drawing interval
	if (displaySpeed != LINE_DISPLAY_SPEED && isDrawing() || !isDrawing() && isProcessing()) {
		clearInterval(displayIntervalId);
		displayIntervalId = setInterval(() => {
			drawFrame();
		}, LINE_DISPLAY_SPEED);
	}

	// if the processing interval speed is not the default for the line filling functions reset it
	if (isProcessing() && processingSpeed != LINE_PROCESSING_SPEED) {
		clearInterval(processingIntervalId);
		processingIntervalId = setInterval(() => {
			computeFrame(selectedDirectionFillButton == CENTER_FILL_BUTTON);
		}, LINE_PROCESSING_SPEED);
	}
	processingSpeed = LINE_PROCESSING_SPEED;
	displaySpeed = LINE_DISPLAY_SPEED;
}

function fillDiagonal(dir) {
	console.log(dir);
	if (selectedDirectionFillButton != document.getElementById(dir)) {
		console.log(`using ${ dir }`);
		_setFillButton(dir);
		_commonButtonChangingLogic();

		if (dir == 'LeftUpFillButton') {
			updatePixelsPerProcessingInterval = () => {};
		} else if (dir == 'RightUpFillButton') {
			updatePixelsPerProcessingInterval = () => {};
		} else if (dir == 'LeftDownFillButton') {
			updatePixelsPerProcessingInterval = () => {};
		} else {
			// 'RightDownFillButton'
			updatePixelsPerProcessingInterval = () => {
				pixelsPerProcessingInterval = Math.min(canvas.width - get_curr_col_idx(), get_curr_row_idx() + 1);
			};
			pixelStep = () => {
				var curr_col = get_curr_col_idx();
				var curr_row = get_curr_row_idx();
				if (curr_row == canvas.height - 1 && curr_col == canvas.width - 1) {
					set_processingIntervalBufferIdx(0, 0);
				} else if (curr_row == 0 && curr_col < canvas.width - 1) {
					set_processingIntervalBufferIdx(curr_col + 1, 0);
				} else if (curr_col == canvas.width - 1) {
					set_processingIntervalBufferIdx(curr_col, curr_row + 1);
				} else {
					set_processingIntervalBufferIdx(curr_row - 1, curr_col + 1);
				}
			};
		}
	}
}

function fillHorizontial(dir) {
	console.log(dir);
	if (selectedDirectionFillButton != document.getElementById(dir)) {
		console.log("using " + dir);
		_setFillButton(dir);
		_commonButtonChangingLogic();
		pixelsPerProcessingInterval = canvas.height;
		updatePixelsPerProcessingInterval = DO_NOTHING;

		if (dir == 'LeftFillButton') {
			pixelStep = () => {
				if (processingIntervalBufferIdx == 0) {
					processingIntervalBufferIdx = imageData.data.length - 4;
				} else {
					var tmp = processingIntervalBufferIdx - canvas.width * 4;
					if (tmp < 0) {
						processingIntervalBufferIdx = processingIntervalBufferIdx + canvas.width * 4 * (canvas.height - 1) - 4;
					} else {
						processingIntervalBufferIdx = tmp;
					}
				}
			};
		} else {
			// 'RightFillButton'
			pixelStep = () => {
				processingIntervalBufferIdx += canvas.width * 4;
				if (processingIntervalBufferIdx >= imageData.data.length) {
					if (processingIntervalBufferIdx == imageData.data.length - 1) {
						// need to go back to 0
						processingIntervalBufferIdx = 0;
					} else {
						processingIntervalBufferIdx = processingIntervalBufferIdx % imageData.data.length + 4;
					}
				}
			};
		}
	}
}

function fillVertical(dir) {
	console.log(dir);
	if (selectedDirectionFillButton != document.getElementById(dir)) {
		console.log("using " + dir);
		_setFillButton(dir);
		_commonButtonChangingLogic();
		pixelsPerProcessingInterval = canvas.width;
		updatePixelsPerProcessingInterval = DO_NOTHING;

		if (dir == 'UpFillButton') {
			pixelStep = () => {
				processingIntervalBufferIdx -= 4;
				if (processingIntervalBufferIdx < 0) {
					processingIntervalBufferIdx = imageData.data.length + processingIntervalBufferIdx;
				}
			};
		} else {
			// 'DownFillButton'
			pixelStep = () => {
				processingIntervalBufferIdx = (processingIntervalBufferIdx + 4) % imageData.data.length;
			};
		}
	}
}

function fillFrame() {
	console.log("in fill frame");
	if (selectedDirectionFillButton != document.getElementById('FrameFillButton')) {
		console.log("using " + "FrameFillButton");
		_setFillButton('FrameFillButton');

		if (isDrawing()) {
			// the drawing is called after each frame is processed rather than on an interval
			clearInterval(displayIntervalId);
			displayIntervalId = null;
		}
		if (isProcessing() && processingSpeed != FRAME_PROCESSING_SPEED) {
			// if the interval is set to the incorrect speed restart it
			clearInterval(processingIntervalId);
			processingIntervalId = setInterval(() => {
				computeFrame(selectedDirectionFillButton == CENTER_FILL_BUTTON);
			}, FRAME_PROCESSING_SPEED);
		}
		processingSpeed = FRAME_PROCESSING_SPEED;
		displaySpeed = FRAME_DISPLAY_SPEED;

		if (imageData != null) {
			pixelsPerProcessingInterval = get_pixel_count();
		}

		pixelStep = () => {
			processingIntervalBufferIdx = (processingIntervalBufferIdx + 4) % imageData.data.length;
		};

		updatePixelsPerProcessingInterval = DO_NOTHING;
	}
}

function fillRandom() {
	console.log("in fill random pixel");
	if (selectedDirectionFillButton != document.getElementById('RandomPixelFillButton')) {
		console.log("using " + "RandomPixelFillButton");
		_setFillButton('RandomPixelFillButton');
		_commonButtonChangingLogic();
		updatePixelsPerProcessingInterval = DO_NOTHING;

		if (imageData != null) {
			pixelsPerProcessingInterval = Math.max(1, randomInt(get_pixel_count() / 700));
		}

		pixelStep = () => {
			set_processingIntervalBufferIdx(randomInt(get_row_count() - 1), randomInt(get_col_count() - 1));
		};
	}
}









// like set_image_source_from_url but for the load image from local file.
$('#image_loader')[0].onchange = e => {
	let fileName = e.target.files[0].name;
	if (fileName.endsWith('.png') || fileName.endsWith('.jpg')) {
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

		let reader = new FileReader();
		reader.onload = event => {
			putImage(event.target.result, false);
		};
		reader.readAsDataURL(e.target.files[0]);
	} else {
		console.log(`invalid image: ${fileName}`);
	}
};

$(document).ready(() => {
	$('#fetchImageFromURLButton').click(() => {
		set_image_source_from_url();
	});
	$('#FetchRandomImage').click(() => {
		set_random_image_source();
	});

	$('#toggleProcessingButton').click(() => {
		toggleProcessing();
	});

	$('#colorpicker1').change(() => {
		setColor(1);
	});
	$('#colorpicker2').change(() => {
		setColor(2);
	});

	$('#invertImageButton').click(() => {
		invertImage();
	});

	$('#originalcolorbutton1').click(() => {
		setOriginalColor(1);
	});
	$('#originalcolorbutton2').click(() => {
		setOriginalColor(2);
	});

	$('#LeftUpFillButton').click(() => {
		fillDiagonal('LeftUpFillButton');
	});
	$('#UpFillButton').click(() => {
		fillVertical('UpFillButton');
	});
	$('#RightUpFillButton').click(() => {
		fillDiagonal('RightUpFillButton');
	});
	$('#LeftFillButton').click(() => {
		fillHorizontial('LeftFillButton');
	});
	$('#FrameFillButton').click(() => {
		fillFrame('FrameFillButton');
	});
	$('#RightFillButton').click(() => {
		fillHorizontial('RightFillButton');
	});
	$('#LeftDownFillButton').click(() => {
		fillDiagonal('LeftDownFillButton');
	});
	$('#DownFillButton').click(() => {
		fillVertical('DownFillButton');
	});
	$('#RightDownFillButton').click(() => {
		fillDiagonal('RightDownFillButton');
	});

	$('#RandomPixelFillButton').click(() => {
		fillRandom();
	});


	// if spacebar is pressed in a non-edit text senario then
	// toggleProcessing() and override the spacebar behavior
	$(document).keydown(e => {
		if (event.keyCode === SPACE_BAR && e.target === document.body) {
			event.preventDefault();
			toggleProcessing(false);
		}
	});
	
	Jscolor.install();
	setColor(1);
	setColor(2);
	fillFrame();
	putImage(null, false);
});
