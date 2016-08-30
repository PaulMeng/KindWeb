<%@page contentType="text/html" pageEncoding="UTF-8" import="java.io.*, org.xml.sax.InputSource, kind.Util, kind.Validator, config.Config, javax.xml.parsers.*, org.w3c.dom.*, java.util.*" %>
<%@taglib prefix="kind" tagdir="/WEB-INF/tags"%>
<%
	//the code below is responsible for dynamically loading the Kind preferences into the home page HTML
	Document doc=Config.getConfigXML();
	
	NodeList list=doc.getElementsByTagName("kind");
	Node kind= list.item(0);
	int index=0;
	String name=null;
	String typeHTML=""; // the HTML string that will contain every Kind choice
	StringBuilder prefHTML=new StringBuilder(); // the HTML string that will contain all Kind options
	boolean first=true;							//the first Kind that we find will be the default one, so it will be checked at the start
	String newType="";
	while (kind!=null) {		
	
		name=Config.safeGetAttribute(kind,"name");
		String interpreter=Config.safeGetAttribute(kind,"interpreter");
		if (!first) {
			if (interpreter!=null) {
				newType="<div class=\"inputItem\"> <input interpreter=\"interpreter\" class=\"kindType\" type=\"radio\" name=\"kind\" value=\"2\" id=\""+name+"\"/><label for=\"radio\">"+name+"</label></div>";

			} else {
				newType="<div class=\"inputItem\"> <input class=\"kindType\" type=\"radio\" name=\"kind\" value=\"2\" id=\""+name+"\"/><label for=\"radio\">"+name+"</label></div>";
			}
			
		} else {
			first=false;
			if (interpreter!=null) {
				newType="<div class=\"inputItem\"> <input interpreter=\"interpreter\" class=\"kindType\" type=\"radio\" checked=\"checked\" name=\"kind\" value=\"2\" id=\""+name+"\"/><label for=\"radio\">"+name+"</label></div>";

			} else {
				newType="<div class=\"inputItem\"> <input class=\"kindType\" type=\"radio\" checked=\"checked\" name=\"kind\" value=\"2\" id=\""+name+"\"/><label for=\"radio\">"+name+"</label></div>";
			}
		}
		typeHTML=typeHTML+newType;
		
		NodeList prefs=kind.getChildNodes(); //the child nodes of each kind will contain the options
		int prefIndex=0;
		Node pref=prefs.item(prefIndex);
		String type = null;
		while (pref!=null) {
			//#text nodes are just bits of whitespace we want to ignore
			if (!pref.getNodeName().equals("#text")) {
				String primType=Config.safeGetAttribute(pref,"type");
				String prefName=Config.safeGetAttribute(pref,"name");
				String min=Config.safeGetAttribute(pref,"min");
				String max=Config.safeGetAttribute(pref,"max");
				String defaultValue=Config.safeGetAttribute(pref,"default");
				StringBuilder inputBuilder=new StringBuilder();
				
				if (primType.equals("bool") || primType.equals("unit")) {
					type="checkbox";
				} else if (primType.equals("dropdown")) {
					type="select";
				} else {
					type="text";
				}
				
				if (type.equals("select")) {
					inputBuilder.append("<div class=\"inputItem\"><label kind=\""+name+"\" class=\"kindPref\">"+prefName+": </label><select name=\""+prefName+"\" kind=\""+name+"\" class=\"kindPref "+primType+" "+type+"\" type=\""+type+"\">");
					List<String> choices=Config.getChoices(pref);
					for (String s : choices) {
						inputBuilder.append("<option value=\""+s+"\">"+s+"</option>");
					}
					inputBuilder.append("</select></div>");
				} else {
					inputBuilder.append("<div class=\"inputItem\"><label kind=\""+name+"\" class=\"kindPref\">"+prefName+": </label><input name=\""+prefName+"\" kind=\""+name+"\" class=\"kindPref "+primType+" "+type+"\" type=\""+type+"\"");
					if (defaultValue!=null) {
						if (type.equals("checkbox")) {
							if (Validator.isValidBoolean(defaultValue) && Boolean.parseBoolean(defaultValue)) {
								inputBuilder.append("checked=\"checked\" ");
							}
						} else {
							inputBuilder.append("value=\""+defaultValue+"\" ");
							if (min!=null) {
								inputBuilder.append("min=\""+min+"\" ");
							}
							if (max!=null) {
								inputBuilder.append("max=\""+max+"\" ");
							}
						}
					}
					inputBuilder.append("/></div>");
				}
				
				
				prefHTML.append(inputBuilder.toString());
			}
			
			prefIndex++;
			pref=prefs.item(prefIndex);
		}
	index=index+1;
	kind=list.item(index);
	}
	request.setAttribute("types",typeHTML);
	request.setAttribute("prefs",prefHTML.toString());

