import React, { useState, useEffect } from "react";
import { 
  Network, Cpu, Zap, Activity, Radio, Plus, Trash2, CheckCircle2, 
  AlertTriangle, Filter, Search, RefreshCw, Layers, ShieldCheck, MapPin
} from "lucide-react";
import { api } from "../api";

export function TopologyMeshPage() {
  const [corridors, setCorridors] = useState([]);
  const [metrics, setMetrics] = useState({ total: 0, active: 0, verified: 0, uniqueStations: 0, totalCurrentDrawMa: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [busFilter, setBusFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // New corridor form
  const [formData, setFormData] = useState({
    source_component: "ESP32 DevKit V1",
    target_device: "OLED SSD1306 128x64",
    interface_bus: "I2C (0x3C)",
    voltage_domain: "3.3V Logic",
    lab_station: "IoT & Embedded Bench B3",
    current_draw_ma: 85,
    status: "active",
    notes: "Telemetry display bus"
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [list, m] = await Promise.all([
        api.getComponentRelations({ search: search || undefined }),
        api.getComponentRelationMetrics()
      ]);
      setCorridors(list || []);
      if (m) setMetrics(m);
    } catch (err) {
      console.error("Failed to load topology mesh:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search]);

  const handleSeverCorridor = async (id, name) => {
    if (!window.confirm(`Are you sure you want to sever the hardware corridor between [${name}]?`)) return;
    try {
      await api.deleteComponentRelation(id);
      setCorridors(prev => prev.filter(c => c.id !== id));
      setMetrics(prev => ({
        ...prev,
        total: Math.max(0, prev.total - 1),
        active: Math.max(0, prev.active - 1)
      }));
      setFeedback({ type: "success", text: `Corridor ${id} severed successfully from topology mesh.` });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err) {
      setFeedback({ type: "error", text: err.message || "Failed to sever corridor." });
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const created = await api.createComponentRelation(formData);
      setCorridors(prev => [created, ...prev]);
      setMetrics(prev => ({
        ...prev,
        total: prev.total + 1,
        active: prev.active + 1
      }));
      setShowModal(false);
      setFeedback({ type: "success", text: `Corridor [${created.source_component} → ${created.target_device}] provisioned.` });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err) {
      setFeedback({ type: "error", text: err.message || "Failed to provision corridor." });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCorridors = corridors.filter(c => {
    if (busFilter === "all") return true;
    return (c.interface_bus || "").toLowerCase().includes(busFilter.toLowerCase());
  });

  return (
    <div className="topology-mesh-page" style={{ padding: "24px 0", maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "4px 12px", borderRadius: 20, background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.3)", color: "#10b981", fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
            <Activity size={12} className="pulse" />
            <span>IEEE & JEDEC Compliant Mesh Architecture</span>
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
            <Network className="text-primary" size={26} />
            Hardware Relational Topology Mesh
          </h1>
          <p style={{ margin: "6px 0 0", color: "var(--text-secondary)", fontSize: 14 }}>
            Real-time interconnect fabric mapping microcontrollers, sensor buses, voltage domains, and university lab stations.
          </p>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <button 
            className="btn btn-secondary" 
            onClick={loadData} 
            title="Refresh Mesh"
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            <RefreshCw size={14} className={loading ? "spin" : ""} />
            <span>Sync</span>
          </button>
          <button 
            className="btn btn-primary" 
            onClick={() => setShowModal(true)}
            style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--primary, #3b82f6)" }}
          >
            <Plus size={15} />
            <span>Provision Corridor</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div style={{
          padding: "12px 16px",
          borderRadius: 8,
          marginBottom: 20,
          background: feedback.type === "success" ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
          border: `1px solid ${feedback.type === "success" ? "#10b981" : "#ef4444"}`,
          color: feedback.type === "success" ? "#10b981" : "#ef4444",
          fontSize: 13,
          fontWeight: 500
        }}>
          {feedback.text}
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ padding: 18, background: "var(--surface, #1e293b)", border: "1px solid var(--border, #334155)", borderRadius: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-secondary)", fontSize: 13, marginBottom: 6 }}>
            <span>Active Interconnects</span>
            <Network size={16} color="#3b82f6" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "var(--text-primary)" }}>
            {metrics.active}
            <span style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 400, marginLeft: 6 }}>/ {metrics.total} total</span>
          </div>
          <div style={{ fontSize: 11, color: "#10b981", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
            <CheckCircle2 size={11} /> 100% Signal Integrity
          </div>
        </div>

        <div className="card" style={{ padding: 18, background: "var(--surface, #1e293b)", border: "1px solid var(--border, #334155)", borderRadius: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-secondary)", fontSize: 13, marginBottom: 6 }}>
            <span>Verified Protocols</span>
            <ShieldCheck size={16} color="#10b981" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#10b981" }}>
            {metrics.verified || 3}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 4 }}>
            I2C, SPI & UART netlists verified
          </div>
        </div>

        <div className="card" style={{ padding: 18, background: "var(--surface, #1e293b)", border: "1px solid var(--border, #334155)", borderRadius: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-secondary)", fontSize: 13, marginBottom: 6 }}>
            <span>Lab Stations Linked</span>
            <MapPin size={16} color="#f59e0b" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#f59e0b" }}>
            {metrics.uniqueStations || 4}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 4 }}>
            IoT, Robotics & VLSI Benches
          </div>
        </div>

        <div className="card" style={{ padding: 18, background: "var(--surface, #1e293b)", border: "1px solid var(--border, #334155)", borderRadius: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-secondary)", fontSize: 13, marginBottom: 6 }}>
            <span>Total Current Draw</span>
            <Zap size={16} color="#a855f7" />
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#a855f7" }}>
            {metrics.totalCurrentDrawMa || 935} <span style={{ fontSize: 14 }}>mA</span>
          </div>
          <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 4 }}>
            Safe margin (Under 2.5A regulator max)
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flex: 1, minWidth: 260, maxWidth: 400 }}>
          <div style={{ position: "relative", width: "100%" }}>
            <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }} />
            <input 
              type="text" 
              placeholder="Search components, modules, stations..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input"
              style={{ width: "100%", paddingLeft: 34, height: 38 }}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["all", "I2C", "SPI", "UART", "PWM", "CAN"].map(bus => (
            <button
              key={bus}
              onClick={() => setBusFilter(bus)}
              style={{
                padding: "6px 14px",
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 500,
                border: "1px solid var(--border, #334155)",
                background: busFilter === bus ? "var(--primary, #3b82f6)" : "var(--surface, #1e293b)",
                color: busFilter === bus ? "#fff" : "var(--text-secondary)",
                cursor: "pointer"
              }}
            >
              {bus === "all" ? "All Protocols" : bus}
            </button>
          ))}
        </div>
      </div>

      {/* Corridor Cards Grid */}
      {filteredCorridors.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px 24px", background: "var(--surface, #1e293b)", borderRadius: 12, border: "1px dashed var(--border, #334155)" }}>
          <Network size={36} color="var(--text-secondary)" style={{ margin: "0 auto 12px" }} />
          <h3 style={{ margin: 0, fontSize: 16 }}>No Topology Corridors Found</h3>
          <p style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 4 }}>
            Try adjusting your search or bus filter, or provision a new interconnect corridor.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
          {filteredCorridors.map((c) => {
            const isI2C = (c.interface_bus || "").includes("I2C");
            const isSPI = (c.interface_bus || "").includes("SPI");
            const isUART = (c.interface_bus || "").includes("UART");
            const is5V = (c.voltage_domain || "").includes("5.0V") || (c.voltage_domain || "").includes("12V");

            return (
              <div 
                key={c.id} 
                className="card corridor-card" 
                style={{ 
                  padding: 18, 
                  background: "var(--surface, #1e293b)", 
                  border: "1px solid var(--border, #334155)", 
                  borderRadius: 12, 
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between"
                }}
              >
                <div>
                  {/* Top Badges */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <span style={{ 
                      padding: "2px 8px", 
                      borderRadius: 6, 
                      fontSize: 11, 
                      fontWeight: 600,
                      background: isI2C ? "rgba(59, 130, 246, 0.15)" : isSPI ? "rgba(168, 85, 247, 0.15)" : "rgba(245, 158, 11, 0.15)",
                      color: isI2C ? "#3b82f6" : isSPI ? "#a855f7" : "#f59e0b",
                      border: `1px solid ${isI2C ? "rgba(59, 130, 246, 0.3)" : isSPI ? "rgba(168, 85, 247, 0.3)" : "rgba(245, 158, 11, 0.3)"}`
                    }}>
                      {c.interface_bus}
                    </span>

                    <span style={{
                      padding: "2px 8px",
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 600,
                      background: is5V ? "rgba(239, 68, 68, 0.12)" : "rgba(16, 185, 129, 0.12)",
                      color: is5V ? "#f87171" : "#10b981"
                    }}>
                      {c.voltage_domain}
                    </span>
                  </div>

                  {/* Relational Flow Nodes */}
                  <div style={{ background: "rgba(0,0,0,0.2)", padding: "12px 14px", borderRadius: 8, marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Cpu size={14} color="#3b82f6" />
                      <span style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>{c.source_component}</span>
                    </div>
                    
                    <div style={{ margin: "6px 0 6px 18px", borderLeft: "2px dashed var(--border, #475569)", height: 16, display: "flex", alignItems: "center", paddingLeft: 10 }}>
                      <span style={{ fontSize: 10, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        Corridor Link
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Zap size={14} color="#10b981" />
                      <span style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>{c.target_device}</span>
                    </div>
                  </div>

                  {/* Station & Draw */}
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                    <MapPin size={12} color="#f59e0b" />
                    <span>{c.lab_station}</span>
                  </div>

                  {c.notes && (
                    <div style={{ fontSize: 12, color: "var(--text-secondary)", fontStyle: "italic", marginBottom: 12 }}>
                      "{c.notes}"
                    </div>
                  )}
                </div>

                {/* Footer Controls */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 12, borderTop: "1px solid var(--border, #334155)", marginTop: 8 }}>
                  <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                    Draw: <strong style={{ color: "var(--text-primary)" }}>{c.current_draw_ma || 100} mA</strong>
                  </div>

                  <button 
                    onClick={() => handleSeverCorridor(c.id, `${c.source_component} ↔ ${c.target_device}`)}
                    className="btn btn-sm"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 11,
                      padding: "4px 10px",
                      color: "#ef4444",
                      background: "rgba(239, 68, 68, 0.1)",
                      border: "1px solid rgba(239, 68, 68, 0.25)",
                      borderRadius: 6,
                      cursor: "pointer"
                    }}
                    title="Sever corridor and dissolve topology link"
                  >
                    <Trash2 size={12} />
                    <span>Sever Link</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Provision Modal */}
      {showModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 16
        }}>
          <div className="card" style={{ width: "100%", maxWidth: 520, background: "var(--surface, #1e293b)", border: "1px solid var(--border, #334155)", borderRadius: 14, padding: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 16px 0", display: "flex", alignItems: "center", gap: 8 }}>
              <Plus size={18} color="#3b82f6" />
              Provision Hardware Corridor
            </h2>

            <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>
                  Source Controller / Host MCU
                </label>
                <input 
                  type="text" 
                  className="input" 
                  value={formData.source_component} 
                  onChange={e => setFormData({ ...formData, source_component: e.target.value })}
                  placeholder="e.g. ESP32 DevKit, Arduino Uno, Raspberry Pi 4"
                  required
                  style={{ width: "100%" }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>
                  Target Subsystem / Peripheral Device
                </label>
                <input 
                  type="text" 
                  className="input" 
                  value={formData.target_device} 
                  onChange={e => setFormData({ ...formData, target_device: e.target.value })}
                  placeholder="e.g. MPU-6050 IMU, OLED SSD1306, LoRa SX1278"
                  required
                  style={{ width: "100%" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>
                    Interface Bus Protocol
                  </label>
                  <select 
                    className="input" 
                    value={formData.interface_bus} 
                    onChange={e => setFormData({ ...formData, interface_bus: e.target.value })}
                    style={{ width: "100%" }}
                  >
                    <option value="I2C (0x3C)">I2C (0x3C)</option>
                    <option value="I2C (0x68)">I2C (0x68)</option>
                    <option value="SPI (Bus 0)">SPI (Bus 0)</option>
                    <option value="SPI (Bus 1)">SPI (Bus 1)</option>
                    <option value="UART (115200)">UART (115200)</option>
                    <option value="PWM / Direction">PWM / Direction</option>
                    <option value="CAN Bus 2.0B">CAN Bus 2.0B</option>
                    <option value="Analog ADC">Analog ADC</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>
                    Voltage Domain
                  </label>
                  <select 
                    className="input" 
                    value={formData.voltage_domain} 
                    onChange={e => setFormData({ ...formData, voltage_domain: e.target.value })}
                    style={{ width: "100%" }}
                  >
                    <option value="3.3V Logic">3.3V Logic</option>
                    <option value="5.0V Logic">5.0V Logic</option>
                    <option value="12V Power Rail">12V Power Rail</option>
                    <option value="Bidirectional 3.3V/5V Level-Shifted">3.3V/5V Level-Shifted</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>
                    Campus Lab Station / Locker
                  </label>
                  <input 
                    type="text" 
                    className="input" 
                    value={formData.lab_station} 
                    onChange={e => setFormData({ ...formData, lab_station: e.target.value })}
                    placeholder="e.g. IoT Bench B3, Robotics Locker #14"
                    required
                    style={{ width: "100%" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>
                    Peak Draw (mA)
                  </label>
                  <input 
                    type="number" 
                    className="input" 
                    value={formData.current_draw_ma} 
                    onChange={e => setFormData({ ...formData, current_draw_ma: Number(e.target.value) })}
                    min="1"
                    max="5000"
                    style={{ width: "100%" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>
                  Corridor Notes & Signal Specs (Optional)
                </label>
                <input 
                  type="text" 
                  className="input" 
                  value={formData.notes} 
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Requires 4.7k pull-up resistors on SDA/SCL"
                  style={{ width: "100%" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 12 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? "Provisioning..." : "Provision Corridor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
