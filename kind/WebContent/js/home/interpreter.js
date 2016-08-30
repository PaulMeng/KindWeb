/**
 * This file contains functions used to build the interpreter table
 */
// these vars should be set whenever the user submits a job or retrieves one from the server
var inputs=null;   //stores a mapping of names to types for all input variables in the current code
var vars=null;     //stores a mapping of names to types for all "var" variables in the current code
var returns=null;  //stores a mapping of names to types for all return values in the current code



var streamXMLTag="Stream";
var valueXMLTag="Value";
var valueXMLAttr="State";
var nodeXMLTag="Node";
/**
 * Get rid of all the rows currently in the interpreter table
 */
function clearInterpreterTables() {
	$(".interpreterTable").remove();	
}

function makeInterpreterTable(name) {
	$("#interpreterTableDiv").append('<table name="'+name+'" class="interpreterTable"><thead></thead><tbody></tbody></table>');
}

/**
 * Adds a header row to the interpreter table
 * @param K The number of k values (columns) to show
 */

function addHeaderRow(K,table,name) {
	$(table).find("thead").append("<tr class=\"spanningHeader\"></tr>");
	//K+1 colspan because we have 1 column for each K value plus 1 extra column for the variable names
	$(table).find("thead tr").last().append("<th colspan=\""+(K+1)+"\"class=\"spanningHeadCol\">Node: "+name+"</th>");
	
	
	
	$(table).find("thead").append("<tr class=\"header\"></tr>");
	$(table).find("thead tr").last().append("<th class=\"headcol\">K</th>");
	for (x=0;x<K;x++) {
		$(table).find("thead tr").last().append("<th>"+(x+1)+"</th>");
	}
}
/**
 * Adds a new row to the table that simply has a name in the leftmost column
 * and then blank cells to the rights
 * @param K
 */

function addTitleRow(name, K,table) {
	$(table).find("tbody").append("<tr class=\"title\"></tr>");
	row=$(table).find("tbody tr").last();
	row.append("<td class=\"headcol\">"+name+"s</td>");
	for (index=0;index<K;index++) {
		row.append("<td></td>");
	}
}

/**
 * Prevents users from interacting with readonly inputs, not all of which support being readonly
 */
function attachClickEvents() {
	//unbind first, as otherwise the events stack up and are called multiple times per click
	$(".interpreterTable td.stream").unbind();	
	$("input[readonly=\"readonly\"]").unbind();
	$("input[readonly=\"readonly\"]").click(function(e) {
		e.preventDefault();
	});
	$("input[readonly=\"readonly\"]").mousedown(function(e) {
		e.preventDefault();
	});
	$(".float").numeric();
	$(".int").numeric(false, function() { alert("Integers only"); this.value = ""; this.focus(); });
	$(".real").numeric();
	//adds a function allowing users to click on a stream and be directed to the variable in the code
	$(".interpreterTable td.stream").click(function() {
		name=$(this).attr("name");
		cursor=codeEditorInterp.getSearchCursor(new RegExp($(this).attr("name")+"[: | , | \\s | ; | \\n][\\s]*=", "gi"));
		cursor.findNext();
		codeEditorInterp.focus();
		codeEditorInterp.setCursor(cursor.from());
		codeEditorInterp.setSelection(cursor.from(),cursor.to());
	});
}

/**
 * Adds a new row to the table for some variable
 * @param name The name of the variable
 * @param type The type of the variable ("int", "bool", etc.)
 * @param varClass Whether we're dealing with an input, a return, or a var
 * @param readonly Whether to make the variable read only or not
 * @param K How many columns to add to the table
 */

function addStreamRow(name,type,varClass,readonly, K,table) {
	$(table).find("tbody").append("<tr class=\"stream "+varClass+"\" name=\""+name+"\" type=\""+type+"\"></tr>");
	row=$(table).find("tbody tr").last();
	rowString="";
	//the "INPUT: prefix is required by the server to find the input!
	if (varClass=="input") {
		rowString=rowString+"<td name=\""+name+"\" class=\"headcol stream\"><input value=\"INPUT:"+name+"\" type=\"hidden\"/>"+name+": "+type+"</td>";
	} else {
		rowString=rowString+"<td name=\""+name+"\" class=\"headcol stream\">"+name+": "+type+"</td>";

	}
	
	//bools have checkboxes, while other types have textboxes 
	if (type=="bool") {
		for (y=0;y<K;y++) {
			if (readonly) {
				rowString=rowString+"<td><input readonly=\"readonly\" name=\""+name+"\" type=\"checkbox\"/></td>";
			} else {
				rowString=rowString+"<td><input name=\""+name+"\" type=\"checkbox\"/></td>";
			}
			
		}
	} else {
		for (y=0;y<K;y++) {
			if (readonly) {
				rowString=rowString+"<td><input readonly=\"readonly\" value=\"0\" class=\"textbox "+type+"\" name=\""+name+"\" type=\"textbox\"/></td>";

			} else {
				rowString=rowString+"<td><input value=\"0\" class=\"textbox "+type+"\" name=\""+name+"\" type=\"textbox\"/></td>";
			}	
		}
	}
	row.append(rowString);
}

