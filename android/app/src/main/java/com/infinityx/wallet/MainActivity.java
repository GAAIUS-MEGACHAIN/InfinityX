package com.infinityx.wallet;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(InfinityXSecureGatePlugin.class);
        super.onCreate(savedInstanceState);
    }
}
