!include "LogicLib.nsh"
!include "x64.nsh"

!macro customInstall
  DetailPrint "Memasang driver USB-to-Serial COM Port (CP2102 & CH340)..."

  ${If} ${RunningX64}
    ${DisableX64FSRedirection}
  ${EndIf}

  ; 1. Install Driver CP2102 (Silicon Labs) ke Windows Driver Store
  DetailPrint "Memasang Driver CP2102 (Silicon Labs)..."
  ExecWait 'pnputil.exe /add-driver "$INSTDIR\resources\drivers\cp2102\silabser.inf" /install'
  ExecWait 'pnputil.exe -i -a "$INSTDIR\resources\drivers\cp2102\silabser.inf"'

  ; 2. Install Driver CH340 / CH341 (WCH) ke Windows Driver Store & Setup
  DetailPrint "Memasang Driver CH340/CH341 (WCH)..."
  ExecWait 'pnputil.exe /add-driver "$INSTDIR\resources\drivers\ch340\CH341SER.INF" /install'
  ExecWait 'pnputil.exe -i -a "$INSTDIR\resources\drivers\ch340\CH341SER.INF"'

  ${If} ${FileExists} "$INSTDIR\resources\drivers\ch340\SETUP.EXE"
    ExecWait '"$INSTDIR\resources\drivers\ch340\SETUP.EXE" /S'
  ${EndIf}

  ${If} ${RunningX64}
    ${EnableX64FSRedirection}
  ${EndIf}

  DetailPrint "Driver USB COM Port (CP2102 & CH340) berhasil dipasang."
!macroend


