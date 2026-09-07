' print-bridge/start-silent.vbs
' Runs the POS Local Print Service silently in the background with no terminal window
Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
WshShell.CurrentDirectory = scriptDir

' Run node server.js with window style 0 (hidden) and no wait
WshShell.Run "node server.js", 0, False
Set WshShell = Nothing
Set fso = Nothing
