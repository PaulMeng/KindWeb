package kind;

/**
 * This class contains a few constants used throughout the server
 * @author Eric Burns
 *
 */

public class Constants {
	public static String ROOT_PATH = null;
	public static final String JOB_PATH="/public/jobs"; //dir to store job code/results
	public static final String CODE_FILE = "code"; //name of file to put code for a job in 
	public static final String INFO_FILE="info.xml";
	public static final String CSV_FILE="inputs.csv";
	public static final String RESULTS_FILE="results.xml";
	public static String CONFIG_PATH = null;
	
	
	// these are valid types in config.xml
	public static final String TYPE_INT="int";
	public static final String TYPE_BOOL="bool";
	public static final String TYPE_FLOAT="float";
	public static final String TYPE_REAL="real";
	public static final String TYPE_UNIT="unit";
	public static final String TYPE_DROPDOWN="dropdown";
	
	public static final String tempPrefix="temp_";
}
