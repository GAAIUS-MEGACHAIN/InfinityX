import React, { useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View
} from "react-native";
import {
  ArrowDownUp,
  Bell,
  Boxes,
  ChevronDown,
  Compass,
  Fingerprint,
  Gem,
  Globe2,
  Grid2X2,
  Image,
  KeyRound,
  Layers3,
  Plus,
  QrCode,
  Send,
  Settings,
  ShieldCheck,
  ShoppingCart,
  WalletCards
} from "lucide-react-native";
import { blockedChains, capabilitySummary, featuredAssets, liveChains, services } from "./src/data/capabilitySummary";
import { requireNativeGate, saveNativeSession } from "./src/lib/nativeSecurity";

const tabs = [
  { key: "wallet", label: "Wallet", icon: WalletCards },
  { key: "dex", label: "DEX", icon: ArrowDownUp },
  { key: "nfts", label: "NFTs", icon: Image },
  { key: "dapps", label: "DApps", icon: Compass },
  { key: "services", label: "Services", icon: Grid2X2 }
];

const actions = [
  { label: "Send", icon: Send, protected: true },
  { label: "Receive", icon: QrCode },
  { label: "Swap", icon: ArrowDownUp, protected: true },
  { label: "Buy", icon: ShoppingCart, protected: true },
  { label: "Create", icon: Plus, protected: true }
];

const dapps = [
  { name: "Jupiter", network: "Solana", type: "DEX aggregator" },
  { name: "Uniswap", network: "Ethereum", type: "DEX" },
  { name: "Raydium", network: "Solana", type: "AMM" },
  { name: "Orca", network: "Solana", type: "AMM" },
  { name: "Aave", network: "EVM", type: "Lending" },
  { name: "OpenSea", network: "Multi-chain", type: "NFTs" }
];

