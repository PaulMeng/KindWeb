package kind;
/**
 * This class contains some generic utility functions.
 */
import java.io.BufferedWriter;
import java.io.File;
import java.io.FileWriter;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collection;
import java.util.List;
import java.util.Stack;

import javax.servlet.http.HttpServletRequest;

import org.apache.commons.io.FileUtils;
import org.apache.commons.io.filefilter.FileFilterUtils;
import org.apache.commons.io.filefilter.IOFileFilter;
import org.apache.log4j.Logger;
import org.jfree.util.Log;


public class Util {
	private static final Logger log = Logger.getLogger(Util.class);
	
	/**
	 * Deletes all files in the given directory that are as old as, or older than the specified number of days
	 * @param directory The directory to clear old files out of (non-recursive)
	 * @param daysAgo Files older than this many days ago will be deleted
	 * Function originally designed for the StarExec project
	 */
	public static void clearOldFiles(String directory, int daysAgo){
		try {
			File dir = new File(directory);
			
			if(!dir.exists()) {
				return;
			}
			
			// Subtract days from the current time
			Calendar calendar = Calendar.getInstance();
			calendar.add(Calendar.DATE, -daysAgo);			
			
	
			
			// Remove them all
			for (File file : dir.listFiles()) {
				if (!file.getName().startsWith(Constants.tempPrefix)) {
					continue; //don't delete permanent files
				}
				if (file.lastModified()<calendar.getTimeInMillis()) {
					System.out.println(file.getAbsolutePath());
					FileUtils.deleteQuietly(file);
				}
			}
								
		} catch (Exception e) {
			//log.warn(e.getMessage(), e);
		}
	}
	
	/**
	 * Checks if the given string is contained in the given array,
	 * regardless of case 
	 * @param arr The array to search through
	 * @param str The string to match
	 * @return True if it is contained, false otherwise
	 */
	
	public static boolean containsIgnoreCase(String[] arr, String str) {
		for (String s : arr) {
			if (str.equalsIgnoreCase(s)) {
				return true;
			}
		}
		return false;
	}
	
	/**
	 * Checks if the given string is contained in the given array,
	 * regardless of case 
	 * @param arr The array to search through
	 * @param str The string to match
	 * @return True if it is contained, false otherwise
	 */
	
	public static boolean containsIgnoreCase(Collection<String> arr, String str) {
		for (String s : arr) {
			if (str.equalsIgnoreCase(s)) {
				return true;
			}
		}
		return false;
	}
	
	/**
	 * Writes the given string to the given file
	 * @param str
	 * @param file
	 * @return
	 */
	public static boolean writeToFile(String str, File file) {
		try {
			FileWriter writer=new FileWriter(file);
			BufferedWriter w=new BufferedWriter(writer);
			w.write(str);
			w.flush();
			w.close();
			writer.close();
			return true;
		} catch (Exception e) {
			log.error("writeToFile says "+e.getMessage(),e);
		}
		return false;
	}
	/**
	 * Writes the given string to the job's info file, which contains all of its results
	 * @param jobId The ID of the job to write to 
	 * @param text The text to write
	 * @return True on success, false otherwise
	 */
	public static boolean appendToJobResultsFile(String jobId,String text) {
		try {
			File file=new File(Constants.ROOT_PATH,Constants.JOB_PATH);
			file=new File(file,jobId);
			file=new File(file,Constants.RESULTS_FILE);
			if (!file.exists()) {
				//file.mkdir();
			}
			BufferedWriter out = new BufferedWriter(new FileWriter(file, true));
			out.write(text);
			out.flush();
			out.close();
			return true;
		} catch (Exception e) {
			log.error("appendToJobInfoFile says "+e.getMessage(),e);
		}
		return false;
		
	}
	/**
	 * Determines whether the given HTTPServletRequest has the given parameter
	 * @param name
	 * @param request
	 * @return
	 * Function originally designed for the StarExec project
	 */
	public static boolean paramExists(String name, HttpServletRequest request){
		return !isNullOrEmpty(request.getParameter(name));
	}
	/**
	 * Checks to see if a string is null or empty
	 * @param s
	 * @return
	 * Function originally designed for the StarExec project
	 */
	public static boolean isNullOrEmpty(String s){
		return (s == null || s.trim().length() <= 0);
	}	
	
	
}

