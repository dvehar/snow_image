/*
 *
 * All the filling logic is here.
 *
 */

import { randomInt } from './util';

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
		displayIntervalId = setInterval(function () {
			drawFrame();
		}, LINE_DISPLAY_SPEED);
	}

	// if the processing interval speed is not the default for the line filling functions reset it
	if (isProcessing() && processingSpeed != LINE_PROCESSING_SPEED) {
		clearInterval(processingIntervalId);
		processingIntervalId = setInterval(function () {
			computeFrame(selectedDirectionFillButton == CENTER_FILL_BUTTON);
		}, LINE_PROCESSING_SPEED);
	}
	processingSpeed = LINE_PROCESSING_SPEED;
	displaySpeed = LINE_DISPLAY_SPEED;
}

export function fillDiagonal(dir) {
	console.log(dir);
	if (selectedDirectionFillButton != document.getElementById(dir)) {
		console.log(`using ${ dir }`);
		_setFillButton(dir);
		_commonButtonChangingLogic();

		if (dir == 'LeftUpFillButton') {
			updatePixelsPerProcessingInveral = function () {};
		} else if (dir == 'RightUpFillButton') {
			updatePixelsPerProcessingInveral = function () {};
		} else if (dir == 'LeftDownFillButton') {
			updatePixelsPerProcessingInveral = function () {};
		} else {
			// 'RightDownFillButton'
			updatePixelsPerProcessingInveral = function () {
				pixelsPerProcessingInveral = Math.min(canvas.width - get_curr_col_idx(), get_curr_row_idx() + 1);
			};
			pixelStep = function () {
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

export function fillHorizontial(dir) {
	console.log(dir);
	if (selectedDirectionFillButton != document.getElementById(dir)) {
		console.log("using " + dir);
		_setFillButton(dir);
		_commonButtonChangingLogic();
		pixelsPerProcessingInveral = canvas.height;
		updatePixelsPerProcessingInveral = DO_NOTHING;

		if (dir == 'LeftFillButton') {
			pixelStep = function () {
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
			pixelStep = function () {
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

export function fillVertical(dir) {
	console.log(dir);
	if (selectedDirectionFillButton != document.getElementById(dir)) {
		console.log("using " + dir);
		_setFillButton(dir);
		_commonButtonChangingLogic();
		pixelsPerProcessingInveral = canvas.width;
		updatePixelsPerProcessingInveral = DO_NOTHING;

		if (dir == 'UpFillButton') {
			pixelStep = function () {
				processingIntervalBufferIdx -= 4;
				if (processingIntervalBufferIdx < 0) {
					processingIntervalBufferIdx = imageData.data.length + processingIntervalBufferIdx;
				}
			};
		} else {
			// 'DownFillButton'
			pixelStep = function () {
				processingIntervalBufferIdx = (processingIntervalBufferIdx + 4) % imageData.data.length;
			};
		}
	}
}

export function fillFrame() {
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
			processingIntervalId = setInterval(function () {
				computeFrame(selectedDirectionFillButton == CENTER_FILL_BUTTON);
			}, FRAME_PROCESSING_SPEED);
		}
		processingSpeed = FRAME_PROCESSING_SPEED;
		displaySpeed = FRAME_DISPLAY_SPEED;

		if (imageData != null) {
			pixelsPerProcessingInveral = get_pixel_count();
		}

		pixelStep = function () {
			processingIntervalBufferIdx = (processingIntervalBufferIdx + 4) % imageData.data.length;
		};

		updatePixelsPerProcessingInveral = DO_NOTHING;
	}
}

export function fillRandom() {
	console.log("in fill random pixel");
	if (selectedDirectionFillButton != document.getElementById('RandomPixelFillButton')) {
		console.log("using " + "RandomPixelFillButton");
		_setFillButton('RandomPixelFillButton');
		_commonButtonChangingLogic();
		updatePixelsPerProcessingInveral = DO_NOTHING;

		if (imageData != null) {
			pixelsPerProcessingInveral = Math.max(1, randomInt(get_pixel_count() / 700));
		}

		pixelStep = function () {
			set_processingIntervalBufferIdx(randomInt(get_row_count() - 1), randomInt(get_col_count() - 1));
		};
	}
}
