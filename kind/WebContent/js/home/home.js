var codeEditor;
var codeEditorInterp;
var propertyPattern=/--%[\s]*property\s[\s]*[a-z | 0-9 | _ | =]*[\s]*;/ig; // recognizes Lustre properties
var keyPattern=/[\s][\s]*[a-z | 0-9 | _ | =]*[\s]*;/ig;						//recognizes the name of a property

//recognizes the portion of a node that holds inputs, from the "node" keyword to the closing paren on the inputs
var inputsPattern=/node[\s | \n ]+[a-z | 0-9 | _]*[\s | \n]*\([a-z | 0-9 | _ | ; | : | , | \n]*\)/ig; 

// recognizes blocks of code containing vars, from the initial "var" keyword to the subsequent "let"
var varsPattern=/var[\s | \n]+[\n | \s |a-z | 0-9 | _ | ; | : | ,]*[\s | \n]let[\s | \n]/ig;

//recognizes the block of code containing return variables, from the "returns" keyword to the close paren
var returnsPattern=/returns[\s | \n ]+\([a-z | 0-9 | _ | ; | : | , | \n]*\)/ig;

//recognizes both comments AND properties
var commentPattern=/--.*/ig;
var defaultK = 10;  //this is the default number of columns in the interpreter table
var maxSteps = 50;  // this is the largest progress number allowed before canceling the job
var editedSinceSubmission=true; //this variable stores whether the code has been edited since it was last submitted to the server

var jobId=null;     // stores the job ID of the job currently being queried by the client
var resultsPoll=null; //stores the interval that periodically queries a job
var hash=null;        //stores the value of the url following the # mark, which should be a job ID 

/**
 * This function is responsible for setting up all the page's javascript, and is executed
 * when the document has been prepared by the browser
 */
$(document).ready(function() {
	
	hash=window.location.hash;
	initUI();
	initPreferences();
	setupEditor();
	//sometimes the editors get out of sync, so just refresh them periodically
	setInterval(function() {
		codeEditorInterp.refresh();
		codeEditor.refresh();
	},5000);
	
	/**
	 * Constantly checks to see whether the user has changed the has on the browser: if they have,
	 * retrieve the job specified by the new hash
	 */
	setInterval(function() {
		newHash=window.location.hash;
		if (newHash!=hash) {
			hash=newHash;
			getHashedJob();
		}
	},50);
	getHashedJob();
});

/**
 * If the user is coming to the page with a URL specifying a stored job, get it
 */
function getHashedJob() {
	//the user came here with a jobID
	if (hash.length>0) {
		getJob(hash.substring(1, hash.length));
	}
}

/**
 * Initiate various elements of the user interface
 */
