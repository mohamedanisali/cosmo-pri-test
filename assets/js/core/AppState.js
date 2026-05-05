/**
 * AppState.js
 * Centralized state management for the application.
 * Provides a Single Source of Truth and change notification system.
 */

const AppState = (function() {
    // Private state object
    const _state = {
        auth: {
            isAuthenticated: false,
            user: null
        },
        navigation: {
            currentSection: 'home',
            history: []
        },
        data: {
            products: null,
            eyeProducts: null,
            acneProducts: null,
            antiAgingProducts: null,
            whiteningStoreProducts: null,
            dyesProducts: null,
            trainingScenarios: null
        },
        ui: {
            sidebarOpen: false,
            activeFilters: {},
            recommenderAnswers: {},
            // Dyes filter state (replaces window.dyesActive*)
            dyes: {
                activeType: 'all',
                activeAmmonia: 'all',
                activeBrand: 'الكل'
            },
            // Dyes recommender state (replaces window.dyesRecAnswers)
            dyesRec: {
                answers: {}
            },
            // Cleanser derived data (replaces window._cleanserData)
            cleanser: null,
            // Training section state (replaces window._filteredScenarios)
            training: {
                filteredScenarios: null
            }
        }
    };

    // Listeners for state changes
    const _listeners = new Set();

    /**
     * Deeply clones an object to prevent direct state mutation.
     */
    function _clone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    /**
     * Notifies all listeners of a state change.
     * Uses a microtask to batch multiple changes in the same tick.
     */
    let _notifyScheduled = false;
    function _notify() {
        if (_notifyScheduled) return;
        _notifyScheduled = true;
        
        queueMicrotask(() => {
            const currentState = _clone(_state);
            _listeners.forEach(callback => {
                try {
                    callback(currentState);
                } catch (e) {
                    console.error('[AppState] Listener error:', e);
                }
            });
            _notifyScheduled = false;
        });
    }

    /**
     * Updates a slice of the state.
     * @param {string} path - Dot-separated path to the state slice (e.g., 'ui.sidebarOpen').
     * @param {any} value - The new value.
     */
    function setState(path, value) {
        const keys = path.split('.');
        let current = _state;
        
        for (let i = 0; i < keys.length - 1; i++) {
            if (!(keys[i] in current)) {
                current[keys[i]] = {};
            }
            current = current[keys[i]];
        }
        
        const lastKey = keys[keys.length - 1];
        
        // Only update and notify if the value actually changed
        if (JSON.stringify(current[lastKey]) !== JSON.stringify(value)) {
            current[lastKey] = value;
            _notify();
        }
    }

    /**
     * Gets a slice of the state.
     * @param {string} path - Dot-separated path to the state slice.
     * @returns {any} A clone of the state slice.
     */
    function getState(path) {
        if (!path) return _clone(_state);
        
        const keys = path.split('.');
        let current = _state;
        
        for (const key of keys) {
            if (current === null || current === undefined || !(key in current)) {
                return undefined;
            }
            current = current[key];
        }
        
        return (typeof current === 'object' && current !== null) ? _clone(current) : current;
    }

    /**
     * Subscribes to state changes.
     * @param {Function} callback - Function to call when state changes.
     * @returns {Function} Unsubscribe function.
     */
    function subscribe(callback) {
        _listeners.add(callback);
        // Immediate call with current state
        callback(_clone(_state));
        return () => _listeners.delete(callback);
    }

    /**
     * Reads a data cache key.
     * @param {string} key - Key from _state.data
     * @returns {any}
     */
    function getData(key) {
        return _state.data[key] !== undefined ? _state.data[key] : null;
    }

    /**
     * Writes a data cache key (write-once semantics, no change event).
     * @param {string} key
     * @param {any} value
     */
    function setData(key, value) {
        _state.data[key] = value;
        // No change event — data writes are internal to DataLayer
    }

    return {
        setState,
        getState,
        getData,
        setData,
        subscribe
    };
})();

// Export for modern environments or attach to window for vanilla
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AppState;
} else {
    window.AppState = AppState;
    // Phase 4a compat getters removed in Phase 6 — all call sites now use
    // AppState.getData() directly. No window.products / window.eyeProducts etc.
}
