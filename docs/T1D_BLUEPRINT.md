# T1D workbench specification

The literature extraction is [T1D_LITERATURE_DATA.md](../T1D_LITERATURE_DATA.md). It is supporting research, not a complete validated simulation parameter set. This blueprint is the canonical engineering specification. The workbench is for research and education, not medical advice or control of medical devices.

## Models and provenance

The immune survival equation in `hypoimmuneIsletModel.ts` is a phenomenological hypothesis, not a published or independently calibrated kinetic model. Its parameters and bounds require an explicit calibration dataset. Empirical CD47 counts per cell cannot be substituted for surface density per unit area without an independently specified conversion.

The Buchwald oxygen calculation uses oxygen concentration in mol/m³, time in seconds and distance in metres. Its oxygen consumption is Michaelis–Menten multiplied by the smoothed critical-oxygen step. Buchwald's critical concentration shuts down consumption; it does not specify a cell death rate per day. The one-dimensional slab and viability loss rule are modeling assumptions, not the paper's finite-element geometry or a published cell death model.

The single-meal gastrointestinal equations use stomach and gut mass in mg, rates in min⁻¹, and plasma appearance in mg/kg/min. Meal ingestion must be represented as an instantaneous mass jump or a properly integrated rate, and an explicit meal dose and body weight are required. The single-meal equations do not implement the 2014 multi-meal memory scheme. The coupled model adapts 2007 normal-subject parameters to a T1D scenario and is not the complete UVA/Padova simulator. Graft secretion is an adaptation and does not model C-peptide.

## Validation

Dalla Man et al. 2014 Table 1 reports adult, adolescent and child fasting glucose cohort summaries; its illustrated meal challenge is 50 g. The paper specifies a 40–80 mg/dL over-basal peak as a criterion for choosing each optimal bolus; this is not a reported peak distribution. Visentin et al. 2018 reports adult postprandial peak statistics for a different 60 g protocol. A 60 g benchmark cannot be relabeled as 50 g, and population peak distributions cannot be validated by asserting that one synthetic individual falls within a chosen interval.

Registry entries identify sources, locations and units. Null bounds indicate that a physiological range was not established. Phenomenological parameters are distinguished from literature values. Model changes require `node --test`; Node's type stripping is not a TypeScript type check. The 10-minute sensor delay is cited to Dalla Man et al. 2007 GIM Table 1 (DOI 10.1177/193229680700100303).

## Validation limits

The 119.34 mg/dL excursion is a deterministic regression value from this implementation, not an independent published cohort benchmark. The chosen immune and hypoxia loss rates and basal insulin are assumptions. Independent type checking and external scientific validation remain outstanding.

## User-provided Pass 1 specification

* # Canonical T1D Mathematical Specification (Pass 1 Final)

## 1. Coupled 8-State Meal-Insulin-Glucose ODE System (Minutes Time Base)
State vector: `[Q_sto1, Q_sto2, Q_gut, I_sc1, I_sc2, I_p, X, G]` (integrated via RK4 at `dt = 0.1 min`).

### 1.1 Three-Compartment Meal Absorption (Dalla Man et al. 2007 Eq. 13; 2014 Appendix Eq. A3)
- `dQ_sto1/dt = -k_gri * Q_sto1 + M(t)` (where `M(t) = D / 15` mg/min over a 15-min meal ingestion window, `0` otherwise)
- `dQ_sto2/dt = -k_empt(Q_sto) * Q_sto2 + k_gri * Q_sto1`
- `dQ_gut/dt = -k_abs * Q_gut + k_empt(Q_sto) * Q_sto2`
- `Q_sto = Q_sto1 + Q_sto2`
- `k_empt(Q_sto) = k_min + ((k_max - k_min) / 2) * (tanh(alpha * (Q_sto - b * D_bar)) - tanh(beta * (Q_sto - c_thresh * D_bar)) + 2)`
  - `D_bar = 30000` mg, `alpha = 5 / (2 * D_bar * (1 - b))`, `beta = 5 / (2 * D_bar * c_thresh)`
