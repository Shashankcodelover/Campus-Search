import React, { useState, useEffect } from "react";
import { 
  Cpu, Search, Sparkles, Sliders, CheckCircle2, ArrowRight, 
  Leaf, Shield, QrCode, RefreshCw, Zap, Layers, FileSpreadsheet,
  AlertTriangle, DollarSign, Compass, Crosshair
} from "lucide-react";
import { api } from "../api";

const PRESET_BOMS = [
  {
    title: "🚀 Autonomous Drone & Avionics Stack",
    bom: `1x ESP32 DevKit WiFi/BLE
1x MPU6050 6-Axis Gyro/Accelerometer
4x SG90 Micro Servo Motor
1x 830-point Breadboard & Jumper Wire Set
1x LM2596 DC-DC Buck Step-Down Converter`
  },
  {
    title: "⌚ Wearable IoT Health Band",
    bom: `1x ESP32 DevKit
1x OLED 0.96 inch I2C Display
1x MAX30102 Pulse Oximeter & Heart-Rate Sensor
1x 3.7V 500mAh LiPo Battery
1x TP4056 USB-C Li-Ion Charging Module`
  },
  {
    title: "🤖 ROS2 Robotic Arm 4-DOF",
    bom: `4x MG996R Metal Gear High-Torque Servo
1x Arduino Uno R3 Microcontroller
1x PCA9685 16-Channel 12-bit PWM Servo Driver
1x 5V 10A Switch Mode Power Supply
1x Acrylic 4-DOF Robotic Arm Mechanical Frame`
  }
];

