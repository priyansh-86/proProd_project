# DARKDESIRE - Advanced Manufacturing Production Management System

## Overview
DARKDESIRE is a professional-grade production management system designed for manufacturing facilities that produce detergent and cleaning products. It provides complete visibility into manufacturing operations, inventory management, batch tracking, and cost analysis.

---

## Core Features

### 1. **Dashboard & Analytics**
- **Production Analytics**: Real-time metrics on total production, average batch sizes, inventory value
- **Last Entry Details**: Track last batch produced, dispatch records, and production status
- **System Status**: Supabase database connection verification
- **Low Stock Alerts**: Automatic notifications when materials fall below reorder level
- **Dark/Light Theme**: Professional toggle for preferred viewing experience

### 2. **Raw Materials Management**
- **Complete Inventory Tracking**: Monitor current stock levels for all materials
- **Cost Per Unit**: Track pricing for accurate cost analysis and profitability reports
- **Reorder Level Management**: 
  - Set minimum stock thresholds to prevent stockouts
  - Automatic alerts when stock falls below reorder level
  - Calculation: (Daily Consumption × Lead Time) + Safety Stock (10-20%)
- **Supplier Information**: Maintain supplier details for each material
- **Material Units**: Support for multiple units (KGS, LTR, PCS, etc.)

### 3. **Product & Batch Management**
- **Product Catalog**: Create and manage product formulations
- **Batch Definition (BOM - Bill of Materials)**: 
  - Define raw materials required for each batch
  - Set quantities per batch size
  - Link raw materials with exact consumption rates
- **Batch Codes**: Unique identification for traceability
- **Batch History**: Complete tracking of all production runs

### 4. **Production Tracking**
- **Daily Production Records**: Log daily batch production
- **Quantity Tracking**: Monitor KGS produced per batch
- **Production Status**: Track ongoing vs completed batches
- **BOM Calculation**: Automatic consumption calculation based on batch quantities
  - Example: If Soda is 25kg per 200kg batch, producing 600kg = 3 batches = 75kg consumed

### 5. **Dispatch & Sales**
- **Dispatch Records**: Log outgoing shipments to customers
- **Customer Tracking**: Maintain customer information for each dispatch
- **Dispatch Dates**: Timestamp all dispatch activities
- **Quantity Tracking**: Monitor dispatched quantities

### 6. **Reports & Analytics**
- **Stock Journal Report**: 
  - Opening Stock, Consumed, Closing Stock for each material
  - Period-based analysis
  - Cost analysis
- **Batch History**: Complete production history with dates and quantities
- **Material Consumption**: Track material usage across batches

### 7. **Data Import Features**
- **Tally ERP 9 Integration**: 
  - Import Stock Journal exports from Tally ERP 9
  - Parse Date | Particulars | Vch Type | Inwards | Outwards columns
  - Automatic material creation with stock data
- **Batch Data Import**: 
  - Import manufacturing batches with complete BOM
  - 8 sample batches ready for import (B5, A4, MPL-2, ASS-3, HP-1, etc.)
  - Automatic linking of raw materials to batches

---

## Advanced Features Added

### **What is Reorder Level?**
When managing raw materials, the **Reorder Level** is the minimum stock quantity that triggers a purchase order. 

**How to Calculate:**
```
Reorder Level = (Daily Consumption × Lead Time) + Safety Stock
```

**Example - SALT:**
- Daily Consumption: 400 KG
- Supplier Lead Time: 7 days  
- Safety Buffer: 200 KG (5% buffer)
- Reorder Level = (400 × 7) + 200 = **3,000 KG**

When stock falls below 3,000 KG, DARKDESIRE will alert you to reorder.

### **Production Analytics Dashboard**
Real-time metrics displayed on the main dashboard:
- **Total Produced**: Cumulative production volume
- **Average Batch Size**: Mean production per batch
- **Inventory Value**: Total rupee value of current inventory
- **Low Stock Alerts**: Count of materials below reorder level

### **System Status Indicator**
Professional connection status showing:
- ✓ Supabase PostgreSQL Database Connected
- ✓ All 13 Environment Variables Configured
- ✓ Real-time Data Sync Enabled

---

## Batch Data Included

The system includes 8 pre-configured manufacturing batches with complete BOM:

1. **Vch 255**: TOTAL CARE PLUS FC LEMON 1 LTR (25 LTR) - Liquid cleaner
2. **Vch 256**: TOTAL CARE PLUS FC MOGRA 1 LTR (25 LTR) - Jasmine variant
3. **Vch 257**: B5 LOOSE DETERGENT (400 KGS) - Premium loose powder
4. **Vch 258**: B-5 5KGS (45 PCS) - Packaged detergent
5. **Vch 261**: A4 LOOSE DETERGENT POWDER (200 KGS) - Standard powder
6. **Vch 264**: MPL-2 (200 KGS) - Multi-purpose variant 2
7. **Vch 265**: HP-1 (200 KGS) - Heavy-duty premium
8. **Vch 263**: ASS-3 (200 KGS) - Advance soap substitute

