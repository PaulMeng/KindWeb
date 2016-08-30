package kind;

import java.util.List;

public interface KindClient {
	public String cancel(String jobID, String URL);
	public String retrieve(String jobID, String URL);
	public String createJob(String filePath, List<String> args, String URL);
}
