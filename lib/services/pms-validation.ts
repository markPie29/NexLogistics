/**
 * PMS Schedule form validation utilities.
 *
 * Provides form validation for the Add/Edit Schedule modal and
 * dirty-checking to enable/disable the submit button.
 *
 * Requirements: 5.2, 5.6, 5.7, 5.9
 */

import type { ScheduleFormData, ScheduleFormErrors } from "./pms-types";

/**
 * Validates a ScheduleFormData object and returns field-level error messages.
 *
 * @param data - The form data to validate.
 * @returns An object with error messages per field, or null if all fields are valid.
 */
export function validateScheduleForm(
  data: ScheduleFormData
): ScheduleFormErrors | null {
  const errors: ScheduleFormErrors = {};

  // vehicleId: required (non-empty string)
  if (!data.vehicleId || data.vehicleId.trim() === "") {
    errors.vehicleId = "Vehicle is required";
  }

  // type: required, 1-100 characters
  if (!data.type || data.type.trim() === "") {
    errors.type = "Service type is required";
  } else if (data.type.length > 100) {
    errors.type = "Service type must be 100 characters or less";
  }

  // dueDate: required, must be today or a future date (compare YYYY-MM-DD strings)
  if (!data.dueDate || data.dueDate.trim() === "") {
    errors.dueDate = "Due date is required";
  } else {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    if (data.dueDate < todayStr) {
      errors.dueDate = "Due date must be today or a future date";
    }
  }

  // dueOdometer: optional, but if provided must be numeric 0-9,999,999
  if (data.dueOdometer !== undefined && data.dueOdometer !== null) {
    const odo = data.dueOdometer;
    if (typeof odo !== "number" || isNaN(odo) || odo < 0 || odo > 9999999) {
      errors.dueOdometer = "Odometer must be between 0 and 9,999,999 km";
    }
  }

  // cost: optional, but if provided must be 0.01-99,999,999.99
  if (data.cost !== undefined && data.cost !== null) {
    const cost = data.cost;
    if (
      typeof cost !== "number" ||
      isNaN(cost) ||
      cost < 0.01 ||
      cost > 99999999.99
    ) {
      errors.cost = "Cost must be between ₱0.01 and ₱99,999,999.99";
    }
  }

  // notes: optional, max 500 characters
  if (data.notes !== undefined && data.notes !== null && data.notes.length > 500) {
    errors.notes = "Notes must be 500 characters or less";
  }

  // Return null if no errors, otherwise return error object
  return Object.keys(errors).length === 0 ? null : errors;
}

/**
 * Determines if the form has been modified from its initial state.
 *
 * Uses strict comparison: undefined !== 0 for optional numeric fields.
 * Compares strings directly, numbers with ===.
 *
 * @param current - The current form state.
 * @param initial - The initial form state (empty for add mode, original values for edit mode).
 * @returns true if ANY field differs between current and initial.
 */
export function isFormDirty(
  current: ScheduleFormData,
  initial: ScheduleFormData
): boolean {
  if (current.vehicleId !== initial.vehicleId) return true;
  if (current.type !== initial.type) return true;
  if (current.dueDate !== initial.dueDate) return true;
  if (current.dueOdometer !== initial.dueOdometer) return true;
  if (current.cost !== initial.cost) return true;
  if (current.notes !== initial.notes) return true;
  return false;
}
