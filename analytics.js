// Analytics system for RaterHub Task Monitor
// Handles task history tracking, performance analytics, and reporting

class AnalyticsManager {
    constructor() {
        this.isInitialized = false;
        this.currentSession = {
            startTime: Date.now(),
            tasksFound: 0,
            tasksAcquired: 0,
            tasksCompleted: 0,
            tasksFailed: 0,
            monitoringTime: 0,
            idleTime: 0
        };
        
        this.defaultSettings = {
            dataRetentionDays: 90,
            trackPerformance: true,
            trackEarnings: true,
            trackTaskTypes: true,
            autoExport: false,
            exportFormat: 'csv'
        };
    }

    // Initialize analytics system
    async initialize() {
        try {
            // Load settings
            await this.loadSettings();
            
            // Initialize session tracking
            this.startSession();
            
            // Start performance monitoring
            this.startPerformanceMonitoring();
            
            this.isInitialized = true;
            console.log('Analytics system initialized');
        } catch (error) {
            console.error('Failed to initialize analytics:', error);
        }
    }

    // Load analytics settings
    async loadSettings() {
        try {
            const data = await chrome.storage.sync.get(['analyticsSettings']);
            this.settings = { ...this.defaultSettings, ...(data.analyticsSettings || {}) };
        } catch (error) {
            console.error('Error loading analytics settings:', error);
            this.settings = this.defaultSettings;
        }
    }

    // Save analytics settings
    async saveSettings() {
        try {
            await chrome.storage.sync.set({ analyticsSettings: this.settings });
        } catch (error) {
            console.error('Error saving analytics settings:', error);
        }
    }

    // Start a new monitoring session
    startSession() {
        this.currentSession = {
            startTime: Date.now(),
            tasksFound: 0,
            tasksAcquired: 0,
            tasksCompleted: 0,
            tasksFailed: 0,
            monitoringTime: 0,
            idleTime: 0,
            peakMemoryUsage: 0,
            averageCpuUsage: 0
        };
        
        this.sessionInterval = setInterval(() => {
            this.currentSession.monitoringTime += 1;
        }, 1000);
    }

    // End current session and save data
    async endSession() {
        if (this.sessionInterval) {
            clearInterval(this.sessionInterval);
        }
        
        await this.saveSessionData();
        this.currentSession = null;
    }

    // Track task found event
    async trackTaskFound(taskData = {}) {
        if (!this.isInitialized) return;
        
        this.currentSession.tasksFound++;
        
        const event = {
            type: 'task_found',
            timestamp: Date.now(),
            sessionId: this.currentSession.startTime,
            taskData: this.extractTaskInfo(taskData),
            ...this.getPerformanceMetrics()
        };
        
        await this.saveEvent(event);
    }

    // Track task acquired event
    async trackTaskAcquired(taskData = {}) {
        if (!this.isInitialized) return;
        
        this.currentSession.tasksAcquired++;
        
        const event = {
            type: 'task_acquired',
            timestamp: Date.now(),
            sessionId: this.currentSession.startTime,
            taskData: this.extractTaskInfo(taskData),
            ...this.getPerformanceMetrics()
        };
        
        await this.saveEvent(event);
    }

    // Track task completed event
    async trackTaskCompleted(taskData = {}) {
        if (!this.isInitialized) return;
        
        this.currentSession.tasksCompleted++;
        
        const event = {
            type: 'task_completed',
            timestamp: Date.now(),
            sessionId: this.currentSession.startTime,
            taskData: this.extractTaskInfo(taskData),
            completionTime: this.calculateCompletionTime(taskData),
            ...this.getPerformanceMetrics()
        };
        
        await this.saveEvent(event);
    }

    // Track task failed event
    async trackTaskFailed(taskData = {}, errorType = 'unknown') {
        if (!this.isInitialized) return;
        
        this.currentSession.tasksFailed++;
        
        const event = {
            type: 'task_failed',
            timestamp: Date.now(),
            sessionId: this.currentSession.startTime,
            taskData: this.extractTaskInfo(taskData),
            errorType: errorType,
            ...this.getPerformanceMetrics()
        };
        
        await this.saveEvent(event);
    }

