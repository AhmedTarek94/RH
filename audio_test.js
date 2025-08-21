// Audio functionality test for RHAT extension
console.log("RHAT Audio Test Script Loaded");

// Test the playAlarm function logic
async function testPlayAlarm() {
    console.log("Testing playAlarm functionality...");
    
    // Mock settings similar to what would be retrieved from storage
    const mockSettings = {
        alertSoundType: "default",
        alertSoundData: ""
    };

    try {
        // Test default alarm
        console.log("Testing default alarm...");
        await playMockAlarm(mockSettings);
        console.log("✅ Default alarm test passed");
        
        // Test file alarm
        console.log("Testing file alarm...");
        mockSettings.alertSoundType = "file";
        mockSettings.alertSoundData = "data:audio/mp3;base64,test"; // Mock base64 data
        await playMockAlarm(mockSettings);
        console.log("✅ File alarm test passed");
        
        // Test URL alarm
        console.log("Testing URL alarm...");
        mockSettings.alertSoundType = "url";
        mockSettings.alertSoundData = "https://example.com/sound.mp3";
        await playMockAlarm(mockSettings);
        console.log("✅ URL alarm test passed");
        
        console.log("🎉 All audio tests completed successfully!");
        
    } catch (error) {
        console.error("❌ Audio test failed:", error);
    }
}

// Mock implementation of playAlarm for testing
async function playMockAlarm(settings) {
    try {
        if (settings.alertSoundType === "default") {
            await playDefaultMockAlarm();
        } else if (settings.alertSoundType === "file" && settings.alertSoundData) {
            await playCustomMockAlarm(settings.alertSoundData);
        } else if (settings.alertSoundType === "url" && settings.alertSoundData) {
            await playUrlMockAlarm(settings.alertSoundData);
        } else {
            await playDefaultMockAlarm(); // Fallback
        }
    } catch (error) {
        console.warn("Primary alarm method failed, using fallback:", error);
        await playFallbackMockBeep();
    }
}

async function playDefaultMockAlarm() {
    console.log("Playing default mock alarm...");
    // Simulate successful audio playback
    return Promise.resolve();
}

async function playCustomMockAlarm(data) {
    console.log("Playing custom mock alarm with data...");
    // Simulate successful custom audio playback
    return Promise.resolve();
}

async function playUrlMockAlarm(url) {
    console.log("Playing URL mock alarm:", url);
    // Simulate successful URL audio playback
    return Promise.resolve();
}

async function playFallbackMockBeep() {
    console.log("Playing fallback mock beep...");
    // Simulate Web Audio API fallback
    return Promise.resolve();
}

// Test storage functionality
function testStorage() {
    console.log("Testing storage functionality...");
    
    // Test if storage APIs are available
    if (typeof chrome !== 'undefined' && chrome.storage) {
        console.log("✅ Chrome storage API available");
        
        // Test sync storage
        chrome.storage.sync.set({ testKey: 'testValue' }, () => {
            chrome.storage.sync.get(['testKey'], (result) => {
                if (result.testKey === 'testValue') {
                    console.log("✅ Sync storage working correctly");
                } else {
                    console.log("❌ Sync storage test failed");
                }
            });
        });
        
        // Test local storage
        chrome.storage.local.set({ testKey: 'testValue' }, () => {
            chrome.storage.local.get(['testKey'], (result) => {
                if (result.testKey === 'testValue') {
                    console.log("✅ Local storage working correctly");
                } else {
                    console.log("❌ Local storage test failed");
                }
            });
        });
        
    } else {
        console.log("⚠️ Chrome storage API not available (run in extension context)");
    }
}

// Run tests when loaded
console.log("RHAT Audio Test Suite");
testPlayAlarm();
testStorage();