- `Ra_meal(t) = (f * k_abs * Q_gut) / BW` (mg/kg/min, with adult cohort mean `BW = 75.2 kg`, Visentin et al. 2018 Table 1)
- **Verified Registry Constants (Dalla Man et al. 2007 Table I, DOI: 10.1109/TBME.2007.893506 & Dalla Man et al. 2014 Appendix Eq. A3, DOI: 10.1177/1932296813514502):**
  - `k_max = 0.0558 min^-1` `[0.030, 0.090]`
  - `k_min = 0.0080 min^-1` `[0.002, 0.020]`
  - `k_abs = 0.0570 min^-1` `[0.020, 0.120]`
  - `k_gri = 0.0558 min^-1` `[0.030, 0.090]`
  - `f = 0.90` (dimensionless) `[0.70, 1.00]`
  - `b = 0.69` (dimensionless, 2014 T1DMS) `[0.50, 0.90]`
  - `c_thresh = 0.17` (dimensionless, 2014 T1DMS) `[0.05, 0.35]`

### 1.2 Complete 13-State Glucose-Insulin-Sensor ODEs (Dalla Man et al. 2007 Eqs. 1–18 & Table I, DOI: 10.1109/TBME.2007.893506; Dalla Man et al. 2014 Appendix Eq. A1–A6, DOI: 10.1177/1932296813514502)
- **13-State Vector:** `[Q_sto1, Q_sto2, Q_gut, G_p, G_t, G_s, I_sc1, I_sc2, I_p, I_l, I_delay1, X_L, X]` (plus graft states `[I_po, Y_sec, f_viable]` when cell-replacement coupling is active).
- **Glucose & Subcutaneous Sensor Subsystem (mg/kg and mg/dL):**
  - `dG_p/dt = EGP(t) + Ra_meal(t) - U_ii(t) - E(t) - k_1 * G_p + k_2 * G_t`
  - `dG_t/dt = -U_id(t) + k_1 * G_p - k_2 * G_t`
  - `dG_s/dt = (G_p - G_s) / T_d` (13th state: subcutaneous interstitial glucose compartment, `T_d = 10.0 min`, Dalla Man et al. 2014 Appendix Eq. A2; `G_s(0) = G_pb`)
  - `G(t) = G_p(t) / V_G` (`mg/dL` plasma glucose); `G_sensor(t) = G_s(t) / V_G` (`mg/dL` interstitial CGM glucose)
  - `EGP(t) = max(0, k_p1 - k_p2 * G_p(t) - k_p3 * X_L(t))` (`mg/kg/min`)
  - `U_ii(t) = F_cns` (`1.0 mg/kg/min`)
  - `U_id(t) = ((V_m0 + V_mx * X(t)) * G_t(t)) / (K_m0 + G_t(t))` (`mg/kg/min`)
  - `E(t) = max(0, k_e1 * (G_p(t) - k_e2))` (`mg/kg/min`)
- **Insulin, Action & Graft Secretion Subsystem (pmol/kg and pmol/L):**
  - `dI_sc1/dt = -(k_d + k_a1) * I_sc1 + u_pmol(t)` (`u_pmol(t)` in `pmol/kg/min`; `1 U = 6000 pmol`, divided by `BW`)
  - `dI_sc2/dt = k_d * I_sc1 - k_a2 * I_sc2`
  - `Ra_I(t) = k_a1 * I_sc1 + k_a2 * I_sc2` (`pmol/kg/min`)
  - `dI_p/dt = -(m_2 + m_4) * I_p + m_1 * I_l + Ra_I(t) + f_viable * graft_fraction * S_graft(t)`
  - `dI_l/dt = m_2 * I_p - (m_1 + m_3_eq) * I_l`, where `m_3_eq = (HE_b * m_1) / (1 - HE_b)`
  - `I(t) = I_p(t) / V_I` (`pmol/L`)
  - `dI_delay1/dt = -k_i * (I_delay1 - I(t))`
  - `dX_L/dt = -k_i * (X_L - I_delay1)` (`pmol/L`)
  - `dX/dt = -p_2U * X + p_2U * (I(t) - I_b)` (`pmol/L`)