    // Track monitoring state change
    async trackMonitoringState(enabled, reason = 'user') {
        if (!this.isInitialized) return;
        
        const event = {
            type: 'monitoring_state',
            timestamp: Date.now(),
            sessionId: this.currentSession.startTime,
            enabled: enabled,
            reason: reason,
            ...this.getPerformanceMetrics()
        };
        
        await this.saveEvent(event);
    }

    // Extract task type from task data
    extractTaskType(task) {
        try {
            // Implementation for extracting task type from Rater Hub page
            if (typeof task === 'object' && task.type) {
                return task.type;
            }
            
            // If task is a DOM element or page context, extract from page structure
            if (typeof task === 'object' && task.querySelector) {
                // Look for common task type indicators
                const typeElement = task.querySelector('[class*="type"], [class*="task-type"], [data-type]');
                if (typeElement) {
                    const typeText = typeElement.textContent.toLowerCase().trim();
                    if (typeText.includes('search')) return 'search';
                    if (typeText.includes('evaluation')) return 'evaluation';
                    if (typeText.includes('comparison')) return 'comparison';
                    if (typeText.includes('rating')) return 'rating';
                    if (typeText.includes('review')) return 'review';
                }
                
                // Check URL for task type indicators
                if (window.location.href.includes('search')) return 'search';
                if (window.location.href.includes('evaluation')) return 'evaluation';
                if (window.location.href.includes('comparison')) return 'comparison';
            }
            
            // Default fallback
            return 'unknown';
        } catch (error) {
            console.error('Error extracting task type:', error);
            return 'unknown';
        }
    }

    // Extract task duration from task data
    extractTaskDuration(task) {
        try {
            // Implementation for extracting task duration from Rater Hub page
            if (typeof task === 'object' && task.duration) {
                return task.duration;
            }
            
            // If task is a DOM element or page context, extract from page structure
            if (typeof task === 'object' && task.querySelector) {
                // Look for duration indicators in the page
                const durationElement = task.querySelector('[class*="duration"], [class*="time"], [class*="minutes"], [data-duration]');
                if (durationElement) {
                    const durationText = durationElement.textContent.toLowerCase().trim();
                    
                    // Parse duration text (e.g., "5 minutes", "10 min", "30m")
                    const durationMatch = durationText.match(/(\d+)\s*(?:min|minutes|m)/);
                    if (durationMatch) {
                        return parseInt(durationMatch[1]);
                    }
                    
                    // Try other patterns
                    const numberMatch = durationText.match(/\d+/);
                    if (numberMatch) {
                        return parseInt(numberMatch[0]);
                    }
                }
                
                // Look for duration in nearby elements
                const timeElements = task.querySelectorAll('span, div, p');
                for (const element of timeElements) {
                    const text = element.textContent.toLowerCase().trim();
                    if (text.includes('min') || text.includes('minute')) {
                        const match = text.match(/(\d+)\s*(?:min|minutes|m)/);
                        if (match) {
                            return parseInt(match[1]);
                        }
                    }
                }
            }
            
            // Default fallback - estimate based on task type
            const taskType = this.extractTaskType(task);
            switch (taskType) {
                case 'search': return 5; // 5 minutes for search tasks
                case 'evaluation': return 10; // 10 minutes for evaluation tasks
                case 'comparison': return 15; // 15 minutes for comparison tasks
                case 'rating': return 3; // 3 minutes for rating tasks
                case 'review': return 8; // 8 minutes for review tasks
                default: return 7; // 7 minutes average
            }
        } catch (error) {
            console.error('Error extracting task duration:', error);
            return 5; // Default fallback duration
        }
    }