function initUI() {
	
	$("#tabs").tabs({ hide : true,
		activate: function() {
			codeEditorInterp.refresh();
			codeEditor.refresh();
			equalizeTableWidths();
		}});
	//all icons are defined in CSS and can be viewed at http://api.jqueryui.com/theming/icons/
	$(".submit").button({
		icons: {
			primary: "ui-icon-arrowthick-1-n"
		}
	});
	$("#addColumn").button({
		icons: {
			primary: "ui-icon-plus"
		}
	});
	$("#removeColumn").button( {
		icons: {
			primary: "ui-icon-minus"
		}
	});
	
	$(".save").button( {
		icons: {
			primary: "ui-icon-disk"
		}
	})
	$(".clear").button({
		icons: {
			primary: "ui-icon-arrowthick-1-n"
		}
	});
	
	$(".undo").button({
		icons: {
			primary: "ui-icon-arrowrefresh-1-w"
		}
	});
	
	$(".redo").button({
		icons: {
			primary: "ui-icon-arrowrefresh-1-e"
		}
	});
	$(".cancel").button( {
		icons: {
			primary: "ui-icon-cancel"
		}
	});
	
	$(".undo").click(function() {
		codeEditor.undo();
	});

	$(".redo").click(function() {
		codeEditor.redo();
	});
	
	$(".cancel").click(function() {
		cancelJob();
	});
	$("#addColumn").click(function() {
		addInterpreterTableColumns(1);
	});
	$("#removeColumn").click(function() {
		removeInterpreterTableColumns(1);
	});
	
	//redo, cancel, and undo don't make sense when the user first comes to the page
	$(".redo").button("option","disabled",true);
	$(".undo").button("option","disabled",true);
	$(".cancel").button("option","disabled",true);
	$(".load").button({
		icons: {
			primary: "ui-icon-arrowthick-1-n"
		}
	});
	
	$(".save").click(function() {
		$(".save").button("option","disabled",true);
		//prevent users from spamming the save buttons
		setTimeout(function() {
			$(".save").button("option","disabled",false);
		},2000);
		saveCode();
	});
	$("#loadInterpreterTable").button({
		icons: {
			primary: "ui-icon-arrowthick-1-n"
		}
	});
	$("#loadInterpreterTable").click(function() {
		generateInterpreterTableFromCode();
	});
	
	$(".load").click(function() {
		$("#loadFile").trigger("click");
	});
	
	
	$("#submitCode").click(function() {
		$("#submitCode").button("option","disabled",true);
		//to prevent users from spamming the create job button, we disable it for two seconds after a job is sent in
		setTimeout(function() {
			$("#submitCode").button("option","disabled",false);
		},2000);
		submitJob();
	});
	$("#submitInterpreterJob").click(function() {
		$("#submitInterpreterJob").button("option","disabled",true);
		//to prevent users from spamming the create job button, we disable it for two seconds after a job is sent in
		setTimeout(function() {
			$("#submitInterpreterJob").button("option","disabled",false);
		},2000);
		submitInterpreterJob();
	});
	$(".clear").click(function() {
		codeEditor.setValue("");
	});
	
	//this event is triggered when a file gets selected
	$("#loadFile").bind("change", handleFileSelected);

	$("#kindPreferences").expandable(true);
	$(".statusField").expandable(true);
	
	$("#columnNumber").val(defaultK);
	
	$("#columnNumber").change(function() {
		setInterpreterTableColumnCount($(this).val());
	});
	$("#submitInterpreterJob").button("option","disabled",true);
	
	//bmc, pdr, and indstep are the three types of progress Kind 2 reports on
	createProgressBar("#progressBar1","bmc","bmc",0,100,"red","0.7");
	createProgressBar("#progressBar2","pdr","pdr",0,100,"green","0.7");
	createProgressBar("#progressBar3","indstep","indstep",0,100,"blue","0.7");
	$("#maxIterations").val(maxSteps);
	$("#maxIterations").change(function() {
		maxSteps=parseInt($(this).val());
	});
}



/**
 * Cancels the job that is currently running
 */
function cancelJob() {
	if (jobId!=null) {
		$.get(
				"/kind/services/cancel/"+jobId,
				function(text) {	
					//on error
					if(text=="1") {
						addToStatusConsole("ERROR: Internal error canceling job");
						return;
					}
				},
				"text"
		);
	}
	clearInterval(resultsPoll);
	resultsPoll=null;
	addToStatusConsole("ALERT: Canceling job");
	$(".cancel").button("option","disabled",true);
	setProcessingPropertiesToUnknown();
}

/**
 * Sets up functionality related to the preferences a user can select.
 */
function initPreferences() {
	$(".kindType").each(function() {
		
		//occurs when the user changes the version of Kind. It ensures the proper preferences are visible
		$(this).change(function() {
			kind=$(this).attr("id");
			$(".kindPref").hide();
			$(".kindPref[kind='"+kind+"']").show();
		});
	});
	$(".kindType").first().prop("checked,checked");
	kind=$(".kindType").first().attr("id");
	$(".kindPref").hide();
	$(".kindPref[kind='"+kind+"']").show();
	
	//.numeric() is a library call that restricts text boxes to numeric input
	$(".float").numeric();
	$(".real").numeric();
	$(".int").numeric(false, function() { alert("Integers only"); this.value = ""; this.focus(); });
}

