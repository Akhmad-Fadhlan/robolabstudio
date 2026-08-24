import { JSDOM } from 'jsdom';
const xml = '<xml xmlns="https://developers.google.com/blockly/xml"><block type="arduino_setup" x="10" y="10"><statement name="SETUP"><block type="esp32_wifi_connect"><value name="SSID"><shadow type="text"><field name="TEXT">MyWiFi</field></shadow></value><value name="PASS"><shadow type="text"><field name="TEXT">password123</field></shadow></value><next><block type="esp32_websocket_connect"><value name="HOST"><shadow type="text"><field name="TEXT">echo.websocket.events</field></shadow></value><value name="PORT"><shadow type="math_number"><field name="NUM">80</field></shadow></value><value name="PATH"><shadow type="text"><field name="TEXT">/</field></shadow></value></block></next></block></statement></block><block type="arduino_loop" x="10" y="200"><statement name="LOOP"><block type="esp32_websocket_loop"><next><block type="controls_if"><value name="IF0"><block type="esp32_websocket_has_message"></block></value><statement name="DO0"><block type="arduino_serial_print"><field name="NEWLINE">TRUE</field><value name="TEXT"><block type="esp32_websocket_get_message"></block></value></block></statement><next><block type="arduino_serial_print"><field name="NEWLINE">TRUE</field><value name="TEXT"><block type="esp32_http_get"><value name="URL"><shadow type="text"><field name="TEXT">http://httpbin.org/get</field></shadow></value></block></value><next><block type="arduino_serial_print"><field name="NEWLINE">TRUE</field><value name="TEXT"><block type="esp32_http_post"><value name="URL"><shadow type="text"><field name="TEXT">http://httpbin.org/post</field></shadow></value><value name="CONTENT_TYPE"><shadow type="text"><field name="TEXT">application/json</field></shadow></value><value name="DATA"><shadow type="text"><field name="TEXT">{\"suhu\": 30}</field></shadow></value></block></value><next><block type="arduino_delay"><value name="DELAY_TIME"><shadow type="math_number"><field name="NUM">5000</field></shadow></value></block></next></block></next></block></next></block></next></block></statement></block></xml>';

try {
  const dom = new JSDOM(xml, { contentType: "text/xml" });
  const parserError = dom.window.document.querySelector("parsererror");
  if (parserError) {
    console.error("XML Parsing Error:", parserError.textContent);
  } else {
    console.log("XML is valid!");
    console.log("DATA field:", dom.window.document.querySelector('value[name="DATA"] field[name="TEXT"]').textContent);
  }
} catch(e) {
  console.log(e);
}