    // Extract task reward from task data
    extractTaskReward(task) {
        try {
            // Implementation for extracting task reward from Rater Hub page
            if (typeof task === 'object' && task.reward) {
                return task.reward;
            }
            
            // If task is a DOM element or page context, extract from page structure
            if (typeof task === 'object' && task.querySelector) {
                // Look for reward indicators in the page
                const rewardElement = task.querySelector('[class*="reward"], [class*="payment"], [class*="amount"], [class*="$"], [data-reward]');
                if (rewardElement) {
                    const rewardText = rewardElement.textContent.toLowerCase().trim();
                    
                    // Parse reward text (e.g., "$0.15", "15¢", "0.15 USD")
                    const dollarMatch = rewardText.match(/\$(\d+\.?\d*)/);
                    if (dollarMatch) {
                        return parseFloat(dollarMatch[1]);
                    }
                    
                    const centMatch = rewardText.match(/(\d+)\s*¢/);
                    if (centMatch) {
                        return parseFloat(centMatch[1]) / 100;
                    }
                    
                    const numberMatch = rewardText.match(/(\d+\.?\d*)/);
                    if (numberMatch) {
                        const amount = parseFloat(numberMatch[1]);
                        // If it's a small number (likely cents), convert to dollars
                        if (amount < 5 && !rewardText.includes('$')) {
                            return amount / 100;
                        }
                        return amount;
                    }
                }
                
                // Look for reward in nearby elements
                const moneyElements = task.querySelectorAll('span, div, p, strong, b');
                for (const element of moneyElements) {
                    const text = element.textContent.toLowerCase().trim();
                    if (text.includes('$') || text.includes('reward') || text.includes('payment')) {
                        const dollarMatch = text.match(/\$(\d+\.?\d*)/);
                        if (dollarMatch) {
                            return parseFloat(dollarMatch[1]);
                        }
                        
                        const numberMatch = text.match(/(\d+\.?\d*)/);
                        if (numberMatch) {
                            const amount = parseFloat(numberMatch[1]);
                            if (amount < 5 && !text.includes('$')) {
                                return amount / 100;
                            }
                            return amount;
                        }
                    }
                }
            }
            
            // Default fallback - estimate based on task type and duration
            const taskType = this.extractTaskType(task);
            const duration = this.extractTaskDuration(task);
            
            switch (taskType) {
                case 'search': return 0.10; // $0.10 for search tasks
                case 'evaluation': return 0.20; // $0.20 for evaluation tasks
                case 'comparison': return 0.25; // $0.25 for comparison tasks
                case 'rating': return 0.08; // $0.08 for rating tasks
                case 'review': return 0.15; // $0.15 for review tasks
                default: return 0.12; // $0.12 average
            }
        } catch (error) {
            console.error('Error extracting task reward:', error);
            return 0.10; // Default fallback reward
        }
    }

    // Extract task information from page data
    extractTaskInfo(taskData) {
        try {
            // Implementation for extracting task information from Rater Hub page
            const taskInfo = {
                type: 'unknown',
                duration: 0,
                reward: 0,
                complexity: 'medium',
                detectedAt: Date.now()
            };

            if (typeof taskData === 'object') {
                // Extract type
                taskInfo.type = this.extractTaskType(taskData);

                // Extract duration
                const duration = this.extractTaskDuration(taskData);
                taskInfo.duration = duration !== null ? duration : 0;

                // Extract reward
                const reward = this.extractTaskReward(taskData);
                taskInfo.reward = reward !== null ? reward : 0;

                // Complexity can be determined based on task type or other criteria
                if (taskInfo.type === 'search') {
                    taskInfo.complexity = 'low';
                } else if (taskInfo.type === 'evaluation') {
                    taskInfo.complexity = 'medium';
                } else if (taskInfo.type === 'comparison' || taskInfo.type === 'rating') {
                    taskInfo.complexity = 'high';
                }
            }

            return taskInfo;
        } catch (error) {
            console.error('Error extracting task info:', error);
            return {
                type: 'unknown',
                duration: 0,
                reward: 0,
                complexity: 'medium',
                detectedAt: Date.now()
            };
        }
    }

    // Calculate task completion time (placeholder)
    calculateCompletionTime(taskData) {
        // This would track actual completion time when implemented
        return Math.random() * 300 + 60; // 1-6 minutes for simulation
    }

    // Get current performance metrics
    getPerformanceMetrics() {
        return {
            memoryUsage: this.getMemoryUsage(),
            cpuUsage: this.getCpuUsage(),
            networkStatus: navigator.onLine ? 'online' : 'offline'
        };
    }

