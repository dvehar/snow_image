// maybe try render

var toggle = false;
var invert = false;

var WHITE = 255;
var BLACK = 0;

var whiteChance = [];
var canvas = null;
var ctx = null;
var ori_data = [];
var imageData = null;
var intervalId = null;
var image = null;
var color1r = BLACK;
var color1g = BLACK;
var color1b = BLACK;
var color2r = WHITE;
var color2g = WHITE;
var color2b = WHITE;

function setColor(x) {
	if (x == 1) { // color 1
		var rgb = hexToRgb(document.getElementById("colorpicker1").value);
		color1r = rgb.r;
		color1g = rgb.g;
		color1b = rgb.b;
	} else { // x == 2 (color 2)
		var rgb = hexToRgb(document.getElementById("colorpicker2").value);
		color2r = rgb.r;
		color2g = rgb.g;
		color2b = rgb.b;
	}
}

function set_image_source() {
	var imgSource = document.getElementById("image_source_textbox").value;
	if (endsIn(imgSource, ".png") || endsIn(imgSource, ".jpg") ) {
		if (intervalId != null) {
			clearInterval(intervalId);
		}
		if (image != null) {
			//image.remove();
			image = null;
			ori_data = [];
			whiteChance = [];
		}
		
		putImage(imgSource);
	} else {
		alert("invalid image: " + imgSource);
	}
}

function invertImage() {
	invert = !invert;
	
	/*var tmp = color2;
	color2 = color1;
	color1 = tmp;*/
	
	tmp = document.getElementById("colorpicker1").value;
	document.getElementById("colorpicker1").color.fromString(document.getElementById("colorpicker2").value);
	document.getElementById("colorpicker2").color.fromString(tmp);
}

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

function putImage (imgSource) {
	console.log("in putImage");
	
	// Create an image object.  
	image = new Image();

	// Can't do anything until the image loads.
	// Hook its onload event before setting the src property.
	image.onload = function () {
		console.log("img should appear1");
		
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
				pixelData[startIdx + 3] = 255;
			} else {
				var red = pixelData[startIdx];
				var green = pixelData[startIdx + 1];
				var blue = pixelData[startIdx + 2];
			}
			ori_data.push(red);
			ori_data.push(green);
			ori_data.push(blue);
			ori_data.push(255);
			pixelData[startIdx + 3] = 255; // turn the alpha all the up so we get pure white or pure black.
		
			// Convert to grayscale.
			var grayScale = (red * 0.2989) + (green * 0.5870) + (blue * 0.1140);
			whiteChance.push((255-grayScale) / 255);
		}

		// Draw the converted image data back to the canvas.
		
		console.log("img should appear2");
		
		intervalId = setInterval(function(){drawBlackWhite()}, 300);

	};

	image.onerror = function () {
		console.error("Failed to load image");
		alert("I couldn't load the image. You can give the path to a image stored on your computer (ie /desmond/images/ball.png) or a url to an image (try to make it a https)");
	}

	// Load an image to convert.
	if (imgSource == null) {
		image.src = "https://dl.dropboxusercontent.com/u/55589692/black_white/beach_mattise.png";//"three.png"; //"https://dl.dropboxusercontent.com/u/55589692/black_white/matisse_light_dnace_interlaced.png"; //"https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/PNG_transparency_demonstration_1.png/280px-PNG_transparency_demonstration_1.png"; //"a_starry_night.png"; //"Vincent_van_Gogh.png"; //"three.png";
	} else {
		image.src = imgSource;
	}
	
	// this line helps allow loading images
	image.crossOrigin = ''; // no credentials flag. Same as img.crossOrigin='anonymous'
	
	console.log("out putImage");
}	




















/////////////////////////
// HEALPER FUNCTIONS ////
/////////////////////////

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function myXor (a,b) {
	return ( a ? 1 : 0 ) ^ ( b ? 1 : 0 );
}

function endsIn (str, toFind) {
	if (str == null || toFind == null || str == undefined || toFind == undefined ||
			str.length < toFind.length)
	{
		return false;
	} else {
		var startIdx = str.length - toFind.length;
		for (var i = 0; i < toFind.length; ++i) {
			if (str[startIdx + i] != toFind[i]) {
				return false;
			}
		}
	}
	
	return true;
}