/**
 * Adds log messages to all status consoles. New text is prepended, so it will appear at the top
 * @param text The text to add to the console.
 */
function addToStatusConsole(text) {
	$(".status").each(function() {
		$(this).val("\n "+text+$(this).val());
	});
}


/**
 * Handles printing any status messages to the status textarea
 * Status messages are defined in <Jobstatus> tags and in <log> tags.
 * xml: an xml object that may or may not have jobstatus nodes
 */
function handleStatus(xml) {
	$(xml).find("Jobstatus").each(function() {
		type=$(this).attr("msg");
		
		text=$(this).text();
		addToStatusConsole(type+": "+text);
		if (type=="completed") {
			$(".cancel").button("option","disabled",true);
			clearInterval(resultsPoll);
			setProcessingPropertiesToUnknown();
			
			//happens if the user used a hash with an job ID for a non-existant job
		} else if (type=="notfound") {
			$(".cancel").button("option","disabled",true);
			clearInterval(resultsPoll);
			setProcessingPropertiesToUnknown();
		}
	});
	$(xml).find("Log").each(function() {
		type=$(this).attr("class");
		text=$(this).text();
		addToStatusConsole(type+": "+text);
	});
}


/**
 * Gets the code that was submitted for a particular job. Results
 * and properties are also found
 * @param jobId
 */
function getJob(job) {
	clearCurrentJob();
	$.get(
			"/kind/services/getJob/"+job,
			//the "returnCode" in this case is the actual Lustre code for the job, unless there was an error
			function(returnCode) {
				if(returnCode=="1" || returnCode=="2") {
					addToStatusConsole("ERROR: Job with ID = "+job+" does not exist or has been deleted from the server");
					return;
				}
				
				codeEditor.setValue(returnCode.text);
				//we may have retrieved either a job or just code,
				//and we only do these steps if we actually got back a job
				if (returnCode.isJob) {
					jobId=job;
					findProperties();
					findAllVariables();
					if (resultsPoll!=null) {
						clearInterval(resultsPoll);
					}
					//the first time we get results, we want all of them, not just what is new
					getNewResults(true);
					resultsPoll=setInterval(function() {
						getNewResults(false);
					}, 1000);jobId=job;
					findProperties();
					findAllVariables();
					if (resultsPoll!=null) {
						clearInterval(resultsPoll);
					}
					//the first time we get results, we want all of them, not just what is new
					getNewResults(true);
					resultsPoll=setInterval(function() {
						getNewResults(false);
					}, 1000);
				}
				
			},
			"json"
	);
}

/**
 * When a file is selected, loads its contents into the code editor.
 * This will not work in older browsers, which do not support FileReader
 */
function handleFileSelected(event) {
	file = event.target.files[0];
	reader = new FileReader();
	 // Closure to capture the file information.
    reader.onloadend = (function(theFile) {
      return function(e) {
    	codeEditor.setValue(e.target.result);
      };
    })(file);
	reader.readAsText(file);
}


/**
 * Resets all variables relating to the current job and stop polling
 */
function clearCurrentJob() {
	var jobId=null;
	var inputs=null;
	var vars=null;
	var returns=null;
	if (resultsPoll!=null) {
		clearInterval(resultsPoll);
		resultsPoll=null;
	}
	
	clearProgressBars();
	$(".status").val("");
	$("#propertyTable tbody tr").remove();
	$(".cancel").button("option","disabled",true);
}

/**
 * Determines whether the given character, from a Lustre file,
 * is a valid part of a variable name or not.
 * @param char
 */

function isNormalCharacter(char) {
	if (char.trim()=="") {
		return false;
	}
	if (char==";" || char==":" || char==")" || char=="(" || char==",") {
		return false;
	}
	return true;
}

/**
 * Finds out which input variables are present in the code the user is submitting
 */
function findInputs() {
	inputs={};
	code=removeComments(codeEditor.getValue());
	x=code.match(inputsPattern);
	if (x!=null) {
		match=x[0];
		index=match.indexOf("(");
		findVariables(match,index,inputs);
	}
}

