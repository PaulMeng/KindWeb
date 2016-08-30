package kind;

/**
 * This class is responsible for validating incoming job creation requests.
 */

import java.util.List;

import org.apache.log4j.Logger;

import config.Config;

public class Validator {	
	private static final Logger log = Logger.getLogger(Validator.class);
	
	/**
	 * Determines whether the given string represents a valid integer
	 * @param str The string to check
	 * @return True if valid, false otherwise.
	 * @author Eric Burns
	 */
	
	public static boolean isValidPosInteger(String str) {
		try {
			Integer.parseInt(str);
			return true;
		} catch (Exception e) {
			return false;
		}
	}
	
	/**
	 * Determines whether the given string is a valid boolean.
	 * @param str
	 * @return True if it is a valid boolean, false otherwise
	 */
	
	public static boolean isValidBoolean(String str) {
		str=str.toLowerCase();
		return (str.equals("true") || str.equals("false"));
	}
	/**
	 * Determines whether the given string is a valid double.
	 * @param str
	 * @return True if it is a valid double, false otherwise
	 */
	
	public static boolean isValidDouble(String dbl) {
		try {
			Double.parseDouble(dbl);
			return true;
		} catch (Exception e) {
			return false;
		}
		
	}
	
	
	/**
	 * Checks to see if the value of an argument is valid given the constraints specified
	 * in config.xml. Both the type and value given must match what is given in config.xml
	 * @param kind The name of the kind instance 
	 * @param name The name of the parameter
	 * @param value The given argument
	 * @return True if valid, false otherwise
	 */
	
	public static boolean isArgValid(String kind, String name, String value) {
		try {
			//first, get the type of the argument from config.xml. We can't just assume
			//the user sent over the correct type
			String type=Config.getAttributeValue(kind,name,"type");
			if (type.equals(Constants.TYPE_INT)) {
				if (!isValidPosInteger(value)) { // the value of an int type must actually be an int
					return false;
				}				
			} else if (type.equals(Constants.TYPE_BOOL)) {
				if (!isValidBoolean(value)) {   // must be a bool if that is what the type says
					return false;
				}
			} else if (type.equals(Constants.TYPE_FLOAT) || type.equals(Constants.TYPE_REAL)) {
				if (!isValidDouble(value)) {   //must be a valid double
					return false;
				}
			} else if (type.equals(Constants.TYPE_DROPDOWN)) {
				//if we have a dropdown type, make sure that the value sent by the user is actually a real option
				List<String> options=Config.getChoices(Config.getNode(kind, name));
				if (!Util.containsIgnoreCase(options,value)) {
					return false;
				}
			}
			// if we have a numeric type, we need to see if a min and max are specified and see
			// if the given value conforms to those limits
			if (type.equals(Constants.TYPE_FLOAT) || type.equals(Constants.TYPE_INT) || type.equals(Constants.TYPE_REAL)) {
				String min=Config.getAttributeValue(kind, name, "min");
				String max=Config.getAttributeValue(kind, name, "max");
				double val=Double.parseDouble(value);
				if (min!=null) {
					if (val<Double.parseDouble(min)) {
						return false;
					}
				}
				if (max!=null) {
					if (val>Double.parseDouble(max)) {
						return false;
					}
				}
				
			}
			return true;
		} catch (Exception e) {
			log.debug("isArgValid says "+e.getMessage(),e);
		}
		
		return false;
	}
	

}
