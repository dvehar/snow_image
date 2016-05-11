// wrap the HTML5 canvas
export default function Canvas(rawCanvas) {
	// create a canvas
	this._canvas = rawCanvas || $('#canvas')[0];
	// get the drawing context
	this._canvasCtx = this._canvas.getContext('2d');
};

const RED_FACTOR = 0.2989;
const GREEN_FACTOR = 0.5870;
const BLUE_FACTOR = 0.1140;

Canvas.prototype.WHITE = 255;
Canvas.prototype.BLACK = 0;
Canvas.prototype.OPAQUE = 255;
Canvas.prototype.TRANSLUCENT = 0;

Canvas.prototype.getRowCount = function() {
	return this._canvas.height;
};
Canvas.prototype.getColumnCount = function() {
	return this._canvas.width;
};
Canvas.prototype.getWidth = function() {
	return this._canvas.width;
};
Canvas.prototype.getHeight = function() {
	return this._canvas.height;
};
Canvas.prototype.setWidth = function(width) {
	this._canvas.width = width;
};
Canvas.prototype.setHeight = function(height) {
	this._canvas.height = height;
};
Canvas.prototype.getContext = function(...restParams) {
	return Reflect.apply(this._canvas.getContext, this, ...restParams);
};
Canvas.prototype.drawImage = function(image) {
	return Reflect.apply(this._canvasCtx.drawImage, this, [ image, 0, 0 ]);
};
Canvas.prototype.drawImage = function(image) {
	return Reflect.apply(this._canvasCtx.drawImage, this, [ image, 0, 0 ]);
};
Canvas.prototype.getImageData = function() {
	return Reflect.apply(this._canvasCtx.getImageData, this, [ 0, 0, this._canvas.width, this._canvas.height ]);
};
Canvas.prototype.putImageData = function(image) {
	return Reflect.apply(this._canvasCtx.putImageData, this, [ image, 0, 0 ]);
};
Canvas.prototype.makePixel = function(red, green, blue, alpha) {
	return {
		red,
		green,
		blue,
		alpha
	};
};
Canvas.prototype.getPixel = function(imageData, idx) {
	return {
		red: imageData[idx],
		green: imageData[idx + 1],
		blue: imageData[idx + 2],
		alpha: imageData[idx + 3]
	};
};
Canvas.prototype.setPixel = function(imageData, idx, pixel) {
	imageData[idx] = pixel.red;
	imageData[idx + 1] = pixel.green;
	imageData[idx + 2] = pixel.blue;
	imageData[idx + 3] = pixel.alpha || imageData[idx + 3];
};
Canvas.prototype.toGreyscale = function(pixel) {
	return pixel.red * RED_FACTOR + pixel.green * GREEN_FACTOR + pixel.blue * BLUE_FACTOR;
};
