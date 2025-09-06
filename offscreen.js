/**
 * Offscreen document for handling audio playback
 * This runs in a document context where Audio API is available
 */

let currentAudio = null;
let currentAudioUrl = null;

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Offscreen: Received message:", message);
  console.log("Offscreen: Message action:", message.action);
  console.log("Offscreen: Message settings:", message.settings);

  if (message.action === "playAlarm") {
    // Only process messages with settings (from background script)
    if (!message.settings) {
      console.log(
        "Offscreen: Ignoring playAlarm without settings (likely from content script)"
      );
      return true;
    }

    // Handle playAlarm asynchronously
    playAlarm(message.settings)
      .then(() => {
        console.log("Offscreen: playAlarm completed successfully");
        sendResponse({ success: true });
      })
      .catch((error) => {
        console.error("Offscreen: playAlarm failed:", error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep message channel open for async response
  } else if (message.action === "stopAlarm") {
    try {
      stopAlarm();
      sendResponse({ success: true });
    } catch (error) {
      console.error("Offscreen: stopAlarm failed:", error);
      sendResponse({ success: false, error: error.message });
    }
  } else {
    // Unknown action
    console.log("Offscreen: Unknown action received:", message.action);
    sendResponse({ success: false, error: "Unknown action" });
  }

  return true; // Keep message channel open for async response
});

async function playAlarm(settings) {
  try {
    console.log("Offscreen: Playing alarm with settings:", settings);

    // Validate settings object
    if (!settings || typeof settings !== "object") {
      console.error("Offscreen: Invalid settings object received:", settings);
      settings = {
        alertSoundType: "default",
        alertSoundData: "",
      };
    }

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
  // Send message to background script to create notification
  // (chrome.notifications is not available in offscreen documents)
  chrome.runtime.sendMessage({
    action: "createFallbackNotification",
    title: "RHAT - Tasks Available!",
    message: "🎉 Tasks are available! Click to return to RaterHub.",
  });
}

// Handle page unload to clean up
window.addEventListener("beforeunload", () => {
  stopAlarm();
});
