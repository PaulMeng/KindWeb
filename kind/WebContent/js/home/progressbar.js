/*
 * This file contains functions for making and manipulating progress bars
 */

/**
 * Makes a progress bar out of the div with the given id. The
 * bar will have a logarithmic scale
 * @param name The name that the progress bar should be given
 * @param id The id of the div to make into a progress bar
 * @param max The maximum value for the progress bar
 * @param startValue The starting value of the progress bar
 * @param color The color of the progress fill
 * @param opacity The opacity of the progress fill.
 */
function createProgressBar(id,displayName,progressTagName,startValue,maxValue,color,opacity) {
	if (startValue<1) {
		startValue=1;
	}
	$(id +" div.progressLabel").text(displayName);
	$(id).progressbar( {
		value:Math.log(startValue),
		max: Math.log(maxValue)
	});
	$(id).height(10);
	$(id).addClass(progressTagName);
	$(id+" > div:not(.progressLabel)").css("background",color);
	$(id+" > div:not(.progressLabel)").css("opacity",opacity);
}

/**
 * Sets the value of the given progress bar, which should 
 * already have been initiated.
 * @param id The id of the progress bar div
 * @param value The new value to use. A logarithmic scale is used
 * @param retainMax If true, will not reduce the current value of the progress bar
 */

function setProgressBarValue(id,value,retainMax) {
	if (value<1) {
		value=1;
	}
	if (retainMax) {
		curValue=parseFloat($(id).progressbar("value",Math.log(value)));
		newValue=Math.log(value);
		if (curValue>newValue) {
			return;
		}
	}
	$(id).progressbar("value",Math.log(value));
	$(id).attr("title",value);
}

function completeProgressBars() {
	$(".progressBar").each(function() {
		$(this).progressbar("value",1000000); //just use a very large number-- it will never overflow
	});
}

/**
 * Sets the value of every progress bar to 0
 */

function clearProgressBars() {
	$(".progressBar").progressbar("value",0);
}

/**
 * Removes every progress bar from view
 */

function hideProgressBars() {
	$(".progressBar").hide();
}

/**
 * Shows every progress bar.
 */

function showProgressBars() {
	$(".progressBar").show();
}