/**
 * Finds out which vars are present in the code the user is submitting
 */
function findVars() {
	vars={};
	code=removeComments(codeEditor.getValue());
	x=code.match(varsPattern);
	if (x!=null) {
		match=x[0];
		match=match.substring(3,match.length-4);
		index=match.indexOf("(");
		findVariables(match,index,vars);
	}
}

/**
 * 
 * @param varString A string to parse the variables and types out of
 * @param index The index into the string at which to start searching
 * @param varMap The dictionary to populate with <name> <type> entries
 */

function findVariables(varString,index,varMap) {
	arrayIndex=0;
	findingType=false;
	currentNames=new Array();
	for (index;index<varString.length;index++) {
		char=varString.charAt(index);
		//a colon delimits names of variables from types
		if (char==":") {
			findingType=true;
			
		//a semicolon occurs after each type
		} else if (char==";") {
			findingType=false;
		}
		//if we're at the start of a variable name
		if (isNormalCharacter(char)) {
			startIndex=index;
			for (index=index+1;index<match.length;index++) {
				char=varString.charAt(index);
				if (!isNormalCharacter(char)) {
					name=varString.substring(startIndex,index);
					if (!findingType) {
						currentNames[arrayIndex]=name;		//if we didn't just find a type, then add a new variable
						arrayIndex++;			
					} else {								//if we found a type, all the variables we just found have this type
						arrayIndex=0;
						for (x=0;x<currentNames.length;x++) {
							varMap[currentNames[x]]=name;
						}
						currentNames=new Array();
					}
					if (char==":") {
						findingType=true;
					} else if (char==";") {
						findingType=false;
					}
					break;
				}
			}
		}
	}
}


/**
 * Finds out which return values are present in the code the user is submitting
 */

function findReturns() {
	returns={};
	code=removeComments(codeEditor.getValue());
	x=code.match(returnsPattern);
	if (x!=null) {
		match=x[0];
		index=match.indexOf("(");
		findVariables(match,index,returns);
	}
}

/**
 * Finds all three types of variables -- inputs, vars, and returns
 */
function findAllVariables() {
	findInputs();
	findReturns();
	findVars();
}

function submitInterpreterJob() {
	clearCurrentJob();
	
	//populate the properties in the table on the right
	findAllVariables();
	
	//params will contain key value pairs sent to the server
	params = {};
	
	//send whatever code the user has entered
	params["code"] = codeEditor.getValue();

	//the user does not select an instance of kind for the interpreter.
	//Instead, the config file should have specified some Kind to be the one to use
	params["kind"]=$("input.kindType[interpreter=\"interpreter\"]").attr("id");	
	
	//for every input variable in the interpreter table, send all the values as a list
	$(".interpreterTable tbody tr.input").each(function() {
		values=new Array();
		name=$(this).attr("name");
		x=0;
		$(this).find("td").each(function() {
			if ($(this).find("input").first().attr("type")=="checkbox") {
				values[x]=$(this).find("input").first().prop("checked");
			} else {
				values[x]=$(this).find("input").first().val();
			}
			x=x+1;
		});
		params[name]=values;
	});
	$(".cancel").button("option","disabled",false);
	editedSinceSubmission=false;
	$.post(
			"/kind/services/interpreter",
			params,
			function(xml) {
				if(xml=="1") {
					addToStatusConsole("ERROR: Internal error posting job: please try again");
					return;
				} else if (xml=="3") {
					addToStatusConsole("ERROR: Invalid parameters");
					return;
				} else if (xml=="") {
					addToStatusConsole("ERROR: Server load too high, please try again later");
					return;
				}
				handleStatus(xml);		
				handleInterpreterResults(xml);
				handleProgress(xml);				
				
			},
			"xml"
	);
}

/**
 * Checks to see whether the given tag has an attribute defined with the given name
 * @param tag
 * @param attrName
 * @returns {Boolean}
 */
