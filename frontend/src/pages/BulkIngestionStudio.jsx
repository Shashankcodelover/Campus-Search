import React, { useState } from "react";
import { 
  Database, UploadCloud, FileText, CheckCircle2, AlertTriangle, 
  Copy, Play, ArrowRight, Layers, Sparkles, Code 
} from "lucide-react";
import { api } from "../api";

const SAMPLE_DATA = {
  listings: {
    csv: `item_name,category,price,quantity,condition_notes,description,listing_type
ESP32 NodeMCU CP2102,Microcontrollers,280,4,New in packaging,WiFi & Bluetooth dual-core SoC,sale
MPU-6050 6-DoF Gyro,Sensors,140,5,Factory tested,I2C motion sensor breakout board,sale
L298N Dual H-Bridge Driver,Power & Wiring,130,2,Tested working,High-power motor controller module,sale
OLED 0.96 inch I2C 128x64,Displays,210,3,Like new,White monochrome display for Arduino,sale
SG90 Micro Servo 9g,Motors & Actuators,90,8,Used once,Mini servo for robotics pan-tilt,sale`,
    json: JSON.stringify([
      { item_name: "Raspberry Pi Pico W", category: "Microcontrollers", price: 450, quantity: 2, condition_notes: "Unopened", description: "RP2040 with onboard WiFi", listing_type: "sale" },
      { item_name: "VL53L0X Time-of-Flight Lidar", category: "Sensors", price: 320, quantity: 3, condition_notes: "Working", description: "Laser distance ranging sensor up to 2m", listing_type: "sale" },
      { item_name: "Breadboard 830-Point MB-102", category: "Passive Components", price: 80, quantity: 6, condition_notes: "Clean", description: "Full-size solderless prototyping board", listing_type: "sale" }
    ], null, 2)
  },
  topology: {
    csv: `source_component,target_device,interface_bus,voltage_domain,lab_station,current_draw_ma,status,notes
ESP32 DevKit V1,VL53L0X ToF Lidar,I2C (0x29),3.3V Logic,Optics Lab #03,20,active,Laser rangefinder bus
Raspberry Pi 4,MCP2515 CAN Module,SPI (Bus 0),3.3V Logic,Automotive Bench A1,45,active,CAN 2.0B vehicle interface
STM32F401 BlackPill,TFT ST7789 240x240,SPI (Bus 1),3.3V Logic,Embedded Bench B1,90,active,Real-time GUI display
Arduino Mega 2560,4-Channel Opto Relay,GPIO / PWM,5.0V Logic,Robotics Locker #14,280,active,High-voltage AC load switching`,
    json: JSON.stringify([
      { source_component: "Teensy 4.1", target_device: "Audio Shield SGTL5000", interface_bus: "I2S / SPI", voltage_domain: "3.3V Logic", lab_station: "DSP Lab Bench 4", current_draw_ma: 65, status: "active", notes: "16-bit audio synthesizer corridor" },
      { source_component: "ESP32-CAM", target_device: "OV2640 2MP Camera", interface_bus: "DVP 8-bit Bus", voltage_domain: "3.3V Logic", lab_station: "Vision Lab Locker #02", current_draw_ma: 180, status: "active", notes: "Edge computer vision corridor" }
    ], null, 2)
  },
  wishlists: {
    csv: `item_name,category,max_budget,notes
STM32 Nucleo Board,Microcontrollers,750,Needed for Embedded Systems final review
ADS1115 16-Bit ADC,Sensors,300,Looking for precision differential ADC
Logic Analyzer 8-Channel 24MHz,Tools,650,Urgent for I2C protocol debugging`,
    json: JSON.stringify([
      { item_name: "Oscilloscope Probe 100MHz", category: "Tools", max_budget: 450, notes: "BNC probe 1X/10X" },
      { item_name: "ESP32-S3 Dev Board", category: "Microcontrollers", max_budget: 600, notes: "For AI edge speech recognition" }
    ], null, 2)
  },
  inquiries: {
    csv: `item_query,category,needed_by_date,max_budget,notes
NRF24L01+ Wireless Transceiver Module,Sensors,Tomorrow 3 PM,250,Need 2 units for wireless sensor mesh
Step-Down Buck Converter LM2596,Power & Wiring,Thursday Morning,150,5V 3A regulator for rover project`,
    json: JSON.stringify([
      { item_query: "Soldering Iron with Fine Tip", category: "Tools", needed_by_date: "Friday 2 PM", max_budget: 350, notes: "SMD soldering kit needed" }
    ], null, 2)
  },
  users: {
    csv: `name,email,usn,department,year,role
Arjun Nambiar,arjun.n@college.edu,1SK24EC102,ECE,1st yr,student
Meera Iyer,meera.i@college.edu,1SK23CS078,CSE,2nd yr,student
Dr. Raghavendra Rao,raghavendra@college.edu,1SK00EC002,ECE,Faculty,moderator`,
    json: JSON.stringify([
      { name: "Varun Bhat", email: "varun.bhat@college.edu", usn: "1SK22MT033", department: "Mechatronics", year: "3rd yr", role: "student" },
      { name: "Kavya Murthy", email: "kavya.m@college.edu", usn: "1SK21EE051", department: "EEE", year: "4th yr", role: "student" }
    ], null, 2)
  }
};

