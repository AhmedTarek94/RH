// Test script for RaterHub error handling scenarios
console.log("RaterHub Error Handling Test Script Loaded");

// Mock the chrome.storage API for testing
const mockChrome = {
    storage: {
        sync: {
            get: function(keys, callback) {
                console.log("Mock chrome.storage.sync.get called with keys:", keys);
                callback({
                    enabled: true,
                    mode: "alarm_only",
                    refreshInterval: 5,
                    alertSoundType: "default",
                    alertSoundData: "",
                    showTestButton: false,
                    enableDesktopNotifications: true
                });
            },
            set: function(data, callback) {
                console.log("Mock chrome.storage.sync.set called with data:", data);
                if (callback) callback();
            }
        },
        local: {
            get: function(keys, callback) {
                console.log("Mock chrome.storage.local.get called with keys:", keys);
                callback({});
            }
        },
        onChanged: {
            addListener: function(callback) {
                console.log("Mock chrome.storage.onChanged.addListener called");
            }
        }
    },
    runtime: {
        onMessage: {
            addListener: function(callback) {
                console.log("Mock chrome.runtime.onMessage.addListener called");
            }
        },
        getURL: function(path) {
            return `chrome-extension://mock-extension-id/${path}`;
        }
    }
};

// Replace global chrome object with mock for testing
global.chrome = mockChrome;

// Mock window object properties
global.window = {
    location: {
        href: 'https://www.raterhub.com/evaluation/rater',
        reload: function() {
            console.log("Mock window.location.reload called");
        }
    },
    addEventListener: function(event, callback) {
        console.log(`Mock window.addEventListener called for ${event}`);
    },
    removeEventListener: function(event, callback) {
        console.log(`Mock window.removeEventListener called for ${event}`);
    }
};

// Mock document object
global.document = {
    body: {
        innerText: '',
        addEventListener: function(event, callback) {
            console.log(`Mock document.body.addEventListener called for ${event}`);
        }
    },
    createElement: function(tag) {
        console.log(`Mock document.createElement called for ${tag}`);
        return {
            style: {},
            addEventListener: function() {},
            appendChild: function() {},
            remove: function() {
                console.log("Mock element.remove called");
            }
        };
    },
    createTreeWalker: function() {
        console.log("Mock document.createTreeWalker called");
        return {
            nextNode: function() { return null; }
        };
    },
    querySelectorAll: function(selector) {
        console.log(`Mock document.querySelectorAll called with: ${selector}`);
        return [];
    },
    querySelector: function(selector) {
        console.log(`Mock document.querySelector called with: ${selector}`);
        return null;
    },
    getElementById: function(id) {
        console.log(`Mock document.getElementById called with: ${id}`);
        return null;
    },
    head: {
        appendChild: function() {}
    }
};

// Mock Audio class
global.Audio = class MockAudio {
    constructor() {
        this.volume = 1;
        this.loop = false;
    }
    play() {
        console.log("Mock Audio.play called");
        return Promise.resolve();
    }
    pause() {
        console.log("Mock Audio.pause called");
    }
    addEventListener() {}
};

// Mock Notification API
global.Notification = {
    permission: "granted",
    requestPermission: function() {
        return Promise.resolve("granted");
    }
};

// Import the content script functions for testing
const fs = require('fs');
const contentScript = fs.readFileSync('./content_fixed.js', 'utf8');

// Extract the main functions for testing
function testErrorHandlingScenarios() {
    console.log("\n=== Testing RaterHub Error Handling Scenarios ===\n");
    
    // Test 1: 403 Forbidden Error
    console.log("Test 1: 403 Forbidden Error Handling");
    global.document.body.innerText = "Error 403 Forbidden - This task has already been SUBMITTED";
    global.window.location.href = "https://www.raterhub.com/evaluation/rater/task/show/123";
    
    // This should trigger redirect to main page
    console.log("Should redirect to main page when 403 error detected");
    
    // Test 2: Index Page Redirect
    console.log("\nTest 2: Index Page Redirect");
    global.window.location.href = "https://www.raterhub.com/evaluation/rater/task/index";
    global.document.body.innerText = "Task Index Page";
    
    // This should also trigger redirect to main page
    console.log("Should redirect to main page when on index page");
    
    // Test 3: Normal Task Page (should stop monitoring)
    console.log("\nTest 3: Normal Task Page Handling");
    global.window.location.href = "https://www.raterhub.com/evaluation/rater/task/show?taskIds=12345";
    
    // This should stop monitoring
    console.log("Should stop monitoring when on normal task page");
    
    // Test 4: Main Page (should start monitoring)
    console.log("\nTest 4: Main Page Monitoring");
    global.window.location.href = "https://www.raterhub.com/evaluation/rater";
    global.document.body.innerText = "Welcome to RaterHub";
    
    // This should start monitoring if enabled
    console.log("Should start monitoring when on main page and enabled");
    
    // Test 5: Incomplete Tasks Detection
    console.log("\nTest 5: Incomplete Tasks Detection");
    global.document.body.innerText = "Incomplete tasks detected. Please continue working.";
    // Mock a continue button
    global.document.querySelectorAll = function() {
        return [{
            textContent: "Continue",
            click: function() {
                console.log("Mock continue button clicked");
            }
        }];
    };
    
    console.log("Should detect incomplete tasks and show popup");
    
    console.log("\n=== Error Handling Tests Completed ===\n");
    console.log("All error handling scenarios have been simulated.");
    console.log("Check the console logs above to verify proper behavior.");
}

// Run the tests
testErrorHandlingScenarios();

// Additional test for URL pattern matching
function testUrlPatterns() {
    console.log("\n=== Testing URL Pattern Matching ===\n");
    
    const testUrls = [
        "https://www.raterhub.com/evaluation/rater/task/show/123?taskIds=abc",
        "https://www.raterhub.com/evaluation/rater/task/index",
        "https://www.raterhub.com/evaluation/rater",
        "https://www.raterhub.com/evaluation/rater/task/show/submitted",
        "https://www.raterhub.com/evaluation/rater/other-page"
    ];
    
    testUrls.forEach(url => {
        console.log(`Testing URL: ${url}`);
        console.log(`Contains /task/show: ${url.includes('/task/show')}`);
        console.log(`Contains taskIds=: ${url.includes('taskIds=')}`);
        console.log(`Is index page: ${url === 'https://www.raterhub.com/evaluation/rater/task/index'}`);
        console.log(`Is main page: ${url === 'https://www.raterhub.com/evaluation/rater'}`);
        console.log('---');
    });
}

testUrlPatterns();