export default function App() {
  const [selectedTab, setSelectedTab] = useState("wallet");
  const [selectedChain, setSelectedChain] = useState("Main");
  const visibleAssets = useMemo(() => {
    if (selectedChain === "Main") return featuredAssets;
    return featuredAssets.filter((asset) => asset.network === selectedChain || asset.network === "Multi-chain");
  }, [selectedChain]);

  async function handleProtectedAction(action) {
    if (!action.protected) {
      Alert.alert(action.label, "Receive address and QR flow opens here.");
      return;
    }
    const gate = await requireNativeGate(`${action.label} with InfinityX`);
    if (!gate.ok) {
      Alert.alert("Approval needed", gate.message);
      return;
    }
    await saveNativeSession({ lastApprovedAction: action.label, approvedAt: new Date().toISOString() });
    Alert.alert(action.label, "Native signing gate approved. Connect this screen to the shared transaction engine for broadcast.");
  }

  return (
    <SafeAreaView style={styles.shell}>
      <StatusBar barStyle="light-content" />
      <View style={styles.app}>
        <View style={styles.header}>
          <Pressable style={styles.accountPill}>
            <View style={styles.identicon}>
              <Text style={styles.identiconText}>IX</Text>
            </View>
            <View>
              <Text style={styles.accountName}>Account 1</Text>
              <Text style={styles.accountAddress}>0x8f3a...91c2</Text>
            </View>
            <ChevronDown size={16} color="#c8d3cf" />
          </Pressable>
          <View style={styles.headerButtons}>
            <Pressable style={styles.iconButton}>
              <Bell size={20} color="#edf5f2" />
            </Pressable>
            <Pressable style={styles.iconButton}>
              <Settings size={20} color="#edf5f2" />
            </Pressable>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.chainScroller}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {liveChains.map((chain) => (
                <Pressable
                  key={chain}
                  onPress={() => setSelectedChain(chain)}
                  style={[styles.chainChip, selectedChain === chain && styles.chainChipActive]}
                >
                  <Globe2 size={15} color={selectedChain === chain ? "#07110d" : "#9fb5ae"} />
                  <Text style={[styles.chainChipText, selectedChain === chain && styles.chainChipTextActive]}>{chain}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <View style={styles.balancePanel}>
            <View style={styles.balanceTopline}>
              <Text style={styles.balanceLabel}>{selectedChain} Portfolio</Text>
              <View style={styles.statusPill}>
                <ShieldCheck size={14} color="#8ff0bf" />
                <Text style={styles.statusPillText}>{capabilitySummary.liveTransactionChains} live chains</Text>
              </View>
            </View>
            <Text style={styles.balance}>$0.00</Text>
            <Text style={styles.balanceSubtext}>{capabilitySummary.liveAssetPaths} of {capabilitySummary.bundledAssets} registry assets have a live path</Text>
            <View style={styles.actionRow}>
              {actions.map((action) => {
                const Icon = action.icon;
                return (
                  <Pressable key={action.label} style={styles.actionButton} onPress={() => handleProtectedAction(action)}>
                    <View style={styles.actionIcon}>
                      <Icon size={19} color="#ecf7f3" />
                    </View>
                    <Text style={styles.actionText}>{action.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {selectedTab === "wallet" && (
            <>
              <SectionTitle title="Assets" right={`${visibleAssets.length} shown`} />
              <View style={styles.assetList}>
                {visibleAssets.map((asset) => (
                  <AssetRow key={`${asset.symbol}-${asset.network}`} asset={asset} />
                ))}
              </View>
              <SecurityPanel />
            </>
          )}

          {selectedTab === "dex" && (
            <>
              <SectionTitle title="DEX Routing" right="IFX discount active" />
              <View style={styles.routeCard}>
                <View style={styles.routeLeg}>
                  <Text style={styles.routeLabel}>From</Text>
                  <Text style={styles.routeAsset}>SOL</Text>
                </View>
                <ArrowDownUp size={22} color="#87dcae" />
                <View style={styles.routeLeg}>
                  <Text style={styles.routeLabel}>To</Text>
                  <Text style={styles.routeAsset}>IFX</Text>
                </View>
              </View>
              <ServiceGrid />
            </>
          )}

          {selectedTab === "nfts" && (
            <>
              <SectionTitle title="NFTs" right="multi-chain" />
              <View style={styles.emptyPanel}>
                <Gem size={34} color="#87dcae" />
                <Text style={styles.emptyTitle}>NFT gallery ready</Text>
                <Text style={styles.emptyText}>Solana, EVM, and future native NFT adapters plug into this screen.</Text>
              </View>
            </>
          )}

          {selectedTab === "dapps" && (
            <>
              <SectionTitle title="DApps" right="verified" />
              <View style={styles.assetList}>
                {dapps.map((item) => (
                  <View key={item.name} style={styles.dappRow}>
                    <View style={styles.dappIcon}>
                      <Boxes size={19} color="#07110d" />
                    </View>
                    <View style={styles.rowMain}>
                      <Text style={styles.assetName}>{item.name}</Text>
                      <Text style={styles.assetMeta}>{item.network} · {item.type}</Text>
                    </View>
                    <Text style={styles.openText}>Open</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {selectedTab === "services" && (
            <>
              <SectionTitle title="Services" right="fee table" />
              <ServiceGrid />
              <SectionTitle title="Blocked Native Chains" right={`${blockedChains.length} left`} />
              <View style={styles.blockedList}>
                {blockedChains.map((chain) => (
                  <View key={chain.name} style={styles.blockedRow}>
                    <Text style={styles.blockedName}>{chain.name}</Text>
                    <Text style={styles.blockedReason}>{chain.reason}</Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </ScrollView>

        <View style={styles.bottomTabs}>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = tab.key === selectedTab;
            return (
              <Pressable key={tab.key} style={styles.tabButton} onPress={() => setSelectedTab(tab.key)}>
                <Icon size={21} color={active ? "#08100c" : "#9fb5ae"} />
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{tab.label}</Text>
                {active && <View style={styles.tabActiveBackground} />}
              </Pressable>
            );
          })}
        </View>
      </View>
    </SafeAreaView>
  );
}

function SectionTitle({ title, right }) {
  return (
    <View style={styles.sectionTitle}>
      <Text style={styles.sectionHeading}>{title}</Text>
      <Text style={styles.sectionRight}>{right}</Text>
    </View>
  );
}

function AssetRow({ asset }) {
  return (
    <View style={styles.assetRow}>
      <View style={styles.assetLogo}>
        <Text style={styles.assetLogoText}>{asset.symbol.slice(0, 2)}</Text>
      </View>
      <View style={styles.rowMain}>
        <Text style={styles.assetName}>{asset.name}</Text>
        <Text style={styles.assetMeta}>{asset.symbol} · {asset.network} · {asset.trend}</Text>
      </View>
      <Text style={styles.assetValue}>{asset.value}</Text>
    </View>
  );
}

function SecurityPanel() {
  return (
    <View style={styles.securityPanel}>
      <View style={styles.securityIcon}>
        <Fingerprint size={25} color="#07110d" />
      </View>
      <View style={styles.rowMain}>
        <Text style={styles.securityTitle}>Native Signing Gate</Text>
        <Text style={styles.securityText}>Biometric approval is wired through Expo Local Authentication.</Text>
      </View>
      <KeyRound size={22} color="#8ff0bf" />
    </View>
  );
}

function ServiceGrid() {
  return (
    <View style={styles.serviceGrid}>
      {services.map((service) => (
        <View key={service.name} style={styles.serviceCard}>
          <Text style={styles.serviceName}>{service.name}</Text>
          <Text style={styles.serviceFee}>{service.fee}</Text>
          <Text style={styles.serviceDiscount}>{service.discount}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: "#070b0d"
  },
  app: {
    flex: 1,
    backgroundColor: "#0a1012"
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  accountPill: {
    minHeight: 50,
    borderRadius: 25,
    paddingHorizontal: 8,
    paddingRight: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#121a1d",
    borderWidth: 1,
    borderColor: "#223134"
  },
  identicon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#8ff0bf"
  },
  identiconText: {
    fontWeight: "900",
    color: "#07110d"
  },
  accountName: {
    color: "#f1f7f4",
    fontSize: 14,
    fontWeight: "800"
  },
  accountAddress: {
    color: "#8ea19b",
    fontSize: 12
  },
  headerButtons: {
    flexDirection: "row",
    gap: 10
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#121a1d",
    borderWidth: 1,
    borderColor: "#223134"
  },
  content: {
    paddingHorizontal: 18,
    paddingBottom: 112
  },
  chainScroller: {
    marginVertical: 8
  },
  chainChip: {
    height: 36,
    borderRadius: 18,
    paddingHorizontal: 13,
    marginRight: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#121a1d",
    borderWidth: 1,
    borderColor: "#223134"
  },
  chainChipActive: {
    backgroundColor: "#8ff0bf",
    borderColor: "#8ff0bf"
  },
  chainChipText: {
    color: "#b8c8c2",
    fontSize: 13,
    fontWeight: "700"
  },
  chainChipTextActive: {
    color: "#07110d"
  },
  balancePanel: {
    padding: 18,
    borderRadius: 22,
    backgroundColor: "#10181b",
    borderWidth: 1,
    borderColor: "#243336"
  },
  balanceTopline: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10
  },
  balanceLabel: {
    color: "#a8b9b2",
    fontSize: 13,
    fontWeight: "700"
  },
  statusPill: {
    height: 28,
    borderRadius: 14,
    paddingHorizontal: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#14241c"
  },
  statusPillText: {
    color: "#8ff0bf",
    fontSize: 12,
    fontWeight: "800"
  },
  balance: {
    marginTop: 14,
    color: "#f6fbf9",
    fontSize: 44,
    fontWeight: "900"
  },
  balanceSubtext: {
    color: "#8ea19b",
    fontSize: 13,
    marginTop: 2
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 18
  },
  actionButton: {
    alignItems: "center",
    width: 58
  },
  actionIcon: {
    width: 45,
    height: 45,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#1c2a2e"
  },
  actionText: {
    color: "#d9e5e0",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 7
  },
  sectionTitle: {
    marginTop: 22,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  sectionHeading: {
    color: "#f4faf7",
    fontSize: 18,
    fontWeight: "900"
  },
  sectionRight: {
    color: "#8ea19b",
    fontSize: 12,
    fontWeight: "700"
  },
  assetList: {
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#223134"
  },
  assetRow: {
    minHeight: 68,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#11191c",
    borderBottomWidth: 1,
    borderBottomColor: "#1e2a2d"
  },
  assetLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#e2f5ed",
    alignItems: "center",
    justifyContent: "center"
  },
  assetLogoText: {
    color: "#08100c",
    fontWeight: "900",
    fontSize: 13
  },
  rowMain: {
    flex: 1,
    minWidth: 0
  },
  assetName: {
    color: "#f3faf7",
    fontWeight: "900",
    fontSize: 15
  },
  assetMeta: {
    color: "#8ea19b",
    fontSize: 12,
    marginTop: 3
  },
  assetValue: {
    color: "#e8f2ee",
    fontWeight: "900"
  },
  securityPanel: {
    marginTop: 16,
    borderRadius: 18,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#13211a",
    borderWidth: 1,
    borderColor: "#27533c"
  },
  securityIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#8ff0bf"
  },
  securityTitle: {
    color: "#edf7f2",
    fontWeight: "900",
    fontSize: 15
  },
  securityText: {
    color: "#a5c4b7",
    fontSize: 12,
    marginTop: 3
  },
  routeCard: {
    borderRadius: 20,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#10181b",
    borderWidth: 1,
    borderColor: "#243336"
  },
  routeLeg: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    backgroundColor: "#151f22"
  },
  routeLabel: {
    color: "#8ea19b",
    fontSize: 12,
    fontWeight: "800"
  },
  routeAsset: {
    color: "#f5fbf8",
    fontSize: 24,
    fontWeight: "900",
    marginTop: 4
  },
  serviceGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  serviceCard: {
    width: "48%",
    minHeight: 94,
    borderRadius: 18,
    padding: 14,
    backgroundColor: "#11191c",
    borderWidth: 1,
    borderColor: "#223134"
  },
  serviceName: {
    color: "#f4faf7",
    fontSize: 15,
    fontWeight: "900"
  },
  serviceFee: {
    color: "#8ff0bf",
    fontSize: 19,
    fontWeight: "900",
    marginTop: 10
  },
  serviceDiscount: {
    color: "#8ea19b",
    fontSize: 12,
    marginTop: 2
  },
  emptyPanel: {
    minHeight: 220,
    borderRadius: 20,
    padding: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#10181b",
    borderWidth: 1,
    borderColor: "#243336"
  },
  emptyTitle: {
    color: "#f5fbf8",
    fontSize: 18,
    fontWeight: "900",
    marginTop: 12
  },
  emptyText: {
    color: "#8ea19b",
    textAlign: "center",
    marginTop: 8
  },
  dappRow: {
    minHeight: 66,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#11191c",
    borderBottomWidth: 1,
    borderBottomColor: "#1e2a2d"
  },
  dappIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#8ff0bf"
  },
  openText: {
    color: "#8ff0bf",
    fontSize: 13,
    fontWeight: "900"
  },
  blockedList: {
    gap: 9
  },
  blockedRow: {
    borderRadius: 16,
    padding: 13,
    backgroundColor: "#181818",
    borderWidth: 1,
    borderColor: "#3c3021"
  },
  blockedName: {
    color: "#ffd69a",
    fontWeight: "900",
    fontSize: 14
  },
  blockedReason: {
    color: "#c9bda9",
    fontSize: 12,
    marginTop: 4,
    lineHeight: 17
  },
  bottomTabs: {
    position: "absolute",
    left: 14,
    right: 14,
    bottom: 14,
    height: 70,
    borderRadius: 28,
    paddingHorizontal: 7,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#11191c",
    borderWidth: 1,
    borderColor: "#243336"
  },
  tabButton: {
    height: 56,
    minWidth: 58,
    alignItems: "center",
    justifyContent: "center",
    gap: 4
  },
  tabText: {
    color: "#9fb5ae",
    fontSize: 11,
    fontWeight: "800"
  },
  tabTextActive: {
    color: "#08100c"
  },
  tabActiveBackground: {
    position: "absolute",
    zIndex: -1,
    width: 60,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#8ff0bf"
  }
});