function attrDefined(tag,attrName) {
	return (typeof $(tag).attr(attrName) !== 'undefined' && $(tag).attr(attrName) !== false);
}

/**
 * Validates the value of an input object against its minimum and maximum,
 * if they are defined
 * @param inputTag The HTML input tag
 * @returns False if the value of a numeric input exceeds the specified maximum or is less
 * than the specified minimum, and true otherwise
 */

function isValid(inputTag) {
	try {
		name=$(inputTag).attr("name");
		value=$(inputTag).attr("value");
		min=$(inputTag).attr("min");
		max=$(inputTag).attr("max");
		if (attrDefined(inputTag,"min")) {
			if (!attrDefined(inputTag,"value")) {
				addToStatusConsole("ERROR: The parameter "+name +" must be given a value");
				return false;
			}
			if (parseInt(value)<parseInt(min)) {
				addToStatusConsole("ERROR: The parameter "+name +" has a minimum value of "+min);
				return false;
			}
		}
		if (attrDefined(inputTag,"max")) {
			if (!attrDefined(inputTag,"value")) {
				addToStatusConsole("ERROR: The parameter "+name +" must be given a value");
				return false;
			}
			if (parseInt(value)>parseInt(max)) {
				addToStatusConsole("ERROR: The parameter "+name +" has a maximum value of "+max);
				return false;
			}
		}
		
		return true;
	} catch (error) {
		
	}
	return false;
}
/**
 * Saves the code currently in the codeEditor on the server
 */
function saveCode() {
	params={};
	params["code"] = codeEditor.getValue();
	$.post(
			"/kind/services/saveCode",
			params,
			function(returnCode) {
				if(returnCode=="1") {
					addToStatusConsole("ERROR: Internal error saving code: please try again");
					cancelJob();
					return;
				}
				addToStatusConsole("Job saved successfully on the server. It can be retrieved by following the current link");
				$("#jobId").val(returnCode);
				jobId=returnCode;
				hash="#"+jobId;
				window.location.hash=jobId;				
			},
			"text"
	);
}

/**
 * Posts a new job to the server
 */
function submitJob() {
	var selectedKind="";
	
	params = {};
	params["code"] = codeEditor.getValue();
	$("input.kindType").each(function() {
		//find the Kind instance that is selected, first
		if ($(this).prop("checked")) {
			selectedKind=$(this).attr("id");
			params["kind"]=selectedKind;
		}
	});
	var invalid=false;
	//only look for preferences that match the selected Kind instance
	$("input.kindPref[kind=\""+selectedKind+"\"], select.kindPref[kind=\""+selectedKind+"\"").each(function() {
		if (invalid) {
			return;
		}
		name=$(this).attr("name");
		if ($(this).attr("type")=="text" || $(this).attr("type")=="select") {
			value=$(this).val();
			//if there is no value, don't include
			if (value==null || value=="") {
				return;
			}
			invalid=!isValid(this);
			if (invalid) {
				return;
			}
		} else if ($(this).attr("type")=="checkbox") {
			value=$(this).prop("checked");
			if ($(this).hasClass("unit")) {
				if (value) {
					params[name]="";
				}
				return; //don't even include a unit if it isn't true
			}
		}
		
		params[name]=value;
	});
	
	//don't allow the job to be posted if there is some invalid preference setting
	if (invalid) {
		return;
	}
	clearCurrentJob();
	//populate the properties in the table on the right
	findProperties();
	findAllVariables();
	removeComments(codeEditor.getValue());
	$(".cancel").button("option","disabled",false);
	clearInterpreterTables();
	editedSinceSubmission=false;
	$.post(
			"/kind/services/postCode",
			params,
			function(returnCode) {
				if(returnCode=="1") {
					addToStatusConsole("ERROR: Internal error posting job: please try again");
					cancelJob();
					return;
				} else if (returnCode=="3") {
					addToStatusConsole("ERROR: Invalid parameters");
					cancelJob();
					return;
				} else if (returnCode=="") {
					addToStatusConsole("ERROR: Server load too high, please try again later");
					cancelJob();
					return;
				}
				$("#jobId").val(returnCode);
				jobId=returnCode;
				hash="#"+jobId;
				window.location.hash=jobId;
				if (resultsPoll!=null) {
					clearInterval(resultsPoll);
					resultsPoll=null;
				}
				resultsPoll=setInterval(function() {
					getNewResults(false);
				}, 1000);
				
			},
			"text"
	);
}
/**
 * Initializes the code editor
 */
