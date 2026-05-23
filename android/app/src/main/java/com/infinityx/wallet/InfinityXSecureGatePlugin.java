package com.infinityx.wallet;

import android.os.Build;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyInfo;
import android.security.keystore.KeyProperties;

import androidx.biometric.BiometricManager;
import androidx.biometric.BiometricPrompt;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.FragmentActivity;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.security.KeyStore;
import java.util.concurrent.Executor;

import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.SecretKeyFactory;

@CapacitorPlugin(name = "InfinityXSecureGate")
public class InfinityXSecureGatePlugin extends Plugin {
    private static final String KEY_ALIAS = "infinityx_signing_gate_v1";

    @PluginMethod
    public void status(PluginCall call) {
        JSObject result = new JSObject();
        result.put("native", true);
        result.put("biometricAvailable", canAuthenticate());
        result.put("hardwareBackedKey", ensureGateKey());
        call.resolve(result);
    }

    @PluginMethod
    public void authenticate(PluginCall call) {
        if (!ensureGateKey()) {
            call.reject("Android Keystore gate could not be created.");
            return;
        }

        String reason = call.getString("reason", "Approve InfinityX signing");
        FragmentActivity activity = (FragmentActivity) getActivity();
        Executor executor = ContextCompat.getMainExecutor(activity);

        BiometricPrompt prompt = new BiometricPrompt(activity, executor, new BiometricPrompt.AuthenticationCallback() {
            @Override
            public void onAuthenticationSucceeded(BiometricPrompt.AuthenticationResult authenticationResult) {
                JSObject result = new JSObject();
                result.put("ok", true);
                result.put("native", true);
                result.put("message", "Approved");
                call.resolve(result);
            }

            @Override
            public void onAuthenticationError(int errorCode, CharSequence errString) {
                call.reject(errString.toString());
            }

            @Override
            public void onAuthenticationFailed() {
                JSObject result = new JSObject();
                result.put("ok", false);
                result.put("native", true);
                result.put("message", "Authentication failed");
                call.resolve(result);
            }
        });

        BiometricPrompt.PromptInfo promptInfo = new BiometricPrompt.PromptInfo.Builder()
                .setTitle("InfinityX secure signing")
                .setSubtitle(reason)
                .setAllowedAuthenticators(BiometricManager.Authenticators.BIOMETRIC_STRONG | BiometricManager.Authenticators.DEVICE_CREDENTIAL)
                .build();

        activity.runOnUiThread(() -> prompt.authenticate(promptInfo));
    }

    private boolean canAuthenticate() {
        BiometricManager manager = BiometricManager.from(getContext());
        return manager.canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG | BiometricManager.Authenticators.DEVICE_CREDENTIAL) == BiometricManager.BIOMETRIC_SUCCESS;
    }

    private boolean ensureGateKey() {
        try {
            KeyStore keyStore = KeyStore.getInstance("AndroidKeyStore");
            keyStore.load(null);
            if (!keyStore.containsAlias(KEY_ALIAS)) {
                KeyGenerator keyGenerator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore");
                KeyGenParameterSpec.Builder builder = new KeyGenParameterSpec.Builder(
                        KEY_ALIAS,
                        KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT
                )
                        .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                        .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                        .setUserAuthenticationRequired(true);

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                    builder.setUserAuthenticationParameters(
                            30,
                            KeyProperties.AUTH_BIOMETRIC_STRONG | KeyProperties.AUTH_DEVICE_CREDENTIAL
                    );
                } else {
                    builder.setUserAuthenticationValidityDurationSeconds(30);
                }

                keyGenerator.init(builder.build());
                keyGenerator.generateKey();
            }
            SecretKey secretKey = (SecretKey) keyStore.getKey(KEY_ALIAS, null);
            SecretKeyFactory factory = SecretKeyFactory.getInstance(secretKey.getAlgorithm(), "AndroidKeyStore");
            KeyInfo keyInfo = (KeyInfo) factory.getKeySpec(secretKey, KeyInfo.class);
            return keyInfo.isInsideSecureHardware() || canAuthenticate();
        } catch (Exception error) {
            return false;
        }
    }
}
