// Filter management system for RHAT extension

class FilterManager {
    constructor() {
        this.filters = {
            taskTypes: [],
            minDuration: 0,
            maxDuration: 0,
            timeRange: {
                enabled: false,
                start: '09:00',
                end: '17:00'
            },
            daysOfWeek: [1, 2, 3, 4, 5], // Monday-Friday
            minReward: 0,
            customRules: []
        };
        
        this.presets = {};
        this.loadFilters();
    }

    // Load filters from storage
    async loadFilters() {
        try {
            const data = await chrome.storage.sync.get(['filters', 'filterPresets']);
            if (data.filters) {
                this.filters = { ...this.filters, ...data.filters };
            }
            if (data.filterPresets) {
                this.presets = data.filterPresets;
            }
        } catch (error) {
            console.error('Error loading filters:', error);
        }
    }

    // Save filters to storage
    async saveFilters() {
        try {
            await chrome.storage.sync.set({
                filters: this.filters,
                filterPresets: this.presets
            });
        } catch (error) {
            console.error('Error saving filters:', error);
        }
    }

    // Apply filters to a task
    applyFilters(task) {
        if (!this.isFilteringEnabled()) {
            return true; // No filters active, allow all tasks
        }

        // Apply each filter type
        const results = [
            this.filterByTaskType(task),
            this.filterByDuration(task),
            this.filterByTime(),
            this.filterByDayOfWeek(),
            this.filterByReward(task),
            this.applyCustomRules(task)
        ];

        // All filters must pass (AND logic)
        return results.every(result => result === true);
    }

    // Check if any filters are active
    isFilteringEnabled() {
        return (
            this.filters.taskTypes.length > 0 ||
            this.filters.minDuration > 0 ||
            this.filters.maxDuration > 0 ||
            this.filters.timeRange.enabled ||
            this.filters.daysOfWeek.length < 7 ||
            this.filters.minReward > 0 ||
            this.filters.customRules.length > 0
        );
    }

    // Filter by task type
    filterByTaskType(task) {
        if (this.filters.taskTypes.length === 0) return true;
        
        // Extract task type from task data (implementation depends on task structure)
        const taskType = this.extractTaskType(task);
        return this.filters.taskTypes.includes(taskType);
    }

    // Filter by task duration
    filterByDuration(task) {
        if (this.filters.minDuration === 0 && this.filters.maxDuration === 0) return true;
        
        const duration = this.extractTaskDuration(task);
        if (!duration) return true; // Skip if duration not available
        
        if (this.filters.minDuration > 0 && duration < this.filters.minDuration) return false;
        if (this.filters.maxDuration > 0 && duration > this.filters.maxDuration) return false;
        
        return true;
    }

    // Filter by time of day
    filterByTime() {
        if (!this.filters.timeRange.enabled) return true;
        
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        const [startHours, startMinutes] = this.filters.timeRange.start.split(':').map(Number);
        const [endHours, endMinutes] = this.filters.timeRange.end.split(':').map(Number);
        
        const startTime = startHours * 60 + startMinutes;
        const endTime = endHours * 60 + endMinutes;
        
        return currentTime >= startTime && currentTime <= endTime;
    }

    // Filter by day of week
    filterByDayOfWeek() {
        if (this.filters.daysOfWeek.length === 7) return true;
        
        const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
        // Convert to 1-7 format (Monday = 1, Sunday = 7)
        const dayOfWeek = today === 0 ? 7 : today;
        
        return this.filters.daysOfWeek.includes(dayOfWeek);
    }

    // Filter by reward amount
    filterByReward(task) {
        if (this.filters.minReward === 0) return true;
        
        const reward = this.extractTaskReward(task);
        if (!reward) return true; // Skip if reward not available
        
        return reward >= this.filters.minReward;
    }

    // Apply custom rules
    applyCustomRules(task) {
        if (this.filters.customRules.length === 0) return true;
        
        // Implement custom rule evaluation
        // This would be more complex based on the rule format
        return this.filters.customRules.every(rule => {
            try {
                return this.evaluateCustomRule(rule, task);
            } catch (error) {
                console.error('Error evaluating custom rule:', error);
                return true; // Allow task if rule evaluation fails
            }
        });
    }

    // Helper methods for task data extraction
    extractTaskType(task) {
        // Implementation depends on how task data is structured
        // This is a placeholder - would need to be implemented based on actual task structure
        return 'unknown';
    }

    extractTaskDuration(task) {
        // Extract duration from task data
        // Placeholder implementation
        return null;
    }

    extractTaskReward(task) {
        // Extract reward from task data
        // Placeholder implementation
        return null;
    }

    evaluateCustomRule(rule, task) {
        // Evaluate a custom rule against task data
        // Placeholder implementation
        return true;
    }

    // Preset management
    savePreset(name, filters) {
        this.presets[name] = filters;
        this.saveFilters();
    }

    loadPreset(name) {
        if (this.presets[name]) {
            this.filters = { ...this.filters, ...this.presets[name] };
            this.saveFilters();
            return true;
        }
        return false;
    }

    deletePreset(name) {
        if (this.presets[name]) {
            delete this.presets[name];
            this.saveFilters();
            return true;
        }
        return false;
    }

    // Get all presets
    getPresets() {
        return { ...this.presets };
    }

    // Reset to default filters
    resetFilters() {
        this.filters = {
            taskTypes: [],
            minDuration: 0,
            maxDuration: 0,
            timeRange: {
                enabled: false,
                start: '09:00',
                end: '17:00'
            },
            daysOfWeek: [1, 2, 3, 4, 5],
            minReward: 0,
            customRules: []
        };
        this.saveFilters();
    }
}

// Create global filter manager instance
const filterManager = new FilterManager();

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FilterManager, filterManager };
}