    // Get memory usage (simplified)
    getMemoryUsage() {
        // Simplified memory tracking - would be more accurate in real implementation
        if (performance.memory) {
            return performance.memory.usedJSHeapSize / 1024 / 1024; // MB
        }
        return 0;
    }

    // Get CPU usage (simplified)
    getCpuUsage() {
        // Placeholder - would need more sophisticated CPU tracking
        return Math.random() * 30 + 5; // 5-35% simulated
    }

    // Save event to storage
    async saveEvent(event) {
        try {
            // Get existing events
            const data = await chrome.storage.local.get(['analyticsEvents']);
            const events = data.analyticsEvents || [];
            
            // Add new event
            events.push(event);
            
            // Clean up old events based on retention policy
            const cleanedEvents = this.cleanupOldEvents(events);
            
            // Save back to storage
            await chrome.storage.local.set({ analyticsEvents: cleanedEvents });
            
        } catch (error) {
            console.error('Error saving analytics event:', error);
        }
    }

    // Clean up events older than retention period
    cleanupOldEvents(events) {
        const retentionMs = this.settings.dataRetentionDays * 24 * 60 * 60 * 1000;
        const cutoffTime = Date.now() - retentionMs;
        
        return events.filter(event => event.timestamp >= cutoffTime);
    }

    // Save session data
    async saveSessionData() {
        try {
            const data = await chrome.storage.local.get(['analyticsSessions']);
            const sessions = data.analyticsSessions || [];
            
            sessions.push(this.currentSession);
            
            // Clean up old sessions
            const cleanedSessions = this.cleanupOldSessions(sessions);
            
            await chrome.storage.local.set({ analyticsSessions: cleanedSessions });
            
        } catch (error) {
            console.error('Error saving session data:', error);
        }
    }

    // Clean up old sessions
    cleanupOldSessions(sessions) {
        const retentionMs = this.settings.dataRetentionDays * 24 * 60 * 60 * 1000;
        const cutoffTime = Date.now() - retentionMs;
        
        return sessions.filter(session => session.startTime >= cutoffTime);
    }

    // Start performance monitoring
    startPerformanceMonitoring() {
        this.performanceInterval = setInterval(async () => {
            const memoryUsage = this.getMemoryUsage();
            const cpuUsage = this.getCpuUsage();
            
            if (memoryUsage > this.currentSession.peakMemoryUsage) {
                this.currentSession.peakMemoryUsage = memoryUsage;
            }
            
            // Update average CPU usage
            this.currentSession.averageCpuUsage = 
                (this.currentSession.averageCpuUsage * this.currentSession.monitoringTime + cpuUsage) / 
                (this.currentSession.monitoringTime + 1);
                
        }, 5000); // Update every 5 seconds
    }

    // Stop performance monitoring
    stopPerformanceMonitoring() {
        if (this.performanceInterval) {
            clearInterval(this.performanceInterval);
        }
    }

    // Get analytics summary
    async getSummary(timeframe = '30d') {
        try {
            const [events, sessions] = await Promise.all([
                this.getEvents(timeframe),
                this.getSessions(timeframe)
            ]);
            
            return this.calculateSummary(events, sessions, timeframe);
            
        } catch (error) {
            console.error('Error getting analytics summary:', error);
            return this.getEmptySummary();
        }
    }

    // Get events for timeframe
    async getEvents(timeframe) {
        const data = await chrome.storage.local.get(['analyticsEvents']);
        const events = data.analyticsEvents || [];
        
        const cutoffTime = this.getTimeframeCutoff(timeframe);
        return events.filter(event => event.timestamp >= cutoffTime);
    }

    // Get sessions for timeframe
    async getSessions(timeframe) {
        const data = await chrome.storage.local.get(['analyticsSessions']);
        const sessions = data.analyticsSessions || [];
        
        const cutoffTime = this.getTimeframeCutoff(timeframe);
        return sessions.filter(session => session.startTime >= cutoffTime);
    }

    // Get timeframe cutoff timestamp
    getTimeframeCutoff(timeframe) {
        const now = Date.now();
        switch (timeframe) {
            case '7d': return now - (7 * 24 * 60 * 60 * 1000);
            case '30d': return now - (30 * 24 * 60 * 60 * 1000);
            case '90d': return now - (90 * 24 * 60 * 60 * 1000);
            case 'all': return 0;
            default: return now - (30 * 24 * 60 * 60 * 1000);
        }
    }

