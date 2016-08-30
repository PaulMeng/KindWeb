package config;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.util.ArrayList;
import java.util.List;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;

import kind.Constants;
import kind.RESTServices;

import org.w3c.dom.Document;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.xml.sax.InputSource;
import org.apache.commons.io.FileUtils;
import org.apache.log4j.Logger;

/**
 * This class handles reading and returning configuration documents
 * @author Eric Burns
 *
 */

public class Config {
	private static final Logger log = Logger.getLogger(RESTServices.class);
	/**
	 * Gets an XML document object for the config.xml file
	 * @return The XML document on success, or null on error
	 */
	public static Document getConfigXML() {
		try {
			File file=new File(Constants.CONFIG_PATH,"config.xml");	
			String text= FileUtils.readFileToString(file);
			DocumentBuilder builder=DocumentBuilderFactory.newInstance().newDocumentBuilder();
			Document doc=builder.parse(new InputSource(new ByteArrayInputStream(text.getBytes("utf-8"))));
			return doc;
		} catch (Exception e) {
			log.error("getKindXML says "+e.getMessage(),e);
		}
		return null;
	}
	
	/**
	 * Gets an XML document object of the infoTemplate.xml file
	 * @return The Document, or null on error
	 */
	public static Document getInfoTemplate() {
		try {
			File file=new File(Constants.CONFIG_PATH,"infoTemplate.xml");	
			String text= FileUtils.readFileToString(file);
			DocumentBuilder builder=DocumentBuilderFactory.newInstance().newDocumentBuilder();
			Document doc=builder.parse(new InputSource(new ByteArrayInputStream(text.getBytes("utf-8"))));
			return doc;
		} catch (Exception e) {
			log.error("getInfoTemplate says "+e.getMessage(),e);
		}
		return null;
	}
	/**
	 * Given a node that has some attributes, attempts get the value of a given
	 * attribute without throwing any errors.
	 * @param node The node to get the attr of
	 * @param attr The name of the attribute
	 * @return The value of the attribute if it exists, or null if it does not.
	 */
	
	public static String safeGetAttribute(Node node,String attr) {
		try {
			return node.getAttributes().getNamedItem(attr).getNodeValue();
		} catch (Exception e) {
			log.debug("attr "+attr+" does not exist");
		}
		return null;
	}
	
	/**
	 * Returns a size 2 array containing the port and host, in that order, of the server tag in the config.xml file
	 * @return A size 2 array containing the port and host in that order
	 */
	
	public static String[] getSystemPortAndHostFromConfigFile() {
		
		Document doc=Config.getConfigXML();
		Node system=doc.getElementsByTagName("server").item(0);

		String[] answer=new String[2];
		answer[0]=safeGetAttribute(system,"port");
		answer[1]=safeGetAttribute(system,"host");
		return answer;
		
	}
	
	
	
	
	/**
	 * Given an instance of Kind, the name of an option, and the name of an attribute of that option,
	 * get the value of the attribute from config.xml.
	 * @param kindName The name of a kind tag in config.xml
	 * @param optionName The name of an option in config.xml
	 * @param attrName The name of an attribute in config.xml
	 * @return
	 */
	
	public static String getAttributeValue(String kindName, String optionName, String attrName) {
		Node option=getNode(kindName,optionName);
		return Config.safeGetAttribute(option, attrName);
		
	}
	/**
	 * For a given Kind instance name and given Option name, get the 
	 * Node for that option from config.xml
	 * @param kindName The name of a kind tag in config.xml
	 * @param optionName The name of an option tag in config.xml
	 * @return The XML Node object for the needed option tag, or null on failure
	 */
	public static Node getNode(String kindName, String optionName) {
		try {
			Document doc=getConfigXML();
			NodeList kinds=doc.getElementsByTagName("kind");
			int kindIndex=0;
			Node kind=kinds.item(kindIndex);
			while (kind!=null) {			//first, iterate through kind tags until finding the one with the right name
				if (Config.safeGetAttribute(kind,"name").equals(kindName)) {
					NodeList options=kind.getChildNodes();
					int optionIndex=0;
					Node option=options.item(optionIndex);
					while (option!=null) {			//next, iterate through options to find the right one
						if (!option.getNodeName().equals("#text")) { //#text tags are just whitespace, so they might also exist
							if (Config.safeGetAttribute(option, "name").equals(optionName)) { 
								return option;
							}
						}
						optionIndex++;
						option=options.item(optionIndex);
					}
				}
				kindIndex++;
				kind=kinds.item(kindIndex);
			}

			return null;
		} catch (Exception e) {
			log.error("getNode says "+e.getMessage(),e);
		}
		return null;
	}
	
	/**
	 * Gets all of the options from a dropdown option
	 * @param dropDownNode The dropdown option Node
	 * @return A list of strings containing every option
	 */
	public static List<String> getChoices(Node dropDownNode) {
		int choiceIndex=0;
		NodeList choices=dropDownNode.getChildNodes();
		
		List<String> choiceStrings=new ArrayList<String>();
		Node choice=choices.item(choiceIndex);
		while (choice!=null) {
			if (!choice.getNodeName().equals("#text")) {
				log.debug(choice.getTextContent());
				choiceStrings.add(choice.getTextContent());
			}
			
			
			
			choiceIndex++;
			choice=choices.item(choiceIndex);
		}
		
		return choiceStrings;
	}
}