Each batch includes:
- Complete raw material list with quantities
- Manufacturing date
- Product type and description
- BOM linking for automatic consumption tracking

---

## Raw Materials Database

Imported from Tally ERP 9 Stock Journal (April 23-29, 2026):

**Detergent Base Materials:**
- SALT: 5,000 KG @ ₹26/KG
- SODA: 900 KG @ ₹25/KG
- DOLOMITE: 1,000 KG @ ₹15/KG
- SS (SODIUM SULPHATE): 100 KG @ ₹35/KG

**Additives & Speckles:**
- BLUE SPECKLES, GREEN SPECKLES, ORANGE SPECKLES
- NILA SEV, DIPHENYL OXIDE (NLP)
- BARIK POWDER, LEMON SQUEEZY
- MULTI MOGRA (SENT), CAUSTIC

**Packaging Materials:**
- 1 LIT PHENYLE BOTTLE, PHENYLE BOTTLES
- BAG 25 KG PACKING, BAG TUKDA
- CAPS, STICKERS, BOXES
- PLASTIC POUCHES (7X12, 7X10)

**Liquids & Chemicals:**
- D.M. WATER, Filter Water
- Various liquid additives (2L, 5L, 13L, etc.)

---

## Professional Features

### **Dark Mode Support**
- Toggle between Light & Dark themes
- Persistent theme selection via localStorage
- Optimized colors for both modes
- Smooth transitions

### **Global CSS Enhancements**
- `user-select: none` applied globally for professional appearance
- Semantic typography with Geist Sans/Mono fonts
- Tailwind CSS v4 with custom design tokens
- Responsive grid layouts (mobile-first design)

### **Security & Performance**
- Row-level security (RLS) in Supabase
- Parameterized queries to prevent SQL injection
- Real-time data synchronization
- Optimized database indexing
- Client-side error handling

---

## Key Workflows

### **Workflow 1: Setting up Production**
1. Import raw materials from Tally or add manually
2. Set reorder levels (typically 10-20% of monthly consumption)
3. Import batch data or create new batches with BOM
4. Define products that use these batches
5. Start production and track in daily logs

### **Workflow 2: Monitoring Stock**
1. Check "Production Analytics" on dashboard for low stock alerts
2. View "Last Entry Details" for recent activity
3. Go to Raw Materials page to see all material levels
4. Materials with red status (below reorder level) trigger reorder

### **Workflow 3: Analyzing Costs**
1. Ensure all raw materials have cost_per_unit set
2. View "Inventory Value" in Production Analytics
3. Use Reports page to analyze consumption vs. cost
4. Calculate per-unit production costs from BOM

---

## Data Structure

### **Raw Materials Table**
```
name, unit, current_stock, reorder_level, 
supplier, cost_per_unit, updated_at
```

### **Products Table**
```
name, type, description, created_at
```

### **Batches Table**
```
batch_code, product_id, quantity_per_batch, 
unit, description, created_at
```

### **Batch BOM Table**
```
batch_id, raw_material_id, quantity_required
```

### **Daily Production Table**
```
batch_id, production_date, quantity_produced, notes
```

### **Dispatch Records Table**
```
product_id, dispatch_date, quantity_dispatched, 
customer_name, notes
```

---

## Getting Started

1. **Import Sample Data**: Click "Import Batch Data (8 Batches)" in Import section
2. **Set Reorder Levels**: Go to Raw Materials and set reorder levels (use calculator in the modal)
3. **Add Production Records**: Log daily batches in Production section
4. **Monitor Dashboard**: Check analytics and alerts daily
5. **Generate Reports**: Use Reports page for stock journal analysis

---

## Technology Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Database**: Supabase PostgreSQL
- **Styling**: Tailwind CSS v4, shadcn/ui
- **Data Exchange**: XLSX for Excel import
- **Icons**: Lucide React
- **Forms**: Client-side state management with React hooks

---

## What's Next?

Potential advanced features to add:
- **Predictive Analytics**: ML-based consumption forecasting
- **Multi-location Support**: Manage multiple manufacturing facilities
- **Quality Tracking**: Add defect rates and quality metrics
- **Waste Analysis**: Track and analyze material waste
- **Advanced Costing**: Overhead allocation and cost analysis
- **Batch Numbering**: Automatic batch number generation with QR codes
- **Mobile App**: Native iOS/Android apps for on-the-floor tracking
- **API Integration**: Connect with ERP systems via APIs

---

*Last Updated: May 2, 2026*
*System: DARKDESIRE v1.0*
