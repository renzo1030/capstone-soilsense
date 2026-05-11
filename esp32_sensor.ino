#include <WiFi.h>
#include <HTTPClient.h>

// Wokwi's free virtual WiFi network
const char* ssid = "Wokwi-GUEST";
const char* password = "";

// ⚠️ IMPORTANT: Replace this with your ngrok URL!
// Example: "http://1234-abcd.ngrok.io/api/iot/upload/"
const char* serverName = "YOUR_NGROK_URL_HERE/api/iot/upload/";

void setup() {
  Serial.begin(115200);
  
  // 1. Connect to Virtual WiFi
  WiFi.begin(ssid, password);
  Serial.println("Connecting to WiFi...");
  while(WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("");
  Serial.println("✅ WiFi Connected in Wokwi!");
}

void loop() {
  if(WiFi.status() == WL_CONNECTED){
    HTTPClient http;
    
    // 2. Setup the connection to Django
    http.begin(serverName);
    http.addHeader("Content-Type", "application/json");
    
    // 3. Generate Fake Sensor Data (Just like our Python script)
    int farm_id = 1;
    float nitrogen = random(1000, 5000) / 100.0;
    float phosphorus = random(1000, 5000) / 100.0;
    float potassium = random(1000, 5000) / 100.0;
    float ph = random(450, 850) / 100.0;
    float moisture = random(2000, 8000) / 100.0;
    
    // 4. Format data as JSON
    String jsonPayload = "{\"farm_id\":" + String(farm_id) + 
                         ",\"nitrogen\":" + String(nitrogen) + 
                         ",\"phosphorus\":" + String(phosphorus) + 
                         ",\"potassium\":" + String(potassium) + 
                         ",\"ph\":" + String(ph) + 
                         ",\"moisture\":" + String(moisture) + "}";
                         
    Serial.println("Sending Data: " + jsonPayload);
    
    // 5. Send POST Request
    int httpResponseCode = http.POST(jsonPayload);
    
    if (httpResponseCode > 0) {
      Serial.print("✅ Server Response Code: ");
      Serial.println(httpResponseCode);
      String response = http.getString();
      Serial.println("Response Body: " + response);
    } else {
      Serial.print("❌ Error Code: ");
      Serial.println(httpResponseCode);
      Serial.println("Check if your Django server and ngrok are running!");
    }
    
    http.end(); // Free resources
  }
  
  // Wait 10 seconds before sending next reading
  delay(10000);
}
