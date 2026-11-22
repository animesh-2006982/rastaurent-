export const FRONT_DESK_PERMISSIONS = {
  FRONT_DESK: "front_desk",

  ROOM_STATUS_VIEW:
    "room_status_view",

  ROOM_STATUS_CHANGE:
    "room_status_change",

  RESERVATIONS_VIEW:
    "reservations_view",

  RESERVATIONS_CONFIRM:
    "reservations_confirm",

  RESERVATIONS_CANCEL:
    "reservations_cancel",

  RESERVATIONS_STATUS:
    "reservations_status",

  CHECK_IN:
    "check_in",

  CHECK_OUT:
    "check_out",

  GUEST_LIST:
    "guest_list",

  HOUSEKEEPING:
    "housekeeping",
};

export const FRONT_DESK_PERMISSION_KEYS =
  Object.values(
    FRONT_DESK_PERMISSIONS
  );

export const FRONT_DESK_ROLE_DEFAULTS = {
  "Front Desk Staff": [
    FRONT_DESK_PERMISSIONS.FRONT_DESK,
    FRONT_DESK_PERMISSIONS.ROOM_STATUS_VIEW,
    FRONT_DESK_PERMISSIONS.ROOM_STATUS_CHANGE,
    FRONT_DESK_PERMISSIONS.RESERVATIONS_VIEW,
    FRONT_DESK_PERMISSIONS.RESERVATIONS_CONFIRM,
    FRONT_DESK_PERMISSIONS.RESERVATIONS_CANCEL,
    FRONT_DESK_PERMISSIONS.RESERVATIONS_STATUS,
    FRONT_DESK_PERMISSIONS.CHECK_IN,
    FRONT_DESK_PERMISSIONS.CHECK_OUT,
    FRONT_DESK_PERMISSIONS.GUEST_LIST,
    FRONT_DESK_PERMISSIONS.HOUSEKEEPING,
  ],

  "Front Desk Manager": [
    FRONT_DESK_PERMISSIONS.FRONT_DESK,
    FRONT_DESK_PERMISSIONS.ROOM_STATUS_VIEW,
    FRONT_DESK_PERMISSIONS.ROOM_STATUS_CHANGE,
    FRONT_DESK_PERMISSIONS.RESERVATIONS_VIEW,
    FRONT_DESK_PERMISSIONS.RESERVATIONS_CONFIRM,
    FRONT_DESK_PERMISSIONS.RESERVATIONS_CANCEL,
    FRONT_DESK_PERMISSIONS.RESERVATIONS_STATUS,
    FRONT_DESK_PERMISSIONS.CHECK_IN,
    FRONT_DESK_PERMISSIONS.CHECK_OUT,
    FRONT_DESK_PERMISSIONS.GUEST_LIST,
    FRONT_DESK_PERMISSIONS.HOUSEKEEPING,
  ],

  "Housekeeping Staff": [
    FRONT_DESK_PERMISSIONS.FRONT_DESK,
    FRONT_DESK_PERMISSIONS.ROOM_STATUS_VIEW,
    FRONT_DESK_PERMISSIONS.HOUSEKEEPING,
  ],
};

export function hasFrontDeskPermission(
  staff: any,
  permission: string
) {
  if (!staff) return false;

  if (
    staff.role === "Super Admin" ||
    staff.role === "Owner" ||
    staff.role === "Administrator"
  ) {
    return true;
  }

  const permissions =
    Array.isArray(staff.permissions)
      ? staff.permissions
      : [];

  if (
    permissions.includes(permission)
  ) {
    return true;
  }

  const defaults =
    FRONT_DESK_ROLE_DEFAULTS[
      staff.role as keyof typeof FRONT_DESK_ROLE_DEFAULTS
    ] || [];

  return defaults.includes(permission);
}