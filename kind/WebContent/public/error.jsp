<%@page isErrorPage="true" contentType="text/html" pageEncoding="UTF-8" %>
<%@taglib prefix="kind" tagdir="/WEB-INF/tags" %>
<%@taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%
	String desc = "";
	
	switch(pageContext.getErrorData().getStatusCode()) {
		case 400:
			desc = "bad request";
			break;
		case 403:
			desc = "forbidden";
			break;
		case 404:
			desc = "not found";
			break;
		case 405:
			desc = "method not allowed";
			break;
		case 500:
			desc = "internal server error";
			break;
		default:
			break;
	}
	request.setAttribute("errorDesc", desc);
%>

<kind:template title="internal error">			
	<p>An error occurred. Errors are logged and will be reviewed. Please <a href="/kind/public/home.jsp">return home.</a></p>
</kind:template>