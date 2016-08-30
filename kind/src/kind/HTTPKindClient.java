package kind;

import java.io.File;

import java.util.List;

import org.apache.http.HttpResponse;
import org.apache.http.NameValuePair;
import org.apache.http.client.HttpClient;
import org.apache.http.client.methods.HttpGet;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.mime.MultipartEntity;
import org.apache.http.entity.mime.content.FileBody;
import org.apache.http.entity.mime.content.StringBody;
import org.apache.http.impl.client.DefaultHttpClient;
import org.apache.http.message.AbstractHttpMessage;
import org.apache.http.util.EntityUtils;
import org.apache.log4j.Logger;

/**
 * @author Eric, Mingyu
 *
 */

public class HTTPKindClient {
	private static final Logger log = Logger.getLogger(HTTPKindClient.class);
	
	//TODO: These keys can be changed to whatever is desired
	private static final String kind2 = "kind2";
	private static final String pkind = "pkind";
	private static final String submitURL="/submitjob";
	private static final String cancelURL="/canceljob";
	private static final String retrieveURL="/retrievejob";
	private static final String interpreterURL="/interpreter";
	
	private HttpClient client=null;
	
	public HTTPKindClient() {
		Logger.getLogger("org.apache.http").setLevel(org.apache.log4j.Level.OFF);

		client=new DefaultHttpClient();
		}
	
	
	@SuppressWarnings("unused")
	private static void setHeaders(AbstractHttpMessage msg, List<NameValuePair> headers) {
		for (NameValuePair pair : headers) {
			msg.addHeader(pair.getName(),pair.getValue());
		}
	}
	
	/**
	 * Cancels the given job
	 * @param jobId The ID of the job in question
	 * @param URL The URL of the web server
	 * @return The status message returned by Kind, or null on error
	 */
	
	public String cancel(String jobId, String URL) {
		try {
			
			HttpGet get=new HttpGet(URL+cancelURL+"/"+jobId);
	    	HttpResponse response=client.execute(get);
	    	String statusString = EntityUtils.toString(response.getEntity());
	    	//response.getEntity().getContent().close();
            return statusString;
        } catch (Exception e) {
           	log.error("retrieve says "+e.getMessage(),e); 
        }
        return null;
    }
	
	/**
	 * Retrieves the results from the given job
	 * @param jobId The ID of the job to get results of
	 * @param URL The URL of the web server that is handling requests
	 * @return The XML job results, or null on error
	 */
	
    public String retrieve(String jobId, String URL) {
	    try {	    		
	    	HttpGet get=new HttpGet(URL+retrieveURL+"/"+jobId);
	    	HttpResponse response=client.execute(get);
	    	String data = EntityUtils.toString(response.getEntity());	    	
	    	return data;

        } catch (Exception e) {
           	log.error("retrieve says "+e.getMessage(),e);
        }
        return null;
    }
    
    /**
	 * initiate the interpreter, returns xml that require users to enter inputs
	 * @param filePath The Input file 
	 * @param args The list of arguments to kind
	 * @return The XML job results, or null on error
	 */
    
    
    public String initInterpreter(String filePath, List<String> args, String URL)
    {
    	try {
    		HttpPost post = new HttpPost(URL+interpreterURL);
        	File code = new File(filePath);       	
        	MultipartEntity entity = new MultipartEntity();
        	entity.addPart("inputFile", new FileBody(code));
        	entity.addPart("kind", new StringBody(kind2));
        	if (!args.isEmpty()) 
        	{
        		for ( String s : args)
        		{
        			entity.addPart("arg", new StringBody(s));
        		}
        	}
        	post.setEntity(entity);
       	       	       	                     
            HttpResponse response=client.execute(post);
                    
            String result = EntityUtils.toString (response.getEntity());
           
            if (result!=null) {
                return result;
            } else {
            	log.debug("could not get interpreter input successfully, returning an empty string");
            	return "";
            }
    	} catch (Exception e) {
    		log.error("Interpreter input says "+e.getMessage(),e);
    	}
    	return null;
    }
    
    
    public String runInterpreter(String inputfile, String csvfile, String URL)
    {
    	try {
    		HttpPost post = new HttpPost(URL+interpreterURL);
        	File inputFile = new File(inputfile);
        	File csvFile = new File(csvfile);
        	MultipartEntity entity = new MultipartEntity();
        	entity.addPart("csvFile", new FileBody(csvFile));
        	entity.addPart("inputFile", new FileBody(inputFile));
        	entity.addPart("kind", new StringBody(kind2));
        	
        	post.setEntity(entity);
       	       	       	                     
            HttpResponse response=client.execute(post);                   
            String result = EntityUtils.toString (response.getEntity());
        	
            
            if (result!=null) {
                return result;
            } else {
            	log.debug("could not get interpreter input successfully, returning an empty string");
            	return "";
            }
    	} catch (Exception e) {
    		log.error("Interpreter input says "+e.getMessage(),e);
    	}
    	return null;
    }
    
    /**
     * Attempts to create a new Kind job
     * @param filePath The absolute path to the file containing the source code for this job
     * @param args The list of arguments to Kind
     * @param URL The URL of the server handling the requests
     * @return The XML returned by kind, or null on error
     */
    public String createJob(String filePath, List<String> args, String URL, String kind) {
    	try {
    		HttpPost post = new HttpPost(URL+submitURL);
        	File code = new File(filePath);
        	
        	MultipartEntity entity = new MultipartEntity();
        	entity.addPart("file", new FileBody(code));
        	entity.addPart("kind", new StringBody(kind));
        	if (!args.isEmpty()) 
        	{
        		for ( String s : args)
        		{
        			entity.addPart("arg", new StringBody(s));
        		}
        	}
        		
        	post.setEntity(entity);
       	       	       	                     
            HttpResponse response=client.execute(post);
            /*  for debugging purpose, print out all headers
            Header[] headers = response.getAllHeaders();
            int count = 0;
            while (count < headers.length){
            	Header h = headers[count];
            	System.out.println(h.getName() + ": " + h.getValue());
            	count++;
            }*/
                    
            String result = EntityUtils.toString (response.getEntity());
            
           
            if (result!=null) {
                return result;
            } else {
            	log.debug("could not create job successfully, returning an empty string");
            	return "";
            }
    	} catch (Exception e) {
    		log.error("createJob says "+e.getMessage(),e);
    	}
    	return null;
    }

}
