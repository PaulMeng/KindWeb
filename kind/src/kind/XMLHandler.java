package kind;

/**
 * This class contains utility functions for dealing with XML files
 */

import java.io.BufferedWriter;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileWriter;

import java.util.Stack;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;


import org.apache.log4j.Logger;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.xml.sax.InputSource;

import config.Config;

public class XMLHandler {
	private static final Logger log = Logger.getLogger(XMLHandler.class);
	
	/**
	 * Given an index into an XML string where the character
	 * at the index is a '<', determines whether this is an opening tag
	 * @param XML The XML string
	 * @param index An index into the string such that the character
	 * at the index is '<'
	 * @return True if this is an opening tag, false if it is a closing tag
	 */
	private static boolean isOpeningTag(String XML, int index) {
		if (XML.charAt(index+1)=='/') {
			return false;
		}
		return true;
	}
	
	/**
	 * Gets the name of the tag that begins at the given index
	 * @param XML An XML string
	 * @param index An index into the string that marks the start
	 * of a tag
	 * @return The name of the tag, or null if there is a problem.
	 */
	private static String getXMLTagName(String XML, int index) {
		for (int x=index+1;x<XML.length();x++) {
			
			if (Character.isWhitespace(XML.charAt(x)) || XML.charAt(x)=='>') {
				String name=XML.substring(index+1,x);
				name=name.replace("/", "");
				return name;
			}
			
		}
		return null;
		
	}
	
	/**
	 * Given an index into an XML tag, returns the index of the final 
	 * character in the tag
	 * @param XML An XML string
	 * @param startIndex The index to the start of a tag
	 * @return The index of the closing '>' in the tag
	 */
		
	public static int getEndIndex(String XML, int startIndex) {
		int endIndex;
		for (endIndex=startIndex;endIndex<XML.length();endIndex++) {
			if (XML.charAt(endIndex)=='>') {
				break;
			}
		}
		return endIndex;
	}
	/**
	 * Closes all unclosed XML tags, removes the ?xml tag, and adds a root element. Other errors will not be fixed.
	 * This function is used to clean up XML that comes from Kind, which often has unclosed / unopened tags and 
	 * other problems.
	 * @param XML The XML, as a string
	 * @return The fixed XML
	 */
	public static String fixXML(String XML) {
		Integer startIndex=null;
		Integer endIndex=null;
		Stack<String> tagStack=new Stack<String>();
		for (int x=0;x<XML.length();x++) {
			char curChar=XML.charAt(x);
			//found an open tag
			if (curChar=='<') {
				String tagName=getXMLTagName(XML,x);
				//if the name of the tag is ?xml, we should just remove the tag
				if (tagName != null && tagName.equalsIgnoreCase("?xml")) {
					startIndex=x;
					endIndex=getEndIndex(XML,startIndex);
					XML=XML.replace(XML.substring(startIndex,endIndex+1), "");
					x--; //we've removed part of the string, so we need to set the index back by one to avoid skipping a character
					
				} else {
					if (isOpeningTag(XML,x)) {
						tagStack.push(tagName);
					} else {
						if (tagStack.size()>0) {
							tagStack.pop();  //we're just assuming they match-- we won't fix badly nested tags
						} else {
							//if no tag is on the stack, this one can't be matched, and we should remove it.
							startIndex=x;
							endIndex=getEndIndex(XML,x);
							log.debug("removing bag tag "+startIndex+" "+endIndex);
							XML=XML.substring(0,startIndex)+XML.substring(endIndex+1);
							x--; //avoid skipping a character
						}
						
					}
				}
				
			} 
		}
		
		while (tagStack.size()>0) {
			XML=XML+"</"+tagStack.pop()+">";
		}
		return "<root> "+XML+" </root>";
	}
	
	/**
	 * Writes a new job info file to the given location. A job info file contains information
	 * about which instance of Kind a job is running on, as well as what type of job it is.
	 * An XML <system> tag contains attributes with this information.
	 * @param kind The name of the Kind instance for the job
	 * @param jobType Either "propertyChecker" or "interpreter"
	 * @param outputFile The file the job results should be saved to
	 * @return True on success, and false if there was an error.
	 */
	
	public static boolean generateJobInfoFile(String kind, String jobType, File outputFile) {
		try {
			Document doc=Config.getInfoTemplate();
			Element system=doc.createElement("system");
			system.setAttribute("kind",kind);
			system.setAttribute("jobType","propertyChecker");
			Element root=doc.getDocumentElement();
			root.appendChild(system);
			TransformerFactory transformerFactory = TransformerFactory.newInstance();
			Transformer transformer = transformerFactory.newTransformer();
			DOMSource source = new DOMSource(doc);
			StreamResult result = new StreamResult(outputFile);
			transformer.transform(source, result);
			return true;
		} catch (Exception e) {
			log.error("generateJobInfoFile says "+e.getMessage(),e);
		}
		
		return false;
	}
	/**
	 * Gets the jobID from a JobStatus message. If there is no job ID due to an error,
	 * returns null
	 * @return
	 */
	public static String getJobId(String response) {
		try {
			DocumentBuilder builder=DocumentBuilderFactory.newInstance().newDocumentBuilder();
			Document doc=builder.parse(new InputSource(new ByteArrayInputStream(response.getBytes("utf-8"))));
			Node node=doc.getElementsByTagName("Jobstatus").item(0);
			String status=Config.safeGetAttribute(node, "msg");
			if (status.equals("started")) {
				return Config.safeGetAttribute(node,"jobid");
			}
		} catch (Exception e) {
			log.error("getJobId says "+e.getMessage());
		}
		
		
		return null;
	}
	
	
}
