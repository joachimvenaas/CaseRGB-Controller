/* 
** Script for å skru av og på RGB på PC og HUE lys bak skjerm
** Joachim Venås
**
** Brukes med å kjøre "node rgb.js -start/stop"
** Brukt her i sammenheng med "Oppgaveplanlegger" i Windows med rgb.bat på C:
*/
const { OpenRGBClient } = require('OpenRGB')
const http = require('http')

// Config
const config = {
  "hueBridge": "192.168.1.XX", // HUE bridge IP
  "apiKey":   "XXxxXX-xxXxXXxXXX", // HUE Api key
  "lightID":  "27" // Hue light ID to controll
}
const options = {
  hostname: config['hueBridge'],
  path: `/api/${config['apiKey']}/lights/${config['lightID']}/state`,
  method: 'PUT'
}

// Stop
if (process.argv.includes('-stop')){
  // OpenRGB
  caseRgb([125, 0, 125], [10, 0, 10])

  // Hue, comment if not needed
  const data = JSON.stringify({ on: false, transitiontime: 50 })
  const req = http.request(options, (res) => { res.on('data', (d) => process.stdout.write(d)) })
  req.on('error', (error) => console.error(error))
  req.write(data)
  req.end()
  
}
// Start
else if (process.argv.includes('-start')){
  // OpenRGB
  caseRgb([10, 0, 10], [125, 0, 125])

  // Hue, comment if not needed
  const data = JSON.stringify({ on: true, sat: 100, bri: 154,  hue: 7000, transitiontime: 30 })
  const req = http.request(options, (res) => res.on('data', (d) => process.stdout.write(d)))
  req.on('error', (error) => console.error(error))
  req.write(data)
  req.end()
}

// Start RGB i case funksjon
// Usage caseRgb([0,0,0], [255,255,255])
async function caseRgb(from, to, steps=100, fadeTid=3){
  var red = from[0],
      green = from[1],
      blue = from[2],
      func = 'down'

  if((from[0]+from[1]+from[2]) < (to[0]+to[1]+to[2])) func = 'up'
  
  console.log(`Running ${func} from ${from} to ${to}`)

  const client = new OpenRGBClient({ host: 'localhost', port: 6742, name: 'Time LED changer' })
  await client.connect()
  const controllerCount = await client.getControllerCount()

  for (var deviceId = 0; deviceId < controllerCount; deviceId++){
    const device = await client.getDeviceController(deviceId)
    await client.setCustomMode(deviceId)
    var eachStep = Math.max(from[0], from[1], from[2], to[0], to[1], to[2])/steps

    for (var i = 0; i < steps; i++){
      if(func == 'up'){
        red =    red+eachStep
        green =  green+eachStep
        blue =   blue+eachStep
        if(red > to[0])     red = to[0]
        if(green > to[1])   green = to[1]
        if(blue > to[2])    blue = to[2]
      } else {
        red =    red-eachStep
        green =  green-eachStep
        blue =   blue-eachStep
        if(red < to[0])   red = to[0]
        if(green < to[1]) green = to[1]
        if(blue < to[2])  blue = to[2]
      }

      var colors = Array(device.colors.length).fill({ red: Math.round(red), green: Math.round(green), blue: Math.round(blue) })
      await client.updateLeds(deviceId, colors)
      await sleep((fadeTid/steps)*1000)
    }
  }
  await client.disconnect()
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