export function BulkIngestionStudio() {
  const [activeEntity, setActiveEntity] = useState("listings");
  const [format, setFormat] = useState("csv");
  const [buffer, setBuffer] = useState(SAMPLE_DATA.listings.csv);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleEntityChange = (entity) => {
    setActiveEntity(entity);
    setBuffer(SAMPLE_DATA[entity][format] || "");
    setResult(null);
    setError(null);
  };

  const handleFormatChange = (fmt) => {
    setFormat(fmt);
    setBuffer(SAMPLE_DATA[activeEntity][fmt] || "");
    setResult(null);
    setError(null);
  };

  const handleExecute = async () => {
    if (!buffer.trim()) {
      setError("Buffer is empty. Load a template or enter CSV / JSON data.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      let payload;
      if (format === "json") {
        try {
          payload = JSON.parse(buffer);
        } catch (e) {
          throw new Error("Invalid JSON format: " + e.message);
        }
      } else {
        payload = buffer; // send as raw CSV text
      }

      let res;
      if (activeEntity === "listings") {
        res = await api.uploadListings(payload);
      } else if (activeEntity === "topology") {
        res = await api.uploadComponentRelations(payload);
      } else if (activeEntity === "wishlists") {
        res = await api.uploadWishlists(payload);
      } else if (activeEntity === "inquiries") {
        res = await api.uploadInquiries(payload);
      } else if (activeEntity === "users") {
        res = await api.uploadUsers(payload);
      }

      setResult(res);
    } catch (err) {
      setError(err.message || "Batch ingestion failed.");
    } finally {
      setLoading(false);
    }
  };

  const lineCount = buffer.split(/\r?\n/).filter(l => l.trim().length > 0).length;

  return (
    <div className="bulk-ingestion-studio" style={{ padding: "24px 0", maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "4px 12px", borderRadius: 20, background: "rgba(59, 130, 246, 0.1)", border: "1px solid rgba(59, 130, 246, 0.3)", color: "#3b82f6", fontSize: 12, fontWeight: 600, marginBottom: 8 }}>
          <Database size={12} />
          <span>Enterprise Uploadation & ETL Engine</span>
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
          <UploadCloud className="text-primary" size={26} />
          Enterprise Bulk Ingestion Studio
        </h1>
        <p style={{ margin: "6px 0 0", color: "var(--text-secondary)", fontSize: 14 }}>
          Atomic schema-validated ingestion for component listings, hardware topology mesh corridors, requisitions, and student rosters.
        </p>
      </div>

      {/* Entity Selector Pills */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {[
          { id: "listings", label: "📦 Component Inventory", count: "Listings" },
          { id: "topology", label: "🕸️ Topology Corridors", count: "Mesh" },
          { id: "wishlists", label: "🎯 Wanted Requisitions", count: "Wishlists" },
          { id: "inquiries", label: "📡 Broadcast Inquiries", count: "Radar" },
          { id: "users", label: "🎓 Campus Roster", count: "Students" },
        ].map(ent => (
          <button
            key={ent.id}
            onClick={() => handleEntityChange(ent.id)}
            style={{
              padding: "8px 16px",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 600,
              border: "1px solid",
              borderColor: activeEntity === ent.id ? "var(--primary, #3b82f6)" : "var(--border, #334155)",
              background: activeEntity === ent.id ? "rgba(59, 130, 246, 0.15)" : "var(--surface, #1e293b)",
              color: activeEntity === ent.id ? "#3b82f6" : "var(--text-secondary)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            <span>{ent.label}</span>
          </button>
        ))}
      </div>

      {/* Editor & Controls Card */}
      <div className="card" style={{ background: "var(--surface, #1e293b)", border: "1px solid var(--border, #334155)", borderRadius: 14, padding: 20, marginBottom: 24 }}>
        {/* Editor Toolbar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>
              Data Syntax Buffer:
            </span>
            <div style={{ display: "inline-flex", background: "rgba(0,0,0,0.3)", borderRadius: 8, padding: 3, border: "1px solid var(--border, #334155)" }}>
              <button
                onClick={() => handleFormatChange("csv")}
                style={{
                  padding: "4px 12px",
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 600,
                  background: format === "csv" ? "var(--primary, #3b82f6)" : "transparent",
                  color: format === "csv" ? "#fff" : "var(--text-secondary)",
                  border: "none",
                  cursor: "pointer"
                }}
              >
                CSV (RFC 4180)
              </button>
              <button
                onClick={() => handleFormatChange("json")}
                style={{
                  padding: "4px 12px",
                  borderRadius: 6,
                  fontSize: 11,
                  fontWeight: 600,
                  background: format === "json" ? "var(--primary, #3b82f6)" : "transparent",
                  color: format === "json" ? "#fff" : "var(--text-secondary)",
                  border: "none",
                  cursor: "pointer"
                }}
              >
                JSON Array
              </button>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
              Detected: <strong style={{ color: "var(--text-primary)" }}>{lineCount} {format === "csv" ? "lines" : "records"}</strong>
            </span>

            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setBuffer(SAMPLE_DATA[activeEntity][format])}
              style={{ fontSize: 11, padding: "4px 10px", display: "flex", alignItems: "center", gap: 4 }}
            >
              <FileText size={12} />
              <span>Reset Template</span>
            </button>
          </div>
        </div>

        {/* Code Textarea */}
        <textarea
          value={buffer}
          onChange={(e) => setBuffer(e.target.value)}
          placeholder={format === "csv" ? "header1,header2,..." : "[{ ... }]"}
          style={{
            width: "100%",
            height: 280,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
            fontSize: 12.5,
            lineHeight: "1.5",
            padding: "14px 16px",
            background: "rgba(0,0,0,0.4)",
            color: "#e2e8f0",
            border: "1px solid var(--border, #334155)",
            borderRadius: 8,
            resize: "vertical",
            outline: "none"
          }}
        />

        {/* Action Button */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, flexWrap: "wrap", gap: 12 }}>
          <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
            ⚡ Atomic execution — validated with foreign key integrity & instant live catalog sync.
          </div>

          <button
            className="btn btn-primary"
            onClick={handleExecute}
            disabled={loading}
            style={{
              padding: "10px 24px",
              fontWeight: 600,
              fontSize: 14,
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "var(--primary, #3b82f6)"
            }}
          >
            <Play size={15} fill="currentColor" />
            <span>{loading ? "Ingesting Payload..." : "Execute Batch Ingestion"}</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div style={{
          padding: "14px 18px",
          borderRadius: 10,
          marginBottom: 20,
          background: "rgba(239, 68, 68, 0.15)",
          border: "1px solid #ef4444",
          color: "#ef4444",
          fontSize: 13,
          display: "flex",
          alignItems: "center",
          gap: 10
        }}>
          <AlertTriangle size={18} />
          <div>
            <strong>Ingestion Error:</strong> {error}
          </div>
        </div>
      )}

      {/* Success Result Dossier */}
      {result && (
        <div className="card" style={{
          background: "rgba(16, 185, 129, 0.08)",
          border: "1px solid rgba(16, 185, 129, 0.3)",
          borderRadius: 14,
          padding: 20
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#10b981", marginBottom: 12 }}>
            <CheckCircle2 size={20} />
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
              Batch Ingestion Completed Successfully
            </h3>
          </div>

          <p style={{ margin: "0 0 16px 0", fontSize: 13, color: "var(--text-primary)" }}>
            {result.message || `Successfully inserted ${result.count} records.`}
          </p>

          {result.records && result.records.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8 }}>
                Ingested Entity Manifest ({result.records.length} items):
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {result.records.map((r, i) => (
                  <span
                    key={i}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 6,
                      background: "rgba(0,0,0,0.3)",
                      border: "1px solid rgba(16, 185, 129, 0.2)",
                      fontSize: 12,
                      color: "var(--text-primary)"
                    }}
                  >
                    <strong>{r.item_name || r.source || r.name || r.item_query || r.id}</strong>
                    {r.category && <span style={{ color: "var(--text-secondary)", marginLeft: 6 }}>({r.category})</span>}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
