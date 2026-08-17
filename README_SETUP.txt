SYVRA ONLINE STORE — SETUP GUIDE
================================

This is a static, responsive online-store starter for SYVRA.

FILES
-----
index.html
style.css
script.js
assets/syvra-logo.jpg

WHAT WORKS OUT OF THE BOX
-------------------------
- Premium black/gold SYVRA design
- Responsive desktop/tablet/mobile layout
- Product search and category filtering
- Shopping cart with quantity controls
- Checkout form + validation
- Order ID generation
- Order history stored in the customer's browser
- Pre-filled WhatsApp order confirmation
- No card details are collected by the starter
- No private API keys are exposed

IMPORTANT: WHATSAPP NUMBER
--------------------------
Open script.js and find:

WHATSAPP_NUMBER: "923XXXXXXXXX"

Replace it with your WhatsApp number in international format, without +, spaces or dashes.

Example format:
923001234567

The customer will then get a WhatsApp button after order confirmation. The button opens WhatsApp with the complete order message already filled in. The customer presses SEND.

WHY IT DOES NOT AUTO-SEND
-------------------------
A normal HTML/CSS/JS website cannot securely send WhatsApp Business API messages directly without a server/backend and Meta credentials. Do NOT put a WhatsApp access token inside script.js.

If you want fully automatic server-side WhatsApp messages later, use a backend + Meta WhatsApp Cloud API and keep the token on the server.

GOOGLE SIGN-IN
--------------
The Google button is wired for Firebase Authentication.

1. Create a Firebase project.
2. Add a Web App.
3. Firebase Console → Authentication → Sign-in method → enable Google.
4. Add your live website domain under Authentication → Settings → Authorized domains.
5. Copy the Firebase Web App config.
6. Paste it into CONFIG.FIREBASE_CONFIG in script.js.
7. Deploy.

The Firebase web config is intended for browser use, but your Firebase Authentication/Firestore Security Rules still need to be configured correctly.

GITHUB PAGES / STATIC HOSTING
-----------------------------
This project can be deployed as a static site.

GitHub Pages:
1. Create a repository.
2. Upload index.html, style.css, script.js and assets/.
3. Settings → Pages → deploy from your main branch / root.
4. Open the generated site.

Do not rename index.html.

REAL ORDERS / DATABASE
----------------------
The starter saves orders in localStorage, which means order history is tied to the customer's browser.

For a real production store where you can see every customer's order from an admin dashboard, connect a backend/database such as Firebase Firestore or your own secure server.

PRODUCTION SAFETY
-----------------
- Never put payment gateway secret keys in frontend JavaScript.
- Never put WhatsApp API tokens in frontend JavaScript.
- Validate data again on the server before fulfilling orders.
- Use HTTPS in production.
- Configure Firebase Security Rules if Firebase is connected.
- Use a real payment provider rather than collecting card details yourself.


NEW FEATURES IN THIS UPDATED BUILD
----------------------------------
- Animated SYVRA promotional side ad with close button.
- Direct "Chat with SYVRA on WhatsApp" link under the WhatsApp order-send button.
- Review Order stays disabled until required checkout fields are completed and the confirmation checkbox is selected.
- Live checkout validation updates the Review Order button automatically.
