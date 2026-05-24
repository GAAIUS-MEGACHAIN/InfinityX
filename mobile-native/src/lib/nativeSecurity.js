import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";

const SESSION_KEY = "infinityx.native.session.v1";

export async function getBiometricStatus() {
  const [hardware, enrolled, types] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
    LocalAuthentication.supportedAuthenticationTypesAsync()
  ]);
  return {
    hardware,
    enrolled,
    types,
    available: hardware && enrolled
  };
}

export async function requireNativeGate(reason = "Approve InfinityX wallet action") {
  const status = await getBiometricStatus();
  if (!status.available) {
    return { ok: false, status, message: "Biometric/passkey gate is not enrolled on this device." };
  }
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: reason,
    cancelLabel: "Cancel",
    disableDeviceFallback: false
  });
  return {
    ok: result.success,
    status,
    message: result.success ? "Native signing gate approved." : "Native signing gate rejected."
  };
}

export async function saveNativeSession(payload) {
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(payload), {
    keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY
  });
}

export async function loadNativeSession() {
  const value = await SecureStore.getItemAsync(SESSION_KEY);
  return value ? JSON.parse(value) : null;
}
