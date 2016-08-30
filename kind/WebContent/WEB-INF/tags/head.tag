<%@tag description="Standard html header info for all pages"%>
<%@taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@taglib prefix="fn" uri="http://java.sun.com/jsp/jstl/functions" %>

<%@attribute name="title" %>
<%@attribute name="css" %>
<%@attribute name="js" %>
<%
	//tag originally designed for the StarExec project
%>
<head>
	<title>${title} - Kind</title>
	<meta charset="utf-8" />
	<c:if test="${not empty css}">	
		<c:forEach var="cssFile" items="${fn:split(css, ',')}">
			<link rel="stylesheet" href="/kind/css/${fn:trim(cssFile)}.css"/>
		</c:forEach>	
	</c:if>		
	<link rel="stylesheet" href="/kind/css/html5.css" />	
	<link rel="stylesheet" href="/kind/css/master.css"/>
	
	<link rel="stylesheet" href="/kind/css/jqueryui/jquery-ui-1.10.3.custom.css" />
	<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.6.4/jquery.min.js"></script>		

	<script src="/kind/js/lib/jquery-ui-1.10.3.custom.min.js"></script>
	<script src="/kind/js/master.js"></script>
	<c:if test="${not empty js}">	
		<c:forEach var="jsFile" items="${fn:split(js, ',')}">
			<script type="text/javascript" src="/kind/js/${fn:trim(jsFile)}.js"></script>
		</c:forEach>	
	</c:if>
						
</head>
	