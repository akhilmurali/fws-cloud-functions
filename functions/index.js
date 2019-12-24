const functions = require('firebase-functions');

const admin = require('firebase-admin');
admin.initializeApp();

exports.fireAlertPublishHandler = functions.pubsub.topic('firealert-topic').onPublish((message, context) => {
  var messageBody = message.data ? Buffer.from(message.data, 'base64').toString() : null;
  console.log(messageBody);
  console.log('The function was triggered at ', context.timestamp);
  console.log('The unique ID for the event is', context.eventId);
  messageBody = JSON.parse(messageBody);
  console.log("sensor data from node", messageBody.ppm, messageBody.temp, messageBody.hum);
  let sensorData = {};
  sensorData.sensorId = "esp8266_5EDAF0";
  sensorData.timestamp = Date().toLocaleString();
  sensorData.mqppm = messageBody.ppm + "ppm";
  sensorData.temperature = messageBody.temp + "C";
  sensorData.humidity = messageBody.hum;
  console.log(sensorData);
  //Store the data into the database:
  admin.database().ref('/sensordata').push(sensorData);
  if (messageBody.ppm > 0) {
    admin.database().ref('/tokens').once('value').then((snapshot) => {
      console.log("snapshot value", snapshot.val());
      const payload = {
        notification: {
          title: 'Fire Alert!',
          body: "Evacuate the premises immediately."
        },
        data:{
          title: "Fire alert",
          body: "Fire alert"
        }
      };
      for (let key in snapshot.val()) {
        let token = snapshot.val()[key];
        admin.messaging().sendToDevice(token, payload)
      }
    });
  }

  return 0;
});