    // Calculate summary from events and sessions
    calculateSummary(events, sessions, timeframe) {
        const taskEvents = events.filter(e => e.type.startsWith('task_'));
        const monitoringEvents = events.filter(e => e.type === 'monitoring_state');
        
        const taskStats = this.calculateTaskStats(taskEvents);
        const monitoringStats = this.calculateMonitoringStats(sessions, monitoringEvents);
        const performanceStats = this.calculatePerformanceStats(sessions);
        const earningsEstimate = this.calculateEarningsEstimate(taskEvents);
        
        return {
            timeframe: timeframe,
            totalTasks: taskStats.total,
            acquisitionRate: taskStats.acquisitionRate,
            completionRate: taskStats.completionRate,
            averageWaitTime: taskStats.averageWaitTime,
            totalMonitoringTime: monitoringStats.totalTime,
            averageSessionLength: monitoringStats.averageSessionLength,
            successRate: taskStats.successRate,
            estimatedEarnings: earningsEstimate,
            performance: performanceStats,
            taskBreakdown: taskStats.breakdown,
            hourlyPatterns: this.calculateHourlyPatterns(events)
        };
    }

    // Calculate task statistics
    calculateTaskStats(events) {
        const found = events.filter(e => e.type === 'task_found').length;
        const acquired = events.filter(e => e.type === 'task_acquired').length;
        const completed = events.filter(e => e.type === 'task_completed').length;
        const failed = events.filter(e => e.type === 'task_failed').length;
        
        const total = found;
        const acquisitionRate = found > 0 ? (acquired / found) * 100 : 0;
        const completionRate = acquired > 0 ? (completed / acquired) * 100 : 0;
        const successRate = found > 0 ? (completed / found) * 100 : 0;
        
        // Calculate average wait time (simplified)
        const acquireEvents = events.filter(e => e.type === 'task_acquired');
        const averageWaitTime = acquireEvents.length > 0 ? 
            acquireEvents.reduce((sum, e) => sum + (e.timestamp - e.taskData.detectedAt), 0) / acquireEvents.length : 0;
        
        // Task type breakdown
        const breakdown = {};
        events.forEach(event => {
            if (event.taskData && event.taskData.type) {
                const type = event.taskData.type;
                if (!breakdown[type]) breakdown[type] = { found: 0, acquired: 0, completed: 0, failed: 0 };
                breakdown[type][event.type.split('_')[1]]++;
            }
        });
        
        return {
            total,
            found,
            acquired,
            completed,
            failed,
            acquisitionRate: Math.round(acquisitionRate * 100) / 100,
            completionRate: Math.round(completionRate * 100) / 100,
            successRate: Math.round(successRate * 100) / 100,
            averageWaitTime: Math.round(averageWaitTime / 1000), // Convert to seconds
            breakdown
        };
    }

    // Calculate monitoring statistics
    calculateMonitoringStats(sessions, monitoringEvents) {
        const totalTime = sessions.reduce((sum, session) => sum + session.monitoringTime, 0);
        const averageSessionLength = sessions.length > 0 ? totalTime / sessions.length : 0;
        
        const enabledEvents = monitoringEvents.filter(e => e.enabled);
        const disabledEvents = monitoringEvents.filter(e => !e.enabled);
        
        return {
            totalSessions: sessions.length,
            totalTime: Math.round(totalTime / 60), // Convert to minutes
            averageSessionLength: Math.round(averageSessionLength / 60), // Convert to minutes
            monitoringSessions: enabledEvents.length,
            monitoringChanges: monitoringEvents.length
        };
    }

    // Calculate performance statistics
    calculatePerformanceStats(sessions) {
        if (sessions.length === 0) {
            return { averageCpu: 0, peakMemory: 0, averageMemory: 0 };
        }
        
        const totalCpu = sessions.reduce((sum, session) => sum + (session.averageCpuUsage || 0), 0);
        const peakMemory = Math.max(...sessions.map(s => s.peakMemoryUsage || 0));
        const averageMemory = sessions.reduce((sum, session) => sum + (session.peakMemoryUsage || 0), 0) / sessions.length;
        
        return {
            averageCpu: Math.round(totalCpu / sessions.length * 100) / 100,
            peakMemory: Math.round(peakMemory * 100) / 100,
            averageMemory: Math.round(averageMemory * 100) / 100
        };
    }

