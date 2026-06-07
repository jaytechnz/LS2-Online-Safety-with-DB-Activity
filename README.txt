Firebase version of the Online Safety and Privacy Case Study Website

Files:
- index.html: student page
- summaries.html: teacher display / printable summaries page
- firebase-config.js: paste your Firebase web app config here
- script.js: sends group responses to Firestore
- summaries.js: reads Firestore responses live
- styles.css: styling
- firestore-rules.txt: suggested temporary classroom rules

Setup:
1. Go to Firebase Console.
2. Create a project.
3. Add a web app.
4. Copy the Firebase config.
5. Paste it into firebase-config.js.
6. Create a Firestore database.
7. Add Firestore rules. For a short classroom task, you may use the rules in firestore-rules.txt.
8. Host the files using Firebase Hosting, Netlify, GitHub Pages, or another static host.

Important:
This version uses Firebase Firestore, so responses from different student devices can appear on summaries.html.