- **Additional Registry Constant for 13th State:**
  - `T_d = 10.0 min` (`minBound: null, maxBound: null`, Dalla Man et al. 2014 Appendix Eq. A2, DOI: 10.1177/1932296813514502).

## 3. Graft Insulin Secretion Adaptation (`ADAPTED_FROM_DALLA_MAN_2007_EQS_7_9`)
- **Provenance Classification:** `ADAPTED_FROM_DALLA_MAN_2007_EQS_7_9` (Dalla Man et al. 2007 Eqs. 7–9 & Table I, adapted for exogenous T1D islet grafts by setting native basal secretion `S_b = 0` and adding viability scaling `f_viable(t) * graft_fraction` to `dI_p/dt`; note that C-peptide kinetics are not modeled in v1).
- **Equations:**
  - `dI_po/dt = -gamma_sec * I_po + S_po`, `S_graft(t) = gamma_sec * I_po` (`pmol/kg/min`)
  - `S_po = Y_sec + (dG/dt > 0 ? K_sec * dG/dt : 0)`
  - `dY_sec/dt = -alpha_sec * (Y_sec - max(0, beta_sec * (G - G_b)))`
  - Constants (Dalla Man et al. 2007 Table I): `gamma_sec = 0.50 min^-1`, `K_sec = 2.30 pmol/kg/(mg/dL)`, `alpha_sec = 0.050 min^-1`, `beta_sec = 0.110 pmol/kg/min/(mg/dL)`.

## 4. Reference Trajectory & Cohort Validation Benchmark
- **Parameterization Provenance Note:** Because individual virtual-patient covariance matrices from Visentin et al. (2018, PMCID: PMC5851236) are proprietary (NOT REPORTED IN SOURCE as scalar tables), the deterministic reference profile pairs **Dalla Man et al. (2007) Table I scalar constants** with **Visentin et al. (2018) Table 1 adult cohort mean inputs** (`BW = 75.2 kg`, `G_b = 119.1 mg/dL`, `60 g` CHO breakfast at `t = 60 min`, `CR = 16.9 g/U` -> `3.55 U` bolus at `t = 60 min`, `graft_fraction = 0.0`).
- **Acceptance Assertions (Deterministic Reference Trajectory & Physiological Integrity):**
  1. **24-hour fasting equilibrium (`0 g` meal, `0 U` bolus):** `G(t)` and `G_sensor(t)` remain within `119.1 ± 1.0 mg/dL`.
  2. **Meal carbohydrate mass conservation:** Cumulative intestinal glucose appearance `integral(Ra_meal(t) dt) * BW` equals `f * 60,000 mg = 54,000 mg` within `0.5%` over 24 hours.
  3. **Postprandial kinetics & safety bounds (`60 g` breakfast + `3.55 U` bolus):**
     - Peak plasma glucose occurs between `45` and `120 min` post-meal (`t = 105..180 min`).
     - Deterministic reference over-basal plasma glucose peak matches the verified trajectory (`119.34 ± 1.0 mg/dL` over basal, i.e., `238.44 ± 1.0 mg/dL` total), and interstitial sensor peak `G_sensor` lags plasma peak due to `T_d = 10.0 min`.
     - Post-meal nadir remains safely above the hypoglycemic clamp threshold (`G(t) > 60.0 mg/dL`) and recovers toward `G_b`.
  4. **Coupled graft & oxygen verification (`graft_fraction = 1.0`):** Normoxic encapsulated HIP grafts (`CD47 >= 220,000`, `pO2 > 7 mmHg`) maintain `f_viable = 1.0` and attenuate the post-meal glucose excursion via `S_graft(t)` compared to `graft_fraction = 0.0`, whereas hypoxic or `CD47 < 180,000` grafts lose viability and insulin secretion.

