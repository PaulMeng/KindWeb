package kind;
/**
 * Defines a Runnable class that will not die on errors
 * Class originally designed for the StarExec project
 */


import org.apache.log4j.Logger;

public abstract class RobustRunnable implements Runnable {
    private static final Logger log = Logger.getLogger(RobustRunnable.class);	 
    
    protected String name;

    abstract protected void dorun();

    public RobustRunnable(String _name) {
    	name = _name;
    }

    public void run() {
    	try {
    		dorun();
    	}
    	catch (Exception e) {
    		log.warn(name+" caught exception: "+e,e);
    	}
    }
}
	

