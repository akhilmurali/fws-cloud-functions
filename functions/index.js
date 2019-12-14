const functions = require('firebase-functions');

const admin = require('firebase-admin');
admin.initializeApp();

// Take the text parameter passed to this HTTP endpoint and insert it into the
// Realtime Database under the path /messages/:pushId/original
exports.addMessage = functions.https.onRequest(async (req, res) => {
    // Grab the text parameter.
    const original = req.query.text;
    // Push the new message into the Realtime Database using the Firebase Admin SDK.
    const snapshot = await admin.database().ref('/messages').push({original: original});
    // Redirect with 303 SEE OTHER to the URL of the pushed object in the Firebase console.
    res.redirect(303, snapshot.ref.toString());
  });

// Listens for new messages added to /messages/:pushId/original and creates an
// uppercase version of the message to /messages/:pushId/uppercase
exports.makeUppercase = functions.database.ref('/messages/{pushId}/original')
    .onCreate((snapshot, context) => {
      // Grab the current value of what was written to the Realtime Database.
      const original = snapshot.val();
      console.log('Uppercasing', context.params.pushId, original);
      const uppercase = original.toUpperCase();
      // You must return a Promise when performing asynchronous tasks inside a Functions such as
      // writing to the Firebase Realtime Database.
      // Setting an "uppercase" sibling in the Realtime Database returns a Promise.
      return snapshot.ref.parent.child('uppercase').set(uppercase);
    });  


exports.fireAlertPublishHandler = functions.pubsub.topic('firealert').onPublish((message, context) => {
  const messageBody = message.data ? Buffer.from(message.data, 'base64').toString() : null;
  console.log(messageBody);
  console.log('The function was triggered at ', context.timestamp);
  console.log('The unique ID for the event is', context.eventId);
  admin.database().ref('/tokens').once('value').then((snapshot)=>{
    console.log("snapshot value", snapshot.val());
    const payload = {
      notification: {
          title: 'Fire Alert message',
          body: context.timestamp
      }
    };
    for (let key in snapshot.val()) {
      let token = snapshot.val()[key];
      admin.messaging().sendToDevice(token, payload)
    } 
  });
  return 0;
});

