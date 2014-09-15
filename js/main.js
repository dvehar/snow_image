var whiteChance = [];
var canvas = null;
var ctx = null;
var ori_data = [];
var imageData = null;
var intervalId = null;
var image = null;

var toggle = false;
var invert = false;

var WHITE = 255;
var BLACK = 0;

function set_image_source() {
	var imgSource = document.getElementById("image_source_textbox").value;
	if (endsIn(imgSource, ".png")) {
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
}

function drawBlackWhite() {
	if (toggle) { // NOTE toggle is always false
		//imageData.data = ori_data;
		for (var i = 0; i < imageData.data.length; ++i) {
			imageData.data[i] = ori_data[i];
		}
	} else {
		for (var startIdx = 0; startIdx < imageData.data.length; startIdx+=4) {
			// Get the RGB values.
			if (myXor(whiteChance[startIdx / 4] >= Math.random(), invert)) {
				imageData.data[startIdx] = 0;
			} else {
				imageData.data[startIdx] = 255;
			}
			imageData.data[startIdx+2] = imageData.data[startIdx+1] = imageData.data[startIdx];
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
		
		intervalId = setInterval(function(){drawBlackWhite()}, 500);

	};

	image.onerror = function () {
		console.error("Failed to load image");
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