function setupEditor() {
	
	codeEditor = CodeMirror.fromTextArea(document.getElementById("codeEditor"), {
		mode: "lustre",
		lineNumbers: true,
		matchBrackets: true,
		lineWrapping: true
	});
	codeEditorInterp = CodeMirror.fromTextArea(document.getElementById("codeEditorInterp"), {
		mode: "lustre",
		lineNumbers: true,
		matchBrackets: true,
		lineWrapping: true
	});
	//force both editors to always have the same value, and also toggle
	//whether the undo / redo buttons should be active
	codeEditor.on("change", function(editor) {
		storedEdits=codeEditor.historySize();		
		editedSinceSubmission=true;
		if (storedEdits.undo==0) {
			$(".undo").button("option","disabled",true);
		} else {
			$(".undo").button("option","disabled",false);
		}
		if (storedEdits.redo==0) {
			$(".redo").button("option","disabled",true);
		} else {
			$(".redo").button("option","disabled",false);
		}
		if (codeEditor.getValue() != codeEditorInterp.getValue()) {
			codeEditorInterp.setValue(editor.getValue());
		}
	});
	//force both editors to always have the same value
	codeEditorInterp.on("change", function(editor) {
		
		$("#submitInterpreterJob").button("option","disabled",true);
		if (codeEditor.getValue() != codeEditorInterp.getValue()) {
			codeEditor.setValue(editor.getValue());
		}
	});
	codeEditor.setSize("100%","100%");
	codeEditorInterp.setSize("100%","100%");
	codeEditor.focus();	
}

/**
 * For every property in the table that still has the spinning "processing"
 * icon, give them the question mark icon.
 */

function setProcessingPropertiesToUnknown() {
	$("img[title=\"processing\"]").each(function() {
		$(this).attr("title","unknown");
		$(this).attr("alt","unknown");
		$(this).attr("src", "/kind/images/unknown.png");
	});
}

/**
 * Given the name of a property as it exists in code, return the name Kind
 * will give it. This mostly only applies to properties of the form
 * name=value, which Kind will name ( name = value ) 
 * @param propName
 * @returns
 */

function parsePropertyName(propName) {
	propName=propName.replace(";","").trim();
	equalsIndex=-1;
	for (strIndex=0;strIndex<propName.length;strIndex++) {
		if (propName.charAt(strIndex)=="=") {
			equalsIndex=strIndex;
			break;
		}
	}
	//if there's an equals sign, the property name has a different format
	if (equalsIndex>-1) {
		return "("+propName.substring(0,equalsIndex).trim()+" = "+propName.substring(equalsIndex+1).trim()+")";
	} else {
		return propName;
	}
}

/**
 * Parses the properties out of code entered into the code editor and places them into 
 * the properties table
 */
function findProperties() {
	code=removeComments(codeEditor.getValue());
	//x is an array containing all strings matching the property regex
	x=code.match(propertyPattern);
	//clears the property table first
	$("#propertyTable tbody tr").remove();
	
	if (x!=null) {
		//iterate through all the properties
		for (lineNumber=0;lineNumber<x.length;lineNumber++){
			line=x[lineNumber];
			key=line.match(keyPattern)[0];
			key=parsePropertyName(key);
			$("#propertyTable tbody").append("<tr><td>"+key+"</td><td><img title=\"processing\" alt=\"processing\" src=\"/kind/images/loader.gif\" class=\"icon\"></td><td></td></tr>");		}
			
			//whenever a user clicks on a cell, the corresponding variable name should be highlighted in the interpreter
			$("#propertyTable").delegate("td","click",function() {
				cursor=codeEditor.getSearchCursor(new RegExp($(this).html().trim()+"[\\s]*=", "gi"));
				cursor.findNext();
				codeEditor.focus();
				codeEditor.setCursor(cursor.from());
				codeEditor.setSelection(cursor.from(),cursor.to());
			});
	}
}

