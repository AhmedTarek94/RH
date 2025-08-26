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
        try {
            // Implementation for extracting task type from Rater Hub page
            // Look for task type indicators in the page content
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

    evaluateCustomRule(rule, task) {
        try {
            // Implementation for evaluating custom rules against task data
            // Rule format: { field: 'type', operator: 'equals', value: 'search' }
            
            if (!rule || typeof rule !== 'object') {
                return true; // Invalid rule, allow task
            }
            
            const { field, operator, value } = rule;
            
            // Get the field value from the task
            let taskValue;
            switch (field) {
                case 'type':
                    taskValue = this.extractTaskType(task);
                    break;
                case 'duration':
                    taskValue = this.extractTaskDuration(task);
                    break;
                case 'reward':
                    taskValue = this.extractTaskReward(task);
                    break;
                default:
                    // Unknown field, allow task
                    return true;
            }
            
            // Apply the operator
            switch (operator) {
                case 'equals':
                    return taskValue === value;
                case 'not_equals':
                    return taskValue !== value;
                case 'contains':
                    return String(taskValue).toLowerCase().includes(String(value).toLowerCase());
                case 'greater_than':
                    return Number(taskValue) > Number(value);
                case 'less_than':
                    return Number(taskValue) < Number(value);
                case 'greater_than_equal':
                    return Number(taskValue) >= Number(value);
                case 'less_than_equal':
                    return Number(taskValue) <= Number(value);
                case 'starts_with':
                    return String(taskValue).toLowerCase().startsWith(String(value).toLowerCase());
                case 'ends_with':
                    return String(taskValue).toLowerCase().endsWith(String(value).toLowerCase());
                default:
                    // Unknown operator, allow task
                    return true;
            }
        } catch (error) {
            console.error('Error evaluating custom rule:', error, rule);
            return true; // Allow task if rule evaluation fails
        }
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
