package kind;

import java.io.File;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

import javax.servlet.ServletContextEvent;
import javax.servlet.ServletContextListener;

import kind.RobustRunnable;


/**
 * This class contains methods invoked when the system is first set up and shut down
 * @author Eric
 *
 */

public class Kind implements ServletContextListener {
	private static final ScheduledExecutorService taskScheduler = Executors.newScheduledThreadPool(5);
	
	@Override
	public void contextDestroyed(ServletContextEvent event) {
		try {
			taskScheduler.shutdown();
		
		} catch (Exception e) {
			
		}
	}

	/**
	 * When the application starts, this method is called. Perform any initializations here
	 */	
	@Override
	public void contextInitialized(ServletContextEvent event) {				
		Constants.ROOT_PATH = event.getServletContext().getRealPath("/");
		Constants.CONFIG_PATH = Constants.ROOT_PATH + "/" + "/WEB-INF/classes/config/";
		
		/*  Create a task that deletes job logs older than 3 days */
		final Runnable clearJobLogTask = new RobustRunnable("clearJobLogTask") {			
			@Override
			protected void dorun() {
			    Util.clearOldFiles(new File(Constants.ROOT_PATH,Constants.JOB_PATH).getAbsolutePath(),3);
			}
		};
		taskScheduler.scheduleAtFixedRate(clearJobLogTask, 0, 72, TimeUnit.HOURS);
	}	
	

}