/**
 * Given a certain stream and its values, populate the row in the table corresponding to the stream with its values
 * @param name The name of the stream
 * @param type The type of the stream (bool, int, etc.)
 * @param values The values the stream should be given, with the first value being the one for K=1 and so on
 */

function populateStreamRow(name,type,values,table) {

	row=$(table).find("tr[name='"+name+"']");
	for (index=0;index<values.length;index++) {
		time=index;
		//there is one extra  input in input rows, so it needs to be accounted for
		if ($(row).hasClass("input")) {
			time=time+1;
		}
		if (type=="bool") {
			boolValue=values[index].toLowerCase();
			if (boolValue=="true" || boolValue=="1") {
				$(row).find("input:eq("+time+")").prop("checked",true);
			} else {
				$(row).find("input:eq("+time+")").prop("checked",false);
			}
		} else {
			$(row).find("input:eq("+time+")").val(values[index]);
		}
	};
}

function getTableByName(name) {
	curTable=$(".interpreterTable[name='"+name+"']");
	return curTable;
}

function getTableName(nodeXMLTag) {
	name=$(nodeXMLTag).attr("name");
	line=$(nodeXMLTag).attr("line");
	column=$(nodeXMLTag).attr("column");
	if (typeof line != 'undefined' && typeof column != 'undefined') {
		name=name+":"+line+":"+column;
	} 
	return name;
}

/**
 * Generates the interpreter table for the interpreter tab using a counter example
 * Interpeter tables display inputs, then returns, then vars.
 * @param counterExample The counter example xml object
 * @param hasValues {Boolean} True if the XML contains values for each stream that should be used, false if 
 * 								   the XML does not have values and the table should be populated with only default values
 * @param minK {Integer} The minimum K value to give each table. A greater K may be used if specified in the XML
 */

function generateInterpreterTableFromXML(counterExample,hasValues,minK) {
	clearInterpreterTables();
	//first, set up the header using the array of values
	K=minK;
	$(counterExample).find(streamXMLTag).each(function() {
		K=Math.max(K,$(this).find(valueXMLTag).length);
	});
	//Get the maximum number of columns that we have for and stream
	setInterpreterTableColumnCount(K);
	setColumnCountTextInput(K);
	$(counterExample).find(nodeXMLTag).each(function() {
		//each node gets its own table
		name=getTableName(this);
		topNode=false;
		if ($(this).parent().prop("tagName")=="Execution" || $(this).parent().prop("tagName")=="Counterexample") {
			topNode=true;
		}

		makeInterpreterTable(name);
		//this is the table we just made 
		table=$("#interpreterTableDiv").find(".interpreterTable").last();
		

		addHeaderRow(K,table,name);
		addTitleRow("input",K,table);
		$(this).children(streamXMLTag).each(function() {
			name=$(this).attr("name");
			type=$(this).attr("type");
			
			//if this variable  is actually an input, add it. Otherwise, skip it, as
			//it will be added further down the table
			if ($(this).attr("class")=="input") {
				//only inputs in the Top node are true inputs (as in, only they are sent to the server and are editable)
				if (topNode) {
					addStreamRow(name,$(this).attr("type"),"input",false,K,table);
				} else {
					addStreamRow(name,$(this).attr("type"),"var",true,K,table);

				}
				if (hasValues) {
					values=new Array();
					valIndex=0;
					$(this).find(valueXMLTag).each(function() {
						values[valIndex]=$(this).text();
						valIndex++;
					});
					
					populateStreamRow(name,type,values,table);
				}
				
			}
		});
		addTitleRow("output",K,table);
		$(this).children(streamXMLTag).each(function() {
			name=$(this).attr("name");
			type=$(this).attr("type");
			
			//only add return values
			if ($(this).attr("class")=="output") {
				addStreamRow(name,$(this).attr("type"),"output",true,K,table);
				if (hasValues) {
					values=new Array();
					valIndex=0;
					$(this).find(valueXMLTag).each(function() {
						values[valIndex]=$(this).text();
						valIndex++;
					});
					
					populateStreamRow(name,type,values,table);
				}
				
			}
		});
		addTitleRow("var",K,table);
		$(this).children(streamXMLTag).each(function() {
			name=$(this).attr("name");
			type=$(this).attr("type");
			
			//only add vars
			if ($(this).attr("class")!="input" && $(this).attr("class")!="output" ) {
				addStreamRow(name,$(this).attr("type"),"var",true,K,table);
				if (hasValues) {
					values=new Array();
					valIndex=0;
					$(this).find(valueXMLTag).each(function() {
						values[valIndex]=$(this).text();
						valIndex++;
					});
					populateStreamRow(name,type,values,table);
				}
				
			}
		});
	});
	attachClickEvents();	
	equalizeTableWidths();
}

/**
 * Populates the interpreter table using data in the code editor
 */