/**
 * Determines whether the given array contains the given value or not.
 * @param arr
 * @param ob
 * @returns {Boolean}
 */

function contains(arr, ob) {
	for (x=0;x<arr.length;x++) {
		if (arr[x]==ob) {
			return true;
		}
	}
	return false;
}

/**
 * Given the name string from a Property tag, return an array containing
 * all the property names in the string. Names are delimited by spaces
 * except when contained in parenthesis.
 * @param names
 * @returns
 */

function extractNames(names) {
	names=names.trim();
	nameArray=new Array();
	arrIndex=0;
	openParenCount=0;
	beginIndex=0;
	for (strIndex=0;strIndex<names.length;strIndex++) {
		char=names.charAt(strIndex);
		if (char=="(") {
			openParenCount++;
		} else if (char==")") {
			openParenCount--;
		}
		//if we are seeing whitespace and we are NOT inside parens, that means
		//we have found a gap between two variable names.
		if (char.trim()=="" && openParenCount<1) {
			nameArray[arrIndex]=names.substring(beginIndex,strIndex).trim();
			arrIndex++;
			beginIndex=strIndex+1;
		}else if (strIndex==(names.length-1)) {
			nameArray[arrIndex]=names.substring(beginIndex,names.length).trim();
		}
	}
	return nameArray;
}

/**
 * This function finds properties in the XML message returned by kind and
 * changes the propertyTable to reflect those changes. Properties are defined
 * in <Properties> tags
 * @param xml
 */
function handleProperties(xml){
	$(xml).find("Property").each(function() {
		// a property might refer to one or more names separated by spaces, so get an array of all of them
		names=extractNames($(this).attr("name"));
		result=$(this).find("Answer").text();
		K=$(this).find("K").text();
		counter=$(this).find("Counterexample"); //see if there is a counter example for this property
		//There should only be one counter example per property
		if (counter.length>0) {
			counter=counter.first();
		} else {
			counter=null;
		}
		
		runtime=$(this).find("Runtime").first();
		
		$("#propertyTable tbody tr").each(function(){
			//tableName is the name of a variable in the leftmost column of the Properties table
			tableName=$(this).children().first().html();	
				//if the property name in the table matches any property name in the XML, then these results apply in this row
				if (contains(names,tableName)) {
					$(this).children().eq(2).html(K); //put the K value in the rightmost cell
					cell=$(this).children().eq(1);    //refers to the middle cell, which stores results and the counterexample
					if (result=="valid") {
						cell.html("<img title=\"valid\" alt=\"valid\" src=\"/kind/images/checkmark.png\" class=\"icon\">");
					} else if (result=="unknown") {
						if (runtime.attr("timeout")=="true") {
							cell.html("<img title=\"timeout\" alt=\"timeout\" src=\"/kind/images/timeout.png\" class=\"icon\">");
						} else {
							cell.html("<img title=\"unknown\" alt=\"unknown\" src=\"/kind/images/unknown.png\" class=\"icon\">");
						}
					} else if (result=="falsifiable" || result=="invalid") {
						
						cell.html("<img title=\"invalid\" alt=\"invalid\" src=\"/kind/images/redx.png\" class=\"icon invalid\">");
						
						
					} else {
						cell.html("<img title=\"unknown\" alt=\"unknown\" src=\"/kind/images/unknown.png\" class=\"icon\">");
					}
					
					//if there is a counter example, store it in an invisible div in the cell so it can be read later
					if (counter!=null) {
						cell.append("<div class=\"counterexample\"></div>");
						cell.find(".counterexample").first().append(counter);
						cell.addClass("isClickable");
						cell.click(function() {
							generateInterpreterTableFromXML($(this).children(".counterexample").first(),true,1);
							$("#tabs").tabs("option", "active", 1);
							setTimeout(function() {

							},1000);
							//if there have been no edits to the source code since the submission that resulted
							//in this counter example, the user should be able to run the counter example as a job
							//immediately after loading it into the table. Otherwise, the source code and
							//counter example no longer match, and the user shouldn't be able to submit
							if (!editedSinceSubmission) {
								$("#submitInterpreterJob").button("option","disabled",false);
							}
						});
						
					}
					
				}
		});
		
	});
}
/**
 * Given a single line of code, determines whether it is a property
 * @param str
 * @returns True if the line is a property, false otherwise
 */
