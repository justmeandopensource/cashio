package common

import "time"

type Debouncer struct {
    timer    *time.Timer
    interval time.Duration
}

// NewDebouncer creates a new debouncer with the specified interval
func NewDebouncer(interval time.Duration) *Debouncer {
    return &Debouncer{
        interval: interval,
    }
}

// Debounce delays the execution of function f by the debouncer's interval.
// If Debounce is called again before the interval has elapsed, the timer is reset.
func (d *Debouncer) Debounce(f func()) {
    if d.timer != nil {
        d.timer.Stop()
    }
    d.timer = time.AfterFunc(d.interval, f)
}

// Stop cancels any pending debounced function calls
func (d *Debouncer) Stop() {
    if d.timer != nil {
        d.timer.Stop()
    }
}

// Reset cancels any pending function calls and resets the debouncer
func (d *Debouncer) Reset() {
    d.Stop()
    d.timer = nil
}
