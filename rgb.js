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

function invertIfNegative(val){
  if (val < 0) val = val - (val*2)
  return val
}

function sleep(ms){
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// Start RGB i case funksjon
// Usage caseRgb([0,0,0], [255,255,255])
async function caseRgb(from, to, steps=100, fadeTid=5){
  var red = from[0],
      green = from[1],
      blue = from[2],
      func = [ 'down', 'down', 'down' ]

  // Check if value needs to go up (or stay as down)
  if(from[0] < to[0]) func[0] = 'up'
  if(from[1] < to[1]) func[1] = 'up'
  if(from[2] < to[2]) func[2] = 'up'
  
  // Check difference in from and to values
  redDiff = invertIfNegative(from[0]-to[0])
  greenDiff = invertIfNegative(from[1]-to[1])
  blueDiff = invertIfNegative(from[2]-to[2])

  console.log(`Dimming ${func} from ${from} to ${to}`)

  // initialize connection to OpenRGB
  const client = new OpenRGBClient({ host: 'localhost', port: 6742, name: 'Time LED changer' })
  await client.connect()
  const controllerCount = await client.getControllerCount()

  // Loop through devices
  for (var deviceId = 0; deviceId < controllerCount; deviceId++){
    const device = await client.getDeviceController(deviceId)
    console.log(device.name)
    await client.setCustomMode(deviceId)

    if(device.name == 'ASUS ROG STRIX B550-I GAMING'){
      var redStep = redDiff/steps
      var greenStep = greenDiff/steps
      var blueStep = blueDiff/steps

      // Loop through steps
      for (var i = -1; i < steps; i++){
        if(func[0] == 'up'){
          red += redStep
          if(red > to[0]) red = to[0]
        } else {
          red -= redStep
          if(red < to[0]) red = to[0]
        }

        if(func[1] == 'up'){
          green += greenStep
          if(green > to[1]) green = to[1]
        } else {
          green -= greenStep
          if(green < to[1]) green = to[1]
        }

        if(func[2] == 'up'){
          blue += blueStep
          if(blue > to[2]) blue = to[2]
        } else {
          blue -= blueStep
          if(blue < to[2]) blue = to[2]
        }

        var colors = Array(device.colors.length).fill({ red: Math.round(red), green: Math.round(green), blue: Math.round(blue) })
        await client.updateLeds(deviceId, colors)
        await sleep((fadeTid/steps)*1000)
      }
    } else {
      // RAM
      var colors = Array(device.colors.length).fill({ red: to[0], green: to[1], blue: to[2] })
      await client.updateLeds(deviceId, colors)
      await sleep(100)
    }
  }
  await client.disconnect()
}


// Stop ------------------------------------------------------------------
if (process.argv.includes('-stop')){
  // OpenRGB
  caseRgb([125, 0, 125], [10, 10, 10])

  // Hue
  const data = JSON.stringify({ on: false, transitiontime: 50 })
  const req = http.request(options, (res) => { res.on('data', (d) => process.stdout.write(d)) })
  req.on('error', (error) => console.error(error))
  req.write(data)
  req.end()
}
// Start ------------------------------------------------------------------
else if (process.argv.includes('-start')){
  // OpenRGB
  caseRgb([10, 10, 10], [125, 0, 125])

  // Hue
  const data = JSON.stringify({ on: true, sat: 100, bri: 154,  hue: 7000, transitiontime: 30 })
  const req = http.request(options, (res) => res.on('data', (d) => process.stdout.write(d)))
  req.on('error', (error) => console.error(error))
  req.write(data)
  req.end()
}