    // Calculate earnings estimate
    calculateEarningsEstimate(events) {
        const completedTasks = events.filter(e => e.type === 'task_completed');
        const totalEarnings = completedTasks.reduce((sum, task) => sum + (task.taskData.reward || 0), 0);
        
        return {
            total: Math.round(totalEarnings * 100) / 100,
            perHour: this.calculateEarningsPerHour(completedTasks),
            perTask: completedTasks.length > 0 ? totalEarnings / completedTasks.length : 0,
            taskCount: completedTasks.length
        };
    }

    // Calculate earnings per hour
    calculateEarningsPerHour(completedTasks) {
        if (completedTasks.length === 0) return 0;
        
        const firstTask = Math.min(...completedTasks.map(t => t.timestamp));
        const lastTask = Math.max(...completedTasks.map(t => t.timestamp));
        const totalHours = (lastTask - firstTask) / (1000 * 60 * 60);
        
        const totalEarnings = completedTasks.reduce((sum, task) => sum + (task.taskData.reward || 0), 0);
        
        return totalHours > 0 ? Math.round((totalEarnings / totalHours) * 100) / 100 : 0;
    }

    // Calculate hourly patterns
    calculateHourlyPatterns(events) {
        const patterns = {};
        
        for (let hour = 0; hour < 24; hour++) {
            patterns[hour] = {
                tasksFound: 0,
                tasksAcquired: 0,
                tasksCompleted: 0
            };
        }
        
        events.forEach(event => {
            const date = new Date(event.timestamp);
            const hour = date.getHours();
            
            if (event.type === 'task_found') patterns[hour].tasksFound++;
            if (event.type === 'task_acquired') patterns[hour].tasksAcquired++;
            if (event.type === 'task_completed') patterns[hour].tasksCompleted++;
        });
        
        return patterns;
    }

    // Get empty summary for error cases
    getEmptySummary() {
        return {
            timeframe: '30d',
            totalTasks: 0,
            acquisitionRate: 0,
            completionRate: 0,
            averageWaitTime: 0,
            totalMonitoringTime: 0,
            averageSessionLength: 0,
            successRate: 0,
            estimatedEarnings: { total: 0, perHour: 0, perTask: 0, taskCount: 0 },
            performance: { averageCpu: 0, peakMemory: 0, averageMemory: 0 },
            taskBreakdown: {},
            hourlyPatterns: {}
        };
    }

    // Export data to CSV
    async exportToCSV(timeframe = '30d') {
        const events = await this.getEvents(timeframe);
        
        if (events.length === 0) {
            return 'No data available for export';
        }
        
        const headers = ['Timestamp', 'Event Type', 'Task Type', 'Duration', 'Reward', 'Memory Usage', 'CPU Usage'];
        const rows = events.map(event => [
            new Date(event.timestamp).toISOString(),
            event.type,
            event.taskData?.type || 'unknown',
            event.taskData?.duration || 0,
            event.taskData?.reward || 0,
            event.memoryUsage || 0,
            event.cpuUsage || 0
        ]);
        
        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }

    // Export data to JSON
    async exportToJSON(timeframe = '30d') {
        const events = await this.getEvents(timeframe);
        return JSON.stringify(events, null, 2);
    }

    // Clear all analytics data
    async clearData() {
        try {
            await chrome.storage.local.remove(['analyticsEvents', 'analyticsSessions']);
            console.log('Analytics data cleared');
        } catch (error) {
            console.error('Error clearing analytics data:', error);
        }
    }

    // Cleanup method
    cleanup() {
        this.stopPerformanceMonitoring();
        if (this.sessionInterval) {
            clearInterval(this.sessionInterval);
        }
        this.isInitialized = false;
    }
}

// Create global analytics manager instance
const analyticsManager = new AnalyticsManager();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AnalyticsManager, analyticsManager };
}