%>


<kind:template title="" css="tablefix, home, codemirror" js="lib/jquery.numeric, home/progressbar, lib/jquery.mousewheel, lib/jquery.fixedheadertable, home/interpreter, home/home, lib/codemirror,lib/match-highlighter, lib/search, lib/searchcursor, lib/lustre, lib/matchbrackets, lib/jquery.ui.progressbar.min" >
	<span id="XMLPref" value="${pref}" style="display:none"></span>
	<div id="tabs">
		<ul>
			<li><a href="#propertyChecker">Property Checker</a></li>
			<li><a href="#interpreter">Interpreter</a></li>
		</ul>
		<div id="propertyChecker">
			<div class="toobox" id="toolbox">
				<button class="tool load" type="button" id="load">Load File</button>
				<button class="save tool" type="button" id="save">Save File</button>
				<button class="tool submit" type="button" id="submitCode">Check</button>
				<button class="tool cancel" type="button" id="cancel">Cancel</button>
				<label for="#maxIterations">Max Steps:</label><input class="tool int" type="text" id="maxIterations"/>
				<button class="tool clear"  type="button" id="clear">Clear</button>
				<button class="tool undo"  type="button" id="undo">Undo</button>
				<button class="tool redo"  type="button" id="redo">Redo</button>
				<input class="tool"  type="file" id="loadFile" name="file"/>
			</div>
			<div id="propertyCheckerContent">
				<div id="textDiv">
					<textarea id="codeEditor">Enter code here...</textarea>
				</div>				
				<div id="propertyDiv">
					<div id="propertyTableContainer">
						<table id="propertyTable">
							<thead>
								<tr>
									<th colspan="3">Properties</th>
								</tr>
								<tr>
									<th id="propretyHead">Property</th>
									<th id="valueHead">Value</th>
									<th id="KHead">K</th>
								</tr>
							</thead>
							<tbody>
								
							</tbody>
						</table>
					</div>
					<div id="progressBarWrapper">
						<div class="progressBar" id="progressBar1"><div class="progressLabel"></div></div>
						<div class="progressBar" id="progressBar2"><div class="progressLabel"></div></div>
						<div class="progressBar" id="progressBar3"><div class="progressLabel"></div></div>
					</div>
					<fieldset id="kindType">
						<legend>Kind</legend>
						${types}
					</fieldset>
					<fieldset id="kindPreferences">
						<legend>Preferences</legend>
						${prefs}
					</fieldset>
					
					<fieldset id="statusFieldProperties" class="statusField">
						<legend>Status</legend>
						<textarea class="status" id="statusProperties" readonly></textarea>
					</fieldset>
					
				</div>
			</div>
		</div>
		<div id="interpreter">
			<div class="toobox" id="interpreterToolbox">
				<button class="tool load" type="button" id="loadInterp">Load File</button>
				<button class="save tool" type="button" id="saveInterp">Save File</button>
				<button class="tool" type="button" id="loadInterpreterTable">Make Table</button>
				<button class="tool submit" type="button" id="submitInterpreterJob">Run</button>
				<button class="tool cancel" type="button" id="cancelInterp">Cancel</button>
				<button class="tool clear"  type="button" id="clearInterp">Clear</button>
				<button class="tool undo"  type="button" id="undoInterp">Undo</button>
				<button class="tool redo"  type="button" id="redoInterp">Redo</button>
				<button class="tool" type="button" id="removeColumn">Remove Column</button>
				<input class="tool int" type="text" id="columnNumber"/>
				<button class="tool" type="button" id="addColumn">Add Column</button>
			</div>
			<div id="interpreterTableDiv">
				<div class="toolbox interpreterTableTools">
				
				
				</div>
				<table id="interpreterTable">
					<thead>
					</thead>
					<tbody>
					</tbody>
				</table>
			</div>
			<div id="interpreterInfo">
				<div id="interpreterCodeDiv">
					<textarea id="codeEditorInterp">Enter code here...</textarea>	
				</div>			
				<fieldset id="statusFieldInterpreter" class="statusField">
					<legend>Status</legend>
					<textarea class="status" id="statusInterpreter" readonly></textarea>
				</fieldset>
			</div>
			
		</div>
	</div>
</kind:template>