import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

import kind.HTTPKindClient;


public class Test {

	/**
	 * @param args
	 */
	public static void main(String[] args) {
		// TODO Auto-generated method stub
			final HTTPKindClient client=new HTTPKindClient();
			//File temp = File.createTempFile("i-am-a-temp-file", ".tmp" );		 
		    //String filePath = temp.getAbsolutePath();
		  	String csvFile = "/home/mma1/kind2/service/test.csv";
			String inputFile = "/home/mma1/kind2/examples/two_counters.lus";
		    List<String> arg = new ArrayList<String>();
		    System.out.print(arg.size());
		    String url = "http://localhost:8484";
		    client.initInterpreter(inputFile,arg,url);
		    //client.runInterpreter(inputFile, csvFile, arg, url);


		}


	}

