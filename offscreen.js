/**
 * Offscreen document for handling audio playback
 * This runs in a document context where Audio API is available
 */

let currentAudio = null;
let currentAudioUrl = null;

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Offscreen: Received message:", message.action);

  if (message.action === "playAlarm") {
    playAlarm(message.settings);
    sendResponse({ success: true });
  } else if (message.action === "stopAlarm") {
    stopAlarm();
    sendResponse({ success: true });
  }

  return true; // Keep message channel open for async response
});

async function playAlarm(settings) {
  try {
    console.log("Offscreen: Playing alarm with settings:", settings);

    // Stop any existing audio first
    stopAlarm();

    let audioUrl;

    // Determine which audio to play based on settings
    if (settings.alertSoundType === "file" && settings.alertSoundData) {
      audioUrl = settings.alertSoundData;
      console.log("Offscreen: Using custom file sound");
    } else if (settings.alertSoundType === "url" && settings.alertSoundData) {
      audioUrl = settings.alertSoundData;
      console.log("Offscreen: Using custom URL sound");
    } else {
      // Use default alarm sound
      audioUrl = chrome.runtime.getURL("alarm.mp3");
      console.log("Offscreen: Using default alarm sound");
    }

    // Create and play audio
    currentAudio = new Audio(audioUrl);
    currentAudioUrl = audioUrl;
    currentAudio.volume = 1.0;
    currentAudio.loop = false;

    // Add event listeners
    currentAudio.addEventListener("canplaythrough", () => {
      console.log("Offscreen: Audio can play through");
    });

    currentAudio.addEventListener("error", (e) => {
      console.error("Offscreen: Audio error:", e);
      fallbackNotification();
    });

    currentAudio.addEventListener("ended", () => {
      console.log("Offscreen: Audio playback completed");
      currentAudio = null;
      currentAudioUrl = null;
    });

    // Play the audio
    try {
      await currentAudio.play();
      console.log("Offscreen: Audio started playing successfully");
    } catch (playError) {
      console.error("Offscreen: Failed to play audio:", playError);
      fallbackNotification();
    }
  } catch (error) {
    console.error("Offscreen: Error in playAlarm:", error);
    fallbackNotification();
  }
}

function stopAlarm() {
  try {
    if (currentAudio) {
      console.log("Offscreen: Stopping current audio");
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio = null;
      currentAudioUrl = null;
    }
  } catch (error) {
    console.error("Offscreen: Error stopping audio:", error);
  }
}

function fallbackNotification() {
  // Create a notification as final fallback
  chrome.notifications.create(
    {
      type: "basic",
      iconUrl: chrome.runtime.getURL("icon.png"),
      title: "RHAT - Tasks Available!",
      message: "🎉 Tasks are available! Click to return to RaterHub.",
      priority: 2,
      requireInteraction: true,
    },
    (notificationId) => {
      if (chrome.runtime.lastError) {
        console.error(
          "Offscreen: Notification error:",
          chrome.runtime.lastError
        );
      } else {
        console.log(
          "Offscreen: Fallback notification created:",
          notificationId
        );
      }
    }
  );
}

// Handle page unload to clean up
window.addEventListener("beforeunload", () => {
  stopAlarm();
});