function isProperty(str) {
	propertyStrings=str.match(propertyPattern);
	if (propertyStrings==null || propertyStrings.length==0) {
		return false;
	} else {
		propertyIndex=str.indexOf(propertyStrings[0]);
		for (strIndex=0;strIndex<propertyIndex;strIndex++) {
			if (str.charAt(strIndex)=="-") {
				return false;
			}
		}
	}
	return true;
}

/**
 * Given some lustre code, returns the code with all comments removed
 * @param codeString The code to remove comments from
 * @returns
 */

function removeComments(codeString) {
	strippedString=codeString;
	comments=strippedString.match(commentPattern); //recognizes both comments and properties.
	if (comments==null) {
		return codeString;
	}
	for (index=0;index<comments.length;index++) {
		if (isProperty(comments[index])) {
			continue;
		} else {
			strippedString=strippedString.replace(comments[index],"");
		}
	}
	return strippedString;
}

/**
 * Sets new progress bar values based on what progress tags are present
 * in the return xml
 * @param xml An XML object that possibly contains <progress> tags
 */
function handleProgress(xml) {
	maxes={}; //stores the highest value seen for each progress bar
	$(xml).find("progress").each(function() {
		name=$(this).attr("source");
		value=parseFloat($(this).text());
		if (contains(Object.keys(maxes),name)) {
			oldValue=maxes[name];
			if (value>oldValue) {
				maxes[name]=value;
			}
		} else {
			maxes[name]=value;
		}
	});
	names=Object.keys(maxes);
	for (nameIndex=0;nameIndex<names.length;nameIndex++) {
		name=names[nameIndex];
		$("div.progressBar."+name).each(function() {
			setProgressBarValue("#"+$(this).attr("id"),maxes[name],true);
		});
		//if any amount is higher than the maximum allowed, we should cancel the job and tell the user taht
		//it is taking too long
		if (maxes[name]>maxSteps) {
			cancelJob();
			addToStatusConsole("ALERT: Job has exceeded the maximum number of allowed steps. Halting job");
		}
	}
}

/**
 * Asks the server for an XML file containing results for the current job
 * and parses them
 * If getOld is true, asks the server to retrieve all available results for the job
 * Otherwise, just gets results that have not yet been queried.
 */
function getNewResults(getOld) {
	if (jobId!=null) {	
		$.get(
				"/kind/services/getResults/"+jobId+"/"+getOld,
				function(xml) {	
					//on error
					if(xml=="1") {
						addToStatusConsole("ERROR: Internal error getting job results");
						return;
					}
					handleStatus(xml);
					handleProperties(xml);
					handleProgress(xml);
				},
				"xml"
		);
	} else {
		alert("internal error");
	}
}

/**
 * Asks the server for an XML file containing results for the current job
 * and parses them
 */
function getNewInterpreterResults() {
	if (jobId!=null) {	
		$.get(
				"/kind/services/getResults/"+jobId+"/false",
				function(xml) {	
					//on error
					if(xml=="1") {
						addToStatusConsole("ERROR: Internal error getting job results");
						return;
					}
					handleStatus(xml);					
					handleInterpreterResults(xml);
					handleProgress(xml);
				},
				"xml"
		);
	} else {
		alert("internal error");
	}
}