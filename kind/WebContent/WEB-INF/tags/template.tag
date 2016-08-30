
<%@tag description="Template tag for all kindexec pages"%>
<%@taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@taglib prefix="kind" tagdir="/WEB-INF/tags" %>

<%@attribute name="title" %>
<%@attribute name="css" %>
<%@attribute name="js" %>
<%
	//tag originally designed for the StarExec project
%>
<!DOCTYPE html>
<html lang="en">
	<kind:head title="${title}" css="${css}" js="${js}"/>	
	<body>			
		<div id="wrapper">
			<kind:header />
			<div id="content" class="round">
				<jsp:doBody/>
			</div>		
		<kind:footer />
		</div>
	</body>
</html>