function generateInterpreterTableFromCode() {
	//params will contain key value pairs sent to the server
	params = {};
	
	//send whatever code the user has entered
	params["code"] = codeEditor.getValue();

	//the user does not select an instance of kind for the interpreter.
	//Instead, the config file should have specified some Kind to be the one to use
	params["kind"]=$("input.kindType[interpreter=\"interpreter\"]").attr("id");	
	$.post(
			"/kind/services/initInterpreter",
			params,
			function(xml) {	
				//on error
				if(xml=="1") {
					addToStatusConsole("ERROR: Internal error getting job results");
					return;
				}
				generateInterpreterTableFromXML(xml,false, defaultK);
				$("#submitInterpreterJob").button("option","disabled",false);

			},
			"xml"
	);
}

/**
 * Gets the current K value (column count -1) of the interpreter tables
 * @returns {Number}
 */
function getSetColumnCount() {
	return parseInt($(".interpreterTable .spanningHeadCol").first().attr("colspan"))-1;
}

function setColumnCountTextInput(newVal) {
	$("#columnNumber").val(newVal);
} 

/**
 * Sets the number of columns in the given interpreter table to the given value
 * @param newValue
 */
function setInterpreterTableColumnCount(newValue) {
	currentK=getSetColumnCount();
	if (isNaN(currentK) || newValue==currentK) {
		return;
	}
	
	if (newValue<currentK) {
		removeInterpreterTableColumns(currentK-newValue);
	} else {

		addInterpreterTableColumns(newValue-currentK);
	}
	$(".spanningHeadCol").attr("colspan",currentK+1);
}


/**
 * Adds columns to the interpreter table, and also increases the default K 
 * value by that amount
 * @param number The number to increase the column count by
 */

function addInterpreterTableColumns(number) {
	currentK=getSetColumnCount();
	currentK=number+currentK;
	$(".interpreterTable tr").each(function() {
		rowType=$(this).attr("type");
		cellCount=$(this).find("td, th").length;
		if ($(this).hasClass("header")) {
			for (cellCount;cellCount<currentK+1;cellCount++) {
				$(this).append("<th>"+cellCount+"</th>");
			}
		} else if ($(this).hasClass("title")) {
			for (cellCount;cellCount<currentK+1;cellCount++) {
				$(this).append("<td></td>");
			}
			
		} else if ($(this).hasClass("spanningHeader")) {
			//nothing is needed here, as we only want to change the colspan value, which we do for everything at the end
		}else {
			name=$(this).attr("name");
			type=$(this).attr("type");
			for (cellCount;cellCount<currentK+1;cellCount++) {
				if (rowType=="bool") {
					if ($(this).hasClass("input")) {
						$(this).append("<td><input class=\""+type+"\" name=\""+name+"\" type=\"checkbox\"/></td>");
					} else {
						$(this).append("<td><input readonly=\"readonly\" class=\""+type+"\" name=\""+name+"\" type=\"checkbox\"/></td>");
					}
					
				} else {
					if ($(this).hasClass("input")) {
						$(this).append("<td><input value=\"0\" class=\"textbox "+type+"\" name=\""+name+"\" type=\"textbox\"/></td>");
					} else {
						$(this).append("<td><input readonly=\"readonly\" value=\"0\" class=\"textbox "+type+"\" name=\""+name+"\" type=\"textbox\"/></td>");

					}
				}
			}
		} 
			
	});
	setColumnCountTextInput(currentK);
	$(".spanningHeadCol").attr("colspan",currentK+1);

	attachClickEvents();
}

/**
 * Makes every cell in every table as wide as the largest cell in any table
 */
function equalizeTableWidths() {
	maxWidth=Math.max.apply(Math, $('.interpreterTable td').map(function(){ return $(this).width(); }).get());
	$(".interpreterTable td").css("width",maxWidth+"px");
}

/**
 * Removes some number of columns from the interpreter table, and also 
 * reduces the default number of columns by that amount
 * @param number
 */

function removeInterpreterTableColumns(number) {
	currentK=getSetColumnCount();

	currentK=currentK-number;
	if (currentK<0) {
		currentK=0;
	}
	$(".interpreterTable tr").each(function() {
		$(this).find("td:gt("+currentK+"), th:gt("+currentK+")").remove();
		
	});

	setColumnCountTextInput(currentK);
	$(".spanningHeadCol").attr("colspan",currentK+1);


}

/**
 * Populates the interpreter table with values present in xml data
 * Values are present in <Stream> tags
 * @param xml
 */
function handleInterpreterResults(xml) {
	$(xml).find("Node").each(function() {
		table=getTableByName(getTableName(this));
		//get immediate children streams
		
		$(this).children(streamXMLTag).each(function() {
			name=$(this).attr("name");
			type=$(this).attr("type").toLowerCase();
			values=new Array();
			valIndex=0;
			
			$(this).children(valueXMLTag).each(function() {
				values[valIndex]=$(this).text();
				valIndex++;
			});
			populateStreamRow(name,type,values,table);
		});
		
		
	});
	
}
