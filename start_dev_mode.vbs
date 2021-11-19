Dim objShell
Set objShell = WScript.CreateObject( "WScript.Shell" )
' objShell.Run("C:\Program Files\MongoDB Compass\MongoDBCompass.exe")
objShell.Run("cmd.exe /c cd C:\Users\sridev\Desktop\srdvk\web dev\full stak\rays")
objShell.Run("cmd.exe /c npm run dev")
objShell.Run("cmd.exe /c code .")
objShell.Run("cmd.exe /c start http://localhost:3000/")
Set objShell = Nothing