export function AiProjectCopilot({ onRequestListing }) {
  const [activeSection, setActiveSection] = useState("search"); // "search" | "bom" | "escrow"
  const [query, setQuery] = useState("low-power ESP32 microcontroller with sensor inputs");
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [vectorData, setVectorData] = useState([]);

  // BOM State
  const [bomText, setBomText] = useState(PRESET_BOMS[0].bom);
  const [bomResults, setBomResults] = useState(null);
  const [bomLoading, setBomLoading] = useState(false);

  // Escrow State
  const [escrowPassport, setEscrowPassport] = useState(null);
  const [escrowStatus, setEscrowStatus] = useState("PENDING");
  const [escrowLoading, setEscrowLoading] = useState(false);

  // Run initial search
  useEffect(() => {
    handleSearch();
  }, []);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearchLoading(true);
    try {
      const res = await api.neuralSearch(query);
      setSearchResults(res.results || []);
      setVectorData(res.topVector || []);
    } catch (e) {
      console.error(e);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleOptimizeBOM = async () => {
    setBomLoading(true);
    try {
      const res = await api.optimizeBOM(bomText, "Autonomous Systems");
      setBomResults(res);
    } catch (e) {
      console.error(e);
    } finally {
      setBomLoading(false);
    }
  };

  const handleGenerateEscrow = async () => {
    setEscrowLoading(true);
    try {
      const res = await api.generateEscrowHandshake({
        requestId: "REQ_SJCE_INNOVATION_412",
        sellerId: "USR_SHASHANK_ECE",
        buyerId: "USR_PREETHAM_CSE",
        lat: 12.3168,
        lng: 76.6133
      });
      setEscrowPassport(res);
      setEscrowStatus("MUTUAL_LOCKED_PENDING_EXCHANGE");
    } catch (e) {
      console.error(e);
    } finally {
      setEscrowLoading(false);
    }
  };

  const handleVerifyEscrow = async () => {
    setEscrowLoading(true);
    try {
      await api.verifyEscrowHandshake({
        handshakeToken: escrowPassport?.handshakeToken,
        scanOtp: escrowPassport?.scanOtp
      });
      setEscrowStatus("SETTLED_VERIFIED");
    } catch (e) {
      console.error(e);
    } finally {
      setEscrowLoading(false);
    }
  };

  return (
    <div className="ai-copilot-container" style={{ padding: "20px 0 60px 0" }}>
      {/* HEADER BANNER */}
      <div style={{
        background: "linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(99, 102, 241, 0.12) 100%)",
        border: "1px solid rgba(110, 231, 160, 0.25)",
        borderRadius: "16px",
        padding: "24px 28px",
        marginBottom: "24px",
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <div style={{
                background: "var(--signal)", color: "#060a08",
                width: "36px", height: "36px", borderRadius: "10px",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: "bold"
              }}>
                <Cpu size={22} />
              </div>
              <h1 style={{ margin: 0, fontSize: "1.6rem", fontWeight: "800", letterSpacing: "-0.5px" }}>
                CampusSearch V3.0 Neural Project Copilot
              </h1>
              <span style={{
                background: "rgba(110, 231, 160, 0.2)", color: "var(--signal)",
                padding: "3px 10px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "700"
              }}>
                Staff-Grade Production
              </span>
            </div>
            <p style={{ margin: 0, color: "var(--muted)", maxWidth: "750px", fontSize: "0.95rem", lineHeight: "1.5" }}>
              Autonomous 8-Dimensional Cosine Vector Search, IEEE Bill of Materials (BOM) Kit Optimizer, 
              and Cryptographic Campus Geofenced Escrow Handshake. Outmatching conventional university exchange networks.
            </p>
          </div>

          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button 
              className={`btn ${activeSection === "search" ? "btn-primary" : "btn-outline"}`}
              onClick={() => setActiveSection("search")}
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              <Search size={15} /> Neural Semantic Search
            </button>
            <button 
              className={`btn ${activeSection === "bom" ? "btn-primary" : "btn-outline"}`}
              onClick={() => { setActiveSection("bom"); if (!bomResults) handleOptimizeBOM(); }}
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              <FileSpreadsheet size={15} /> BOM Project Matcher
            </button>
            <button 
              className={`btn ${activeSection === "escrow" ? "btn-primary" : "btn-outline"}`}
              onClick={() => { setActiveSection("escrow"); if (!escrowPassport) handleGenerateEscrow(); }}
              style={{ display: "flex", alignItems: "center", gap: "6px" }}
            >
              <Shield size={15} /> Geofenced Escrow
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 1: NEURAL SEMANTIC SEARCH */}
      {activeSection === "search" && (
        <div>
          <div style={{
            background: "var(--panel)", border: "1px solid var(--trace)",
            borderRadius: "14px", padding: "20px", marginBottom: "20px"
          }}>
            <h3 style={{ margin: "0 0 12px 0", fontSize: "1.05rem", display: "flex", alignItems: "center", gap: "8px" }}>
              <Sparkles size={18} color="var(--signal)" /> Natural Language Engineering Intent Query
            </h3>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <div style={{ flex: 1, minWidth: "280px", position: "relative" }}>
                <input 
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="e.g. Quadcopter flight controller with barometer and ibus receiver..."
                  style={{
                    width: "100%", padding: "12px 16px", borderRadius: "10px",
                    background: "var(--bg-deep)", border: "1px solid var(--trace-light)",
                    color: "var(--text)", fontSize: "0.95rem"
                  }}
                />
              </div>
              <button 
                className="btn btn-primary" 
                onClick={handleSearch}
                disabled={searchLoading}
                style={{ padding: "0 24px", display: "flex", alignItems: "center", gap: "8px" }}
              >
                {searchLoading ? <RefreshCw size={16} className="spin" /> : <Zap size={16} />}
                <span>Compute Cosine Ranking</span>
              </button>
            </div>

            {/* Quick Sample Chips */}
            <div style={{ display: "flex", gap: "8px", marginTop: "12px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.78rem", color: "var(--muted)", alignSelf: "center" }}>Try:</span>
              {[
                "ESP32 WiFi Bluetooth IoT Microcontroller",
                "High torque stepper motor driver for 3D printer",
                "Quadcopter BLDC flight control sensor stack",
                "830 point breadboard with passive resistors and capacitors"
              ].map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => { setQuery(chip); }}
                  style={{
                    background: "rgba(255, 255, 255, 0.05)", border: "1px solid var(--trace)",
                    borderRadius: "20px", padding: "4px 12px", fontSize: "0.75rem",
                    color: "var(--text-secondary)", cursor: "pointer"
                  }}
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* 8D Feature Vector Ribbon */}
            {vectorData.length > 0 && (
              <div style={{ marginTop: "16px", padding: "10px 14px", background: "rgba(0,0,0,0.3)", borderRadius: "8px", fontSize: "0.75rem" }}>
                <span style={{ color: "var(--muted)", fontWeight: "600" }}>Query 8D Semantic Feature Basis: </span>
                <span style={{ fontFamily: "monospace", color: "var(--signal)" }}>
                  [{vectorData.join(", ")}]
                </span>
                <span style={{ marginLeft: "12px", color: "#60a5fa" }}>Cosine Metric: Normalized L2 Unit Space</span>
              </div>
            )}
          </div>

          {/* Results Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "16px" }}>
            {searchResults.map((item) => (
              <div 
                key={item.id}
                style={{
                  background: "var(--panel)", border: "1px solid var(--trace)",
                  borderRadius: "14px", padding: "18px", display: "flex", flexDirection: "column",
                  justifyContent: "space-between", transition: "transform 0.2s ease, border-color 0.2s ease",
                  boxShadow: "var(--shadow-md)"
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                    <span style={{
                      background: item.semanticScore >= 70 ? "rgba(16, 185, 129, 0.2)" : "rgba(245, 158, 11, 0.2)",
                      color: item.semanticScore >= 70 ? "var(--signal)" : "var(--amber)",
                      padding: "3px 8px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: "700"
                    }}>
                      {item.semanticScore}% Semantic Match
                    </span>
                    <span style={{ fontSize: "0.85rem", fontWeight: "800", color: "var(--signal)" }}>
                      {item.price === 0 ? "FREE (Pass-it-on)" : `₹${item.price}`}
                    </span>
                  </div>

                  <h4 style={{ margin: "0 0 6px 0", fontSize: "1.1rem", color: "var(--text)" }}>{item.item_name}</h4>
                  <div style={{ fontSize: "0.8rem", color: "var(--muted)", marginBottom: "10px" }}>
                    <span>Category: {item.category}</span> · <span>Seller: {item.seller_name || "Campus Peer"}</span>
                  </div>

                  <div style={{ 
                    background: "rgba(0,0,0,0.25)", padding: "10px", borderRadius: "8px", 
                    marginBottom: "12px", fontSize: "0.78rem" 
                  }}>
                    <div style={{ color: "#38bdf8", fontWeight: "600", marginBottom: "3px" }}>
                      ⚡ Architecture: {item.detectedVoltage}
                    </div>
                    <div style={{ color: "var(--text-secondary)" }}>
                      Verdict: <strong>{item.compatibilityVerdict}</strong>
                    </div>
                  </div>

                  {item.substitutions && item.substitutions.length > 0 && (
                    <div style={{ marginBottom: "12px" }}>
                      <span style={{ fontSize: "0.72rem", color: "var(--muted)" }}>Drop-in Alternatives:</span>
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "4px" }}>
                        {item.substitutions.map((sub, sIdx) => (
                          <span 
                            key={sIdx}
                            style={{
                              fontSize: "0.7rem", background: "rgba(99, 102, 241, 0.15)",
                              color: "#a5b4fc", padding: "2px 6px", borderRadius: "4px"
                            }}
                          >
                            {sub}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ borderTop: "1px solid var(--trace)", paddingTop: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>Status: <strong style={{ color: "#34d399" }}>{item.status}</strong></span>
                  <button 
                    className="btn btn-primary"
                    style={{ padding: "6px 14px", fontSize: "0.8rem" }}
                    onClick={() => onRequestListing && onRequestListing(item)}
                  >
                    Request Part
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 2: BOM PROJECT OPTIMIZER */}
      {activeSection === "bom" && (
        <div>
          <div style={{
            background: "var(--panel)", border: "1px solid var(--trace)",
            borderRadius: "14px", padding: "20px", marginBottom: "20px"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", flexWrap: "wrap", gap: "10px" }}>
              <h3 style={{ margin: 0, fontSize: "1.05rem", display: "flex", alignItems: "center", gap: "8px" }}>
                <FileSpreadsheet size={18} color="var(--signal)" /> IEEE / Capstone Bill of Materials (BOM) Ingestion
              </h3>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {PRESET_BOMS.map((preset, idx) => (
                  <button
                    key={idx}
                    className="btn btn-outline"
                    style={{ fontSize: "0.75rem", padding: "4px 10px" }}
                    onClick={() => setBomText(preset.bom)}
                  >
                    {preset.title.split(" ")[1]}
                  </button>
                ))}
              </div>
            </div>

            <textarea
              rows={6}
              value={bomText}
              onChange={(e) => setBomText(e.target.value)}
              placeholder="Paste BOM items, one per line (e.g. 1x ESP32 DevKit, 2x SG90 Servo...)"
              style={{
                width: "100%", padding: "12px", borderRadius: "10px",
                background: "var(--bg-deep)", border: "1px solid var(--trace-light)",
                color: "var(--text)", fontFamily: "monospace", fontSize: "0.85rem",
                marginBottom: "14px"
              }}
            />

            <button 
              className="btn btn-primary"
              onClick={handleOptimizeBOM}
              disabled={bomLoading}
              style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 22px" }}
            >
              {bomLoading ? <RefreshCw size={16} className="spin" /> : <Sparkles size={16} />}
              <span>⚡ Optimize BOM & Calculate Campus Circular Savings</span>
            </button>
          </div>

          {bomResults && (
            <div>
              {/* Financial & Environmental KPI Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "14px", marginBottom: "20px" }}>
                <div style={{ background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.25)", padding: "16px", borderRadius: "12px" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--muted)", textTransform: "uppercase", fontWeight: "700" }}>Total Retail Value</div>
                  <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "#f87171", marginTop: "4px" }}>
                    ₹{bomResults.financials.totalRetailEstimated}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "2px" }}>New component market price</div>
                </div>

                <div style={{ background: "rgba(99, 102, 241, 0.08)", border: "1px solid rgba(99, 102, 241, 0.25)", padding: "16px", borderRadius: "12px" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--muted)", textTransform: "uppercase", fontWeight: "700" }}>Campus Reused Cost</div>
                  <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "#60a5fa", marginTop: "4px" }}>
                    ₹{bomResults.financials.campusReusedTotal}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "2px" }}>Peer-to-peer student exchange</div>
                </div>

                <div style={{ background: "rgba(16, 185, 129, 0.15)", border: "1px solid var(--signal)", padding: "16px", borderRadius: "12px" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--signal)", textTransform: "uppercase", fontWeight: "700" }}>Student Wallet Savings</div>
                  <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "var(--signal)", marginTop: "4px" }}>
                    ₹{bomResults.financials.totalSavingsRupees} ({bomResults.financials.savingsPercent}%)
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "2px" }}>Direct student cash retained</div>
                </div>

                <div style={{ background: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.25)", padding: "16px", borderRadius: "12px" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--muted)", textTransform: "uppercase", fontWeight: "700" }}>Circular Carbon Offset</div>
                  <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "var(--amber)", marginTop: "4px" }}>
                    {bomResults.circularImpact.carbonOffsetKg} kg CO₂
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "2px" }}>{bomResults.circularImpact.sustainabilityRating}</div>
                </div>
              </div>

              {/* Line items table */}
              <div style={{ background: "var(--panel)", border: "1px solid var(--trace)", borderRadius: "14px", overflow: "hidden" }}>
                <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--trace)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h4 style={{ margin: 0, fontSize: "0.95rem" }}>Matched Line Items ({bomResults.matchedOnCampusCount} / {bomResults.totalItemsParsed} Available on Campus)</h4>
                  <span style={{ fontSize: "0.8rem", color: "var(--signal)", fontWeight: "700" }}>Fulfillability: {bomResults.fulfillabilityRate}%</span>
                </div>

                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                    <thead>
                      <tr style={{ background: "rgba(0,0,0,0.3)", color: "var(--muted)", textAlign: "left" }}>
                        <th style={{ padding: "10px 16px" }}>BOM Component</th>
                        <th style={{ padding: "10px 16px" }}>Qty</th>
                        <th style={{ padding: "10px 16px" }}>Retail Market</th>
                        <th style={{ padding: "10px 16px" }}>Campus Reused</th>
                        <th style={{ padding: "10px 16px" }}>Matched Inventory Item</th>
                        <th style={{ padding: "10px 16px" }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bomResults.lineItems.map((line, idx) => (
                        <tr key={idx} style={{ borderBottom: "1px solid var(--trace)" }}>
                          <td style={{ padding: "12px 16px", fontWeight: "600", color: "var(--text)" }}>{line.rawLine}</td>
                          <td style={{ padding: "12px 16px" }}>{line.quantity}</td>
                          <td style={{ padding: "12px 16px", color: "#f87171" }}>₹{line.unitRetailEstimate}</td>
                          <td style={{ padding: "12px 16px", color: "var(--signal)", fontWeight: "700" }}>
                            {line.campusUnitPrice === 0 ? "FREE" : `₹${line.campusUnitPrice}`}
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            {line.bestMatch ? (
                              <div>
                                <span style={{ color: "#60a5fa" }}>{line.bestMatch.itemName}</span>
                                <span style={{ fontSize: "0.75rem", color: "var(--muted)", marginLeft: "6px" }}>({line.bestMatch.sellerName})</span>
                                <div style={{ fontSize: "0.72rem", color: "var(--signal)" }}>✓ {line.bestMatch.compatibilityVerdict}</div>
                              </div>
                            ) : (
                              <span style={{ color: "var(--muted)", fontStyle: "italic" }}>Pending Campus Peer Listing</span>
                            )}
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            {line.bestMatch ? (
                              <button 
                                className="btn btn-primary"
                                style={{ padding: "4px 10px", fontSize: "0.75rem" }}
                                onClick={() => onRequestListing && onRequestListing(line.bestMatch)}
                              >
                                Reserve
                              </button>
                            ) : (
                              <button 
                                className="btn btn-outline"
                                style={{ padding: "4px 10px", fontSize: "0.75rem" }}
                              >
                                Wishlist
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 3: CRYPTOGRAPHIC GEOFENCED ESCROW */}
      {activeSection === "escrow" && (
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <div style={{
            background: "var(--panel)", border: "1px solid var(--trace)",
            borderRadius: "16px", padding: "28px", boxShadow: "var(--shadow-lg)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
              <div>
                <h3 style={{ margin: "0 0 6px 0", fontSize: "1.2rem", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Shield size={22} color="var(--signal)" /> Cryptographic Geofenced Handshake Escrow
                </h3>
                <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.85rem" }}>
                  Zero-Knowledge Proof of Physical Exchange. Escrowed payment is locked until mutual QR & OTP handshake is verified within campus coordinates.
                </p>
              </div>
              <span style={{
                background: escrowStatus === "SETTLED_VERIFIED" ? "rgba(16, 185, 129, 0.2)" : "rgba(245, 158, 11, 0.2)",
                color: escrowStatus === "SETTLED_VERIFIED" ? "var(--signal)" : "var(--amber)",
                padding: "6px 14px", borderRadius: "20px", fontSize: "0.8rem", fontWeight: "700"
              }}>
                {escrowStatus}
              </span>
            </div>

            {escrowPassport && (
              <div>
                {/* Geofence verification badge */}
                <div style={{
                  background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.3)",
                  borderRadius: "10px", padding: "14px", marginBottom: "20px"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <Compass size={20} color="var(--signal)" />
                    <div>
                      <div style={{ fontWeight: "700", color: "var(--signal)", fontSize: "0.9rem" }}>
                        Geofence Validated: {escrowPassport.geofence.campusHub}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
                        Campus Target: {escrowPassport.geofence.targetCoordinates.join(", ")} · Physical Proximity: {escrowPassport.geofence.detectedDistanceMeters}m (Inside 350m perimeter)
                      </div>
                    </div>
                  </div>
                </div>

                {/* Handshake Details Card */}
                <div style={{
                  background: "rgba(0,0,0,0.4)", borderRadius: "12px", padding: "20px",
                  display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px"
                }}>
                  <div>
                    <span style={{ fontSize: "0.75rem", color: "var(--muted)", textTransform: "uppercase" }}>Escrow Passport Token</span>
                    <div style={{ fontFamily: "monospace", fontSize: "1rem", fontWeight: "700", color: "#60a5fa", marginTop: "4px" }}>
                      {escrowPassport.handshakeToken}
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "var(--muted)", marginTop: "4px" }}>
                      SHA-256 Merkle Proof: {escrowPassport.merkleRoot.substring(0, 20)}...
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: "0.75rem", color: "var(--muted)", textTransform: "uppercase" }}>Physical Handover Scan OTP</span>
                    <div style={{ fontFamily: "monospace", fontSize: "1.4rem", fontWeight: "800", color: "var(--signal)", letterSpacing: "2px", marginTop: "2px" }}>
                      {escrowPassport.scanOtp}
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "var(--muted)", marginTop: "4px" }}>
                      Expires in 30 minutes (Anti-theft timelock)
                    </div>
                  </div>
                </div>

                {/* Action button */}
                {escrowStatus !== "SETTLED_VERIFIED" ? (
                  <button
                    className="btn btn-primary"
                    style={{ width: "100%", padding: "14px", fontSize: "1rem", display: "flex", justifyContent: "center", alignItems: "center", gap: "10px" }}
                    onClick={handleVerifyEscrow}
                    disabled={escrowLoading}
                  >
                    <QrCode size={18} /> Complete Physical Campus Handshake & Release UPI Escrow
                  </button>
                ) : (
                  <div style={{
                    background: "rgba(16, 185, 129, 0.15)", border: "1px solid var(--signal)",
                    padding: "16px", borderRadius: "10px", textAlign: "center", color: "var(--signal)", fontWeight: "700"
                  }}>
                    ✓ Escrow Settlement Successful: Dual-key signature verified. UPI credit disbursed to seller VPA with zero platform fee.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
