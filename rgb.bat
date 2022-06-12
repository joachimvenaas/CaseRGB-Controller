@echo off
IF "%1"=="start" (
  node "C:\rgb.js" -start
)
IF "%1"=="stop" (
  node "C:\rgb.js" -stop
)
