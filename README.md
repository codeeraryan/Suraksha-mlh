<div align="center">
  <h1>🛡️ Suraksha</h1>
  <p><strong>Advanced Women's Safety Companion App</strong></p>
  <p>Built for Hackathons | Empowering Safety Through Technology</p>
</div>



https://github.com/user-attachments/assets/0003edd9-6b35-4237-9d13-a96642177d1f




<br />

**Suraksha** is a comprehensive, multi-layered women’s safety application built with React Native. It pushes the boundaries of standard emergency apps by combining **Hardware Integration (BLE)**, **Offline ML Voice Recognition**, and **Generative AI** into an accessible consumer application.

Our mission is to ensure that requesting emergency help is frictionless, immediate, and heavily documented in order to protect women and prevent escalation in threatening environments.

---

## 🌟 The "Wow" Factor: Key Features

### 1. 🚨 Triple-Tier SOS Triggering
In dangerous situations, reaching for a phone and unlocking it isn't always possible. Suraksha supports triggering an emergency alert through 3 distinct methods:
- **🗣️ Offline Voice Wake-Word:** Embedded ML (Vosk) continuously listens in the background. Simply yelling **"Help"** triggers the SOS instantly—no internet required to process the speech!
- **🔘 Hardware BLE Integration:** Connect a compatible Bluetooth Low Energy ring or button. A simple discreet click on the physical hardware will secretly trigger the SOS protocol.
- **📱 On-Screen SOS Button:** A massive, easily accessible red button on the app's main dashboard.

### 2. 🎙️ Automatic Audio Evidence Collection
As soon as an SOS is activated, the app initiates a covert **10-second background audio recording**. This file is converted to Base64 and embedded directly within the emergency alert packet, providing authorities and guardians with crucial, real-time contextual evidence.

### 3. ☁️ Real-time Guardian Network
When an SOS is dispatched, it fires off in multiple ways simultaneously:
- **Direct SMS Fallback:** Instantly sends SMS texts to emergency contacts containing an SOS message and a Google Maps tracking link.
- **Firebase Real-Time Prompts:** If guardians have the app installed, a live Firebase Firestore listener interrupts whatever they are doing on their phone with an unmissable in-app prompt and alert, showing them the victim's location and audio evidence.

### 4. 🧠 Gemini AI-Powered Safety Tips
Through a robust integration with **Google Gemini Pro**, the app generates dynamic, randomized, and context-aware safety tips directly on the home dashboard. This helps users stay vigilant by ingesting up-to-date, practical safety guidelines without developer hardcoding.

### 5. 👻 Background Execution
The app utilizes robust background services to remain completely active when your phone is locked or minimized. Voice detection and BLE connection statuses persist seamlessly without draining immense battery power.

### 6. 📱 Fake Call & Utility Suite
Suraksha also includes preventative tools! Navigate to the Fake Call utility to instantly simulate a realistic incoming phone call, offering an easy and universally accepted excuse to walk away from uncomfortable situations.

---

## 💻 Tech Stack

- **Frontend:** React Native (v0.84.1) & React Navigation.
- **Backend & Cloud:** Firebase (Auth, Firestore, Cloud Firestore, Realtime Database) for seamless multi-user live synchronization.
- **Machine Learning (Voice):** `react-native-vosk` for complete offline offline STT (Speech-to-Text) wake word detection.
- **Hardware Integrations:** `react-native-ble-plx` and `react-native-ble-manager` for communicating natively with connected Bluetooth Low Energy wearables.
- **Generative AI:** Google Gemini API (`generativelanguage.googleapis.com`) integration.
- **Hardware APIs:** `@react-native-community/geolocation`, `react-native-audio-record`, `react-native-sms`, and `react-native-fs`.

---

## 📁 Project Architecture

- `/src/screens/` - Contains all primary UI views (`SOSScreen.jsx`, `AlertScreen.jsx`, `FakeCallScreen.jsx`, etc.)
- `/src/context/` - `securityContext.js` is the heartbeat of Suraksha. It manages Bluetooth state monitoring, Voice Detection background threads, Firebase listener updates, Permissions, and Audio Chunking logic.
- `/src/navigation/` - Secure Stack and Tab routing separating Auth wrappers from the main app interface. 
- `/firebase.js` - Central setup linking up the Google services configs.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v22+ required based on engine specs)
- Java Development Kit (JDK 17+)
- Android Studio & Android SDK (For Android emulation/compilation)

### Installation
1. Clone the repository and install dependencies:
   ```sh
   npm install
   ```

2. Start the Metro Bundler:
   ```sh
   npm start
   ```

3. Launch the Application:
   *We heavily recommend running on a Physical Android Device to test BLE, SMS, and Microphone integrations properly.*
   ```sh
   npm run android
   ```

*(Note: Ensure you have granted Location, Microphone, and Bluetooth permissions when prompted to fully utilize the SOS Context).*

---

## 🏆 Why this matters for Hackathons
Suraksha is not just a CRUD application. It intersects **Hardware (IoT)**, **Artificial Intelligence (GenAI & Offline ML)**, and **Cloud-Synchronized Mobile Development** simultaneously. The code tackles very complex mobile edge cases like backgrounding, byte recording formats, hardware permissions, and instantaneous network distribution, wrapping it all into an aesthetically pleasing and potentially life-saving package.

*Stay safe. Stay connected. With Suraksha.*
